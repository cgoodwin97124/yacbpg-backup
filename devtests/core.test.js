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

const wanted = ["getEffectiveKeywords", "applyPreset", "ensurePages"];
const code = wanted.map(grab).join("\n\n");

const moduleBlobs = {};
async function loadModule(path) {
  let text = await fs.readTextFile(path);
  text = text.replace(/from\s+["'](\.\/[^"']+)["']/g, (m, rel) => {
    const dep = path.replace(/[^/]+$/, "") + rel.slice(2);
    return 'from "' + (moduleBlobs[dep] || rel) + '"';
  });
  const url = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
  moduleBlobs[path] = url;
  return import(url);
}
const MODULE_PATHS = ["src/core/zip.js", "src/core/jsontext.js", "src/core/keywords.js", "src/core/seeds.js", "src/core/prompt.js", "src/core/library-core.js", "src/core/schema.js", "src/state/store.js", "src/state/commands.js"];
const modules = {};
const moduleErrors = [];
for (const p of MODULE_PATHS) {
  try { Object.assign(modules, await loadModule(p)); } catch (e) { moduleErrors.push(p + ": " + String(e && e.message).slice(0, 120)); }
}

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
const sandbox = Object.assign({ window: {}, document: fakeDoc(), localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, renderKeywordChips() {}, renderFilterStatus() {}, schedulePanelSave() {}, renderChips() {}, clearAllPromptOverrides() {} }, modules);
let api = { modules };
const missingAtBoot = missing.slice();
try {
  const factory = new Function("sandbox", "with (sandbox) { " + code + "\n; return { getEffectiveKeywords, applyPreset, ensurePagesInline: ensurePages }; }");
  api = Object.assign(factory(sandbox), modules);
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

if (api.dataUrlToBytes && api.crc32 && api.buildZip && api.unzipEntries && api.jsonDecodeRaw) {
  await t("dataUrlToBytes decodes base64 payloads byte-exactly", () => {
    let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const bad = [];
    for (let i = 0; i < 50; i++) {
      const n = Math.floor(rnd() * 500);
      const bytes = new Uint8Array(n);
      for (let k = 0; k < n; k++) bytes[k] = Math.floor(rnd() * 256);
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      const got = api.dataUrlToBytes("data:image/png;base64," + btoa(bin));
      if (got.length !== n || !got.every((b, k) => b === bytes[k])) bad.push({ i, n, got: got.length });
    }
    return bad.length ? no(JSON.stringify(bad.slice(0, 4))) : ok("50 URLs, byte-exact");
  });

  await t("buildZip writes a matching CRC for every entry", () => {
    const files = [{ name: "a.txt", data: enc.encode("hello") }, { name: "b.bin", data: new Uint8Array([0, 1, 2, 253, 254, 255]) }];
    const zip = api.buildZip(files);
    const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const bad = [];
    let off = 0;
    for (const f of files) {
      const want = api.crc32(f.data) >>> 0;
      const got = dv.getUint32(off + 14, true) >>> 0;
      if (got !== want) bad.push({ name: f.name, got, want });
      off += 30 + enc.encode(f.name).length + dv.getUint32(off + 18, true);
    }
    return bad.length ? no(JSON.stringify(bad)) : ok(files.length + " entries");
  });

  await t("unzipEntries rejects junk with a readable message", async () => {
    let msg = null;
    try { await api.unzipEntries(new Uint8Array(200).buffer); } catch (e) { msg = String(e && e.message); }
    return msg && msg.length > 10 ? ok(msg.slice(0, 60)) : no("no error thrown");
  });

  await t("jsonDecodeRaw resolves the JSON escapes and their spans", () => {
    const rows = [["plain", "plain"], ["a\\nb", "a\nb"], ["\\u00e9", "\u00e9"], ["\\\\", "\\"], ["\\q", "q"], ["\\t", "\t"], ["", ""]];
    const bad = [];
    for (const [raw, want] of rows) {
      const r = api.jsonDecodeRaw(raw);
      if (r.text !== want || !Array.isArray(r.map) || r.map[r.map.length - 1] !== raw.length) bad.push({ raw, got: r.text, want });
    }
    return bad.length ? no(JSON.stringify(bad).slice(0, 200)) : ok(rows.length + " escape rows");
  });
}

if (api.normalise && api.validate && api.newPanelId) {
  await t("newPanelId mints unique, well-formed ids", () => {
    const ids = new Set();
    for (let i = 0; i < 5000; i++) ids.add(api.newPanelId());
    const odd = [...ids].filter((id) => typeof id !== "string" || !/^p-[0-9a-z]+-[0-9a-z]+$/.test(id));
    return eqArr([ids.size, odd.length], [5000, 0], "5000 unique, well-formed");
  });

  await t("defaultPanel/defaultPage/defaultProject carry the documented shapes", () => {
    const p = api.defaultPanel();
    const page = api.defaultPage(4);
    const proj = api.defaultProject();
    return eqArr([
      Object.keys(p).join(","),
      p.chars.length, p.protectSlots.join(","), p.promptOverride === null, Array.isArray(p.promptHistory),
      Object.keys(page).filter((k) => /^\d+$/.test(k)).length, page.panelCountSel, page.panelCountCustom,
      Object.keys(proj).join(","), proj.currentPage, api.validate(proj).length
    ], [
      "id,chars,title,protectSlots,loc,locBase,locExtra,action,seed,imgCount,style,palette,sizeSel,sizeW,sizeH,sameSeed,promptOverride,promptHistory",
      3, "false,false,false,false", true, true,
      4, "4", "",
      "version,projectName,imageSizeSel,imageSizeW,imageSizeH,guidanceScale,imgCountDefault,previewDelay,previewOn,globalPos,globalNeg,nsfw,theme,currentPage,pages,library,kept", 1, 0
    ], "panel,page,project");
  });

  await t("normaliseKept / normalise handle the project's own kept images", () => {
    const src = [
      { id: "k1", panel: "p-1", slot: 2, image: "data:image/png;base64,AAA", prompt: "a cow", seed: "5" },
      { extra: "unknown key kept" },
      { prompt: 5 },
      null, "junk", 7, []
    ];
    const arr = api.normaliseKept(src);
    const norm = api.normalise(Object.assign({ projectName: "T", pages: { 1: { panelCountSel: "4" } } }, { kept: src }));
    const seeded = api.normalise({ projectName: "T", pages: { 1: { panelCountSel: "4" } } });
    const bad = api.validate({ pages: { 1: { panelCountSel: "4" } }, kept: { nope: 1 } }).length;
    const badEntry = api.validate({ pages: { 1: { panelCountSel: "4" } }, kept: ["x"] }).length;
    const okProj = api.validate({ pages: { 1: { panelCountSel: "4" } }, kept: [{ anything: 1 }] }).length;
    return eqArr([
      arr.length, norm.kept.length, norm.kept[0].prompt, norm.kept[0].slot, norm.kept[1].extra, norm.kept[2].prompt,
      api.normaliseKept("nope").length, arr[0] === src[0],
      "kept" in seeded, api.defaultProject().kept.length
    ], [3, 3, "a cow", 2, "unknown key kept", 5, 0, false, false, 0], "kept");
  });

  await t("normaliseLibrary / normalise handle the project's own library", () => {
    const norm = api.normalise({ projectName: "T", pages: { 1: { panelCountSel: "4" } }, library: [
      { id: "loc-1", name: "L", desc: "d" },
      { id: "act-2", type: "Action", name: "A", desc: "" },
      { id: "loc-1", name: "dupe" },
      { id: "zzz", type: "Bogus", name: "B" },
      { name: "no id" },
      null,
      "junk",
      { id: "char-3", name: 5, desc: 7 }
    ] });
    const seeded = api.normalise({ projectName: "T", pages: { 1: { panelCountSel: "4" } } });
    const bad = api.validate({ pages: { 1: { panelCountSel: "4" } }, library: { nope: 1 } }).length;
    const badEntry = api.validate({ pages: { 1: { panelCountSel: "4" } }, library: [{ name: "x" }] }).length;
    const okProj = api.validate({ pages: { 1: { panelCountSel: "4" } }, library: [{ id: "c-1", name: "x" }] }).length;
    return eqArr([
      norm.library.length, norm.library.map((o) => o.type).join(","), norm.library[3].name, JSON.stringify(norm.library[3].desc),
      "library" in seeded, bad, badEntry, okProj
    ], [4, "Location,Action,Character,Character", "5", "\"7\"", false, 1, 1, 0], "library");
  });

  await t("panelDescMatch finds only a saved Panel Description whose text matches", () => {
    const objs = [
      { id: "char-1", type: "Character", name: "Bill", desc: "a tall man" },
      { id: "pd-1", type: "Panel Description", name: "Torn jacket", desc: "wearing a torn jacket" },
      { id: "pd-2", type: "Panel Description", name: "At night", desc: "lit only by the moon" },
      { id: "zzz-9", name: "legacy", desc: "wearing a torn jacket" }
    ];
    const hit = api.panelDescMatch(objs, "  wearing a torn jacket  ");
    return eqArr([
      hit && hit.id, hit && hit.name,
      api.panelDescMatch(objs, "something else"),
      api.panelDescMatch(objs, "   "),
      api.panelDescMatch(objs, null),
      api.panelDescMatch([], "wearing a torn jacket"),
      api.normalizeLibType({ id: "pd-77" }),
      api.normalizeLibType({ id: "x", type: "Panel Description" })
    ], ["pd-1", "Torn jacket", null, null, null, null, "Panel Description", "Panel Description"], "match,idPrefix,byType");
  });

  await t("normalise keeps unknown keys and mints the missing ids", () => {
    const legacy = {
      version: 1,
      projectName: "T",
      pages: { 1: { panelCountSel: "custom", panelCountCustom: "2", 1: { chars: [{ sel: "lib:char:a", base: "b", extra: "e", persist: true }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }], extras: [{ type: "Action", desc: "d" }], locPersist: false, title: "T" }, 2: { action: "x" } } }
    };
    const n = api.normalise(legacy);
    const flat = api.normalise({ panelCountSel: "4", seed: "5", 1: { action: "a" } });
    const ids = [n.pages[1][1].id, n.pages[1][2].id];
    return eqArr([
      n.version,
      typeof ids[0], ids[0] !== ids[1],
      n.pages[1][1].chars[0].persist, n.pages[1][1].chars[0].sel, n.pages[1][1].chars.length,
      n.pages[1][1].extras.length, n.pages[1][1].locPersist, n.pages[1][1].title,
      n.pages[1][2].action, n.pages[1].panelCountCustom,
      Object.keys(flat.pages).join(","), flat.pages[1][1].action, flat.pages[1].seed, flat.currentPage
    ], [
      2,
      "string", true,
      true, "lib:char:a", 3,
      1, false, "T",
      "x", "2",
      "1", "a", "5", 1
    ], "legacy,flat");
  });

  await t("normalise repairs duplicate ids, junk fields and is idempotent", () => {
    const dupe = { pages: { 1: { 1: { id: "same" }, 2: { id: "same" }, 3: { id: 7, chars: "no", protectSlots: [1, 0], promptOverride: "text", promptHistory: {} }, 4: "junk" }, 2: { 1: { id: "same" } } } };
    const n = api.normalise(dupe);
    const ids = [n.pages[1][1].id, n.pages[1][2].id, n.pages[1][3].id, n.pages[2][1].id];
    return eqArr([
      ids[0], new Set(ids).size, 4 in n.pages[1], n.pages[1][3].chars.length,
      n.pages[1][3].protectSlots.join(","), n.pages[1][3].promptOverride === null, Array.isArray(n.pages[1][3].promptHistory),
      api.validate(n).length,
      JSON.stringify(api.normalise(n)) === JSON.stringify(api.normalise(api.normalise(n)))
    ], [
      "same", 4, false, 3,
      "true,false,false,false", true, true,
      0, true
    ], "ids,repaired,valid,idempotent");
  });

  await t("normalise folds an out-of-domain panelCountSel into custom", () => {
    const fold = (v, c) => { const n = api.normalise({ pages: { 1: { panelCountSel: v, panelCountCustom: c } } }).pages[1]; return n.panelCountSel + "/" + n.panelCountCustom; };
    return eqArr([fold("3", "2"), fold("7", ""), fold("24", "3"), fold("custom", "9"), fold("1", ""), fold("0", ""), fold("abc", ""), fold("", "6")],
      ["custom/3", "custom/7", "24/3", "custom/9", "1/", "0/", "abc/", "/6"], "panelCountSel");
  });

  await t("validate reports the structural problems normalise clears", () => {
    const broken = { pages: { 1: { panelCountSel: "9", 1: { id: "", chars: [], protectSlots: [true] }, 2: { id: "z" } }, 2: { 1: { id: "z", protectSlots: [false, false, false, false] } } } };
    const msgs = api.validate(broken).map((p) => p.path + " " + p.message);
    const compact = { pages: { 1: { panelCountSel: "24" } } };
    for (let i = 1; i <= 24; i++) compact.pages[1][i] = { id: "p-" + i, chars: [{ sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }], promptOverride: null, promptHistory: [] };
    const before = api.validate(compact).length;
    return eqArr([
      msgs.length, msgs.filter((m) => /panelCountSel/.test(m)).length, msgs.filter((m) => /\.id/.test(m)).length, msgs.filter((m) => /chars/.test(m)).length, msgs.filter((m) => /protectSlots/.test(m)).length,
      api.validate(null).length,
      before, api.validate(api.normalise(compact)).length
    ], [
      8, 1, 2, 3, 2,
      1,
      24, 0
    ], "broken,compact");
  });
}

