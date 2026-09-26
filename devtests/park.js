if (!window.__park) {
  window.__park = (function () {
    const KEY = "__test_backup_v10";
    const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
    const snap = () => { const m = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); m[k] = localStorage.getItem(k); } return m; };
    const canon = (m) => Object.keys(m).sort().map(k => k + "=" + m[k]).join("\n");
    const keysOf = (m) => Object.keys(m).sort();

    function park() {
      const m = snap();
      localStorage.setItem(KEY, JSON.stringify(m));
      const back = JSON.parse(localStorage.getItem(KEY));
      const okReadBack = keysOf(m).length === keysOf(back).length && keysOf(m).every(k => back[k] === m[k]);
      const hash = fnv(canon(m));
      window.__parked = { hash, count: keysOf(m).length - 1, keys: keysOf(m).filter(k => k !== KEY) };
      return { count: window.__parked.count, okReadBack, hash, keys: window.__parked.keys };
    }

    function check() {
      const now = snap();
      delete now[KEY];
      const hash = fnv(canon(now));
      const keys = keysOf(now);
      const added = keys.filter(k => !window.__parked.keys.includes(k));
      const removed = window.__parked.keys.filter(k => !keys.includes(k));
      return { hash, matchesParked: hash === window.__parked.hash, keys, added, removed };
    }

    function restore() {
      const m = JSON.parse(localStorage.getItem(KEY));
      for (const k of keysOf(snap())) localStorage.removeItem(k);
      for (const k of keysOf(m)) localStorage.setItem(k, m[k]);
      localStorage.removeItem(KEY);
      const now = snap();
      const hash = fnv(canon(now));
      return { hash, byteIdentical: hash === window.__parked.hash, keys: keysOf(now), parkKeyGone: localStorage.getItem(KEY) === null, strays: keysOf(now).filter(k => k.startsWith("__")) };
    }

    return { park, check, restore, fnv, PARK_KEY: KEY };
  })();
}
return window.__park.park();
