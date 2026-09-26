const strip = (s) => s.replace(/\nreturn window\.__park\.park\(\);\s*$/, "\n");
const parkBody = strip(await fs.readTextFile("devtests/park.js"));
const fixtureText = await fs.readTextFile("fixtures/full-page.json");
const fnvOf = (map) => {
  let h = 0x811c9dc5;
  const s = Object.keys(map).sort().map((k) => k + "=" + map[k]).join("\n");
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
};
const CAPTURE = 'const m = await import("https://ai-agent.perchance.org/files/snapshot.js"); return await m.capture(document.body, { scale: 0.5 });';
const report = { pages: [], restore: null, byteIdentical: null };
const OUT = "scratch/shots-new/";

const plans = [
  { name: "desktop-dark", size: [1440, 900], theme: "dark", subjects: ["grid", "json", "analysis", "dialog", "storyboard", "focus"] },
  { name: "desktop-light", size: [1440, 900], theme: "light", subjects: ["grid", "json", "analysis"] },
  { name: "phone-dark", size: [390, 844], theme: "dark", subjects: ["grid", "analysis", "focus"] },
  { name: "phone-light", size: [390, 844], theme: "light", subjects: ["grid", "dialog"] },
];
const subjects = {
  grid: "closeSingleView(); closeStoryboard(); closeAnalysis(); closeJsonEditor(); ghClose(); switchMenu('file'); window.scrollTo(0,0);",
  json: "closeSingleView(); closeStoryboard(); closeAnalysis(); openJsonEditor();",
  analysis: "closeSingleView(); closeStoryboard(); closeJsonEditor(); openAnalysis();",
  dialog: "closeSingleView(); closeStoryboard(); closeAnalysis(); closeJsonEditor(); ghClose(); clearPanelSelection(); for (const i of [1,2,3]) { const cb = document.getElementById('panel-select-' + i); if (cb) { cb.checked = true; cb.dispatchEvent(new Event('click', { bubbles: true })); } } batchDeletePanels();",
  storyboard: "closeSingleView(); closeAnalysis(); closeJsonEditor(); openStoryboard();",
  focus: "closeStoryboard(); closeAnalysis(); closeJsonEditor(); openSingleView(1);",
};
const dumpParked = "const m={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=='__test_backup_v10')m[k]=localStorage.getItem(k);}return m;";
await tools.page_eval({ js: parkBody + "\nreturn window.__park.park();" });
const parkedMap = (await tools.page_eval({ js: parkBody + "\n" + dumpParked })).result || {};
await fs.writeTextFile("scratch/p0/parks/visual.json", JSON.stringify(parkedMap, null, 1));
await fs.writeTextFile("scratch/p0/last-park.json", JSON.stringify(parkedMap, null, 1));
report.parkedHash = fnvOf(parkedMap);

const prelude = 'const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const $ = (id) => document.getElementById(id);\n' +
  'if ($("choiceOverlay") && !$("choiceOverlay").hidden) choiceDialogPick(null);\n' +
  'if (typeof clearPanelSelection === "function") clearPanelSelection();\n' +
  'await sleep(150);\n';
const setupJs = prelude +
  'const fx = ' + JSON.stringify(fixtureText) + ';\n' +
  'const input = $("importSettingsInput");\n' +
  'const dt = new DataTransfer(); dt.items.add(new File([fx], "baseline.json", { type: "application/json" })); input.files = dt.files;\n' +
  'input.dispatchEvent(new Event("change", { bubbles: true }));\n' +
  'await sleep(900);\n' +
  'const ov = $("importConfirmOverlay"); if (ov && !ov.hidden) { const b = [...ov.querySelectorAll("button")].find((x) => /continue/i.test(x.textContent)); if (b) b.click(); }\n' +
  'await sleep(1600);\n' +
  'switchPage(1); await sleep(400);\n' +
  'const sel = $("panelCount"); sel.value = "6"; sel.dispatchEvent(new Event("change")); updatePanelVisibility();\n' +
  'const gs = $("imageSizeSel"); gs.value = "768x768"; gs.dispatchEvent(new Event("change"));\n' +
  'await sleep(500);\n' +
  'closeSingleView(); closeStoryboard(); closeAnalysis(); closeJsonEditor(); ghClose();\n' +
  'return { name: $("projectNameInput").value, shown: [...document.querySelectorAll(\'[id^="panel-card-"]\')].filter((el) => el.style.display !== "none").length };';
report.setup = (await tools.page_eval({ js: setupJs })).result;

