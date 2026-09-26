const JSON_NUM_RE = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

export function jsonTokenize(text) {
  const toks = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    const c = text[i];
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t') { i++; continue; }
    if (c === '{' || c === '}' || c === '[' || c === ']' || c === ':' || c === ',') { toks.push({ type: 'punct', val: c, start: i, end: i + 1 }); i++; continue; }
    if (c === '"') {
      const start = i;
      i++;
      let closed = false;
      while (i < n) {
        const ch = text[i];
        if (ch === '\\') { i += 2; continue; }
        if (ch === '\n') break;
        if (ch === '"') { i++; closed = true; break; }
        i++;
      }
      if (!closed) return { error: { start, end: Math.min(n, i), message: 'Unterminated string — add the closing double-quote.' } };
      toks.push({ type: 'string', start, end: i, raw: text.slice(start + 1, i - 1) });
      continue;
    }
    JSON_NUM_RE.lastIndex = i;
    const nm = JSON_NUM_RE.exec(text);
    if (nm && nm.index === i) { toks.push({ type: 'number', start: i, end: i + nm[0].length, raw: nm[0] }); i += nm[0].length; continue; }
    if (text.startsWith('true', i)) { toks.push({ type: 'literal', start: i, end: i + 4, raw: 'true' }); i += 4; continue; }
    if (text.startsWith('false', i)) { toks.push({ type: 'literal', start: i, end: i + 5, raw: 'false' }); i += 5; continue; }
    if (text.startsWith('null', i)) { toks.push({ type: 'literal', start: i, end: i + 4, raw: 'null' }); i += 4; continue; }
    return { error: { start: i, end: i + 1, message: 'Unexpected character ' + JSON.stringify(c) + ' — this is not valid JSON here.' } };
  }
  return { tokens: toks };
}

export function jsonDecodeRaw(raw) {
  let out = '';
  const map = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c !== '\\') { map.push(i); out += c; continue; }
    const e = raw[i + 1];
    const escStart = i;
    i++;
    if (e === 'u') {
      const hex = raw.slice(i + 1, i + 5);
      i += 4;
      map.push(escStart);
      out += String.fromCharCode(parseInt(hex, 16) || 0);
    } else {
      map.push(escStart);
      out += e === 'n' ? '\n' : e === 't' ? '\t' : e === 'r' ? '\r' : e === 'b' ? '\b' : e === 'f' ? '\f' : String(e === undefined ? '' : e);
    }
  }
  map.push(raw.length);
  return { text: out, map };
}

export function jsonParse(text) {
  const tk = jsonTokenize(text);
  if (tk.error) return { error: tk.error };
  const toks = tk.tokens;
  const scalars = [];
  const containers = [];
  const valRanges = new Map();
  const keyRanges = new Map();
  const puncts = toks.filter(t => t.type === 'punct');
  let pos = 0;
  const pkey = p => p.join('\u0000');

  function err(tok, message) {
    const t = tok || toks[toks.length - 1];
    return { error: { start: t ? t.start : 0, end: t ? t.end : Math.min(1, text.length), message } };
  }

  function parseValue(path) {
    const t = toks[pos];
    if (!t) return err(null, 'Unexpected end of document — a value is missing here.');
    if (t.type === 'punct' && t.val === '{') {
      const start = t.start;
      pos++;
      const obj = {};
      if (toks[pos] && toks[pos].type === 'punct' && toks[pos].val === '}') { const e = toks[pos].end; pos++; containers.push({ path, start, end: e }); valRanges.set(pkey(path), { start, end: e }); return { v: obj }; }
      for (;;) {
        const kt = toks[pos];
        if (!kt) return err(null, 'Unexpected end of document — a closing brace } is missing.');
        if (kt.type !== 'string') return err(kt, 'Object property names must be double-quoted strings.');
        pos++;
        const cp = toks[pos];
        if (!cp || cp.type !== 'punct' || cp.val !== ':') return err(cp || kt, 'Missing : after the property name.');
        pos++;
        const fpath = path.concat([kt.raw]);
        scalars.push({ path: fpath, kind: 'key', start: kt.start, end: kt.end, raw: kt.raw });
        keyRanges.set(pkey(fpath), { start: kt.start, end: kt.end });
        const r = parseValue(fpath);
        if (r.error) return r;
        obj[kt.raw] = r.v;
        const nt = toks[pos];
        if (nt && nt.type === 'punct' && nt.val === ',') { pos++; continue; }
        if (nt && nt.type === 'punct' && nt.val === '}') { const e = nt.end; pos++; containers.push({ path, start, end: e }); valRanges.set(pkey(path), { start, end: e }); return { v: obj }; }
        return err(nt || kt, 'Expected a comma or a closing brace } in the object.');
      }
    }
    if (t.type === 'punct' && t.val === '[') {
      const start = t.start;
      pos++;
      const arr = [];
      if (toks[pos] && toks[pos].type === 'punct' && toks[pos].val === ']') { const e = toks[pos].end; pos++; containers.push({ path, start, end: e }); valRanges.set(pkey(path), { start, end: e }); return { v: arr }; }
      for (;;) {
        const r = parseValue(path.concat([String(arr.length)]));
        if (r.error) return r;
        arr.push(r.v);
        const nt = toks[pos];
        if (nt && nt.type === 'punct' && nt.val === ',') { pos++; continue; }
        if (nt && nt.type === 'punct' && nt.val === ']') { const e = nt.end; pos++; containers.push({ path, start, end: e }); valRanges.set(pkey(path), { start, end: e }); return { v: arr }; }
        return err(nt || null, 'Expected a comma or a closing bracket ] in the array.');
      }
    }
    if (t.type === 'string') {
      pos++;
      const dec = jsonDecodeRaw(t.raw);
      scalars.push({ path, kind: 'string', start: t.start, end: t.end, raw: t.raw, value: dec.text, decoded: dec.text, map: dec.map });
      valRanges.set(pkey(path), { start: t.start, end: t.end });
      return { v: dec.text };
    }
    if (t.type === 'number') {
      pos++;
      const num = Number(t.raw);
      scalars.push({ path, kind: 'number', start: t.start, end: t.end, raw: t.raw, value: num });
      valRanges.set(pkey(path), { start: t.start, end: t.end });
      return { v: num };
    }
    if (t.type === 'literal') {
      pos++;
      const v = t.raw === 'true' ? true : (t.raw === 'false' ? false : null);
      scalars.push({ path, kind: 'literal', start: t.start, end: t.end, raw: t.raw, value: v });
      valRanges.set(pkey(path), { start: t.start, end: t.end });
      return { v };
    }
    return err(t, 'Unexpected token ' + JSON.stringify(t.val || t.raw) + ' — a value was expected here.');
  }

  const r = parseValue([]);
  if (r.error) return r;
  if (pos < toks.length) return err(toks[pos], 'Unexpected extra content after the end of the document.');
  return { doc: r.v, scalars, containers, puncts, valRanges, keyRanges };
}
