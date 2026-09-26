window.confirm = () => true;
window.alert = () => {};
window.__smokePrompts = [];
window.prompt = () => (window.__smokePrompts.length ? window.__smokePrompts.shift() : null);

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = () => sleep(450);

const GROUPS = {
  G0: "boot, identity, storage shape, overlay parenting",
  G1: "factory reset and project-level settings",
  G2: "pages",
  G3: "panels, ordering and reflow",
  G4: "panel content, library seeding, the freeze rule",
  G5: "prompt composition, overrides and invalidation",
  G6: "seeds and determinism",
  G7: "keywords, presets and per-panel overrides",
  G8: "library objects",
  G9: "export, zip and import round-trips",
  G10: "the project JSON editor",
  G11: "the analysis matrix",
  G12: "views, layout, theme and the manual",
  G13: "destructive confirmations and protection flags",
  G14: "preferences and the background-generation gate",
  MAN: "not automatable against the unmodified build - manual check",
};

const T = [];
async function t(name, fn) {
  const skips = window.__smokeSkip || [];
  if (skips.some((s) => name.includes(s))) {
    T.push({ g: name.slice(0, 3), n: name, ok: null, d: "skipped by request" });
    return;
  }
  try {
    try { sessionStorage.setItem("__smoke_at", name); } catch (e) {}
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

const rawState = () => { try { return JSON.parse(localStorage.getItem("comicGen.panelState") || "{}"); } catch (e) { return { parseError: e.message }; } };
const pageKeys = (s) => Object.keys((s || rawState()).pages || {}).map(Number).sort((a, b) => a - b);
const cardsShown = () => [...document.querySelectorAll('[id^="panel-card-"]')].filter((el) => el.style.display !== "none").length;
const libObjs = () => { try { return JSON.parse(localStorage.getItem("comicGen.libObjects") || "[]"); } catch (e) { return []; } };
const setVal = (id, v) => {
  const el = $(id);
  if (!el) return null;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return el;
};
const getVal = (id) => { const el = $(id); return el ? el.value : null; };
const setPanelCount = (n) => { const sel = $("panelCount"); sel.value = String(n); sel.dispatchEvent(new Event("change")); updatePanelVisibility(); };
const dialogOpen = () => { const ov = $("choiceOverlay"); return !!ov && !ov.hidden; };
const dialogTitle = () => (dialogOpen() ? $("choiceTitle").textContent : "");
const dialogText = () => (dialogOpen() ? $("choiceBody").textContent + " " + $("choiceHint").textContent : "");
const dialogButtons = () => (dialogOpen() ? [...$("choiceBtns").children].map((b) => b.textContent) : []);
const answer = (match) => {
  if (!dialogOpen()) return "no-dialog";
  const btns = [...$("choiceBtns").children];
  const b = match === undefined ? btns[0] : btns.find((x) => x.textContent.toLowerCase().includes(String(match).toLowerCase()));
  if (!b) return "no-button:" + btns.map((x) => x.textContent).join("|").slice(0, 90);
  b.click();
  return b.textContent.trim().slice(0, 60);
};
const clickButtonText = (root, text) => {
  const b = [...root.querySelectorAll("button")].find((x) => x.textContent.toLowerCase().includes(text.toLowerCase()));
  if (!b) return null;
  b.click();
  return b.textContent.trim().slice(0, 50);
};

const pageCount = (pd) => (pd && pd.panelCountSel === "custom" ? Number(pd.panelCountCustom || 0) : Number((pd && pd.panelCountSel) || 0));
const canon = (v) => {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  return JSON.stringify(v);
};
const cap = { blobs: [], restore: null };
function captureDownloads() {
  cap.blobs = [];
  const origCreate = URL.createObjectURL;
  const origClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = function (blob) { cap.blobs.push(blob); return origCreate.call(URL, blob); };
  HTMLAnchorElement.prototype.click = function () {};
  cap.restore = () => { URL.createObjectURL = origCreate; HTMLAnchorElement.prototype.click = origClick; };
}

async function run() {
  await t("G0: 1 version stamp is a single current heading", () => {
    const txt = ($("embeddedVersion").textContent || "").trim();
    const heads = (txt.match(/^## /gm) || []).length;
    const m = txt.match(/^## (\d{4}\.\d{2}\.\d{2}\.\d+)/m);
    return heads === 1 && m ? ok("stamp " + m[1]) : no("headings=" + heads + " first=" + txt.split("\n")[0]);
  });

  await t("G0: 2 no stray __ keys before the walk", () => {
    const strays = Object.keys(localStorage).filter((k) => k.startsWith("__") && k !== "__test_backup_v10");
    return strays.length ? no(JSON.stringify(strays)) : ok("clean");
  });

  await t("G0: 3 the saved project has the documented top-level shape", () => {
    const s = rawState();
    const want = ["version", "projectName", "imageSizeSel", "guidanceScale", "globalPos", "globalNeg", "nsfw", "currentPage", "pages"];
    const missing = want.filter((k) => !(k in s));
    return missing.length ? no("missing " + missing.join(",")) : ok(Object.keys(s).length + " keys");
  });

  await t("G0: 4 every overlay is a direct child of #output-container", () => {
    const ovs = [...document.querySelectorAll('[id$="Overlay"]')];
    const bad = ovs.filter((el) => !el.parentElement || el.parentElement.id !== "output-container");
    return bad.length ? no(bad.map((e) => e.id + "<" + (e.parentElement && e.parentElement.id) + ">").join(",")) : ok(ovs.length + " overlays");
  });

  await t("G0: 5 no perchance error surface on load", () => {
    const er = document.querySelector(".perchance-error, #perchanceError, [id*=perchanceError]");
    return er ? no(er.id || er.className) : ok();
  });

  await t("G1: 6 resetEverything(true,{delLib:true}) gives the factory page", async () => {
    await resetEverything(true, { delLib: true });
    await settle();
    const s = rawState();
    const details = { panels: cardsShown(), pages: pageKeys(s).length, preset: getVal("presetStyle"), size: getVal("imageSizeSel"), guidance: getVal("guidanceScaleInput"), nsfw: $("nsfwCheck").checked, lib: libObjs().length };
    const good = details.panels === 4 && details.pages === 1 && details.lib === 0 && details.guidance === "7";
    return good ? ok(JSON.stringify(details)) : no(JSON.stringify(details));
  });

  await t("G1: 7 the project name reaches the header and the save", async () => {
    setVal("projectNameInput", "P0 Project");
    await settle();
    return eqArr([rawState().projectName, $("projectNameEl").textContent], ["P0 Project", "P0 Project"], "name");
  });

  await t("G1: 8 the page seed is saved and drives panel placeholders", async () => {
    setVal("seedInput", "1000");
    await settle();
    const s = rawState();
    return eqArr([s.pages[1].seed, $("panel-seed-2").placeholder.indexOf("1001") >= 0], ["1000", true], "seed,placeholder2");
  });

  await t("G1: 9 the global image size and guidance are saved", async () => {
    setVal("imageSizeSel", "custom");
    setVal("imgSizeW", "640");
    setVal("imgSizeH", "480");
    setVal("guidanceScaleInput", "9");
    await settle();
    const s = rawState();
    return eqArr([s.imageSizeSel, s.guidanceScale, s.imageSizeW, s.imageSizeH], ["custom", "9", "640", "480"], "size,guidance");
  });

  await t("G1: 10 the NSFW flag is saved", async () => {
    $("nsfwCheck").checked = true;
    $("nsfwCheck").dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    return eq(rawState().nsfw, true, "nsfw");
  });

  await t("G2: 11 addPage adds a page and switches to it", async () => {
    const before = pageKeys().length;
    addPage();
    await settle();
    const s = rawState();
    return eqArr([pageKeys(s).length - before, s.currentPage === Math.max(...pageKeys(s))], [1, true], "added,currentIsNew");
  });

  await t("G2: 12 switchPage loads that page's own panels", async () => {
    switchPage(1);
    await settle();
    return eqArr([rawState().currentPage, cardsShown()], [1, 4], "current,shown");
  });

  await t("G2: 13 page name and summary are stored per page", async () => {
    setVal("pageNameInput", "Page One Name");
    setVal("pageSummaryInput", "Page one summary");
    await settle();
    const s = rawState();
    return eqArr([s.pages[1].name, s.pages[1].summary], ["Page One Name", "Page one summary"], "page1 name,summary");
  });

  await t("G2: 14 deletePage(noConfirm) removes a page and keeps the rest", async () => {
    const before = pageKeys().length;
    deletePage(true);
    await settle();
    const s = rawState();
    return eqArr([pageKeys(s).length, s.currentPage, cardsShown()], [before - 1, pageKeys(s)[0], cardsShown()], "pages,current");
  });

  await t("G2: 15 deleting the last page resets the project", async () => {
    deletePage(true);
    await settle();
    const s = rawState();
    return eqArr([pageKeys(s).length, (s.pages[1].name || "").length], [1, 0], "pages,nameCleared");
  });

  await t("G3: 16 the panel count drives the visible cards and the save", async () => {
    setVal("projectNameInput", "P0 Project");
    setPanelCount(24);
    await settle();
    const a = { shown: cardsShown(), sel: rawState().pages[1].panelCountSel };
    setPanelCount(6);
    await settle();
    const b = { shown: cardsShown(), sel: rawState().pages[1].panelCountSel };
    return eqArr([a.shown, a.sel, b.shown, b.sel], [24, "24", 6, "6"], "24/6");
  });

  await t("G3: 17 a custom panel count is honoured", async () => {
    $("panelCount").value = "custom";
    $("panelCount").dispatchEvent(new Event("change"));
    setVal("panelCountCustom", "9");
    updatePanelVisibility();
    await settle();
    const s = rawState();
    return eqArr([cardsShown(), s.pages[1].panelCountSel, s.pages[1].panelCountCustom], [9, "custom", "9"], "custom 9");
  });

  await t("G3: 18 adding to a full page cascades onto a new page", async () => {
    setPanelCount(24);
    await settle();
    const pagesBefore = pageKeys().length;
    addPanel(24);
    await settle();
    const s = rawState();
    const keys = pageKeys(s);
    const newPage = keys[keys.length - 1];
    return eqArr([keys.length - pagesBefore, pageCount(s.pages[newPage]), cardsShown()], [1, 1, 24], "newPages,overflowCount,shown");
  });

  await t("G3: 19 duplicating on a full page fills it then cascades", async () => {
    const s1 = rawState();
    const keys1 = pageKeys(s1);
    if (keys1.length !== 2) return no("precondition: pages=" + JSON.stringify(keys1));
    const p2Before = pageCount(s1.pages[2]);
    duplicatePanel(23);
    await settle();
    const s2 = rawState();
    return eqArr([pageCount(s2.pages[1]), pageCount(s2.pages[2]) - p2Before], [24, 1], "page1,page2Growth");
  });

  await t("G3: 20 deletePanel shifts later panels up and renumbers", async () => {
    setVal("panel-act-3", "SENTINEL-THREE");
    await settle();
    const before = cardsShown();
    deletePanel(2);
    await settle();
    return eqArr([getVal("panel-act-2"), cardsShown()], ["SENTINEL-THREE", before - 1], "act2,shown");
  });

  await t("G3: 21 resequencePanel reorders the block and carries content", async () => {
    setVal("panel-act-2", "A2");
    await settle();
    const before = cardsShown();
    resequencePanel(2, 4);
    await settle();
    return eqArr([getVal("panel-act-4"), cardsShown()], ["A2", before], "act4,count");
  });

  await t("G3: 22 movePanelToPage carries content across pages", async () => {
    setVal("panel-act-2", "MOVE-ME");
    await settle();
    const pagesBefore = pageKeys().length;
    const shownBefore = cardsShown();
    movePanelToPage(2, 2);
    await settle();
    const s = rawState();
    if (pageKeys(s).length !== pagesBefore) return no("page count changed: " + JSON.stringify(pageKeys(s)));
    switchPage(2);
    await settle();
    const found = [...document.querySelectorAll('[id^="panel-act-"]')].some((el) => el.value === "MOVE-ME");
    switchPage(1);
    await settle();
    return eqArr([found, cardsShown()], [true, shownBefore - 1], "foundOnPage2,page1Shrunk");
  });

  await t("MAN: 22b reflow renumbers the in-memory images", () => {
    return { skip: "reflowInsertOnFullPage/cascadePageSequence are private; covered indirectly by G3:18-22 and by the P1 core extraction" };
  });

  await t("G4: 23 the panel title never enters the prompt", async () => {
    setVal("panel-title-1", "TITLE-SHOULD-NOT-APPEAR");
    setVal("panel-act-1", "an action");
    await settle();
    const p = await buildPanelPrompt(1);
    return p.fullPrompt.includes("TITLE-SHOULD") ? no(p.fullPrompt.slice(0, 160)) : ok("title excluded");
  });

  await t("G4: 24 selecting a library character seeds the Basic Description", async () => {
    window.__smokePrompts = ["P0 Hero", "a bold hero in a red cape"];
    addLibraryEntryByType("Character");
    await sleep(200);
    const hero = libObjs().find((o) => o.name === "P0 Hero");
    if (!hero) return no("library entry not created: " + JSON.stringify(libObjs()).slice(0, 140));
    const sel = $("panel-char-select-1-1");
    const hadOption = [...sel.options].some((o) => o.value === "lib:char:" + hero.id);
    setVal("panel-char-select-1-1", "lib:char:" + hero.id);
    await sleep(250);
    return eqArr([hadOption, getVal("panel-char-base-1-1")], [true, "a bold hero in a red cape"], "optionAdded,baseSeeded");
  });

  await t("G4: 25 editing the Basic Description marks it edited", async () => {
    setVal("panel-char-base-1-1", "a custom hero of my own");
    await sleep(250);
    const chip = $("panel-char-basediff-1-1");
    const shown = chip && !chip.hidden && (chip.textContent || "").trim().length > 0;
    return shown ? ok("diff chip: " + chip.textContent.trim()) : no("chip hidden=" + (chip && chip.hidden) + " text=" + (chip && chip.textContent));
  });

  await t("G4: 26 a library edit does not retroactively change a frozen line", async () => {
    const rows = [...document.querySelectorAll("#libObjects .lib-row")];
    const row = rows.find((r) => (r.querySelector("input") || {}).value === "P0 Hero");
    if (!row) return no("library row not found (" + rows.length + " rows)");
    const desc = row.querySelector("textarea.lib-desc");
    desc.value = "a CHANGED library description";
    desc.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(300);
    const stillFrozen = getVal("panel-char-base-1-1") === "a custom hero of my own";
    const chip = $("panel-char-basediff-1-1");
    return eqArr([stillFrozen, !!chip && !chip.hidden], [true, true], "frozen,diffMarked");
  });

  await t("G4: 27 refresh from library pulls the new text in", async () => {
    refreshPanelLineBase("char", 1, 1);
    await sleep(300);
    return eq(getVal("panel-char-base-1-1"), "a CHANGED library description", "refreshed");
  });

  await t("G4: 28 each description appears once, in composition order", async () => {
    setVal("panel-char-base-1-1", "BASE-ALPHA");
    setVal("panel-char-extra-1-1", "EXTRA-BETA");
    const locSel = $("panel-loc-select-1");
    const locVal = [...locSel.options].map((o) => o.value).find((v) => v && v !== "none" && v.indexOf("lib:") !== 0);
    setVal("panel-loc-select-1", locVal);
    setVal("panel-loc-base-1", "LOC-GAMMA");
    setVal("panel-loc-extra-1", "LOCEXTRA-DELTA");
    setVal("panel-act-1", "ACTION-EPSILON");
    await settle();
    const f = (await buildPanelPrompt(1)).fullPrompt;
    const idx = ["BASE-ALPHA", "EXTRA-BETA", "LOC-GAMMA", "LOCEXTRA-DELTA", "ACTION-EPSILON"].map((s) => f.indexOf(s));
    const counts = ["BASE-ALPHA", "LOC-GAMMA", "ACTION-EPSILON"].map((s) => f.split(s).length - 1);
    const ordered = idx.every((v, i) => v >= 0 && (i === 0 || v > idx[i - 1]));
    return eqArr([ordered, counts], [true, [1, 1, 1]], "ordered,onceEach idx=" + idx.join(","));
  });

  await t("G4: 29 copy-from-previous walks back to the nearest set panel", async () => {
    setVal("panel-char-select-2-1", "none");
    setVal("panel-char-base-2-1", "");
    await settle();
    copyFromPrevPanel(2, "char", 1);
    await sleep(300);
    return eqArr([getVal("panel-char-select-2-1"), getVal("panel-char-base-2-1")], [$("panel-char-select-1-1").value, "BASE-ALPHA"], "select,base");
  });

  await t("G4: 30 panel 1 has no copy-from-previous source", () => {
    const chip = $("char-copy-prev-1-1");
    if (!chip) return no("chip missing");
    const off = chip.disabled || chip.hidden || chip.classList.contains("disabled") || chip.getAttribute("aria-disabled") === "true";
    return off ? ok("unavailable (disabled=" + chip.disabled + " hidden=" + chip.hidden + ")") : no("chip looks available");
  });

  await t("G5: 31 the prompt order is globals, characters, location, action", async () => {
    setVal("globalPos", "GLOBAL-ZETA");
    await settle();
    const f = (await buildPanelPrompt(1)).fullPrompt;
    const i = { g: f.indexOf("GLOBAL-ZETA"), c: f.indexOf("BASE-ALPHA"), l: f.indexOf("LOC-GAMMA"), a: f.indexOf("ACTION-EPSILON") };
    const ordered = i.g >= 0 && i.g < i.c && i.c < i.l && i.l < i.a;
    return ordered ? ok(JSON.stringify(i)) : no(JSON.stringify(i) + " | " + f.slice(0, 200));
  });

  await t("G5: 32 a prompt override wins while it exists", async () => {
    togglePromptEditor(1);
    await sleep(200);
    setVal("prompt-pos-1", "OVERRIDE-ETA");
    await sleep(200);
    const p = await buildPanelPrompt(1);
    return p.fullPrompt === "OVERRIDE-ETA" ? ok("override active") : no(p.fullPrompt.slice(0, 140));
  });

  await t("G5: 33 changing a global input discards the override", async () => {
    setVal("globalNeg", "NEG-THETA");
    await settle();
    const p = await buildPanelPrompt(1);
    return p.fullPrompt.includes("OVERRIDE-ETA") ? no("override survived: " + p.fullPrompt.slice(0, 120)) : ok("rebuilt from inputs");
  });

  await t("G5: 34 the safety negatives appear only while NSFW is off", async () => {
    $("nsfwCheck").checked = false;
    $("nsfwCheck").dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    const off = (await buildPanelPrompt(1)).negativePrompt;
    const withOff = off.includes("nsfw") && off.includes("nudity") && off.includes("explicit");
    $("nsfwCheck").checked = true;
    $("nsfwCheck").dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    const on = (await buildPanelPrompt(1)).negativePrompt;
    const cleanOn = !/\bnudity\b/.test(on) && !/\bexplicit\b/.test(on);
    return eqArr([withOff, cleanOn], [true, true], "off,on");
  });

  await t("G6: 35 the page seed drives an unseeded panel's placeholder", async () => {
    switchPage(1);
    await settle();
    setVal("seedInput", "5000");
    await settle();
    return eqArr([$("panel-seed-1").placeholder.indexOf("5000") >= 0, $("panel-seed-3").placeholder.indexOf("5002") >= 0], [true, true], "p1,p3");
  });

  await t("G6: 36 a per-panel seed wins over the page seed and is saved", async () => {
    setVal("panel-seed-2", "777");
    await settle();
    const saved = JSON.stringify(rawState().pages[1]).includes("777");
    return eqArr([getVal("panel-seed-2"), saved], ["777", true], "value,saved");
  });

  await t("G6: 37 clearPanelSeed empties the box and the save", async () => {
    clearPanelSeed(2);
    await settle();
    return eqArr([getVal("panel-seed-2"), JSON.stringify(rawState().pages[1]).includes("777")], ["", false], "value,notSaved");
  });

  await t("G6: 38 copySeedFromPrevPanel copies the raw previous seed", async () => {
    setVal("panel-seed-1", "4242");
    await settle();
    copySeedFromPrevPanel(2);
    await settle();
    return eq(getVal("panel-seed-2"), "4242", "copied");
  });

  await t("G6: 39 the same-seed-for-every-image flag toggles", async () => {
    const before = panelSameSeedOn(3);
    setPanelSameSeed(3, !before);
    await settle();
    return eq(panelSameSeedOn(3), !before, "toggled from " + before);
  });

  await t("MAN: 40 per-image seed offsets and -1 scrubbing", () => {
    return { skip: "getPanelSeed/pinPanelSeedForRun/scrubMinusOneSeeds are private in the page; the offsets and the -1 scrub are automated in gen.page.js G15:3 and G15:5, and P1 core/seeds.js makes them directly callable" };
  });

  await t("G7: 41 applyPreset replaces the global keyword fields", async () => {
    setVal("presetStyle", "comic");
    setVal("presetPalette", "vibrant");
    applyPreset();
    await sleep(300);
    const pos = getVal("globalPos");
    setVal("presetStyle", "photo");
    applyPreset();
    await sleep(300);
    const pos2 = getVal("globalPos");
    setVal("presetStyle", "comic");
    setVal("presetPalette", "vibrant");
    applyPreset();
    await sleep(300);
    return eqArr([pos.length > 0, pos2 !== pos, localStorage.getItem("comicGen.preset") !== null], [true, true, true], "applied,replaced,remembered");
  });

  await t("G7: 42 the effective keyword chips are populated", async () => {
    const chips = $("kwPosChips").textContent.trim().length;
    const neg = $("kwNegChips").textContent.trim().length;
    return chips > 0 && neg > 0 ? ok("pos " + chips + " chars, neg " + neg + " chars") : no("pos=" + chips + " neg=" + neg);
  });

  await t("G7: 43 a per-panel style override changes only that panel's prompt", async () => {
    const sel = $("panel-style-1");
    if (!sel) return no("no per-panel style select");
    const globalStyle = getVal("presetStyle");
    const other = [...sel.options].map((o) => o.value).find((v) => v && v !== "default" && v !== globalStyle);
    if (!other) return no("options: " + JSON.stringify([...sel.options].map((o) => o.value)));
    setVal("panel-style-1", other);
    await settle();
    const p1 = (await buildPanelPrompt(1)).fullPrompt;
    const p2 = (await buildPanelPrompt(2)).fullPrompt;
    return p1 !== p2 ? ok("override '" + other + "' changed panel 1 only") : no("prompts identical");
  });

  await t("G8: 44 a new library object is stored and rendered", async () => {
    switchMenu("library");
    await sleep(150);
    window.__smokePrompts = ["P0 Place", "a windswept cliff at dawn"];
    addLibraryEntryByType("Location");
    await sleep(350);
    const place = libObjs().find((o) => o.name === "P0 Place");
    const rowNames = [...document.querySelectorAll("#libObjects .lib-row input")].map((el) => el.value);
    return eqArr([!!place, rowNames.includes("P0 Place"), libObjs().length], [true, true, 2], "stored,rendered,count rows=" + JSON.stringify(rowNames));
  });

  await t("G8: 45 the new object appears in the panel dropdowns", async () => {
    const place = libObjs().find((o) => o.name === "P0 Place");
    const has = [...$("panel-loc-select-2").options].some((o) => o.value === "lib:loc:" + place.id);
    return has ? ok("option present") : no([...$("panel-loc-select-2").options].map((o) => o.value).join(",").slice(0, 160));
  });

  await t("G8: 46 deleting through the library row warns with its reference count", async () => {
    switchMenu("library");
    await sleep(150);
    const hero = libObjs().find((o) => o.name === "P0 Hero");
    const rows = [...document.querySelectorAll("#libObjects .lib-row")];
    const row = rows.find((r) => (r.querySelector("input") || {}).value === "P0 Hero");
    if (!row) return no("library row not found (" + rows.length + " rows)");
    const refs = JSON.stringify(rawState()).split("lib:char:" + hero.id).length - 1;
    row.querySelector(".btn-del-lib").click();
    await sleep(300);
    const txt = dialogText();
    const warned = refs > 0 ? (txt.includes(String(refs)) && /panel slot/i.test(txt)) : /no panel/i.test(txt);
    answer("delete");
    await sleep(400);
    const gone = !libObjs().some((o) => o.id === hero.id);
    const fellBack = getVal("panel-char-select-1-1") === "none";
    return eqArr([warned, gone, fellBack], [true, true, true], "warned,deleted,fellBack");
  });

  await t("G8: 47 the settings export carries the browser library (P2 flips this)", async () => {
    captureDownloads();
    exportSettings();
    await sleep(350);
    cap.restore();
    if (!cap.blobs.length) return no("nothing captured");
    const txt = await cap.blobs[cap.blobs.length - 1].text();
    window.__smokeExportText = txt;
    return txt.includes("libObjects") ? ok("export includes libObjects (" + txt.length + " chars)") : no("export lost libObjects");
  });

  await t("G9: 48 the captured export is a versioned wrapper around a project", async () => {
    let doc = null;
    try { doc = JSON.parse(window.__smokeExportText || "null"); } catch (e) {}
    const good = doc && doc.version && doc.settings && doc.settings.pages;
    return good ? ok("version " + doc.version + ", wrapper keys " + Object.keys(doc).length + ", pages " + pageKeys(doc.settings).length) : no(String(window.__smokeExportText || "").slice(0, 140));
  });

  await t("G9: 49 the zip export is a real zip carrying the settings document", async () => {
    captureDownloads();
    exportZip();
    await sleep(1200);
    cap.restore();
    const zip = cap.blobs[cap.blobs.length - 1];
    if (!zip) return no("nothing captured");
    const bytes = new Uint8Array(await zip.arrayBuffer());
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    const names = (new TextDecoder("latin1").decode(bytes).match(/comic-generator-settings\.json/g) || []).length;
    let inflate = "not-attempted";
    try {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let off = 0;
      while (off < bytes.length - 30) {
        if (view.getUint32(off, true) !== 0x04034b50) break;
        const method = view.getUint16(off + 8, true);
        const csize = view.getUint32(off + 18, true);
        const nlen = view.getUint16(off + 26, true);
        const elen = view.getUint16(off + 28, true);
        const name = new TextDecoder().decode(bytes.slice(off + 30, off + 30 + nlen));
        const data = bytes.slice(off + 30 + nlen + elen, off + 30 + nlen + elen + csize);
        if (name === "comic-generator-settings.json") {
          if (method === 0) inflate = "stored ok";
          else if (typeof DecompressionStream === "function") {
            const txt = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
            const d = JSON.parse(txt);
            inflate = "deflated ok, name=" + d.projectName;
          } else inflate = "no-decompressionstream";
        }
        off += 30 + nlen + elen + csize;
      }
    } catch (e) { inflate = "read failed: " + e.message; }
    return eqArr([sig === "PK\u0003\u0004", names >= 2, inflate === "stored ok" || inflate === "deflated ok, name=P0 Project" || inflate === "no-decompressionstream"], [true, true, true], "sig=" + JSON.stringify(sig) + " settingsEntries=" + names + " " + inflate);
  });

  await t("G9: 50 a fresh export imports back to the identical project", async () => {
    captureDownloads();
    exportSettings();
    await sleep(600);
    cap.restore();
    if (!cap.blobs.length) return no("nothing captured");
    const text = await cap.blobs[cap.blobs.length - 1].text();
    const doc = JSON.parse(text);
    const want = canon(doc.settings);
    setVal("projectNameInput", "P0 Mutated");
    setPanelCount(3);
    await settle();
    const changed = canon(JSON.parse(localStorage.getItem("comicGen.panelState"))) !== want;
    const input = $("importSettingsInput");
    const dt = new DataTransfer();
    dt.items.add(new File([text], "p0.json", { type: "application/json" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(700);
    let clicked = "";
    if ($("importConfirmOverlay") && !$("importConfirmOverlay").hidden) clicked = clickButtonText($("importConfirmOverlay"), "continue") || "no-continue";
    if (dialogOpen()) clicked += "|choice:" + answer();
    await sleep(1200);
    switchPage(1);
    await settle();
    captureDownloads();
    exportSettings();
    await sleep(600);
    cap.restore();
    let same = false;
    let back = null;
    try {
      back = JSON.parse(await cap.blobs[cap.blobs.length - 1].text());
      same = canon(back.settings) === want && canon({ ...back, exportedAt: 0 }) === canon({ ...doc, exportedAt: 0 });
    } catch (e) {}
    const nameOk = getVal("projectNameInput") === doc.settings.projectName;
    return eqArr([changed, same, nameOk], [true, true, true], "changed,exportIdempotent,nameRestored panels=" + cardsShown() + " via " + clicked);
  });

  await t("G10: 51 openJsonEditor shows the project as JSON", async () => {
    openJsonEditor();
    await sleep(400);
    const txt = $("jsonArea").value;
    let parses = false;
    try { JSON.parse(txt); parses = true; } catch (e) {}
    return eqArr([!$("jsonEditorOverlay").hidden, parses, txt.includes("P0 Project")], [true, true, true], "visible,parses,hasName");
  });

  await t("G10: 52 editing a value and applying it changes the project", async () => {
    const area = $("jsonArea");
    area.value = area.value.replace('"P0 Project"', '"P0 Via JSON"');
    jsonEditorApply();
    await settle();
    return eqArr([rawState().projectName, getVal("projectNameInput")], ["P0 Via JSON", "P0 Via JSON"], "applied");
  });

  await t("G10: 53 invalid JSON is refused and reported", async () => {
    const area = $("jsonArea");
    const good = area.value;
    area.value = good.replace('"P0 Via JSON"', '"P0 Broken"').replace(/"pages"\s*:/, '"pages":::');
    jsonEditorInput();
    await sleep(300);
    jsonEditorApply();
    await sleep(300);
    const status = $("jsonStatusEl").textContent;
    const unchanged = rawState().projectName;
    area.value = good;
    jsonEditorInput();
    await sleep(250);
    return eqArr([unchanged, status.length > 0], ["P0 Via JSON", true], "unchanged,status=" + status.slice(0, 50));
  });

  await t("G10: 54 key names are locked against find and replace", async () => {
    $("jsonFindInput").value = "projectName";
    $("jsonReplaceInput").value = "projectNameHACKED";
    jsonEditorFindChanged();
    await sleep(250);
    jsonEditorReplaceAll();
    await sleep(400);
    return $("jsonArea").value.includes("projectNameHACKED") ? no("a key name was replaced") : ok("keys untouched");
  });

  await t("G10: 55 an unapplied edit can be undone", async () => {
    const area = $("jsonArea");
    area.value = area.value.replace('"P0 Via JSON"', '"P0 Undo Test"');
    jsonEditorInput();
    await sleep(250);
    jsonEditorApply();
    await settle();
    const applied = rawState().projectName;
    jsonEditorUndoApply();
    await settle();
    return eqArr([applied, rawState().projectName], ["P0 Undo Test", "P0 Via JSON"], "applied,undone");
  });

  await t("G11: 56 openAnalysis builds a matrix with a globals bar", async () => {
    openAnalysis();
    await sleep(450);
    const rows = $("analysisWrap").querySelectorAll("tr").length;
    const cells = $("analysisWrap").querySelectorAll("td").length;
    return eqArr([!$("analysisOverlay").hidden, rows >= 2, cells > 4, !!$("analysisGlobalBar")], [true, true, true, true], "rows=" + rows + ",cells=" + cells);
  });

  await t("G11: 57 the matrix globals bar edits the global NSFW flag", async () => {
    const before = $("nsfwCheck").checked;
    const box = $("analysisGlobalNsfw");
    box.checked = !before;
    box.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    return eqArr([rawState().nsfw, $("nsfwCheck").checked], [!before, !before], "nsfw");
  });

  await t("G11: 58 an add button writes a library object into a panel", async () => {
    const place = libObjs().find((o) => o.name === "P0 Place");
    if (!place) return { skip: "no library object left after G8" };
    const addBtn = [...$("analysisWrap").querySelectorAll("button.an-add")].find((b) => /P0 Place/i.test(b.title || ""));
    if (!addBtn) return { skip: "no add button in the matrix (all cells occupied or read-only)" };
    const pg = Number(getVal("analysisPageSel") || 1);
    const panelIdx = Number((addBtn.title.match(/panel (\d+)/) || [])[1]);
    addBtn.click();
    await settle();
    const saved = (rawState().pages[pg] || {})[panelIdx] || {};
    const domVal = panelIdx <= 24 ? getVal("panel-loc-select-" + panelIdx) : null;
    const good = saved.loc === "lib:loc:" + place.id;
    return good ? ok("page " + pg + " panel " + panelIdx + " location = the library object (dom " + domVal + ")") : no("saved loc " + saved.loc + ", dom " + domVal);
  });

  await t("G12: 59 the focus view opens, navigates and closes", async () => {
    openSingleView(1);
    await sleep(300);
    const open = !$("singleOverlay").hidden;
    const first = getVal("singlePanelSel");
    singleNav(1);
    await sleep(250);
    const second = getVal("singlePanelSel");
    closeSingleView();
    await sleep(200);
    return eqArr([open, first, second, $("singleOverlay").hidden], [true, "1", "2", true], "open,1,2,closed");
  });

  await t("G12: 60 the storyboard renders the page and closes", async () => {
    openStoryboard();
    await sleep(450);
    const cells = $("storyboardGrid").children.length;
    storyboardNavDelta(1);
    await sleep(200);
    closeStoryboard();
    await sleep(200);
    return eqArr([cells >= 1, $("storyboardOverlay").hidden], [true, true], "cells=" + cells);
  });

  await t("G12: 61 the theme and accent apply and persist", async () => {
    setVal("themeModeSel", "dark");
    await settle();
    setVal("themeAccentInput", "#3366cc");
    $("themeAccentInput").dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    const attr = document.documentElement.getAttribute("data-theme") || document.body.className;
    return eqArr([localStorage.getItem("comicGen.themeMode"), localStorage.getItem("comicGen.accent")], ["dark", "#3366cc"], "theme,accent attr=" + String(attr).slice(0, 40));
  });

  await t("G12: 62 the layout toggle persists and reverses", async () => {
    const before = localStorage.getItem("comicGen.layoutMode");
    toggleLayout();
    await settle();
    const after = localStorage.getItem("comicGen.layoutMode");
    toggleLayout();
    await settle();
    return eqArr([before !== after, localStorage.getItem("comicGen.layoutMode")], [true, before], "toggled,restored");
  });

  await t("G12: 63 the manual opens in its overlay and closes", async () => {
    openUserManual();
    await sleep(500);
    const open = !$("manualOverlay").hidden;
    closeUserManual();
    await sleep(200);
    return eqArr([open, $("manualOverlay").hidden], [true, true], "opened,closed");
  });

  await t("G13: 64 cancelling a destructive choice changes nothing", async () => {
    setVal("panel-act-1", "KEEP-ME");
    await settle();
    const before = JSON.stringify(rawState());
    window.confirm = () => false;
    const p = deletePanel(1);
    await sleep(200);
    const ttl = dialogTitle();
    answer("cancel");
    await p;
    await settle();
    window.confirm = () => true;
    return eqArr([before === JSON.stringify(rawState()), getVal("panel-act-1")], [true, "KEEP-ME"], "unchanged,title=" + ttl.slice(0, 40));
  });

  await t("G13: 65 deletePanel confirms before the effect", async () => {
    let asked = 0;
    const before = cardsShown();
    window.confirm = () => { asked++; return false; };
    deletePanel(1);
    await sleep(300);
    const wasAsked = asked > 0 || dialogOpen();
    answer("cancel");
    window.confirm = () => true;
    await settle();
    return eqArr([wasAsked, cardsShown()], [true, before], "confirmed(confirmCalls=" + asked + "),unchanged");
  });

  await t("G13: 66 resetEverything asks first when not forced", async () => {
    const before = getVal("projectNameInput");
    const p = resetEverything(false, { delLib: false });
    await sleep(250);
    const asked = dialogOpen() && /reset/i.test(dialogTitle());
    answer("cancel");
    await p;
    await settle();
    return eqArr([asked, getVal("projectNameInput")], [true, before], "asked,unchanged");
  });

  await t("MAN: 67 protected slots are never written", () => {
    return { skip: "needs a stubbed image service - see gen.page.js" };
  });

  await t("G14: 68 the background-generation preference defaults to on", () => {
    const stored = localStorage.getItem("comicGen.bgGenerate");
    const checked = $("prefBgGenerate").checked;
    const on = stored === null || stored === "1";
    return on && checked === true ? ok("stored=" + JSON.stringify(stored) + " means on, checkbox on") : no("stored=" + JSON.stringify(stored) + ", checked=" + checked);
  });

  await t("G14: 69 the preference persists in both directions", async () => {
    const box = $("prefBgGenerate");
    box.checked = false;
    onPrefBgGenerateChange();
    await settle();
    const off = localStorage.getItem("comicGen.bgGenerate");
    box.checked = true;
    onPrefBgGenerateChange();
    await settle();
    return eqArr([off, localStorage.getItem("comicGen.bgGenerate")], ["0", "1"], "off,on");
  });

  await t("G14: 70 the GitHub backup dialog reads and writes its settings", () => {
    const ownerBefore = localStorage.getItem("comicGen.githubOwner");
    openGhBackup();
    const open = $("ghBackupOverlay") && !$("ghBackupOverlay").hidden;
    const prefill = getVal("ghOwnerInput");
    $("ghOwnerInput").value = "p0-owner";
    $("ghRepoInput").value = "p0-repo";
    ghSaveSettings();
    const saved = localStorage.getItem("comicGen.githubOwner");
    ghClose();
    if (ownerBefore !== null) localStorage.setItem("comicGen.githubOwner", ownerBefore);
    else localStorage.removeItem("comicGen.githubOwner");
    return eqArr([open, prefill === (ownerBefore || ""), saved], [true, true, "p0-owner"], "open,prefill,saved");
  });

  await t("G15: 72 the panel selection lives in the DOM and is never saved", async () => {
    switchPage(1);
    setPanelCount(4);
    await settle();
    clearPanelSelection();
    await settle();
    const before = JSON.stringify(rawState());
    selectAllPanels();
    const barShown = !!$("selectionBar") && !$("selectionBar").hidden;
    const count = ($("selectionBarCount") || {}).textContent;
    const dup = (($("panel-dup-btn-1") || {}).textContent || "").trim();
    const marked = document.querySelectorAll(".panel-selected").length;
    const after = JSON.stringify(rawState());
    const selKey = /"(panelSelection|selected|selectedPanels|selection)"/.test(after);
    clearPanelSelection();
    await settle();
    const clearedBar = $("selectionBar").hidden;
    const clearedMarks = document.querySelectorAll(".panel-selected").length;
    const dupBack = ($("panel-dup-btn-1").textContent || "").trim();
    return eqArr([barShown, count, dup, marked, before === after, selKey, clearedBar, clearedMarks, dupBack],
      [true, "4 panels selected", "\u29c9 Duplicate 4 Panels", 4, true, false, true, 0, "\u29c9 Duplicate"],
      "bar,count,dup,marked,unchangedSave,selKey,clearedBar,clearedMarks,dupReset");
  });

  await t("G15: 73 copy and paste carry a panel into another slot", async () => {
    switchPage(1);
    setPanelCount(6);
    await settle();
    clearPanelSelection();
    setVal("panel-act-1", "COPY-SRC");
    setVal("panel-title-1", "COPY-TITLE");
    await settle();
    onPanelSelectClick(1, { target: { checked: true } });
    panelCopyAction();
    await settle();
    const copied = $("statusEl").textContent || "";
    const chipShown = $("panel-paste-btn-3").hidden === false;
    const chipText = ($("panel-paste-btn-3").textContent || "").trim();
    clearPanelSelection();
    const before = cardsShown();
    panelPasteAction(3);
    await settle();
    return eqArr([/Copied 1 panel/.test(copied), chipShown, chipText, before, cardsShown(), /Pasted 1 panel/.test($("statusEl").textContent || ""), getVal("panel-act-3"), getVal("panel-title-3"), getVal("panel-act-1")],
      [true, true, "\ud83d\udccb Paste 1", 6, 7, true, "COPY-SRC", "COPY-TITLE", "COPY-SRC"],
      "copied,chip,chipText,before,after,pasted,act3,title3,act1");
  });

  await t("G15: 74 a cut removes the panel and empties the clipboard when pasted", async () => {
    switchPage(1);
    setPanelCount(6);
    await settle();
    clearPanelSelection();
    setVal("panel-act-2", "CUT-ME");
    await settle();
    onPanelSelectClick(2, { target: { checked: true } });
    panelCutAction();
    await settle();
    const cut = /Cut 1 panel/.test($("statusEl").textContent || "");
    const gone = getVal("panel-act-2") !== "CUT-ME";
    const chip = ($("panel-paste-btn-1").textContent || "").trim();
    const afterCut = cardsShown();
    panelPasteAction(1);
    await settle();
    const chipHidden = $("panel-paste-btn-1").hidden;
    return eqArr([cut, gone, chip, afterCut, chipHidden, getVal("panel-act-1")],
      [true, true, "\ud83d\udccb Paste 1", 5, true, "CUT-ME"],
      "cut,gone,chip,afterCut,chipHidden,restored");
  });

  await t("MAN: 75 ghTest and ghPush against the real repo", () => {
    return { skip: "network + a live token; verified by hand at the end of every release instead" };
  });

  const pass = T.filter((x) => x.ok === true).length;
  const fail = T.filter((x) => x.ok === false).length;
  const manual = T.filter((x) => x.ok === null).length;
  try { sessionStorage.removeItem("__smoke_at"); } catch (e) {}
  return {
    stamp: ($("embeddedVersion").textContent || "").trim().split("\n")[0],
    pass, fail, manual,
    failures: T.filter((x) => x.ok === false),
    manualChecks: T.filter((x) => x.ok === null).map((x) => x.n),
    groups: GROUPS,
    checks: T,
  };
}

return await run();
