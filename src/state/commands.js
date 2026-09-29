export const COMMANDS_VERSION = 12;

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function numericKeys(obj) {
  const out = [];
  for (const k of Object.keys(obj)) {
    const n = Number(k);
    if (String(n) === k && Number.isInteger(n) && n >= 1) out.push(k);
  }
  return out.sort((a, b) => Number(a) - Number(b));
}

function text(v) {
  return typeof v === "string" ? v : (v == null ? "" : String(v));
}

export function findPanelById(project, id) {
  if (!isObj(project) || !isObj(project.pages) || typeof id !== "string" || !id) return null;
  for (const pk of numericKeys(project.pages)) {
    const page = project.pages[pk];
    if (!isObj(page)) continue;
    for (const sk of numericKeys(page)) {
      const panel = page[sk];
      if (isObj(panel) && panel.id === id) return { page: Number(pk), index: Number(sk), panel: panel };
    }
  }
  return null;
}

export function setTitle(project, id, value) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  hit.panel.title = text(value);
  return { page: hit.page, index: hit.index, fields: ["title"] };
}

export function setImgCount(project, id, value) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  hit.panel.imgCount = text(value);
  return { page: hit.page, index: hit.index, fields: ["imgCount"] };
}

export function setStyle(project, id, value) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  hit.panel.style = text(value);
  return { page: hit.page, index: hit.index, fields: ["style"] };
}

export function setSize(project, id, size) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  const s = isObj(size) ? size : {};
  hit.panel.sizeSel = text(s.sel);
  hit.panel.sizeW = text(s.w);
  hit.panel.sizeH = text(s.h);
  return { page: hit.page, index: hit.index, fields: ["sizeSel", "sizeW", "sizeH"] };
}

export function setPanelSeed(project, id, value) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  hit.panel.seed = text(value);
  return { page: hit.page, index: hit.index, fields: ["seed"] };
}

export function setSameSeed(project, id, value) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  hit.panel.sameSeed = !!value;
  return { page: hit.page, index: hit.index, fields: ["sameSeed"] };
}

export function setProtect(project, id, slot, on) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  const cur = Array.isArray(hit.panel.protectSlots) ? hit.panel.protectSlots
    : (hit.panel.protect === true ? [true, true, true, true] : [false, false, false, false]);
  const next = [!!cur[0], !!cur[1], !!cur[2], !!cur[3]];
  next[n - 1] = !!on;
  hit.panel.protectSlots = next;
  return { page: hit.page, index: hit.index, fields: ["protectSlots"] };
}

export function setPromptOverride(project, id, value) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  if (value === null || value === undefined) {
    hit.panel.promptOverride = null;
  } else if (isObj(value)) {
    hit.panel.promptOverride = { pos: text(value.pos), neg: text(value.neg) };
  } else {
    return null;
  }
  return { page: hit.page, index: hit.index, fields: ["promptOverride"] };
}

export const COMMANDS = { setTitle: setTitle, setImgCount: setImgCount, setStyle: setStyle, setSize: setSize, setPanelSeed: setPanelSeed, setSameSeed: setSameSeed, setProtect: setProtect, setPromptOverride: setPromptOverride, addPanel: addPanel, duplicatePanel: duplicatePanel, movePanel: movePanel, deletePanel: deletePanel, addPage: addPage };

function countStateFor(n) {
  if (n === 1 || n === 4 || n === 6 || n === 12 || n === 24) return { sel: String(n), custom: "" };
  return { sel: "custom", custom: String(n) };
}

export function addPanel(project, pageNum, total, afterIndex, count, makeId) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
  const t = Number(total);
  const after = Number(afterIndex);
  const n = Number(count);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  if (!Number.isInteger(after) || after < 1 || after > t) return null;
  if (!Number.isInteger(n) || n < 1) return null;
  if (typeof makeId !== "function") return null;
  if (t + n > 24) return null;
  const fresh = [];
  for (let k = 0; k < n; k++) {
    const id = makeId();
    if (typeof id !== "string" || !id) return null;
    fresh.push({ id: id });
  }
  const order = [];
  for (let p = 1; p <= t; p++) order.push(p);
  for (let k = 0; k < n; k++) order.splice(after + k, 0, 0);
  const newTotal = t + n;
  const pc = countStateFor(newTotal);
  const newPage = {};
  for (const k of ["name", "summary", "seed"]) newPage[k] = page[k];
  newPage.panelCountSel = pc.sel;
  newPage.panelCountCustom = pc.custom;
  let fi = 0;
  for (let p = 1; p <= 24; p++) {
    if (p <= newTotal) {
      const src = order[p - 1];
      if (src === 0) newPage[p] = fresh[fi++];
      else if (src !== undefined && page[src] !== undefined) newPage[p] = JSON.parse(JSON.stringify(page[src]));
    } else if (page[p] !== undefined) {
      newPage[p] = page[p];
    }
  }
  project.pages[pageNum] = newPage;
  return { page: Number(pageNum), index: after + 1, count: n, newTotal: newTotal, fields: [] };
}

