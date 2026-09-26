const blankPanel = () => ({
  chars: [{ sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }],
  title: "",
  protectSlots: [false, false, false, false],
  loc: "none",
  locBase: "",
  locExtra: "",
  action: "",
  seed: "",
  imgCount: "1",
  style: "",
  sizeSel: "",
  sizeW: "",
  sizeH: "",
  sameSeed: false,
  promptOverride: null,
  promptHistory: [],
});
const panel = (over) => Object.assign(blankPanel(), over || {});
const pageOf = (over) => Object.assign({ name: "", summary: "", panelCountSel: "4", panelCountCustom: "", seed: "" }, over || {});
const settingsOf = (over) => Object.assign({
  version: 2,
  projectName: "",
  imageSizeSel: "768x768",
  imageSizeW: "",
  imageSizeH: "",
  guidanceScale: "7",
  imgCountDefault: "1",
  previewDelay: "350",
  previewOn: true,
  globalPos: "comic book art, crisp ink lines, vibrant cel shading, high contrast, dramatic shadows",
  globalNeg: "blurry, low quality, watermark, text, deformed",
  nsfw: false,
  theme: { mode: "system", accent: "#c1121f" },
  currentPage: 1,
  pages: {},
}, over || {});
const wrapper = (over) => Object.assign({
  version: 2,
  exportedAt: "2026-09-26T00:00:00.000Z",
  settings: settingsOf(),
  preset: { style: "comic", palette: "vibrant" },
  libObjects: [],
  layoutMode: "top",
  menuVisible: true,
  panelsVisible: true,
  activeMenu: "file",
  menuFullscreen: false,
  genAlwaysVisible: false,
  hdrAllViews: false,
}, over || {});

const CH = "lib:char:fx-ch-1";
const CH2 = "lib:char:fx-ch-2";
const LOC = "lib:loc:fx-loc-1";
const libObjects = [
  { id: "fx-ch-1", type: "Character", name: "Fixture Hero", desc: "a sturdy hero in a red cape, weathered face" },
  { id: "fx-ch-2", type: "Character", name: "Fixture Sidekick", desc: "a small robot with one glowing eye" },
  { id: "fx-loc-1", type: "Location", name: "Fixture Rooftop", desc: "a rain-slicked city rooftop at night, neon reflections" },
  { id: "fx-act-1", type: "Action", name: "Fixture Action", desc: "leaping between rooftops" },
];

function fullPage() {
  const p1 = pageOf({ name: "The Long Page", summary: "24 panels with mixed overrides", panelCountSel: "24", seed: "1000" });
  for (let i = 1; i <= 24; i++) {
    const base = panel({
      chars: [
        { sel: i % 3 === 0 ? "none" : CH, base: i % 3 === 0 ? "" : "", extra: i % 4 === 0 ? "extra note for panel " + i : "" },
        { sel: i % 5 === 0 ? CH2 : "none", base: "", extra: "" },
        { sel: "none", base: "", extra: "" },
      ],
      loc: i % 2 === 0 ? LOC : "none",
      locBase: "",
      locExtra: i % 6 === 0 ? "at dawn" : "",
      action: i % 3 === 0 ? "" : "panel " + i + " action beat",
      title: i % 7 === 0 ? "Panel title " + i : "",
      imgCount: i === 1 ? "4" : (i % 4 === 0 ? "2" : "1"),
      seed: i === 2 ? "4242" : "",
      sameSeed: i === 3,
      style: i === 4 ? "photo" : "",
      sizeSel: i === 5 ? "custom" : "",
      sizeW: i === 5 ? "640" : "",
      sizeH: i === 5 ? "960" : "",
      protectSlots: i === 6 ? [true, false, false, false] : [false, false, false, false],
      promptOverride: i === 7 ? { pos: "hand written prompt for panel 7", neg: "hand written negative" } : null,
      promptHistory: i === 8 ? [{ pos: "an earlier prompt", neg: "n", seeds: [{ k: 1, seed: 111 }], at: "2026-09-25T00:00:00.000Z" }] : [],
    });
    p1[i] = base;
  }
  const p2 = pageOf({ name: "Short Page With Hidden Panels", summary: "shows 3 panels but carries content in slots 4-6", panelCountSel: "custom", panelCountCustom: "3" });
  for (let i = 1; i <= 24; i++) {
    p2[i] = i <= 6
      ? panel({ chars: [{ sel: CH, base: "", extra: "" }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }], loc: LOC, action: "page two panel " + i })
      : blankPanel();
  }
  const p3 = pageOf({ name: "One Panel Page", panelCountSel: "1", seed: "3000" });
  for (let i = 1; i <= 24; i++) p3[i] = i === 1 ? panel({ chars: [{ sel: CH2, base: "a custom sidekick description", extra: "" }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }], action: "the last beat" }) : blankPanel();
  const settings = settingsOf({
    projectName: "Fixture Full Page",
    currentPage: 1,
    imgCountDefault: "1",
    theme: { mode: "dark", accent: "#3366cc" },
    pages: { 1: p1, 2: p2, 3: p3 },
  });
  return wrapper({ settings, libObjects, preset: { style: "comic", palette: "vibrant" } });
}

