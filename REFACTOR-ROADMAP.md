# REFACTOR ROADMAP — *Yet Another Comic Book Page Generator*

**How the code is put together today, where it should end up, and the order to get there without ever
breaking the product.**

Written 2026-09-26 against the build stamped **2026.09.26.2**. Companion documents:
`FUNCTION-MAP.md` (what the app does, as capabilities — this is the *behaviour contract*) and
`UI-IDEAS.md` (interface proposals that should be built only after the structure is sound).

---

## 0. The short version

The app is not badly written — it is **densely grown**. Five weeks of "I need this function right now"
produced ~100 releases and one 10,194-line file in which every feature works, but every feature is also
welded to the DOM, to global names and to a handful of large functions. The refactor is therefore not a
rewrite; it is a **series of extractions**, each one shippable on its own, each one ending with a
regression check against the behaviour contract, and each one leaving the app working exactly as it
does today.

Six phases, in order of *risk* (lowest first) — not in order of excitement:

| Phase | What it does | Risk | Pays back |
|---|---|---|---|
| **P0** | Freeze the behaviour contract; build the regression harness + fixtures | none (no production code) | every later phase becomes verifiable |
| **P1** | Extract the **pure logic** (prompt, seeds, keywords, ids, zip, JSON text) into modules | very low | the first real unit tests; ~1,500 lines out of the monolith |
| **P2** | Introduce a **state layer** and make save/restore read from it | medium | kills "the DOM is the database" |
| **P3** | Turn mutations into **named commands** (add/duplicate/delete/move/reflow/batch) | medium-high | fixes the structural bug class; the analysis matrix becomes a view |
| **P4** | Extract **services** (images, history, transfer, recent, GitHub) | medium | the in-memory/positional image store becomes keyed and remappable |
| **P5** | Extract the **UI layer**; delete inline handlers and the 199 `window` exports | high (but purely mechanical once P2–P4 land) | the CSS/markup stops being the API |
| **P6** | **Redesign** the interface on the clean core (`UI-IDEAS.md`) | product risk, not technical | the reason all of the above is worth doing |

Stopping after P1 or P2 is still a win. Stopping in the middle of P3 is the only genuinely bad outcome,
so P3 is deliberately the phase with the most pre-work and the smallest per-step scope.

---

## 1. What is actually there — measured, not felt

Everything below was counted from `index.html` at 2026.09.26.2.

| Measure | Value | Why it matters |
|---|---|---|
| File size / lines | 526 KB / 10,194 lines | one file, no modules, no build step; it is also the entire shipped app |
| Callables | 527 `function` declarations + 16 arrow consts = **543** | the unit of reasoning is still "a function in one scope" |
| Exported on `window` | **199** | ~37% of everything exists purely so an inline `onclick="…"` can reach it |
| Inline handler attributes | **224** | the wiring is markup, not code |
| `document.getElementById` calls | **636** | the DOM *is* the data model (§3 of the function map) |
| `querySelector(All)` calls | 28 | all lookups are by hand-built id strings (`'panel-char-base-' + i + '-' + s`) |
| `addEventListener` calls | 43 | global listeners for Esc, grid input, drag, pointer preview, etc. |
| Element ids | **251 unique** | roughly the size of the app's real "schema" |
| CSS rules / custom properties | ~520 rules / ~74 vars | a real design-token system already exists — worth keeping |
| Largest functions | `buildPanelGrid` 152 L · `resetEverything` 138 L · `renderAnalysis` 101 L · `jsonParse` 89 L · `restorePanelState` 88 L · `movePanelToPage` 88 L · `reflowInsertOnFullPage` 87 L · `generateSinglePanel` 83 L | the working set a reader must hold in their head |
| Releases | ~100 `## ` entries in `CHANGELOG.md`, 2026-08-13 → 2026-09-26 | the growth rate; there has never been a pause for structure |
| Tests | 0 | verification is manual + whatever a session scripts in `page_eval` |

### 1.1 The five structural habits that cause most of the pain

1. **The DOM is the write-ahead log.** `collectPageData()` reads textareas and selects to learn what the
   project is. Consequences: state that is not currently rendered cannot be collected; setting `.value`
   from code silently diverges from the model; tests must inspect the DOM because there is nothing else
   to inspect; and every new feature adds more `getElementById` string-building in two directions.
