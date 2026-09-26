import { DEFAULT_POS, DEFAULT_NEGATIVES } from "./keywords.js";

export const SCHEMA_VERSION = 2;
export const PANEL_COUNT_OPTIONS = ["1", "4", "6", "12", "24", "custom"];
const STRING_FIELDS = ["loc", "locBase", "locExtra", "action", "seed", "imgCount", "style", "sizeSel", "sizeW", "sizeH"];
const GLOBAL_STRING_FIELDS = ["projectName", "imageSizeSel", "imageSizeW", "imageSizeH", "guidanceScale", "imgCountDefault", "previewDelay", "globalPos", "globalNeg"];
const PAGE_STRING_FIELDS = ["name", "summary", "panelCountCustom", "seed"];

export function newPanelId() {
  return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export function defaultChar() {
  return { sel: "none", base: "", extra: "" };
}

export function defaultPanel(id) {
  return {
    id: validId(id) ? id : newPanelId(),
    chars: [defaultChar(), defaultChar(), defaultChar()],
    title: "",
    protectSlots: [false, false, false, false],
    loc: "none",
    locBase: "",
    locExtra: "",
    action: "",
    seed: "",
    imgCount: "",
    style: "",
    sizeSel: "",
    sizeW: "",
    sizeH: "",
    sameSeed: false,
    promptOverride: null,
    promptHistory: []
  };
}

export function defaultPage(panelCount) {
  const n = countInRange(panelCount);
  const page = { name: "", summary: "", panelCountSel: n ? String(n) : "4", panelCountCustom: "", seed: "" };
  if (n && PANEL_COUNT_OPTIONS.indexOf(String(n)) === -1) {
    page.panelCountSel = "custom";
    page.panelCountCustom = String(n);
  }
  for (let i = 1; i <= n; i++) page[i] = defaultPanel();
  return page;
}

export function defaultProject(overrides) {
  return Object.assign({
    version: SCHEMA_VERSION,
    projectName: "",
    imageSizeSel: "768x768",
    imageSizeW: "",
    imageSizeH: "",
    guidanceScale: "7",
    imgCountDefault: "1",
    previewDelay: "350",
    previewOn: true,
    globalPos: DEFAULT_POS,
    globalNeg: DEFAULT_NEGATIVES,
    nsfw: false,
    theme: { mode: "system", accent: "" },
    currentPage: 1,
    pages: { 1: defaultPage(4) }
  }, overrides || {});
}

export function normalise(state) {
  const src = isObj(state) ? state : {};
  const out = Object.assign({}, src);
  out.version = SCHEMA_VERSION;
  for (const k of GLOBAL_STRING_FIELDS) if (k in out) out[k] = asString(out[k], "");
  if ("previewOn" in out) out.previewOn = !!out.previewOn;
  if ("nsfw" in out) out.nsfw = !!out.nsfw;
  if (isObj(out.theme)) out.theme = { mode: asString(out.theme.mode, "system"), accent: asString(out.theme.accent, "") };
  const pages = (src.pages !== null && typeof src.pages === "object") ? src.pages : { 1: flatPage(src) };
  const seen = new Set();
  const normPages = {};
  for (const k of Object.keys(pages)) {
    normPages[k] = isObj(pages[k]) ? normalisePage(pages[k], seen) : pages[k];
  }
  if (!numericKeys(normPages).length) normPages[1] = defaultPage();
  out.pages = normPages;
  const cur = parseInt(out.currentPage, 10);
  out.currentPage = normPages[cur] !== undefined ? cur : (numericKeys(normPages)[0] || 1);
  return out;
}

export function validate(state) {
  const problems = [];
  const add = (path, message) => problems.push({ path, message });
  if (!isObj(state)) { add("", "the project must be an object"); return problems; }
  if (!isObj(state.pages)) add("pages", "pages must be an object");
  else {
    const keys = Object.keys(state.pages);
    if (!keys.length) add("pages", "the project must have at least one page");
    for (const k of keys) {
      const page = state.pages[k];
      if (!isObj(page)) { add("pages." + k, "a page must be an object"); continue; }
      const sel = String(page.panelCountSel == null ? "" : page.panelCountSel);
      if (sel !== "" && PANEL_COUNT_OPTIONS.indexOf(sel) === -1) add("pages." + k + ".panelCountSel", "panelCountSel must be one of " + PANEL_COUNT_OPTIONS.join(", "));
      for (let i = 1; i <= 24; i++) {
        const panel = page[i];
        if (panel === undefined) continue;
        const path = "pages." + k + "." + i;
        if (!isObj(panel)) { add(path, "a panel must be an object"); continue; }
        if (!validId(panel.id)) add(path + ".id", "a panel must have a non-empty id");
        if (!Array.isArray(panel.chars) || panel.chars.length !== 3) add(path + ".chars", "chars must hold exactly 3 entries");
        if (!Array.isArray(panel.protectSlots) || panel.protectSlots.length !== 4 || panel.protectSlots.some((v) => typeof v !== "boolean")) add(path + ".protectSlots", "protectSlots must hold exactly 4 booleans");
        if (panel.promptOverride != null && !isObj(panel.promptOverride)) add(path + ".promptOverride", "promptOverride must be null or an object");
        if (panel.promptHistory != null && !Array.isArray(panel.promptHistory)) add(path + ".promptHistory", "promptHistory must be an array");
      }
    }
  }
  const seen = new Map();
  if (isObj(state.pages)) {
    for (const k of Object.keys(state.pages)) {
      const page = state.pages[k];
      if (!isObj(page)) continue;
      for (let i = 1; i <= 24; i++) {
        const panel = page[i];
        if (!isObj(panel) || !validId(panel.id)) continue;
        if (seen.has(panel.id)) add("pages." + k + "." + i + ".id", "the id " + JSON.stringify(panel.id) + " is already used by pages." + seen.get(panel.id));
        else seen.set(panel.id, k + "." + i);
      }
    }
  }
  return problems;
}

function countInRange(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.min(24, Math.max(0, n));
}

function isObj(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function validId(v) {
  return typeof v === "string" && v.trim() !== "";
}

function asString(v, d) {
  if (v === undefined || v === null) return d;
  return typeof v === "string" ? v : String(v);
}

function numericKeys(obj) {
  return Object.keys(obj).map(Number).filter((k) => !isNaN(k)).sort((a, b) => a - b);
}

function flatPage(src) {
  const page = defaultPage();
  if (src.panelCountSel !== undefined) page.panelCountSel = asString(src.panelCountSel, "4");
  if (src.panelCountCustom !== undefined) page.panelCountCustom = asString(src.panelCountCustom, "");
  if (src.seed !== undefined) page.seed = asString(src.seed, "");
  if (src.summary !== undefined) page.summary = asString(src.summary, "");
  for (let i = 1; i <= 24; i++) if (src[i] !== undefined) page[i] = src[i];
  return page;
}

function foldPanelCount(page) {
  const sel = asString(page.panelCountSel, "");
  if (sel === "" || PANEL_COUNT_OPTIONS.indexOf(sel) !== -1) return;
  const n = countInRange(sel);
  if (n >= 2 && String(n) === sel.trim()) {
    page.panelCountSel = "custom";
    page.panelCountCustom = String(n);
  }
}

function normalisePage(page, seen) {
  const out = Object.assign({}, page);
  for (const k of PAGE_STRING_FIELDS) out[k] = asString(out[k], "");
  foldPanelCount(out);
  for (let i = 1; i <= 24; i++) {
    if (out[i] === undefined) continue;
    if (isObj(out[i])) out[i] = normalisePanel(out[i], seen);
    else delete out[i];
  }
  return out;
}

function normalisePanel(panel, seen) {
  const out = Object.assign({}, panel);
  let id = validId(out.id) ? out.id : newPanelId();
  while (seen.has(id)) id = newPanelId();
  seen.add(id);
  out.id = id;
  const chars = Array.isArray(out.chars) ? out.chars : [];
  out.chars = [0, 1, 2].map((s) => {
    const c = isObj(chars[s]) ? chars[s] : {};
    return Object.assign({}, c, { sel: asString(c.sel, "none"), base: asString(c.base, ""), extra: asString(c.extra, "") });
  });
  out.title = asString(out.title, "");
  const prot = Array.isArray(out.protectSlots) ? out.protectSlots : [];
  out.protectSlots = [0, 1, 2, 3].map((k) => !!prot[k]);
  for (const k of STRING_FIELDS) out[k] = asString(out[k], k === "loc" ? "none" : "");
  out.sameSeed = !!out.sameSeed;
  out.promptOverride = isObj(out.promptOverride)
    ? { pos: asString(out.promptOverride.pos, ""), neg: asString(out.promptOverride.neg, "") }
    : null;
  out.promptHistory = Array.isArray(out.promptHistory) ? out.promptHistory : [];
  return out;
}