function legacyV1() {
  const p1 = pageOf({ name: "Legacy Page", panelCountSel: "custom", panelCountCustom: "2" });
  p1[1] = {
    extras: [
      { type: "Character", sel: "none", desc: "from the extras array" },
      { type: "Location", sel: "lib:loc:legacy-loc-1", desc: "a legacy back alley" },
      { type: "Action", desc: "an action recovered from extras" },
    ],
    chars: [
      { sel: "lib:char:legacy-ch-1", base: "", extra: "", persist: true },
      { sel: "none", base: "", extra: "" },
      { sel: "none", base: "", extra: "" },
    ],
    loc: "none",
    locPersist: false,
    action: "",
    actPersist: false,
    title: "Legacy Panel",
    seed: "77",
    imgCount: "1",
    protectSlots: [false, false, false, false],
    promptHistory: [],
  };
  p1[2] = { chars: [{ sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }, { sel: "none", base: "", extra: "" }], extras: [{ type: "Character", desc: "only in extras", sel: "none" }], loc: "none", locExtra: "", action: "legacy action text", seed: "", imgCount: "1", protectSlots: [false, false, false, false], promptHistory: [] };
  const settings = settingsOf({ projectName: "Fixture Legacy v1", currentPage: 1, pages: { 1: p1 } });
  return wrapper({
    version: 1,
    settings: Object.assign(settings, { version: 1 }),
    libObjects: undefined,
    charLibrary: [{ id: "legacy-ch-1", name: "Legacy Hero", desc: "a hero from the old charLibrary" }],
    locLibrary: [{ id: "legacy-loc-1", name: "Legacy Alley", desc: "a narrow alley from the old locLibrary" }],
    actLibrary: [{ id: "legacy-act-1", name: "Legacy Leap", desc: "a leap from the old actLibrary" }],
  });
}

function legacyKeys() {
  const w = fullPage();
  w.settings.projectName = "Fixture Legacy Keys";
  w.settings.undoProject = { anything: true };
  w.settings.pages[1][9].extras = [{ type: "Location", sel: "fx-loc-1", desc: "extra that must not clobber a set panel" }];
  w.settings.pages[1][9].loc = "lib:loc:fx-loc-1";
  w.settings.pages[1][10].persist = true;
  w.settings.pages[1][10].chars[0].persist = true;
  w.settings.pages[1][10].locPersist = true;
  w.settings.pages[1][10].actPersist = true;
  w.settings.pages[1][10].watchdogReloads = 3;
  w.libObjects = w.libObjects;
  w.charLibrary = [{ id: "dead-ch", name: "Dead Character", desc: "should merge in and be tolerated" }];
  return w;
}

const out = {
  "fixtures/full-page.json": JSON.stringify(fullPage(), null, 1),
  "fixtures/legacy-v1.json": JSON.stringify(legacyV1(), null, 1),
  "fixtures/legacy-keys.json": JSON.stringify(legacyKeys(), null, 1),
};

const sizes = {};
for (const path in out) {
  await fs.writeTextFile(path, out[path] + "\n");
  sizes[path] = out[path].length;
}
const counts = {
  fullPage: { pages: 3, panel1: 24, panel2: 3, panel3: 1, lib: libObjects.length },
  legacyV1: { pages: 1, panels: 2, slots: Object.keys(legacyV1().settings.pages[1]).filter((k) => /^\d+$/.test(k)).length },
  legacyKeys: { pages: 3 },
};
return { sizes, counts, written: Object.keys(out) };
