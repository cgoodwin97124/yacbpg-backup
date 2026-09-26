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

const inlineWanted = ["composePanelPrompt", "LIB_TYPE_PREFIX", "libIdFor", "libRefValue", "isLibRef", "parseLibRef", "libRefNeedles", "countLibRefs", "normalizeLibType", "extractLibraryItems", "libRefEntry", "libRefDesc"];
const inlineCode = inlineWanted.map(grab).join("\n\n");
let inline = {};
let extractionError = null;
try {
  const factory = new Function("sandbox", "with (sandbox) { " + inlineCode + "\n; return { composePanelPrompt, LIB_TYPE_PREFIX, libIdFor, libRefValue, isLibRef, parseLibRef, libRefNeedles, countLibRefs, normalizeLibType, extractLibraryItems, libRefEntry, libRefDesc }; }");
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
  "src/core/prompt.js": async (mod) => {
    const pool = ["", " ", "a", " a ", "a, b", ",", "  x  ", "\u00e9\u2713", "line\nbreak", "none", "None", null, undefined];
    const strPool = pool.filter((v) => typeof v === "string");

    await t("inline vs module: composePanelPrompt agrees on 600 random panel inputs", () => {
      const bad = [];
      for (let i = 0; i < 600; i++) {
        const nChars = rint(4);
        const chars = [];
        for (let c = 0; c < nChars; c++) {
          chars.push(rnd() < 0.12 ? null : { base: pool[rint(pool.length)], extra: pool[rint(pool.length)] });
        }
        const input = {
          positive: pool[rint(pool.length)],
          negative: pool[rint(pool.length)],
          chars: chars,
          locKey: rnd() < 0.2 ? null : pool[rint(pool.length)],
          locDesc: pool[rint(pool.length)],
          locExtra: pool[rint(pool.length)],
          action: pool[rint(pool.length)],
          override: rnd() < 0.25 ? { pos: strPool[rint(strPool.length)], neg: strPool[rint(strPool.length)] } : null
        };
        const a = inline.composePanelPrompt(input);
        const b = mod.composePanelPrompt(input);
        if (a.fullPrompt !== b.fullPrompt || a.negativePrompt !== b.negativePrompt || a.hasContent !== b.hasContent) {
          bad.push({ i, a: short(a), b: short(b) });
          if (bad.length > 3) break;
        }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("600 panel inputs identical");
    });

    await t("inline vs module: composePanelPrompt agrees on degenerate inputs", () => {
      const cases = [undefined, null, {}, { chars: null }, { chars: [] }, { chars: [null, null] }, { locKey: "none" }, { override: { pos: "", neg: "" } }, { chars: [{ base: undefined, extra: undefined }] }];
      const bad = cases.filter((c) => JSON.stringify(inline.composePanelPrompt(c)) !== JSON.stringify(mod.composePanelPrompt(c)));
      return bad.length ? no(JSON.stringify(bad).slice(0, 200)) : ok(cases.length + " degenerate inputs identical");
    });
  },

  "src/core/library-core.js": async (mod) => {
    const refPool = ["lib:char:abc", "lib:loc:", "lib:", "lib", "lib:char:abc:def", "LIB:char:x", "", "none", null, undefined, 0, 7, "char:abc", " lib:char:x", "lib:act:zzz", "lib:char:null", "lib:char:undefined", "lib:char:0", "lib::", "lib:char:" + "x".repeat(60), "lib:obj:q"];

    await t("inline vs module: libIdFor agrees on 300 (type, now, rand) triples", () => {
      const types = ["Character", "Location", "Action", "Bogus", "", null, undefined, 0, "char", "loc"];
      const bad = [];
      for (let i = 0; i < 300; i++) {
        const type = types[rint(types.length)];
        const now = rint(2) ? 1699999999999 + rint(1000) : rint(1000000);
        const rand = rnd() < 0.5 ? rnd().toString(36).slice(2, 7) : String(rint(1000));
        const a = inline.libIdFor(type, now, rand);
        const b = mod.libIdFor(type, now, rand);
        if (a !== b) { bad.push({ type, now, rand, a, b }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("300 ids identical");
    });

    await t("inline vs module: isLibRef/parseLibRef/libRefValue agree on 400 values", () => {
      const bad = [];
      for (let i = 0; i < 400; i++) {
        const v = refPool[rint(refPool.length)];
        const rows = [
          ["isLibRef", String(inline.isLibRef(v)), String(mod.isLibRef(v))],
          ["parseLibRef", JSON.stringify(inline.parseLibRef(v)), JSON.stringify(mod.parseLibRef(v))],
          ["libRefValue", String(inline.libRefValue(v, v)), String(mod.libRefValue(v, v))],
          ["libRefNeedles", JSON.stringify(inline.libRefNeedles(v)), JSON.stringify(mod.libRefNeedles(v))]
        ];
        for (const row of rows) if (row[1] !== row[2]) { bad.push({ i, fn: row[0], v, a: row[1], b: row[2] }); break; }
        if (bad.length > 3) break;
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("400 values x 4 helpers identical");
    });

    await t("inline vs module: countLibRefs agrees on 250 random documents", () => {
      const ids = ["a", "char-1", "", "x".repeat(12)];
      const makeDoc = () => {
        const pages = {};
        const np = rint(4);
        for (let p = 1; p <= np; p++) {
          const page = { panelCountSel: String(1 + rint(6)) };
          const npan = rint(6);
          for (let i = 1; i <= npan; i++) {
            const slots = [];
            const ns = rint(4);
            for (let s = 0; s < ns; s++) slots.push(refPool[rint(refPool.length)]);
            page[i] = { chars: slots.map((sel) => ({ sel, base: "", extra: "" })), loc: refPool[rint(refPool.length)], action: "a", imgCount: String(rint(4)) };
          }
          pages[p] = page;
        }
        return { version: 2, settings: { pages: pages }, libObjects: [{ id: ids[rint(ids.length)], name: "n" }] };
      };
      const bad = [];
      for (let n = 0; n < 250; n++) {
        const doc = makeDoc();
        const id = ids[rint(ids.length)];
        const a = inline.countLibRefs(doc, id);
        const b = mod.countLibRefs(doc, id);
        if (a !== b) { bad.push({ n, id, a, b }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("250 documents, counts identical");
    });

    await t("inline vs module: extractLibraryItems agrees on 200 documents (v2, legacy, junk)", () => {
      const bad = [];
      for (let n = 0; n < 200; n++) {
        const kind = rint(4);
        let data;
        if (kind === 0) {
          data = { libObjects: [{ id: "loc-1", name: " N ", desc: " d " }, { id: "act-2", type: "Action", name: "", desc: "x" }, { id: "zzz", type: "Bogus", name: "B", desc: "" }, { id: "char-3" }, null, "junk", { id: "loc-9", name: 5, desc: 7 }] };
        } else if (kind === 1) {
          data = { charLibrary: [{ name: "A", desc: "d" }], locLibrary: [{ name: "L" }], actLibrary: [{ desc: "act" }] };
        } else if (kind === 2) {
          data = rnd() < 0.5 ? null : [1, 2, 3];
        } else {
          data = { libObjects: Array.from({ length: rint(5) }, () => ({ id: ["loc-x", "act-y", "char-z", "", "q"][rint(5)], name: ["", " n ", "nn"][rint(3)], desc: ["", " d", "dd"][rint(3)] })) };
        }
        const a = JSON.stringify(inline.extractLibraryItems(data));
        const b = JSON.stringify(mod.extractLibraryItems(data));
        if (a !== b) { bad.push({ n, kind, a: a.slice(0, 80), b: b.slice(0, 80) }); if (bad.length > 2) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("200 documents identical");
    });

    await t("inline vs module: libRefEntry/libRefDesc agree on 200 lookups", () => {
      const objs = [{ id: "a", desc: "da" }, { id: "b" }, { id: "c", desc: "" }, { id: "d", desc: 5 }, null, { id: "loc-q", desc: "dq" }];
      const sels = ["lib:char:a", "lib:char:b", "lib:char:c", "lib:char:d", "lib:char:missing", "lib:loc:loc-q", "none", "", null, "lib:char:null", "lib:char:"];
      const bad = [];
      for (let i = 0; i < 200; i++) {
        const sel = sels[rint(sels.length)];
        const a = String(inline.libRefDesc(objs, sel)) + "|" + JSON.stringify(inline.libRefEntry(objs, sel));
        const b = String(mod.libRefDesc(objs, sel)) + "|" + JSON.stringify(mod.libRefEntry(objs, sel));
        if (a !== b) { bad.push({ i, sel, a, b }); if (bad.length > 3) break; }
      }
      return bad.length ? no(JSON.stringify(bad).slice(0, 230)) : ok("200 lookups identical");
    });

    await t("inline vs module: the type table and normalizeLibType agree", () => {
      const same = JSON.stringify(mod.LIB_TYPE_PREFIX) === JSON.stringify(inline.LIB_TYPE_PREFIX);
      const cases = [{ id: "loc-1" }, { id: "act-2" }, { id: "char-3" }, { id: "zzz" }, { id: "loc-" }, { id: "" }, { id: 5 }, { type: "Location" }, { type: "Bogus", id: "act-9" }, {}, null, { id: "actor" }];
      const bad = cases.filter((o) => inline.normalizeLibType(o) !== mod.normalizeLibType(o));
      return same && !bad.length ? ok("10 types, " + cases.length + " objects identical") : no("table same: " + same + ", cases: " + JSON.stringify(bad).slice(0, 120));
    });
  },
};

const surface = {
  "src/core/zip.js": ["initCrcTable", "crc32", "dataUrlToBytes", "buildZip", "inflateRawDeflate", "unzipEntries"],
  "src/core/jsontext.js": ["jsonTokenize", "jsonDecodeRaw", "jsonParse"],
  "src/core/keywords.js": ["ART_STYLES", "COLOR_PALETTES", "DEFAULT_POS", "DEFAULT_NEGATIVES", "composeKeywords"],
  "src/core/seeds.js": ["panelSeedValue", "imageSeed", "scrubMinusOneSeeds"],
  "src/core/prompt.js": ["composePanelPrompt"],
  "src/core/library-core.js": ["LIB_TYPE_PREFIX", "libIdFor", "libRefValue", "isLibRef", "parseLibRef", "libRefNeedles", "countLibRefs", "normalizeLibType", "extractLibraryItems", "libRefEntry", "libRefDesc"],
  "src/core/schema.js": ["SCHEMA_VERSION", "PANEL_COUNT_OPTIONS", "newPanelId", "defaultChar", "defaultPanel", "defaultPage", "defaultProject", "normalise", "validate"],
};

const deletedInline = {
  "src/core/zip.js": ["initCrcTable", "crc32", "dataUrlToBytes", "buildZip", "inflateRawDeflate", "unzipEntries"],
  "src/core/jsontext.js": ["jsonTokenize", "jsonDecodeRaw", "jsonParse"],
  "src/core/keywords.js": ["ART_STYLES", "COLOR_PALETTES", "DEFAULT_POS", "DEFAULT_NEGATIVES", "composeKeywords"],
  "src/core/seeds.js": ["panelSeedValue", "imageSeed", "scrubMinusOneSeeds"],
};

const discovered = (await fs.listFiles()).filter((f) => f.path.startsWith("src/core/") && f.path.endsWith(".js")).map((f) => f.path).sort();
const unspecced = discovered.filter((p) => !specs[p] && !surface[p]);

if (extractionError) {
  T.push({ n: "extraction", ok: false, d: extractionError });
} else {
  for (const path of discovered) {
    if (!specs[path] && !surface[path]) continue;
    let mod = null;
    try { mod = await loadModule(path); } catch (e) { T.push({ n: path + ": module loads", ok: false, d: String(e && e.message).slice(0, 160) }); continue; }
    T.push({ n: path + ": module loads", ok: true, d: Object.keys(mod).sort().join(",") });
    if (specs[path]) {
      await specs[path](mod);
    } else {
      await t(path + ": exported surface", () => {
        const have = new Set(Object.keys(mod));
        const gaps = surface[path].filter((n) => !have.has(n));
        return gaps.length ? no("missing: " + gaps.join(", ")) : ok(surface[path].length + " exports");
      });
    }
  }
}

const manifestMatch = src.match(/const GH_SRC_FILES = \[([^\]]*)\]/);
const manifest = manifestMatch ? manifestMatch[1].split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean) : null;
await t("every extracted src/core module is in the ghPush src manifest", () => {
  if (!manifest) return no("GH_SRC_FILES not found in index.html");
  const missingFromManifest = discovered.filter((p) => !manifest.includes(p));
  return missingFromManifest.length ? no("not listed: " + missingFromManifest.join(", ")) : ok(manifest.length + " files listed, all " + discovered.length + " modules covered");
});

await t("the deleted inline copies are really gone from index.html", () => {
  const still = [];
  for (const p of Object.keys(deletedInline)) for (const n of deletedInline[p]) if (at(n) >= 0) still.push(p + ":" + n);
  const total = Object.keys(deletedInline).reduce((a, k) => a + deletedInline[k].length, 0);
  return still.length ? no("still defined: " + still.join(", ")) : ok(total + " names, no in-file implementation left");
});

await t("index.html still declares every name the modules provide", () => {
  const decls = ["initCrcTable", "crc32", "dataUrlToBytes", "buildZip", "inflateRawDeflate", "unzipEntries", "jsonTokenize", "jsonDecodeRaw", "jsonParse", "ART_STYLES", "COLOR_PALETTES", "DEFAULT_POS", "DEFAULT_NEGATIVES", "composeKeywords", "panelSeedValue", "imageSeed", "scrubMinusOneSeeds", "newPanelId", "defaultPanel", "defaultPage", "defaultProject", "normaliseProject", "validateProject"];
  const gaps = decls.filter((n) => !new RegExp("(?:let|var|const)[^;\\n]*\\b" + n + "\\b").test(src));
  return gaps.length ? no("no declaration for: " + gaps.join(", ")) : ok(decls.length + " names declared");
});

const pass = T.filter((x) => x.ok === true).length;
const fail = T.filter((x) => x.ok === false).length;
const report = {
  discovered,
  unspecced,
  manifest,
  deletedInline,
  extraction: { wanted: inlineWanted, missing, chars: inlineCode.length },
  pass, fail,
  failures: T.filter((x) => x.ok === false),
  checks: T,
};
await fs.writeTextFile("scratch/p0/diff-core.json", JSON.stringify(report, null, 2));
return { discovered, unspecced, missing, pass, fail, failures: report.failures, checks: T.map((x) => (x.ok === true ? "PASS " : x.ok === null ? "SKIP " : "FAIL ") + x.n + (x.d ? "  [" + x.d + "]" : "")) };