for (const plan of plans) {
  const [w, h] = plan.size;
  await tools.set_viewport_size({ width: w, height: h });
  let applied = false;
  for (let attempt = 0; attempt < 25; attempt++) {
    const v = await tools.page_eval({ js: "return { iw: innerWidth, ih: innerHeight };" });
    if (v.result && v.result.iw === w && v.result.ih === h) { applied = true; break; }
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!applied) { report.pages.push({ name: plan.name, error: "viewport not applied" }); continue; }
  for (const subject of plan.subjects) {
    const name = (w === 390 ? "phone" : "desktop") + "-" + plan.theme + "-" + subject;
    const js = prelude +
      'const s = $("themeModeSel"); s.value = "' + plan.theme + '"; s.dispatchEvent(new Event("change")); await sleep(320); window.scrollTo(0, 0); await sleep(220);\n' +
      subjects[subject] + "\nawait sleep(700);\n" +
      'return { ov: [...document.querySelectorAll(\'[id$=Overlay]\')].filter((o) => !o.hidden).map((o) => o.id), iw: innerWidth, ih: innerHeight };';
    const s = await tools.page_eval({ js });
    const r = await tools.page_eval({ js: CAPTURE, resultPath: OUT + name + ".png", timeoutMs: 120000 });
    report.pages.push({ name, dom: s.result, captured: !!(r.ok && !r.error), error: r.error || null });
  }
}

try { await tools.page_eval({ js: 'window.confirm = () => true; if (document.getElementById("choiceOverlay") && !document.getElementById("choiceOverlay").hidden) choiceDialogPick(null); clearPanelSelection(); closeSingleView(); closeStoryboard(); closeAnalysis(); closeJsonEditor(); ghClose(); return "closed";' }); } catch (e) {}
await tools.set_viewport_size({ reset: true }).catch(() => {});

let restored = false;
try {
  const res = await tools.page_eval({ js: "return window.__park.restore();" });
  restored = !!(res.result && res.result.byteIdentical);
  report.restore = res.result && res.result.byteIdentical;
} catch (e) { report.restoreError = String(e && e.message || e).slice(0, 120); }
if (!restored) {
  try { await tools.page_refresh({}); } catch (e) {}
  try { await tools.page_eval({ js: "const B = " + JSON.stringify(parkedMap) + ";\nconst live=[];for(let i=0;i<localStorage.length;i++)live.push(localStorage.key(i));\nfor(const k of live)localStorage.removeItem(k);\nfor(const k of Object.keys(B))localStorage.setItem(k,B[k]);\nreturn {written:Object.keys(B).length};" }); } catch (e) {}
}
try { await tools.page_refresh({}); } catch (e) {}
const ver = await tools.page_eval({ js: "const m={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=='__test_backup_v10')m[k]=localStorage.getItem(k);}return {project:(JSON.parse(m['comicGen.panelState']||'{}').projectName||null), keys:Object.keys(m).length, strays:Object.keys(m).filter(k=>k.startsWith('__')), map:m};" });
report.afterReload = { project: ver.result && ver.result.project, keys: ver.result && ver.result.keys, strays: ver.result && ver.result.strays };
report.byteIdentical = !!(ver.result && fnvOf(ver.result.map) === report.parkedHash);

const cmp = [];
for (const p of report.pages) {
  if (!p.captured) continue;
  const oldPath = "devtests/shots/" + p.name + ".png";
  const newPath = OUT + p.name + ".png";
  let oldBytes = null, newBytes = null;
  try { oldBytes = await fs.readFile(oldPath); } catch (e) { cmp.push({ name: p.name, error: "no baseline (" + e.message + ")" }); continue; }
  newBytes = await fs.readFile(newPath);
  const [a, b] = await Promise.all([createImageBitmap(new Blob([oldBytes])), createImageBitmap(new Blob([newBytes]))]);
  if (a.width !== b.width || a.height !== b.height) { cmp.push({ name: p.name, sizeChanged: a.width + "x" + a.height + " -> " + b.width + "x" + b.height }); continue; }
  const cv = new OffscreenCanvas(a.width, a.height);
  const ctx = cv.getContext("2d");
  ctx.drawImage(a, 0, 0);
  const da = ctx.getImageData(0, 0, a.width, a.height).data;
  ctx.clearRect(0, 0, a.width, a.height);
  ctx.drawImage(b, 0, 0);
  const db = ctx.getImageData(0, 0, a.width, b.height).data;
  let differing = 0, sum = 0, maxDelta = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
    if (d > 8) differing++;
    sum += d;
    if (d > maxDelta) maxDelta = d;
  }
  const px = da.length / 4;
  cmp.push({ name: p.name, px, differingPx: differing, differingPct: Math.round((differing / px) * 10000) / 100, meanDelta: Math.round((sum / px) * 100) / 100, maxDelta });
}
report.compare = cmp;
await fs.writeTextFile("scratch/p0/visual-diff.json", JSON.stringify(report, null, 2));
return {
  setup: report.setup,
  captured: report.pages.filter((p) => p.captured).length + "/" + report.pages.length,
  captureErrors: report.pages.filter((p) => !p.captured).map((p) => p.name + ":" + p.error),
  compare: cmp,
  identical: cmp.filter((c) => c.differingPx === 0).length,
  restore: report.restore,
  byteIdentical: report.byteIdentical,
  afterReload: report.afterReload,
};
