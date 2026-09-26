# FUNCTION MAP — *Yet Another Comic Book Page Generator*

**What the application does, described as capabilities and rules rather than as screens.**

Written 2026-09-26 against the build stamped **2026.09.26.2** (`index.html`, 10,194 lines / 526 KB).
Every number in this document was measured from that file, not estimated.

> **How this document is meant to be used.** This is the *behavioural* half of the refactor pair. Its
> companion is `REFACTOR-ROADMAP.md` (how the code is put together today, what the target architecture
> is, and the order to get there) and `UI-IDEAS.md` (interface proposals that only make sense once this
> map exists). This file describes **what the app guarantees** — deliberately without describing any
> button, menu, dialog or layout. If a refactor preserves everything in §20 (Invariants), it has not
> changed the product. If it breaks one of them, it has.

---

## 0. Contents

| § | Section |
|---|---|
| 1 | [The app in one page](#1-the-app-in-one-page) |
| 2 | [Vocabulary — the domain model](#2-vocabulary--the-domain-model) |
| 3 | [Where the truth lives — state and persistence](#3-where-the-truth-lives--state-and-persistence) |
| 4 | [Project lifecycle](#4-project-lifecycle) |
| 5 | [Pages](#5-pages) |
| 6 | [Panels — structure, ordering, reflow](#6-panels--structure-ordering-reflow) |
| 7 | [Panel content — characters, location, action, descriptions](#7-panel-content--characters-location-action-descriptions) |
| 8 | [Library objects](#8-library-objects) |
| 9 | [Global style, keywords, presets and per-panel overrides](#9-global-style-keywords-presets-and-per-panel-overrides) |
| 10 | [Seeds and determinism](#10-seeds-and-determinism) |
| 11 | [Prompt assembly](#11-prompt-assembly) |
| 12 | [The generation engine](#12-the-generation-engine) |
| 13 | [Images](#13-images) |
| 14 | [Prompt history and thumbnails](#14-prompt-history-and-thumbnails) |
| 15 | [Selection, batch operations and the clipboard](#15-selection-batch-operations-and-the-clipboard) |
| 16 | [Export, import, backup, recent files](#16-export-import-backup-recent-files) |
| 17 | [The analysis matrix](#17-the-analysis-matrix) |
| 18 | [The project JSON editor](#18-the-project-json-editor) |
| 19 | [Help, manual and changelog](#19-help-manual-and-changelog) |
| 20 | [Cross-cutting mechanisms](#20-cross-cutting-mechanisms) |
| 21 | [**Invariants — the contract a refactor must not break**](#21-invariants--the-contract-a-refactor-must-not-break) |
| 22 | [Capability ledger](#22-capability-ledger) |
| 23 | [Known dead or legacy surface](#23-known-dead-or-legacy-surface) |

---

## 1. The app in one page

It is a **single-page, browser-only studio for making multi-panel comic pages from text prompts**. A
user describes characters, a location and an action per panel; the app assembles a full text-to-image
prompt for each panel, renders one to four images per panel, and keeps the whole thing — layout,
wording, seeds, library of reusable descriptions — in the browser so a page can be regenerated, backed
up and shared as a file.

The working loop is: **describe → render → look → adjust → render again**, repeated across a page of up
to 24 panels, with a reusable library of descriptions, per-page art settings, and a project file that
can be exported and re-imported on another device.

What it is **not**, and this matters for a refactor: no accounts, no server-side state, no
multi-user editing, no image storage service, no build step, no tests. The whole product is one HTML
file that runs offline (apart from the image service), plus a small static manual.

---

## 2. Vocabulary — the domain model

These are the nouns the rest of the document uses. The refactor's first job is to make them real types
instead of conventions in the DOM.

| Term | Meaning |
|---|---|
| **Project** | One saved document: name + global settings + all pages + all panels. Identified by name (no id). |
| **Page** | A numbered group of panels with its own name, summary, panel count and page seed. A project has pages keyed `1…N`; page keys are contiguous and renumbered. |
| **Panel** | The unit of work: a title, up to 3 character lines, one location line, one action, a per-panel seed, an image-count setting, optional style/size overrides, up to 4 image slots. A page has 1–24 panels; a project is 1 page minimum. |
| **Character line** | `{sel, base, extra}` — a chosen character (library object or built-in, or "none"), the panel's **Basic Description** copy, and a panel-only extra description. Three of these exist per panel; any may be empty. |
| **Location line** | The same shape, one per panel. |
| **Action** | Free text describing what happens in the panel. Not library-backed. |
| **Basic Description** | The panel's own copy of the text that came from the library when the item was chosen. It *freezes* once edited and can be *refreshed* from the library on demand. This is the text the prompt uses. |
| **Extra description** | Text that only this panel adds after the Basic Description. Never library-backed. |
| **Slot** | One image position in a panel, `1…4`. A panel shows only as many slots as its image-count setting. |
| **Library object** | A reusable `{id, type, name, desc}` entry ("Character", "Location", "Action", or a user-created type label) offered in the matching dropdowns across every project. |
| **Global keywords** | The positive and negative prompt keywords shared by all panels (edited by hand or replaced by a preset). |
| **Preset** | A pair of choices: an art style and a colour palette, each contributing keywords (and photo styles also swapping the global negatives). |
| **NSFW flag** | A project-level toggle that changes what the global keywords include. |
| **Seed** | The integer handed to the image service. Can come from the page, the panel, or be random; protected by the app's own arithmetic (§10). |
| **Protect (🔒)** | A per-slot flag: this image must never be overwritten by any generation path. |
| **Cover / representative (⭐)** | The slot that represents its panel in grid views (Storyboard). Exactly one slot can be the representative. |
| **Run** | One user-initiated generation of one panel, one slot, a list of panels, a range, or a whole page. Runs can be paused and stopped. |
| **Selection** | A session-only set of panel numbers used to apply operations to many panels at once. Never saved. |
| **Clipboard** | Session-only snapshots of whole panels (settings **and** images) for copy/cut/paste, in this tab only. |
| **Prompt override** | A per-panel hand-edited prompt (`{pos, neg}`) that replaces the assembled prompt until the panel's inputs or the globals change. |
| **Prompt history entry** | A record of what a run used: the exact prompt, the seed(s) per image, a timestamp, and thumbnail(s). |
| **Recent entry** | A remembered project file (a browser file handle where supported, otherwise a stored snapshot of the JSON text). |

---

## 3. Where the truth lives — state and persistence

The single most important fact about the current design: **the state is in five places at once, and
they are kept in step by convention.**

| # | Store | Contents | Lifetime |
|---|---|---|---|
| 1 | **The DOM** | Textareas, selects, checkboxes, seed boxes, image-count selects, `.repr`/`.protected` classes, accordion `data-collapsed`, per-slot chip disabled states | Until reload |
| 2 | **Module variables** (inside the one IIFE) | `panelImages` (current page's slot images), `panelPromptOverrides`, `pageSession` (per-page images), `panelSelection` + `selectionAnchor`, `panelBusy`, `inFlightGen`, `pausedByVisibility`, `stopRequested`, `generateAllRunning`, `imgObserver`, `plLineStateMap`, `panelClipboard`, cached `mapsPromise` | Until reload |
| 3 | **`localStorage`** | The project + library + preferences (below) | Permanent |
| 4 | **IndexedDB** (`comicGenSaveState` → store `main`) | The `💾 Save…` file handle, and the Recent-files list | Permanent |
| 5 | **The repo / a file on disk** | Export JSON, Export `.zip`, GitHub backup | Outside the app |

### 3.1 `localStorage` keys (all written by this app)

| Key | Holds |
|---|---|
| `comicGen.panelState` | The whole project: `{version:2, projectName, imageSizeSel/W/H, guidanceScale, imgCountDefault, previewDelay, previewOn, globalPos, globalNeg, nsfw, currentPage, pages:{N:pageData}}` |
| `comicGen.libObjects` | The library: `[{id, type, name, desc}]` |
| `comicGen.libTypes` | User-created library type labels |
| `comicGen.preset` | `{style, palette}` |
| `comicGen.promptThumbs` | `{key: dataUrl}` thumbnails for prompt-history entries (kept out of the project on purpose) |
| `comicGen.recentMax` | How many Recent entries to show (0 hides the list; default 5, max 50) |
| `comicGen.themeMode`, `comicGen.accent` | Colour mode (system/light/dark) and accent colour |
| `comicGen.layoutMode`, `comicGen.menuVisible`, `comicGen.panelsVisible`, `comicGen.activeMenu`, `comicGen.menuFullscreen`, `comicGen.hdrAllViews`, `comicGen.genAlwaysVisible` | Layout/visibility preferences |
| `comicGen.hidePasswordPref` | Whether the casual "hide the panels" password is asked for |
| `comicGen.githubOwner`, `comicGen.githubRepo`, `comicGen.githubToken`, `comicGen.githubLastBackup` | The optional backup target (a fine-grained PAT stored in the browser) |

Legacy keys the code still knows about: `comicGen.charLibrary` / `locLibrary` / `actLibrary` (migrated
into `libObjects` then deleted). Leftovers with **no code at all**: `comicGen.undoProject` (a removed
feature's snapshot) and `comicGen.watchdogReloads` (a removed auto-reload counter, still *cleared*).

### 3.2 The save pipeline

Any input inside the panel grid → one delegated listener (`handleGridInput`) updates the session-only
side effects (prompt override invalidation, summaries, chips) → `schedulePanelSave()` debounces 250 ms
→ `collectPanelState()` → `collectPageData()` **reads the live DOM** for the current page → JSON into
`localStorage`. Restoration is the mirror image: `restorePanelState()` → `renderPanelObjects()` writes
the DOM back, with a chain of `migrate*()` fixups for older shapes.

**Consequences a refactor must handle:** the DOM is the write-ahead log *and* the model; a value that
is not currently rendered on the current page is not collected from the DOM at all (it is carried from
the previous `panelState`); programmatically setting `.value` does not fire the listeners, so state and
derived UI can silently diverge; and anything session-only (images, overrides) is lost on reload by
design.

### 3.3 Migrations that must keep working

`ensurePages()` (v1 flat → v2 pages), `migrateLibObjects()`, `migratePanelExtras()`,
`migratePanelExtraCopies()`, `migratePanelBaseDescriptions()`, `scrubMinusOneSeeds()`,
`normalizeState()` (clamping/filling), plus the legacy `chars[].persist` / `locPersist` / `actPersist`
flags that older saves carry and current code ignores. Real projects exist in the wild in every one of
these shapes, so a refactor has to port the migration ladder, not replace it.

---

## 4. Project lifecycle

**Capabilities:** name a project (the name is the default export filename and is shown as the page
title); start a new (empty) project; export/import it; back it up to GitHub; know whether it is
"active" (has content worth warning about before it is discarded).

**Rules:**
- A project's name is free text, has no id, and is not unique.
- Starting a new project, resetting to defaults, and importing all *replace* the current project; when
  the current project has content, they ask first and offer to save a backup as part of the same
  question (three-way: Save-and-continue / continue-without-saving / cancel).
- "Reset to defaults" can optionally also delete the saved **library objects** (a separate confirmation
  because it affects every project).
- Reset returns global settings, every panel and the layout settings to factory values; the library and
  the browser preferences survive unless explicitly included.

**Where it lives:** `newProject` / `doNewProject` / `confirmNewProject*`, `resetEverything`,
`hasActiveProject`, `buildExportData`, `updateProjectNameDisplay`, `onProjectNameInput`,
`projectSlug`, `defaultFileName`.

**Warts:** `resetEverything` is the largest single state-destroying function (138 lines) and it reaches
into the DOM, `localStorage`, `sessionStorage` and several caches at once; the fresh state it writes is
built by hand rather than by a schema default function.

---

## 5. Pages

**Capabilities:** add, name, describe, switch, reorder (renumber), and delete pages; choose how many
panels a page holds (1/4/6/12/24 or a custom 1–24); give each page its own seed; navigate between pages;
see how many pages exist and which one is current.

**Rules:**
- Pages are keyed `1…N` and always contiguous; deleting or renumbering renumbers the rest.
- Exactly one page is *current*; everything panel-related acts on the current page only.
- The current page is remembered across reloads (`currentPage`).
- A page's panel count is authoritative for how many panels are visible; the data for all 24 slots can
  exist even when the page shows four.
- Deleting the last page is not allowed (a project always has ≥1 page).
- The per-page seed is the base for panels that have no seed of their own (§10).
- Switching pages clears the panel selection and swaps the in-memory image set to that page's.

**Where it lives:** `addPage` / `deletePage` / `switchPage` / `renumberPageTo` / `renumberPageTo`,
`populatePageSel`, `updatePageNav`, `pageNavDelta`, `updateDeletePageBtn`, `onPageNameInput`,
`onPageSummaryInput`, `pageLabel`, `currentPageLabel`, `pageCount`, `setPageImagesFor` / `pageImagesOf`,
`sortedPageKeys`.

**Warts:** "page" logic is spread across the panel-move code (moving a panel to another page creates
and renames pages), so the page model is not a module — it is a set of operations that happen to agree.

---

## 6. Panels — structure, ordering, reflow

**Capabilities:** add a panel, duplicate it, delete it, move it to a position on the page or to another
page (including a brand-new page), reorder a group of panels as a block, and keep all of this within a
hard maximum of 24 panels per page by *reflowing the overflow onto the following page* rather than
refusing.

**Rules:**
- A page holds at most **24** panels; a project can hold any number of pages, so the real cap is
  "24 per page, pages unbounded".
- Duplicating or adding panels never fails: the overflow cascades to the next page (creating one if
  needed), and that can cascade again. Panels therefore have *two* positions: their panel number within
  their page, and their page.
- Moving a panel keeps everything about it — content, descriptions, per-panel seed, image-count
  setting, style/size overrides, prompt override, protection flags — and renumbers the pages involved.
- Deleting a panel shifts later panels up and renumbers them; deleting every panel on a page deletes
  the page.
- A panel's identity is its position, not an id. Every reference to a panel is a 1-based number valid
  only on the current page.

**Where it lives:** `addPanel`, `duplicatePanel`, `deletePanel`, `movePanelToPage`,
`movePanelToNewPage`, `resequencePanel`, `reflowInsertOnFullPage`, `planReflow`, `batchReflowPlan`,
`cascadePageSequence`, `pageObjectFromEntries`, `remapPanelSession`, `remapPanelSessionForDuplicate`,
`populateReorderSelects`, `toggleReorderPicker`, `onReorderSelect`, `sortedPageKeys`,
`analysisPanelCount`.

**Warts:** position-as-identity is the reason so much code takes an `i` and re-reads the DOM; reflow is
implemented as a page-level sequence rebuild (`cascadePageSequence`) used by six different callers, each
with its own pre-checks; and the in-memory images must be carried along manually on every structural
change (`remapPanelSession`, `pageObjectFromEntries`).

---

## 7. Panel content — characters, location, action, descriptions

**Capabilities:** per panel, choose up to three characters and one location from the library and the
built-ins (or nothing), give each a Basic Description and an extra description, write a free-form
action, and copy any of these forward from an earlier panel ("same as the panel before") by walking
back to the nearest earlier panel that actually has one — across page boundaries, skipping blanks.

**Rules:**
- Three character lines exist; each may be "none".
- Choosing a library object *seeds* the Basic Description from that object's text **once**.
- Editing the Basic Description freezes it: later edits to the library object no longer change it. A
  line whose text differs from the library's is marked as edited.
- **Refresh from library** replaces the Basic Description with the library's current text, per line —
  and, when the owning panel is part of a 2+ selection, for every character and location line of every
  selected panel at once (lines with no library text are left alone and counted).
- The extra description is never library-backed and always appends after the Basic Description.
- A panel counts as having content when *any* character **or** the location is selected — descriptions
  and actions alone do not make it renderable in a page-wide run.
- A per-panel title is display-only and never enters the prompt.
- The ⇤ copy-from-previous control is available per line; Panel 1 has no source, so it is unavailable.

**Where it lives:** `charRowHtml` / `locRowHtml` / `actRowHtml` / `renderPanelObjects`,
`panelLineIds`, `plLineDescText`, `panelLibDescSeed`, `applyPanelLineBase`, `refreshPanelLineBase`,
`panelLibDescRefreshOne`, `batchRefreshPanelLineBases`, `refreshPanelLineDesc`,
`seedPendingPanelBases`, `copyFromPrevPanel` + `prevItemSource` / `readPanelItem` / `panelItemIsSet`,
`deletePanelChar` / `deletePanelLoc` / `deletePanelAct`, `absorbPanelItems`, `applyCopyPrevChips`,
`updateCopyPrevChipStates`, `resolveDesc`, `newPanelLibraryEntry`, `storedPanelEntry`.

**Warts:** the freeze/seed distinction lives in one `dataset` attribute (`data-needSeed`) plus a
comparison function; the "differs" state is recomputed at eight call sites; and library text is looked
up by parsing a string id (`lib:<type>:<id>`) wherever it is needed.

---

## 8. Library objects

**Capabilities:** create, rename, re-describe and delete reusable character/location/action objects;
add a new *type* of object; see which panels use an object; import objects out of another project file
(picking which ones, and editing them first); and create an object on the fly from inside a panel.

**Rules:**
- The library is **global to the browser**, shared by every project, and stored separately from the
  project — but a settings export *does* carry it, as `libObjects`, and an import applies it: a v2 file
  **replaces** the browser library with the file's, a v1 file **merges** its legacy `charLibrary` /
  `locLibrary` / `actLibrary` into whatever the browser already has (measured 2026-09-26, §24).
- Objects have a stable generated id, a type label, a name and a description.
- Types are open-ended: the built-in labels plus any the user creates.
- Deleting an object is confirmed, names every project it affects, and warns when it is referenced.
- Built-in (pjs-provided) characters and locations are a separate, non-editable set merged into the
  same dropdowns.

**Where it lives:** `loadLibraryObjects` / `saveLibraryObjects` / `objectsOfType` / `libraryOptions`,
`migrateLibObjects`, `addLibraryEntryByType`, `deleteLibraryObject`, `countLibReferences`,
`newLibraryId`, `normalizeLibType`, `extractLibraryItems`, `importLibraryFromFiles` +
`renderLibImportModal` / `libImportRow` / `confirmLibraryImport`, `renderLibrary`, `buildMap` /
`getMaps` / `optionsHtml`.

**Warts:** the library lives in `localStorage` while the project lives in `localStorage` *and* the DOM,
so "shared" data and "project" data have different lifecycles but the same storage mechanism; and
built-in descriptions arrive asynchronously (`builtinDescMaps`), which forces the `data-needSeed`
deferred-fill dance described in §7.

---

## 9. Global style, keywords, presets and per-panel overrides

**Capabilities:** edit global positive/negative keywords directly; pick an art style and a colour
palette from presets (which replace the keyword fields); toggle the NSFW flag (which changes what the
keyword sets contain); see the effective keyword list live and copy it; and per panel, optionally
override the style, the image size, the image count and the prompt-obedience (guidance) value.

**Data:** 12 art styles (3 of which also define photo-style negatives), 9 colour palettes, 4 built-in
characters and 4 built-in locations, one default positive/negative pair, one global NSFW flag, one
global guidance value (1–30, default 7), one global image size, and per-panel `style` / `size` / `imgCount`
/ `promptOverride` overrides.

**Rules:**
- Effective keywords = preset keywords (if a preset is chosen) + the global fields + auto-added NSFW
  terms when the flag is off. The exact composition is visible to the user and is the source of truth
  for the prompt.
- Applying a preset *replaces* the global keyword fields; it does not stack.
- `[Default (Global)]` on a panel means "use the global value"; a per-panel choice wins for that panel.
- Changing any global input invalidates every panel's prompt override (§11).

**Where it lives:** `getEffectiveKeywords`, `ART_STYLES` / `COLOR_PALETTES` / `initPresets` /
`applyPreset`, `renderKeywordChips` / `renderFilterStatus` / `renderChips` / `initKeywords`,
`copyKeywords` / `copyText`, `getImageSize` / `getPanelImageSize` / `pickSourceResolution` /
`onImageSizeChange`, `onGuidanceScaleChange`, `onPanelStyleChange` / `onPanelSizeChange` /
`onPanelImgCountChange` / `applyAllImageCount`.

**Warts:** presets are *also* applied by writing the keyword textareas, so the "current style" is not
stored — it is inferred from the text; the analysis matrix (§17) can edit the same globals through a
second code path.

---

## 10. Seeds and determinism

**Capabilities:** reproduce a page exactly; give a panel its own seed; use one seed for every image of a
panel instead of one per image; clear a seed back to "random"; copy the previous panel's seed; see the
seed each image was generated with; and replay a run from prompt history with its recorded seeds.

**The arithmetic (the whole model):**
```
page seed (optional)
  └─ panel seed = its own seed box, else page seed + panelIndex − 1, else random
       └─ image k uses panel seed + (k − 1)        ← unless "same seed for every image" is on
```
plus: when a panel has no seed at all, the first run *pins* one into the panel's seed box so
re-generating gives the same image; the value is clamped away from the image service's `-1` sentinel
(`scrubMinusOneSeeds`); a replay uses the seeds recorded in the history entry instead of the current
boxes; and `-1`/blank means "let the service choose".

**Rules:**
- Reproducibility is only as good as the image service; the app guarantees the *seed it asks for*, not
  the pixels.
- Seeds are ordinary project data and survive export/import, duplication, moving and reloads.
- A replay of a prompt-history entry is deliberately *not* affected by the same-seed setting.

**Where it lives:** `getPanelSeed`, `pinPanelSeedForRun`, `panelSameSeedOn` / `setPanelSameSeed` /
`onPanelSameSeedChange`, `updatePanelSeedPlaceholders`, `clearPanelSeed`, `previousPanelSeedRaw`,
`copySeedFromPrevPanel`, `updateSeedChipStates`, `scrubMinusOneSeeds`, `promptHistorySeeds` /
`promptHistorySeedLabel`, `seedForSlot`.

**Warts:** the seed's *display* (a grey placeholder showing the value that would be used) is computed
in three places; "pinned" seeds are a side effect of generating; and the arithmetic is duplicated
between the live path and the replay path.

---

## 11. Prompt assembly

**Capabilities:** turn one panel's content into the exact positive and negative prompt strings the image
service receives, expose that text to the user (view, copy, read it in prompt history), and let the user
hand-edit it per panel until their inputs change.

**The composition (order matters and is user-visible):**
1. Global positive keywords (incl. preset + NSFW additions).
2. Per-panel style override keywords, if any.
3. For each character line: the resolved description (the Basic Description, or the library/built-in
   text when there is none) **plus** the panel's extra description — each exactly once.
4. The location: the same rule.
5. The action text.
6. Aspect/size wording as needed.
Negative = global negatives (+ preset negatives for photo styles) and any per-panel override.

**Rules:**
- A panel is *skipped* by page-wide runs when it has no character and no location selected.
- A prompt override wins until any contributing input changes (globals, preset, NSFW, the panel's
  characters/location/action), at which point it is discarded silently and rebuilt.
- Copy-prompt copies exactly what would be sent, override included.
- The same assembly feeds the live run, the copy button, the history entry and the JSON view.

**Where it lives:** `buildPanelPrompt` (async), `getPanelKeywords`, `resolveDesc`,
`populatePromptEditor` / `togglePromptEditor` / `clearPanelPromptOverride` /
`clearAllPromptOverrides`, `copyPanelPrompt` / `flashPromptBtn`, `promptHistoryEntryHtml` +
`addPromptHistoryEntry` (the record of what was sent).

**Warts:** `buildPanelPrompt` reads the DOM directly and is `async` for no structural reason; the
override-invalidation rule is implemented in `handleGridInput` as a long chain of "which input
changed?" branches rather than as a single derived-state rule.

---

## 12. The generation engine

**Capabilities:** render one slot, one panel, a list of panels, a range of panels, everything from panel
1 to a chosen panel ("to here"), everything from a chosen panel to the end ("from here"), or the whole
page; pause and resume; stop; keep protected images; report progress and a final tally; record each run
in prompt history with thumbnails.

**Rules (the interesting part):**
- **One run at a time.** A run is either a page-wide/listed run or a single panel; `panelBusy[i]` guards
  re-entry per panel, and a global stop button is enabled whenever anything is in flight.
- **Protected slots are never written.** Every path (single slot, panel, page, replay) skips 🔒 slots and
  reports them as protected rather than as failures.
- **Blank panels are skipped**, not failed; a run reports `generated / skipped / protected / failed`.
- **Aborts are normal.** Backgrounding the tab pauses (and pauses are detected on return); Stop aborts
  the in-flight request and marks the panel; both paths settle the engine's own 120-second watchdog so
  that an abandoned request can never surface as an unhandled rejection.
- **A pause remembers where the run was heading**: resuming a "to here" or range run stops at that same
  end panel instead of running to the end of the page.
- **A run pins panel seeds** as described in §10 and appends a prompt-history entry with its thumbnails.
- **The image service contract**: the call is `root.generateImage({prompt, negativePrompt, resolution,
  seed, guidanceScale})`; it can return a non-thenable error string, so every response is checked for
  `dataUrl`; the returned image may be a smaller base size and is upscaled client-side to the requested
  size.

**Where it lives:** `renderPanelSlot` (the atom), `generateSinglePanel`, `generateSinglePanelSlot`,
`generateComicPage`, `panelGenerateAction` / `FromHere` / `ToHere` / `RangeAction`,
`pauseGenerations` / `haltGenerations` / `stopAllGenerations`, `armRunSignal` / `withRunSignal` /
`withTimeout`, `setStopButtonEnabled` / `setPauseButtonEnabled` / `syncStopButton`, `getPanelSeed` /
`pinPanelSeedForRun`, `upscaleDataUrl`, `commitPromptHistoryRun`.

**Warts:** pause/stop is expressed as three global booleans plus a signal object, read from inside the
per-slot loop; the "what do I do when resumed" logic is split between the caller and the engine; and
there is no queue — a run is an `await` loop, so a page-wide run's progress is only as fine-grained as
the panels.

---

## 13. Images

**Capabilities:** hold 1–4 images per panel for every page **in memory**, mark one as the panel's
representative, protect an image from regeneration, clear one image / all of a panel's images, open an
image full size, download one or all of a panel's images as a zip, copy an image onto other images in
the same panel or another panel on the page, and export/import all images with the project.

**Rules:**
- Images are **session-only**: nothing about them is written to `localStorage`. They live per page
  (`pageSession[page] = {images}`) and are lost on reload — which is why the app nags about exporting.
- A panel's slot count is a setting (1–4); slots above it are hidden (the slot element is hidden, the
  data is not deleted).
- Protection (🔒) is per slot and is *project* data (`protectSlots`), so it survives a reload even
  though the image it protects does not.
- The representative (⭐) is per panel, and its image is what grid views show.
- Image `<img>` elements are lazily hydrated/evicted by an IntersectionObserver (400 px margin) to keep
  memory flat on long pages — a data URL that is off screen may not be attached to its `<img>`.
- Copying an image replaces whatever is in the destination slots, never overwrites a 🔒 destination,
  and always lands unprotected.
- Export bundles every page's images plus the settings JSON into one `.zip` (hand-rolled CRC32 +
  inflate); import puts them back.

**Where it lives:** `showPanelImage`, `ensureImageObserver` / `observePanelCard`, `panelImages` /
`pageSession` / `pageImagesOf` / `setPageImagesFor` / `collectAllPageImages`, `setSlotProtected` /
`isSlotProtected` / `toggleSlotProtect`, `makeRepresentative` / `updateRepHighlight`,
`hasPanelImages` / `hasPanelImage` / `updatePanelAllButtons` / `setPanelImageButtons`,
`clearPanelImage` / `clearPanelImages` / `clearPanelImageSlot`, `openPanelImage` / `openPanelAll`,
`savePanelImage` / `savePanelAll`, `copyImageToAction` / `copyImageDests` / `copyImageRefresh` /
`applyImageCopy`, `buildZip` / `crc32` / `inflateRawDeflate` / `unzipEntries` / `exportZip` /
`parseZipImages` / `repopulateImportedImages`, `dataUrlToBlobUrl` / `dataUrlToBytes`, `upscaleDataUrl`.

**Warts:** the image store is keyed by panel *position* and must be remapped by hand on every
structural change; DOM state (`img.src` presence, chip disabled flags, `.repr`, `.protected`) is used as
a proxy for the store, which is why tests cannot read `panelImages` and must inspect the DOM instead.

---

## 14. Prompt history and thumbnails

**Capabilities:** for each panel, remember the last few things it generated — the exact prompt, the
seed(s) used per image, when it happened, and a thumbnail per image (hover/long-press to enlarge) — and
from any entry: re-run it, or copy its prompt.

**Rules:**
- History is **project data** (it travels with export/import and is editable in the JSON view) but
  thumbnails deliberately live outside the project, in their own storage key with a hard cap (240
  entries / ~1.4 MB), evicting oldest-referenced-first.
- One entry per run, with one thumbnail per image the run produced.
- Replay uses the entry's own seeds (so it is unaffected by the same-seed setting) and still respects
  🔒 protection.

**Where it lives:** `addPromptHistoryEntry` / `commitPromptHistoryRun` / `renderPromptHistory` /
`renderAccHistory` / `promptHistoryEntryHtml` / `promptHistoryWhen`, `buildPromptThumb` /
`attachPromptHistoryThumb` / `promptHistoryThumbHtml`, `promptThumbStore` / `savePromptThumbStore` /
`prunePromptThumbs` / `promptHistoryThumbKeys`, `generateFromPromptHistory` / `copyPromptHistoryEntry`.

**Warts:** the thumbnail store keeps its own reachability logic (`prunePromptThumbs` scans the project
for references), which is a second garbage collector alongside the project's own lifecycle.

---

## 15. Selection, batch operations and the clipboard

**Capabilities:** tick any number of panels and apply one operation to all of them at once — generate,
generate-to-here, generate-from-here, generate-a-range, duplicate, add one panel per selection, move the
block, refresh descriptions, clear images, clear, delete — plus copy/cut whole panels to an in-app
clipboard and paste them before any panel (with their images).

**Rules:**
- The selection is session-only, is cleared when the page changes, and never enters the project.
- Every batch operation behaves as if it were the single-panel operation applied in order; the
  position-aware ones (duplicate, add, move, to-here, range prefill) use the **last selected panel** as
  the anchor, or the first for from-here.
- Destructive batch operations confirm first and offer to narrow to the panel you clicked; the copies in
  the Panel Selection menu (which belong to no single panel) confirm without that escape.
- A batch that reflows (because a page is full) asks once, in advance, and says whether a new page will
  be created.
- Paste consumes a cut but not a copy; the clipboard is this tab only.

**Where it lives:** `panelSelection` / `panelSelectionSorted` / `onPanelSelectClick` / `selectAllPanels` /
`clearPanelSelection` / `updateSelectionUI` / `panelBatchMode`,
`batchDuplicatePanels` / `batchAddPanels` / `moveSelectionWithinPage` / `batchMoveToPage` /
`batchMoveToNewPage` / `performBatchDelete` / `batchDeletePanels`,
`panelClipboard` / `copySelectionToClipboard` / `panelCopyAction` / `panelCutAction` /
`panelPasteAction` / `updatePasteUI`, `showChoiceDialog` / `choiceDialogPick`, `selMenuSelection` /
`selMenuAction`, `batchRefreshPanelLineBases`.

**Warts:** nine operations × their own dialog text × their own re-entrancy checks; the batch guidance
exists twice (the ⚙ Panel menu of a selected panel, and the Panel Selection section) with the same
handler behind both; and "only this panel" is threaded through three different destructive functions as
an options flag.

---

## 16. Export, import, backup, recent files

**Capabilities:** download the project as JSON; download the project + all images as a `.zip`; import
either one (replacing the current project, with a three-way save-first prompt); use real file handles
where the browser supports them so `💾 Save…` overwrites the same file; keep a Recent list of files
(handle or stored snapshot); and push `main.pjs`, `index.html` and the manual to a GitHub repo with a
token the user supplies, with a test-connection button and a last-backup timestamp.

**Rules:**
- JSON export contains the project *and* the library (as `libObjects`) and never the images.
- Zip export contains the settings JSON plus every page's images.
- Import replaces everything, migrates the imported shape (the same migration ladder as boot), and
  repopulates images when the file is a zip.
- The Recent list stores a *snapshot of the text* where File System Access is unavailable, so a recent
  entry still works in Firefox/Safari.
- The GitHub push reads `main.pjs` from the platform API and `index.html` from the **served** page — so
  it captures the last *saved* build, never the unsaved editor state — and it deliberately does not push
  the changelog.

**Where it lives:** `buildExportData` / `exportSettings` / `settingsBlob`, `buildZip` / `exportZip`,
`parseZipImages` / `repopulateImportedImages`, `applyImportedSettings` / `doImportFile` /
`importSettingsFromFile` / `beginImport` / `confirmImport*`, `saveSettings` / `saveSettingsAs` /
`writeToHandle` / `ensureWritePermission` / `idbOpen` / `idbGet` / `idbSet` / `idbDel` /
`restoreSaveState`, `loadRecentEntries` / `addRecentEntry` / `renderRecentList` / `openRecentEntry` /
`openRecentPicker` / `clearRecentList` / `onPrefRecentMaxChange`, `ghRepoInfo` / `ghLoadSettings` /
`ghSaveSettings` / `ghTest` / `pushGitHubFile` / `ghPush` / `openGhBackup`.

**Warts:** the zip codec, the file-handle layer, the Recent list and the GitHub client each bring their
own async error surfaces into the same file; import and boot share the migration ladder but not the code
path to it.

---

## 17. The analysis matrix

**Capabilities:** show every library item against every panel of a chosen page as a grid; mark which
cells a panel uses; edit a panel's per-item description inside the grid; add an unused item to a panel;
and — from the same screen — edit each panel's action, style, image size and seed, plus the page-wide
globals (style, size, seed, NSFW).

**Rules:**
- The matrix is a *second editor* for the same panel data: edits there must behave exactly like edits in
  the panel itself (drop the same prompt overrides, update the same summaries, save the same state).
- It supports a chosen page without switching the current page.

**Where it lives:** the `analysis*` family (~50 functions: `renderAnalysis`, `analysisFillCell`,
`analysisAddItem`, `analysisSetGlobal*`, `analysisSetPanel*`, `analysisSlot`, `analysisPageSeedValue`,
`analysisResolvedSeed`, …) plus shared helpers (`analysisPanelCount`, `analysisPanelAction`).

**Warts:** this is the largest body of duplicated edit logic in the app — roughly 890 lines re-implement
"choose a character / edit a description / set a seed / set a size" for a grid instead of reusing the
panel's own model. It is the clearest single win available to a refactor: with a real state layer, the
matrix becomes a *view* that calls the same commands as the panel.

---

## 18. The project JSON editor

**Capabilities:** open the whole project (settings, every page and panel, the library, UI flags) as one
JSON document; edit the fields you could edit elsewhere and nothing else; see structural fields greyed
and locked; validate as you type; find/replace (with regex and replace-all) across the editable text
fields only; navigate validation problems; undo/redo; apply.

**Rules:**
- The document is the project — but a *derived* one: it is built from the live state on open and
  canonicalised on apply, so it is never a third source of truth.
- Only fields with a UI equivalent are editable; everything else (version, current page, library ids,
  document structure, select-backed values with unknown options, out-of-range numbers) is refused with a
  clear message, so a replace-all cannot corrupt the project.
- Apply re-uses the normal restore path, so the same migrations and clamps run.

**Where it lives:** `jsonBuildDoc` / `jsonDocText`, `jsonTokenize` / `jsonParse` / `parseValue` /
`jsonDecodeRaw` (a hand-written, position-aware parser so formatting and the cursor survive),
`jsonFieldClass` / `jsonRangeFor` / `jsonWalkProblems` / `jsonOptionProblem` / `jsonNumberProblem` /
`jsonTypeProblem` / `jsonValidateNow`, `jsonRenderAll` / `jsonMarksHtml` / `jsonRenderMirror` /
`jsonRenderGutter` / `jsonQueueRender`, `jsonFindRegex` / `jsonComputeMatches` /
`jsonEditorFindNext` / `jsonEditorReplaceOne` / `jsonEditorReplaceAll`,
`jsonSnapNow` / `jsonPushUndo` / `jsonUndoAction` / `jsonRedoAction` / `jsonCommitTyping`,
`jsonApplyDoc` / `jsonCanonicalise` / `jsonEditorApply` / `jsonEditorReload` / `openJsonEditor` /
`closeJsonEditor`.

**Warts:** ~900 lines of a *generic* text-editing engine (tokenizer, parser, mirror, gutter, find,
undo) live inside the app and know the project schema intimately; none of it is reused elsewhere, and
none of it is testable without a DOM.

---

## 19. Help, manual and changelog

**Capabilities:** a full user manual (shipped as a static file, opened in an in-app overlay); a Help →
About panel showing the version history, fetched live from the repo the first time it is opened, with the
tiny embedded stamp as the offline fallback; and the GitHub backup dialog.

**Rules:**
- The changelog is *not* shipped inside the app — only the current release heading is embedded, as the
  fallback and as the commit-message version.
- The manual is a snapshot and may lag the app; the changelog is authoritative.

**Where it lives:** `openUserManual` / `closeUserManual`, `changelogFetchTargets` / `parseChangelog` /
`renderChangelogEntries` / `loadFullChangelog` / `appendInlineMarkdown` / `setChangelogStatus` /
`ghRepoBlobUrl`, and the embedded `#embeddedVersion` stamp.

**Warts:** a third markdown-ish renderer (`appendInlineMarkdown`) exists only for the changelog.

---

## 20. Cross-cutting mechanisms

| Mechanism | What it does | Where |
|---|---|---|
| **Inline-handler API** | Every interactive element calls a global by name, so 199 functions are exported on `window` — the de-facto public API and the only thing tests can call. | `window.* = …` block (lines 8757–9838) |
| **Delegated grid input** | One `input`/`change` listener on the panel grid dispatches by element id, updating derived state and scheduling the save. | `handleGridInput`, `gridHasListeners` |
| **Dialogs** | A generic multi-button dialog (`showChoiceDialog`) plus several bespoke overlays (import library, new project, panels password, image preview, JSON editor, GitHub, manual, analysis) share one overlay chrome pattern. | `showChoiceDialog` / `choiceDialogPick`, `.import-confirm-overlay` |
| **Status & feedback** | One status line (`#statusEl`) for most operations, plus per-area status spans, plus a global generate/progress line. | `statusEl`, `#backupStatusEl`, `#ghStatusEl`, `setChangelogStatus` |
| **Overlay invariant** | Every full-page overlay must be a direct child of the output container; a nesting slip makes it invisible while its JS keeps working. | see the gotcha in `AI-NOTES.md` §12 |
| **Theme & accent** | One stylesheet with a dark table, a light table and a mirrored `prefers-color-scheme` block; ~74 custom properties; the accent colour derives hover/border tints by mixing. | `applyTheme`, `accentVarsFor`, `mixHex`, `contrastAgainst`, `normalizeAccent` |
| **Layout modes** | Compact top/side menu vs. full-screen menu; header auto-hide; panels hide/show with an optional session password; generate buttons relocate between the menu bar and the header. | `applyLayoutMode`, `isMenuFullscreen`, `applyMenuVisible`, `applyPanelsVisible`, `placeGenButtons`, `initHeaderObserver` |
| **View modes** | Storyboard (grid of representatives) and Focus (one panel full screen with its own navigation). | `openStoryboard` / `renderStoryboardPage` / `closeStoryboard`, `openSingleView` / `singleNav` / `syncFocusControls` / `initFocusSync` |
| **Escaping** | 40 `innerHTML` writes, 21 of which sanitise user text through `escapeHtml`; the rest inject app-generated markup. | `escapeHtml`, `appendInlineMarkdown` |
| **Keyboard** | Esc closes overlays / clears the selection; arrows navigate Focus; Enter in the action box generates; Shift+Enter newlines; typing keys are swallowed while a dialog is open. | the global keydown listeners, `singleKeyHandler`, `jsonEditorOverlayKey` |
| **Clipboard text** | One helper copies text (prompt, keywords) with a fallback for non-secure contexts. | `copyText`, `flashCopied` |
| **Errors** | Generation failures land on the panel as a message; a rejected page load surfaces through the platform dialog; the engine's watchdog is always settled so aborted runs cannot raise unhandled rejections. | `renderPanelSlot` catch, `withTimeout`, `GENERATION_TIMEOUT_MS` |

---

## 21. Invariants — the contract a refactor must not break

These are the rules that today hold only because the code is careful. They are the acceptance criteria
for any restructuring, and each one deserves a test.

1. **Panel identity is positional.** Any operation that changes a page's panel sequence must renumber,
   carry every panel's data, and remap the in-memory images.
2. **24 panels per page, overflow cascades.** Adding or duplicating never fails; the overflow moves to
   the following page and may cascade, creating pages as needed.
3. **Basic Description semantics.** Seeded once on selection → frozen on edit → replaceable only by
   refresh; library edits never retroactively change a panel; the prompt uses the Basic Description, not
   the library text.
4. **Prompt composition order and single-inclusion.** Each description appears exactly once, in the
   documented order; the location counts as content.
5. **Override invalidation.** A prompt override survives until one of its inputs changes, then is
   discarded (never merged).
6. **Seed arithmetic and pinning.** The documented formula holds; a panel without a seed pins one on
   first render; `-1` never reaches the service as a literal "random" value.
7. **Protected slots are read-only.** No generation path, no copy, no replay, no clear-all-adjacent
   action may write a 🔒 slot.
8. **Images are session-only; protection is not.** Reload loses pixels, keeps flags and settings.
9. **Blank panels are skipped, not failed**, and every run reports generated / skipped / protected /
   failed.
10. **Aborts are clean.** Pause, stop and tab-backgrounding settle the watchdog and cannot raise an
    unhandled rejection or leave a panel stuck in a "generating" state.
11. **Selection is ephemeral** and never enters the project, the JSON document or an export.
12. **The DOM is never a source of truth after a refactor** — but until it is, it *is* the write-ahead
    log, so any new code must either go through `schedulePanelSave()` or explicitly not be persisted.
13. **Every destructive action confirms, and the confirmation precedes the effect.** Resetting,
    importing, deleting a panel/page/library object, clearing images, and deleting a library object all
    ask; a batch asks once, up front, including any reflow consequence.
14. **Old saved projects keep working.** The migration ladder runs on boot *and* on import, and every
    legacy shape still loads.
15. **Export/import round-trips.** Settings JSON and zip (with images) restore a project to an
    equivalent state, including protection flags.
16. **The manual may lag; the changelog may not.** Only the current release heading is embedded, and it
    matches the first entry of the repo's changelog.
17. **Overlays are direct children of the output container** (else they are invisible while working).
18. **No auto-reload, no watchdog timers, no network calls except the image service and the user's own
    GitHub repo.**

---

## 22. Capability ledger

One line per user-visible capability, with the subsystem that owns it today. This is the index for
"can the app still do X?" after a refactor.

| Capability | Owner |
|---|---|
| Name / create / reset / export / import a project | §4, §16 |
| Add / name / reorder / delete pages | §5 |
| Panels per page (1–24, presets + custom) | §5 |
| Page seed, page summary | §5, §10 |
| Add / duplicate / delete / move panels; reorder a block; reflow overflow | §6 |
| Panel title (display-only) | §7 |
| 3 character lines + 1 location + 1 action per panel | §7 |
| Built-in + library characters/locations | §7, §8 |
| Basic Description (seed / freeze / refresh, single and batch) | §7 |
| Extra description per line | §7 |
| Copy-forward from an earlier panel (⇤), across pages | §7 |
| Create a library object from inside a panel | §8 |
| Library: CRUD, custom types, reference counts, import from a project file | §8 |
| Art styles (12) and palettes (9) as presets | §9 |
| Global positive/negative keywords, live keyword view + copy | §9 |
| NSFW flag | §9 |
| Global image size, per-panel size override, custom size | §9 |
| Global guidance (prompt obedience) | §9 |
| Per-panel style / image-count overrides; bulk apply image count | §9 |
| Seeds: page, panel, per-image, same-seed, clear, copy-previous, placeholders | §10 |
| Prompt view / copy / per-panel override | §11 |
| Generate: slot, panel, list, range, to-here, from-here, whole page | §12 |
| Pause / resume / stop with run-end memory | §12 |
| Progress + final tally (generated/skipped/protected/failed) | §12 |
| Per-slot images (1–4), representative ⭐, protection 🔒 | §13 |
| Clear one image / a panel's images / a batch | §13 |
| Open / save one image; open/save all as zip | §13 |
| Copy an image onto other slots or another panel | §13 |
| Lazy image hydration for long pages | §13 |
| Prompt history with per-image thumbnails, replay, copy | §14 |
| Multi-panel selection + 9 batch operations | §15 |
| Copy / cut / paste whole panels with their images | §15 |
| Export JSON / export zip / import both / recent files / file-handle save | §16 |
| GitHub backup (settings, test, push, timestamp) | §16 |
| Analysis matrix (library × panels, editable; globals bar) | §17 |
| Whole-project JSON editor (validate, find/replace, undo) | §18 |
| Storyboard view, Focus view | §20 |
| Layout modes, menu visibility, panels hide/show + password | §20 |
| Theme (system/light/dark) + accent colour | §20 |
| User manual, About/changelog | §19 |
| Keyword/preset UI, status line, dialogs, toasts | §9, §20 |

---

## 23. Known dead or legacy surface

Present in the code or the browser, but no longer part of the product. A refactor can delete these
outright; a *migration* must still tolerate the stored data.

| Item | Status |
|---|---|
| `comicGen.charLibrary` / `locLibrary` / `actLibrary` | Read and migrated into `libObjects`, then deleted. Keep the migration, delete the code paths after a grace period. |
| `comicGen.undoProject` | The storage key has **no code at all** (the feature was removed 2026.09.24.5). Pure leftover. |
| `comicGen.watchdogReloads` | A sessionStorage counter from the removed auto-reload watchdog; only *cleared*. |
| `chars[].persist`, `locPersist`, `actPersist` | Removed 2026-08-16; old saves may still carry them and code ignores them. |
| `panelEntry.extras` | A removed "panel objects" system; the migration `migratePanelExtras` still folds it into chars/loc/action. Keep the migration; the schema field can go after a grace period. |
| `.pl-libdesc`, `syncState` chains, `carryNext` | Removed features; do not look for them. |
| The per-panel header 🔄 Generate button | An intentional duplicate of the action row's generate button. Not dead — but a redundancy worth collapsing in a redesign. |
| The `#choiceBtns` dialog's stale buttons | The dialog's buttons stay in the DOM when hidden, so any test that reads them after an action that did *not* open a dialog reads the previous dialog. A refactor should clear them. |

---

## 24. Facts the P0 harness measured (2026-09-26)

Verified against the 2026.09.26.4 build by `devtests/` — not read off the code, asserted at runtime.

**The settings export is a wrapper.** `exportSettings()` writes what `buildExportData(false)` returns:
`{version, exportedAt, settings, preset, libObjects, layoutMode, menuVisible, panelsVisible, activeMenu,`
`menuFullscreen, genAlwaysVisible, hdrAllViews}`. `settings` is the project (`version, projectName,`
`imageSizeSel, imageSizeW, imageSizeH, guidanceScale, imgCountDefault, previewDelay, previewOn, globalPos,`
`globalNeg, nsfw, theme, currentPage, pages`). The **JSON editor edits this same wrapper** — `jsonFieldClass`
makes the open flags, `preset`'s two fields, `libObjects[].type/name/desc` and every `settings` field except
`version` / `currentPage` / `pages` / `theme` editable, and everything else locked. A page is
`{name, summary, panelCountSel, panelCountCustom, seed, 1…24}`; a panel is
`{chars[3]{sel,base,extra}, title, protectSlots[4], loc, locBase, locExtra, action, seed, imgCount, style,`
`sizeSel, sizeW, sizeH, sameSeed, promptOverride, promptHistory}` — so all 24 slots exist on every page, which
is why a page showing 3 panels can still carry content in slots 4–24 (fixture `full-page.json` pins this).

**`panelCountSel` has a closed domain:** `1 | 4 | 6 | 12 | 24 | custom`. Any other value (a hand-edited
`"3"`) fails to select in the `#panelCount` control and the page silently keeps its previous count — the app's
own writes always use `custom` + `panelCountCustom`. P2's `normalise()` should fold it.

**Confirmations are split.** Single-panel `deletePanel` / the single-page reset ask with a native `confirm()`;
batch operations and library deletion use `#choiceOverlay` (`showChoiceDialog`, resolved by
`choiceDialogPick(value)`). A test must handle both, and the dialog's buttons stay in the DOM when hidden
(§23).

**The image service contract** is `root.generateImage({prompt, negativePrompt, resolution, guidanceScale,`
`seed})` → `{dataUrl}`, awaited through `withTimeout(...)`; `seed` is omitted when the run wants the service to
choose, and per-image seeds are `seed + (k − 1)` unless the same-seed flag is on. Replacing
`root.generateImage` with a stub is enough to drive the whole engine.

**The generation DOM markers** a test must assert on: `#imgbox-panel-i-k` gains `generating` / `rep` /
`protected` / `cleared` / `failed` / `paused` / `skipped`, the chips inside `#slotbtns-panel-i-k` gain/lose
`disabled`, and **`showPanelImage` attaches the `src` asynchronously** — poll for it, do not read it in the
same tick as the run. `makeRepresentative(i, k)` swaps the images (and their protection) so the chosen image
becomes slot 1. `clearPanelImageSlot` also clears that slot's protection.

**`#output-container` is the parent of every overlay** (`singleOverlay`, `storyboardOverlay`, `manualOverlay`,
`passwordOverlay`, `menuOverlay`, `analysisOverlay`, `libImportOverlay`, `importConfirmOverlay`,
`newProjectOverlay`, `choiceOverlay`, `jsonEditorOverlay`, `ghBackupOverlay`).

**The background gate** (2026.09.26.4): `visibilitychange` returns immediately when the tab becomes visible,
and returns immediately again while `comicGen.bgGenerate` is on (`!== '0'`, absent = on). With it off, the
handler sets `pausedByVisibility`, fires the run signal, calls `pending.stop()` on every in-flight generation
and marks those boxes `paused`.

---

*End of map. Companion documents: `REFACTOR-ROADMAP.md`, `UI-IDEAS.md`.*
