window.confirm = () => true;
window.alert = () => {};
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = () => sleep(500);

const T = [];
async function t(name, fn) {
  try {
    const r = await fn();
    if (r && r.skip) { T.push({ n: name, ok: null, d: String(r.skip) }); return; }
    const good = r === undefined ? true : r && typeof r === "object" ? !!r.ok : !!r;
    T.push({ n: name, ok: good, d: r && typeof r === "object" && r.d !== undefined ? String(r.d).slice(0, 260) : "" });
  } catch (e) { T.push({ n: name, ok: false, d: "THROW " + (e && e.message) }); }
}
const ok = (d) => ({ ok: true, d: d === undefined ? "" : d });
const no = (d) => ({ ok: false, d: d === undefined ? "" : d });
const eqArr = (a, b, what) => (JSON.stringify(a) === JSON.stringify(b) ? ok(what + " = " + JSON.stringify(a)) : no(what + ": expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)));
const st = () => JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
const pageKeys = () => Object.keys(st().pages || {}).map(Number).filter((k) => !isNaN(k)).sort((a, b) => a - b);
const shown = () => [...document.querySelectorAll('[id^="panel-card-"]')].filter((el) => el.style.display !== "none").length;

function firstDiff(a, b, path) {
  if (a === b) return null;
  const ta = typeof a, tb = typeof b;
  if (a === null || b === null || ta !== tb || ta !== "object") return { path: path, a: JSON.stringify(a), b: JSON.stringify(b) };
  const ka = Object.keys(a), kb = Object.keys(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    if (ka[i] !== kb[i]) return { path: (path || "") + ".<key#" + i + ">", a: ka[i], b: kb[i] };
    const d = firstDiff(a[ka[i]], b[kb[i]], (path || "") + "." + ka[i]);
    if (d) return d;
  }
  return null;
}

function diff(label) {
  const s = window.__storeJson();
  if (!s) return no(label + ": window.__storeJson() returned nothing (the store module did not load?)");
  const c = window.collectPanelState();
  const sa = JSON.stringify(s), sb = JSON.stringify(c);
  if (sa === sb) return ok(label + ": identical, " + sa.length + " chars");
  const d = firstDiff(s, c, "$") || { path: "(?)", a: "?", b: "?" };
  return no(label + ": differs at " + d.path + " — store=" + String(d.a).slice(0, 90) + " | collect=" + String(d.b).slice(0, 90));
}

function setSel(id, want) {
  const el = $(id);
  if (!el) return null;
  const opts = [...el.options];
  if (want && opts.some((o) => o.value === want)) { el.value = want; return want; }
  if (opts.length > 1) { el.selectedIndex = 1; return el.value; }
  return null;
}
function setVal(id, v) {
  const el = $(id);
  if (!el) return false;
  el.value = v;
  return true;
}
async function switchTo(n) { switchPage(n); await settle(); }

async function importFixture(text) {
  const input = $("importSettingsInput");
  const dt = new DataTransfer();
  dt.items.add(new File([text], "fixture.json", { type: "application/json" }));
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(700);
  const ov = $("importConfirmOverlay");
  if (ov && !ov.hidden) {
    const b = [...ov.querySelectorAll("button")].find((x) => /continue/i.test(x.textContent));
    if (b) b.click();
  }
  await sleep(1400);
}

const fixtures = window.__fixtures || [];
const byName = (n) => fixtures.find((f) => f.name.indexOf(n) >= 0);

async function run() {
  await t("SD1 the live project the preview already holds round-trips identically", async () => {
    await settle();
    return diff("the live project (" + (st().projectName || "unnamed") + ")");
  });

  await t("SD2 the store instance and the pure serializer agree", () => {
    const m = window.__storeModule();
    if (!m) return no("the store module did not load");
    const snap = window.collectDomSnapshot();
    return eqArr([JSON.stringify(m.serializeProject(snap)) === JSON.stringify(window.__storeJson()), m.STORE_VERSION], [true, 2], "instanceVsPure,STORE_VERSION");
  });

  const full = byName("full-page");
  if (full) {
    await t("SD3 the full-page fixture (3 pages, 24 panels on page 1) round-trips identically", async () => {
      await importFixture(full.text);
      await settle();
      const d = diff("full-page, page 1");
      if (!d.ok) return d;
      return eqArr([shown(), Object.keys(st().pages).length, pageKeys().join(",")], [24, 3, "1,2,3"], "shown,pages,pageKeys");
    });

    await t("SD4 every page of a multi-page project round-trips identically", async () => {
      const keys = pageKeys();
      const bad = [];
      for (const k of keys) {
        await switchTo(k);
        const d = diff("page " + k);
        if (!d.ok) bad.push(d.d);
      }
      return bad.length ? no(bad.join(" || ").slice(0, 240)) : ok(keys.length + " pages, pages " + keys.join(","));
    });

    await t("SD5 a non-current page's panels come from storage, not the DOM", async () => {
      const keys = pageKeys();
      const other = keys[keys.length - 1];
      await switchTo(other);
      const stored = st().pages[other];
      const withPanels = Object.keys(stored).filter((k) => /^\d+$/.test(k)).length;
      await switchTo(keys[0]);
      const a = window.__storeJson().pages[other];
      const b = window.collectPanelState().pages[other];
      return eqArr([JSON.stringify(a) === JSON.stringify(b), withPanels > 0, JSON.stringify(a) === JSON.stringify(stored)], [true, true, true], "page" + other + " panels=" + withPanels);
    });
  } else {
    await t("SD3..SD5 the fixture corpus", () => ({ skip: "fixture text not supplied" }));
  }

  await t("SD6 every field a panel contributes is in the snapshot", async () => {
    await switchTo(1);
    const applied = [];
    applied.push(setSel("panel-char-select-1-1", "hero"));
    applied.push(setVal("panel-char-base-1-1", "a base description"));
    applied.push(setVal("panel-char-extra-1-1", "an extra description"));
    applied.push((() => {
      const el = $("panel-char-select-1-2");
      if (!el) return null;
      const o = [...el.options].find((x) => /^lib:char:/.test(x.value));
      if (o) { el.value = o.value; return o.value; }
      return setSel("panel-char-select-1-2", "villain");
    })());
    applied.push(setVal("panel-title-1", "A test title"));
    applied.push(setVal("panel-seed-1", "424242"));
    applied.push(setVal("panel-img-count-1", "3"));
    applied.push(setSel("panel-style-1", "noir"));
    applied.push(setSel("panel-palette-1", "neon"));
    applied.push(setSel("panel-size-1", "custom"));
    applied.push(setVal("panel-size-w-1", "700"));
    applied.push(setVal("panel-size-h-1", "900"));
    applied.push(setSel("panel-loc-select-1", "city"));
    applied.push(setVal("panel-loc-base-1", "a location base"));
    applied.push(setVal("panel-loc-extra-1", "a location extra"));
    applied.push(setVal("panel-act-1", "the panel action prompt"));
    setPanelSameSeed(1, true);
    const prot = document.querySelector("#slotbtns-panel-1-2 .btn-img-protect");
    if (prot) prot.classList.add("active");
    const cb = $("panel-sameseed-1");
    const d = diff("hand-edited page 1");
    if (!d.ok) return d;
    const c = window.collectPanelState().pages[1][1];
    return eqArr([
      applied.filter(Boolean).length,
      c.title, c.seed, c.imgCount, c.style, c.palette, c.sizeSel, c.sizeW, c.sizeH, c.loc, c.action,
      c.chars[0].base, c.chars[0].extra, c.chars[1].sel.indexOf("lib:char:") === 0,
      c.sameSeed, c.protectSlots[1], !!(cb && cb.checked)
    ], [
      16,
      "A test title", "424242", "3", "noir", "neon", "custom", "700", "900", "city", "the panel action prompt",
      "a base description", "an extra description", true,
      true, true, true
    ], "fieldsInTheModel");
  });

  await t("SD7 the project-wide fields round-trip identically", async () => {
    setVal("projectNameInput", "Differential Project");
    setVal("pageNameInput", "A page name");
    setVal("pageSummaryInput", "A page summary");
    setVal("seedInput", "9876");
    setVal("globalPos", "global positive keywords here");
    setVal("globalNeg", "global negative keywords here");
    setVal("previewDelayInput", "123");
    setVal("imgSizeW", "640");
    setVal("imgSizeH", "480");
    const nsfw = $("nsfwCheck");
    if (nsfw) nsfw.checked = true;
    const prev = $("previewEnabledCheck");
    if (prev) prev.checked = false;
    const bic = $("bulkImgCountSel");
    if (bic) bic.value = "2";
    const d = diff("edited globals");
    if (!d.ok) return d;
    const c = window.collectPanelState();
    return eqArr([c.projectName, c.previewOn, c.nsfw, c.imgCountDefault, c.globalPos, c.imageSizeW, c.pages[1].name, c.pages[1].seed], ["Differential Project", false, true, "2", "global positive keywords here", "640", "A page name", "9876"], "globalsInTheModel");
  });

  await t("SD8 every panel-count domain round-trips identically", async () => {
    const counts = ["1", "4", "6", "12", "24", "custom"];
    const sel = $("panelCount");
    if (!sel) return no("panelCount missing");
    const custom = $("panelCountCustom");
    const bad = [];
    for (const c of counts) {
      if (![...sel.options].some((o) => o.value === c)) { bad.push(c + ": no such option"); continue; }
      sel.value = c;
      if (custom) custom.value = c === "custom" ? "3" : "";
      const d = diff("panelCount=" + c);
      if (!d.ok) bad.push(d.d);
    }
    return bad.length ? no(bad.join(" || ").slice(0, 240)) : ok(counts.length + " counts: " + counts.join(","));
  });

  const v1 = byName("legacy-v1");
  if (v1) {
    await t("SD9 the legacy v1 file round-trips identically after migration", async () => {
      await importFixture(v1.text);
      await settle();
      return diff("legacy v1");
    });
  }

  const keys = byName("legacy-keys");
  if (keys) {
    await t("SD10 a file carrying every dead key round-trips identically", async () => {
      await importFixture(keys.text);
      await settle();
      return diff("legacy keys");
    });
  }

  await t("SD11 edits survive a page switch away and back", async () => {
    await switchTo(1);
    setVal("panel-title-2", "Survives a round trip");
    setVal("panel-act-2", "action after the switch");
    setVal("panel-seed-2", "555");
    let d = diff("before the switch");
    if (!d.ok) return d;
    const keys2 = pageKeys();
    if (keys2.length < 2) return { skip: "this project has only one page" };
    await switchTo(keys2[1]);
    await switchTo(keys2[0]);
    d = diff("after the switch");
    if (!d.ok) return d;
    return eqArr([$("panel-title-2").value, $("panel-seed-2").value, $("panel-act-2").value], ["Survives a round trip", "555", "action after the switch"], "restoredFromStorage");
  });

  await t("SD12 an unknown key in the stored state is dropped by both and never mutated", async () => {
    await switchTo(1);
    const raw = st();
    raw.__sdUnknownKey = { hello: "world" };
    raw.__sdUnknownNumber = 7;
    localStorage.setItem("comicGen.panelState", JSON.stringify(raw));
    const s = window.__storeJson();
    const c = window.collectPanelState();
    const after = st();
    return eqArr([
      JSON.stringify(s) === JSON.stringify(c),
      "__sdUnknownKey" in s,
      after.__sdUnknownNumber,
      !!(after.__sdUnknownKey && after.__sdUnknownKey.hello === "world")
    ], [true, false, 7, true], "identical,droppedByStore,storedUntouched");
  });

  await t("SD13 a factory reset project round-trips identically", async () => {
    await resetEverything(true);
    await settle();
    const d = diff("after reset");
    if (!d.ok) return d;
    const c = window.collectPanelState();
    return eqArr([c.projectName, Array.isArray(c.library), Array.isArray(c.kept), Object.keys(c.pages).length, c.currentPage], ["", true, true, 1, 1], "resetShape");
  });

  await t("SD14 the autosave writes exactly the store's JSON", async () => {
    await switchTo(1);
    setVal("panel-title-1", "written by the store");
    window.savePanelState();
    const saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 70) + " | store=" + String(d.b).slice(0, 70));
    const c = window.collectPanelState();
    return eqArr([saved.pages[1][1].title, JSON.stringify(saved) === JSON.stringify(c)], ["written by the store", true], "savedTitle,savedMatchesCollect");
  });

  if (full) {
    await t("SD15 the same holds for the full-page fixture (3 pages, 24 panels)", async () => {
      await importFixture(full.text);
      await settle();
      await switchTo(1);
      setVal("projectNameInput", "Save path check");
      window.savePanelState();
      const saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
      const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
      if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 70) + " | store=" + String(d.b).slice(0, 70));
      return eqArr(
        [saved.projectName, Object.keys(saved.pages).length, Object.keys(saved.pages[1]).filter((k) => /^\d+$/.test(k)).length, JSON.stringify(saved) === JSON.stringify(window.collectPanelState())],
        ["Save path check", 3, 24, true],
        "name,pages,panels,match"
      );
    });
  }

  await t("SD16 a factory reset matches the schema's own defaults", async () => {
    await resetEverything(true);
    await settle();
    const m = window.__schemaModule();
    if (!m || !m.defaultProject || !m.defaultPanel) return no("the schema module did not load");
    const fresh = m.defaultProject();
    const c = window.collectPanelState();
    const bad = [];
    for (const f of ["projectName", "imageSizeSel", "imageSizeW", "imageSizeH", "guidanceScale", "imgCountDefault", "previewDelay", "previewOn", "globalPos", "globalNeg", "nsfw"]) {
      if (JSON.stringify(c[f]) !== JSON.stringify(fresh[f])) bad.push(f + "=" + JSON.stringify(c[f]) + " want " + JSON.stringify(fresh[f]));
    }
    const fp = fresh.pages[1], cp = c.pages[1];
    for (const f of ["name", "summary", "panelCountSel", "panelCountCustom", "seed"]) {
      if (JSON.stringify(cp[f]) !== JSON.stringify(fp[f])) bad.push("page." + f + "=" + JSON.stringify(cp[f]) + " want " + JSON.stringify(fp[f]));
    }
    const dp = m.defaultPanel();
    const panel = cp[1] || {};
    for (const k of Object.keys(dp)) {
      if (k === "id" || k === "imgCount") continue;
      if (JSON.stringify(panel[k]) !== JSON.stringify(dp[k])) bad.push("panel1." + k + "=" + JSON.stringify(panel[k]) + " want " + JSON.stringify(dp[k]));
    }
    if (JSON.stringify(panel.imgCount) !== JSON.stringify(dp.imgCount || c.imgCountDefault)) bad.push("panel1.imgCount=" + JSON.stringify(panel.imgCount) + " want " + JSON.stringify(dp.imgCount || c.imgCountDefault));
    if (bad.length) return no(bad.slice(0, 6).join(" | "));
    return ok("11 globals, 5 page fields and " + Object.keys(dp).length + " panel fields match defaultProject()/defaultPanel()");
  });

  await t("SD17 a keystroke in a Title box is written by the named command", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setTitle !== "function") return no("the commands module did not load");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const rawBefore = localStorage.getItem("comicGen.panelState");
    const el = $("panel-title-1");
    if (!el) return no("no #panel-title-1 to type into");
    const otherBefore = $("panel-title-2") ? $("panel-title-2").value : null;
    el.value = "written by the command";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const rawAfter = localStorage.getItem("comicGen.panelState");
    const saved = JSON.parse(rawAfter || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const typed = saved.pages[1][1].title;
    const neighbour = saved.pages[1][2] ? saved.pages[1][2].title : "(none)";
    const unknownCommand = window.runPanelCommand("noSuchCommand", "p-1", []);
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    const roundTripped = $("panel-title-1") ? $("panel-title-1").value : "(missing card)";
    return eqArr([
      rawAfter !== rawBefore, typed, JSON.stringify(saved) === JSON.stringify(c), unknownCommand,
      roundTripped, neighbour === otherBefore, pages,
    ], [true, "written by the command", true, false, "written by the command", true, "1,2,3"], "immediate,saved,match,unknown,roundTrip,neighbour");
  });

  await t("SD18 an Images-count change is written by the named command", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setImgCount !== "function") return no("the commands module did not load");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const rawBefore = localStorage.getItem("comicGen.panelState");
    const sel = $("panel-img-count-1");
    if (!sel) return no("no #panel-img-count-1 to change");
    const otherBefore = $("panel-img-count-2") ? $("panel-img-count-2").value : null;
    if (!window.__panelOverrideSet) return no("no __panelOverrideSet seam");
    const posEl = $("prompt-pos-1");
    if (!posEl) return no("no #prompt-pos-1 to override with");
    posEl.value = "SD18 pinned override";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    const overBefore = window.__panelOverrideSet(1);
    sel.value = "3";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    const rawAfter = localStorage.getItem("comicGen.panelState");
    const saved = JSON.parse(rawAfter || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const changed = saved.pages[1][1].imgCount;
    const neighbour = saved.pages[1][2] ? saved.pages[1][2].imgCount : "(none)";
    const overAfter = window.__panelOverrideSet(1);
    const slots = [1, 2, 3, 4].map((k) => { const s = $("imgslot-panel-1-" + k); return s ? s.style.display : "?"; }).join(",");
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    const roundTripped = $("panel-img-count-1") ? $("panel-img-count-1").value : "(missing card)";
    return eqArr([
      rawAfter !== rawBefore, changed, JSON.stringify(saved) === JSON.stringify(c),
      roundTripped, neighbour === otherBefore, overBefore === overAfter, slots, pages,
    ], [true, "3", true, "3", true, true, "block,block,block,none", "1,2,3"], "immediate,saved,match,roundTrip,neighbour,overrideKept,slots");
  });

  await t("SD19 a Style change is written by the named command", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setStyle !== "function") return no("the commands module did not load");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const rawBefore = localStorage.getItem("comicGen.panelState");
    const sel = $("panel-style-1");
    if (!sel) return no("no #panel-style-1 to change");
    const otherBefore = $("panel-style-2") ? $("panel-style-2").value : null;
    if (!window.__panelOverrideSet) return no("no __panelOverrideSet seam");
    const posEl = $("prompt-pos-1");
    if (!posEl) return no("no #prompt-pos-1 to override with");
    posEl.value = "SD19 pinned override";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    const overBefore = window.__panelOverrideSet(1);
    const want = ["noir", "manga", "watercolor"].find((v) => v !== sel.value) || "noir";
    sel.value = want;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    const rawAfter = localStorage.getItem("comicGen.panelState");
    const saved = JSON.parse(rawAfter || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const changed = saved.pages[1][1].style;
    const neighbour = saved.pages[1][2] ? saved.pages[1][2].style : "(none)";
    const overAfter = window.__panelOverrideSet(1);
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    const roundTripped = $("panel-style-1") ? $("panel-style-1").value : "(missing card)";
    return eqArr([
      rawAfter !== rawBefore, changed, JSON.stringify(saved) === JSON.stringify(c),
      roundTripped, neighbour === otherBefore, overBefore === true && overAfter === false,
      !saved.pages[1][1].promptOverride, pages,
    ], [true, want, true, want, true, true, true, "1,2,3"], "immediate,saved,match,roundTrip,neighbour,overrideCleared,savedOverrideNull,pages");
  });

  await t("SD20 a Size change is written by the named command", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setSize !== "function") return no("the commands module did not load");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const rawBefore = localStorage.getItem("comicGen.panelState");
    const sel = $("panel-size-1");
    if (!sel) return no("no #panel-size-1 to change");
    const wEl = $("panel-size-w-1"), hEl = $("panel-size-h-1");
    if (!wEl || !hEl) return no("no custom w/h inputs");
    const otherBefore = $("panel-size-2") ? $("panel-size-2").value : null;
    if (!window.__panelOverrideSet) return no("no __panelOverrideSet seam");
    const posEl = $("prompt-pos-1");
    if (!posEl) return no("no #prompt-pos-1 to override with");
    posEl.value = "SD20 pinned override";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    const overBefore = window.__panelOverrideSet(1);
    const preset = sel.value !== "768x768" ? "768x768" : "512x512";
    sel.value = preset;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    let saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    if (saved.pages[1][1].sizeSel !== preset) return no("preset change not saved, got " + saved.pages[1][1].sizeSel);
    sel.value = "custom";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    wEl.value = "800";
    wEl.dispatchEvent(new Event("input", { bubbles: true }));
    hEl.value = "600";
    hEl.dispatchEvent(new Event("input", { bubbles: true }));
    const rawAfter = localStorage.getItem("comicGen.panelState");
    saved = JSON.parse(rawAfter || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const overAfter = window.__panelOverrideSet(1);
    const customShown = $("panel-size-custom-1") ? !$("panel-size-custom-1").hidden : "?";
    const neighbour = saved.pages[1][2] ? saved.pages[1][2].sizeSel : "(none)";
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    const rSel = $("panel-size-1") ? $("panel-size-1").value : "(missing)";
    const rW = $("panel-size-w-1") ? $("panel-size-w-1").value : "(missing)";
    const rH = $("panel-size-h-1") ? $("panel-size-h-1").value : "(missing)";
    return eqArr([
      rawAfter !== rawBefore, saved.pages[1][1].sizeSel, saved.pages[1][1].sizeW, saved.pages[1][1].sizeH,
      JSON.stringify(saved) === JSON.stringify(c), rSel === "custom" && rW === "800" && rH === "600",
      neighbour === otherBefore, overBefore === true && overAfter === true, customShown, pages,
    ], [true, "custom", "800", "600", true, true, true, true, true, "1,2,3"], "immediate,compound,saved,roundTrip,neighbour,overrideKept,customShown,pages");
  });

  await t("SD21 a Seed edit and a Same-Seed toggle are written by the named commands", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setPanelSeed !== "function" || typeof mod.COMMANDS.setSameSeed !== "function") return no("the commands module did not load");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const rawBefore = localStorage.getItem("comicGen.panelState");
    const el = $("panel-seed-1");
    if (!el) return no("no #panel-seed-1 to type into");
    const cb = $("panel-sameseed-1");
    if (!cb) return no("no #panel-sameseed-1 to toggle");
    const otherSeedBefore = $("panel-seed-2") ? $("panel-seed-2").value : null;
    const otherSameBefore = $("panel-sameseed-2") ? $("panel-sameseed-2").checked : null;
    el.value = "424242";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    let saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    if (saved.pages[1][1].seed !== "424242") return no("seed keystroke not saved, got " + saved.pages[1][1].seed);
    cb.checked = !cb.checked;
    const wantSame = cb.checked;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
    const rawAfter = localStorage.getItem("comicGen.panelState");
    saved = JSON.parse(rawAfter || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const neighbourSeed = saved.pages[1][2] ? saved.pages[1][2].seed : "(none)";
    const neighbourSame = saved.pages[1][2] ? saved.pages[1][2].sameSeed : "(none)";
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    const rSeed = $("panel-seed-1") ? $("panel-seed-1").value : "(missing)";
    const rSame = $("panel-sameseed-1") ? $("panel-sameseed-1").checked : "(missing)";
    return eqArr([
      rawAfter !== rawBefore, saved.pages[1][1].seed, saved.pages[1][1].sameSeed === true || saved.pages[1][1].sameSeed === false,
      JSON.stringify(saved) === JSON.stringify(c), rSeed, rSame === wantSame,
      neighbourSeed === otherSeedBefore, neighbourSame === otherSameBefore, pages,
    ], [true, "424242", true, true, "424242", true, true, true, "1,2,3"], "immediate,seed,sameBool,saved,roundTrip,roundSame,neighbour,pages");
  });

  await t("SD22 a Protect toggle is written by the named command", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setProtect !== "function") return no("the commands module did not load");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const rawBefore = localStorage.getItem("comicGen.panelState");
    const btn = document.querySelector("#slotbtns-panel-1-1 .btn-img-protect");
    if (!btn) return no("no protect chip on panel 1 slot 1");
    btn.disabled = false;
    const otherBefore = JSON.stringify((JSON.parse(rawBefore || "{}").pages[1] || {})[2] || {});
    btn.click();
    const rawAfter = localStorage.getItem("comicGen.panelState");
    const saved = JSON.parse(rawAfter || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const chipOn = btn.classList.contains("active");
    const neighbourAfter = JSON.stringify(saved.pages[1][2] || {});
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    const btn2 = document.querySelector("#slotbtns-panel-1-1 .btn-img-protect");
    const roundOn = !!(btn2 && btn2.classList.contains("active"));
    return eqArr([
      rawAfter !== rawBefore, saved.pages[1][1].protectSlots && saved.pages[1][1].protectSlots[0] === true,
      JSON.stringify(saved) === JSON.stringify(c), chipOn, roundOn,
      neighbourAfter === otherBefore, pages,
    ], [true, true, true, true, true, true, "1,2,3"], "immediate,saved,match,chip,roundTrip,neighbour,pages");
  });

  await t("SD23 a prompt-override edit is written by the named command", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setPromptOverride !== "function") return no("the commands module did not load");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const rawBefore = localStorage.getItem("comicGen.panelState");
    const posEl = $("prompt-pos-1"), negEl = $("prompt-neg-1");
    if (!posEl || !negEl) return no("no prompt editor boxes");
    const otherBefore = JSON.stringify(((JSON.parse(rawBefore || "{}").pages[1] || {})[2] || {}).promptOverride || null);
    posEl.value = "SD23 pos override";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    negEl.value = "SD23 neg override";
    negEl.dispatchEvent(new Event("input", { bubbles: true }));
    const rawAfter = localStorage.getItem("comicGen.panelState");
    const saved = JSON.parse(rawAfter || "{}");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const got = saved.pages[1][1].promptOverride || {};
    const seamOn = window.__panelOverrideSet(1);
    const neighbourAfter = JSON.stringify((saved.pages[1][2] || {}).promptOverride || null);
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    const seamRound = window.__panelOverrideSet(1);
    return eqArr([
      rawAfter !== rawBefore, got.pos, got.neg,
      JSON.stringify(saved) === JSON.stringify(c), seamOn, seamRound,
      neighbourAfter === otherBefore, pages,
    ], [true, "SD23 pos override", "SD23 neg override", true, true, true, true, "1,2,3"], "immediate,pos,neg,saved,seam,roundTrip,neighbour,pages");
  });

  await t("SD24 a manual Prompt edit survives content edits, while Style and Palette still reset it", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.setPromptOverride !== "function") return no("the commands module did not load");
    if (!window.revertPanelPrompt) return no("no revertPanelPrompt");
    if (full) await importFixture(full.text);
    await switchTo(1);
    const posEl = $("prompt-pos-1"), negEl = $("prompt-neg-1");
    if (!posEl || !negEl) return no("no prompt editor boxes");
    if (!$("prompt-revert-1")) return no("no revert chip");
    posEl.value = "SD24 pos frozen";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    negEl.value = "SD24 neg frozen";
    negEl.dispatchEvent(new Event("input", { bubbles: true }));
    if (!window.__panelOverrideSet(1)) return no("override not set after typing");
    const chipShown = !$("prompt-revert-1").hidden;
    const act = $("panel-act-1");
    if (!act) return no("no #panel-act-1");
    act.value = "SD24 action edit";
    act.dispatchEvent(new Event("input", { bubbles: true }));
    const csel = $("panel-char-select-1-1");
    if (!csel) return no("no char select");
    const wantChar = [...csel.options].map((o) => o.value).find((v) => v !== csel.value && v !== "__new_char__") || "none";
    csel.value = wantChar;
    csel.dispatchEvent(new Event("change", { bubbles: true }));
    const le = $("panel-loc-extra-1");
    if (!le) return no("no loc extra box");
    le.value = "SD24 loc extra edit";
    le.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(700);
    let saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const kept = saved.pages[1][1].promptOverride || {};
    const seamKept = window.__panelOverrideSet(1);
    const neighbourFrozen = JSON.stringify((saved.pages[1][2] || {}).promptOverride || null);
    const ssel = $("panel-style-1");
    if (!ssel) return no("no #panel-style-1");
    ssel.value = ["noir", "manga", "watercolor"].find((v) => v !== ssel.value) || "noir";
    ssel.dispatchEvent(new Event("change", { bubbles: true }));
    saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const styleCleared = !saved.pages[1][1].promptOverride && !window.__panelOverrideSet(1);
    const chipAfterStyle = $("prompt-revert-1") ? $("prompt-revert-1").hidden : "(missing)";
    posEl.value = "SD24 pos again";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    negEl.value = "SD24 neg again";
    negEl.dispatchEvent(new Event("input", { bubbles: true }));
    const psel = $("panel-palette-1");
    if (!psel) return no("no #panel-palette-1");
    const palOpts = [...psel.options].map((o) => o.value);
    psel.value = palOpts.find((v) => v !== psel.value);
    if (psel.value === undefined) return no("no palette option to change to");
    psel.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(700);
    saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const paletteCleared = !saved.pages[1][1].promptOverride && !window.__panelOverrideSet(1);
    posEl.value = "SD24 pos third";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    negEl.value = "SD24 neg third";
    negEl.dispatchEvent(new Event("input", { bubbles: true }));
    if (!window.__panelOverrideSet(1)) return no("override not set before revert");
    $("prompt-revert-1").click();
    await sleep(300);
    saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    if (saved.pages[1][1].promptOverride) return no("revert chip did not clear the saved override");
    posEl.value = "SD24 temp pos";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    if (!window.__panelOverrideSet(1)) return no("override not set for the empty-positive check");
    posEl.value = "";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(300);
    saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    if (saved.pages[1][1].promptOverride) return no("clearing the positive box did not return to automatic");
    if (window.__panelOverrideSet(1)) return no("seam still set after clearing the positive box");
    if (!$("prompt-revert-1").hidden) return no("chip still shown after clearing the positive box");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("the saved bytes differ from the store at " + d.path + " — saved=" + String(d.a).slice(0, 60) + " | store=" + String(d.b).slice(0, 60));
    const c = window.collectPanelState();
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    return eqArr([
      kept.pos, kept.neg, seamKept, chipShown, styleCleared, chipAfterStyle,
      paletteCleared, !saved.pages[1][1].promptOverride, !window.__panelOverrideSet(1),
      $("prompt-revert-1") ? $("prompt-revert-1").hidden : "(missing)",
      neighbourFrozen === "null", JSON.stringify(saved) === JSON.stringify(c), pages,
    ], ["SD24 pos frozen", "SD24 neg frozen", true, true, true, true, true, true, true, true, true, true, "1,2,3"], "keptPos,keptNeg,seam,chip,styleReset,chipHidden,paletteReset,revertedNull,seamOff,chipOff,neighbour,saved,pages");
  });

  await t("SD25 addPanel inserts through the named command and undo restores the page", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.addPanel !== "function") return no("the addPanel command did not load");
    if (!window.undoStructuralOp) return no("no undoStructuralOp");
    if (full) await importFixture(full.text);
    await switchTo(1);
    let guard = 0;
    while (shown() > 4 && guard++ < 30) { window.deletePanel(shown()); await sleep(120); }
    const pg = 1, n = shown();
    if (n !== 4) return no("could not trim page 1 to 4 panels, shown=" + n);
    const undoBtn = $("globalUndoBtn");
    if (!undoBtn) return no("no undo button");
    const preIds = [];
    for (let p = 1; p <= n; p++) { const card = $("panel-card-" + p); preIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const posEl = $("prompt-pos-2"), negEl = $("prompt-neg-2");
    if (!posEl || !negEl) return no("no prompt editor boxes on panel 2");
    posEl.value = "SD25 pos rides along";
    posEl.dispatchEvent(new Event("input", { bubbles: true }));
    negEl.value = "SD25 neg rides along";
    negEl.dispatchEvent(new Event("input", { bubbles: true }));
    const rawPre = localStorage.getItem("comicGen.panelState");
    window.addPanel(1);
    await sleep(400);
    let saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const afterIds = [];
    for (let p = 1; p <= n + 1; p++) { const card = $("panel-card-" + p); afterIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const countOk = shown() === n + 1 && saved.pages[pg].panelCountSel === "custom" && saved.pages[pg].panelCountCustom === String(n + 1);
    const shiftedOk = afterIds[2] === preIds[1] && afterIds[0] === preIds[0];
    const freshOk = !!afterIds[1] && preIds.indexOf(afterIds[1]) === -1;
    const rode = (saved.pages[pg][3] || {}).promptOverride || {};
    const undoOn = !$("globalUndoBtn").disabled;
    const undoLabel = $("globalUndoBtn").textContent;
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("after add, saved differs from store at " + d.path);
    window.undoStructuralOp();
    await sleep(400);
    const rawPost = localStorage.getItem("comicGen.panelState");
    if (rawPost !== rawPre) {
      const dd = firstDiff(JSON.parse(rawPre || "{}"), JSON.parse(rawPost || "{}"), "$");
      return no("undo did not restore bytes" + (dd ? " at " + dd.path + " pre=" + String(dd.a).slice(0, 50) + " post=" + String(dd.b).slice(0, 50) : ""));
    }
    const savedPost = JSON.parse(rawPost || "{}");
    const c = window.collectPanelState();
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    return eqArr([
      countOk, shiftedOk, freshOk, rode.pos, rode.neg, undoOn,
      /Undo add panel/.test(undoLabel), JSON.stringify(savedPost) === JSON.stringify(c),
      shown() === n, pages,
    ], [true, true, true, "SD25 pos rides along", "SD25 neg rides along", true, true, true, true, "1,2,3"], "count,shift,freshId,overrideRides,undoOn,label,match,shownRestored,pages");
  });

  await t("SD26 duplicatePanel copies through the named command and undo restores the page", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.duplicatePanel !== "function") return no("the duplicatePanel command did not load");
    if (!window.undoStructuralOp) return no("no undoStructuralOp");
    if (typeof window.duplicatePanel !== "function") return no("no window.duplicatePanel");
    if (full) await importFixture(full.text);
    await switchTo(1);
    let guard = 0;
    while (shown() > 4 && guard++ < 30) { window.deletePanel(shown()); await sleep(120); }
    const pg = 1, n = shown();
    if (n !== 4) return no("could not trim page 1 to 4 panels, shown=" + n);
    const preIds = [];
    for (let p = 1; p <= n; p++) { const card = $("panel-card-" + p); preIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const titleEl = $("panel-title-2");
    if (!titleEl) return no("no panel-title-2 box");
    titleEl.value = "SD26 title rides along";
    titleEl.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(300);
    const rawPre = localStorage.getItem("comicGen.panelState");
    const oldTwo = JSON.parse(JSON.stringify((JSON.parse(rawPre || "{}").pages[pg] || {})[2] || {}));
    window.duplicatePanel(2);
    await sleep(400);
    let saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const afterIds = [];
    for (let p = 1; p <= n + 1; p++) { const card = $("panel-card-" + p); afterIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const countOk = shown() === n + 1 && saved.pages[pg].panelCountSel === "custom" && saved.pages[pg].panelCountCustom === String(n + 1);
    const shiftOk = afterIds[0] === preIds[0] && afterIds[1] === preIds[1] && afterIds[3] === preIds[2] && afterIds[4] === preIds[3];
    const freshOk = !!afterIds[2] && preIds.indexOf(afterIds[2]) === -1;
    const copy = JSON.parse(JSON.stringify(saved.pages[pg][3] || {}));
    delete copy.id;
    delete oldTwo.id;
    const deepOk = JSON.stringify(copy) === JSON.stringify(oldTwo);
    const statusOk = /Panel 2 duplicated/.test($("statusEl") ? $("statusEl").textContent : "");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("after duplicate, saved differs from store at " + d.path);
    window.undoStructuralOp();
    await sleep(400);
    const rawPost = localStorage.getItem("comicGen.panelState");
    if (rawPost !== rawPre) {
      const dd = firstDiff(JSON.parse(rawPre || "{}"), JSON.parse(rawPost || "{}"), "$");
      return no("undo did not restore bytes" + (dd ? " at " + dd.path + " pre=" + String(dd.a).slice(0, 50) + " post=" + String(dd.b).slice(0, 50) : ""));
    }
    const c = window.collectPanelState();
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    return eqArr([
      countOk, shiftOk, freshOk, deepOk, statusOk,
      (saved.pages[pg][2] || {}).title, (saved.pages[pg][3] || {}).title,
      JSON.stringify(JSON.parse(rawPost || "{}")) === JSON.stringify(c),
      shown() === n, pages,
    ], [true, true, true, true, true, "SD26 title rides along", "SD26 title rides along", true, true, "1,2,3"], "count,shift,freshId,deepCopy,status,titleKept,titleCopied,match,shownRestored,pages");
  });

  await t("SD27 resequencePanel moves through the named command and undo restores the page", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.movePanel !== "function") return no("the movePanel command did not load");
    if (!window.undoStructuralOp) return no("no undoStructuralOp");
    if (typeof window.resequencePanel !== "function") return no("no window.resequencePanel");
    if (full) await importFixture(full.text);
    await switchTo(1);
    let guard = 0;
    while (shown() > 4 && guard++ < 30) { window.deletePanel(shown()); await sleep(120); }
    const pg = 1, n = shown();
    if (n !== 4) return no("could not trim page 1 to 4 panels, shown=" + n);
    const preIds = [];
    for (let p = 1; p <= n; p++) { const card = $("panel-card-" + p); preIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const titleEl = $("panel-title-1");
    if (!titleEl) return no("no panel-title-1 box");
    titleEl.value = "SD27 title moves along";
    titleEl.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(300);
    const rawPre = localStorage.getItem("comicGen.panelState");
    window.resequencePanel(1, 3);
    await sleep(400);
    let saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const afterIds = [];
    for (let p = 1; p <= n; p++) { const card = $("panel-card-" + p); afterIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const orderOk = afterIds.join(",") === [preIds[1], preIds[2], preIds[0], preIds[3]].join(",");
    const movedOk = (saved.pages[pg][3] || {}).title === "SD27 title moves along";
    const countOk = shown() === n && saved.pages[pg].panelCountSel === "4";
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("after move, saved differs from store at " + d.path);
    window.undoStructuralOp();
    await sleep(400);
    const rawPost = localStorage.getItem("comicGen.panelState");
    if (rawPost !== rawPre) {
      const dd = firstDiff(JSON.parse(rawPre || "{}"), JSON.parse(rawPost || "{}"), "$");
      return no("undo did not restore bytes" + (dd ? " at " + dd.path + " pre=" + String(dd.a).slice(0, 50) + " post=" + String(dd.b).slice(0, 50) : ""));
    }
    const c = window.collectPanelState();
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    return eqArr([
      orderOk, movedOk, countOk,
      JSON.stringify(JSON.parse(rawPost || "{}")) === JSON.stringify(c),
      shown() === n, pages,
    ], [true, true, true, true, true, "1,2,3"], "order,titleMoved,countKept,match,shownRestored,pages");
  });

  await t("SD28 deletePanel removes through the named command and undo restores the page", async () => {
    const mod = window.__commandsModule();
    if (!mod || !mod.COMMANDS || typeof mod.COMMANDS.deletePanel !== "function") return no("the deletePanel command did not load");
    if (!window.undoStructuralOp) return no("no undoStructuralOp");
    if (typeof window.deletePanel !== "function") return no("no window.deletePanel");
    if (full) await importFixture(full.text);
    await switchTo(1);
    let guard = 0;
    while (shown() > 4 && guard++ < 30) { window.deletePanel(shown()); await sleep(120); }
    const pg = 1, n = shown();
    if (n !== 4) return no("could not trim page 1 to 4 panels, shown=" + n);
    const preIds = [];
    for (let p = 1; p <= n; p++) { const card = $("panel-card-" + p); preIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const titleEl = $("panel-title-3");
    if (!titleEl) return no("no panel-title-3 box");
    titleEl.value = "SD28 survivor rides up";
    titleEl.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(300);
    const rawPre = localStorage.getItem("comicGen.panelState");
    window.deletePanel(2);
    await sleep(400);
    let saved = JSON.parse(localStorage.getItem("comicGen.panelState") || "{}");
    const afterIds = [];
    for (let p = 1; p <= n - 1; p++) { const card = $("panel-card-" + p); afterIds.push(card ? String(card.dataset.panelId || "") : ""); }
    const orderOk = afterIds.join(",") === [preIds[0], preIds[2], preIds[3]].join(",");
    const rodeOk = (saved.pages[pg][2] || {}).title === "SD28 survivor rides up";
    const countOk = shown() === n - 1 && saved.pages[pg].panelCountSel === "custom" && saved.pages[pg].panelCountCustom === String(n - 1);
    const statusOk = /Panel 2 deleted/.test($("statusEl") ? $("statusEl").textContent : "");
    const d = firstDiff(saved, JSON.parse(JSON.stringify(window.__storeJson())), "$");
    if (d) return no("after delete, saved differs from store at " + d.path);
    window.undoStructuralOp();
    await sleep(400);
    const rawPost = localStorage.getItem("comicGen.panelState");
    if (rawPost !== rawPre) {
      const dd = firstDiff(JSON.parse(rawPre || "{}"), JSON.parse(rawPost || "{}"), "$");
      return no("undo did not restore bytes" + (dd ? " at " + dd.path + " pre=" + String(dd.a).slice(0, 50) + " post=" + String(dd.b).slice(0, 50) : ""));
    }
    const c = window.collectPanelState();
    const pages = pageKeys().join(",");
    await switchTo(2);
    await switchTo(1);
    return eqArr([
      orderOk, rodeOk, countOk, statusOk,
      JSON.stringify(JSON.parse(rawPost || "{}")) === JSON.stringify(c),
      shown() === n, pages,
    ], [true, true, true, true, true, true, "1,2,3"], "order,titleRodeUp,count,status,match,shownRestored,pages");
  });

  const pass = T.filter((x) => x.ok === true).length;
  const fail = T.filter((x) => x.ok === false).length;
  return { pass, fail, failures: T.filter((x) => x.ok === false), checks: T };
}

return await run();
