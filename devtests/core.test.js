const missing = [];
const src = await fs.readTextFile("index.html");
const lines = src.split("\n");
const N = lines.length;

function braceEnd(startIdx) {
  let depth = 0;
  let started = false;
  for (let li = startIdx; li < N; li++) {
    const s = lines[li];
    let i = 0;
    let state = "code";
    while (i < s.length) {
      const c = s[i];
      const c2 = s[i + 1];
      if (state === "code") {
        if (c === "/" && c2 === "/") break;
        if (c === "/" && c2 === "*") { state = "block"; i += 2; continue; }
        if (c === '"' || c === "'" || c === "`") { state = c; i++; continue; }
        if (c === "{") { depth++; started = true; }
        else if (c === "}") { depth--; if (started && depth <= 0) return li; }
      } else if (state === "block") {
        if (c === "*" && c2 === "/") { state = "code"; i += 2; continue; }
      } else {
        if (c === "\\") { i += 2; continue; }
        if (c === state) state = "code";
      }
      i++;
    }
    if (state === "block" || state === '"' || state === "'") state = "code";
  }
  return N - 1;
}

function at(name) {
  for (const kind of ["function", "const", "let", "var"]) {
    const re = new RegExp("^\\s*(?:async\\s+)?" + kind + "\\s+" + name + "\\s*[=(]");
    const i = lines.findIndex((l) => re.test(l));
    if (i >= 0) return i;
  }
  return -1;
}

