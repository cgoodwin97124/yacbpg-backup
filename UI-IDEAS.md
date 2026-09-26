# UI IDEAS — *Yet Another Comic Book Page Generator*

**Interface proposals, now that the functionality has been mapped.**

Written 2026-09-26. This assumes `FUNCTION-MAP.md` (what the app can do) and `REFACTOR-ROADMAP.md`
(what the code needs first). Nothing here is a commitment; it is a menu of options with the reasoning
attached, ordered so that the cheap, high-certainty wins come first.

---

## 1. The diagnosis, in one paragraph

Every feature arrived as *a control* — a chip, a checkbox, a button, a dialog — and each one had to be
put *somewhere*. The result is that a panel, which is conceptually "a picture plus a sentence or two",
is currently presented as a control panel of roughly sixty interactive elements: a header row (selection
checkbox, title field, Images / Style / Size selects, seed box, two seed chips, two preview chips, a
generate button, a move picker), a summary line, four image slots each with six chips beneath it, an
action row, and four accordions whose bodies hold about twenty more buttons. Multiply by 24 panels and
then add a menu bar, a generate bar, a bottom selection bar, a storyboard view, a focus view, an
analysis matrix, a JSON editor, a manual overlay, a library screen, and eight dialogs.

Nothing there is *wrong*; the app is remarkably complete. But the interface is organised by **when a
feature was requested**, not by **what the user is doing**. The ideas below are all attempts to organise
the same capabilities by task.

The three jobs hidden inside the current screen:

1. **Compose** — describe what is in each panel (the thing you do *before* rendering).
2. **Render** — start, watch, pause, judge, re-roll (the thing that takes real time).
3. **Review** — look at the page as a comic, compare variants, export (the thing you do *after*).

Today all three share one screen, and the toolbar for each is permanently visible.

---

## 2. Ideas, cheapest first

Each idea lists: **Problem → Proposal → Depends on → Risk**.

### A. A "what am I doing" mode switch (compose / render / review) — *the single biggest win*

**Problem.** The panel grid is simultaneously the editor, the progress display and the preview, so
generation progress competes with editing, and the review surfaces (Storyboard, Focus) are separate
screens that lose the editing context.

**Proposal.** Three modes over the *same* document, each with its own toolbar:
- **Compose** — the page as a form, one editing surface, no image chrome except a thumbnail per panel.
- **Render** — the page as a filmstrip of slots with progress, pause/stop, and a re-roll per panel;
  editing is disabled except for the prompt.
- **Review** — the page as a comic (current Storyboard, improved), with select/compare/export.

The mode is a property of the session (not saved), switched by a segmented control and by keyboard
(`1`/`2`/`3`). Because all three read the same model, a switch never loses work — which is exactly what
the state layer in the roadmap makes possible.

**Depends on.** P2–P3 (one state, one render path). Doing this on the DOM-as-state build would mean
three copies of the sync logic.

**Risk.** Low, if the modes are views over one model. Medium if implemented as three screens with their
own state — don't.

### B. The panel becomes an object, and there is one inspector

**Problem.** Every panel carries its own full editing surface, so the page cannot be scanned as a comic
and the same controls appear 24 times. It also makes the empty-panel state enormous (a blank panel shows
the same ~60 controls as a finished one).

**Proposal.** The page canvas shows compact **panel cards**: number, title, a thumbnail (or an empty
state), and a state badge (`empty` / `ready` / `rendering` / `done` / `failed`, plus 🔒 count). Clicking a
card selects it and opens a **single inspector** beside it (or as a bottom sheet on a phone) with the
full editing surface for that panel — characters, location, action, prompt, seed, images, history.
Selection for batch operations stays as it is (the checkbox + bottom bar), but editing stops being
per-panel chrome.