if (api.createStore && api.serializeProject && api.ensurePages) {
  const mkPanel = (id) => ({ id, chars: [{ sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }], title: "", protectSlots: [false, false, false, false], loc: "none", locBase: "", locExtra: "", action: "", seed: "", imgCount: "", style: "", palette: "", sizeSel: "", sizeW: "", sizeH: "", sameSeed: false, promptOverride: null, promptHistory: [] });

  await t("store: serializeProject rebuilds the project envelope from the snapshot", () => {
    const stored = { pages: { 1: { name: "One", panelCountSel: "4", 1: mkPanel("p-1") }, 2: { name: "Two", panelCountSel: "6" } }, currentPage: 2, projectName: "OLD", legacyKey: true };
    const page = { name: "Two", summary: "", panelCountSel: "6", panelCountCustom: "", seed: "", 1: mkPanel("p-2") };
    const snapshot = {
      stored,
      currentPage: 2,
      page,
      globals: { projectName: "Cow", imageSizeSel: "768x768", imageSizeW: "", imageSizeH: "", guidanceScale: "7", imgCountDefault: "2", previewDelay: "350", previewOn: true, globalPos: "P", globalNeg: "N", nsfw: false, themeMode: "dark", themeAccent: "#ffee00" },
      library: [{ id: "char-1", type: "Character", name: "Ann", desc: "d" }],
      kept: [{ id: "k1", prompt: "a cow" }]
    };
    const out = api.serializeProject(snapshot);
    return eqArr([
      Object.keys(out).join(","), out.version, Object.keys(out.theme).join(","), out.theme.mode, out.theme.accent,
      out.currentPage, Object.keys(out.pages).join(","), out.pages[2] === page, out.pages[1].name, out.pages[1][1].id,
      out.library[0].name, out.kept[0].prompt, "legacyKey" in out, stored.pages[2].name
    ], [
      "version,projectName,imageSizeSel,imageSizeW,imageSizeH,guidanceScale,imgCountDefault,previewDelay,previewOn,globalPos,globalNeg,nsfw,theme,currentPage,pages,library,kept", 2,
      "mode,accent", "dark", "#ffee00",
      2, "1,2", true, "One", "p-1",
      "Ann", "a cow", false, "Two"
    ], "envelope");
  });

  await t("store: load / toJSON / subscribe / unsubscribe behave as documented", () => {
    const s = api.createStore();
    const start = s.listenerCount();
    const seen = [];
    const off = s.subscribe((st) => seen.push(st.toJSON().projectName));
    const afterSub = s.listenerCount();
    s.load({ globals: { projectName: "A" } });
    const j1 = s.toJSON();
    const cachedSame = s.toJSON() === j1;
    const dirtyAfter = s.isDirty();
    s.load({ globals: { projectName: "B" } });
    const b = s.toJSON().projectName;
    const boomFn = () => { throw new Error("boom"); };
    s.subscribe(boomFn);
    let survived = true;
    try { s.load({ globals: { projectName: "D" } }); } catch (e) { survived = false; }
    s.unsubscribe(boomFn);
    off();
    const afterOff = s.listenerCount();
    s.load({ globals: { projectName: "C" } });
    return eqArr([
      start, afterSub, seen.join(","), j1.projectName, cachedSame, dirtyAfter, b, survived, afterOff, seen.length,
      typeof s.subscribe(null), typeof s.subscribe(1)
    ], [0, 1, "A,B,D", "A", true, false, "B", true, 0, 3, "function", "function"], "store");
  });

  await t("store: ensurePages matches index.html's own over the stored shapes", () => {
    if (typeof api.ensurePagesInline !== "function") return { skip: "index.html's ensurePages could not be extracted" };
    const raws = [null, {}, { panelCountSel: "24" }, { panelCountSel: "custom", panelCountCustom: "3", seed: "-1", summary: "s", name: "N", 1: { id: "x" }, 7: { id: "y" } }, { pages: { 1: { name: "One" } } }, { pages: null, seed: "9" }, { pages: { 3: { name: "three" }, 1: { name: "one" } } }, { seed: 0, panelCountSel: "" }];
    const diffs = [];
    for (const raw of raws) {
      const a = JSON.stringify(api.ensurePages(raw));
      const b = JSON.stringify(api.ensurePagesInline(raw));
      if (a !== b) diffs.push({ raw: JSON.stringify(raw).slice(0, 80), module: a.slice(0, 140), inline: b.slice(0, 140) });
    }
    return diffs.length ? no(JSON.stringify(diffs).slice(0, 300)) : ok(raws.length + " stored shapes identical");
  });

  await t("store: a missing or junk snapshot still serialises a valid project", () => {
    const a = api.serializeProject(null);
    const b = api.serializeProject({ stored: "junk", page: 7, library: "no", kept: null, currentPage: "abc" });
    return eqArr([
      Object.keys(a.pages).join(","), a.currentPage, a.projectName === undefined, a.previewOn === undefined, api.validate(a).length,
      Object.keys(b.pages).join(","), b.currentPage, b.library.length, b.kept.length, api.validate(b).length
    ], [
      "1", 1, true, true, 0,
      "1", 1, 0, 0, 0
    ], "junk");
  });
}

