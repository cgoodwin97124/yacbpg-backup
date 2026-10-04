export const IMAGES_VERSION = 3;

function isMap(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function slotIndex(k) {
  return (typeof k === "number" && Number.isInteger(k) && k >= 1) ? k - 1 : -1;
}

function isId(v) {
  return typeof v === "string" && v ? v : null;
}

function nonEmptySlots(a) {
  return Array.isArray(a) && a.some((d) => !!d);
}

export function createImageStore(opts) {
  const O = opts || {};
  const resolve = (typeof O.resolveId === "function") ? O.resolveId : () => null;
  const positions = (typeof O.listPositions === "function") ? O.listPositions : () => [];
  const D = {};

  function idOf(pg, pos) {
    let id = null;
    try { id = resolve(pg, pos); } catch (e) { id = null; }
    return isId(id);
  }

  function slotArr(pg, pos) {
    const id = idOf(pg, pos);
    return (id && Array.isArray(D[id])) ? D[id] : null;
  }

  function get(pg, pos, k) {
    const si = slotIndex(k);
    if (si < 0) return undefined;
    const a = slotArr(pg, pos);
    return a ? a[si] : undefined;
  }

  function has(pg, pos, k) {
    return !!get(pg, pos, k);
  }

  function hasAny(pg, pos) {
    const a = slotArr(pg, pos);
    return !!a && a.some((d) => !!d);
  }

  function count(pg, pos) {
    const a = slotArr(pg, pos);
    if (!a) return 0;
    let n = 0;
    for (const d of a) if (d) n++;
    return n;
  }

  function getPanel(pg, pos) {
    const a = slotArr(pg, pos);
    return a ? a.slice() : null;
  }

  function hasAnywhere() {
    for (const id of Object.keys(D)) {
      if (nonEmptySlots(D[id])) return true;
    }
    return false;
  }

  function set(pg, pos, k, url) {
    const si = slotIndex(k);
    if (si < 0) return false;
    const id = idOf(pg, pos);
    if (!id) return false;
    let a = D[id];
    if (!Array.isArray(a)) { a = []; D[id] = a; }
    a[si] = url;
    return true;
  }

  function clearSlot(pg, pos, k) {
    const si = slotIndex(k);
    if (si < 0) return false;
    const id = idOf(pg, pos);
    if (!id) return false;
    const a = Array.isArray(D[id]) ? D[id] : null;
    if (!a) return false;
    delete a[si];
    return true;
  }

  function clearPanel(pg, pos) {
    const id = idOf(pg, pos);
    if (!id) return false;
    D[id] = [];
    return true;
  }

  function ensurePanel(pg, pos) {
    const id = idOf(pg, pos);
    if (!id) return false;
    if (!Array.isArray(D[id])) D[id] = [];
    return true;
  }

  function swapSlots(pg, pos, a, b) {
    const ai = slotIndex(a);
    const bi = slotIndex(b);
    if (ai < 0 || bi < 0) return false;
    const id = idOf(pg, pos);
    if (!id) return false;
    const arr = Array.isArray(D[id]) ? D[id] : null;
    if (!arr) return false;
    const t = arr[ai];
    arr[ai] = arr[bi];
    arr[bi] = t;
    return true;
  }

  function getById(id, k) {
    const si = slotIndex(k);
    if (si < 0) return undefined;
    const key = isId(id);
    const a = (key && Array.isArray(D[key])) ? D[key] : null;
    return a ? a[si] : undefined;
  }

  function setById(id, k, url) {
    const si = slotIndex(k);
    const key = isId(id);
    if (si < 0 || !key) return false;
    let a = D[key];
    if (!Array.isArray(a)) { a = []; D[key] = a; }
    a[si] = url;
    return true;
  }

  function getPanelById(id) {
    const key = isId(id);
    const a = (key && Array.isArray(D[key])) ? D[key] : null;
    return a ? a.slice() : null;
  }

  function absorbPage(pg, posMap) {
    const src = isMap(posMap) ? posMap : {};
    let list = [];
    try { list = positions(pg) || []; } catch (e) { list = []; }
    for (const pos of list) {
      const id = idOf(pg, pos);
      if (!id) continue;
      if (Object.prototype.hasOwnProperty.call(src, pos) && nonEmptySlots(src[pos])) {
        D[id] = src[pos].slice();
      } else {
        delete D[id];
      }
    }
    return true;
  }

  function prune(liveIds) {
    const keep = new Set(Array.isArray(liveIds) ? liveIds : []);
    let dropped = 0;
    for (const id of Object.keys(D)) {
      if (!keep.has(id)) { delete D[id]; dropped++; }
    }
    return dropped;
  }

  function snapshot() {
    const out = {};
    for (const id of Object.keys(D)) out[id] = D[id].slice();
    return out;
  }

  function restore(snap) {
    for (const id of Object.keys(D)) delete D[id];
    if (isMap(snap)) {
      for (const id of Object.keys(snap)) {
        if (Array.isArray(snap[id])) D[id] = snap[id].slice();
      }
    }
    return true;
  }

  function resetAll() {
    for (const id of Object.keys(D)) delete D[id];
    return true;
  }

  return { get, has, hasAny, count, getPanel, hasAnywhere, set, clearSlot, clearPanel, ensurePanel, swapSlots, getById, setById, getPanelById, absorbPage, prune, snapshot, restore, resetAll };
}