**Payoff.** The page becomes readable at a glance; the empty state becomes one line ("describe this
panel"); and all the per-panel UI duplication disappears, including the two Generate buttons and the
per-panel menu pile.

**Depends on.** P3 (panel ids + a real selection/command model) and P5 (view extraction).

**Risk.** Medium — this changes the author's muscle memory more than anything else here. Mitigation: keep
an "expand all" mode that renders every card in the old full-detail style until the new flow is trusted.

### C. A command palette and a real context menu

**Problem.** 199 exported actions, ~25 buttons per panel, and twice-copied button sets (the ⚙ Panel menu
and the Panel Selection section) exist because there is nowhere else to put an action. Nothing is
discoverable: the manual is the only index.

**Proposal.**
- A **command palette** (`Ctrl/⌘-K` or a header button) listing every action with its group and its
  keyboard shortcut: "Duplicate panel", "Generate selected", "Export .zip", "Open JSON editor", "Add
  page"…
- A **right-click / long-press context menu** on a panel with the same actions, scoped to that panel.
- A **selection action bar** (the existing bottom bar, promoted) that lists the same commands *for the
  selection*, instead of a second copy of the buttons living in a menu section.

**Payoff.** Every action gets exactly one home; the duplicated button sets can be retired; discoverability
stops depending on documentation; keyboard-first users get a path.

**Depends on.** P3 (commands) and P5 (delegation).

**Risk.** Low. Ship it right after the panel/inspector change.

### D. Generation as a first-class mode with a queue and a filmstrip

**Problem.** Generation is an `await` loop with a status line. Progress, history and comparison are
scattered: progress in the menu bar, results in the slots, history in an accordion, variants only as
"raise the image count".

**Proposal.**
- A **run panel** (in Render mode) showing the queue: one row per panel with its state, its seed, a
  thumbnail when done, and a per-row re-roll.
- **Pause / resume / stop** on the run, with the run's end target visible ("generating panels 3–9",
  reusing the existing to-here/range semantics).
- **Variants as a verb**: "render 3 more variants of this panel" becomes an explicit action, and the
  results land in a per-slot **version strip** (the last N renders for that slot, each with its seed,
  click to make it current, keep/discard). Prompt history already records what was sent — this surfaces
  it where the decision is made.
- **Failures are actionable**: the row shows the reason and a retry, instead of a message on the image.

**Depends on.** P4 (`history`/`generation` services); the version strip needs images to persist per slot
beyond "current".

**Risk.** Medium-low. The main cost is deciding whether a slot keeps a version history (memory).

### E. Prompt transparency — show the assembly, not the blob

**Problem.** The prompt is a composition of globals, preset, per-character descriptions, location,
action and per-panel overrides (see `FUNCTION-MAP.md` §11), but the interface offers it as one textarea.
Users cannot see *why* a phrase is in there, or that a description is being included twice because an
extra box duplicates it.

**Proposal.** A **prompt inspector** that renders the assembled prompt as labelled, colour-coded
segments (Global keywords · Style · [Character 1: base + extra] · [Location: base + extra] · Action),
each segment clickable to jump to the field that owns it. Editing a segment edits its source. A small
"advanced" affordance switches to the raw override textarea that exists today.

**Depends on.** P1 (`core/prompt.js` returning structured parts rather than a flat string).

**Risk.** Low, and it makes an existing expert feature (prompt override + per-panel descriptions)
comprehensible to a normal user.

### F. One dialog system, one destructive-action grammar

**Problem.** Destructive operations evolved one at a time: the confirm wording, the button order and the
escape hatches differ between clear-images, clear, delete, reset, import and library deletion. The
"Only This Panel" escape exists in some paths and not others (by design, but invisibly).

**Proposal.** One dialog primitive with a fixed grammar:
- a **title** that names the object and the count ("Clear 3 panels?");
- a **body** that enumerates exactly what will be lost (a generated list, not prose);
- a **primary danger button** whose label repeats the count and the verb;
- a secondary **"just this one"** escape whenever the action came from a panel context;
- **Cancel** always last, always the same colour;
- a **5-second undo** (see G) for anything reversible, which removes the need for most confirmations.

**Depends on.** P3 (one command per intent) — the dialog then belongs to the command, not the caller.

**Risk.** Low.

### G. Global undo (and a visible history)

**Problem.** There is no undo anywhere in the app except inside the JSON editor, which is precisely
where it is least needed.

**Proposal.** An undo stack over *commands* (not keystrokes): add/duplicate/delete/move/clear/paste/
import, plus image replacements. The bottom bar gets a "↶ Undo" with the last action named ("Undo delete
2 panels"). Structural undo is cheap once the store is the model (`{before, after}` snapshots of the
affected slice).