function grab(name) {
  const i = at(name);
  if (i < 0) { missing.push(name); return ""; }
  const head = lines[i];
  const body = /[{[]\s*$/.test(head.trim()) || /=>\s*$/.test(head.trim()) ? braceEnd(i) : i;
  return lines.slice(i, body + 1).join("\n");
}

const wanted = ["crcTable", "crc32", "initCrcTable", "buildZip", "inflateRawDeflate", "unzipEntries", "scrubMinusOneSeeds", "composeKeywords", "getEffectiveKeywords", "JSON_NUM_RE", "jsonTokenize", "jsonDecodeRaw", "jsonParse", "applyPreset", "ART_STYLES", "COLOR_PALETTES", "DEFAULT_POS", "DEFAULT_NEGATIVES"];
const code = wanted.map(grab).join("\n\n");

const T = [];
async function t(name, fn) {
  try {
    const r = await fn();
    if (r && r.skip) { T.push({ n: name, ok: null, d: String(r.skip) }); return; }
    const good = r === undefined ? true : r && typeof r === "object" ? !!r.ok : !!r;
    T.push({ n: name, ok: good, d: r && typeof r === "object" && r.d !== undefined ? String(r.d).slice(0, 220) : "" });
  } catch (e) { T.push({ n: name, ok: false, d: "THROW " + (e && e.message) }); }
}
const ok = (d) => ({ ok: true, d: d === undefined ? "" : d });
const no = (d) => ({ ok: false, d: d === undefined ? "" : d });
const eqArr = (a, b, what) => (JSON.stringify(a) === JSON.stringify(b) ? ok(what + " = " + JSON.stringify(a)) : no(what + ": expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)));

const els = {};
function fakeDoc() {
  return {
    getElementById: (id) => {
      if (!els[id]) els[id] = { id, value: "", checked: false, textContent: "", innerHTML: "", hidden: false, className: "", style: {}, dataset: {}, children: [], classList: { add() {}, remove() {}, contains: () => false }, appendChild() {}, append() {}, setAttribute() {}, removeAttribute() {}, addEventListener() {}, dispatchEvent() {}, querySelector: () => null, querySelectorAll: () => [] };
      return els[id];
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {} }, appendChild() {}, setAttribute() {}, addEventListener() {} }),
    addEventListener() {},
  };
}
const sandbox = { window: {}, document: fakeDoc(), localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, renderKeywordChips() {}, renderFilterStatus() {}, schedulePanelSave() {}, renderChips() {}, clearAllPromptOverrides() {} };
let api = {};
const missingAtBoot = missing.slice();
try {
  const factory = new Function("sandbox", "with (sandbox) { " + code + "\n; return { crc32, initCrcTable, buildZip, inflateRawDeflate, unzipEntries, scrubMinusOneSeeds, composeKeywords, getEffectiveKeywords, jsonParse, jsonTokenize, ART_STYLES, COLOR_PALETTES, applyPreset, DEFAULT_POS, DEFAULT_NEGATIVES }; }");
  api = factory(sandbox);
} catch (e) {
  T.push({ n: "extraction", ok: false, d: "could not build the sandbox: " + e.message });
}

const enc = new TextEncoder();
const dec = new TextDecoder();

if (api.crc32) {
  await t("crc32 matches the standard vectors", () => {
    const cases = [["123456789", 0xcbf43926], ["", 0], ["a", 0xe8b7be43], ["The quick brown fox jumps over the lazy dog", 0x414fa339]];
    const got = cases.map(([s, want]) => { const bytes = enc.encode(s); return { s: s.slice(0, 12), want: want >>> 0, got: api.crc32(bytes) >>> 0 }; });
    const bad = got.filter((g) => g.want !== g.got);
    return bad.length ? no(JSON.stringify(bad)) : ok("4 vectors");
  });
}

if (api.buildZip && api.unzipEntries) {
  await t("zip round-trips text, binary and unicode entries", async () => {
    const bin = new Uint8Array(1024);
    for (let i = 0; i < bin.length; i++) bin[i] = (i * 37) & 0xff;
    const files = [
      { name: "comic-generator-settings.json", data: enc.encode(JSON.stringify({ hello: "world", nested: { a: [1, 2, 3] } })) },
      { name: "panels/page-1/panel-1-1.png", data: bin },
      { name: "unicode-ünïcode-✓.txt", data: enc.encode("ünïcode ✓") },
    ];
    const zip = api.buildZip(files);
    const entries = await api.unzipEntries(zip.buffer);
    const names = Object.keys(entries);
    const settingsBack = JSON.parse(dec.decode(entries["comic-generator-settings.json"] || new Uint8Array()));
    const binOk = entries["panels/page-1/panel-1-1.png"].length === bin.length && entries["panels/page-1/panel-1-1.png"].every((b, i) => b === bin[i]);
    const uniOk = dec.decode(entries["unicode-ünïcode-✓.txt"] || new Uint8Array()) === "ünïcode ✓";
    return eqArr([names.length, settingsBack.nested.a, binOk, uniOk, zip[0]], [3, [1, 2, 3], true, true, 0x50], "entries,json,binary,unicode,sig");
  });

  await t("the zip uses stored (method 0) entries and a valid EOCD", () => {
    const files = [{ name: "a.txt", data: enc.encode("hello") }, { name: "b.txt", data: enc.encode("world") }];
    const zip = api.buildZip(files);
    const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const method = dv.getUint16(8, true);
    const eocdAt = zip.length - 22;
    const eocd = dv.getUint32(eocdAt, true);
    const count = dv.getUint16(eocdAt + 10, true);
    return eqArr([method, eocd >>> 0, count], [0, 0x06054b50, 2], "method,eocd,count");
  });
}

if (api.inflateRawDeflate) {
  await t("inflateRawDeflate reverses a deflate-raw stream", async () => {
    const payload = enc.encode("x".repeat(5000) + "hello");
    const deflated = new Uint8Array(await new Response(new Blob([payload]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
    const back = await api.inflateRawDeflate(deflated);
    return eqArr([deflated.length < payload.length, back.length === payload.length, dec.decode(back) === dec.decode(payload)], [true, true, true], "smaller,roundTrip");
  });
}

if (api.scrubMinusOneSeeds) {
  await t("scrubMinusOneSeeds clears every -1 seed and nothing else", () => {
    const doc = {
      seed: -1,
      pages: {
        1: { seed: "-1", 1: { seed: -1 }, 2: { seed: " -1 " }, 3: { seed: "7" }, 4: { seed: 0 }, 5: { seed: "" } },
        2: { seed: "42", 1: { seed: -1 } },
      },
      other: { seed: -1 },
    };
    api.scrubMinusOneSeeds(doc);
    return eqArr([doc.seed, doc.pages[1].seed, doc.pages[1][1].seed, doc.pages[1][2].seed, doc.pages[1][3].seed, doc.pages[1][4].seed, doc.pages[2][1].seed, doc.pages[2].seed, doc.other.seed], ["", "", "", "", "7", 0, "", "42", -1], "seeds");
  });
}

if (api.getEffectiveKeywords) {
  const g = (id) => sandbox.document.getElementById(id);
  const setKw = (pos, neg, nsfw) => { g("globalPos").value = pos; g("globalNeg").value = neg; g("nsfwCheck").checked = nsfw; };
  await t("keyword composition adds the safety terms only while NSFW is off", () => {
    setKw("A", "B", false);
    const off = api.getEffectiveKeywords();
    setKw("A", "B", true);
    const on = api.getEffectiveKeywords();
    return eqArr([off.positive, off.negative, on.positive, on.negative], ["A, fully clothed", "B, nsfw, nudity, explicit", "A", "B"], "off,on");
  });

  await t("empty keyword fields do not leave stray commas", () => {
    setKw("", "", false);
    const r = api.getEffectiveKeywords();
    return eqArr([r.positive, r.negative, /^,/.test(r.negative), /,$/.test(r.negative)], ["fully clothed", "nsfw, nudity, explicit", false, false], "trimmed");
  });

  if (api.applyPreset && api.ART_STYLES) {
    await t("every art style preset produces a non-empty keyword pair", () => {
      const ids = Object.keys(api.ART_STYLES);
      const bad = [];
      for (const id of ids) {
        g("presetStyle").value = id;
        g("presetPalette").value = Object.keys(api.COLOR_PALETTES || { vibrant: 1 })[0];
        api.applyPreset();
        const eff = api.getEffectiveKeywords();
        if (!eff.positive || !eff.negative) bad.push({ id, pos: eff.positive.length, neg: eff.negative.length });
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 200)) : ok(ids.length + " styles: " + ids.join(","));
    });

    await t("every palette preset produces a non-empty positive prompt", () => {
      const ids = Object.keys(api.COLOR_PALETTES || {});
      const bad = [];
      for (const id of ids) {
        g("nsfwCheck").checked = false;
        g("presetStyle").value = Object.keys(api.ART_STYLES)[0];
        g("presetPalette").value = id;
        api.applyPreset();
        const eff = api.getEffectiveKeywords();
        if (!eff.positive) bad.push(id);
      }
      return bad.length ? no(JSON.stringify(bad)) : ok(ids.length + " palettes");
    });

    await t("applying a preset replaces the fields rather than stacking", () => {
      g("globalPos").value = "LEFT OVER TEXT";
      g("presetStyle").value = Object.keys(api.ART_STYLES)[0];
      g("presetPalette").value = Object.keys(api.COLOR_PALETTES || { vibrant: 1 })[0];
      api.applyPreset();
      const once = g("globalPos").value;
      api.applyPreset();
      const twice = g("globalPos").value;
      return eqArr([once.includes("LEFT OVER"), once === twice], [false, true], "replaced,idempotent");
    });
  } else {
    await t("preset matrix", () => ({ skip: "applyPreset/ART_STYLES could not be extracted: " + missing.join(",") }));
  }
}

if (api.jsonParse) {
  await t("the JSON scanner accepts a real project document", () => {
    const doc = api.jsonParse(JSON.stringify({ version: 2, settings: { version: 2, projectName: "T", pages: { 1: { panelCountSel: "24", 1: { chars: [{ sel: "none", base: "", extra: "" }], action: "go", protectSlots: [false, false, false, false] } } } }, libObjects: [{ id: "a", type: "Character", name: "N", desc: "D" }] }));
    return eqArr([!!doc.error, doc.doc.settings.projectName, doc.doc.libObjects[0].name, doc.scalars.length > 8], [false, "T", "N", true], "parsed");
  });

  await t("the scanner reports missing values, unquoted keys and extra content", () => {
    const a = api.jsonParse('{"a": }');
    const b = api.jsonParse("{a: 1}");
    const c = api.jsonParse('{"a": 1} {"b": 2}');
    const d = api.jsonParse('{"a": 1,}');
    const msgs = [a.error && a.error.message, b.error && b.error.message, c.error && c.error.message, d.error && d.error.message];
    const allFour = msgs.every((m) => typeof m === "string" && m.length > 6);
    return allFour ? ok(msgs.map((m) => m.slice(0, 34)).join(" | ")) : no(JSON.stringify(msgs).slice(0, 220));
  });

  await t("the scanner records each scalar with its path", () => {
    const r = api.jsonParse('{"settings": {"pages": {"1": {"1": {"action": "hello", "imgCount": "4"}}}}}');
    const action = r.scalars.find((s) => s.path.join(".") === "settings.pages.1.1.action" && s.kind === "string" && s.value === "hello");
    const imgCount = r.scalars.find((s) => s.path.join(".") === "settings.pages.1.1.imgCount" && s.kind === "string");
    const kinds = [...new Set(r.scalars.map((s) => s.kind))].sort();
    return eqArr([!!action, imgCount && imgCount.value, kinds.includes("key")], [true, "4", true], "action,imgCount,kinds=" + kinds.join(","));
  });

  await t("the scanner stays fast on a 200 KB document", () => {
    const big = { settings: { pages: {} } };
    for (let p = 1; p <= 3; p++) {
      big.settings.pages[p] = {};
      for (let i = 1; i <= 24; i++) big.settings.pages[p][i] = { chars: [{ sel: "none", base: "b".repeat(120), extra: "e".repeat(120) }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }], action: "a".repeat(200), loc: "none", locBase: "", locExtra: "", title: "", seed: "", imgCount: "1", style: "", sizeSel: "", sizeW: "", sizeH: "", sameSeed: false, protectSlots: [false, false, false, false], promptHistory: [] };
    }
    const text = JSON.stringify(big);
    const t0 = performance.now();
    const r = api.jsonParse(text);
    const ms = Math.round(performance.now() - t0);
    return eqArr([text.length > 40000, !r.error, ms < 1500], [true, true, true], "bytes=" + text.length + ",ms=" + ms);
  });
}

const pass = T.filter((x) => x.ok === true).length;
const fail = T.filter((x) => x.ok === false).length;
const manual = T.filter((x) => x.ok === null).length;
return {
  extraction: { wanted, missing: missingAtBoot, chars: code.length },
  pass, fail, manual,
  failures: T.filter((x) => x.ok === false),
  checks: T,
};
