export const STORE_VERSION = 2;

export function ensurePages(raw) {
  if (raw && raw.pages && typeof raw.pages === "object") return raw.pages;
  const page = { name: "", summary: "", panelCountSel: "4", panelCountCustom: "", seed: "" };
  if (raw) {
    if (raw.panelCountSel) page.panelCountSel = raw.panelCountSel;
    if (raw.panelCountCustom) page.panelCountCustom = raw.panelCountCustom;
    if (raw.seed !== undefined) page.seed = raw.seed;
    if (raw.summary !== undefined) page.summary = raw.summary;
    for (let i = 1; i <= 24; i++) if (raw[i] !== undefined) page[i] = raw[i];
  }
  return { 1: page };
}

export function defaultPageData() {
  return { name: "", summary: "", panelCountSel: "4", panelCountCustom: "", seed: "" };
}

export function pageKey(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 1 : n;
}

export function normaliseSnapshot(snapshot) {
  const s = (snapshot && typeof snapshot === "object") ? snapshot : {};
  return {
    stored: (s.stored && typeof s.stored === "object") ? s.stored : {},
    currentPage: s.currentPage,
    page: (s.page && typeof s.page === "object") ? s.page : null,
    globals: (s.globals && typeof s.globals === "object") ? s.globals : {},
    library: Array.isArray(s.library) ? s.library.slice() : [],
    kept: Array.isArray(s.kept) ? s.kept.slice() : []
  };
}

export function serializeProject(snapshot) {
  const s = normaliseSnapshot(snapshot);
  const g = s.globals;
  const pages = copyPages(ensurePages(s.stored));
  const cur = pageKey(s.currentPage);
  pages[cur] = s.page || defaultPageData();
  return {
    version: STORE_VERSION,
    projectName: g.projectName,
    imageSizeSel: g.imageSizeSel,
    imageSizeW: g.imageSizeW,
    imageSizeH: g.imageSizeH,
    guidanceScale: g.guidanceScale,
    imgCountDefault: g.imgCountDefault,
    previewDelay: g.previewDelay,
    previewOn: g.previewOn,
    globalPos: g.globalPos,
    globalNeg: g.globalNeg,
    nsfw: g.nsfw,
    theme: { mode: g.themeMode, accent: g.themeAccent },
    currentPage: cur,
    pages: pages,
    library: s.library.slice(),
    kept: s.kept.slice()
  };
}

export function createStore() {
  const listeners = [];
  let snapshot = normaliseSnapshot(null);
  let cache = null;
  let dirty = true;
  const api = {
    load(next) {
      snapshot = normaliseSnapshot(next);
      cache = null;
      dirty = true;
      notify();
      return api;
    },
    getSnapshot() { return snapshot; },
    isDirty() { return dirty; },
    toJSON() {
      if (dirty) { cache = serializeProject(snapshot); dirty = false; }
      return cache;
    },
    subscribe(fn) {
      if (typeof fn !== "function") return () => {};
      listeners.push(fn);
      return () => api.unsubscribe(fn);
    },
    unsubscribe(fn) {
      const i = listeners.indexOf(fn);
      if (i === -1) return false;
      listeners.splice(i, 1);
      return true;
    },
    listenerCount() { return listeners.length; }
  };
  function notify() {
    for (const fn of listeners.slice()) {
      try { fn(api); } catch (e) {}
    }
  }
  return api;
}

function copyPages(pages) {
  const out = {};
  for (const k of Object.keys(pages || {})) out[k] = pages[k];
  return out;
}
