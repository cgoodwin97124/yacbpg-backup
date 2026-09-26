export function panelSeedValue(panelRaw, globalRaw, i) {
  if (panelRaw !== "") {
    const ps = parseInt(panelRaw, 10);
    if (!isNaN(ps)) return { seed: ps, hasSeed: true };
  }
  const parsedSeed = parseInt(globalRaw, 10);
  if (globalRaw !== "" && !isNaN(parsedSeed)) return { seed: parsedSeed + (i - 1), hasSeed: true };
  return { seed: -1, hasSeed: false };
}

export function imageSeed(seed, k, same) {
  return same ? seed : seed + (k - 1);
}

export function scrubMinusOneSeeds(settings) {
  if (!settings || typeof settings !== 'object') return;
  const drop = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    const v = obj.seed;
    if (v === -1 || v === '-1' || (typeof v === 'string' && v.trim() === '-1')) obj.seed = '';
  };
  drop(settings);
  if (settings.pages && typeof settings.pages === 'object') {
    for (const k in settings.pages) {
      const page = settings.pages[k];
      drop(page);
      if (!page || typeof page !== 'object') continue;
      for (let i = 1; i <= 24; i++) drop(page[i]);
    }
  }
}
