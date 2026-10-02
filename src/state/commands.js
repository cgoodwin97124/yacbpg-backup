export const COMMANDS_VERSION = 27;

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

export function setAction(project, id, value) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  hit.panel.action = text(value);
  return { page: hit.page, index: hit.index, fields: ["action"] };
}

export function setLoc(project, id, sel, base) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  const s = text(sel);
  hit.panel.loc = s;
  hit.panel.locBase = text(base);
  const fields = ["loc", "locBase"];
  if (s === "none" || s === "") { hit.panel.locExtra = ""; fields.push("locExtra"); }
  return { page: hit.page, index: hit.index, fields: fields };
}

export function setChar(project, id, slot, sel, base) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1 || n > 3) return null;
  if (!Array.isArray(hit.panel.chars)) hit.panel.chars = [];
  while (hit.panel.chars.length < 3) hit.panel.chars.push({ sel: "none", base: "", extra: "" });
  const c = hit.panel.chars[n - 1];
  if (!isObj(c)) hit.panel.chars[n - 1] = { sel: "none", base: "", extra: "" };
  const entry = hit.panel.chars[n - 1];
  const s = text(sel);
  entry.sel = s;
  entry.base = text(base);
  const fields = ["charSel", "charBase"];
  if (s === "none" || s === "") { entry.extra = ""; fields.push("charExtra"); }
  return { page: hit.page, index: hit.index, slot: n, fields: fields };
}

export function setCharBase(project, id, slot, base) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1 || n > 3) return null;
  if (!Array.isArray(hit.panel.chars)) hit.panel.chars = [];
  while (hit.panel.chars.length < 3) hit.panel.chars.push({ sel: "none", base: "", extra: "" });
  if (!isObj(hit.panel.chars[n - 1])) hit.panel.chars[n - 1] = { sel: "none", base: "", extra: "" };
  hit.panel.chars[n - 1].base = text(base);
  return { page: hit.page, index: hit.index, slot: n, fields: ["charBase"] };
}

export function setLocBase(project, id, base) {
  const hit = findPanelById(project, id);
  if (!hit) return null;
  hit.panel.locBase = text(base);
  return { page: hit.page, index: hit.index, fields: ["locBase"] };
}

export const COMMANDS = { setTitle: setTitle, setImgCount: setImgCount, setStyle: setStyle, setSize: setSize, setPanelSeed: setPanelSeed, setSameSeed: setSameSeed, setProtect: setProtect, setPromptOverride: setPromptOverride, setAction: setAction, setChar: setChar, setCharBase: setCharBase, setLoc: setLoc, setLocBase: setLocBase, addPanel: addPanel, duplicatePanel: duplicatePanel, movePanel: movePanel, deletePanel: deletePanel, addPage: addPage, deletePage: deletePage, movePanelToPage: movePanelToPage, moveManyToPage: moveManyToPage, moveMany: moveMany, renumberPages: renumberPages, reflowInsert: reflowInsert, cascadeEntries: cascadeEntries, duplicateEntries: duplicateEntries, pasteEntries: pasteEntries, addEntries: addEntries, planRefill: planRefill };

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

export function moveMany(project, pageNum, total, indexes, toPos) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
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
  for (const n of sel) if (page[n] === undefined) return null;
  const selSet = {};
  for (const n of sel) selSet[n] = true;
  const rest = [];
  for (let p = 1; p <= t; p++) if (!selSet[p]) rest.push(p);
  const to = Number(toPos);
  if (!Number.isInteger(to)) return null;
  const insert = Math.min(Math.max(1, to), rest.length + 1);
  const order = rest.slice(0, insert - 1).concat(sel).concat(rest.slice(insert - 1));
  const movedIds = sel.map((n) => {
    const m = page[n];
    return (m && typeof m.id === "string") ? m.id : null;
  });
  const pc = countStateFor(t);
  const newPage = {};
  for (const k of ["name", "summary", "panelCountSel", "panelCountCustom", "seed"]) newPage[k] = page[k];
  newPage.panelCountSel = pc.sel;
  newPage.panelCountCustom = pc.custom;
  for (let p = 1; p <= t; p++) {
    if (page[order[p - 1]] !== undefined) newPage[p] = JSON.parse(JSON.stringify(page[order[p - 1]]));
  }
  project.pages[pageNum] = newPage;
  return { page: Number(pageNum), index: insert, count: sel.length, movedIds: movedIds, order: order, fields: [] };
}

