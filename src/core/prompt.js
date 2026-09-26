export function composePanelPrompt(input) {
  const inp = input || {};
  const charParts = [];
  const chars = inp.chars || [];
  for (const c of chars) {
    if (!c) continue;
    charParts.push(c.base == null ? "" : c.base);
    charParts.push(c.extra == null ? "" : c.extra);
  }
  const locKey = inp.locKey;
  const locDesc = inp.locDesc == null ? "" : inp.locDesc;
  const locExtra = inp.locExtra == null ? "" : inp.locExtra;
  const action = inp.action == null ? "" : inp.action;
  const hasLocSelected = !!locKey && locKey !== "none";
  const fullPrompt = [inp.positive, ...charParts, locDesc, locExtra, action]
    .map((s) => (s || "").trim()).filter(Boolean).join(", ");
  const hasContent = charParts.length > 0 || hasLocSelected || locDesc.trim() !== "" || locExtra.trim() !== "" || action.trim() !== "";
  const override = inp.override;
  if (override) return { fullPrompt: override.pos, negativePrompt: override.neg, hasContent: override.pos.trim() !== "" };
  return { fullPrompt, negativePrompt: inp.negative, hasContent };
}
