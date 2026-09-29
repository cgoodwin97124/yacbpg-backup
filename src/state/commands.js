export const COMMANDS_VERSION = 15;

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

export const COMMANDS = { setTitle: setTitle, setImgCount: setImgCount, setStyle: setStyle, setSize: setSize, setPanelSeed: setPanelSeed, setSameSeed: setSameSeed, setProtect: setProtect, setPromptOverride: setPromptOverride, addPanel: addPanel, duplicatePanel: duplicatePanel, movePanel: movePanel, deletePanel: deletePanel, addPage: addPage, deletePage: deletePage, movePanelToPage: movePanelToPage, moveManyToPage: moveManyToPage };

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

export function deletePage(project, pageNum) {  if (!isObj(project) || !isObj(project.pages)) return null;
  const at = Number(pageNum);
  if (!Number.isInteger(at) || at < 1) return null;
  const keys = [];
  for (const k of Object.keys(project.pages)) {
    const v = Number(k);
    if (String(v) === k && Number.isInteger(v) && v >= 1) keys.push(v);
  }
  keys.sort((a, b) => a - b);
  if (keys.length <= 1 || keys.indexOf(at) === -1) return null;
  delete project.pages[at];
  const target = keys[0] === at ? keys[1] : keys[0];
  project.currentPage = target;
  return { page: target, deleted: at, fields: [] };
}

export function movePanelToPage(project, srcPage, total, index, targetPage, tCount, mode) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const src = Number(srcPage);
  const tgt = Number(targetPage);
  if (!Number.isInteger(src) || src < 1 || !Number.isInteger(tgt) || tgt < 1) return null;
  if (tgt === src) return null;
  const page = project.pages[src];
  const tp0 = project.pages[tgt];
  if (!isObj(page) || !isObj(tp0)) return null;
  const t = Number(total);
  const at = Number(index);
  const tc = Number(tCount);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  if (!Number.isInteger(at) || at < 1 || at > t) return null;
  if (!Number.isInteger(tc) || tc < 0 || tc > 24) return null;
  if (tc >= 24) return null;
  if (page[at] === undefined) return null;
  const m = (mode === "append" || mode === "prepend" || mode === "replace") ? mode : ((tgt > src) ? "prepend" : "append");
  const moving = JSON.parse(JSON.stringify(page[at]));
  const movedId = (moving && typeof moving.id === "string") ? moving.id : null;
  const insertAt = (m === "append") ? (tc + 1) : 1;
  const finalCount = (m === "replace") ? tc : (tc + 1);
  const newTotal = t - 1;
  if (newTotal <= 0) {
    delete project.pages[src];
  } else {
    const order = [];
    for (let p = 1; p <= t; p++) order.push(p);
    order.splice(at - 1, 1);
    const pc = countStateFor(newTotal);
    const np = {};
    for (const k of ["name", "summary", "panelCountSel", "panelCountCustom", "seed"]) np[k] = page[k];
    np.panelCountSel = pc.sel;
    np.panelCountCustom = pc.custom;
    for (let p = 1; p <= 24; p++) {
      const oldPos = p <= newTotal ? order[p - 1] : p;
      if (page[oldPos] !== undefined) np[p] = page[oldPos];
    }
    project.pages[src] = np;
  }
  const tpc = countStateFor(finalCount);
  const tp = {};
  for (const k of ["name", "summary", "panelCountSel", "panelCountCustom", "seed"]) tp[k] = tp0[k];
  tp.panelCountSel = tpc.sel;
  tp.panelCountCustom = tpc.custom;
  for (let p = 1; p <= 24; p++) {
    if (p === insertAt) { tp[p] = moving; continue; }
    const oldPos = (m === "append" || m === "replace") ? p : p - 1;
    if (oldPos >= 1 && oldPos <= tc && tp0[oldPos] !== undefined) tp[p] = tp0[oldPos];
  }
  project.pages[tgt] = tp;
  project.currentPage = tgt;
  return { page: tgt, srcPage: src, index: insertAt, movedId: movedId, deletesSrcPage: newTotal <= 0, fields: [] };
}

export function moveManyToPage(project, srcPage, total, indexes, targetPage, tCount, replaceTarget) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const src = Number(srcPage);
  const tgt = Number(targetPage);
  if (!Number.isInteger(src) || src < 1 || !Number.isInteger(tgt) || tgt < 1) return null;
  if (tgt === src) return null;
  const page = project.pages[src];
  const tp0 = project.pages[tgt];
  if (!isObj(page) || !isObj(tp0)) return null;
  const t = Number(total);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  if (!Array.isArray(indexes) || !indexes.length) return null;
  const sel = [];
  for (const v of indexes) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > t) return null;
    if (sel.indexOf(n) === -1) sel.push(n);
  }
  sel.sort((a, b) => a - b);
  const tc = Number(tCount);
  if (!Number.isInteger(tc) || tc < 0 || tc > 24) return null;
  const rep = !!replaceTarget;
  if (!rep && tc + sel.length > 24) return null;
  for (const n of sel) if (page[n] === undefined) return null;
  const moving = sel.map((n) => JSON.parse(JSON.stringify(page[n])));
  const movedIds = moving.map((m) => ((m && typeof m.id === "string") ? m.id : null));
  const selSet = {};
  for (const n of sel) selSet[n] = true;
  const remaining = [];
  for (let p = 1; p <= t; p++) if (!selSet[p]) remaining.push(JSON.parse(JSON.stringify(page[p] !== undefined ? page[p] : {})));
  const tEntries = [];
  if (!rep) for (let p = 1; p <= tc; p++) tEntries.push(JSON.parse(JSON.stringify(tp0[p] !== undefined ? tp0[p] : {})));
  const prepend = tgt > src;
  const newTarget = rep ? moving : (prepend ? moving.concat(tEntries) : tEntries.concat(moving));
  const insertPos = (prepend || rep) ? 1 : tc + 1;
  const meta = ["name", "summary", "panelCountSel", "panelCountCustom", "seed"];
  const tNew = {};
  for (const k of meta) tNew[k] = tp0[k];
  const tpc = countStateFor(newTarget.length || 1);
  tNew.panelCountSel = tpc.sel;
  tNew.panelCountCustom = tpc.custom;
  for (let p = 1; p <= newTarget.length; p++) tNew[p] = newTarget[p - 1];
  project.pages[tgt] = tNew;
  let deletesSrcPage = false;
  if (!remaining.length) {
    delete project.pages[src];
    deletesSrcPage = true;
  } else {
    const sNew = {};
    for (const k of meta) sNew[k] = page[k];
    const spc = countStateFor(remaining.length);
    sNew.panelCountSel = spc.sel;
    sNew.panelCountCustom = spc.custom;
    for (let p = 1; p <= remaining.length; p++) sNew[p] = remaining[p - 1];
    project.pages[src] = sNew;
  }
  project.currentPage = tgt;
  return { page: tgt, srcPage: src, index: insertPos, count: sel.length, movedIds: movedIds, deletesSrcPage: deletesSrcPage, fields: [] };
}