export function renumberPages(project, fromKey, toPos, session) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const keys = [];
  for (const k of Object.keys(project.pages)) {
    const v = Number(k);
    if (String(v) === k && Number.isInteger(v) && v >= 1) keys.push(v);
  }
  keys.sort((a, b) => a - b);
  if (keys.length < 2) return null;
  const from = Number(fromKey);
  if (!Number.isInteger(from) || keys.indexOf(from) === -1) return null;
  const to = Math.max(1, Math.min(keys.length, parseInt(toPos, 10) || 1));
  const order = keys.filter((k) => k !== from);
  order.splice(to - 1, 0, from);
  const map = {};
  const newPages = {};
  order.forEach((oldKey, idx) => { newPages[idx + 1] = project.pages[oldKey]; map[oldKey] = idx + 1; });
  const sess = isObj(session) ? session : {};
  const newSession = {};
  for (const pg of Object.keys(sess)) {
    const nk = map[parseInt(pg, 10)];
    if (nk !== undefined) newSession[nk] = sess[pg];
  }
  const cur = Number(project.currentPage);
  if (!Number.isInteger(cur) || map[cur] === undefined) return null;
  project.pages = newPages;
  project.currentPage = map[cur];
  return { map: map, order: order, newCurrent: map[cur], toPos: to, session: newSession, fields: [] };
}

export function reflowInsert(project, srcPage, total, afterIndex, incomingPanel, incomingImg, images) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const src = Number(srcPage);
  if (!Number.isInteger(src) || src < 1) return null;
  const page = project.pages[src];
  if (!isObj(page)) return null;
  const t = Number(total);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  const after = Number(afterIndex);
  if (!Number.isInteger(after) || after < 1) return null;
  if (!isObj(incomingPanel)) return null;
  const imgs = isObj(images) ? images : {};
  const countOf = (pg) => {
    if (!isObj(pg)) return 0;
    const sel = String(pg.panelCountSel || "4");
    if (sel === "custom") {
      const n = parseInt(pg.panelCountCustom, 10);
      return isNaN(n) ? 4 : Math.min(24, Math.max(1, n));
    }
    const n = parseInt(sel, 10);
    return isNaN(n) ? 4 : Math.min(24, Math.max(1, n));
  };
  const count = countOf(page);
  if (count < 1 || count > 24) return null;
  const srcImgs = isObj(imgs[src]) ? imgs[src] : {};
  const insertPos = Math.min(after + 1, 24);
  const carryPanel = page[count] !== undefined ? JSON.parse(JSON.stringify(page[count])) : null;
  const carryImg = srcImgs[count] !== undefined ? JSON.parse(JSON.stringify(srcImgs[count])) : null;
  const order = [];
  for (let p = 1; p <= count - 1; p++) order.push(p);
  order.splice(insertPos - 1, 0, 0);
  const newPage = {};
  for (const k of ["name", "summary", "seed"]) newPage[k] = page[k];
  const newImgs = {};
  for (let p = 1; p <= 24; p++) {
    const op = order[p - 1];
    if (op === 0) {
      newPage[p] = JSON.parse(JSON.stringify(incomingPanel));
      if (incomingImg !== null && incomingImg !== undefined) newImgs[p] = JSON.parse(JSON.stringify(incomingImg));
    } else if (op !== undefined && page[op] !== undefined) {
      newPage[p] = JSON.parse(JSON.stringify(page[op]));
      if (srcImgs[op] !== undefined) newImgs[p] = JSON.parse(JSON.stringify(srcImgs[op]));
    }
  }
  const spc = countStateFor(24);
  newPage.panelCountSel = spc.sel;
  newPage.panelCountCustom = spc.custom;
  project.pages[src] = newPage;
  const outImages = {};
  outImages[src] = newImgs;
  const numKeys = [];
  for (const k of Object.keys(project.pages)) {
    const v = Number(k);
    if (String(v) === k && Number.isInteger(v) && v >= 1) numKeys.push(v);
  }
  numKeys.sort((a, b) => a - b);
  let pg = src;
  let moves = 0;
  let createdPage = null;
  let carry = carryPanel;
  let carryI = carryImg;
  while (carry) {
    let next = null;
    for (const k of numKeys) { if (k > pg) { next = k; break; } }
    moves++;
    if (next === null) {
      const n = numKeys.length ? Math.max.apply(null, numKeys) + 1 : 1;
      const np = { name: "", summary: "", panelCountSel: "1", panelCountCustom: "", seed: "" };
      np[1] = carry;
      project.pages[n] = np;
      numKeys.push(n);
      numKeys.sort((a, b) => a - b);
      const nimgs = {};
      if (carryI !== null && carryI !== undefined) nimgs[1] = carryI;
      outImages[n] = nimgs;
      createdPage = n;
      break;
    }
    const tp0 = project.pages[next];
    const tCount = countOf(tp0);
    const tImgs = isObj(imgs[next]) ? imgs[next] : {};
    const tp = {};
    for (const k of ["name", "summary", "seed"]) tp[k] = tp0[k];
    const tNew = {};
    tp[1] = carry;
    if (carryI !== null && carryI !== undefined) tNew[1] = carryI;
    let overflow = null;
    let overflowImg = null;
    for (let p = 1; p <= tCount; p++) {
      const dst = p + 1;
      if (dst <= 24) {
        if (tp0[p] !== undefined) tp[dst] = tp0[p];
        if (tImgs[p] !== undefined) tNew[dst] = tImgs[p];
      } else {
        overflow = tp0[p] !== undefined ? JSON.parse(JSON.stringify(tp0[p])) : null;
        overflowImg = tImgs[p] !== undefined ? JSON.parse(JSON.stringify(tImgs[p])) : null;
      }
    }
    const tpc = countStateFor(Math.min(tCount + 1, 24));
    tp.panelCountSel = tpc.sel;
    tp.panelCountCustom = tpc.custom;
    project.pages[next] = tp;
    outImages[next] = tNew;
    carry = overflow;
    carryI = overflowImg;
    pg = next;
  }
  project.currentPage = src;
  return { page: src, insertPos: insertPos, moves: moves, createdPage: createdPage, images: outImages, fields: [] };
}

