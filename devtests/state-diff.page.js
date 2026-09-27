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

  const pass = T.filter((x) => x.ok === true).length;
  const fail = T.filter((x) => x.ok === false).length;
  return { pass, fail, failures: T.filter((x) => x.ok === false), checks: T };
}

return await run();
