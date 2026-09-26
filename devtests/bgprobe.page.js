if (!window.__bgProbe) {
  const P = { t0: performance.now(), ticks: [], raf: 0, rafHidden: 0, rafVisible: 0, events: [], worker: null, workerAt: null, workerLast: null };
  window.__bgProbe = P;
  P.workerSrc = 'let n = 0; const t0 = performance.now(); setInterval(() => { n++; }, 100); onmessage = () => { postMessage({ n: n, ms: Math.round(performance.now() - t0) }); };';
  try {
    P.worker = new Worker(URL.createObjectURL(new Blob([P.workerSrc], { type: "text/javascript" })));
    P.workerAt = performance.now();
    P.worker.onmessage = (e) => { P.workerLast = e.data; P.workerSample = { n: e.data.n, ms: e.data.ms, at: Math.round(performance.now() - P.t0) }; };
  } catch (e) { P.workerError = String(e && e.message || e); }
  P.ticker = setInterval(() => { P.ticks.push({ at: Math.round(performance.now() - P.t0), hidden: document.hidden }); }, 1000);
  const raf = () => { P.raf++; if (document.hidden) P.rafHidden++; else P.rafVisible++; requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.addEventListener("visibilitychange", () => {
    P.events.push({ at: Math.round(performance.now() - P.t0), hidden: document.hidden, ticks: P.ticks.length, raf: P.raf });
  });
  window.__bgReset = () => { P.t0 = performance.now(); P.ticks = []; P.events = []; P.raf = 0; P.rafHidden = 0; P.rafVisible = 0; return "reset"; };
  window.__bgStop = () => { try { clearInterval(P.ticker); } catch (e) {} try { if (P.worker) P.worker.terminate(); } catch (e) {} P.stopped = true; return "stopped"; };
  window.__bgReport = async () => {
    const ticks = P.ticks;
    const gaps = [];
    for (let i = 1; i < ticks.length; i++) gaps.push({ gap: ticks[i].at - ticks[i - 1].at, fromHidden: ticks[i - 1].hidden });
    const hiddenGaps = gaps.filter((g) => g.fromHidden).map((g) => g.gap);
    const visibleGaps = gaps.filter((g) => !g.fromHidden).map((g) => g.gap);
    const stat = (a) => a.length ? { n: a.length, min: Math.min(...a), median: a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)], max: Math.max(...a) } : null;
    if (P.worker) { try { P.worker.postMessage({ q: "n" }); } catch (e) {} await new Promise((r) => setTimeout(r, 700)); }
    return {
      elapsedMs: Math.round(performance.now() - P.t0),
      ticks: ticks.length,
      hiddenNow: document.hidden,
      events: P.events,
      pageTimerWhileHidden: stat(hiddenGaps),
      pageTimerWhileVisible: stat(visibleGaps),
      rafTicks: P.raf,
      rafWhileHidden: P.rafHidden || 0,
      rafWhileVisible: P.rafVisible || 0,
      worker: P.workerLast ? { ticks: P.workerLast.n, elapsedMs: P.workerLast.ms, perTickMs: Math.round((P.workerLast.ms / Math.max(1, P.workerLast.n)) * 10) / 10, at: Math.round(performance.now() - P.t0) } : (P.workerError || "no reply yet"),
    };
  };
}
return { installed: true, workerError: window.__bgProbe.workerError || null, now: window.__bgReport() };
