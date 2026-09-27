export const COMMANDS_VERSION = 1;

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

export const COMMANDS = { setTitle: setTitle };
