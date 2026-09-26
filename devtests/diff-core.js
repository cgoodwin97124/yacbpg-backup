const src = await fs.readTextFile("index.html");
const lines = src.split("\n");
const N = lines.length;
const missing = [];

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

const inlineWanted = ["crcTable", "crc32", "initCrcTable", "dataUrlToBytes", "buildZip", "inflateRawDeflate", "unzipEntries", "JSON_NUM_RE", "jsonTokenize", "jsonDecodeRaw", "jsonParse", "ART_STYLES", "COLOR_PALETTES", "DEFAULT_POS", "DEFAULT_NEGATIVES", "composeKeywords", "panelSeedValue", "imageSeed", "scrubMinusOneSeeds"];
const inlineCode = inlineWanted.map(grab).join("\n\n");
let inline = {};
let extractionError = null;
try {
  const factory = new Function("sandbox", "with (sandbox) { " + inlineCode + "\n; return { crc32, initCrcTable, dataUrlToBytes, buildZip, inflateRawDeflate, unzipEntries, jsonTokenize, jsonDecodeRaw, jsonParse, ART_STYLES, COLOR_PALETTES, DEFAULT_POS, DEFAULT_NEGATIVES, composeKeywords, panelSeedValue, imageSeed, scrubMinusOneSeeds }; }");
  inline = factory({ atob: (s) => atob(s), document: { getElementById: () => null, addEventListener() {} }, window: {} });
} catch (e) {
  extractionError = e.message;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry(0xC0FFEE);
const rint = (n) => Math.floor(rnd() * n);
const randBytes = (n) => { const b = new Uint8Array(n); for (let i = 0; i < n; i++) b[i] = rint(256); return b; };
const randText = (n) => { let s = ""; const pool = "abcXYZ 019_-./\u00fc\u2713\u4e2d"; while (s.length < n) s += pool[rint(pool.length)]; return s; };

const T = [];
async function t(name, fn) {
  try {
    const r = await fn();
    if (r && r.skip) { T.push({ n: name, ok: null, d: String(r.skip) }); return; }
    const good = r === undefined ? true : r && typeof r === "object" ? !!r.ok : !!r;
    T.push({ n: name, ok: good, d: r && typeof r === "object" && r.d !== undefined ? String(r.d).slice(0, 240) : "" });
  } catch (e) { T.push({ n: name, ok: false, d: "THROW " + (e && e.message) }); }
}
const ok = (d) => ({ ok: true, d: d === undefined ? "" : d });
const no = (d) => ({ ok: false, d: d === undefined ? "" : d });

async function loadModule(path) {
  const text = await fs.readTextFile(path);
  const url = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
  try { return await import(url); } finally { URL.revokeObjectURL(url); }
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function entriesEqual(a, b) {
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (ka.join("\u0000") !== kb.join("\u0000")) return false;
  for (const k of ka) if (!bytesEqual(a[k], b[k])) return false;
  return true;
}
function maskZipTimestamps(zip) {
  const out = zip.slice();
  const dv = new DataView(out.buffer, out.byteOffset, out.byteLength);
  let pos = 0;
  while (pos + 4 <= out.length) {
    const sig = dv.getUint32(pos, true);
    if (sig === 0x04034b50) {
      const nameLen = dv.getUint16(pos + 26, true);
      const extraLen = dv.getUint16(pos + 28, true);
      const size = dv.getUint32(pos + 18, true);
      out[pos + 10] = 0; out[pos + 11] = 0; out[pos + 12] = 0; out[pos + 13] = 0;
      pos += 30 + nameLen + extraLen + size;
    } else if (sig === 0x02014b50) {
      const nameLen = dv.getUint16(pos + 28, true);
      const extraLen = dv.getUint16(pos + 30, true);
      const commentLen = dv.getUint16(pos + 32, true);
      out[pos + 12] = 0; out[pos + 13] = 0; out[pos + 14] = 0; out[pos + 15] = 0;
      pos += 46 + nameLen + extraLen + commentLen;
    } else break;
  }
  return out;
}

const specs = {
  "src/core/zip.js": async (mod) => {
    await t("inline vs module: crc32 on 300 random buffers", () => {
      const bad = [];
      for (let i = 0; i < 300; i++) {
        const n = i < 20 ? i : rint(4096);
        const buf = randBytes(n);
        const a = inline.crc32(buf) >>> 0;
        const b = mod.crc32(buf) >>> 0;
        if (a !== b) bad.push({ n, a, b });
      }
      return bad.length ? no(JSON.stringify(bad.slice(0, 4))) : ok("300 buffers, 0 differences");
    });

    await t("inline vs module: crc32 standard vectors agree", () => {
      const cases = ["", "a", "123456789", "The quick brown fox jumps over the lazy dog", "\u4e2d\u6587\u2713"];
      const bad = cases.filter((s) => (inline.crc32(enc.encode(s)) >>> 0) !== (mod.crc32(enc.encode(s)) >>> 0));
      return bad.length ? no(JSON.stringify(bad)) : ok(cases.length + " vectors");
    });

    await t("inline vs module: buildZip is byte-identical (timestamps masked) on 120 random file lists", () => {
      const bad = [];
      for (let i = 0; i < 120; i++) {
        const count = 1 + rint(6);
        const files = [];
        for (let k = 0; k < count; k++) {
          const kind = rint(4);
          const name = kind === 0 ? "file-" + k + ".txt" : kind === 1 ? "panels/page-" + (1 + rint(3)) + "/panel-" + (1 + rint(24)) + "-" + (1 + rint(4)) + ".png" : kind === 2 ? randText(1 + rint(24)) : "unicode-\u00fcn\u00efcode-\u2713-" + k + ".json";
          const size = kind === 1 ? rint(3000) : rint(600);
          files.push({ name, data: kind === 1 ? randBytes(size) : enc.encode(randText(size)) });
        }
        const a = inline.buildZip(files);
        const b = mod.buildZip(files);
        if (a.length !== b.length || !bytesEqual(maskZipTimestamps(a), maskZipTimestamps(b))) { bad.push({ i, la: a.length, lb: b.length }); continue; }
        const av = new DataView(a.buffer, a.byteOffset, a.byteLength);
        let off = 0;
        for (const f of files) {
          const want = (inline.crc32(f.data) >>> 0);
          const got = av.getUint32(off + 14, true) >>> 0;
          if (got !== want) { bad.push({ i, crc: f.name, off, got, want }); break; }
          off += 30 + enc.encode(f.name).length + av.getUint32(off + 18, true);
        }
      }
      return bad.length ? no(JSON.stringify(bad.slice(0, 4))) : ok("120 file lists, identical bytes");
    });

    await t("inline vs module: each reader reads the other's zip on 120 random lists", async () => {
      const bad = [];
      for (let i = 0; i < 120; i++) {
        const files = [];
        const count = 1 + rint(5);
        for (let k = 0; k < count; k++) {
          const long = rint(4) === 0;
          files.push({ name: "e-" + k + (rint(2) ? ".bin" : ".txt"), data: long ? randBytes(66000 + rint(3000)) : (rint(2) ? randBytes(rint(2000)) : enc.encode(randText(rint(400)))) });
        }
        const za = inline.buildZip(files);
        const zb = mod.buildZip(files);
        const r = {
          ii: await inline.unzipEntries(za.buffer),
          im: await inline.unzipEntries(zb.buffer),
          mi: await mod.unzipEntries(za.buffer),
          mm: await mod.unzipEntries(zb.buffer),
        };
        if (!entriesEqual(r.ii, r.mm) || !entriesEqual(r.ii, r.im) || !entriesEqual(r.ii, r.mi)) { bad.push({ i, names: Object.keys(r.ii).length, mod: Object.keys(r.mm).length }); continue; }
        for (const f of files) if (!bytesEqual(r.mm[f.name], f.data)) { bad.push({ i, mismatch: f.name }); break; }
      }
      return bad.length ? no(JSON.stringify(bad.slice(0, 4))) : ok("480 round trips (4 readers x 120 lists), byte-exact");
    });

    await t("inline vs module: dataUrlToBytes agrees on 50 data URLs", () => {
      const bad = [];
      for (let i = 0; i < 50; i++) {
        const bytes = randBytes(rint(500));
        let bin = "";
        for (const b of bytes) bin += String.fromCharCode(b);
        const url = "data:image/png;base64," + btoa(bin);
        const a = inline.dataUrlToBytes(url);
        const b = mod.dataUrlToBytes(url);
        if (!bytesEqual(a, b) || !bytesEqual(a, bytes)) bad.push({ i, la: a.length, lb: b.length });
      }
      return bad.length ? no(JSON.stringify(bad.slice(0, 4))) : ok("50 URLs, byte-exact");
    });

    await t("inline vs module: inflateRawDeflate agrees on 40 deflate-raw streams", async () => {
      const bad = [];
      for (let i = 0; i < 40; i++) {
        const payload = rint(2) ? enc.encode(randText(rint(4000))) : randBytes(rint(2000));
        const deflated = new Uint8Array(await new Response(new Blob([payload]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
        const a = await inline.inflateRawDeflate(deflated);
        const b = await mod.inflateRawDeflate(deflated);
        if (!bytesEqual(a, b) || !bytesEqual(a, payload)) bad.push({ i, la: a.length, lb: b.length, want: payload.length });
      }
      return bad.length ? no(JSON.stringify(bad.slice(0, 4))) : ok("40 streams, byte-exact");
    });

    await t("both readers reject a corrupt zip the same way", async () => {
      const junk = randBytes(200);
      let ea = null, eb = null;
      try { await inline.unzipEntries(junk.buffer); } catch (e) { ea = e.message; }
      try { await mod.unzipEntries(junk.buffer); } catch (e) { eb = e.message; }
      return ea && eb && ea === eb ? ok(ea.slice(0, 60)) : no("inline=" + ea + " module=" + eb);
    });
  },

  "src/core/jsontext.js": async (mod) => {
    const deepEqual = (a, b) => {
      if (a === b) return true;
      if (typeof a === "number" && typeof b === "number") return a === b || (Number.isNaN(a) && Number.isNaN(b));
      if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
      if (a instanceof Map || b instanceof Map) {
        if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) return false;
        for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
        return true;
      }
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      const ka = Object.keys(a).sort();
      const kb = Object.keys(b).sort();
      if (ka.join("\u0000") !== kb.join("\u0000")) return false;
      for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
      return true;
    };
    const short = (x) => JSON.stringify(x === undefined ? null : x, (k, v) => (v instanceof Map ? [...v.entries()] : v)).slice(0, 150);
    const randString = (n) => {
      let s = "";
      const pool = ["a", "Z", " ", "\\", "\"", "/", "\n", "\u00e9", "\u4e2d", "\u2713", "\\n", "\\u00e9", "\\\\", "\\q", "\\t", "0", "9", "_"];
      while (s.length < n) s += pool[rint(pool.length)];
      return s;
    };
    const randScalar = () => {
      const k = rint(6);
      if (k === 0) return rint(2) ? rint(2000) - 1000 : (rnd() * 200 - 100);
      if (k === 1) return rint(2) === 0;
      if (k === 2) return null;
      if (k === 3) return randString(1 + rint(14));
      if (k === 4) return Math.round(rnd() * 1000) / 100;
      return rint(1e6);
    };
    const randValue = (depth) => {
      const k = rint(depth <= 0 ? 1 : 10);
      if (k < 6) return randScalar();
      if (k < 8) { const n = rint(4); const arr = []; for (let i = 0; i < n; i++) arr.push(randValue(depth - 1)); return arr; }
      const n = rint(4); const obj = {};
      for (let i = 0; i < n; i++) obj[randString(1 + rint(8)).replace(/["\\\n]/g, "x") + i] = randValue(depth - 1);
      return obj;
    };
    const junk = ["{", "}", "[", "]", ",", ":", "\"", "1", "true", "false", "null", "x", " ", "\n", "\\", "00", "1.", "e", "-"];
    const mutate = (s) => {
      const at = rint(s.length + 1);
      const kind = rint(4);
      if (kind === 0) return s.slice(0, at) + junk[rint(junk.length)] + s.slice(at);
      if (kind === 1) return s.slice(0, at) + s.slice(at + 1);
      if (kind === 2) return s.slice(0, at);
      return s.slice(0, at) + s.charAt(Math.max(0, at - 1)) + s.slice(at);
    };

    await t("inline vs module: jsonTokenize agrees on 200 documents and 400 mutations", () => {
      const bad = [];
      const texts = [];
      for (let i = 0; i < 200; i++) texts.push(JSON.stringify(randValue(3), null, rint(3) ? 0 : 2));
      const seeds = texts.slice();
      for (let i = 0; i < 400; i++) texts.push(mutate(seeds[rint(seeds.length)]));
      for (let i = 0; i < texts.length; i++) {
        const a = inline.jsonTokenize(texts[i]);
        const b = mod.jsonTokenize(texts[i]);
        if (!deepEqual(a, b)) { bad.push({ i, errorA: !!a.error, errorB: !!b.error, a: short(a).slice(0, 80), b: short(b).slice(0, 80) }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok(texts.length + " texts, token-for-token");
    });

    await t("inline vs module: jsonDecodeRaw agrees on 150 escape-heavy strings", () => {
      const bad = [];
      const fixed = ["", "plain", "a\\nb", "\\u00e9", "\\\\", "\\q", "trailing\\", "\\u12", "\\uZZZZ", "tab\\there"];
      for (let i = 0; i < 150; i++) {
        const raw = i < fixed.length ? fixed[i] : randString(rint(30));
        const a = inline.jsonDecodeRaw(raw);
        const b = mod.jsonDecodeRaw(raw);
        if (!deepEqual(a, b)) { bad.push({ i, raw: raw.slice(0, 24), a: short(a), b: short(b) }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("150 raws, text+map identical");
    });

    await t("inline vs module: jsonParse agrees on 200 docs and 400 mutations", () => {
      const bad = [];
      const texts = [];
      for (let i = 0; i < 200; i++) texts.push(JSON.stringify(randValue(3), null, rint(3) ? 0 : 2));
      const seeds = texts.slice();
      for (let i = 0; i < 400; i++) texts.push(mutate(seeds[rint(seeds.length)]));
      let errors = 0;
      for (let i = 0; i < texts.length; i++) {
        const a = inline.jsonParse(texts[i]);
        const b = mod.jsonParse(texts[i]);
        if (a.error || b.error) {
          errors++;
          const same = !!a.error && !!b.error && a.error.message === b.error.message && a.error.start === b.error.start && a.error.end === b.error.end;
          if (!same) { bad.push({ i, kind: "error", a: short(a.error), b: short(b.error) }); if (bad.length > 3) break; }
          continue;
        }
        const same = deepEqual(a.doc, b.doc) && deepEqual(a.scalars, b.scalars) && deepEqual(a.containers, b.containers) && deepEqual(a.puncts, b.puncts) && deepEqual(a.valRanges, b.valRanges) && deepEqual(a.keyRanges, b.keyRanges);
        if (!same) { bad.push({ i, kind: "doc", a: short(a.doc).slice(0, 60), b: short(b.doc).slice(0, 60) }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok(texts.length + " texts (" + errors + " rejected by both, same message + span)");
    });

    await t("inline vs module: fixtures/full-page.json parses identically", async () => {
      const text = await fs.readTextFile("fixtures/full-page.json");
      const a = inline.jsonParse(text);
      const b = mod.jsonParse(text);
      const same = !a.error && !b.error && deepEqual(a, b);
      return same ? ok("full-page.json: " + a.scalars.length + " scalars, " + a.containers.length + " containers") : no(short(a.error || a.scalars.length) + " vs " + short(b.error || b.scalars.length));
    });
  },

  "src/core/keywords.js": async (mod) => {
    await t("inline vs module: the art styles, palettes and defaults are identical", () => {
      const same = JSON.stringify(mod.ART_STYLES) === JSON.stringify(inline.ART_STYLES) && JSON.stringify(mod.COLOR_PALETTES) === JSON.stringify(inline.COLOR_PALETTES) && mod.DEFAULT_POS === inline.DEFAULT_POS && mod.DEFAULT_NEGATIVES === inline.DEFAULT_NEGATIVES;
      return same ? ok(Object.keys(mod.ART_STYLES).length + " styles, " + Object.keys(mod.COLOR_PALETTES).length + " palettes") : no("the tables differ");
    });

    await t("inline vs module: composeKeywords agrees on 400 keyword/NSFW combinations", () => {
      const posPool = ["", "a", "comic book art, crisp ink lines", ",", " , ", "a,", ",a", "  spaced  ", "x,y,,z", "a, b, c", "\n"];
      const negPool = ["", "b", "nsfw", ", ,", "a, , b", " , ", "trailing,", ",leading"];
      const bad = [];
      for (let i = 0; i < 400; i++) {
        const pos = posPool[rint(posPool.length)] + (rnd() < 0.4 ? posPool[rint(posPool.length)] : "");
        const neg = negPool[rint(negPool.length)] + (rnd() < 0.4 ? negPool[rint(negPool.length)] : "");
        const nsfw = rnd() < 0.5;
        const a = inline.composeKeywords(pos, neg, nsfw);
        const b = mod.composeKeywords(pos, neg, nsfw);
        if (a.positive !== b.positive || a.negative !== b.negative) { bad.push({ i, pos, neg, nsfw, a, b }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("400 combinations identical");
    });
  },

  "src/core/seeds.js": async (mod) => {
    await t("inline vs module: panelSeedValue agrees on 400 raw-input combinations", () => {
      const panelPool = ["", " ", "0", "-1", "7", " 42 ", "-99", "abc", "12.9", "0x10", "1e3", "+5", "999999999999999999999", "007", "null", "NaN", "-0"];
      const globalPool = ["", " ", "1", "0", "-5", " 123 ", "xyz", "3.7", "1e2", "  7  ", "+8", "-1"];
      const bad = [];
      for (let i = 0; i < 400; i++) {
        const panelRaw = panelPool[rint(panelPool.length)];
        const globalRaw = globalPool[rint(globalPool.length)];
        const idx = 1 + rint(24);
        const a = inline.panelSeedValue(panelRaw, globalRaw, idx);
        const b = mod.panelSeedValue(panelRaw, globalRaw, idx);
        if (a.seed !== b.seed || a.hasSeed !== b.hasSeed) { bad.push({ i, panelRaw, globalRaw, idx, a, b }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("400 combinations identical");
    });

    await t("inline vs module: imageSeed agrees on 300 (seed, k, same) triples", () => {
      const bad = [];
      for (let i = 0; i < 300; i++) {
        const seed = rint(2) ? rint(1e9) - 5e8 : rint(1000);
        const k = 1 + rint(6);
        const same = rnd() < 0.5;
        const a = inline.imageSeed(seed, k, same);
        const b = mod.imageSeed(seed, k, same);
        if (a !== b) { bad.push({ seed, k, same, a, b }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad)) : ok("300 triples identical");
    });

    await t("inline vs module: scrubMinusOneSeeds agrees on 200 random documents", () => {
      const seedPool = [-1, "-1", " -1 ", "-1 ", "  -1", 0, "", "7", "-2", null, 42, "-1.0"];
      const makeDoc = () => {
        const doc = { seed: seedPool[rint(seedPool.length)], pages: {} };
        const np = 1 + rint(4);
        for (let p = 1; p <= np; p++) {
          const page = { seed: seedPool[rint(seedPool.length)] };
          const npan = 1 + rint(6);
          for (let i = 1; i <= npan; i++) page[i] = { seed: seedPool[rint(seedPool.length)], action: "a" + i };
          doc.pages[p] = page;
        }
        return doc;
      };
      const bad = [];
      for (let n = 0; n < 200; n++) {
        const doc = makeDoc();
        const a = JSON.parse(JSON.stringify(doc));
        const b = JSON.parse(JSON.stringify(doc));
        inline.scrubMinusOneSeeds(a);
        mod.scrubMinusOneSeeds(b);
        if (JSON.stringify(a) !== JSON.stringify(b)) { bad.push({ n }); if (bad.length > 2) break; }
      }
      return bad.length ? no(JSON.stringify(bad)) : ok("200 documents scrubbed identically");
    });
  },
};

const discovered = (await fs.listFiles()).filter((f) => f.path.startsWith("src/core/") && f.path.endsWith(".js")).map((f) => f.path).sort();
const unspecced = discovered.filter((p) => !specs[p]);

if (extractionError) {
  T.push({ n: "extraction", ok: false, d: extractionError });
} else {
  for (const path of discovered) {
    if (!specs[path]) continue;
    let mod = null;
    try { mod = await loadModule(path); } catch (e) { T.push({ n: path + ": module loads", ok: false, d: String(e && e.message).slice(0, 160) }); continue; }
    T.push({ n: path + ": module loads", ok: true, d: Object.keys(mod).sort().join(",") });
    await specs[path](mod);
  }
}

const manifestMatch = src.match(/const GH_SRC_FILES = \[([^\]]*)\]/);
const manifest = manifestMatch ? manifestMatch[1].split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean) : null;
await t("every extracted src/core module is in the ghPush src manifest", () => {
  if (!manifest) return no("GH_SRC_FILES not found in index.html");
  const missingFromManifest = discovered.filter((p) => !manifest.includes(p));
  return missingFromManifest.length ? no("not listed: " + missingFromManifest.join(", ")) : ok(manifest.length + " files listed, all " + discovered.length + " modules covered");
});

const pass = T.filter((x) => x.ok === true).length;
const fail = T.filter((x) => x.ok === false).length;
const report = {
  discovered,
  unspecced,
  manifest,
  extraction: { wanted: inlineWanted, missing, chars: inlineCode.length },
  pass, fail,
  failures: T.filter((x) => x.ok === false),
  checks: T,
};
await fs.writeTextFile("scratch/p0/diff-core.json", JSON.stringify(report, null, 2));
return { discovered, unspecced, missing, pass, fail, failures: report.failures, checks: T.map((x) => (x.ok === true ? "PASS " : x.ok === null ? "SKIP " : "FAIL ") + x.n + (x.d ? "  [" + x.d + "]" : "")) };
