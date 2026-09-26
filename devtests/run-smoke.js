const strip = (s) => s.replace(/\nreturn window\.__park\.park\(\);\s*$/, "\n");
const parkBody = strip(await fs.readTextFile("devtests/park.js"));
const suiteSrc = await fs.readTextFile("devtests/smoke.page.js");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const FNVSrc = 'function __fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*0x01000193)>>>0;}return h.toString(16).padStart(8,"0");}function __map(){const m={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=="__test_backup_v10")m[k]=localStorage.getItem(k);}return m;}function __hash(){const m=__map();return __fnv(Object.keys(m).sort().map(k=>k+"="+m[k]).join("\\n"));}';
const fnvOf = (map) => {
  let h = 0x811c9dc5;
  const s = Object.keys(map).sort().map((k) => k + "=" + map[k]).join("\n");
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
};

const report = { stamp, steps: [] };
let parkedMap = null;
try {
  const parked = await tools.page_eval({ js: parkBody + "\nreturn window.__park.park();" });
  report.parked = parked.result;
  const dump = await tools.page_eval({ js: "const m={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=='__test_backup_v10')m[k]=localStorage.getItem(k);}return m;" });
  parkedMap = dump.result || {};
  await fs.writeTextFile("scratch/p0/parks/park-" + stamp + ".json", JSON.stringify(parkedMap, null, 1));
  await fs.writeTextFile("scratch/p0/last-park.json", JSON.stringify(parkedMap, null, 1));
  report.parkedHash = fnvOf(parkedMap);
  report.parkedKeys = Object.keys(parkedMap).length;
  report.steps.push("parked");
} catch (e) {
  report.parkFailed = String(e && e.message || e);
}

let results = null;
try {
  const r = await tools.page_eval({ js: parkBody + "\n" + suiteSrc, timeoutMs: 480000 });
  if (r.ok && r.result && r.result.checks) {
    results = r.result;
    await fs.writeTextFile("scratch/p0/smoke-results.json", JSON.stringify(results, null, 2));
  } else {
    report.suiteFailed = r.error || "no result shape";
  }
  report.perchanceErrors = (r.perchanceErrors || []).length;
} catch (e) {
  report.suiteFailed = String(e && e.message || e);
}
report.steps.push("suite done");

try {
  const chk = await tools.page_eval({ js: "return window.__park.check();" });
  report.beforeRestore = chk.result;
} catch (e) { report.checkFailed = String(e && e.message || e).slice(0, 120); }

let restored = false;
try {
  const res = await tools.page_eval({ js: "return window.__park.restore();" });
  restored = !!(res.result && res.result.byteIdentical);
  report.restoreResult = res.result;
} catch (e) {
  report.restoreFailed = String(e && e.message || e).slice(0, 160);
}

if (!restored && parkedMap) {
  try { await tools.page_refresh({}); } catch (e) {}
  const writeBack = await tools.page_eval({
    js: "const B = " + JSON.stringify(parkedMap) + ";\n" +
      "const live = []; for (let i = 0; i < localStorage.length; i++) live.push(localStorage.key(i));\n" +
      "for (const k of live) localStorage.removeItem(k);\n" +
      "for (const k of Object.keys(B)) localStorage.setItem(k, B[k]);\n" +
      "return { written: Object.keys(B).length, strays: Object.keys(B).filter(k => k.startsWith('__')) };",
  });
  report.writeBack = writeBack.result;
}
report.steps.push("restored");

try { await tools.page_refresh({}); } catch (e) {}
const ver = await tools.page_eval({ js: FNVSrc + " return { hash: __hash(), keys: Object.keys(__map()).length, strays: Object.keys(__map()).filter(k=>k.startsWith('__')), project: (JSON.parse(localStorage.getItem('comicGen.panelState')||'{}').projectName||null) };" });
report.afterReload = ver.result;
report.byteIdentical = !!(parkedMap && ver.result && fnvOf(parkedMap) === ver.result.hash);
report.steps.push("verified");

if (results) {
  report.summary = { pass: results.pass, fail: results.fail, manual: results.manual, stamp: results.stamp };
  report.failures = (results.failures || []).map((f) => f.n.slice(0, 64) + " :: " + f.d.slice(0, 150));
}
return report;