**Depends on.** P2–P4. This is the feature that makes every other destructive simplification safe, so it
pairs naturally with F.

**Risk.** Medium (memory), but bounded by keeping snapshots per command rather than per keystroke.

### H. Pages as a filmstrip

**Problem.** Pages are managed in a menu select; their thumbnails, order and per-page settings are three
different places, and reflow onto following pages is a documented surprise.

**Proposal.** A horizontal filmstrip of pages (mini comic thumbnails, names, panel counts) above or
below the page canvas: click to switch, drag to reorder, `+` to add, and a settings popover per page
(name, panel count, seed). Overflow from a reflow becomes *visible* because you can see the next page
receiving it.

**Depends on.** P5; benefits from the corrected page model in P3.

**Risk.** Low-medium (drag-and-drop on mobile). Keep the current select control as a fallback.

### I. Library picker with search and deviation markers

**Problem.** The library is a list of editable cards; choosing an item is a `<select>`. A panel's
description can *diverge* from its library object (the freeze rule), and nothing in the picker shows
that — you learn it from a small "edited" badge, if you notice.

**Proposal.**
- A **picker** (not a select): search, type filter, thumbnails, "recently used", and a "＋ new" inline.
- A **deviation marker**: a small dot on any panel line whose text differs from the library, with a
  one-click "use library text" (this already exists as ⟳ refresh) and a "push this text back to the
  library" inverse action.
- An **unused/used count** per object (the reference counting already exists in the analysis code).

**Depends on.** P5; the reference data already exists (§8 of the map).

**Risk.** Low.

### J. Progressive disclosure — an "expert" switch

**Problem.** Expert controls (guidance scale, per-panel style/size, panel seed, same-seed, prompt
override, image size custom, reflow behaviour) are permanently visible next to the basics, so the common
path is visually noisy and the rare path is not obviously rare.

**Proposal.** A global **Advanced** toggle in preferences, plus per-section "more" disclosures, that
hides: guidance scale, custom sizes, panel-level style/size overrides, seed boxes (keeping the page seed
and the "reproduce" preset), the prompt override textarea, and the panel title box. The only rule: an
"advanced" value that has been *set* stays visible even when Advanced is off, so nothing becomes
invisible-but-active.

**Depends on.** P5.

**Risk.** Low. This is the highest-ratio change for a casual user.

### K. First-run and empty states

**Problem.** A new project is 4 blank panels with ~60 controls each; there is no sample, no walkthrough,
no obvious first move.

**Proposal.** A first-run card offering "start from the sample project" (the `cow-in-field` fixture
already exists in the repo), a three-step checklist that ticks itself (describe a panel → generate it →
export), and per-panel empty states that say one thing: "Click to describe this panel."

**Depends on.** P5 and the panel/inspector change (B).

**Risk.** Low.

### L. Mobile: inspector as a bottom sheet, primary actions in the thumb zone

**Problem.** On a phone the panel is a very long column; the useful controls are interleaved with image
chips; the menu becomes a full-screen overlay (which works well) but the panel itself does not adapt.

**Proposal.** Keep the full-screen menu. Add: card → **bottom sheet inspector** (drag to expand),
primary actions (Generate, Next panel) in a fixed thumb-zone bar, image chips moved behind a long-press
context menu or an "⋯" per slot, and the selection bar merged with the run controls so the bottom edge
has one bar, not three.

**Depends on.** B, C, D.

**Risk.** Medium (mobile gestures are easy to get wrong). Test at 390 px throughout, as the current
build does.

### M. Keyboard-first flows

**Problem.** Keyboard support exists in patches (Enter generates from the action box, arrows move in
Focus, Esc closes) but is not a designed path.

**Proposal.** A documented map: `1/2/3` modes, `J/K` or `↑/↓` panel navigation, `G` generate current, `⇧G`
generate page, `V` variants, `⌘K` palette, `⌘Z/⇧⌘Z` undo/redo, `⌘S` save, `⌘E` export, `⌘F` find (already
exists in the JSON editor), `?` shortcuts overlay. The palette (C) doubles as the documentation for it.

**Depends on.** C, D, G.

**Risk.** Low, but only worth doing after the palette exists.

### N. Accessibility and semantics

**Problem.** Controls are `div`s/spans with click handlers; accordions do not announce expanded state; the
image grid has no labels; overlays do not trap focus; contrast is largely fine (an audit was done for
dark mode) but nothing is systematic.

