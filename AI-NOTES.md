
# AI-NOTES — Living Architecture Doc for the AI Worker

This file is the AI worker's persistent memory of how the Yet Another Comic Book Page Generator works,
so it never has to re-analyze the whole codebase from scratch.

**MAINTENANCE RULE (author-mandated): update this file at the END of every operation.**
Every change session must also (existing rules): add a dev-note block to the top-of-file
comment in `index.html`, prepend a CHANGELOG entry in `src/CHANGELOG.md`, and update `src/ISSUES.md`
when diagnosing/resolving a bug. **LOG EVERY REQUEST FIRST (author-mandated 2026-08-13): before
starting ANY work on an author request, add a date-stamped entry to `src/PENDING.md` — requests the
author has greenlit go into the 🟢 START NOW section, everything awaiting "go ahead" into the 🕒
QUEUED section.** When a feature is implemented, move it to ✅ DONE with the changelog version. Keep
those in sync with this doc.

**STANDING DIRECTIVE (author-mandated 2026-09-20): RECON FIRST, ASK CLARIFYING QUESTIONS, THEN IMPLEMENT.**
For every new change request: log it in PENDING (2026-08-13 rule) → recon the relevant existing code → ask the
author any clarifying questions and WAIT for the answers → only then implement. Record the recon findings and the
answers so they survive compaction; the per-request PENDING entries are their durable home, and durable
architecture facts also belong here. Do NOT rely on a volatile scratch/ file (scratch/ is wiped between
sessions).

**STANDING DIRECTIVE (author-mandated 2026-08-15): BACK UP TO GITHUB ON EVERY "PRESS SAVE" REMINDER.**
Until the author says otherwise, whenever a task finishes with the usual "press Save" reminder, ALSO
run the GitHub backup in the same turn (it uses the saved owner/repo/token via `ghPush()` —
`openGhBackup()` first to load the inputs, then `ghPush()`, then `ghClose()`) so the shipped code and
the GitHub history stay in lockstep. The backup is cheap and push-button-free (AI-only), so just do
it every time — no need to ask.

Not referenced by any app code — documentation only. Lives in `src/` so it persists across
sessions (the ONLY durable places are `main.pjs`, `index.html`, and `src/`; everything else,
incl. `scratch/`, is wiped between sessions). Note: because `src/` ships publicly, this file
is publicly viewable (like `src/ISSUES.md`); if the author ever needs it fully private it can
only live ephemerally or inside `index.html`'s comment block.

---

## 1. Big picture

- A single-page Perchance generator: user fills in panel details (characters, location,
  action), clicks **⚡ GENERATE ALL PANELS ON PAGE**, and the text-to-image-plugin renders each panel
  into 1–4 comic-book-style images. Pages, style presets, prompt overrides, and project
  backup/restore are the major feature areas.
- **File layout**
  - `main.pjs` — tiny pjs file: `title`, `generateImage = {import:text-to-image-plugin}`,
    `characters` list (none/hero/villain/sidekick/civilian), `locations` list
    (none/city/lab/hideout/rooftop). Loaded before `index.html`; top-level names become
    globals (`root.characters`, `root.locations`, `root.generateImage`).
  - `index.html` — the ENTIRE app. Top = giant HTML comment of dev notes (read before
    editing; newest entries near the top). Then `<style>`, then the body markup, then
    then ONE big IIFE `<script>` with all logic.
  - `src/CHANGELOG.md` — version history for Help > About (newest first; the About panel fetches and
    parses it at runtime via `renderChangelog()`).
  - `src/user-manual.html` — the shipped USER MANUAL (static standalone HTML, no perchance deps; opens in an
    in-app overlay via Help → 📖 Open User Manual → `openUserManual()`: fetch → `<iframe#manualFrame>` srcdoc).
    This is the ONLY way to open it — NEVER `window.open`/anchor to a `src/` asset: (a) a plain relative URL
    resolves against Perchance's injected `<base href="https://perchance.org/<name>">` and 404s on
    perchance.org, and (b) even the absolute `location.origin + '/src/user-manual.html'` is refused by the
    service worker ("No src manifest available for this page" — top-level `src/` navigation is unsupported).
    See src/ISSUES.md 2026-08-14 (both entries). A snapshot doc — footer notes it may lag Help → About.
  - `src/PENDING.md` — open feature-request queue (newest first; read before planning new work; implement
    only when the author says "go ahead").
  - `src/ISSUES.md` — issue log, newest first. **GREP before diagnosing anything.**
  - `src/AI-NOTES.md` — this file.
- **Execution order caveat:** the Perchance engine evaluates the whole template (all pjs /
  square blocks) BEFORE any body `<script>` runs. The app IIFE therefore runs last.
- **TEST DATA (2026-09-19):** the standard sample project for testing is **"Cow in field"** — 1 page, 4
  panels (panel 1 filled), 2 library objects (Character "A cow" = Holstein, white with black spots; Location
  "A pasture"). Its project .zip (settings + one panel-1 image) is stored in the GitHub backup repo at
  `samples/cow-in-field.zip`. Load it via 📄 File → ⬆ Import Project when a populated project is needed;
  making changes to it during testing is fine.

## 2. Boot / init sequence (bottom of the IIFE)

1. `migrateLibObjects()` (merge legacy charLibrary/locLibrary/actLibrary into `comicGen.libObjects`,
   then delete the legacy keys), `renderLibrary()`
2. `initPresets()` — populate `#presetStyle`/`#presetPalette` from `ART_STYLES`/`COLOR_PALETTES`
3. `updateResetControls()`
4. `initKeywords()` — globalPos/globalNeg/nsfw listeners + keyword chips
5. `initMenu()` — `setupMenuCollapse()` wraps each menu panel body in `.menu-collapse-body`;
   opens the saved active menu group
6. `applyLayoutMode(savedLayout)` — `body.side-mode` class
7. `applyMenuVisible(savedMenuVisible)`
8. `applyPanelsVisible(savedPanelsVisible)`
9. `initHeaderObserver()` — `refreshHdrOffscreen()` toggles `body.hdr-offscreen` (scroll/resize)
10. `buildPanelGrid()` — builds all 24 panel cards; internally calls `updatePanelSelects()`,
    `updatePanelVisibility()`, `restorePanelState()` (restores saved DOM values)
11. `populatePageSel()`, `updateDeletePageBtn()`, `updateProjectNameDisplay()`,
    `renderChangelog()`
12. seed + preview listeners; `restoreSaveState()` (IndexedDB save handle)

## 3. Data & persistence model

**localStorage keys**
- `comicGen.panelState` — versioned `{version:2, projectName, imageSizeSel/W/H, guidanceScale,
  previewDelay, previewOn, globalPos, globalNeg, nsfw, currentPage, pages:{N: pageData}}`.
  pageData = `{name, panelCountSel, panelCountCustom, seed, 1..24: panelEntry}`.
  panelEntry = `{chars:[{sel,extra}]x3, title, protectSlots:[bool x4], loc, locExtra, action, seed,
  imgCount, style, promptOverride, extras:[{type, sel, desc}]}` (2026-08-15.1 — `extras` holds arbitrary
  additional objects of any library type, created via the 🧩 Panel Objects add bar). The ⟳ persist flags
  (`chars[].persist`, `locPersist`, `actPersist`) were REMOVED 2026-08-16 (changelog 2026.08.16.11) — old
  saved entries may still carry them but they are ignored. v1 flat data auto-migrates via `ensurePages()`.