2. **Position is identity.** A panel is "number 3 on the current page", so every operation carries an
   `i`, every move/duplicate/delete/paste must renumber, and the in-memory image set must be remapped by
   hand (`remapPanelSession`, `remapPanelSessionForDuplicate`, `pageObjectFromEntries`). This is the
   richest source of edge-case bugs in the app.
3. **Markup is the API.** 199 `window` exports and 224 inline handlers mean the public surface *is* the
   HTML. Renaming a function is a markup change; a typo in an id is a silent no-op.
4. **One scope for everything.** 543 callables share one closure. There is no encapsulation to enforce,
   so a helper written for one feature is freely reused by another (good) *and* globals are freely
   mutated from anywhere (the reason `stopRequested`, `pausedByVisibility` and `generateAllRunning` are
   read from deep inside the per-slot renderer).
5. **Duplicated edit logic.** The Analysis matrix (~890 lines) re-implements choosing a character,
   editing a description, and setting style/size/seed for a grid instead of reusing one model. The nine
   batch operations each carry their own dialog text and re-entrancy checks. There are two Generate
   buttons per panel for the same action.

### 1.2 Where the seams already are

Even without modules, the file is organised in loose clusters, and the double blank line that separates
them is effectively the intended module boundary. (Line ranges from the 2026.09.26.2 build.)

```
    1–  700  head + style sheet (including the light/dark variable tables)
  700– 1240  body markup: menu groups, overlays, and the panel-card template
 1240– 1300  shared helpers (option lists, escaping, built-in descriptor maps)
 1300– 1700  library objects: store, CRUD, UI, import-from-file                      → service
 1700– 2583  analysis matrix (~50 functions)                                        → view
 2583– 2898  panel lines: characters/location/action + Basic Description            → view + core
 2898– 3000  image preview + lazy <img> hydration                                   → view
 3092– 3724  panel state: collect / restore / migrate + pages + run signals         → state + core
 3823– 4323  panel grid build, reorder, move, reflow                                → view + state
 4416– 4976  multi-selection, clipboard, batch operations                           → state + view
 4980– 5311  choice dialog + the generate/clear/delete actions                      → view
 5323– 5492  single-panel structural ops (duplicate / add / delete)                 → state
 5494– 5649  prompt building + the prompt override editor                           → core + view
 5659– 5970  prompt history + thumbnail store                                       → service
 5973– 6129  the generation engine (slot → panel → page)                            → service + core
 6126– 6290  seeds + panel header chips                                             → core
 6292– 6650  image size, upscaling, open/save image, zip download                   → service
 6400– 6733  slot flags (protect/cover/copy), image counts, accordions              → state + view
 6739– 6940  view modes: Focus + Storyboard                                         → view
 6960– 7292  export, IndexedDB save handles, Recent list                            → service
 7295– 7609  hand-rolled zip codec + zip export + zip import                        → core
 7614– 7816  import, new project, clear-image helpers                               → state + service
 7818– 7891  whole-page generation                                                  → service
 7895– 7974  menu system (collapse, fullscreen, switch)                             → view
 7956– 8141  user manual overlay + changelog/About fetch                            → view
 8184– 8454  keywords, presets, reset-to-defaults                                   → core + state
 8460– 8518  visibility toggles and preferences                                     → view
 8527– 8644  theme + accent colour system                                           → view
 8652– 8705  panels password dialog                                                 → view
 8707– 8755  header observer + layout mode                                          → view
 8757– 8913  the window export block (the de-facto API)                             → delete in P5
 8914– 9825  project JSON editor (tokenizer, parser, render, find, undo)            → view + core
 9866–10062  GitHub backup dialog                                                   → service
10070–10101  tooltip for panel-object selects                                       → view
```

That is 24 candidate modules hiding in one file — which is why the extraction order below is mostly
"read down this list and lift".

---

## 2. Target architecture

### 2.1 Platform constraints (these shape everything)

- The generator ships `main.pjs`, `index.html` and anything under `src/`. **`src/` files are served and
  can be ES modules**, referenced relatively.
- `main.pjs` loads first, so its top-level names are globals available to the app (and `root.generateImage`
  is the image plugin).
- Body `<script>` tags run **after** the Perchance engine has rendered the template, so the app is always
  a post-render bootstrap.
- **No build step is required** — and adding one is a liability. Plain ES modules under `src/` are the
  right target; a bundler is only worth adding if load time becomes a real complaint (the app already
  downloads ~526 KB of HTML, so splitting into cached modules is a *win*, not a cost).
