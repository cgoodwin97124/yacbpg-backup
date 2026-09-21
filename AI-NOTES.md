
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
  Contains `.menu-scroll` (the accordion groups) + `.gen-actions` (⚡ button + `#statusEl`).
  `.gen-actions` is `flex:0 0 auto` (2026-09-20, changelog 2026.08.16.19) so it can NEVER be squeezed by a tall
  `.menu-scroll` — the menu list scrolls instead and the generate bar + status stay visible.
- **Reserved bottom space (2026-09-20, changelog 2026.08.16.19):** the viewport-fixed buttons at the bottom
  (`#panelsToggleBtn` ▧ Hide Panels, `#pageNav`, `#menuRevealBtn` ☰/✕ Hide Menu) used to cover page content and,
  in side mode, the menu's generate bar. `body { padding-bottom: 96px }` (portrait: `156px`, where `#pageNav`
  sits at `bottom:74px`) gives the page scrollable clearance, and in side mode `syncSideMenuHeight()` sets
  `#menuFrame`'s inline `max-height` to `innerHeight - menuFrame.offsetTop - reserve` (reserve ≈112px, adaptive,
  floored at 80px) so the frame's bottom — i.e. `.gen-actions` + `#statusEl` — always ends above those buttons.
  `offsetTop` already includes the app-header (37/82/126px depending on wrapping), which is why this is measured
  in JS rather than a static `calc()`. Called from `applyLayoutMode`, `applyMenuVisible`, and `resize`/`load`/
  `orientationchange`; the inline style is cleared outside side mode.
- `switchMenu(name)` — one `.menu-group` open at a time (File/Edit/Library/Help), choice
  persisted; sections start collapsed via `collapseGroupPanels`. While `body.menu-fullscreen` it instead
  refuses to close the active section and EXPANDS the group via `expandGroupPanels` (and refreshes
  `#menuOverlayTitle`).
- **Toggles** (all persist independently):
  - `body.menu-hidden` — the CSS is `body.menu-hidden .menu-frame { display:none }`, i.e. it hides the WHOLE menu
    frame INCLUDING the Generate bar (this contradicts the earlier "the generate bar stays visible" promise —
    a documented latent issue, see the gotchas below; NOT changed in 2026-09-20's spacing fix).
    Floating `#menuRevealBtn` (☰) appears when header offscreen; bottom-LEFT when menu hidden,
    bottom-RIGHT when open (`syncSideMenuHeight` clears its inline max-height while the menu is hidden).
  - `body.panels-hidden` — hides `.canvas-frame` (all panel cards) via ▧ Hide/Show Panels header
    button. Generation is UNAFFECTED (writes to `panelImages`; the imgObserver just evicts
    srcs while hidden and restores on show).
  - `body.side-mode` — ▤ Menu: Top/Side header button.
- Header buttons (upper-left): ▦ Storyboard, ☰ Hide/Show Menu, ▤ Menu: Side, ⛶ Full Screen (`.menu-fs-toggle`),
  then ▧ Hide/Show Panels. ⛶ Full Screen → `toggleMenuFullscreen()`.
- **Full-screen menu overlay (`#menuOverlay`, 2026-09-20):** `.view-overlay` hosting the REAL `#menuFrame`
  (moved in on open, restored to `.page-layout` on close — see BATCH 2026.08.16.20). `openMenuFullscreen(section)`
  / `closeMenuFullscreen()` / `toggleMenuFullscreen(section)`; `#libFullscreenBtn` in the Library toolbar opens
  it on the Library tab. Esc or the overlay's `← Back to page` closes it. The markup sits just before
  `#analysisOverlay` so Analysis still paints above it.

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
  navigation via list/dropdown/prev-next/arrows/Esc), `#storyboardOverlay` (▦ button →
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