- `comicGen.libObjects` — unified Panel Library Objects store `[{id, type, name, desc}]` where `type`
  is a LABEL ('Character'/'Location'/'Action' or custom via "＋ New Type…") deciding which panel
  dropdown the object appears in (2026-08-14.7). Replaces the three legacy keys
  `comicGen.charLibrary`/`locLibrary`/`actLibrary` (migrated + deleted by `migrateLibObjects()` at boot
  and on import). `comicGen.libTypes` — custom type labels.
- `comicGen.preset` — `{style, palette}`
- `comicGen.activeMenu`, `comicGen.layoutMode`, `comicGen.menuVisible`,
  `comicGen.panelsVisible` — UI prefs ('1'/'0' for the toggles)
- `comicGen.hidePasswordPref` — '1'/'0': require the (session-only) panels password (2026-08-14.7)

**IndexedDB** `comicGenSaveState` — `{handle, name}` (File System Access handle for 💾 Save…)

**Session-only (in memory, per page)** — NOT persisted, wiped on reload:
- `pageSession[N] = {images}`; current page's live ref is `panelImages`
- `panelImages[i][k-1]` = data URL of slot k of panel i
- `panelPromptOverrides[i] = {pos, neg}` — 📝 Prompt override
- accordion open/closed state (`.panel-acc[data-collapsed]`), `.stopped`/`.paused` boxes
- (The ⟳ persist chains `syncState['i-s']`/`'i-loc'`/`'i-act'` and the cross-page carry
  `carryNext[page]` were REMOVED 2026-08-16 (changelog 2026.08.16.11) — replaced by the per-row ⇤
  copy-from-previous-panel button `copyFromPrevPanel(i, kind, s)`, which copies the corresponding
  char/location/action from panel i−1 on demand. No auto-propagation or cross-page carry exists anymore.)

**Save pipeline:** grid `input`/`change` events → `handleGridInput(e)` + `schedulePanelSave()`
(debounced 250ms) → `collectPanelState()` → localStorage. `collectPageData()` reads the live DOM
for the current page. Import/export round-trips `buildExportData(includeProtection)` /
`applyImportedSettings()`.

## 4. Key module state (top of IIFE)

- `panelBusy[i]` — per-panel re-entrancy guard
- `inFlightGen` — `Map(pendingPromise → {i,k})` of active generations
- `pausedByVisibility`, `stopRequested`, `generateAllRunning` — pause/stop flags
- `currentPage` + `pageSession` — multi-page model
- `imgObserver` (IntersectionObserver) — evicts/restores `<img>` srcs
- `gridHasListeners` — grid listeners attached once
- `panelImages`, `panelPromptOverrides`, `panelSaveTimer`
- `mapsPromise` — cached `getMaps()` (charMap/locMap from `root.characters`/`root.locations`)

## 5. DOM structure of a panel card (built by `buildPanelGrid`)

Card: `#panel-card-N.panel-card` (display toggled by `updatePanelVisibility()` based on
`getPanelCount()`, 1–24).

