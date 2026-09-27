# REFACTOR NOTES — *Yet Another Comic Book Page Generator*

**The running log of the refactor: what moved where, what got deleted, what bit us.**
Started 2026-09-26, at the author's request (R-08 question 8d). Companion documents, all in this repo:
`FUNCTION-MAP.md` (what the app does, no interface), `REFACTOR-ROADMAP.md` (the measured code, the target
architecture, the six phases), `UI-IDEAS.md` (the interface proposals), `questions/REFACTOR-ROUND-1.md` and
`tickets/R-01…R-08*.md` (the author's answers — **the decisions of record**).

Read this file first when you (AI or human) pick the refactor up mid-flight: it says what phase we are in,
what has already been extracted, what was deliberately rejected and why, and what is still waiting on the
author. `DEV-NOTES.md` remains the log for *feature* releases; this file is for *structural* work.

---

## 1. The author's answers, digested (2026-09-26, round 1)

| Ticket | Question | Answer | Consequence |
|---|---|---|---|
| R-01 1a | How far should the refactor go? | **P0 + P1 first** (harness, then pure logic), zero user-visible change | The first target is the harness and then `core/*` modules, with the old code left in place as a fallback |
| R-01 1b | Do new features pause during a phase? | **No** — features keep shipping | Feature releases continue on `index.html` while the refactor happens around them (2026.09.26.4 is the first) |
| R-01 1c | What is the app to you, long-term? | 1) one generator to keep polishing, 2) something others can use, 3) a template to fork | Optimise for a single well-polished app, but keep the code readable and self-contained enough to fork |
| R-02 2a | Risk per release? | **None — behave identically** | No release may change behaviour; every phase ships behind the differential tests |
| R-02 2b | Extract-with-fallback? | **Yes**, delete the fallback one release later | The strangler pattern in the roadmap is the agreed mechanism |
| R-02 2c | How is "still works" proven? | Smoke suite **and** screenshot comparison, **and** the author clicks through | All three; the author volunteered to check intermediate stages themselves |
| R-02 2d | Anything sacred? | Nothing has broken that way; they keep their own backups | No process change needed |
| R-03 3a | Split into `src/` modules? | **Yes** — "This is really what I have in mind for the refactor." | P5 is not optional; the module tree in the roadmap is the target |
| R-03 3b | May `src/` hold the app's modules? Where do docs go? | "I would rather you decide" | **Decided:** `src/` holds only what the app serves (the manual, the forms, and the module tree). Docs stay at the repo root — that is where every existing cross-link points, and moving ten documents to buy a folder is churn for nothing. If the root ever gets crowded, the reference set (FUNCTION-MAP / REFACTOR-ROADMAP / UI-IDEAS / REFACTOR-NOTES) moves to `docs/` in one commit. |
| R-03 3c | Buildless? | "Decide for me once you have measured the load time" | **Measured:** the page is ~165 KB over the wire, `DOMContentLoaded` ≈ 238 ms, and the panel grid rebuild is 45 ms for 24 panels in the editor preview. Splitting into ~20–30 plain ES modules adds parallel same-origin requests, not sequential cost, and shortens the critical path (the browser parses modules while they arrive). **Decision: buildless plain ES modules.** No bundler, no build step, nothing that has to be remembered before a Save. If module count ever hurts, a bundle becomes a 10-minute esbuild step and nothing else changes. |
| R-03 3d | What environment? | Phone most often, desktop for screen space; must be usable on mobile; dialogs/panels should reflow with orientation | Mobile-first, desktop-second; overlays must reflow rather than scroll sideways |
| R-04 4a/4b | Must every old backup load? | Only recent releases; they'd like a deprecation **detector** and an offline upgrader | Add a format/app-version stamp to exports; on import, refuse-and-explain when the file predates the supported ladder, pointing at a standalone upgrader page in this repo (built once P1 extracts the migration code) |
| R-04 4c | Where should the library live? | "Talk me through the trade-off first" — but "I'd really like each project to keep its own library" | See §3 — recommendation recorded, **awaiting the author's choice** before any code |
| R-04 4d | Panels get real ids? | "Do it — invisible is fine if it makes the app sturdier" | Panel identity lands with the state layer (P2); it is also what makes undo and cross-page dragging possible |
| R-05 5a/5b | Keep the 24-panel cap and the overflow rule? | Drop the cap; let a page grow and scroll; pagination is the author's decision; they only ever used pages to get past 24 | Pages become optional containers rather than an overflow mechanism (P2/P6) |
| R-05 5c | Per-slot image history? | "Decide based on what it does to performance" | **Rejected as a rolling history** — a 512×512 render measures ≈ 121 KB, so "last 3 per slot" on a full page ≈ 35 MB, the memory-pressure class that killed a mobile tab once. Instead: a **⤓ Keep** that pins an image *with the prompt text and seed that produced it* (§3) |
| R-05 5d | Which page conveniences? | Filmstrip with thumbnails, drag pages to reorder, per-page style override — **and dragging panels between pages** | All queued (P6), with panel dragging dependent on 4d's ids |
| R-06 6a–6c | One inspector? Modes? Advanced switch? | **Yes to all three** | The P6 target is Compose / Render / Review over one inspector; expert controls behind **Advanced**; anything already set stays visible |
| R-06 6d | Where do you use it? | Both equally: **phone first, desktop second** | Layout work is phone-first |
| R-07 7a | Which wins do you want? | 10 of the 12 ticked (run panel, variants as a first-class action, prompt inspector, page filmstrip, library picker, undo everywhere, one destructive-dialog style, first-run sample + checklist, accessibility pass, one notification area) | All queued; nothing promised for a specific date |
| R-07 7b | Which matters most? | **Run panel → library picker → prompt inspector → consistent destructive dialogs → one notification area** | The P6 order |
| R-07 7c | What must stay recognisable? | The amber/dark look + the colour presets; the full-screen menu on a phone | **Hard constraints** for P6 — treat as requirements, not preferences |
| R-08 8a | Biggest annoyance? | **Generation stops when the tab loses focus** | Shipped already: **2026.09.26.4** (§4) |
| R-08 8b | Wanted but never asked for? | Per-panel **character dialogue**, deliberately *not* rendered into the image | Queued as a domain feature; needs a design (where it lives, how it appears in exports/JSON) |
| R-08 8c/8e | Reporting cadence? | One short message per release + a longer summary per phase; they use the app most days and can answer question batches quickly | This file is the per-phase summary; the question form stays the way questions get asked |
| R-08 8d | A refactor log? | **Yes** | This file |