export function duplicateEntries(project, pageNum, total, indexes, makeId) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
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
  if (typeof makeId !== "function") return null;
  for (const n of sel) if (page[n] === undefined) return null;
  const selSet = {};
  for (const n of sel) selSet[n] = true;
  const out = [];
  for (let p = 1; p <= t; p++) {
    out.push(JSON.parse(JSON.stringify(page[p] !== undefined ? page[p] : {})));
    if (selSet[p]) {
      const copy = JSON.parse(JSON.stringify(page[p]));
      const id = makeId();
      if (typeof id !== "string" || !id) return null;
      copy.id = id;
      out.push(copy);
    }
  }
  return out;
}

export function pasteEntries(project, pageNum, total, atIndex, copies, makeId) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
  const t = Number(total);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  const at = Number(atIndex);
  if (!Number.isInteger(at) || at < 1 || at > t) return null;
  if (!Array.isArray(copies) || !copies.length) return null;
  for (const c of copies) if (!isObj(c)) return null;
  if (typeof makeId !== "function") return null;
  if (page[at] === undefined) return null;
  const out = [];
  for (let p = 1; p <= t; p++) {
    if (p === at) {
      for (const c of copies) {
        const fresh = JSON.parse(JSON.stringify(c));
        const id = makeId();
        if (typeof id !== "string" || !id) return null;
        fresh.id = id;
        out.push(fresh);
      }
    }
    out.push(JSON.parse(JSON.stringify(page[p] !== undefined ? page[p] : {})));
  }
  return out;
}

export function addEntries(project, pageNum, total, lastSel, count) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const page = project.pages[pageNum];
  if (!isObj(page)) return null;
  const t = Number(total);
  if (!Number.isInteger(t) || t < 1 || t > 24) return null;
  const last = Number(lastSel);
  if (!Number.isInteger(last) || last < 1 || last > t) return null;
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1) return null;
  if (page[last] === undefined) return null;
  const out = [];
  for (let p = 1; p <= t; p++) {
    out.push(JSON.parse(JSON.stringify(page[p] !== undefined ? page[p] : {})));
    if (p === last) for (let k = 0; k < n; k++) out.push({});
  }
  return out;
}

export function planRefill(project, srcPage, keptLen, target) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const src = Number(srcPage);
  if (!Number.isInteger(src) || src < 1) return null;
  if (!isObj(project.pages[src])) return null;
  const kept = Number(keptLen);
  if (!Number.isInteger(kept) || kept < 0) return null;
  const tgt = Number(target);
  if (!Number.isInteger(tgt) || tgt < 1 || tgt > 24) return null;
  const countOf = (pg) => {
    if (!isObj(pg)) return 0;
    const sel = String(pg.panelCountSel || "4");
    if (sel === "custom") {
      const n = parseInt(pg.panelCountCustom, 10);
      return isNaN(n) ? 4 : Math.min(24, Math.max(1, n));
    }
    const n = parseInt(sel, 10);
    return isNaN(n) ? 4 : Math.min(24, Math.max(1, n));
  };
  const keys = [];
  for (const k of Object.keys(project.pages)) {
    const v = Number(k);
    if (String(v) === k && Number.isInteger(v) && v >= 1) keys.push(v);
  }
  keys.sort((a, b) => a - b);
  const plan = [];
  const emptied = [];
  let left = tgt - kept;
  if (left > 0) {
    for (const k of keys) {
      if (k <= src || left <= 0) continue;
      const c = countOf(project.pages[k]);
      const take = Math.min(left, c);
      if (take <= 0) continue;
      plan.push({ page: k, take: take });
      left -= take;
      if (c - take === 0) emptied.push(k);
    }
  }
  return { plan: plan, emptied: emptied, fields: [] };
}