- **Header row (2026-09-20):** title label `.panel-title` = `Panel N`, or `Page P, Panel N` when
  `pageCount() > 1` (set by `updatePanelHeaderLabels()`, which MUST run after `restorePanelState()` — the
  header HTML is built before `currentPage` is restored), `#panel-title-N` (display-only, never in prompt),
  Images select `#panel-img-count-N` (1–4), Style select `#panel-style-N`
  ([Default (Global)] + ART_STYLES), Size select `#panel-size-N` (+ `#panel-size-custom-N` W/H),
  Seed `#panel-seed-N` + `<span class="seed-chips">` = ⇤ `#seed-copy-prev-N` (`copySeedFromPrevPanel`; copies the
  preceding panel's RAW seed box value, clearing when it is blank/random/−1) + ✕ `#seed-clear-N`
  (`clearPanelSeed`), header 🔄 Generate `.btn-header-gen` (`generateSinglePanel`, a DUPLICATE of the one in the
  action row), ⇅ Move `#reorder-btn-N` + hidden picker `#panel-reorder-N` (positions 1..N + a "Move to another
  page" optgroup of `pg-<n>` options — greyed when that page is full — + `newpage`; see §Pages).
  Below it: `.panel-summary` line (`.ps-char` / `.ps-loc` / `.ps-act`) refreshed by `updatePanelSummary(i)`
  (reads char/loc selects + action; action ellipsizes when too long).
- **.panel-imgs grid:** four slots `#imgslot-panel-N-K` (hidden beyond imgCount; the SLOT is
  hidden, not the box), each containing:
  - `.slot-reroll` > `.btn-img-reroll` (per-image 🔄 Generate, `generateSinglePanelSlot`)
  - `.panel-img-box#imgbox-panel-N-K` > `img#img-panel-N-K` (`.rep` = representative ⭐,
    `.generating`/`.failed`/`.paused`/`.stopped`/`.cleared`/`.protected` states)
  - `.slot-btns#slotbtns-panel-N-K` INSIDE each `.panel-img-slot` (after `.panel-img-box`) — 5 icon chips:
    ↗ open / ⬇ save / ✕ clear / 🔓🔒 protect (`.btn-img-protect.active`, text set to '🔒'/'🔓' by
    `setSlotProtected`) / ⭐ cover (`makeRepresentative`). (Moved back here 2026-08-13.9 from the old
    🖼 Image Controls accordion, which was removed.)
- **Action row (.panel-header-btns):** `Show/Hide Menus` (.btn-view.menu-show → `togglePanelMenus(i)`,
  static label; opens all of the panel's `.panel-acc` if none are open, else collapses them all) →
  🔍 Focus (.btn-view) → 🔄 Generate (.btn-reroll). (■ Stop is NOT per-panel — it's ONE global button in the
  Generate bar: `#globalStopBtn` in `.gen-actions/.gen-row`, always visible, enabled during ANY generation.)
- **Four accordions** (`.panel-acc[data-collapsed="1"]` default; toggle via `togglePanelAcc`):
  1. **🧩 Panel Objects** (2026-08-15.1; replaced the old 📖 Panel Library sub-accordions) — ONE accordion
     per panel (`#panel-objects-N`, rendered by `renderPanelObjects(i, mode, force)`, mode 'state'|'dom'):
     ⚠️ warning (too many objects may confuse the image AI; no limit enforced), column headers, one row
     per object — Type select (same options as the main menu, incl. "＋ New Type…") + Identity select
     (`#panel-char-select-N-S`/`#panel-loc-select-N`/`#panel-act-lib-N`) + Freeform Description
     (`#panel-char-extra-N-S`/`#panel-loc-extra-N`/`#panel-act-N`) + ⟳ persist (char/loc/act primary rows
     only) + red ✕ delete. Primary rows REUSE the old ids so handleGridInput/propagate/restore/collect all
     still work; empty slots render NO row. Arbitrary extra objects live in `panelEntry.extras` and render
     as `.po-extra-row` with ids `panel-extra-type/sel/desc-N-IDX` (no ⟳, read by collectPageData).
     Type routing: `onPanelObjTypeChange(i, kind, el)`/`onPanelExtraTypeChange(i, idx, el)` move a row
     (Character→first empty char slot else extras, Location→loc slot else extras, Action→action box else
     extras, custom→extras), clearing the source via deletePanelChar/Loc/Act; `ensurePanelObjectRow(i,kind)`
     creates a missing target row so ⟳ chains/cross-page carry still land on previously-empty slots.
     Add bar (`#panel-add-select-N`): "Create new…" options → `createLibraryEntry(type)` + `routeObject`
     (auto-places); "Add from library…" → `#panel-add-picker-N` (`#panel-add-id-N`+`#panel-add-desc-N`+Add).
     Picking a library object auto-fills the row's Freeform Description from `entry.desc`; desc-only rows
     (loc with "No Location Selected") survive re-renders.
  2. **📝 Prompt** — `.btn-prompt` (toggle `#prompt-editor-N` with `#prompt-pos-N`/`#prompt-neg-N`),
     `.btn-copy-prompt`
  3. **⚙ Panel** — `Collapse Menu` (.btn-panel-menu), ⧉ Duplicate, ＋ Add Panel,
     🗑 Clear Images (`.btn-clear-images`, hidden unless ≥2 images), 🗑 Clear, 🗑 Delete,
     `.panel-acc-stack` > `#panel-seed-N`
  4. **💾 Files** — ↗ Open All, ⬇ Save All (.zip), ⬇ Export
- `setPanelImageButtons(i,k,has)` / `updatePanelAllButtons(i)` keep chip disabled/hidden state
  in sync after every per-slot change (open/save/protect/star need an image; Clear Images needs
  ≥2).

## 6. Generation flow (the core)

- **`generateComicPage()`** — ⚡ button. Disables `.btn-generate`, sets `stopRequested=false`,
  `generateAllRunning=true`, `setStopButtonEnabled(true)` (global ■ Stop `#globalStopBtn`). Loops panels 1..total: status
  "…generating panels… (i/N)"; `await generateSinglePanel(i)` counting
  generated/skipped/protected/error; breaks on `stopRequested` (user Stop) or
  `pausedByVisibility` (tab backgrounded). Finally: re-enable button, `generateAllRunning=false`,
  `syncStopButton()` (disables Stop when nothing is in flight).
- **`generateSinglePanel(i)`** — guards `panelBusy`; resets `pausedByVisibility`; resets
  `stopRequested` only when NOT inside a Generate All (`if (!generateAllRunning)`).
  `buildPanelPrompt(i)` → `{fullPrompt, negativePrompt, hasContent}`.
  - Empty content + no protected images → clears panel, marks card `.skipped`, returns 'skipped'
  - Empty content + protected images → keeps them, returns 'protected'
  - All slots protected → 'protected'
  - Otherwise loops slots 1..imgCount calling `renderPanelSlot` (skips protected slots),
    returns 'generated'.
- **`generateSinglePanelSlot(i,k)`** — per-image reroll; same prompt; single `renderPanelSlot`.
- **`renderPanelSlot(i,k,...)`** — the one place that actually calls the image service:
  clears box states → `.generating`; builds opts `{prompt, negativePrompt,
  resolution: pickSourceResolution(size), guidanceScale: parseInt(1–30), seed: seed+(k-1)
  if seed ≠ -1}`; `pending = root.generateImage(opts)`; registers in `inFlightGen`;
  `await withTimeout(pending, 120000)`; **must validate `result.dataUrl`** (the plugin returns
  non-thenable ERROR STRINGS for invalid options — `if (!result || !result.dataUrl) throw`);
  upscales if target size ≠ source size; `showPanelImage(i,k,dataUrl)`.
  - catch: if `pausedByVisibility || stopRequested || card/.box .cleared` → return 'cleared'
    (silent abort); else `pending.stop()`, mark `.failed`, throw.
  - finally: remove from `inFlightGen`, remove `.generating`.
- **Prompt building** — `buildPanelPrompt(i)`: positive = `getPanelKeywords(i).positive`
  (per-panel Style override, or global) + selected char descs + modifiers + loc desc + locExtra +
  action, comma-joined. `hasContent` = any char/extra, loc, locExtra, or action. A saved
  `panelPromptOverrides[i]` (from 📝 Prompt editor) completely replaces pos/neg and defines its
  own hasContent. Typing in any panel content field clears the override
  (`handleGridInput` → `clearPanelPromptOverride`); global keyword/preset/NSFW changes clear ALL.
- **Seeds:** `#panel-seed-N` sits in the panel header (since 2026-09-18) and shows the resolved seed as a
  placeholder. `pinPanelSeedForRun(i)` (used by renderPanelSlot) = panel `#panel-seed-N` > global `#seedInput`
  + (i−1) > one random int, which it writes back into `#panel-seed-N` (so the panel HOLDS the seed and is
  reproducible on later runs). `getPanelSeed(i)` still exists but is no longer used by render.
  Slot k uses seed + (k−1).
- **Size:** `getImageSize()` from File menu; `pickSourceResolution` picks the nearest plugin
  size (512²/512×768/768×512/768²); `upscaleDataUrl` cover-crops + upscales to target
  (JPEG q0.92) when different.
- **guidanceScale is WHOLE-NUMBER ONLY** (1–30) — the plugin rejects fractions with an error
  tile. Always parseInt/round/clamp.

## 7. Pause / stop mechanics

- `pausedByVisibility`: visibilitychange handler stops all in-flight (`.stop()`), marks boxes
  `.paused` ("tab went to background"), deletes slot images, sets status; `generateComicPage`
  breaks the loop.
- **■ Stop button** (global, `#globalStopBtn` next to ⚡, always visible): `syncStopButton()` =
  `setStopButtonEnabled(inFlightGen.size > 0 || generateAllRunning)` — so it's ACTIVE during ANY generation
  (⚡ batch, single panel, single-slot reroll), not just Generate All (2026-08-13.9). Called from:
  `renderPanelSlot` (on `inFlightGen.set` → enable, and in finally → sync), `generateComicPage` finally,
  `haltGenerations`, `stopAllGenerations`, the visibilitychange handler, and the three clear functions.
  `haltGenerations()` (exported) sets `stopRequested=true`, stops all in-flight, marks boxes `.stopped`
  ("Stopped — generation cancelled."), deletes those slot images, sets status. The abort propagates: catch →
  'cleared' → generateSinglePanel returns early → loop breaks → finally restores UI.
- `stopAllGenerations()` (used by page-switch/delete/resequence) marks `.paused`, NOT `.stopped`.
- `'cleared'` card/box class also aborts in-flight renders silently (used by clear/resequence/
  duplicate/delete paths).
- The `stopped` class is cleared wherever box states are reset (reroll, clears, reset).

## 8. Menu & layout system

- `.menu-frame` = sticky top bar (top mode) or left column (`body.side-mode`, landscape only).
  Contains `.menu-scroll` (the accordion groups) + `.gen-actions` (`#statusEl` only since 2026.09.23.2 — the
  Generate/Pause/Stop buttons moved into `#menuBar`). Its sticky `top` is `var(--hdr-h, 60px)` (top mode) /
  `calc(var(--hdr-h, 60px) + 10px)` (side mode) so it parks directly under the pinned app header.
  `.gen-actions` is `flex:0 0 auto` (2026-09-20, changelog 2026.08.16.19) so it can NEVER be squeezed by a tall
  `.menu-scroll` — the menu list scrolls instead and the status line stays visible. (The old
  `body.menu-fullscreen .gen-actions { display:none }` was REMOVED 2026.09.23.2: the status line is now shown in
  full-screen too, because the buttons it used to hide live in the menu bar.)
- **Reserved bottom space (2026-09-20, changelog 2026.08.16.19):** the viewport-fixed buttons at the bottom
  (`#panelsToggleBtn` ▧ Hide Panels, `#pageNav`) used to cover page content and,
  in side mode, the menu's generate bar. `body { padding-bottom: 96px }` (portrait: `156px`, where `#pageNav`
  sits at `bottom:74px`) gives the page scrollable clearance, and in side mode `syncSideMenuHeight()` sets
  `#menuFrame`'s inline `max-height` to `innerHeight - menuFrame.offsetTop - reserve` (reserve ≈112px, adaptive,
  floored at 80px) so the frame's bottom — i.e. `.gen-actions` + `#statusEl` — always ends above those buttons.
  `offsetTop` already includes the app-header (37/82/126px depending on wrapping), which is why this is measured
  in JS rather than a static `calc()`. Called from `applyLayoutMode`, `applyMenuVisible`, and `resize`/`load`/
  `orientationchange`; the inline style is cleared outside side mode.
- `switchMenu(name)` — one `.menu-group` open at a time (File/Edit/Library/Help), choice
  persisted; every group opens with its sections COLLAPSED via `collapseGroupPanels` — EXCEPT `library`, which
  expands instead (2026.09.23.1), because the author didn't want a second click on the "Library" heading. While
  `body.menu-fullscreen` it instead refuses to close the active section and EXPANDS the group via
  `expandGroupPanels` (and refreshes `#menuOverlayTitle`).
- **Where the Preferences panel lives:** `#preferencesPanel` (`.config-panel`, `<h2>Preferences</h2>`) is the LAST
  panel of `#menuGroup-edit` as of 2026.09.23.1 (it used to be the last panel of `#menuGroup-file`). It holds
  `#hidePasswordPref` today; the theme / header / menu preferences land here next. Nothing queries it by parent,
  and `setupMenuCollapse()` binds it automatically (it walks `.menu-group .config-panel` at init).
- **Toggles** (all persist independently):
  - `body.menu-hidden` — the CSS is `body.menu-hidden .menu-frame { display:none }`, i.e. it hides the WHOLE menu
    frame INCLUDING the Generate bar (this contradicts the earlier "the generate bar stays visible" promise —
    a documented latent issue, see the gotchas below; NOT changed in 2026-09-20's spacing fix).
    Set/cleared ONLY by `applyMenuVisible(visible)`, whose sole control is the header `#menuToggleBtn`
    (`.menu-toggle`, label ☰ Hide Menu ↔ ☰ Show Menu). `syncSideMenuHeight` clears the frame's inline max-height
    while the menu is hidden. NOTE (2026-09-20, changelog 2026.08.16.21): the old floating `#menuRevealBtn`
    (☰/✕, appeared when the header was offscreen) was DELETED at the author's request — `body.hdr-offscreen` is
    now vestigial: `refreshHdrOffscreen()`/`initHeaderObserver()` were removed with it in 2026-09-20, so NOTHING
    sets that class any more (verify before relying on it); since 2026.09.23.2 the sticky header keeps the
    toggle on screen, so there's nothing to scroll back to.
  - `body.panels-hidden` — hides `.canvas-frame` (all panel cards) via ▧ Hide/Show Panels header
    button. Generation is UNAFFECTED (writes to `panelImages`; the imgObserver just evicts
    srcs while hidden and restores on show).
  - `body.side-mode` — ▤ Menu: Top/Side header button.
- Header buttons (upper-left): ▦ Storyboard, ☰ Hide/Show Menu, ▤ Menu: Side, ⛶ Full Screen (`.menu-fs-toggle`),
  then ▧ Hide/Show Panels. ⛶ Full Screen → `toggleMenuFullscreen()`. The ☰ button is the ONLY menu-visibility
  control (2026-09-20, changelog 2026.08.16.21 — its `.menu-toggle` label flips ☰ Hide Menu ↔ ☰ Show Menu).
- **Sticky app header (2026.09.23.2):** `.app-header` is `position:sticky; top:0; z-index:9000` with an amber
  bottom border, so the title + the four buttons stay on screen while the page scrolls. `syncHdrHeight()`
  writes its measured height to `--hdr-h` on `:root` (a ResizeObserver on the header, plus `resize`/`load`/
  fonts; fallback `60px`), which is what `.menu-frame`'s sticky `top` and the full-screen overlays'
  `padding-top` consume. The header also carries `<span class="hdr-gen-ctr" id="hdrGenCtr" hidden>`, the home
  `placeGenButtons()` moves ⚡ Generate All / ⏸ Pause / ■ Stop into while the menu is hidden and
  `comicGen.genAlwaysVisible` is on (the header grows to ~181px, ResizeObserver republishes `--hdr-h`).
- **Full-screen menu overlay (`#menuOverlay`, 2026-09-20):** `.view-overlay` hosting the REAL `#menuFrame`
  (moved in on open, restored to `.page-layout` on close — see BATCH 2026.08.16.20). `openMenuFullscreen(section)`
  / `closeMenuFullscreen()` / `toggleMenuFullscreen(section)`; `#libFullscreenBtn` in the Library toolbar opens
  it on the Library tab. Esc or the overlay's `← Back to page` closes it. The markup sits just before
  `#analysisOverlay` so Analysis still paints above it. Opening while `body.menu-hidden` shows the menu; closing
  NEVER re-hides it (fixed 2026-09-20, changelog 2026.08.16.21 — the old restore-the-hidden-state behaviour is
  what made the menu vanish after "← Back to page"). **PREF-DRIVEN since 2026.09.23.2:** `syncMenuMode()` decides
  between the overlay and the inline frame on every menu-visible change ("pref ON + menu visible → overlay");
  `applyMenuFullscreenPref(on, section)` is the single setter that stores `comicGen.menuFullscreen` and calls
  `syncMenuMode()`, and `toggleMenuFullscreen(section)` merely flips the pref (so the header ⛶ button and the
  Library ⛶ button are the same persisted switch — answer 3). `updateMenuFullscreenLabels()` labels the two
  buttons from the PREF (⛶ Full Screen ↔ ⤡ Exit Full Screen), not from `isMenuFullscreen()`. The overlay's
  `← Back to page` and Esc call `requestCloseMenuFullscreen()` = `applyMenuVisible(false)`. `body.menu-fullscreen
  .app-header` becomes `position:fixed; z-index:10005` (header stays on top of the overlay) and
  `body.menu-fullscreen .view-overlay` gets `padding-top: calc(var(--hdr-h) + 14px)`. The old
  `body.menu-fullscreen .gen-actions { display:none }` (2026-09-22, changelog 2026.08.16.22) was REMOVED in
  2026.09.23.2: the status line now stays visible in full-screen, because the ⚡/⏸/■ buttons it used to hide
  live in the menu bar now.
- **INLINE-HANDLER EXPORTS (rule + the 2026.09.23.5 fix):** every function referenced from an inline `on*` attribute
  must have a matching `window.NAME = NAME;` line in the export block at the end of the IIFE.
  `requestCloseMenuFullscreen` (added 2026.09.23.2) was declared and used internally by the Esc handler but never
  exported, so the full-screen menu's "← Back to page" button threw a ReferenceError until 2026.09.23.5. Cheap
  audit after adding handlers: (1) live DOM — walk elements with `on*` attributes, extract every `fn(` identifier
  and require `typeof window[fn] === 'function'`; (2) static — every `on*="..."` attribute in the source vs the set
  of names assigned by `window.X =`. Both found only that single miss (1,635 live calls / 120 distinct functions;
  186 source handlers).
- **⚡ Generate All / ⏸ Pause / ■ Stop in the menu bar (2026.09.23.2):** three more `<button class="menu-btn">`
  siblings of the four tabs inside `#menuBar` — `<button class="menu-btn menu-action" id="menuGenerateBtn"
  onclick="generateComicPage()">⚡ Generate All</button>`, `#globalPauseBtn` (`class="menu-btn menu-action"`),
  `#globalStopBtn` (`class="menu-btn menu-stop"`, red fill + white text). They keep their old ids, so
  `setPauseButtonEnabled` / `setStopButtonEnabled` / the Focus mirroring (`syncFocusControls`) are untouched —
  only `syncFocusControls()`/`initFocusSync()`'s "the sidebar ⚡ button" lookup moved from `.btn-generate` to
  `#menuGenerateBtn`. `.menu-action` must stay a TWO-class selector (`color:#fff`) to beat normalize's
  `button:not([disabled]) { color: inherit }`. `#statusEl` stays at the bottom of the frame inside
  `.gen-actions` (now its only child). Dead CSS from the move: `.gen-row`, `.gen-row .btn-generate`, and the
  old `.gen-actions .btn-generate` sizing — `.btn-pause-global`/`.btn-stop-global` are still LIVE (the Focus
  view's own buttons use them).

## 9. Image handling

- **Eviction/restore:** `imgObserver` (IntersectionObserver, rootMargin 400px) removes
  off-screen `img.src` (keeps data URL in `panelImages`), restores on re-entry. Memory
  hardening for mobile. `showPanelImage` is the ONLY correct way to display a new image.
- **Hover/long-press preview:** fixed `#imgPreview` overlay; desktop hover + mobile long-press
  (~`#previewDelayInput` ms, cancelled on >12px drag); toggled by `#previewEnabledCheck`;
  reads final data URL from `panelImages` via `imgbox-panel-N-K` id regex. `previewEnabled()`
  gates both triggers.
- **Protect:** per-slot 🔓/🔒 chips; `protectSlots` persisted; dormant-persistent across
  reloads (images are session-only); `generateSinglePanelSlot` refuses protected slots,
  `generateSinglePanel` keeps them; clears unprotect. `makeRepresentative` swaps slot 1 + its
  protect flag (⭐ = representative shown in Storyboard).

## 10. Pages, view modes, library, changelog

- **Pages:** `currentPage`, `panelState.pages`, `pageSession`. Each page = `{name (Page Title),
  summary (Page Summary), panelCountSel, panelCountCustom, seed, 1..24}`. switchPage saves old page DOM +
  session, reloads new page (buildPanelGrid). addPage/deletePage; deleting the LAST panel of
  the ONLY page → `resetEverything(true)` (confirm-gated). Page selector labels from page
  titles. **Page options (2026-09-20, BATCH 2026.08.16.18):** `#pageNameInput` is the Page Title and
  `#pageSummaryInput` (`onPageSummaryInput`) the Page Summary — both shown in the Storyboard; **⇅ Renumber
  Page** (`#pageRenumberGroup`/`#pageRenumberBtn`/`#pageRenumberSel`, Page Setup, visible only with ≥2 pages) →
  `renumberPageTo(fromKey,toPos)` splices the page into position `toPos` and renumbers EVERY page 1..N (remapping
  `pageSession`/`currentPage`/`analysisPage`) while each page keeps its own data. **Cross-page panel move:**
  `populateReorderSelects`' `pg-<n>`/`newpage` options → `movePanelToPage(i,target,mode)` (mode `prepend` when
  target > src, `append` when target < src, `replace` for a new page): removes + renumbers the source page
  (deleting it, confirm-gated, when it held only that panel), inserts into the target carrying its
  `pageSession` images, then switches to the target. `movePanelToNewPage(i)` pre-creates the page and calls it
  with `'replace'`.
- **View modes:** `#singleOverlay` (🔍 Focus moves the ACTUAL card into `#singleStage`,
  navigation via list/dropdown/prev-next/arrows/Esc; **2026-09-22:** anything that rebuilds `#comicGrid` —
  `buildPanelGrid()` — snapshots `singleCard ? currentSingle : 0` as `singleResume`, drops the staged card via
  `detachSingleStage()` (no duplicate `panel-card-N` ids survive), then re-opens with
  `openSingleView(Math.min(singleResume, getPanelCount()))`; `closeSingleView`/`singleNavTo` put the card back
  through `restoreSingleCardToGrid()`, which never calls `insertBefore` with an anchor that isn't a child of the
  grid. Never wipe `#comicGrid` directly — always go through `buildPanelGrid()`. See BATCH 2026.08.16.23),
  `#storyboardOverlay` (▦ button →
  `.sb-cell` per panel from representative image, placeholders for empty) and, since 2026-09-20,
  `#menuOverlay` (⛶ Full Screen — the whole menu, Esced/Back-closed; BATCH 2026.08.16.20). The Storyboard also shows the page
  Title (`#storyboardTitle`) + Summary (`#storyboardSummary` bar) and, with ≥2 pages, its own page navigator
  `#storyboardNav` (◀ `storyboardNavDelta` + `#storyboardNavPages` + ▶) next to "← Back to page"
  (`renderStoryboardPage`/`updateStoryboardNav`; `switchPage` calls `refreshStoryboardIfOpen()` so it follows).
- **Library:** ONE `comicGen.libObjects` store: entries `{id, type, name, desc}` where `type` is
  'Character' | 'Location' | 'Action'. Panel dropdowns list precreated options (minus "none") + an optgroup
  of saved objects of that type + "No Character Selected" LAST (chars only). 📚 Library menu shows the
  objects as 👤 Characters / 📍 Locations buckets (plus a 🎬 Actions bucket when any Action item exists),
  each row = name + desc + 🗑, with a green + to add. migrateLibObjects() migrates the legacy
  charLibrary/locLibrary/actLibrary keys and, since 2026-09-19, KEEPS Action items instead of pruning them.
  **Library → Import (2026-09-19):** the ⬆ Import… button reads Characters/Locations/Actions out of a
  project .json/.zip (legacy v1 included) and merges the chosen ones into libObjects — see BATCH 2026.08.16.14.
  **Library → Analysis (2026-09-19):** the 📊 Analysis button opens `#analysisOverlay` — a full-page
  panel × library cross-reference matrix with ✅ usage marks and per-panel descriptions editable in the grid
  — see BATCH 2026.08.16.15.
  **Library → Full Screen (2026-09-20):** the ⛶ Full Screen button (`.btn-lib-fullscreen`, `#libFullscreenBtn`)
  toggles `#menuOverlay` scoped to the Library tab — the same, live-editable `#libObjects` list, full-screen;
  the Import/Analysis buttons come along. See BATCH 2026.08.16.20 / the full-screen menu overlay note in §8.
  **Analysis → project defaults + per-panel style/size/seed (2026-09-19):** the Analysis header's
  `#analysisGlobalBar` edits NSFW / default style / default size / seed (writing through to the real settings;
  seed is per-PAGE, i.e. the page selected in the page selector), and every panel header shows compact
  🎨/📐/🎲 `.an-chip` buttons that open in-place editors (`analysisSetPanelStyle/Size/Seed`, same DOM-vs-state
  split as `analysisSetDesc`) — see BATCH 2026.08.16.16. The matrix also has a dedicated **▶ Panel Action Prompt**
  ROW as its first body row (one editable `.an-act` box per panel; becomes the first COLUMN after ⇄ Swap) —
  `analysisActionField` / `analysisSetPanelAction` / `analysisSyncActionField` / `analysisRefreshActionCells` keep
  it and the Action-item cells in sync — see BATCH 2026.08.16.17.
- **Changelog:** `src/CHANGELOG.md` (newest first, format `## <ver> — <date> — <title>` + `- item`
  bullets). The About panel's async `renderChangelog()` fetches it at runtime and parses it (gracefully
  empty on failure). Versions `YYYY.MM.DD.R`. Prepending an entry is a CHANGELOG.md change (+ a matching
  dev-note block in index.html).

## 11. Export / import / save

- `exportSettings()` — versioned JSON (all pages' settings) via `buildExportData(includeProtection)`.
  JSON-only paths (exportSettings, settingsBlob → saveSettings/saveSettingsAs/confirmImportSave/
  confirmNewProjectSave) pass `false` → `protectSlots` is STRIPPED from every exported panel entry
  (image protection is session-only and shouldn't imply anything about exported files); `exportZip()`
  passes `true` → the zip keeps protections so a backup/restore round-trip preserves them (2026-08-15.1).
  Import is unchanged (nukes protections then applies).
- `exportZip()` — settings JSON + every page's session images into one .zip
  (self-contained STORE writer; DEFLATE via DecompressionStream on import).
- `importSettingsFromFile()` — `hasActiveProject()` gate → three-choice modal
  (Save&Import / Continue / Cancel); import "nukes" protections + clears all sessions first;
  `applyImportedSettings` restores settings, libraries (BEFORE restorePanelState so lib-backed
  selections round-trip), layout, menuVisible/panelsVisible.
- `saveSettings()` (silent, remembered handle) / `saveSettingsAs()` — File System Access API
  with download fallback; handle+name in IndexedDB.

## 12. Conventions & gotchas (read before editing)

- **VERSIONS & DATES (author-mandated 2026-09-23):** releases are numbered `YYYY.MM.DD.S` where S is that day's
  serial release, starting at 1 and incrementing (NO zero padding — 1, 2, ... 10 — because a human reads and
  compares S as a whole number). A new day restarts at `.1`. The author is in US PACIFIC time, so every
  date/time written into the changelog, these notes and the PENDING queue uses Pacific (PST/PDT). The Help →
  About version comes from the FIRST `## ` heading of `#embeddedChangelog`, so a new release must be added there
  (never to a second copy).
- **BUTTON COLOURS BAIT (found 2026-09-23):** the platform ships normalize.css with
  `button:not([disabled]) { color: inherit }`, whose specificity (0,1,1) BEATS a single-class rule like
  `.menu-btn { color: #ffcc00 }` (0,1,0) — so the File/Edit/Library/Help tabs actually render WHITE (the body
  colour) despite their declared amber. The author likes that look, so do NOT "fix" it. When a button's colour
  genuinely matters, use a two-class selector (`.menu-btn.menu-action { color: var(--text) }`, which is also
  theme-aware — it is white in dark, near-black in light) or the author-provided `#id`. Note the LIGHT-READABILITY
  tail block in the style sheet exists exactly because of this trap: `.btn-line-del`, `.btn-reroll`, `.btn-danger`,
  `.btn-copy`, `.btn-copy-prompt`, `.btn-del-lib`, `.btn-stop-global`, `.btn-img-clear`, `.btn-img-reroll` and
  `.btn-copy-prev:not(:disabled)` are single-class rules, so their declared text colour was ALSO being thrown away
  and they inherited the parent's colour; the tail block re-pins them under `:root[data-theme="light"]` /
  `:root:not([data-theme])` (specificity 0,2,0) for light mode only. If you add a coloured chip whose text matters,
  give it a two-class selector or add it to that block.
- **DARK-MODE CONTRAST PASS (added 2026.09.23.4, full story in the index.html dev-notes BATCH 2026.09.23.4):**
  every coloured button fill used with WHITE text was darkened in the DARK theme so white clears 4.5:1 —
  --teal/--teal-2, --blue/--blue-2/--blue-3/--blue-4, --red/--red-2, --green-3/--green-4 (light values
  unchanged). The normalize colour-inheritance bug that made the seed chips amber-on-red/blue is now fixed for
  BOTH themes via ".panel-imgs-sel .btn-copy-prev:not(:disabled), .panel-imgs-sel .btn-line-del { color:#fff }",
  and the ⇅ Move chip via ".btn-reorder:not(.active) { color: var(--text) }". A new --on-purple var (#111 dark,
  #fff light) is the text colour for purple fills (used by Import Project). The default color mode is now
  system (init fallback changed), and the Focus view's generate button reads "⚡ Generate All"
  (text-transform:none). Still intentionally below 4.5 in dark: the decorative .ps-sep • separators. If you add
  a bright fill behind white/amber text, re-run the audit pattern (walk text nodes, compare each computed
  colour with its nearest opaque background) — BATCH 2026.09.23.4 has the numbers.
- **THEME / COLOUR SYSTEM (added 2026.09.23.3, full build story in the index.html dev-notes BATCH 2026.09.23.3):**
  the style sheet opens with `:root{ 74 vars }` (dark = the old literals), then `:root[data-theme="light"]{ ... }`,
  then a mirrored `@media (prefers-color-scheme: light){ :root:not([data-theme]){ ... } }` — see AI-NOTES §14 below
  for the variable families and the JS API. Rules for editing: colour literals belong in the `:root` table, NOT
  inline in a rule; use `--text`-family names for text, `--surface`/`--well`-family names for fills, and `--*-text`
  for a hue used as text (a bright green that is readable on #1a1a1a is unreadable on #ffffff). Add BOTH the dark
  value and a light override (the light value has to be added twice — once in the `[data-theme="light"]` block, once
  in the media block). `rgba()` shadows/scrims stay literal by design. `background`/`border` are unaffected because normalize doesn't set them.
- Everything is inside the IIFE; only `window.X = X` exports are reachable from inline
  handlers/evals. Export what a test needs.
- id suffixes: `El`/`Btn`/`Ctn`/`Input` (e.g. `statusEl`, `rerollBtn`). Use the `hidden`
  attribute (wins over inline styles). `body` is text-align:center by default — the app
  overrides it.
- **Never add auto-reload/watchdog code** (historical mobile-tab hang).
- **confirm() AUTO-ACCEPTS inside browser_eval** — never drive deletePage/reset/delete
  mutations from evals against live data (see src/ISSUES.md "AI's test harness deleted…").
- **Programmatic `.value=` does NOT fire the grid input/change listeners** → doesn't run
  `handleGridInput` → stale `panelPromptOverrides` survive and can make a panel "skipped".
  In tests, dispatch `new Event('input', {bubbles:true})` after setting a value (this is how
  real typing clears overrides). (The ✕ line-delete buttons bypass this by doing their own
  `clearPanelPromptOverride`/`updatePanelSummary`/`schedulePanelSave`.)
- ⟳ chains and cross-page carry were REMOVED 2026-08-16 (changelog 2026.08.16.11) — replaced by the per-row
  ⇤ copy-from-previous-panel button (`copyFromPrevPanel(i, kind, s)`); no auto-propagation exists anymore, and
  the ✕ delete buttons no longer touch chains (they just clear the line + prompt override + summary + save).
- **TESTING GOTCHA (2026-08-15.1, full write-up in the index.html dev-notes):** `schedulePanelSave()` is
  debounced ~250ms. After mutating panel state in browser_eval you MUST wait >400ms THEN restore the
  localStorage snapshot (and re-restore once more) before reloading, or the pending debounced save
  overwrites the restore with your test DOM (this clobbered the author's panel-1 action once).
- `root.generateImage()` returns error tiles as non-thenable STRINGS for invalid options —
  always check `result.dataUrl`; keep guidanceScale a whole number.
- Local state is shared localStorage but per-tab memory; a stale tab's auto-save can clobber
  good state. Prefer read-only evals when troubleshooting.
- Mobile ■ Stop-button "missing" report (2026-08-13) was RESOLVED — NOT AN ISSUE (button present;
  see src/ISSUES.md). One latent layout observation remains, left as-is: `body.menu-hidden .menu-frame
  { display:none }` hides the WHOLE generate bar with the menu (contradicts changelog 2026.08.13.2's
  "⚡ stays visible" promise; fix = hide only `.menu-scroll`). If the author ever reports "generate bar /
  Stop button missing on mobile", that is the first suspect. The OTHER latent issue — `.gen-actions` being
  flex-squeezed to nothing by tall `.menu-scroll` content — was FIXED 2026-09-20 (changelog 2026.08.16.19):
  `.gen-actions` is now `flex:0 0 auto`.
- The `main.pjs` `characters`/`locations` lists are READ via `getMaps()` (cached, polls until
  loaded) — never assume `root.characters` is ready synchronously.
- Visual work: verify with `vision` (canvas is hard to see blind); while testing WebGL/canvas
  use `preserveDrawingBuffer:true`. This app is DOM/CSS, so `browser_eval` + computed styles
  are the normal verification.
- When a task changes code: finish with a fresh `browser_refresh`/`browser_eval`, confirm no
  `syntaxErrors`/`perchanceErrors`, then update THIS file, the index.html dev-note block, and
  (if user-visible) a `src/CHANGELOG.md` entry.
- **OVERLAY MARKUP GOTCHA (2026-09-23):** the full-page overlays must each be a direct child of
  `#output-container`. A single missing `</div>` nests the following overlays inside an earlier `hidden`
  wrapper, and `hidden` on an ancestor hides the whole subtree regardless of the child's `display` — the
  overlay's JS keeps working while it is completely invisible (`getBoundingClientRect()` 0×0, `offsetParent`
  null, a `vision`/snapshot capture of it returns an empty ~6-byte data URL). After ANY overlay markup edit
  verify `document.getElementById('jsonEditorOverlay').parentElement.id === 'output-container'` and a non-zero
  rect. This is exactly what hid the JSON editor + GitHub dialog until 2026.08.16.24.

## 13. JSON editor (`#jsonEditorOverlay`, added 2026.08.16.24)

- **Purpose:** Edit → 🧩 Open JSON Editor shows the WHOLE project as one formatted JSON document, so the author
  can bulk-edit values (or hand the doc to an external editor) without touching the UI. Opened by
  `openJsonEditor()`, closed by `closeJsonEditor()`; all `jsonEditor*` functions are exported on `window`.
- **Document shape:** `buildExportData(true)` minus `exportedAt` =
  `{version, settings:<collectPanelState()>, preset, libObjects, layoutMode, menuVisible, panelsVisible,
  activeMenu}`. `settings` is the live `comicGen.panelState` shape (see §3). Generated images and
  `panelPromptOverrides` are NOT in it (session-only), and GitHub creds are never included. On open the text is
  re-serialised from the live state, so the editor is always opened from the truth; `jsonBaselineDoc` is that
  parsed snapshot and every comparison (dirty check, change count, validation) is against it.
- **Editing rules:** `jsonFieldClass(path)` returns `'edit'` or `'lock'` per leaf. Editable: globals
  (projectName, imageSize*, guidanceScale, previewDelay, previewOn, globalPos, globalNeg, nsfw), `preset.*`,
  page fields (name, summary, panelCountSel, panelCountCustom, seed), panel title/seed/loc/locExtra/action/
  style/imgCount/chars[].sel|extra/extras[].type|sel|desc/protectSlots[] and `promptOverride.pos|neg`, library
  `type|name|desc`. Locked (greyed at 0.38 opacity, edits reported as "is read-only — change it from the app,
  not here."): everything else — the two `version`s, `settings.currentPage`, library entries' non-listed keys,
  array/object STRUCTURE (adding, removing or reordering entries is rejected with a readable message).
  Select-backed fields are also checked against the live `<select>` options (`jsonOptionProblem`).
- **Parser:** `jsonParse` is a hand-written position-aware recursive-descent parser (no `JSON.parse`) because the
  editor needs character ranges per token/value/key + a map of which offsets sit inside string escapes, so a
  later edit can be clamped to a valid string boundary. It returns `{error, doc, scalars, valRanges, keyRanges}`.
- **Render technique:** `.json-gutter` (line numbers) + `.json-mirror` (`<pre>`, coloured spans + mark overlays)
  sit under a fully TRANSPARENT `.json-area` textarea (transparent `color`, `caret-color:#ffcc00`) at the same
  13px/20px monospace metrics; `jsonEditorInput()` re-renders the mirror, `jsonEditorSyncScroll()` copies
  `scrollTop` to mirror + gutter. Marks: `.json-locked`, `.json-match`/`.json-match-cur`, `.json-problem`/
  `.json-problem-cur`. `jsonMarksHtml` is an O(N) boundary sweep over sorted mark edges (naive per-char
  intersection took 1.5s on an 83KB doc; the sweep does it in ~36ms) and syntax colouring is skipped entirely
  above `JSON_SYNTAX_MAX_CHARS` (220,000 chars) via the Syntax highlighting checkbox (locks/matches/problems
  still render; the hint line explains why).
- **Find/Replace:** only iterates `jsonEditStrings` (scalars with `kind === 'string'` AND
  `jsonFieldClass(path) === 'edit'`), so keys, locked values and `null`s can never be matched or replaced. Plain
  or RegExp (`jsonRegex`), `jsonMatchCase` toggle, `jsonEditorFindNext(±1)` wraps and selects the match in the
  textarea, `jsonEditorReplaceOne()` inserts a `jsonEscapeString()`-escaped replacement, and
  `jsonEditorReplaceAll()` confirms first when there is more than one match (naming the count) then replaces
  right-to-left so offsets stay valid.
- **Validation → Apply:** `jsonValidateNow()` is the single source of truth — it parses, walks the doc against
  `jsonBaselineDoc`, writes `#jsonProblemEl` ("Invalid JSON — see the highlighted spot." / "N problem(s) — step
  through them with ‹ Prev / Next ›." / "Valid — N field(s) changed, ready to apply." / "Valid — no changes
  yet."), fills `jsonProblems` (each `{start, end, message}`) and disables ✔ Apply when there are problems or
  nothing changed. It is called from a debounced (220ms) `jsonEditorInput()` — so in tests wait ~300ms after
  setting `jsonArea.value` + calling `jsonEditorInput()` before reading the status. `jsonEditorProblem(±1)`
  cycles the problems and selects the offending range.
- **Apply / Reload / Undo:** every programmatic change goes through `jsonBeforeProgrammaticChange()` /
  `jsonFinishProgrammaticChange()` which push a `{text, sel}` frame onto the undo stack (`JSON_UNDO_MAX = 10`,
  Ctrl+Z / Ctrl+Y) and coalesce typing. `jsonEditorApply()` validates, then pushes the pre-apply state
  (`jsonApplySnapshot` = panelState + libObjects + preset), writes `savePanelStateShape()` + `saveLibraryObjects()`
  + preset, replays the app's render path (`buildPanelGrid`, `renderLibrary`, `updatePanelSelects`,
  `updatePanelVisibility`, `renderKeywordChips`, `resetControls`, layout/menu flags, `populatePageSel`,
  `updateDeletePageBtn`, `updateProjectNameDisplay`, `schedulePanelSave`), and DELIBERATELY does not wipe
  `panelImages`/`pageSession`/`panelPromptOverrides` (unlike `applyImportedSettings`). `settings.currentPage` is
  forced back to the live page on apply. `jsonEditorReload()` rebuilds from the live project (discarding edits,
  with a confirm when dirty); `jsonEditorUndoApply()` restores `jsonApplySnapshot` and re-renders.
- **Close:** Esc / ← Back to page / `closeJsonEditor()`; confirms when the document is dirty. The overlay's
  keydown handler is attached in `openJsonEditor()` and removed on close.
- **Boot guard:** `panelStateRestored` (declared next to `savePanelState()`) starts false and is set true as the
  last statement of `restorePanelState()`; `savePanelState()` returns early while it is false, so a load-time JS
## 14. Theme & colour system (added 2026.09.23.3)

- **One variable table, two themes.** The `<style>` block starts with `:root{ --hdr-h + 74 colour vars }` (the DARK
  theme; every value is exactly the literal the app used before, which is why dark is unchanged), followed by
  `:root[data-theme="light"]{ ... }` and an identical mirror inside
  `@media (prefers-color-scheme: light){ :root:not([data-theme]){ ... } }` (that mirror is what makes the "System"
  pref flash-free before any JS runs).
- **Variable families:** `--bg`, `--surface`, `--surface-2…5`, `--well(-2…7)`, `--hover(-2,-3)`, `--grey-btn`,
  `--act-cell`, `--teal(-2)`, `--red/--red-2/--red-deep`, `--green/--green-2…5`, `--green-deep(-2)`,
  `--blue/--blue-2…4`, `--purple/--purple-2/--purple-3`, `--accent`, `--accent-soft`, `--accent-2…5`,
  `--accent-pulse`, `--accent-outline`, `--accent-deep`, `--accent-ink` = **fills** (a value used as a
  background/border); `--text`, `--text-2…12` = **foreground greys** (the higher N, the dimmer); `--ink`,
  `--ink-2` = **text on bright fills** (dark in BOTH themes, e.g. black on the amber Generate button);
  `--green-text`, `--red-text`, `--red-text-soft`, `--blue-text`, `--purple-text` = those hues used as *text*
  (much darker in light mode); `--border`, `--border-2…8`; `--on-danger` = white text on a `--red` fill.
- **JS API:** `applyTheme()` (the single entry point — sets/removes `data-theme` on `<html>` and writes the accent
  vars as INLINE `--accent*` custom properties on `documentElement`), `themeEffectiveMode()` (resolves
  system→light/dark), `accentVarsFor(hex, mode)` (derives the whole accent family from the one picked colour;
  in light mode it increases the black mix until the accent clears ~4.2:1 against white), `mixHex`/`hexToRgb`/
  `relLum`/`contrastAgainst` helpers, `applyThemeFromProject({mode, accent})`, `syncThemeControls()`,
  `persistTheme()`, and the UI entry points `onThemeModeChange()`, `onAccentInput()`, `onAccentChange(hex)`.
  All are exported on `window`.
- **Prefs + storage.** State lives in module vars `themeModePref` (`'system' | 'light' | 'dark'`, default `'dark'`)
  and `themeAccent` (`''` = the built-in amber family, otherwise `#rrggbb`). They are mirrored to
  `comicGen.themeMode` / `comicGen.accent` (localStorage) AND to `settings.theme` inside `collectPanelState()`, so
  the theme travels in Save/Export/Import; `applyImportedSettings()` and `jsonApplyDoc()` call
  `applyThemeFromProject()`. `jsonFieldClass` locks the `settings.theme` object but leaves `mode`/`accent` editable.
- **Boot order:** a hidden `<span>` square block immediately before `<style>` (runs during template render, i.e.
  before the first paint) sets `data-theme` from localStorage, resolving `system` with `matchMedia`. Later, the
  main IIFE's boot section loads the pref and calls `applyTheme()` (which also syncs the Preferences controls and
  the inline accent vars). Changing the OS appearance re-applies while the pref is `system` (a `change` listener on
  `THEME_MEDIA`).
- **UI:** `#preferencesPanel` (end of Edit) → `.pref-sub` "Theme" → `<select id="themeModeSel">` +
  `<div class="accent-row" id="accentRow">` with eight `<button class="accent-swatch" data-accent="…"
  style="background:…">` presets (plus `''` = default), `<input type="color" id="themeAccentInput">` and a Reset
  button. `.accent-swatch.active` marks the current one. The row wraps cleanly at 390px.
- **Gotchas:** (1) never put a raw colour in a rule — add it to the `:root` table and to both light mirrors;
  (2) `--accent` in light mode must stay dark enough for text (currently #9a6b00 ≈ 4.7:1 on white) — the CSS
  defaults and the JS-derived values for a CUSTOM accent are computed independently, so keep them in the same
  contrast ballpark; (3) the light theme needs a light override for every dark var it does not want to inherit, and
  any var left out simply keeps its dark value; (4) a light-mode contrast audit is the cheap regression check —
  walk every visible text node, compute the ratio against its nearest opaque background, and flag < 3.4 (the dark
  theme has ~53 such nodes by design/legacy, light should stay near zero); (5) `poTip` and the user-manual iframe's
  srcdoc page are intentionally NOT themed (a dark tooltip is conventional; CSS variables do not cross document
  boundaries).

## DOC LAYOUT (2026.09.23.6)

As of 2026.09.23.6 the internal docs no longer ship inside `index.html`:

- `DEV-NOTES.md` — the development log + gotchas (was the top-of-file comment in index.html).
- `AI-NOTES.md` (this file), `PENDING.md`, `ISSUES.md` — were `<script type="text/plain">` blocks
  in index.html; now only in this repo.
- `CHANGELOG.md` — lives here AND is still embedded in index.html as `#embeddedChangelog`, because
  `renderChangelog()` renders it into Help → About and `#aboutVersion` is parsed from its FIRST
  `## ` heading. Keep the two copies in sync.

index.html keeps a compact pointer comment at the top describing where the docs are and how to
read/write them. `ghPush()` was left unchanged — its docMap skips missing/empty blocks, so it now
pushes main.pjs / index.html / src/user-manual.html / CHANGELOG.md and no longer touches
PENDING.md / AI-NOTES.md / ISSUES.md (edit those via the Contents API).

The repo is PUBLIC (read + fork; push = owner only), so raw reads need no token:
https://raw.githubusercontent.com/cgoodwin97124/yacbpg-backup/main/<file>

Do NOT re-add those three text/plain blocks, and never put these .md files in src/ (the platform
save flow wedges on them — see DEV-NOTES.md).
