const STORE = "yacbpg.awake.probe";
const awakeNow = () => { try { return localStorage.getItem("comicGen.keepAwake") === "1" ? 1 : 0; } catch (e) { return 0; } };
const loadStore = () => { try { return JSON.parse(sessionStorage.getItem(STORE) || "null") || { rows: [], events: [], workers: [], ua: navigator.userAgent }; } catch (e) { return { rows: [], events: [], workers: [], ua: navigator.userAgent }; } };
const saveStore = (s) => { try { sessionStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {} };

if (!window.__awakeProbe) {
  const S = loadStore();
  const carried = (S.rows || []).length ? Math.max.apply(null, (S.rows || []).map((r) => r.t)) + 1000 : 0;
  const P = { t0: Date.now() - carried, rows: S.rows || [], events: S.events || [], workers: S.workers || [], ua: S.ua || navigator.userAgent, rafVisible: 0, rafHidden: 0, worker: null, workerErr: null };
  window.__awakeProbe = P;
  P.save = () => saveStore({ ua: P.ua, state: window.keepAwakeStateText ? window.keepAwakeStateText() : null, rows: P.rows.slice(-900), events: P.events.slice(-80), workers: P.workers.slice(-60) });
  P.fast = setInterval(() => { const hidden = document.hidden; if (hidden) { P.rows.push({ t: Date.now() - P.t0, h: 1, a: awakeNow() }); if (P.rows.length % 8 === 0) P.save(); } }, 250);
  P.slow = setInterval(() => { if (!document.hidden) { P.rows.push({ t: Date.now() - P.t0, h: 0, a: awakeNow() }); if (P.rows.length % 8 === 0) P.save(); } }, 1000);
  const raf = () => { if (document.hidden) P.rafHidden++; else P.rafVisible++; requestAnimationFrame(raf); };
  try { requestAnimationFrame(raf); } catch (e) {}
  try {
    const src = "let n = 0; setInterval(() => { n++; postMessage({ n: n, at: Date.now() }); }, 100);";
    P.worker = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
    P.worker.onmessage = (e) => { P.workers.push({ t: Date.now() - P.t0, at: e.data.at, n: e.data.n }); if (P.workers.length > 200) P.workers.shift(); if (P.workers.length % 5 === 0) P.save(); };
  } catch (e) { P.workerErr = String((e && e.message) || e); }
  document.addEventListener("visibilitychange", () => { P.events.push({ t: Date.now() - P.t0, h: document.hidden ? 1 : 0, a: awakeNow() }); P.save(); });
  window.addEventListener("pagehide", () => P.save());
  window.__awakeReset = () => { P.rows = []; P.events = []; P.workers = []; P.rafHidden = 0; P.rafVisible = 0; P.t0 = Date.now(); P.save(); return "reset"; };
  window.__awakeStop = () => { try { clearInterval(P.fast); } catch (e) {} try { clearInterval(P.slow); } catch (e) {} try { if (P.worker) P.worker.terminate(); } catch (e) {} P.save(); return "stopped"; };
  P.save();
}

window.__awakeReport = () => {
  const S = loadStore();
  const rows = S.rows || [];
  const stat = (a) => (a.length ? { n: a.length, min: Math.min.apply(null, a), median: a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)], max: Math.max.apply(null, a) } : null);
  const gapsBy = (aWanted) => { const out = []; let prev = null; for (const r of rows) { if (!r.h) { prev = null; continue; } if (r.a !== aWanted) { prev = r; continue; } if (prev) { const g = r.t - prev.t; if (g > 0) out.push(g); } prev = r; } return out; };
  const spans = []; let cur = null;
  for (const r of rows) {
    if (r.h) { if (!cur) cur = { start: r.t, end: r.t, awake: r.a }; else { cur.end = r.t; cur.awake = Math.max(cur.awake, r.a); } }
    else if (cur) { spans.push(cur); cur = null; }
  }
  if (cur) spans.push(cur);
  const w = S.workers || [];
  const wk = []; for (let i = 1; i < w.length; i++) { if (w[i].n > w[i - 1].n) wk.push(w[i].t - w[i - 1].t); }
  return {
    ua: S.ua || navigator.userAgent,
    hiddenNow: document.hidden,
    keepAwake: { storedPref: (() => { try { return localStorage.getItem("comicGen.keepAwake"); } catch (e) { return null; } })(), state: window.keepAwakeStateText ? window.keepAwakeStateText() : null, probeLive: !!window.__awakeProbe },
    rows: rows.length,
    hiddenRows: rows.filter((r) => r.h).length,
    hiddenSpans: spans.slice(-12),
    hiddenHeartbeatGap_awakeOff: stat(gapsBy(0)),
    hiddenHeartbeatGap_awakeOn: stat(gapsBy(1)),
    raf: window.__awakeProbe ? { visible: window.__awakeProbe.rafVisible, hidden: window.__awakeProbe.rafHidden } : null,
    worker: { samples: w.length, gapMs: stat(wk), err: (window.__awakeProbe && window.__awakeProbe.workerErr) || null },
    events: S.events || [],
    probeRunning: !!window.__awakeProbe,
  };
};
return window.__awakeReport();
