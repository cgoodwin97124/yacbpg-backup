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
const lib = () => JSON.parse(localStorage.getItem("comicGen.libObjects") || "[]");
const shown = () => [...document.querySelectorAll('[id^="panel-card-"]')].filter((el) => el.style.display !== "none").length;
const getVal = (id) => { const el = $(id); return el ? el.value : null; };

async function importFixture(text) {
  const input = $("importSettingsInput");
  const dt = new DataTransfer();
  dt.items.add(new File([text], "fixture.json", { type: "application/json" }));
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(700);
  let clicked = "";
  const ov = $("importConfirmOverlay");
  if (ov && !ov.hidden) {
    const b = [...ov.querySelectorAll("button")].find((x) => /continue/i.test(x.textContent));
    if (b) { b.click(); clicked = "continue"; }
  }
  await sleep(1400);
  return clicked;
}
const fixtures = window.__fixtures || [];
const byName = (n) => fixtures.find((f) => f.name.indexOf(n) >= 0);

async function run() {
  const full = byName("full-page");
  const v1 = byName("legacy-v1");
  const keys = byName("legacy-keys");

  if (full) {
    await t("FX1 the full-page fixture imports at all", async () => {
      const how = await importFixture(full.text);
      const s = st();
      return eqArr([s.projectName, Object.keys(s.pages).length, s.currentPage, shown()], ["Fixture Full Page", 3, 1, 24], "name,pages,current,shown via " + how);
    });

    await t("FX2 per-panel overrides survived the import", () => {
      const p = st().pages[1];
      return eqArr([p[1].imgCount, p[2].seed, p[3].sameSeed, p[4].style, p[5].sizeSel, p[5].sizeW, getVal("panel-seed-2"), getVal("panel-img-count-1")], ["4", "4242", true, "photo", "custom", "640", "4242", "4"], "imgCount,seed,sameSeed,style,size,seedDom,countDom");
    });

    await t("FX3 a protected slot and a prompt override survived", () => {
      const p = st().pages[1];
      const override = p[7].promptOverride || {};
      return eqArr([p[6].protectSlots[0], p[6].protectSlots[1], override.pos], [true, false, "hand written prompt for panel 7"], "protect,override");
    });

    await t("FX4 the library came with the file", () => {
      const names = lib().map((o) => o.name).sort();
      const inDom = [...document.querySelectorAll("#libObjects .lib-row input")].map((el) => el.value).sort();
      return eqArr([lib().length, names[0], inDom.length], [4, "Fixture Action", 4], "count,names");
    });

    await t("FX5 the short page keeps the content in its hidden slots", async () => {
      switchPage(2);
      await settle();
      const s = st();
      const p2 = s.pages[2];
      const hidden = [4, 5, 6].map((i) => !!(p2[i] && p2[i].action));
      const blank = [7, 8].map((i) => (p2[i] && p2[i].action) === "");
      return eqArr([shown(), hidden, blank], [3, [true, true, true], [true, true]], "shown,hiddenSlotsContent");
    });

    await t("FX6 a re-export after import still carries the hidden slots", async () => {
      let captured = null;
      const origCreate = URL.createObjectURL;
      const origClick = HTMLAnchorElement.prototype.click;
      URL.createObjectURL = function (b) { captured = b; return origCreate.call(URL, b); };
      HTMLAnchorElement.prototype.click = function () {};
      exportSettings();
      await sleep(600);
      URL.createObjectURL = origCreate;
      HTMLAnchorElement.prototype.click = origClick;
      const txt = await captured.text();
      const doc = JSON.parse(txt);
      const p2 = doc.settings.pages[2];
      return eqArr([!!p2[4], !!p2[6].action, doc.settings.pages[1][1].imgCount], [true, true, "4"], "hiddenSlotsPreserved");
    });

    await t("FX7 the JSON editor can open the imported project", async () => {
      switchPage(1);
      await settle();
      openJsonEditor();
      await sleep(600);
      const txt = $("jsonArea").value;
      let parses = false;
      try { JSON.parse(txt); parses = true; } catch (e) {}
      closeJsonEditor();
      return eqArr([parses, txt.includes("Fixture Full Page")], [true, true], "parses,hasName len=" + txt.length);
    });
  } else {
    await t("FX1..FX7 full-page fixture", () => ({ skip: "fixture text not supplied" }));
  }

  if (v1) {
    await t("FX8 the version-1 fixture imports and migrates", async () => {
      const how = await importFixture(v1.text);
      const s = st();
      return eqArr([s.projectName, Object.keys(s.pages).length, shown()], ["Fixture Legacy v1", 1, 2], "name,pages,shown via " + how);
    });

    await t("FX9 the legacy extras folded into the panel", () => {
      const p1 = st().pages[1][1];
      return eqArr([p1.chars[0].sel, p1.chars[1].extra, p1.loc, p1.action], ["lib:char:legacy-ch-1", "from the extras array", "lib:loc:legacy-loc-1", "an action recovered from extras"], "chars,loc,action");
    });

    await t("FX10 the legacy libraries merged into the existing libObjects", () => {
      const names = lib().map((o) => o.name).sort();
      const merged = ["Legacy Alley", "Legacy Hero", "Legacy Leap"].every((n) => names.includes(n));
      return eqArr([merged, names.length >= 3], [true, true], "mergedIntoExisting names=" + JSON.stringify(names));
    });

    await t("FX11 the legacy library keys were consumed", () => {
      const left = ["comicGen.charLibrary", "comicGen.locLibrary", "comicGen.actLibrary"].filter((k) => localStorage.getItem(k) !== null);
      return eqArr(left, [], "leftoverKeys");
    });

    await t("FX12 the second legacy panel came through too", () => {
      const p2 = st().pages[1][2];
      return eqArr([p2.action, p2.chars[0].extra], ["legacy action text", "only in extras"], "action,charExtra");
    });
  }

  if (keys) {
    await t("FX13 a modern file carrying every dead key still loads", async () => {
      const how = await importFixture(keys.text);
      const s = st();
      return eqArr([s.projectName, Object.keys(s.pages).length, shown()], ["Fixture Legacy Keys", 3, 24], "name,pages,shown via " + how);
    });

    await t("FX14 dead per-panel keys were ignored, live content kept", () => {
      const p = st().pages[1];
      const clean = !("persist" in p[10]) && !("locPersist" in p[10]) && !("watchdogReloads" in p[10]) && !("extras" in p[9]);
      const content = p[10].chars[0].sel === "lib:char:fx-ch-1" && p[10].action === "panel 10 action beat";
      return eqArr([clean, content], [true, true], "deadKeysGone,contentKept");
    });

    await t("FX15 an extras entry never clobbers content a panel already has", () => {
      const p9 = st().pages[1][9];
      return eqArr([p9.loc, p9.locExtra], ["lib:loc:fx-loc-1", ""], "loc");
    });

    await t("FX16 a re-export drops the dead keys entirely", async () => {
      let captured = null;
      const origCreate = URL.createObjectURL;
      const origClick = HTMLAnchorElement.prototype.click;
      URL.createObjectURL = function (b) { captured = b; return origCreate.call(URL, b); };
      HTMLAnchorElement.prototype.click = function () {};
      exportSettings();
      await sleep(600);
      URL.createObjectURL = origCreate;
      HTMLAnchorElement.prototype.click = origClick;
      const txt = await captured.text();
      const dead = ["persist", "locPersist", "actPersist", "watchdogReloads", "extras"].filter((k) => txt.includes('"' + k + '"'));
      return eqArr(dead, [], "deadKeyNamesInExport");
    });
  }

  const pass = T.filter((x) => x.ok === true).length;
  const fail = T.filter((x) => x.ok === false).length;
  return { pass, fail, failures: T.filter((x) => x.ok === false), checks: T };
}

return await run();