---

## 1b. Round 2 answered — the P2 decisions (2026-09-26)

Sent in chat from the round-2 form (`yacbpg-round2-2026-09-26`, 2026-09-26 10:10). Verbatim in
`questions/REFACTOR-ROUND-2-ANSWERS.md`. `P2-01` 1a and 1b came back blank and were **taken as the recommended
defaults** at the author's word ("For P2-01, defaults.", 2026-09-26) — so **nothing is owed by the author**.

- **BUG-01 — CLOSED as "no longer an issue" (the author's own call, 2026-09-27).** They have not seen it since
  2026-09-22; nothing misbehaves and no console line was ever available. The recon stands: the one surviving stack
  frame is the ENGINE's own `interactionPointerMoveHandler` bot-detection helper, so there was nothing in the
  generator to fix. Nothing was wanted in the generator for it; the platform report (`923578bb`) stays on file.
- **P2-01** — a Recent entry remembers *nothing* beyond the project data (1c); switching away saves the current
  project to Recent first and never prompts (1a, default); the app reopens the project that was open last time
  (1b, default).
- **P2-02** — the library UI gets **two sections, "This project" then "My catalogue"** (2a); importing a file
  **offers** to copy its objects in, their choice each time (2b); deleting a referenced object: they asked what it
  does today, and want **warn → clear the references / leave them as plain text / cancel** (2c); and a new request
  (2d): **hooks for up to three reference images per library object** for a future image-to-image path (queued as
  its own feature entry).
- **P2-03** — **two export buttons**, full and "compact (no kept images)" (3a); the file is the **only** home for
  kept images — the browser keeps no copy (3b); warn at about **40 MB** (3c).
- **P2-04** — the automatic ladder covers **v2 onward**, older files go to the upgrader (4a); the upgrader converts
  and hands back a file to download (4b); the JSON editor stays an editor, normalise + validate on apply (4c).
- **P2-05** — autosave: **panel data only, user-configurable** (5a); undo: the last **50** changes, surviving a
  reload (5b); the GitHub backup becomes **one file per project in `projects/`** (5c); no side-features while P2 is
  in flight (5d).
- **P2-06** — **one release per P2 step** (6a); each release note leads with plain language and ends with the
  suite / differential / park-hash numbers (6b); nothing they are nervous about in a state layer (6c).

## 2. What is in progress

- **P0 — the regression harness.** **Complete, 2026-09-26.** `devtests/park.js` (park / check / restore of the
  whole localStorage map with an FNV-1a hash, so "nothing was written" is provable); `devtests/smoke.page.js` (77
  checks over §22 of the function map — 73 pass, 4 explicit manual lines); `devtests/gen.page.js` (18 checks of the
  generation engine against a stubbed service, plus 1 manual); `devtests/fixtures.page.js` (16 checks importing
  every `fixtures/` file through the real import path); `devtests/core.test.js` (18 DOM-free checks — since 2026.09.26.9 it
  **imports `src/core/*.js`** and only the DOM-bound names are still extracted out of `index.html` and run against a fake
  `document`); `fixtures/` (full page,
  legacy v1, every-legacy-key) and `devtests/shots/` (14 screenshots of the fixture project). The runners park,
  run, restore and *verify the restore byte-for-byte*, and dump the park to the workspace so a freeze cannot lose
  the author's project.
  **Exit criteria:** the suite passes against the *unmodified* build, and every invariant in `FUNCTION-MAP.md`
  §21 has a test or an explicit "manual check" line.
- **P1 — pure logic — COMPLETE as of 2026.09.26.8.** All six modules are extracted: `zip`, `jsontext`,
  `keywords` and `seeds` (2026.09.26.5), then `prompt` and `library-core` (2026.09.26.8). Each lives in
  `src/core/` with its in-file copy kept as the fallback. The last two split their functions: `composePanelPrompt`
  is pure (`buildPanelPrompt` is now a three-line adapter over `collectPanelPromptInput`), and the library
  functions are pure with the `loadLibraryObjects()` reads left in their callers (`resolveDesc`, `plLineDescText`,
  `countLibReferences`). Loading is one loader — `coreLoad(name, path, apply)` at the top of `index.html` — with
  the hard rule that a replaced binding must be a `function` declaration or a `let` (a `const` throws, and the
  throw is swallowed by the loader's try/catch, which would skip the rest of that block). **Exit criteria met:**
  `devtests/diff-core.js` is **31 checks / 0 differences** over ~4,500 generated cases across the six modules
  (`unspecced: []`, `missing: []`), the suites are green (smoke 73/0/4, generation 18/0, fixtures 16/0, core
  14/0), 0 perchance errors, the author's map restores byte-identical after every runner, and an A/B of the
  screenshots against the previous build came back identical. **Fallback deletion — COMPLETE:** **done 2026.09.26.9** for `zip`,
  `jsontext`, `keywords` and `seeds`, and **done 2026.09.26.14** for `prompt` and `library-core` (the declarations stay, the boot
  waits on `coreReady`, and a module that cannot load gets a bar at the top of the page). The second pair slipped four releases
  (`.10` P2 step 1, `.11` the import-menu fix, `.12` the colour palette, `.13` the library rename) because features and bug fixes
  keep shipping in parallel. No module has an in-file copy any more, so `devtests/diff-core.js` is guards-only.
- **P2 — a real state layer. Step 1 DONE (2026.09.26.10).** Panel identity and `core/schema.js` shipped: every panel
  now carries a stable `id` (minted on create / duplicate / paste / import and repaired and deduped by `normalise`),
  `src/core/schema.js` holds the defaults (`defaultProject` / `defaultPage` / `defaultPanel`) plus `newPanelId`,
  `normalise` and `validate` (§3.4 step 1 and step 2), and the project JSON editor shows the `id` as a **locked**
  field. `normalise` is conservative by rule — **it never deletes a key it does not understand** — and idempotent;
  the one behaviour change is the documented `panelCountSel` fold. **Step 2b's library half shipped as 2026.09.26.15**
  (`settings.library` is the project's own library and `comicGen.libObjects` is now the browser-wide *catalogue* it
  copies from — see the running log and `AI-NOTES.md` §28) and **the `kept`-images half shipped as 2026.09.26.16**
  (a `kept` array on the project, no UI — `AI-NOTES.md` §29). **Step 2b is COMPLETE**, and **step 3 — the store — shipped as
  2026.09.26.17** (`src/state/store.js`: `createStore()` / `serializeProject()` / `ensurePages()`, the DOM half being
  `index.html`'s `collectDomSnapshot()`; **nothing reads it yet, deliberately** — §3.4 step 4 is the differential test that
  `store.toJSON()` equals `collectPanelState()` key for key, and step 5 the release that moves the save path onto it —
  `AI-NOTES.md` §30). **Step 4 — the differential test — went GREEN as 2026.09.26.18** (`devtests/state-diff.page.js`,
  13 checks over the fixture corpus, every panel field, every panel-count domain, a non-current page, edits surviving a
  page switch, an unknown stored key and a factory reset — all identical; `AI-NOTES.md` §31). **Step 5 — the save path
  writes from the store — shipped as 2026.09.26.19**: `savePanelState()` is
  `savePanelStateShape(storeJsonNow() || collectPanelState())`, `restorePanelState()` still writes the DOM, and
  `resetEverything()`'s hand-built fresh state became `defaultProject()` / `defaultPanel()` (§3.4 step 2's leftover). The
  differential grew to **16 checks** (`SD14`/`SD15`: the saved bytes are exactly the store's JSON, on the live project and
  on the 3-page fixture; `SD16`: a reset matches the schema field for field) — `AI-NOTES.md` §32. **§3.4 is COMPLETE.**
  What is left is the inline copy of `ensurePages`/`defaultPageData` and, in P3, the removal of the DOM proxy.
- **Fixed outside a refactor step (2026.09.26.11):** the import-path menu toggle — `applyImportedSettings` and
  `jsonApplyDoc` called `switchMenu`, which *toggles*, so a restored file could close the menu it said to open (and
  its `menuVisible` could be over-ridden). They now call a real setter, `applyMenu(name)`; the buttons keep the
  toggle, and smoke `G9:50` was tightened to a full export → import → export comparison to pin it (§5).
- **In parallel:** feature releases keep shipping (R-01 1b). 2026.09.26.4 is the first of the refactor era.

### Running log
- **2026-09-27 — P2 step 5 released as 2026.09.26.19: the save path writes from the store.** `savePanelState()` is now `savePanelStateShape(storeJsonNow() || collectPanelState())` — the store's project object through the same writer, with the pre-`.19` expression as the fallback if `src/state/store.js` did not load — and `resetEverything()`'s hand-built fresh state (~40 lines of literals) became `defaultProject()` / `defaultPanel()`, which is §3.4 step 2's leftover. Deliberately unchanged: the 250 ms debounce, the `panelStateRestored` guard, `restorePanelState()` (still the DOM), and the structural call sites (`switchPage`, `addPage`, `deletePage`, `jsonApplyDoc`, the export/import paths) which write a `collectPanelState()` they derive — those are mutations and P3's named commands replace them. The differential gained `SD14`–`SD16` (the bytes in storage are exactly `JSON.stringify(window.__storeJson())` on the live project and on the 3-page/24-panel fixture; a factory reset matches `defaultProject()`/`defaultPanel()` field for field) → **16/16**; smoke **88/0/4**, generation **18/0** (+1 manual), fixtures **18/0**, core **30/0**, guards **19/0**, 0 perchance errors, park restored byte-identical (`0442faa8`). The reset's saved state was fingerprinted before and after the change and is **character-identical** (masked FNV `0ad2fdb6`, 24 panels, library preserved). Visual: `desktop-dark-grid` and `phone-dark-grid` came back **0 differing pixels** against the committed baselines; the two `*-analysis` views differ by **+222 CSS px** for a *harness* reason, not this release's — the analysis table's shape follows the project library, `fixtures/full-page.json` carries **4** items in its top-level `libObjects`, and so those baselines have been stale since the fixture gained its own library in **2026.09.26.15** (proved innocent by an in-page A/B that puts the pre-`.19` save path back: 0 pixels). A deliberate baseline refresh is queued in `PENDING.md`. **Next: P3 — mutations become named commands; §3.4 is COMPLETE.**
- **2026-09-27 — P2 step 4 released as 2026.09.26.18: the state-layer differential suite.** `devtests/state-diff.page.js` + `devtests/run-state-diff.js` assert `JSON.stringify(window.__storeJson()) === JSON.stringify(window.collectPanelState())` over 13 cases (the author's live project, the boot instance vs the pure serializer, the 3-page/24-panel fixture, every page with that page on screen, a **non-current** page whose panels can only come from storage, every per-panel field driven through the DOM by hand, every project-wide field, all six panel-count domains, the legacy v1 and every-dead-key files, edits surviving a page switch away and back, a stray unknown key in the stored state, and `resetEverything(true)`), reporting the **first differing path** on failure. **No app code changed** — only the version stamp and the pointer comment. **13/13 green**, so the roadmap's step-5 gate (\"until that passes, nothing reads the store\") is met. One harness trap found and fixed in the same session: the runner's page-side `__hash()` joined the map with a literal backslash-n instead of a real newline, reporting `byteIdentical: false` on a perfectly clean restore (`a48b68bf` vs the parked `bb80c43e`); `String.fromCharCode(10)` fixes it, and \"diff the maps field by field before believing an FNV mismatch\" is now in `devtests/README.md`'s traps. Everything else unchanged: smoke **88/0/4**, generation **18/0** (+1 manual), fixtures **18/0**, core **30/0**, guards **19/0**, visual **12/14** with no size change, 0 perchance errors, park restored byte-identical. **Next: step 5, the save path moves onto the store.**
- **2026-09-27 — P2 step 3 released as 2026.09.26.17: the store (`src/state/store.js`), the state layer's first piece.** A plain store object — `load()` / `toJSON()` (with its dirty-flag cache) / `subscribe()` (returning its own disposer) / `unsubscribe(listener)` / `getSnapshot()` / `isDirty()` — over a **pure** `serializeProject(snapshot)` that rebuilds the project envelope from a snapshot of the page. It is the first file under a new **`src/state/`** folder, loaded by the existing `coreLoad` mechanism (so the boot waits for it and `coreLoadWarning` covers it) and added to `GH_SRC_FILES`. `index.html` supplies the DOM half, `collectDomSnapshot()` (`stored` / `currentPage` / `page` / `globals` / `library` / `kept`), creates one store in `bootApp()` (`initProjectStore()`, a no-op if the module failed) and exposes the read-only test seams `collectDomSnapshot` / `collectPanelState` (newly exported for this) / `__storeJson` / `__storeModule`. **Nothing reads the store**, per the roadmap: step 4 is the differential test and step 5 the save-path switch. `ensurePages` is a **deliberate** second copy — `core.test.js` extracts the inline one as `ensurePagesInline` and asserts the two agree over eight stored shapes, the strangler rule. Tests: core **30/0** (four new store checks), `diff-core` **19/0** (its discovery widened to `src/core/` + `src/state/`, 12 files in the manifest, 8 modules, 39 declared names), smoke **88/0/4**, generation **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, park restored byte-identical (`strays: []`, 23 keys), visual **12/14** at the known ~0.01% with **no size change**. A live spot-check on the author's own project found `__storeJson()` and `collectPanelState()` stringify **identically** — the step-4 assertion, already true on real data. **The park hash moved `cfa29083` → `a5708568` and it is NOT the release:** a field-by-field diff shows the only changed key is `comicGen.githubLastBackup`, the timestamp this session's `ghPush` wrote. **Next: step 4, the differential test.**
- **2026-09-27 — P2 step 2b's second half released as 2026.09.26.16: the project owns its kept images (a `kept` array, no UI).** `settings.kept` (inside `comicGen.panelState`) is now the project's own list of kept images — the container the **⤓ Keep** feature will write into, and the home P2-03's "the project file is the only home for kept images" decision implies. Nothing writes to it yet. The change is a deliberate mirror of §28's library: `schema.js` gained `normaliseKept` (array-of-objects, shallow copies, **unknown keys and field types preserved — it invents no shape**), `kept: []` on `defaultProject()`, a `"kept" in out` line in `normalise()` (only when the key is present) and a `validate()` check; `index.html` gained `projectKept` + `projectKeptArray()`/`loadKept()`/`saveKept()`/`normaliseKeptArray()`/`initProjectKept()` (exported on `window`), `kept:` in `collectPanelState()`, the file's `settings.kept` in `applyImportedSettings`, the round-trip pair in `jsonApplyDoc`, `projectKept = []` in `resetEverything` and a **locked** `settings.kept` in `jsonFieldClass`. **No seeding** (there is nothing to seed from), so the stored state gains `"kept":[]` on the next ordinary save. Smoke **88/0/4** (new group `G18`, checks 89–91: the saved project + the export carry `kept`, a kept entry survives save → export → import → export, the JSON editor refuses a change to it), generation **18/0** (+1 manual), fixtures **18/0**, core **26/0**, `diff-core` **17/0**, 0 perchance errors, park **`cfa29083`** byte-identical (moved from `5488036e` — the new field landing), visual **12/14** with the two `*-json` views at the known 0.01% (now 180 px: the new `"kept": []` row; no size change). **Deliberately left open for the ⤓ Keep round:** what a kept entry holds and **where the image bytes live** (a kept image is ~121 KB, `panelState` autosaves on a 250 ms debounce, and the origin quota is ~5 MB — so "in `panelState`, autosaved" is a non-starter; exclude it from the autosave, use IndexedDB, or hold it in memory until the file is saved). **Step 2b is now COMPLETE. Next: step 3, the store.**
- **2026-09-26 — P2 step 2b's library half released as 2026.09.26.15: the project owns its library.** `settings.library` (inside `comicGen.panelState`) is now the project's own library and `comicGen.libObjects` the browser-wide **catalogue** a project copies from. The seam that made this cheap: `loadLibraryObjects()`/`saveLibraryObjects()` kept their names and signatures and merely changed *which store they address*, so all ~25 call sites and every `lib:<type>:<id>` reference resolve against the project with no call-site edits (`saveLibraryObjects` sets the in-memory `projectLibrary` + `schedulePanelSave()`). New: `loadCatalogue`/`saveCatalogue`, `projectLibraryArray`, `normaliseLibArray`, `initProjectLibrary` (the boot seed — written straight into the stored state, never through the debounced save, whose `collectPageState` would read a half-built DOM), `deleteCatalogueObject`, `copyCatalogueItemToProject` (⤓), `copyProjectItemToCatalogue` (⤒), `sweepDeleteAcrossPages`, `syncDeleteFieldsToDom`, `applyLibraryDelete(id, clearText)`. `renderLibrary()` is two sections (**📁 This project** / **🗂 My catalogue**); the delete dialog is the author's three-way leave/clear/cancel (2c); a project import takes the file's own library and **never writes the catalogue** (2b); `buildExportData` attaches the project library and mirrors it in `libObjects`; the JSON editor locks `libObjects` and edits `settings.library`; `schema.js` gains `normaliseLibrary`/`normaliseLibType` plus `library` in `defaultProject()`, normalised only when the key is present. Smoke **85/0/4** (G8:46/G8:47 rewritten), generation **18/0** (+1 manual), fixtures **18/0** (FX4/FX10 assert the file's library lands in the project and the catalogue is untouched), core **25/0**, `diff-core` **17/0**, 0 perchance errors, park **`5488036e`** byte-identical (moved from `7a1123b0` — the first load of the new build migrates the author's own project by writing the seeded `library`), visual **12/14** with the 2 `*-json` views at the known ~0.01% — no baseline change. **Next: the `kept`-images half of 2b (2026.09.26.16), then step 3, the store.**
- **2026-09-26 — the P1 cleanup finished as 2026.09.26.14: `prompt` and `library-core` lost their in-file copies.** `composePanelPrompt` is now a bare `let` and the eleven `library-core` names share one bare `let` line where their block used to be; `newLibraryId` stays (never a module export). Nothing runs at IIFE time in either group, so losing the hoisted declarations is safe — `composePanelPrompt` is reached only via `buildPanelPrompt`, and the library helpers only from inside functions. **Every module is now module-only: P1 is complete.** `devtests/diff-core.js` dropped `specs` and the `braceEnd`/`grab`/`inlineCode`/`mulberry` machinery (plus three dead zip/jsontext helpers stranded there since `.9`) and keeps its four guards, with the "deleted copies are really gone" probe extended from 17 to **29** names — **17/0**. `devtests/core.test.js` extracts only `getEffectiveKeywords`/`applyPreset` now and takes the rest from merged modules — **24/0**, unchanged. Smoke **85/0/4**, generation **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, park `7a1123b0` restored byte-identical (`strays: []`), visual **12/14** (the two `*-json` views at the known ~0.01%, maxDelta ~70 — no baseline or manual change, since nothing user-visible moved). **Next: P2 step 2b** — the project owns its library and its kept images.
- **2026-09-26 — the library rename shipped as 2026.09.26.13 (a feature request, not a refactor step).** Every Character/Location row in 📚 Library gained a ✎ button that renames the item and sweeps the old name — whole-word and case-sensitive — through the item's library description and, in every panel on every page that uses it, its Basic Description, its This-panel extra description and the panel's Action Prompt. It is the first release whose *behaviour* is shaped by the P2 idea that a panel **references** an item by id (the slot label already followed a rename; only the text needed sweeping). New helpers: `libraryNameRegex` / `countWholeWordName` / `replaceWholeWordName` / `sweepRenameAcrossPages` / `syncRenameFieldsToDom` / `applyLibraryRename` / `openLibraryRename`. Cross-page edits went the `analysisSetPanelStyle` way (`collectPanelState` → mutate → `savePanelStateShape`), with the current page's DOM written back from the saved state so the two cannot drift. Smoke **85/0/4** (new group `G17`, checks 84–88), differential **23/0**, core **24/0**, generation **18/0**, fixtures **18/0**, park `1fc18dde` restored byte-identical, visual **12/14** (the two `*-json` views at the known ~0.01%). Because this was a feature and not a refactor step, the `prompt`/`library-core` fallback deletion moved **again**, to **2026.09.26.14** — it has now slipped for `.10` (P2 step 1), `.11` (the menu fix), `.12` (the palette) and `.13` (this).
- **2026-09-26 — the per-panel colour palette shipped as 2026.09.26.12 (a feature request, not a refactor step).** A `Palette` select now sits in every panel header between Style and Size, backed by a per-panel `palette` field (collect/restore, the JSON editor, and `schema.js`'s `STRING_FIELDS` + `defaultPanel()`), and `getPanelKeywords` treats it as the palette twin of the Style override: an override composes effective style (own || global) with effective palette (own || global), while a panel with neither keeps the global keyword fields verbatim. The Analysis matrix gained a `🌈` palette chip + editor. Because it is a feature and not a refactor step, the `prompt`/`library-core` fallback deletion moved **again**, to **2026.09.26.14** — it has now slipped for `.10` (P2 step 1), `.11` (the menu fix) and `.12` (this). Smoke **80/0/4** (new `G7:47`), fixtures **18/0** (the full-page fixture's panel 4 carries `"palette": "sepia"`), core **24/0**, differential **23/0**, 0 perchance errors, park hash `ccdd4096` restored byte-identical. The visual baseline was regenerated (the panel header gains a row per card: +74 CSS px over the 6-panel desktop grid, +214 px on the phone column) and then compared **12/14 pixel-identical**, the 2 `*-json` views differing by ~0.01%.
- **2026-09-26 — the import-path menu toggle fixed, released as 2026.09.26.11.** `applyImportedSettings` and
  `jsonApplyDoc` ended with `switchMenu(...)`, which **toggles** (`openNow = !group.hidden`), so a restored project
  could close the menu it said to open, leave a menu open that the file said was closed, and (via
  `applyMenuFullscreenPref`) force the menu visible when the file said hidden. A new **`applyMenu(name)`** setter
  (exported on `window`) is now used by both restore paths, and `applyMenuFullscreenPref` gained a
  `keepVisibility` parameter the restore paths pass so a file's own `menuVisible` survives. The menu buttons keep
  `switchMenu` and still toggle. Smoke `G9:50` was tightened from "the two transient menu fields excepted" to a
  **full** export → import → export comparison, and passes. Verified: differential **23/0**, core **24/0**, smoke
  **79/0/4**, generation **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, park hash `bb2bf3c8` (moved
  from `beead0c6` because the author's Save wrote the new panel ids into the project) restored byte-identical. **No
  visual change** — `visual-diff` identical to 2026.09.26.10 (7 pixel-identical, the same 5 three-pixel dark diffs,
  the same 2 JSON-editor diffs from the `id` lines), because its capture recipe normalises the menu before the first
  shot. Because this was a bug fix rather than a refactor step, the `prompt`/`library-core` fallback deletion moved
  to **2026.09.26.14**.
- **2026-09-26 — P2 step 1 released as 2026.09.26.10: panel ids + `core/schema.js`.** Every panel now has a stable
  `id` (`p-<base36 time>-<6 base36 chars>`): minted by `collectPageData` when a card lacks one, set from the state by
  `restorePanelState`, given fresh to every copy (`duplicatePanel` / `batchDuplicatePanels` / `panelPasteAction`), and
  repaired/deduped by `normalise`. The project's shape moves into `src/core/schema.js` — the seventh module and the
  first to import another (`./keywords.js`): `SCHEMA_VERSION`, `PANEL_COUNT_OPTIONS`, `newPanelId`, `defaultChar`,
  `defaultPanel`, `defaultPage`, `defaultProject`, `normalise`, `validate`. `normalise` keeps unknown keys and is
  idempotent; the one behaviour change is the documented `panelCountSel` fold (an out-of-domain count becomes
  `Custom <n>`). The JSON editor locks the id (`G16:83`). Verified: differential **23/0**, core **24/0**, smoke
  **79/0/4**, generation **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, park hash `beead0c6`
  byte-identical after every runner, and the 14 captures: 7 pixel-identical, 5 at 3 antialiasing px, 2 `*-json`
  differing only in the editor's text rows where the new `id` lines are drawn. **The long-standing "224 CSS px"
  `visual-diff` artefact was solved in the same session and it was the recipe, not the app:** the `grid` subject
  called `switchMenu('file')` and `switchMenu` **toggles**, so an open menu (a whole 224 px row) leaked in or out
  depending on the parked menu state and the session order; the subject now closes whatever menu is open. The same
  investigation turned up the import-path menu-toggle wart (§5), deliberately left unfixed. **Next:** `prompt` and
  `library-core` lose their in-file copies at **2026.09.26.14**, then P2 step 2b.
- **2026-09-26 — the four in-file copies deleted, released as 2026.09.26.9.** `zip`, `jsontext`, `keywords` and `seeds` are
  now only in `src/core/`; their in-file implementations came out (357 lines, ~16 KB) and each name is left as a bare `let`
  the loader fills. The boot was restructured to wait for the modules: `coreLoad` collects a promise each, `coreReady`
  resolves to the names that failed, the old flat init block became `bootApp()` behind `coreReady.then(...)`, `window.appReady`
  exposes the moment the app is up, and `coreLoadWarning` shows a fixed bar at the top of the page if a module could not be
  loaded (tested with a deliberately broken build). Verified: differential **21/0** (`unspecced: []`, `missing: []`, plus new
  guards that a deleted copy has not come back and that every module-provided name is still declared), core **18/0** (now
  importing the modules), smoke 73/0/4, generation 18/0, fixtures 16/0, 0 perchance errors, park hash `e11f084f` restored
  byte-identical, screenshots unchanged (third A/B of the dark-view 112 px artefact: the previous build gave identical
  numbers), boot 218 → 228 ms. Two harness/process fixes came with it: `ghPush` no longer pushes the *platform wrapper* as
  `index.html` (it extracts the generator's own source from the served page's `outputTemplate`), and `devtests/park.js` no
  longer re-parks the live map when it is injected on its own (`window.__parkReady = true;` — the old trailing `return park()`
  clobbered the author's parked copy during a freeze recovery; the recovery recipe is in `DEV-NOTES.md`). **Next:** `prompt`
  and `library-core` follow at 2026.09.26.10, then **P2 step 1** — panel ids + `core/schema.js`.
- **2026-09-26 — P1 finished as 2026.09.26.8.** `core/prompt.js` and `core/library-core.js` land (the last two of the
  six), so the pure logic is out of the monolith: differential **31/0** over ~4,500 generated cases, every suite
  green (smoke 73/0/4, generation 18/0, fixtures 16/0, core 14/0), 0 perchance errors, and an A/B capture against
  2026.09.26.7 produced identical screenshots (the six dark views' 112 px drift is the documented session-order
  artefact). Two test-side fixes came with it: the runners had been comparing a token-redacted parked map against a
  page-side hash (so `byteIdentical` printed `false` on a clean restore), and `G14:76` had assumed the author's
  keep-awake key was absent. **Next:** start deleting the in-file copies, then P2 step 1 (panel ids + `core/schema.js`).
- **2026-09-26 — round 2 answered, P2 unblocked (except two blanks).** The decisions are digested in §1b and
  verbatim in `questions/REFACTOR-ROUND-2-ANSWERS.md`: two library sections, imports *offer* to copy, the file is
  the only home for kept images (compact-export button, 40 MB warning), the ladder covers v2 with a download-only
  upgrader, autosave is panel-data-only but configurable, undo is 50 deep and survives a reload, GitHub backups
  become per-project files, and each P2 step ships as its own release. `BUG-01` closed. Plus one new queued feature
  (`P2-02` 2d: up to three reference images per library object). **`P2-01` 1a/1b came back blank and were taken as
  the recommended defaults the same day**, so nothing is outstanding. **The next work is P1's last two modules** (`core/prompt.js`,
  `core/library-core.js`), which need no input.
- **2026-09-26 — round 2 of the questions went out as 2026.09.26.7 (docs + dev tool only).** `src/round2-form.html`
  (opened with `window.__openRound2Form()`) asks the seven P2 decisions: projects becoming first-class, the
  project's library vs the browser catalogue, kept images in the project file, the ladder / upgrader / JSON
  editor, autosave + undo + the GitHub backup, and P2's cadence. `BUG-01` rides along with the five unanswered
  questions from the 2026-09-22 perchance error-dialog report. **P2 should not start until these are answered** —
  every ticket exists because the code cannot answer it.
- **2026-09-26 — keep-awake shipped as 2026.09.26.6 (a feature release, not a refactor step).** New browser
  preference `comicGen.keepAwake` + a Web Audio oscillator at gain 0.0001, because a page that is *playing audio*
  is exempt from background-timer throttling in both engines (the research and the exact source citations are in
  `DEV-NOTES.md` BATCH 2026.09.26.6). The smoke suite gained `G14:76` (defaults to off, reports its state) and
  `G14:77` (starts/stops the loop, persists both ways), so it is now **77 checks: 73 pass, 4 manual, 0 fail**;
  generation 18/0, fixtures 16/0, core 14/0, differential 21/0, 0 perchance errors, and the author's map still
  restores byte-identical (`1c13afe4`) after every runner. A new measurement tool, `devtests/keepawake-probe.page.js`,
  keeps its samples in `sessionStorage` so a preview reload (the editor reloads on Save) no longer destroys them —
  the live-only `devtests/bgprobe.page.js` lost the author's first switch that way.
- **2026-09-26 — P1 part 1 shipped as 2026.09.26.5.** Four of the six modules are extracted: `src/core/zip.js`
  (`crc32`, `initCrcTable`, `dataUrlToBytes`, `buildZip`, `inflateRawDeflate`, `unzipEntries`),
  `src/core/jsontext.js` (`JSON_NUM_RE`, `jsonTokenize`, `jsonDecodeRaw`, `jsonParse`), `src/core/keywords.js`
  (`ART_STYLES`, `COLOR_PALETTES`, `DEFAULT_POS`, `DEFAULT_NEGATIVES`, `composeKeywords`) and `src/core/seeds.js`
  (`panelSeedValue`, `imageSeed`, `scrubMinusOneSeeds`). The new differential suite is `devtests/diff-core.js`
  — 21 checks, ~2,600 generated cases, zero differences — and the new visual check is `devtests/visual-diff.js`.
  Suites after the change: smoke 71/0, generation 18/0, fixtures 16/0, core 14/0, differential 21/0, 5 manual
  lines, 0 perchance errors, and the author's map restored byte-identical (`1c13afe4`) after every runner.
- **2026-09-26 — two harness findings.** (a) The visual baseline is *order-dependent*: the first visual diff
  flagged the three `desktop-light-*` views (11–19% of pixels) and the taller `phone-light-*` captures, and a
  re-run with the light group captured *first* made all five pixel-identical — the preceding subjects were
  leaving in-memory state behind, not the refactor. (b) `ghPush` only ever uploaded `src/manual.html`; it now
  walks a `GH_SRC_FILES` manifest (src/manual.html, the two form files, `src/core/*.js`) and `diff-core.js`
  fails if a discovered module is missing from it.
- **2026-09-26** — the smoke suite gained `G15` (checks 72–74): the selection is DOM-only and never reaches the
  save (§21.11), a copy/paste round trip, and a cut that empties the clipboard once it is pasted. `G14:68` now
  asserts the *documented* default — a missing `comicGen.bgGenerate` key means on — instead of requiring the key
  to exist, which it did not in the author's own storage (it is only written when the box is toggled). Smoke is now
  75 checks: 71 pass, 4 manual, 0 fail; the author's project still restores byte-identical (`1c13afe4`).
- **2026-09-26** — P0 finished and pushed: `devtests/` (5 suites + 4 runners + the park helper), `fixtures/`
  (3 files + a README) and `devtests/shots/` (14 baseline screenshots). Suite results: smoke 71/0, generation 18/0,
  fixtures 16/0, core 14/0, 5 manual lines. Two freezes of the live preview during snapshotting were traced to the
  heavy capture of the 24-panel fixture at a scaled viewport (the baseline now reduces it to 6 panels) and the park
  protocol was hardened to always restore, dump to the workspace and verify the hash after a reload.
- **2026-09-26** — the three open decisions were closed by the author (library = project-owned with the browser
  library as a catalogue; kept images = in the project file; dialogue = a configurable number of text lines per
  panel). Recorded in §3; §4 now holds no open questions. The roadmap's P2 gained a step for the project-owned
  library and the kept-image list.
- **2026-09-26** — created this file; recorded the round-1 answers and the decisions above. `devtests/park.js`
  written and used to park/restore the live preview (`hash 6548bd20`, 21 keys, byte-identical round trip).
- **2026-09-26 — 2026.09.26.4 shipped** (a feature, not a refactor step): generation keeps running while the
  tab is in the background (`comicGen.bgGenerate`, default ON; see `AI-NOTES.md` §19). It was the author's
  single biggest complaint and it was the app's own `visibilitychange` handler doing the damage.

---

**P0 result (2026-09-26).** The suite passes against the unmodified 2026.09.26.4 build: 71 + 18 + 16 + 14
checks green, 5 explicit manual lines, zero perchance errors. What the checks pinned down that the docs did not
say (all now in `FUNCTION-MAP.md` §24): the settings export is a *wrapper* (`{version, exportedAt, settings,
preset, libObjects, …}`) and it **does** carry the browser library — a v2 import *replaces* that library with the
file's, a v1 import *merges* its legacy `charLibrary`/`locLibrary`/`actLibrary` into whatever the browser already
has; `panelCountSel` is only ever one of 1/4/6/12/24/`custom` (a hand-written `"3"` is silently ignored, which the
JSON editor lets a user type); single-panel deletes confirm with a native `confirm()` while batch operations use
the choice dialog; and the generation DOM markers (`panel-img-box` gains `rep` / `protected` / `cleared` / `failed`
/ `paused` / `skipping`, `slot-btns` chips disable) are what a test must assert on, because `showPanelImage`
attaches the `src` asynchronously. Invariants §21 items 1–15 each have at least one check (item 11, *selection is ephemeral*, is pinned by the smoke suite's `G15` group); 16–18 are covered by
inspection and by the harness's own rules (the runner refuses to leave a stray key behind).

## 3. Decisions, written down so they are not re-litigated

- **Buildless ES modules** (R-03 3c) — see the table. No bundler unless module count actually hurts.
- **`src/` = what the app serves; the repo root = documentation.** Never `README.md` / `PENDING.md` /
  `CHANGELOG.md` / `AI-NOTES.md` / `ISSUES.md` inside `src/` (the platform's save flow wedges permanently).
  Harness and fixtures live in `devtests/` and `fixtures/`, which also never ship.
- **No rolling per-slot image history** (R-05 5c). 121 KB per image × 3 × 4 slots × 24 panels ≈ 35 MB per page
  is exactly the memory-pressure class that once killed a mobile tab. The need it was meant to serve ("images
  I liked, but the prompts were lost when I edited the library") is met better by a **⤓ Keep**: pin an image
  and its *resolved* prompt text + seed, so later library edits cannot change what produced it. **DECIDED
  2026-09-26 - kept images live in the project file**, not a separate browser store; the author is fine with
  bigger exports in exchange for portability. Cap around a dozen per project (a soft warning past that).
- **Panel ids before undo** (R-04 4d). Position is the only identity today, which is why move/duplicate/reflow
  need so much care. Adding `id` is invisible, backward-compatible (old files simply gain one on load), and is
  the prerequisite for undo, for dragging panels between pages, and for a saner reorder.
- **The library trade-off** (R-04 4c) — the choice the author asked to be talked through:
  - *Today:* one library per browser, shared by every project; a project export carries a copy. Editing a
    library entry changes every project that still points at it.
  - *Per-project:* each project owns its library. Isolation ("this comic's cast"), self-contained exports, and
    edits can never disturb another project. Cost: a new project starts empty, and existing projects need a
    migration that copies today's browser library into them.
  - *Recommended:* **per-project ownership + the existing browser library kept as a catalogue you can pull
    from** (a "＋ from my library" picker when adding a character/location). That keeps the reuse the author
    has now, adds the isolation they asked for, and makes the "editing the library changed my panel's prompt"
    class of surprise impossible — panel text is already frozen once seeded, and with a project-owned copy
    there is nothing global left to edit underneath it.
  - **DECIDED 2026-09-26 - the author took the recommendation above.** Their own words: "The library import
    function was an attempt to give me reuse." So the catalogue-to-project copy is the part that must stay
    easy; the project-owned copy is what they actually want. Build it in P2 with `core/schema.js` (a project
    carries its own `library`; loading an older project seeds it from the browser library the first time).
- **Character dialogue** (R-08 8b) - **DECIDED 2026-09-26: a configurable number of dialogue lines per panel**,
  held as text in the project and deliberately **not** rendered into the image. The author's reasoning: "they're
  intended for the user more than the renderer", and they do not want to guess how many lines anyone needs, so
  the count is a setting (per panel, default small). Shape: `dialogue: [{ speaker, text }]` on the panel, an
  editable list in the inspector, a configurable row count, and a read-only rendering in Storyboard / Focus / a
  future Review mode. Belongs in P2's schema work (a field on the panel) with P6 writing its UI.
- **Old-file compatibility** (R-04 4a/4b): stamp exports with a format + app version; keep the migration ladder
  for recent shapes only; on import, a file older than the supported ladder gets a clear "this file predates
  the current format, run it through the upgrader" message plus a link, instead of a best-effort guess. The
  upgrader is a standalone page in this repo that reuses `core/migrations.js` once P1/P4 extract it.

---

- **The library is carried by an export, and an import overwrites it** (measured 2026-09-26, `FUNCTION-MAP.md`
  §24). A v2 file replaces the browser-wide library with its own `libObjects`; a v1 file merges its legacy arrays
  in instead. This is the strongest argument yet for the P2 decision above: with per-project libraries, importing
  someone else's project can no longer rewrite the shared catalogue. It also means P2 has to answer what an
  import should do to the *catalogue* — offer to copy the file's objects in, rather than replacing.
- **`panelCountSel` has a closed domain** (1/4/6/12/24/`custom`). A file (or a user in the JSON editor) can say
  `"3"` and the page silently keeps the previous count. A one-line `normalise()` in P2's schema work should fold
  any other number into `custom` + `panelCountCustom`.

- **The visual baseline is order-dependent** (measured 2026-09-26, `devtests/visual-diff.js`). A capture is
  taken after the five earlier "subjects" (json, analysis, dialog, storyboard, focus) and some of them leave
  in-memory state behind — an accordion, a scroll position, a half-finished animation — so the same recipe can
  render 224 CSS px taller on a later pass. Compare like with like (the same order, or capture the group
  first); never conclude "the refactor changed the layout" from a single out-of-order diff.
- **`ghPush` uploaded only `src/manual.html`** (measured 2026-09-26). The two form files and the new
  `src/core/*.js` modules were never backed up. Fixed with a `GH_SRC_FILES` manifest in `index.html`;
  `devtests/diff-core.js` fails if a module is missing from it.

## 4. Closed with the author (2026-09-26)

All three questions from round 1 are answered - see section 3 for the decisions and their reasoning.

1. **The library** - project-owned, the browser library becomes a catalogue, existing projects seeded on first load.
2. **Kept images** - in the project file (big exports are fine).
3. **Character dialogue** - a configurable number of lines per panel, text-only, never rendered.

**Round 2 is answered** (2026-09-26 — `questions/REFACTOR-ROUND-2-ANSWERS.md`, digested in §1b): the P2
decisions are in (`P2-01` 1a/1b taken as the recommended defaults) and `BUG-01` is closed. **Nothing is waiting on
the author.** P1's last two modules (`core/prompt.js`, `core/library-core.js`) lost their in-file copies in
**2026.09.26.14**, which closes out the P1 cleanup (the deletion had been pushed back by every release since:
2026.09.26.10 shipped P2 step 1, 2026.09.26.11 the import-menu fix, 2026.09.26.12 the colour palette and 2026.09.26.13
the library rename).

## 5. Warts

- **`switchMenu` is a toggle, not a setter — FIXED 2026.09.26.11.** `switchMenu(name)` toggles
  (`openNow = !group.hidden`), which is right for a menu button and wrong for restoring a saved state: the import
  path used it, so a project whose stored active menu was the one already open **closed it**, a file saved with no
  menu left the current one open, and `applyMenuFullscreenPref` over-rode a file's `menuVisible:false` when
  fullscreen was on. The two restore paths (`applyImportedSettings`, `jsonApplyDoc`) now call a real setter,
  **`applyMenu(name)`**, and pass `keepVisibility: true` to `applyMenuFullscreenPref`; the buttons keep the toggle.
  Smoke `G9:50` is now a **full** export → import → export comparison (the `activeMenu`/`menuVisible` exception is
  gone) and passes, so this cannot come back silently. **The predicted baseline shift did not happen** —
  `visual-diff` is byte-for-byte the same result as 2026.09.26.10, because its `grid` subject closes any open menu
  before the first capture, so the post-import menu state reaches no screenshot. Found 2026-09-26 while testing P2
  step 1 and deliberately held back from that refactor step; shipped as its own release (`PENDING.md`, `ISSUES.md`,
  `DEV-NOTES.md` BATCH 2026.09.26.11).