- Unsaved `src/` files preview through the editor's service worker; a browser without one (some in-app
  browsers) needs the author to Save before the preview works. So: **the app must never hard-depend on a
  module that could fail to load** while a phase is in flight — hence the fallback rule in §3.3.
- `src/` must never contain `.md` docs (`README.md`, `PENDING.md`, `CHANGELOG.md`, `ISSUES.md`,
  `AI-NOTES.md`) — that wedges the platform's save flow. Docs stay in the repo. **`src/` is for shipped
  runtime code only.**

### 2.2 The shape to aim for

```
index.html                 the shell: pointer comment, theme-flash bootstrap, menu/overlay markup,
                           one <script type="module" src="src/app.js">
main.pjs                   unchanged (metadata + the image plugin import)

src/
  app.js                   composition root: builds the store, mounts the views, wires commands
  core/                    PURE — no DOM, no network, no storage. Testable in a Worker.
    schema.js              project/page/panel shapes, defaults, normalise, validate
    migrations.js          the whole migration ladder (boot + import share it)
    prompt.js              prompt assembly (+ override invalidation rule as a pure predicate)
    seeds.js               seed arithmetic, pinning, -1 scrubbing
    keywords.js            presets, effective keywords, NSFW composition
    library-core.js        id/type helpers, reference counting, extraction from a foreign file
    zip.js                 crc32 / raw-deflate inflate / zip write+read
    jsontext.js            the position-aware JSON scanner used by the JSON editor
  state/
    store.js               one mutable state object + subscribe/notify (+ dirty flags)
    selectors.js           derived reads (visible panels, effective settings, can-render…)
    commands.js            EVERY mutation as a named command: addPanel, duplicatePanel, deletePanels,
                           movePanels, setChar, setSeed, setProtect, applyImageCopy, importProject…
  services/                side effects, injectable for tests
    persistence.js         localStorage + debounce; IndexedDB; file handles; the session-only stores
    images.js              per-page image store, keyed by panel id, with remap on structural change
    history.js             prompt history + the thumbnail store and its eviction
    transfer.js            export JSON, export zip, import (json + zip), repopulate images
    recent.js              the Recent list
    github.js              the backup client
    generation.js          runs: slot/panel/list/range/to-here/from-here/page, pause/stop, watchdog
  ui/
    dom.js                 el()/text()/escape helpers; ONE delegated event layer
    status.js              the status line, progress, toasts
    theme.js               theme + accent (keep the existing CSS variables)
    layout.js              layout modes, menu visibility, panels visibility, header observer
    views/
      panels.js            the panel grid + one panel card
      panelLines.js        characters/location/action + Basic Description
      images.js            slots, chips, preview
      prompt.js            the prompt viewer/override
      history.js           prompt history
      pages.js             page navigation/setup
      menu.js              the menu system + preferences
      dialogs.js           one dialog primitive (+ the choice dialog on top)
      focus.js  storyboard.js  analysis.js  library.js  jsonEditor.js  manual.js  githubDialog.js
  styles/
    tokens.css  app.css    the existing sheet split into tokens + rules, no visual change
```

**Rules the target architecture encodes**

- `core/` never touches the DOM. If a function needs an element, it is not core.
- Panels get **stable ids**. Position becomes a *derived ordering*, not an identity. This is the single
  change that removes the largest bug class.
- The store is the only thing persisted. The DOM is rebuilt *from* the store; it is never read *as* the
  store.
- Every user intent is a named **command** (one function, one intent). Views call commands; commands
  mutate the store; the store notifies; views re-render. The Analysis matrix then becomes a second view
  over the same commands instead of 890 lines of parallel logic.
- Side effects live behind service objects with plain interfaces, so a test can substitute them
  (`generation` with a fake image function; `persistence` with an in-memory map).
- UI is wired with **delegation** (`data-action="duplicate-panel" data-panel-id="…"`), so there are no
  inline handlers and no `window` exports. A single documented dev API replaces what tests need.

---

## 3. How to get there

### 3.1 Principles

1. **Never a big-bang rewrite.** Every phase is a series of small, individually shippable steps.
2. **The app is always working.** After every step the author can Save and use the app.
3. **Behaviour is frozen first.** P0 records what "working" means; later phases compare against it.
4. **Extract, don't redesign — until P6.** The CSS, markup, ids and layout stay as they are through
   P1–P5. The redesign is the reward, not the means.
