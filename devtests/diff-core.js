const src = await fs.readTextFile("index.html");
const lines = src.split("\n");

function at(name) {
  for (const kind of ["function", "const", "let", "var"]) {
    const re = new RegExp("^\\s*(?:async\\s+)?(?:function|const|let|var)\\s+" + name + "\\s*[=(]");
    const i = lines.findIndex((l) => re.test(l));
    if (i >= 0) return i;
  }
  return -1;
}

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
  "src/core/prompt.js": ["composePanelPrompt"],
  "src/core/library-core.js": ["LIB_TYPE_PREFIX", "libIdFor", "libRefValue", "isLibRef", "parseLibRef", "libRefNeedles", "countLibRefs", "libRefEntry", "libRefDesc", "normalizeLibType", "extractLibraryItems"],
};

const declaredNames = ["initCrcTable", "crc32", "dataUrlToBytes", "buildZip", "inflateRawDeflate", "unzipEntries", "jsonTokenize", "jsonDecodeRaw", "jsonParse", "ART_STYLES", "COLOR_PALETTES", "DEFAULT_POS", "DEFAULT_NEGATIVES", "composeKeywords", "panelSeedValue", "imageSeed", "scrubMinusOneSeeds", "composePanelPrompt", "LIB_TYPE_PREFIX", "libIdFor", "libRefValue", "isLibRef", "parseLibRef", "libRefNeedles", "countLibRefs", "libRefEntry", "libRefDesc", "normalizeLibType", "extractLibraryItems", "newPanelId", "defaultPanel", "defaultPage", "defaultProject", "normaliseProject", "validateProject"];

const discovered = (await fs.listFiles()).filter((f) => f.path.startsWith("src/core/") && f.path.endsWith(".js")).map((f) => f.path).sort();
const unspecced = discovered.filter((p) => !surface[p]);

for (const path of discovered) {
  if (!surface[path]) continue;
  let mod = null;
  try { mod = await loadModule(path); } catch (e) { T.push({ n: path + ": module loads", ok: false, d: String(e && e.message).slice(0, 160) }); continue; }
  T.push({ n: path + ": module loads", ok: true, d: Object.keys(mod).sort().join(", ") });
  await t(path + ": exported surface", () => {
    const have = new Set(Object.keys(mod));
    const gaps = surface[path].filter((n) => !have.has(n));
    return gaps.length ? no("missing: " + gaps.join(", ")) : ok(surface[path].length + " exports");
  });
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
  const gaps = declaredNames.filter((n) => !new RegExp("(?:let|var|const)[^;\\n]*\\b" + n + "\\b").test(src));
  return gaps.length ? no("no declaration for: " + gaps.join(", ")) : ok(declaredNames.length + " names declared");
});

const pass = T.filter((x) => x.ok === true).length;
const fail = T.filter((x) => x.ok === false).length;
const report = { discovered, unspecced, manifest, deletedInline, pass, fail, failures: T.filter((x) => x.ok === false), checks: T };
await fs.writeTextFile("scratch/p0/diff-core.json", JSON.stringify(report, null, 2));
return { discovered, unspecced, pass, fail, failures: report.failures, checks: T.map((x) => (x.ok === true ? "PASS " : x.ok === null ? "SKIP " : "FAIL ") + x.n + (x.d ? "  [" + x.d + "]" : "")) };
