export const IMAGES_VERSION = 1;

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

  return { pageImages, get, has, hasAny, count, getPanel, allPages, hasAnywhere };
}