5. **Features keep shipping.** The author's requests do not pause for the refactor. A feature lands on
   whatever layer currently owns that subsystem; once a subsystem is extracted, new work goes into the
   module. (This is the reason for the fallback rule below.)
6. **One release per step**, with the usual changelog entry, manual sync and backup.

### 3.2 The regression harness (P0 — build this before touching anything)

- **`devtests/` in the repo** (never in `src/`): a set of JS files a session copies into the workspace
  and runs with `page_eval` / `execute_js`.
  - `core.test.js` — pure-function tests, runnable in `execute_js` (no DOM at all): prompt assembly for a
    matrix of panel contents, seed arithmetic including page/panel/per-image/same-seed/−1, keyword
    composition for every preset × NSFW, the migration ladder over one fixture per historical shape, zip
    round-trip, and the JSON scanner.
  - `smoke.page.js` — DOM tests run with `page_eval` against the live preview: build a known project,
    then assert the results of every capability in §22 of the function map.
  - `park.js` — the mandated storage park/restore helper (park every key, verify read-back, restore
    byte-for-byte, compare an FNV-1a hash of the whole map before/after a reload).
- **Fixtures** (in the repo, `fixtures/`): the sample `cow-in-field` zip (already there as
  `samples/`), a **multi-page project** at the 24-panel limit with mixed overrides and off-page panels,
  a **legacy v1** project, and a project carrying every legacy key (`persist`, `extras`, `charLibrary`).
  Each fixture gets a one-line "expected" summary so a diff is meaningful.
- **A visual baseline**: screenshots of the panel grid, the JSON editor, the analysis matrix and the
  batch dialogs in both themes at 390 px and 1440 px. `vision` comparisons after each phase.
- **Exit criteria:** the suite passes against the *unmodified* build, and every invariant in
  `FUNCTION-MAP.md` §21 has at least one test or an explicit "manual check" line.

### 3.3 P1 — extract the pure logic *(the highest value per unit of risk)*

Move, in this order, keeping each function's current implementation in `index.html` as a **fallback**:

| Step | Extract to | Notes |
|---|---|---|
| 1 | `core/zip.js` | `crc32`, `inflateRawDeflate`, `unzipEntries`, `buildZip`. Self-contained, no DOM. |
| 2 | `core/keywords.js` | `ART_STYLES`, `COLOR_PALETTES`, `getEffectiveKeywords`, the NSFW composition. |
| 3 | `core/seeds.js` | `getPanelSeed`, `pinPanelSeedForRun`, `scrubMinusOneSeeds`, the per-image offset. |
| 4 | `core/prompt.js` | `buildPanelPrompt` **minus its DOM reads** — first make it take a plain panel object (the DOM-reader becomes a thin adapter in `index.html`). |
| 5 | `core/library-core.js` | id/type parsing (`lib:<type>:<id>`), reference counting, `extractLibraryItems`. |
| 6 | `core/jsontext.js` | the JSON editor's scanner/parser, which is generic text work. |

**The loading pattern for a strangler step** (works in a classic IIFE, degrades safely):

```js
let corePrompt = null;                                   // stays null if the module cannot load
try { corePrompt = await import('./src/core/prompt.js'); } catch (e) { /* keep the inline version */ }
const buildPrompt = corePrompt ? corePrompt.buildPanelPrompt : buildPanelPromptInline;
```

So a module that fails to load (an in-app browser before a Save) simply falls back to the code that is
still in `index.html`. The fallback is deleted one phase later, once the module has survived a real
release.

**Exit criteria:** the P0 core tests run against the *modules*; a "differential" test compares old vs new
output for hundreds of generated inputs and finds zero differences; no user-visible change.

### 3.4 P2 — a real state layer (read-only first)

1. **Panels get ids.** Add an `id` to every panel entry, generated on create/duplicate/import, and
   migrated on load for panels that lack one (`migrations.js`). Store it in the project. *Nothing else
   changes yet* — the DOM still drives everything.
2. **Write `core/schema.js`**: `defaultProject()`, `defaultPage()`, `defaultPanel()`, `normalise(state)`,
   `validate(state)`. The hand-built fresh state inside `resetEverything` becomes `defaultProject()`.
3. **Write `state/store.js`** as a plain object plus `load()` / `toJSON()` / `subscribe()`. Its loader is
   a *pure* serializer over a snapshot of the DOM (an object of the values `collectPageData` reads
   today), so it can be tested without a browser.
