window.confirm = () => true;
window.alert = () => {};
window.prompt = () => null;

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = () => sleep(420);
const mkTiny = (color) => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  const x = c.getContext("2d");
  x.fillStyle = color;
  x.fillRect(0, 0, 2, 2);
  return c.toDataURL("image/png");
};
const TINY = mkTiny("#dd2222");
const TINY2 = mkTiny("#2222dd");

const GROUPS = {
  G15: "the generation engine against a stubbed service",
  G16: "pause, stop, protection and the run tally",
  G17: "the background-generation gate and the image slot flags",
  MAN: "not automatable - manual check",
};

const T = [];
const rejections = [];
window.addEventListener("unhandledrejection", (e) => rejections.push(String((e.reason && e.reason.message) || e.reason)));
async function t(name, fn) {
  const skips = window.__genSkip || [];
  if (skips.some((s) => name.includes(s))) { T.push({ g: name.slice(0, 3), n: name, ok: null, d: "skipped by request" }); return; }
  try {
    try { sessionStorage.setItem("__gen_at", name); } catch (e) {}
    const r = await fn();
    if (r && r.skip) { T.push({ g: name.slice(0, 3), n: name, ok: null, d: String(r.skip) }); return; }
    const good = r === undefined ? true : r && typeof r === "object" ? !!r.ok : !!r;
    T.push({ g: name.slice(0, 3), n: name, ok: good, d: r && typeof r === "object" && r.d !== undefined ? String(r.d).slice(0, 260) : "" });
  } catch (e) {
    T.push({ g: name.slice(0, 3), n: name, ok: false, d: "THROW " + (e && e.message) });
  }
}
const ok = (d) => ({ ok: true, d: d === undefined ? "" : d });
const no = (d) => ({ ok: false, d: d === undefined ? "" : d });
const eq = (a, b, what) => (a === b ? ok(what + " = " + JSON.stringify(a)) : no(what + ": expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)));
const eqArr = (a, b, what) => (JSON.stringify(a) === JSON.stringify(b) ? ok(what + " = " + JSON.stringify(a)) : no(what + ": expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)));
const setVal = (id, v) => {
  const el = $(id);
  if (!el) return null;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return el;
};
const getVal = (id) => { const el = $(id); return el ? el.value : null; };
const src = (i, k) => { const el = $("img-panel-" + i + "-" + k); return el ? el.getAttribute("src") : null; };
const waitSrc = async (i, k, ms) => {
  const limit = ms || 1600;
  for (let waited = 0; waited < limit; waited += 80) {
    const s = src(i, k);
    if (s) return s;
    await sleep(80);
  }
  return src(i, k);
};
const boxClass = (i, k) => { const el = $("imgbox-panel-" + i + "-" + k); return el ? el.className : ""; };
const cardClass = (i) => { const el = $("panel-card-" + i); return el ? el.className : ""; };
const isLocked = (i, k) => /protected/.test(boxClass(i, k));
const unlock = async (i, k) => { if (isLocked(i, k)) { toggleSlotProtect(i, k); await sleep(150); } };
const setBgPref = async (on) => { $("prefBgGenerate").checked = !!on; onPrefBgGenerateChange(); await sleep(200); };

const svc = { calls: [], mode: "ok", stopped: 0, pending: null, n: 0 };
function stubOk() {
  svc.mode = "ok";
  root.generateImage = async (opts) => { svc.calls.push(opts); svc.n++; return { dataUrl: (svc.n % 2) ? TINY : TINY2, inputs: opts }; };
}
function stubHang() {
  svc.mode = "hang";
  root.generateImage = (opts) => {
    svc.calls.push(opts);
    const p = new Promise((res, rej) => { svc.resolve = res; svc.reject = rej; });
    p.stop = () => { svc.stopped++; };
    svc.pending = p;
    return p;
  };
}
function stubFail() {
  svc.mode = "fail";
  root.generateImage = async (opts) => { svc.calls.push(opts); throw new Error("P0 stub failure"); };
}
const reset = () => { svc.calls.length = 0; svc.stopped = 0; };

const charValue = () => {
  const sel = $("panel-char-select-1-1");
  const opts = sel ? [...sel.options].map((o) => o.value) : [];
  return opts.find((v) => v.indexOf("lib:char:") === 0) || "none";
};
async function seedPanel(i, text) {
  setVal("panel-char-select-" + i + "-1", charValue());
  setVal("panel-char-base-" + i + "-1", text);
  setVal("panel-act-" + i, "action for panel " + i);
  await sleep(120);
}
async function blankPanel(i) {
  setVal("panel-char-select-" + i + "-1", "none");
  setVal("panel-loc-select-" + i, "none");
  setVal("panel-char-base-" + i + "-1", "");
  setVal("panel-act-" + i, "");
  await sleep(120);
}

async function run() {
  setVal("projectNameInput", "P0 Generation");
  setVal("seedInput", "");
  setVal("imageSizeSel", "512x512");
  await settle();
  const totalPanels = [...document.querySelectorAll('[id^="panel-card-"]')].filter((el) => el.style.display !== "none").length;

  const origRoot = root.generateImage;

  await t("G15: 1 a panel with no content is skipped without calling the service", async () => {
    stubOk();
    await blankPanel(1);
    reset();
    const r = await generateSinglePanel(1);
    return eqArr([r, svc.calls.length, cardClass(1).includes("skipped")], ["skipped", 0, true], "result,calls,class");
  });

  await t("G15: 2 a content panel generates and reaches the service with the right options", async () => {
    stubOk();
    await seedPanel(1, "a distinctive hero ALPHA");
    reset();
    const r = await generateSinglePanel(1);
    const c = svc.calls[0] || {};
    const s = await waitSrc(1, 1);
    const good = r === "generated" && !!s && String(c.prompt).includes("distinctive hero ALPHA") && String(c.negativePrompt).includes("nsfw") && c.resolution === "512x512" && c.guidanceScale === 7;
    return good ? ok("result=" + r + " calls=" + svc.calls.length + " seed=" + c.seed) : no(JSON.stringify({ r, calls: svc.calls.length, hasSrc: !!s, res: c.resolution, gs: c.guidanceScale, prompt: String(c.prompt || "").slice(0, 90) }));
  });

  await t("G15: 3 four images get the panel seed and its offsets", async () => {
    stubOk();
    setVal("panel-img-count-1", "4");
    onPanelImgCountChange(1);
    setVal("panel-seed-1", "9000");
    await settle();
    reset();
    const r = await generateSinglePanel(1);
    const seeds = svc.calls.map((c) => c.seed);
    return eqArr([r, seeds], ["generated", [9000, 9001, 9002, 9003]], "result,seeds");
  });

  await t("G15: 4 the same-seed flag sends one seed for every image", async () => {
    stubOk();
    setPanelSameSeed(1, true);
    setVal("panel-img-count-1", "3");
    onPanelImgCountChange(1);
    await settle();
    reset();
    await generateSinglePanel(1);
    const seeds = svc.calls.map((c) => c.seed);
    setPanelSameSeed(1, false);
    return eqArr([seeds.length, new Set(seeds).size], [3, 1], "calls,distinctSeeds");
  });

  await t("G15: 5 a panel with no seed pins one and never sends -1", async () => {
    stubOk();
    setVal("panel-seed-1", "");
    setVal("seedInput", "");
    setVal("panel-img-count-1", "1");
    onPanelImgCountChange(1);
    await settle();
    reset();
    await generateSinglePanel(1);
    const pinned = getVal("panel-seed-1");
    const sent = svc.calls[0] && svc.calls[0].seed;
    const bad = svc.calls.filter((c) => c.seed === -1 || c.seed === undefined).length;
    return pinned && Number(pinned) >= 0 && Number(sent) === Number(pinned) && bad === 0 ? ok("pinned " + pinned + ", sent " + sent) : no("pinned=" + pinned + " sent=" + sent + " bad=" + bad);
  });

  await t("G15: 6 a protected slot survives regeneration", async () => {
    stubOk();
    setVal("panel-img-count-1", "3");
    onPanelImgCountChange(1);
    await settle();
    reset();
    await generateSinglePanel(1);
    const before = await waitSrc(1, 2);
    toggleSlotProtect(1, 2);
    await sleep(150);
    reset();
    const r = await generateSinglePanel(1);
    const kept = src(1, 2) === before && !!before;
    const touched = svc.calls.length;
    const status = $("statusEl").textContent;
    await unlock(1, 2);
    return eqArr([r, touched, kept, /protected/i.test(status)], ["generated", 2, true, true], "result,calls,kept,status=" + status.slice(0, 60));
  });

  await t("G15: 7 a fully protected panel is not regenerated at all", async () => {
    stubOk();
    setVal("panel-img-count-1", "2");
    onPanelImgCountChange(1);
    await settle();
    reset();
    await generateSinglePanel(1);
    toggleSlotProtect(1, 1);
    toggleSlotProtect(1, 2);
    await sleep(150);
    reset();
    const r = await generateSinglePanel(1);
    await unlock(1, 1);
    await unlock(1, 2);
    return eqArr([r, svc.calls.length], ["protected", 0], "result,calls");
  });

  await t("G15: 8 a failing service marks the slot failed and reports it", async () => {
    stubFail();
    setVal("panel-img-count-1", "1");
    onPanelImgCountChange(1);
    await settle();
    reset();
    let threw = null;
    try { await generateSinglePanel(1); } catch (e) { threw = e.message; }
    const failed = boxClass(1, 1).includes("failed");
    const alt = ($("img-panel-1-1") || {}).alt || "";
    return eqArr([failed, /P0 stub failure/.test(alt), svc.calls.length], [true, true, 1], "failed,alt,calls threw=" + threw);
  });

  await t("G15: 9 a single-slot generate writes only that slot", async () => {
    stubOk();
    setVal("panel-img-count-1", "2");
    onPanelImgCountChange(1);
    await settle();
    await generateSinglePanel(1);
    const s1 = await waitSrc(1, 1);
    const s2 = await waitSrc(1, 2);
    clearPanelImageSlot(1, 1);
    await sleep(200);
    reset();
    await generateSinglePanelSlot(1, 1);
    const r1 = await waitSrc(1, 1);
    const r2 = src(1, 2);
    return eqArr([svc.calls.length, !!r1, r2 === s2], [1, true, true], "calls,slot1Filled,slot2Untouched wasFilled=" + !!s1);
  });

  await t("G15: 10 the run is recorded in the prompt history with its seeds", async () => {
    stubOk();
    setVal("panel-img-count-1", "2");
    onPanelImgCountChange(1);
    setVal("panel-seed-1", "1234");
    await settle();
    reset();
    await generateSinglePanel(1);
    await sleep(250);
    const list = $("gp-list-1");
    const txt = list ? list.textContent : "";
    const has = txt.includes("1234");
    return eqArr([svc.calls.length, has], [2, true], "calls,historyMentionsSeed text=" + txt.slice(0, 80));
  });

  await t("G16: 11 pausing a run settles it without leaving a panel generating", async () => {
    stubHang();
    setVal("panel-img-count-1", "2");
    onPanelImgCountChange(1);
    await settle();
    reset();
    const runP = generateComicPage();
    await sleep(300);
    pauseGenerations();
    await runP;
    await sleep(300);
    const stuck = [1, 2].some((k) => boxClass(1, k).includes("generating"));
    const status = $("statusEl").textContent;
    const stopped = svc.stopped;
    stubOk();
    return eqArr([stuck, /paused|Paused/.test(status), rejections.length], [false, true, 0], "stuck,status=" + status.slice(0, 50) + ",rejections stopCalls=" + stopped);
  });

  await t("G16: 12 stopping a run clears the resume state", async () => {
    stubHang();
    await seedPanel(2, "beta");
    reset();
    const runP = generateComicPage();
    await sleep(300);
    haltGenerations();
    await runP;
    await sleep(300);
    const status = $("statusEl").textContent;
    const stuck = [1, 2].some((k) => boxClass(1, k).includes("generating"));
    const stopDisabled = $("globalStopBtn").disabled;
    stubOk();
    return eqArr([stuck, /Stopped/.test(status), stopDisabled], [false, true, true], "stuck,status=" + status.slice(0, 50) + ",stopDisabled");
  });

  await t("G16: 13 a page-wide run reports generated, skipped and protected", async () => {
    stubOk();
    await seedPanel(1, "gamma");
    await blankPanel(2);
    await seedPanel(3, "delta");
    await seedPanel(4, "epsilon");
    setVal("panel-img-count-1", "1");
    setVal("panel-img-count-3", "1");
    setVal("panel-img-count-4", "1");
    await settle();
    await generateSinglePanel(4);
    toggleSlotProtect(4, 1);
    await sleep(150);
    reset();
    await generateComicPage();
    await sleep(400);
    const status = $("statusEl").textContent;
    const good = /generated 2/.test(status) && /skipped 1/.test(status) && /protected 1/.test(status);
    await unlock(4, 1);
    return good ? ok(status.slice(0, 90)) : no(status.slice(0, 120));
  });

  await t("G17: 14 with the preference on, going to the background does not stop a run", async () => {
    await setBgPref(true);
    stubHang();
    reset();
    const runP = generateComicPage();
    await sleep(300);
    const inFlight = svc.stopped;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    await sleep(250);
    const afterHidden = { stopped: svc.stopped, generating: boxClass(1, 1).includes("generating"), status: $("statusEl").textContent.slice(0, 60) };
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
    haltGenerations();
    await runP.catch(() => {});
    await sleep(400);
    stubOk();
    return eqArr([afterHidden.stopped === inFlight, afterHidden.generating], [true, true], "unchanged,stillGenerating status=" + afterHidden.status);
  });

  await t("G17: 15 with the preference off, going to the background stops the run", async () => {
    await setBgPref(false);
    stubHang();
    reset();
    const runP = generateComicPage();
    await sleep(300);
    const before = svc.stopped;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    await sleep(300);
    const stopped = svc.stopped;
    const paused = boxClass(1, 1).includes("paused");
    const status = $("statusEl").textContent;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
    haltGenerations();
    await runP.catch(() => {});
    await sleep(400);
    await setBgPref(true);
    stubOk();
    return eqArr([stopped > before, paused, /background/i.test(status)], [true, true, true], "stoppedInFlight,pausedBox,status=" + status.slice(0, 55));
  });

  await t("G17: 16 the representative star moves between slots", async () => {
    stubOk();
    setVal("panel-img-count-1", "3");
    onPanelImgCountChange(1);
    await settle();
    await generateSinglePanel(1);
    const s1 = await waitSrc(1, 1);
    const s2 = await waitSrc(1, 2);
    const distinct = !!s1 && !!s2 && s1 !== s2;
    makeRepresentative(1, 2);
    await sleep(400);
    const now1 = await waitSrc(1, 1);
    const now2 = await waitSrc(1, 2);
    const swapped = now1 === s2 && now2 === s1;
    makeRepresentative(1, 1);
    await sleep(150);
    return eqArr([distinct, swapped, /rep/.test(boxClass(1, 1))], [true, true, true], "distinct,swapped,slot1IsRepresentative");
  });

  await t("G17: 17 clearing a single slot also clears its protection", async () => {
    stubOk();
    setVal("panel-img-count-1", "2");
    onPanelImgCountChange(1);
    await settle();
    await generateSinglePanel(1);
    toggleSlotProtect(1, 1);
    await settle();
    const protectedBefore = /protected/.test(boxClass(1, 1));
    clearPanelImageSlot(1, 1);
    await settle();
    const cleared = !src(1, 1) && !/protected/.test(boxClass(1, 1));
    return eqArr([protectedBefore, cleared], [true, true], "protectedThenCleared before=" + boxClass(1, 1));
  });

  await t("G17: 18 clearing a panel's images leaves other panels alone", async () => {
    stubOk();
    await seedPanel(2, "zeta");
    setVal("panel-img-count-2", "1");
    await settle();
    await generateSinglePanel(2);
    const kept = await waitSrc(2, 1);
    clearPanelImages(1);
    await sleep(250);
    return eqArr([!!kept, !src(1, 1), !!src(2, 1)], [true, true, true], "panel1Cleared,panel2Intact");
  });

  await t("MAN: 19 image copy, download and upscale paths", () => {
    return { skip: "copyImageToAction/openPanelAll/savePanelAll touch the clipboard, the file system and canvas; checked by hand instead" };
  });

  root.generateImage = origRoot;
  const pass = T.filter((x) => x.ok === true).length;
  const fail = T.filter((x) => x.ok === false).length;
  const manual = T.filter((x) => x.ok === null).length;
  try { sessionStorage.removeItem("__gen_at"); } catch (e) {}
  return {
    pass, fail, manual,
    failures: T.filter((x) => x.ok === false),
    manualChecks: T.filter((x) => x.ok === null).map((x) => x.n),
    rejections,
    groups: GROUPS,
    checks: T,
  };
}

return await run();