**Proposal.** Real `<button>`/`<label>` semantics, `role="switch"`/`aria-expanded` on toggles, focus
traps + focus return for overlays, `aria-live` for the status line, alt text derived from the panel's
title/characters, and `prefers-reduced-motion` honoured for the shimmer/skeleton animations.

**Depends on.** P5 (the DOM is rebuilt anyway).

**Risk.** Low technical risk; the work is in being consistent. Worth doing *during* P5 rather than after.

### O. Feedback: one notification centre, not six status spans

**Problem.** Feedback lives in `#statusEl`, `#backupStatusEl`, `#ghStatusEl`, the changelog status, the
generate bar's progress line, and per-panel image alt text. Messages also persist until overwritten,
which is how a stale "Cleared the images of 8 panels" can sit on screen while something else happens.

**Proposal.** One status region (with an auto-expiring toast stack for transient messages and a
persistent area for run progress), plus the undo affordance (G) inside the toast for reversible actions.

**Depends on.** P5.

**Risk.** Low.

### P. A coherent visual system

**Problem.** The design tokens exist (~74 variables, dark/light tables, an accent colour) but chips,
buttons and dialogs use many near-duplicate one-off classes, and the emoji-heavy chip row is doing
double duty as icon + label + status (🔓/🔒, ⭐, ⧉, ⇤, ⟳, ✕).

**Proposal.** Keep the look (the author likes it) and formalise it: three button roles (primary, quiet,
danger), one chip role with a pressed state, an icon set with text labels available, consistent spacing
scale, and one elevation/overlay style. Turn the emoji chips into icon+tooltip with an optional text
label for accessibility.

**Depends on.** P5.

**Risk.** Low — but do it *after* the structural changes, or it will be redone.

### Q. Performance feel

**Problem.** Long pages, data-URL images, thumbnails, and a JSON editor that renders a mirror + gutter on
every keystroke. The app already lazy-hydrates images; the rest is invisible.

**Proposal.** Skeletons instead of blank slots, an explicit "preparing…" state before the first image
returns, deferred rendering for off-screen panels (the IntersectionObserver pattern already exists),
toast-based progress so the page does not reflow, and a cheap "busy" cursor during imports/exports.

**Depends on.** P4–P5.

**Risk.** Low.

---

## 3. What not to change

- **The amber/dark look and the emoji-chip idiom.** They are recognisable and the author explicitly likes
  the current contrast. Formalise, don't replace.
- **The bottom selection bar.** It is a good pattern (visible, thumb-reachable, dismissible) — extend it
  instead of replacing it with a modal.
- **The full-screen menu on phones.** It works and the author uses it.
- **Local-first, no accounts, no server.** Every proposal must keep the app working offline apart from
  the image service, and must keep projects in files the user owns.
- **The JSON editor.** It is a power tool with real users; it should move behind the new structure, not
  be removed.
- **The manual + changelog split.** The manual may lag; the changelog is the contract. Keep as is.

---

## 4. A suggested sequence (all of it after the roadmap's P5)

| Order | Idea | Why here |
|---|---|---|
| 1 | **J** progressive disclosure + **O** notifications + **F** dialog grammar | pure wins, no structural change, immediately reduces noise |
| 2 | **B** panel as object + single inspector | the change everything else depends on |
| 3 | **C** command palette + context menu + selection bar | retires the duplicated button sets |
| 4 | **A** mode switch (compose / render / review) | makes the three jobs explicit now that the panel is tidy |
| 5 | **D** run panel + variants + version strips | turns the slowest part of the workflow into the best part |
| 6 | **G** global undo | makes every destructive simplification safe |
| 7 | **E** prompt inspector | showcases the mapped prompt model |
| 8 | **H** page filmstrip + **I** library picker | the remaining two "one long list" surfaces |
| 9 | **K** first-run/empty states + **M** keyboard map | onboarding and power use |
| 10 | **L** mobile sheet + **N** semantics + **P** visual system + **Q** performance feel | the polish pass, with fresh baselines |

---

*End of UI ideas. Build order and prerequisites live in `REFACTOR-ROADMAP.md`; behaviour contract in
`FUNCTION-MAP.md`.*