4. **Differential test:** for the fixture corpus, `store.toJSON()` must equal today's
   `collectPanelState()` output, key for key. Until that passes, nothing reads the store.
5. **Switch the save path** to write from the store; keep `restorePanelState()` writing the DOM. Now the
   DOM is a *rendering* of the store on load and a *proxy for it* on input — the last step of P3 removes
   the proxy.

**Exit criteria:** boot → store → DOM → store → save is byte-identical to the old path for every fixture;
reload a project and diff the JSON view before/after; zero behaviour change.

### 3.5 P3 — mutations become commands *(the phase that changes the architecture)*

Work through the command list in dependency order, smallest first, one command per step, each step a
release:

1. **Leaf setters:** `setChar`, `setCharBase`/`refreshLine`, `setLoc`, `setAction`, `setTitle`,
   `setImgCount`, `setStyle`, `setSize`, `setPanelSeed`, `setSameSeed`, `setProtect`, `setRepresentative`,
   `setPromptOverride`. Each one is a pure store mutation; the DOM is re-rendered from the store for the
   affected panel only.
2. **Structural commands:** `addPanel`, `duplicatePanel`, `deletePanel`, `movePanel`, `reflow`,
   `addPage`, `deletePage`, `renumberPages`. Here the id-based model pays for itself: `movePanel(id,
   targetPage, position)` replaces `movePanelToPage` + `resequencePanel` + `remapPanelSession` +
   `pageObjectFromEntries`.
3. **Batch commands:** the nine selection operations, expressed as *maps over ids* — `generateMany(ids)`,
   `duplicateMany(ids)`, `addMany(count, afterId)`, `moveMany(ids, position)`, `clearMany(ids)`,
   `deleteMany(ids)` — plus the clipboard as `{panels, images, cut}`. One dialog primitive, one
   confirmation rule, one place for the "anchor" semantics.
4. **Delete the DOM-as-state read path** (`collectPageData` reading textareas) and the manual image
   remapping.
5. **Re-point the Analysis matrix at the same commands** — this is where that 890-line view collapses.

**Exit criteria:** the smoke suite passes; specifically: a 24-panel page with duplicates/adds/moves/
pastes reflows exactly as before (fixture diff), images follow their panels through every operation, and
the JSON view of the project is unchanged after the same user actions.

### 3.6 P4 — services

| Service | What moves | Notable change |
|---|---|---|
| `images.js` | `panelImages`/`pageSession`, slot flags, copy, protect, cover, lazy hydration | keyed by panel **id**; remapping disappears; the IntersectionObserver stays as an implementation detail |
| `history.js` | prompt history entries + the thumbnail store | thumbnail eviction becomes a single owner with an explicit budget |
| `transfer.js` | export JSON/zip, import, `applyImportedSettings`, image repopulation | one code path for boot and import migrations |
| `recent.js` | IndexedDB handles + snapshots | unchanged behaviour behind an interface |
| `github.js` | settings, test, push | unchanged, plus a clear "what will be pushed" description |
| `generation.js` | runs, pause/stop, watchdog, tallies | a run object with an explicit state machine replaces three global booleans; the seeds/prompt come from `core/` |

**Exit criteria:** export → wipe → import round-trips a `fixtures/` project to an identical JSON view and
an identical image set; pause/stop/background the tab during a run and confirm no stuck panels and no
unhandled rejections; the thumbnail budget still prunes.

### 3.7 P5 — the UI layer

Mechanical, and only cheap *because* P2–P4 exist:

1. Introduce the delegated event layer: `data-action` + `data-id` attributes, one listener per event
   type at the shell. Convert the 224 inline handlers in waves (panel card → menus → dialogs → views).
2. Split the markup into view modules that build DOM nodes (or templates) instead of string
   concatenation; unify escaping in one helper.
3. Delete the `window` export block, replacing it with a single documented `window.__app` dev surface for
   tests (and keep only that).
4. Keep the CSS and the visual result identical; move rules into `styles/tokens.css` + `styles/app.css`
   and delete rules for anything that no longer exists.

**Exit criteria:** zero inline handlers, one export, the same screenshots as the P0 baselines, and a
"click everything" pass with no console errors.

### 3.8 P6 — the redesign

