const strip = (s) => s.replace(/\nreturn window\.__park\.park\(\);\s*$/, "\n");
const parkBody = strip(await fs.readTextFile("devtests/park.js"));
const suite = await fs.readTextFile("devtests/fixtures.page.js");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const FNVSrc = 'function __fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*0x01000193)>>>0;}return h.toString(16).padStart(8,"0");}function __map(){const m={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=="__test_backup_v10")m[k]=localStorage.getItem(k);}return m;}function __hash(){const m=__map();return __fnv(Object.keys(m).sort().map(k=>k+"="+m[k]).join("\\n"));}';
const fnvOf = (map) => {
  let h = 0x811c9dc5;
  const s = Object.keys(map).sort().map((k) => k + "=" + map[k]).join("\n");
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
};

const report = { stamp };
let parkedMap = null;
try {
  await tools.page_eval({ js: parkBody + "\nreturn window.__park.park();" });
  const dump = await tools.page_eval({ js: "const m={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=='__test_backup_v10')m[k]=localStorage.getItem(k);}return m;" });
  parkedMap = dump.result || {};
  await fs.writeTextFile("scratch/p0/parks/fixtures-" + stamp + ".json", JSON.stringify(parkedMap, null, 1));
  await fs.writeTextFile("scratch/p0/last-park.json", JSON.stringify(parkedMap, null, 1));
  report.parkedHash = fnvOf(parkedMap);
} catch (e) { report.parkFailed = String(e && e.message || e); }

const defs = [
  { name: "full-page", path: "fixtures/full-page.json" },
  { name: "legacy-v1", path: "fixtures/legacy-v1.json" },
  { name: "legacy-keys", path: "fixtures/legacy-keys.json" },
];
const fx = [];
for (const d of defs) fx.push({ name: d.name, text: await fs.readTextFile(d.path) });
const inject = "window.__fixtures = " + JSON.stringify(fx) + ";\n";

let results = null;
try {
  const r = await tools.page_eval({ js: inject + parkBody + "\n" + suite, timeoutMs: 420000 });
  if (r.ok && r.result && r.result.checks) {
    results = r.result;
    await fs.writeTextFile("scratch/p0/fixture-results.json", JSON.stringify(results, null, 2));
  } else {
    report.suiteFailed = r.error || "no result shape";
  }
  report.perchanceErrors = (r.perchanceErrors || []).length;
  report.consoleTail = (r.consoleOutput || []).slice(-6).map((c) => String(c).slice(0, 160));
} catch (e) { report.suiteFailed = String(e && e.message || e); }

let restored = false;
try {
  const res = await tools.page_eval({ js: "return window.__park.restore();" });
  restored = !!(res.result && res.result.byteIdentical);
  report.restoreResult = res.result && { hash: res.result.hash, byteIdentical: res.result.byteIdentical, keys: (res.result.keys || []).length, strays: res.result.strays };
} catch (e) { report.restoreFailed = String(e && e.message || e).slice(0, 200); }

if (!restored && parkedMap) {
  try { await tools.page_refresh({}); } catch (e) {}
  const wb = await tools.page_eval({
    js: "const B = " + JSON.stringify(parkedMap) + ";\nconst live=[];for(let i=0;i<localStorage.length;i++)live.push(localStorage.key(i));\nfor(const k of live)localStorage.removeItem(k);\nfor(const k of Object.keys(B))localStorage.setItem(k,B[k]);\nreturn {written:Object.keys(B).length};",
  });
  report.writeBack = wb.result;
}

try { await tools.page_refresh({}); } catch (e) {}
const ver = await tools.page_eval({ js: FNVSrc + " return { hash: __hash(), project: (JSON.parse(localStorage.getItem('comicGen.panelState')||'{}').projectName||null), strays: Object.keys(__map()).filter(k=>k.startsWith('__')) };" });
report.afterReload = ver.result;
report.byteIdentical = !!(parkedMap && ver.result && fnvOf(parkedMap) === ver.result.hash);

if (results) {
  report.summary = { pass: results.pass, fail: results.fail };
  report.failures = (results.failures || []).map((f) => f.n.slice(0, 40) + " :: " + f.d.slice(0, 200));
}
return report;