if (api.setTitle && api.findPanelById && api.COMMANDS) {
  const mkProject = () => ({
    version: 2,
    projectName: "Commands",
    currentPage: 1,
    pages: {
      1: { name: "One", summary: "", panelCountSel: "4", panelCountCustom: "", seed: "", 1: { id: "p-1", title: "" }, 2: { id: "p-2", title: "two" } },
      2: { name: "Two", summary: "", panelCountSel: "4", panelCountCustom: "", seed: "", 1: { id: "p-3", title: "three" } },
    },
    library: [{ id: "char-1", type: "Character", name: "Ann", desc: "" }],
    kept: [],
  });
  const pathsDiffering = (a, b) => {
    const out = [];
    const walk = (x, y, p) => {
      if (x === y) return;
      const tx = typeof x, ty = typeof y;
      if (x === null || y === null || tx !== ty || tx !== "object") { out.push(p + " <" + JSON.stringify(x) + " -> " + JSON.stringify(y) + ">"); return; }
      const keys = [...new Set(Object.keys(x).concat(Object.keys(y)))];
      for (const k of keys) walk(x[k], y[k], p + "." + k);
    };
    walk(a, b, "$");
    return out;
  };

  await t("commands: findPanelById addresses a panel by id, on any page, and never mutates", () => {
    const proj = mkProject();
    const before = JSON.stringify(proj);
    const a = api.findPanelById(proj, "p-1");
    const b = api.findPanelById(proj, "p-3");
    const miss = ["p-9", "", null, undefined, 7, {}, []].map((v) => api.findPanelById(proj, v));
    const junkPages = [{ pages: null }, { pages: "junk" }, { pages: { 1: "not a page" } }, { pages: { 1: { 1: "not a panel" } } }, null, "junk"];
    return eqArr([
      a && a.page, a && a.index, a && a.panel === proj.pages[1][1],
      b && b.page, b && b.index,
      miss.filter((m) => m !== null).length,
      junkPages.map((j) => api.findPanelById(j, "p-1")).filter((m) => m !== null).length,
      JSON.stringify(proj) === before,
    ], [1, 1, true, 2, 1, 0, 0, true], "found,junk,unmutated");
  });

  await t("commands: setTitle writes exactly one leaf and reports where", () => {
    const proj = mkProject();
    const before = api.findPanelById(proj, "p-2");
    const wasBefore = JSON.parse(JSON.stringify(proj));
    const hit = api.setTitle(proj, "p-2", "Panel two");
    const changed = pathsDiffering(wasBefore, proj);
    return eqArr([
      JSON.stringify(hit), proj.pages[1][2].title, proj.pages[1][1].title, proj.pages[2][1].title,
      changed.join(","), before.panel === api.findPanelById(proj, "p-2").panel,
    ], [
      JSON.stringify({ page: 1, index: 2, fields: ["title"] }), "Panel two", "", "three",
      "$.pages.1.2.title <\"two\" -> \"Panel two\">", true,
    ], "oneLeaf");
  });

  await t("commands: setImgCount writes exactly one leaf and reports where", () => {
    const proj = mkProject();
    proj.pages[1][1].imgCount = "1";
    proj.pages[1][2].imgCount = "4";
    const wasBefore = JSON.parse(JSON.stringify(proj));
    const hit = api.setImgCount(proj, "p-2", "3");
    const changed = pathsDiffering(wasBefore, proj);
    const miss = [api.setImgCount(proj, "p-9", "2"), api.setImgCount(proj, "", "2")];
    return eqArr([
      JSON.stringify(hit), proj.pages[1][2].imgCount, proj.pages[1][1].imgCount,
      changed.join(","), miss.filter((m) => m === null).length,
    ], [
      JSON.stringify({ page: 1, index: 2, fields: ["imgCount"] }), "3", "1",
      "$.pages.1.2.imgCount <\"4\" -> \"3\">", 2,
    ], "oneLeaf,noop");
  });

  await t("commands: setStyle writes exactly one leaf and reports where", () => {
    const proj = mkProject();
    proj.pages[1][1].style = "";
    proj.pages[1][2].style = "manga";
    const wasBefore = JSON.parse(JSON.stringify(proj));
    const hit = api.setStyle(proj, "p-2", "noir");
    const changed = pathsDiffering(wasBefore, proj);
    const miss = [api.setStyle(proj, "p-9", "noir"), api.setStyle(proj, "", "noir")];
    return eqArr([
      JSON.stringify(hit), proj.pages[1][2].style, proj.pages[1][1].style,
      changed.join(","), miss.filter((m) => m === null).length,
    ], [
      JSON.stringify({ page: 1, index: 2, fields: ["style"] }), "noir", "",
      "$.pages.1.2.style <\"manga\" -> \"noir\">", 2,
    ], "oneLeaf,noop");
  });

  await t("commands: setTitle coerces, and an unknown id is a no-op", () => {
    const proj = mkProject();
    const values = [null, undefined, 42, true, { a: 1 }, "", "  spaced  "].map((v) => { api.setTitle(proj, "p-1", v); return proj.pages[1][1].title; });
    const untouched = JSON.parse(JSON.stringify(proj));
    const miss = [api.setTitle(proj, "p-9", "nope"), api.setTitle(proj, "", "nope"), api.setTitle(proj, null, "nope")];
    return eqArr([
      values.join("|"), miss.filter((m) => m === null).length, JSON.stringify(proj) === JSON.stringify(untouched),
      api.COMMANDS.setTitle === api.setTitle, api.COMMANDS_VERSION,
      Object.keys(api.COMMANDS).sort().join(","),
    ], [
      "||42|true|[object Object]||  spaced  ", 3, true,
      true, 3, "setImgCount,setStyle,setTitle",
    ], "coercion,noop,registry");
  });
}

const pass = T.filter((x) => x.ok === true).length;
const fail = T.filter((x) => x.ok === false).length;
const manual = T.filter((x) => x.ok === null).length;
return {
  extraction: { wanted, missing: missingAtBoot, chars: code.length, modules: Object.keys(modules).length, moduleErrors },
  pass, fail, manual,
  failures: T.filter((x) => x.ok === false),
  checks: T,
};