Only now, with `UI-IDEAS.md` as the brief. The core is stable, so this becomes a design project instead
of an archaeology one: the panel becomes an inspector with visible structure, generation becomes a mode
with a queue and a filmstrip, the menu pile-up collapses into a command palette plus contextual actions,
and the destructive-action system becomes consistent because there is exactly one dialog primitive and
one command list to attach it to.

---

## 4. Testing strategy (what replaces "no tests")

| Layer | How it is tested | Tool |
|---|---|---|
| `core/*` (pure) | assert input → output, hundreds of cases incl. fuzzed panels | `execute_js` (a Worker, no DOM — fast, cannot freeze the page) |
| `state/*` | differential tests against recorded legacy outputs; invariant property tests (ids unique, page keys contiguous, 24-panel cap, ordering stable under random op sequences) | `execute_js` |
| `services/*` | injected fakes: a fake image function, an in-memory persistence map, a fake GitHub client | `execute_js` + `page_eval` |
| `ui/*` | scripted interaction: build a fixture, perform a sequence of delegated clicks, assert the store + the DOM + a screenshot | `page_eval` + `vision` |
| Whole app | the smoke suite from P0, run at the end of every phase | `page_eval` |
| Visual | the P0 baselines, compared with `vision` in both themes at 390 px / 1440 px | `vision` |

**Two hard rules for tests** (both learned the hard way, both in `ISSUES.md`):

1. **Never write to live storage without parking it first.** The editor preview shares the generator's
   real origin, so `comicGen.*` in the preview *is* the author's own project. Park every key in a second
   key and in a workspace file, verify the read-back, stub `confirm`/`prompt`/`alert`, test, restore
   byte-for-byte, delete any key the test created, then compare a hash of the whole storage map across a
   reload.
2. **Never trust "the dialog didn't open" without checking the overlay's `hidden` state** — a closed
   dialog leaves its buttons in the DOM.

---

## 5. Risk register

| Risk | Why it bites | Mitigation |
|---|---|---|
| Destroying the author's live project during a test | the preview shares their origin; a stray reset/import is destructive | the park/restore protocol, the throwaway `cow-in-field` project, stubbed `confirm`, fixture-based tests in Workers where possible |
| Breaking saved projects | real projects exist in every historical shape | keep the migration ladder in `core/migrations.js`, tested against one fixture per shape, on boot *and* import |
| A module that fails to load kills the app | unsaved `src/` files need a service worker in some in-app browsers | the fallback pattern in §3.3: the in-file implementation stays until the module has survived a release |
| Behaviour drift during extraction | extraction is copy-work, and copies rot | differential tests (old vs new) before deleting the old path |
| Scope creep | every phase touches something tempting next to it | one command / one module per release; the phase exit criteria are the definition of done |
| The refactor blocks feature requests | the author works feature-by-feature | features keep shipping on the current layer; a subsystem's new work lands in its new module (§3.1.5) |
| P3 stalls halfway | the DOM-read path is removed before the commands are complete | remove it only at the *end* of P3, and only after the differential suite covers every command |
| Performance regressions | 24 panels × 4 slots of data URLs, plus thumbnails | keep lazy image hydration, keep the thumbnail budget, measure FPS/scroll after P4 and P5 |
| Losing the "it just works offline" property | a module split tempts you into a CDN or a build | nothing new from the network: modules are same-origin `src/` files; no bundler unless load time demands it |
| Doc creep into `src/` | the platform's save flow wedges on `.md` files there | docs live in the repo; `src/` holds runtime code only |

---

## 6. Definition of done (per phase)

A phase is done when all of these are true:

1. The app works exactly as before for every capability in `FUNCTION-MAP.md` §22.
2. Every invariant in `FUNCTION-MAP.md` §21 still holds, and any new invariant discovered is written down.
3. The differential and smoke suites pass; the visual baselines are unchanged (P1–P5) or deliberately
   changed with new baselines (P6).
4. The storage map is byte-identical after a park/restore test cycle, with no stray keys.
5. `CHANGELOG.md` has an entry; the manual reflects any user-visible change; `AI-NOTES.md` describes the
   new module and where the old code went; `DEV-NOTES.md` records the gotchas found.
6. The repo is backed up (`ghPush`) and the author has been told to Save.
7. The next phase's first step is written into `PENDING.md` as a queued item, so a future session can
   pick it up without re-deriving the plan.

---

*End of roadmap. Read `FUNCTION-MAP.md` first if you are new to the code; read `UI-IDEAS.md` before
starting P6.*