export function duplicatePanel(project, pageNum, total, index, makeId) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
  const t = Number(total);
  const at = Number(index);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  if (!Number.isInteger(at) || at < 1 || at > t) return null;
  if (typeof makeId !== "function") return null;
  if (t + 1 > 24) return null;
  if (page[at] === undefined) return null;
  const copyId = makeId();
  if (typeof copyId !== "string" || !copyId) return null;
  const order = [];
  for (let p = 1; p <= t; p++) order.push(p);
  order.splice(at, 0, at);
  const copyPos = at + 1;
  const newTotal = t + 1;
  const pc = countStateFor(newTotal);
  const newPage = {};
  for (const k of ["name", "summary", "panelCountSel", "panelCountCustom", "seed"]) newPage[k] = page[k];
  newPage.panelCountSel = pc.sel;
  newPage.panelCountCustom = pc.custom;
  for (let p = 1; p <= 24; p++) {
    const src = order[p - 1];
    if (src !== undefined && page[src] !== undefined) newPage[p] = JSON.parse(JSON.stringify(page[src]));
  }
  if (newPage[copyPos]) newPage[copyPos].id = copyId;
  project.pages[pageNum] = newPage;
  return { page: Number(pageNum), index: copyPos, count: 1, newTotal: newTotal, fields: [] };
}

export function movePanel(project, pageNum, total, fromIndex, toIndex) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
  const t = Number(total);
  const from = Number(fromIndex);
  const to = Number(toIndex);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  if (!Number.isInteger(from) || from < 1 || from > t) return null;
  if (!Number.isInteger(to) || to < 1 || to > t) return null;
  if (from === to) return null;
  const order = [];
  for (let p = 1; p <= t; p++) order.push(p);
  order.splice(from - 1, 1);
  order.splice(to - 1, 0, from);
  const newPage = {};
  for (const k of ["name", "summary", "panelCountSel", "panelCountCustom", "seed"]) newPage[k] = page[k];
  for (let p = 1; p <= 24; p++) {
    const src = p <= t ? order[p - 1] : p;
    if (page[src] !== undefined) newPage[p] = page[src];
  }
  project.pages[pageNum] = newPage;
  return { page: Number(pageNum), index: to, fields: [] };
}

export function deletePanel(project, pageNum, total, index) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
  const t = Number(total);
  const at = Number(index);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  if (!Number.isInteger(at) || at < 1 || at > t) return null;
  if (t <= 1) return null;
  if (page[at] === undefined) return null;
  const order = [];
  for (let p = 1; p <= t; p++) order.push(p);
  order.splice(at - 1, 1);
  const newTotal = t - 1;
  const pc = countStateFor(newTotal);
  const newPage = {};
  for (const k of ["name", "summary", "panelCountSel", "panelCountCustom", "seed"]) newPage[k] = page[k];
  newPage.panelCountSel = pc.sel;
  newPage.panelCountCustom = pc.custom;
  for (let p = 1; p <= 24; p++) {
    const src = p <= newTotal ? order[p - 1] : p;
    if (page[src] !== undefined) newPage[p] = page[src];
  }
  project.pages[pageNum] = newPage;
  return { page: Number(pageNum), index: Math.min(at, newTotal), newTotal: newTotal, fields: [] };
}

export function addPage(project) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  let n = 0;
  for (const k of Object.keys(project.pages)) {
    const v = Number(k);
    if (String(v) === k && Number.isInteger(v) && v >= 1 && v > n) n = v;
  }
  if (n < 1) return null;
  n++;
  project.pages[n] = { name: "", summary: "", panelCountSel: "4", panelCountCustom: "", seed: "" };
  project.currentPage = n;
  return { page: n, fields: [] };
}