export function cascadeEntries(project, srcPage, entries, images) {
  if (!isObj(project) || !isObj(project.pages)) return null;
  const src = Number(srcPage);
  if (!Number.isInteger(src) || src < 1) return null;
  const pages = project.pages;
  if (!isObj(pages[src])) return null;
  if (!Array.isArray(entries)) return null;
  const imgs = isObj(images) ? images : {};
  const countOf = (pg) => {
    if (!isObj(pg)) return 0;
    const sel = String(pg.panelCountSel || "4");
    if (sel === "custom") {
      const n = parseInt(pg.panelCountCustom, 10);
      return isNaN(n) ? 4 : Math.min(24, Math.max(1, n));
    }
    const n = parseInt(sel, 10);
    return isNaN(n) ? 4 : Math.min(24, Math.max(1, n));
  };
  const keys = [];
  for (const k of Object.keys(pages)) {
    const v = Number(k);
    if (String(v) === k && Number.isInteger(v) && v >= 1) keys.push(v);
  }
  keys.sort((a, b) => a - b);
  const build = (pg, list) => {
    const keep = list.slice(0, 24);
    const np = {};
    for (const k of ["name", "summary", "seed"]) np[k] = pages[pg][k];
    const nimgs = {};
    for (let p = 1; p <= keep.length; p++) {
      np[p] = JSON.parse(JSON.stringify(keep[p - 1].panel || {}));
      if (keep[p - 1].img !== null && keep[p - 1].img !== undefined) nimgs[p] = JSON.parse(JSON.stringify(keep[p - 1].img));
    }
    const pc = countStateFor(keep.length || 1);
    np.panelCountSel = pc.sel;
    np.panelCountCustom = pc.custom;
    return { page: np, imgs: nimgs };
  };
  const list = entries.map((e) => ({
    panel: isObj(e && e.panel) ? JSON.parse(JSON.stringify(e.panel)) : {},
    img: (e && e.img !== null && e.img !== undefined) ? JSON.parse(JSON.stringify(e.img)) : null
  }));
  let carry = list.slice(24);
  const first = build(src, list);
  pages[src] = first.page;
  const outImages = {};
  outImages[src] = first.imgs;
  let pg = src;
  let moves = 0;
  let createdPage = null;
  while (carry.length) {
    let next = null;
    for (const k of keys) { if (k > pg) { next = k; break; } }
    moves++;
    if (next === null) {
      const n = keys.length ? Math.max.apply(null, keys) + 1 : 1;
      const np = { name: "", summary: "", panelCountSel: "4", panelCountCustom: "", seed: "" };
      const pc = countStateFor(carry.length);
      np.panelCountSel = pc.sel;
      np.panelCountCustom = pc.custom;
      const nimgs = {};
      for (let p = 1; p <= carry.length; p++) {
        np[p] = carry[p - 1].panel;
        if (carry[p - 1].img !== null && carry[p - 1].img !== undefined) nimgs[p] = carry[p - 1].img;
      }
      pages[n] = np;
      keys.push(n);
      keys.sort((a, b) => a - b);
      outImages[n] = nimgs;
      createdPage = n;
      carry = [];
      break;
    }
    const tImgs = isObj(imgs[next]) ? imgs[next] : {};
    const tCount = countOf(pages[next]);
    const all = carry.slice();
    for (let p = 1; p <= tCount; p++) {
      all.push({
        panel: pages[next][p] !== undefined ? JSON.parse(JSON.stringify(pages[next][p])) : {},
        img: tImgs[p] !== undefined ? JSON.parse(JSON.stringify(tImgs[p])) : null
      });
    }
    carry = all.slice(24);
    const built = build(next, all);
    pages[next] = built.page;
    outImages[next] = built.imgs;
    pg = next;
  }
  project.currentPage = src;
  return { createdPage: createdPage, moves: moves, images: outImages, fields: [] };
}
