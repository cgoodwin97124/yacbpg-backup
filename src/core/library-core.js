export const LIB_TYPE_PREFIX = { Character: 'char', Location: 'loc', Action: 'act', 'Panel Description': 'pd' };

export function libIdFor(type, now, rand) {
  return (LIB_TYPE_PREFIX[type] || 'obj') + '-' + now + '-' + rand;
}

export function libRefValue(type, id) {
  return 'lib:' + type + ':' + id;
}

export function isLibRef(value) {
  return String(value == null ? '' : value).indexOf('lib:') === 0;
}

export function parseLibRef(value) {
  if (!isLibRef(value)) return null;
  const parts = String(value).split(':');
  return { type: parts[1], id: parts[2] };
}

export function libRefNeedles(id) {
  return ['lib:char:' + id, 'lib:loc:' + id, 'lib:act:' + id];
}

export function countLibRefs(data, id) {
  const needles = libRefNeedles(id);
  let n = 0;
  const visit = (v) => {
    if (typeof v === 'string') { if (needles.indexOf(v) !== -1) n++; return; }
    if (Array.isArray(v)) { for (const x of v) visit(x); return; }
    if (v && typeof v === 'object') { for (const k in v) visit(v[k]); }
  };
  visit(data);
  return n;
}

export function normalizeLibType(o) {
  const t = o && o.type;
  if (t === 'Character' || t === 'Location' || t === 'Action' || t === 'Panel Description') return t;
  const id = String((o && o.id) || '');
  if (id.startsWith('loc-')) return 'Location';
  if (id.startsWith('act-')) return 'Action';
  if (id.startsWith('pd-')) return 'Panel Description';
  return 'Character';
}

export function panelDescMatch(objs, text) {
  const t = String(text == null ? '' : text).trim();
  if (!t) return null;
  return (objs || []).find(e => e && normalizeLibType(e) === 'Panel Description' && String(e.desc || '').trim() === t) || null;
}

export function extractLibraryItems(data) {
  const out = [];
  if (!data || typeof data !== 'object') return out;
  if (Array.isArray(data.libObjects)) {
    for (const o of data.libObjects) if (o && typeof o === 'object') out.push({ type: normalizeLibType(o), name: String(o.name || '').trim(), desc: String(o.desc || '').trim() });
  } else {
    const legacy = [['charLibrary', 'Character'], ['locLibrary', 'Location'], ['actLibrary', 'Action']];
    for (const [key, type] of legacy) {
      if (Array.isArray(data[key])) for (const o of data[key]) if (o && typeof o === 'object') out.push({ type: type, name: String(o.name || '').trim(), desc: String(o.desc || '').trim() });
    }
  }
  return out.filter(o => o.name || o.desc);
}

export function libRefEntry(objs, selValue) {
  const ref = parseLibRef(selValue);
  if (!ref) return null;
  return (objs || []).find(e => e && e.id === ref.id) || null;
}

export function libRefDesc(objs, selValue) {
  const entry = libRefEntry(objs, selValue);
  return entry ? (entry.desc || '') : '';
}
