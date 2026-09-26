const target = "scratch/p0/last-park.json";
const text = await fs.readTextFile(target);
const map = JSON.parse(text);
const r = await tools.page_eval({
  js: "const B = " + JSON.stringify(map) + ";\n" +
    "const live = []; for (let i = 0; i < localStorage.length; i++) live.push(localStorage.key(i));\n" +
    "for (const k of live) localStorage.removeItem(k);\n" +
    "for (const k of Object.keys(B)) localStorage.setItem(k, B[k]);\n" +
    "return { written: Object.keys(B).length, name: JSON.parse(localStorage.getItem('comicGen.panelState') || '{}').projectName, strays: Object.keys(localStorage).filter(k => k.startsWith('__')) };",
});
return { from: target, keys: Object.keys(map).length, result: r.result, error: r.error || null };