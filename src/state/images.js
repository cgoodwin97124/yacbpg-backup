export const IMAGES_VERSION = 2;

function isMap(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function slotsOf(map, pos) {
  if (!isMap(map)) return null;
  const a = map[pos];
  return Array.isArray(a) ? a : null;
}

function slotIndex(k) {
  return (typeof k === "number" && Number.isInteger(k) && k >= 1) ? k - 1 : -1;
}

export function createImageStore(maps) {
  const M = maps || {};

  function pageImages(pg) {
    if (pg === M.currentPage) return isMap(M.current) ? M.current : {};
    const sess = isMap(M.sessions) ? M.sessions[pg] : null;
    const imgs = sess ? sess.images : null;
    return isMap(imgs) ? imgs : {};
  }

  function get(pg, pos, k) {
    const si = slotIndex(k);
    if (si < 0) return undefined;
    const a = slotsOf(pageImages(pg), pos);
    return a ? a[si] : undefined;
  }

  function has(pg, pos, k) {
    return !!get(pg, pos, k);
  }

  function hasAny(pg, pos) {
    const a = slotsOf(pageImages(pg), pos);
    return !!a && a.some((d) => !!d);
  }

  function count(pg, pos) {
    const a = slotsOf(pageImages(pg), pos);
    if (!a) return 0;
    let n = 0;
    for (const d of a) if (d) n++;
    return n;
  }

  function getPanel(pg, pos) {
    const a = slotsOf(pageImages(pg), pos);
    return a ? a.slice() : null;
  }

  function allPages() {
    const out = {};
    if (isMap(M.sessions)) {
      for (const pg of Object.keys(M.sessions)) {
        const sess = M.sessions[pg];
        if (sess && isMap(sess.images)) out[pg] = sess.images;
      }
    }
    out[M.currentPage] = pageImages(M.currentPage);
    return out;
  }

  function hasAnywhere() {
    const seen = new Set();
    const scan = (map) => {
      if (!isMap(map)) return false;
      for (const pos of Object.keys(map)) {
        const a = map[pos];
        if (Array.isArray(a) && a.some((d) => !!d)) return true;
      }
      return false;
    };
    if (scan(isMap(M.current) ? M.current : null)) return true;
    if (isMap(M.sessions)) {
      for (const pg of Object.keys(M.sessions)) {
        if (seen.has(pg)) continue;
        seen.add(pg);
        const sess = M.sessions[pg];
        if (sess && scan(sess.images)) return true;
      }
    }
    return false;
  }

  function writableMap(pg) {
    if (pg === M.currentPage) return isMap(M.current) ? M.current : null;
    const sess = isMap(M.sessions) ? M.sessions[pg] : null;
    const imgs = sess ? sess.images : null;
    return isMap(imgs) ? imgs : null;
  }

  function set(pg, pos, k, url) {
    const si = slotIndex(k);
    if (si < 0) return false;
    const map = writableMap(pg);
    if (!map) return false;
    let a = map[pos];
    if (!Array.isArray(a)) { a = []; map[pos] = a; }
    a[si] = url;
    return true;
  }

  function clearSlot(pg, pos, k) {
    const si = slotIndex(k);
    if (si < 0) return false;
    const map = writableMap(pg);
    if (!map) return false;
    const a = Array.isArray(map[pos]) ? map[pos] : null;
    if (!a) return false;
    delete a[si];
    return true;
  }

  function clearPanel(pg, pos) {
    const map = writableMap(pg);
    if (!map) return false;
    map[pos] = [];
    return true;
  }

  function ensurePanel(pg, pos) {
    const map = writableMap(pg);
    if (!map) return false;
    if (!Array.isArray(map[pos])) map[pos] = [];
    return true;
  }

  function swapSlots(pg, pos, a, b) {
    const ai = slotIndex(a);
    const bi = slotIndex(b);
    if (ai < 0 || bi < 0) return false;
    const map = writableMap(pg);
    if (!map) return false;
    const arr = Array.isArray(map[pos]) ? map[pos] : null;
    if (!arr) return false;
    const t = arr[ai];
    arr[ai] = arr[bi];
    arr[bi] = t;
    return true;
  }

  function setPage(pg, map) {
    const src = isMap(map) ? map : {};
    if (pg === M.currentPage) {
      const cur = isMap(M.current) ? M.current : null;
      if (!cur) return false;
      for (const k of Object.keys(cur)) delete cur[k];
      Object.assign(cur, src);
      if (isMap(M.sessions)) M.sessions[pg] = Object.assign({}, M.sessions[pg] || {}, { images: cur });
      return true;
    }
    if (!isMap(M.sessions)) return false;
    M.sessions[pg] = Object.assign({}, M.sessions[pg] || {}, { images: src });
    return true;
  }

  return { pageImages, get, has, hasAny, count, getPanel, allPages, hasAnywhere, set, clearSlot, clearPanel, ensurePanel, swapSlots, setPage };
}
