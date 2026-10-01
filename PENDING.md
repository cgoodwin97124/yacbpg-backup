- **Recon (2026-09-29):** two old paths, both position-based, both ending in loadCurrentPage (which wipes the three prompt maps at index.html:4691-93, so neither op needs map shifting — only the command paths ending in buildPanelGrid shift maps manually via shiftPanelMapsForInsert).
- (a) renumberPageTo (index.html:4857, one call site onPageRenumberSelect:4854, exported window:10455): pure part is clamp plus splice plus newPages 1..N plus old-to-new map plus newCurrent; whole pages move intact with stored overrides riding inside the panel objects. Dispatch keeps the pageSession remap (images are session-keyed by page), savePanelStateShape, the currentPage plus analysisPage remap, loadCurrentPage/populatePageSel/updateDeletePageBtn, and the status text. The caller already refuses fewer-than-2-pages, unknown keys, and to-equals-pos.
- (b) reflowInsertOnFullPage (index.html:5882, two call sites: single duplicate 6956, single add 7030): source-page rebuild plus carry cascade plus page creation via defaultPageData; images via pageImagesOf/setPageImagesFor (session-backed, dispatch-side like the moves); callers pushStructUndo first and the function calls stopAllGenerations; returns moves/createdPage/insertPos for the status lines. Batch full-page paths use cascadePageSequence and stay old. Dissolved on recon: the manual rebuild copies only name/summary/seed — identical to pageObjectFromEntries — so no meta-key decision exists.
- **Plan:** renumberPage command first (smaller: one call site, no cascade, page-level session remap only), reflowInsert command as the next release. Zero visible change in both; confirms plus status lines byte-identical; old paths kept as fallback.
- **Author greenlight 2026-09-29 for reflowInsert, verbatim: Ready! Lets do it! Scope locked to the two single-panel call sites, strictly invisible.**
**Status:** DONE 2026.09.29.8 — implemented, tested and documented; app files (index.html, src/state/commands.js, devtests) await the author Save, then the button push; docs/harness via Contents API in the same session. Verified: core 53/0, guards 21/0, state-diff 35/35, smoke 109/0/4, fixtures 18/0, gen 18/0 plus 1 manual, 0 perchance errors, byte-identical restores. Renumber/reflow pair complete; next per the agreed order is Generate (x) to (y).
# PENDING — Request Queue

**RULE (author-mandated 2026-08-13): EVERY new author request is logged into this file FIRST — before
any work starts — even when the author says "go ahead" immediately.** Greenlit requests go straight into
the **2026-09-26 — the P0 regression harness (devtests/ + fixtures/) — ✅ DONE**
**Request.** Build the regression net before any refactor step (R-01 P0).
**Delivered.** `devtests/park.js` (park/check/restore of the whole localStorage map + an FNV-1a hash), four
suites and their runners (`smoke.page.js` 75 checks, `gen.page.js` 18, `fixtures.page.js` 16, `core.test.js` 14
DOM-free), `fixtures/` (full page / legacy v1 / every-legacy-key) with a builder, `devtests/shots/` (14 baseline
screenshots of the fixture project) with a recipe, `devtests/bgprobe.page.js` (background-throttling probe) and
`devtests/README.md`. 5 explicit manual lines; 0 perchance errors. The smoke suite later grew a `G15` selection
and panel-clipboard group (75 checks, 71 pass).
**Verified.** Against the unmodified 2026.09.26.4 build; every runner restores the author's storage and proves
it byte-for-byte after a reload.
**Side findings (documented in `FUNCTION-MAP.md` §24 and `REFACTOR-NOTES.md` §3):** an export carries the
browser library and an import overwrites it (v2 replaces, v1 merges) — the P2 project-owned-library work has to
answer this; `panelCountSel` silently ignores any value outside 1/4/6/12/24/custom, which the JSON editor lets a
user type; single-panel deletes use a native `confirm()` while batch operations use the choice dialog.
**Hardening.** Park copies are dumped to the workspace before a suite runs; a runner that fails to restore
reports `byteIdentical: false` and the write-back path recovers from the file.

🟢 START NOW section; everything awaiting the author's explicit "go ahead" goes into the 🕒 QUEUED
section. Move entries between sections as their status changes (greenlit → START NOW; implemented →

### 2026-09-29 — ORDERING: renumber/reflow next, then Generate (x) to (y), then reference-image hooks

- **Status:** ACTIVE START NOW 2026-09-29 — author approved the level-4 recommendation (verbatim: Yes please!) and authorized the renumber/reflow RECON. Implementation is NOT greenlit — it waits for the recon question round per the 2026-09-20 directive. Logged here on receipt, before any work, per the 2026-08-13 rule.
- **Agreed order:** (1) renumber/reflow old paths as the next command op, one op per release; (2) the greenlit Generate (x) to (y) range button after that; (3) reference-image hooks last, opening with its own question round.
- **Recon (2026-09-29):** two old paths, both position-based, both ending in loadCurrentPage (which wipes the three prompt maps at index.html:4691-93, so neither op needs map shifting — only the command paths ending in buildPanelGrid shift maps manually via shiftPanelMapsForInsert).
- (a) renumberPageTo (index.html:4857, one call site onPageRenumberSelect:4854, exported window:10455): pure part is clamp plus splice plus newPages 1..N plus old-to-new map plus newCurrent; whole pages move intact with stored overrides riding inside the panel objects. Dispatch keeps the pageSession remap (images are session-keyed by page), savePanelStateShape, the currentPage plus analysisPage remap, loadCurrentPage/populatePageSel/updateDeletePageBtn, and the status text. The caller already refuses fewer-than-2-pages, unknown keys, and to-equals-pos.
- (b) reflowInsertOnFullPage (index.html:5882, two call sites: single duplicate 6956, single add 7030): source-page rebuild plus carry cascade plus page creation via defaultPageData; images via pageImagesOf/setPageImagesFor (session-backed, dispatch-side like the moves); callers pushStructUndo first and the function calls stopAllGenerations; returns moves/createdPage/insertPos for the status lines. Batch full-page paths use cascadePageSequence and stay old. Dissolved on recon: the manual rebuild copies only name/summary/seed — identical to pageObjectFromEntries — so no meta-key decision exists.
- **Plan:** renumberPage command first (smaller: one call site, no cascade, page-level session remap only), reflowInsert command as the next release. Zero visible change in both; confirms plus status lines byte-identical; old paths kept as fallback.
- **Questions (awaiting author, implementation waits per the 2026-09-20 directive):** (1) two releases with renumber first — good? (2) reflow scope locked to the two single-panel call sites while batch cascade waits for its own op — good? (3) strictly invisible like .29.4, or is there an adjacent UI tweak worth folding in?

### 2026-09-28 — REFACTOR: P3 step 2 second op (single-panel `duplicatePanel` command)

### 2026-09-29 — REFACTOR: P2 data model — within-page group moves on the named command

- **Status:** ACTIVE START NOW 2026-09-29 — author greenlit this session, verbatim: Go! (following the level-4 recommendation). Logged here on receipt, before any work, per the 2026-08-13 rule. **Status:** DONE 2026.09.29.6 — implemented, tested and documented; app files (index.html, src/state/commands.js, devtests) await the author Save, then the button push; docs/harness via Contents API in the same session. Verified: core 51/0, guards 21/0, state-diff 33/33, smoke 109/0/4, fixtures 18/0, gen 18/0 (+1 manual), 0 perchance errors, byte-identical restores. Completes the move family (single, cross-page single/group, now within-page group). Scope: moveSelectionWithinPage through a new moveMany pure command; cascade spill question dissolved on recon: this path always feeds cascade exactly total (<=24) entries so carry is always empty — no spill behavior exists to preserve; cascade itself stays untouched (shared with batch duplicate/add/paste). No open questions. **Plan:** moveMany(project, pageNum, total, indexes, toPos) pure command (merged rest/sel order, canonical meta rebuild, returns old-position order + insert + movedIds) + dispatch in moveSelectionWithinPage() keeping entries-derived images, selection restore, and status; old path as fallback. One op per release.

### 2026-09-29 — REFACTOR: P2 data model — group cross-page moves on the named command

- **Status:** ACTIVE START NOW 2026-09-29 — author greenlit this session, verbatim: (level 4 default set) Excellent. Lets use verbosity level 4 as the default. And go ahead and start! Logged here on receipt, before any work, per the 2026-08-13 rule. **Status:** DONE 2026.09.29.5 — implemented, tested and documented; app files (index.html, src/state/commands.js, devtests) await the author Save, then the button push; docs/harness via Contents API in the same session. Verified: core 50/0, guards 21/0, state-diff 32/32, smoke 109/0/4, fixtures 18/0, gen 18/0 (+1 manual), 0 perchance errors, byte-identical restores. Follows 2026.09.29.4 (single cross-page move command). Scope: batchMoveToPage / batchMoveToNewPage through a new moveManyToPage pure command; images stay remap-based; zero visible change. **Recon correction 2026-09-29:** the stale-maps quirk does not exist — loadCurrentPage() resets all three prompt maps on every page load in both paths, so single and batch moves already behave identically; stored per-panel overrides travel inside the deep copy. Author approved proceeding with the pure behavior-preserving command (verbatim: Your recommendation is good). Full-page group targets already refuse-the-block in current code; replicating. moveSelectionWithinPage stays old.

- **Status:** ✅ **DONE 2026.09.28.1** — implemented, tested and documented; app files pushed via the button (15 files, repo `index.html` verified at `2026.09.28.1`); docs/harness via Contents API in the same session. **What shipped:** `duplicatePanel` pure command + dispatch on the single-panel non-full-page path (batch + full-page reflow keep old paths); neighbours' prompt overrides ride along (shift, not wipe); canonical meta key order. **Verified:** core **43/0**, guards **21/0**, state-diff **26/26**, smoke **109/0/4**, fixtures **18/0**, gen **18/0 (+1m)**, 0 perchance errors, byte-identical restores (hash `8d02f0dc`). **Next:** delete (one op per release), then page create/delete; T-01 1c resume-to-end as a small release.

### 2026-09-27 — T-04 items 2+3: the Panel Specific Description rename (old saves self-upgrade)

- **Status:** ✅ **DONE 2026.09.27.8** — implemented, tested and documented; app files pushed 2026-09-28 via the button (15 files, repo `index.html` verified at `2026.09.27.8`); docs via Contents API in the same session.
- **Author, 2026-09-28, verbatim:** *"To clarify for T0-04, I only need items 2 (the editable Basic Description that starts as a copy of the default, etc.) and 3 (the existing Panel Description box renamed Panel Specific Description plus saved library). Correct on migration. I have saved, so you can push and then continue!"*
- **What shipped:** item 1 (migration) verified correct as-shipped, no code; item 2 (editable Basic Description) already shipped, no code; item 3's rename — every user-facing "Panel Description" is now "Panel Specific Description", and the stored library type is renamed with a permanent old-label alias (loads everywhere, upgrades on next load/save, same pd- ids). **Verified:** core **42/0**, smoke **109/0/4**, state-diff **25/25**, fixtures **18/0**, 0 perchance errors, byte-identical restores. **Next (unchanged):** duplicate (one op per release), then move, then delete, then page create/delete; T-01 1c resume-to-end as a small release.

✅ DONE, with the changelog version + a matching dev-note block in index.html). A future AI helper
session should READ THIS FILE before planning new work.

Convention: date-stamped entry with Status, Request, and implementation Notes (newest first within
each section).

---

**STANDING NOTES**
- **TEST PROTOCOL (author-mandated 2026-09-24; post-mortem in `ISSUES.md`).** Before ANY synthetic write to the live
  preview's storage: park every `comicGen.*` key in a SECOND localStorage key *and* in a workspace file, verify the
  read-back, stub `confirm`/`prompt`/`alert`, do the test, then restore byte-for-byte and delete every key the test
  created. **The project the preview normally holds — "Cow in field" — is a THROWAWAY: anything loaded under that
  name can be clobbered at any time** (author, 2026-09-25, ticket T-02), so never park anything in it that matters,
  and never treat it as the author's real work. The protocol still applies to everything else.

---

### 2026-09-28 — REFACTOR: P3 step 2 third op (single-panel `movePanel` command)

- **Status:** ✅ **DONE 2026.09.28.2** — implemented, tested and documented; app files (index.html, src/state/commands.js, devtests) await the author's Save, then the button push; docs/harness via Contents API in the same session. **What shipped:** `movePanel` pure command + dispatch in `resequencePanel` (single within-page moves; group + cross-page + new-page keep old paths); prompt maps permuted with their panels (new `reorderPanelMaps`) instead of wiped. **Verified:** core **44/0**, guards **21/0**, state-diff **27/27**, smoke **109/0/4**, fixtures **18/0**, gen **18/0 (+1m)**, 0 perchance errors, byte-identical restores. **Next:** delete (one op per release), then page create/delete; T-01 1c resume-to-end as a small release.

## 🟢 START NOW — author explicitly said "go ahead" (implement immediately)

### 2026-10-01 — REFACTOR: P3 step 2 batch ops (batchDuplicate / batchAdd / batchDelete + cascadePageSequence as named commands)

- **Status:** 🟢 **START NOW 2026-10-01** — author greenlit this session, verbatim: "Let's do it!" (following the L4 recommendation that the batch paths are the next step). Logged here on receipt, before any work, per the 2026-08-13 rule.
- **Scope:** the last position-based mutation paths — `batchDuplicatePanels`, `batchAddPanels`, `batchDeletePanels`, `cascadePageSequence` (index.html:6600–6747) — through named pure commands, one op per release, zero visible change, old paths as fallback. Implementation waits for the recon question round per the 2026-09-20 directive.
- **Why:** completes the structural-command layer; the prerequisite for undo-everywhere and safe cap removal.



### 2026-09-30 — QUESTION ROUND: reference-image hooks (RI-01/RI-02)

- **Status:** 🟢 **START NOW 2026-09-30** — author greenlit this session, verbatim: "Go ahead and send me the questions for the reference-image hooks, and recon the fallback deletion as well. If there is more than three questions, package them into an HTML answers file like we have done before." Logged here on receipt, before any work, per the 2026-08-13 rule.
- **What shipped (questions only, no app behavior change, no version):** `src/refimages-form.html` (9 questions across RI-01 shape/storage + RI-02 UI, cloned from the round-2 form pattern: drafts, recommended-answers button, copy/send to `tickets/`), `questions/REFERENCE-IMAGES.md` (plain-text twin), `window.__openRefImagesForm()` opener + `GH_SRC_FILES` manifest entry in `index.html`.
- **Recon behind the questions:** a library object is exactly `{ id, type, name, desc }` and `normaliseLibrary` (`src/core/schema.js`) rebuilds that shape on every load — a `refs` array would be silently dropped until the schema carries it. Kept-image precedent: whole objects in the project file, ~121 KB/image, 40 MB export warning. No image-to-image path exists, so memo-only.
- **Next:** await the author answers; then implement per the standing recon+ask rule. Delivered + verified 2026-09-30: form opens live via `window.__openRefImagesForm()` (9 questions, correct title); round-2 form untouched. No app behavior change, no version — ships with the next Save+push via the `GH_SRC_FILES` manifest. **Answers received 2026-09-30 (9/9, tickets/RI-01 + RI-02 on file):** 1a Characters+Locations; **1b ask-each-time (non-default)**; **1c thumbnail-only ~256px (non-default)** — author asks to confirm kept/generated images stay full-size (yes: refs change nothing there); **1d pick-which-to-replace (non-default)**; **1e separate export toggle (non-default)**; 2a upload + snapshot-panel-image; 2b Library-row thumbnails; 2c JSON locked-metadata; 2d delete-with-object. Follow-up questions sent (1b batch behavior, 1e default + compact interaction); awaiting answers before implementing, per the standing rule. **Follow-ups answered 2026-09-30, implementation greenlit (verbatim: "Go ahead and run it!"):** (1) 1b ask is per batch, not per item; (2) 1e toggle wins over compact, default ON (recommendation accepted); (3) 1d thumbnail-tap picker confirmed. Scope: schema `refs` on Character/Location, Library-row thumbnails + viewer, upload + snapshot-panel-image add, 4th-arrival replace picker, per-batch copy ask, export toggle (default ON, wins over compact), JSON locked-metadata, delete-with-object. Release: 2026.09.29.10, one ship.
**Status:** DONE 2026.09.29.10 — implemented, tested and documented; app files pushed 2026-10-01 via the button (16 files); docs/harness via Contents API in the same session. Verified: core 54/0, guards 21/0, state-diff 35/35, smoke 109/0/4, fixtures 18/0, gen 18/0 (+1 manual), 0 perchance errors, byte-identical restores. Polish on top of the recon build: 4th-arrival thumbs are tappable (choiceDialogPick), the single-copy identical check compares refs so images sync when names match, both delete confirms name the images they take with them, and batch copy counts a refs change as an update.


### 2026-09-29 — REFACTOR: P2 data model — panels get a real id (position is no longer identity)

- **Status:** 🟢 **START NOW 2026-09-29** — author greenlit this session, verbatim: "Go ahead, let's do that!" (following the recommendation that panel IDs come next as the unlock for undo and drag-reorder). Logged here on receipt, before any work, per the 2026-08-13 rule. ****Author answers 2026-09-29:** (1) scope = cross-page single-panel moves first, group moves next release; (2) image store stays remap-based, keyed-by-ID waits for P4; (3) zero user-visible change expected, minor sensible UI tweaks allowed. **Status:** DONE 2026.09.29.4 — implemented, tested and documented; app files (index.html, src/state/commands.js, devtests) await the author Save, then the button push; docs/harness via Contents API in the same session. Verified: core 49/0, guards 21/0, state-diff 31/31, smoke 109/0/4, fixtures 18/0, gen 18/0 (+1 manual), 0 perchance errors, byte-identical restores. **Recon:** P2 is COMPLETE (ids minted/stored by `normalise`, step 1 DONE) — what remains of position-is-identity is the old position-based paths. `movePanelToPage(i, targetPage, mode)` (index.html:5539) moves by position with prepend/append/replace modes, wipes all prompt maps on cross-page moves, remaps images by position; entry via the per-panel ⇅ reorder dropdown (`onReorderSelect`, pg-N targets, newpage) with group mode on the batch path (stays old). **UI decision:** recon found no adjacent UI change worth making — the status line, confirms and dropdown all stay as-is. **Plan:** `movePanelToPage(project, srcPage, total, index, targetPage, tCount, mode)` pure command (canonical meta order, sets `currentPage`, reports `deletesSrcPage`) + dispatch in `movePanelToPage()` keeping confirms/status/DOM/images; `movePanelToNewPage` rides along via its `replace` call. One op per release.** Source: the R-batch QUEUED entry (R-01…R-08 answers, item 4d — approved: "Do it — invisible is fine if it makes the app sturdier"), prerequisite for undo and for dragging panels between pages.

### 2026-09-29 — HARNESS (greenlit): refresh the stale `*-analysis` visual baselines

- **Status:** 🟢 **START NOW 2026-09-29** — author greenlit this session, verbatim: "Let's go ahead on the baselines then. Ask whatever questions you need, and perform all of the usual pre-implementation tasks. Thank you!" Logged here on receipt, before any work, per the 2026-08-13 rule. ****DONE 2026-09-29** (docs/harness-only, no version — no app code changed). Author answers: scope = all three analysis shots; approach = (b) pin the fixture's library; timing = now. **What shipped:** `make-baseline.js` gains `ANALYSIS_LIB` (the fixture's four items, hard-coded) + the `analysis` subject runs `saveLibraryObjects(ANALYSIS_LIB)` before `openAnalysis()`; `devtests/shots/README.md` documents the pin; all three `*-analysis` baselines regenerated via a scoped runner (`scratch/analysis-refresh.js`) under park/restore. **Verified:** 3/3 captured (desktop-dark/light 1440x900, phone-dark 390x844), every matrix reads `4 library items · 6 panels`, vision-checked (the password modal in the shots is the known trap-4 capture artifact — live DOM had only `analysisOverlay` open), author's map restored byte-for-byte (`d89241e7`, Cow in field, 23 keys, no strays). New desktop height 900x1479 vs old 900x1368 — exactly the queued +222 CSS px (auto-grow with 4 items).** Relates to the 🕒 QUEUED 2026-09-27 harness entry below; see also `devtests/README.md` trap 7 (re-measured at 2026.09.26.20: the +222 px came from the auto-grow step, ordinary capture matched the baseline size — refresh is cosmetic, not a stale-data fix).

### 2026-09-29 — T-01 1c: pausing a bounded run resumes to its bound

- **Status:** ✅ **DONE 2026.09.29.3** — implemented, tested and documented; app files (index.html, devtests) await the author's Save, then the button push; docs/harness via Contents API in the same session. Author answer 1c, verbatim: "It should continue to whichever panel Generate To Here was clicked on, or if was a Generate (X) to (Y) it should continue to the final selected panel." **What shipped:** `computeRunSeq()` pure run-bounds helper extracted from `generateComicPage()` (identical logic, now core-tested) — resume clamps to the paused run's own end panel; plus `pushStructUndo()` clears paused resume state (structural edits invalidate positions). Live pause/resume could not be driven fast in-suite (real generation is minutes per panel; `generateSinglePanel` is not reachable from window scope — a stub attempt hung and was stopped, state verified intact); the computation is pinned DOM-free instead. **Verified:** core **48/0**, guards **21/0**, state-diff **30/30**, smoke **109/0/4**, fixtures **18/0**, gen **18/0 (+1m)**, 0 perchance errors, byte-identical restores. **Next:** author's call — P3 step 2 structural track is complete (add/duplicate/move/delete + page create/delete).


### 2026-09-29 — REFACTOR: P3 step 2 fifth op (`addPage` command)

- **Status:** ✅ **DONE 2026.09.29.1** — implemented, tested and documented; app files (index.html, src/state/commands.js, devtests) await the author's Save, then the button push; docs/harness via Contents API in the same session. **What shipped:** `addPage` pure command + dispatch in `addPage()` (bare 4-panel meta page at max key + 1, current follows; renumber + cross-page moves + page delete keep old paths); new pages carry no panels so no id-minting at creation. **Verified:** core **46/0**, guards **21/0**, state-diff **29/29**, smoke **109/0/4**, fixtures **18/0**, gen **18/0 (+1m)**, 0 perchance errors, byte-identical restores. **Next:** `deletePage` (IN PROGRESS below), then T-01 1c resume-to-end as a small release.

### 2026-09-29 — REFACTOR: P3 step 2 sixth op (`deletePage` command)

- **Status:** ✅ **DONE 2026.09.29.2** — implemented, tested and documented; app files (index.html, src/state/commands.js, devtests) await the author's Save, then the button push; docs/harness via Contents API in the same session. **What shipped:** `deletePage` pure command + dispatch in `deletePage()` after the existing confirms (removes the key, lands on the smallest survivor, drops its session; single-page reset and both confirms unchanged; renumber + cross-page moves keep old paths). **Verified:** core **47/0**, guards **21/0**, state-diff **30/30**, smoke **109/0/4**, fixtures **18/0**, gen **18/0 (+1m)**, 0 perchance errors, byte-identical restores. **Next:** T-01 1c resume-to-end as a small release.


### 2026-09-28 — REFACTOR: P3 step 2 fourth op (single-panel `deletePanel` command)

- **Status:** ✅ **DONE 2026.09.28.3** — implemented, tested and documented; app files pushed via the button (15 files, repo `index.html` verified at `2026.09.28.3`); docs/harness via Contents API in the same session. **What shipped:** `deletePanel` pure command + dispatch in `deletePanel()` (single within-page deletes; the only-panel reset/page-delete and batch/group deletes keep old paths); survivors' images remapped by id, prompt maps shifted down via `reorderPanelMaps`; page meta written in canonical order (pays the .28.1 key-order debt). **Verified:** core **45/0**, guards **21/0**, state-diff **28/28**, smoke **109/0/4**, fixtures **18/0**, gen **18/0 (+1m)**, 0 perchance errors, byte-identical restores ("Cow in field"). **Next:** page create/delete (one op per release), then T-01 1c resume-to-end as a small release. **Plan:** `deletePanel` pure command + dispatch in `deletePanel()` (single within-page deletes only; the only-panel reset/page-delete and batch/group deletes keep their old paths); survivors' images remapped by id and prompt maps shifted down with them via `reorderPanelMaps`. One op per release → `2026.09.28.3`. **Next:** page create/delete, then T-01 1c resume-to-end.


### 2026-09-27 — REFACTOR + FEATURE: P3 step 2 first op (`addPanel` command + undo) with T-07 folded in

- **Status:** ✅ **DONE 2026.09.27.7** — implemented, tested and documented; app files (index.html, src/manual.html) await the author's Save, then the button push; docs/harness via Contents API in the same session. **What shipped:** `addPanel` dispatch through the named command (non-full-page path, old path as fallback), `shiftPanelMapsForInsert` remap (6c), 5-deep snapshot ↩ Undo (6b, dialogs unchanged), T-07 folded in (freeze + revert chip, only Style/Palette/preset reset). **Fixed along the way:** empty-override shadowing (panels generated “skipped”; 23 ghosts purged, nothing else). **Verified:** state-diff **25/25**, core **42/0**, guards **21/0**, smoke **109/0/4**, gen **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, byte-identical restores (baseline `3d3322df`). **Next:** move (one op per release per 6a), then delete, then page create/delete (6d); T-01 1c resume-to-end as a small release.

### 2026-09-27 — REFACTOR: P3 step 1g — the seventh named command (`setPromptOverride`)

- **Status:** ✅ **DONE 2026.09.27.6** — implemented, tested and documented; pushed 2026-09-27: app 15 files via the button (head `be374ec7`) + docs/harness 6 files via Contents API (head `c441cd96`); drift **0 drift / 67 checked** (`scratch/gh-check/drift-019.json`, 24 not-in-workspace all known repo-only files). **What shipped:** `setPromptOverride` in `src/state/commands.js` (`{pos, neg}` or `null`, junk refused; registry of eight, `COMMANDS_VERSION` 7), the minimal render branch (never repaints mid-keystroke), the prompt-editor input branch routed through `runPanelCommand`. Clearers untouched. **No questions asked:** the typing writer is the only direct writer. **Verified:** state-diff **23/23**, core **41/0**, guards **21/0**, smoke **106/0/4**, gen **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, author's map byte-identical after every runner (`aaff7583`).
- **Plan:** mirror the `setProtect` release shape — pure `setPromptOverride(project, id, value)` in `src/state/commands.js` + `COMMANDS` registry (`COMMANDS_VERSION` 6→7), route the prompt-editor writers through `runPanelCommand` with the old path as fallback, extend `renderCommittedFields`, then checks: SD-test + core DOM-free test + diff-core guards. Release `2026.09.27.6`, one release per step.

### 2026-09-27 — REFACTOR: P3 step 1f — the sixth named commands (`setProtect` / `setRepresentative`)

- **Status:** ✅ **DONE 2026.09.27.5** — implemented, tested and documented; pushed 2026-09-27: app 15 files via the button (head `2ef64592`) + docs/harness 6 files via Contents API (head `7ea26163`); drift **0 drift / 67 checked** (`scratch/gh-check/drift-019.json`, 24 not-in-workspace all known repo-only files). **What shipped:** `setProtect` in `src/state/commands.js` (one slot of the `protectSlots` array; registry of seven, `COMMANDS_VERSION` 6), the array branch in `renderCommittedFields`, `toggleSlotProtect` routed through `runPanelCommand` with the old path as fallback. **`setRepresentative` struck** — asked and approved: no persisted leaf, promoting it would be a behavior change. **Verified:** state-diff **22/22**, core **40/0**, guards **21/0**, smoke **106/0/4**, gen **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, author's map byte-identical after every runner (`9f6282a8`).
- **Plan:** the author's call (asked 2026-09-27, *"Yes, that's fine. Go with setProtect alone."*): `setRepresentative` is struck from the leaf list — the ⭐ representative is just slot 1 of the in-memory images, never reaches the saved file, and the chip doesn't even save today; promoting it would be a behavior change, not a refactor step. So: pure `setProtect(project, id, slot, on)` in `src/state/commands.js` + `COMMANDS` registry (`COMMANDS_VERSION` 5→6), route `toggleSlotProtect` through `runPanelCommand` with the old path as fallback, extend `renderCommittedFields` (all four slots from the array), then checks: SD-test + core DOM-free test + diff-core guards. Release `2026.09.27.5`, one release per step.

### 2026-09-27 — REFACTOR: P3 step 1e — the fifth named command (`setPanelSeed` / `setSameSeed`)

- **Status:** ✅ **DONE 2026.09.27.4** — implemented, tested and documented; pushed 2026-09-27: app 15 files via the button (head `294ec9fe`) + docs/harness 6 files via Contents API (head `73d23ee8`); drift **0 drift / 67 checked** (`scratch/gh-check/drift-019.json`, 24 not-in-workspace all known repo-only files). **What shipped:** `setPanelSeed` + `setSameSeed` in `src/state/commands.js` (registry of six, `COMMANDS_VERSION` 5), both branches in `renderCommittedFields`, six writers routed (seed input, Same-Seed checkbox, ✕, ⇤, generation pinning, Analysis setter) with the old path as fallback. **No questions asked:** seeds have no override interaction. **Verified:** state-diff **21/21**, core **39/0**, guards **21/0**, smoke **106/0/4**, gen **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, author's map byte-identical after every runner (`52479000`).
- **Plan:** mirror the `setSize` release shape — pure command(s) in `src/state/commands.js` + `COMMANDS` registry (`COMMANDS_VERSION` 4→5), route the seed writers through `runPanelCommand` with the old path as fallback, extend `renderCommittedFields`, then checks: SD-test + core DOM-free test + diff-core guards. Release `2026.09.27.4`, one release per step.

### 2026-09-27 — REFACTOR: P3 step 1d — the fourth named command (`setSize`)

- **Status:** ✅ **DONE 2026.09.27.3** — implemented, tested and documented; pushed 2026-09-27: app 15 files via the button (head `64ba1bcc`) + docs/harness 6 files via Contents API (head `d5c4de01`); drift **0 drift / 67 checked** (`scratch/gh-check/drift-019.json`, 24 not-in-workspace all known repo-only files). **What shipped:** `setSize` in `src/state/commands.js` (first compound command: `{sel, w, h}` → three leaves; registry of four, `COMMANDS_VERSION` 4), three branches in `renderCommittedFields`, `onPanelSizeChange` + a new `panel-size-(w|h)` input branch routed through `runPanelCommand` with the old path as fallback. **No questions asked:** Size has no override interaction anywhere on its path. **Verified:** state-diff **20/20**, core **37/0**, guards **21/0**, smoke **106/0/4**, gen **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, author's map byte-identical after every runner (`5f7b2e1c`).
- **Plan:** mirror the `setStyle` release shape — pure `setSize(project, id, value)` in `src/state/commands.js` + `COMMANDS` registry (`COMMANDS_VERSION` 3→4), route `onPanelSizeChange` through `runPanelCommand` with the old path as fallback, extend `renderCommittedFields` with the size mapping (mirror restore's option-fallback + custom-row reveal), then checks: SD-test + core DOM-free test (exactly one leaf) + diff-core guards. Release `2026.09.27.3`, one release per step.

### 2026-09-27 — REFACTOR: P3 step 1c — the third named command (`setStyle`)

- **Status:** ✅ **DONE 2026.09.27.2** — implemented, tested and documented; pushed 2026-09-27: app 15 files via the button (head `b5814c52`) + docs/harness 6 files via Contents API (head `70aacc13`); drift **0 drift / 67 checked** (`scratch/gh-check/drift-019.json`, 24 not-in-workspace all known repo-only files). **What shipped:** `setStyle` in `src/state/commands.js` (registry `{setTitle, setImgCount, setStyle}`, `COMMANDS_VERSION` 3), the `style` branch in `renderCommittedFields`, `onPanelStyleChange` routed through `runPanelCommand` with the override cleared first and the old path as fallback. **No questions asked:** Style's override-clearing is existing pinned behaviour (the opposite of the Images decision already approved). **Verified:** state-diff **19/19**, core **36/0**, guards **21/0**, smoke **106/0/4**, gen **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, author's map byte-identical after every runner (`7b7c44c3`).
- **Plan:** mirror the `setImgCount` release shape — pure `setStyle(project, id, value)` in `src/state/commands.js` + `COMMANDS` registry (`COMMANDS_VERSION` 2→3), route `onPanelStyleChange` through `runPanelCommand` (override cleared FIRST so the snapshot commits `promptOverride: null`, old path as fallback), extend `renderCommittedFields` with the style mapping (mirror restore's option-fallback), then checks: SD-test (select change in saved bytes synchronously, neighbour untouched, pinned override CLEARED, select round-trip) + core DOM-free test (exactly one leaf) + diff-core guards. Release `2026.09.27.2`, one release per step.

### 2026-09-27 — REFACTOR: P3 step 1b — the second named command (`setImgCount`)

- **Status:** ✅ **DONE 2026.09.27.1** — implemented, tested and documented; pushed 2026-09-27: app 15 files via the button (head `80af4407`) + docs/harness 6 files via Contents API (head `d0ee5227`); drift **0 drift / 67 checked** (`scratch/gh-check/drift-019.json`, 24 not-in-workspace all known repo-only files). **What shipped:** `setImgCount` in `src/state/commands.js` (registry `{setTitle, setImgCount}`, `COMMANDS_VERSION` 2), the `imgCount` branch in `renderCommittedFields`, `onPanelImgCountChange` routed through `runPanelCommand` with the old path as fallback, and a read-only `window.__panelOverrideSet(i)` seam. **Author decision** (asked 2026-09-27, *"Your recommendation is good. Go ahead and implement!"*): the Images path never cleared prompt overrides and still does not — SD18 pins a real override and proves it survives. **Verified:** state-diff **18/18**, core **35/0**, guards **21/0**, smoke **106/0/4**, gen **18/0** (+1 manual), fixtures **18/0**, 0 perchance errors, author's map byte-identical after every runner (`1f7240d0`).
- **Plan:** mirror the `setTitle` release shape — pure `setImgCount(project, id, value)` in `src/state/commands.js` + `COMMANDS` registry, route the `#panel-img-count-N` change through `runPanelCommand`, extend `renderCommittedFields` with the imgCount element mapping (select rewrite + slot-row re-render, no override clear — recon showed the Images path never clears overrides, unlike Style/Palette), then checks: SD-test (select change in saved bytes synchronously, neighbour untouched, pinned override survives, slots update) + core DOM-free test (exactly one leaf) + diff-core guards. Recon + clarifying questions first per the 2026-09-20 rule.

### 2026-09-27 — HARNESS: refresh the two stale `*-analysis` visual baselines

- **Status:** ✅ **DONE 2026-09-27 — no refresh needed, no file changed.** Author, 2026-09-27, verbatim: *"Let's do the baseline refresh first."* Verdict after recon + measurement: the committed `*-analysis` baselines already match what the code renders — regenerating would only bake in noise.
- **Evidence (all measured 2026-09-27, fixture project, 1440×900, drip-free):** geometry run (park → import `fixtures/full-page.json` → 6 panels → `openAnalysis()`, restored byte-identical `1f7240d0`): 7 columns, 6 rows, table 1334.6 px, body 2367 px, overlay 900 px, library = 4 items. Element capture of `#analysisOverlay` @0.5 vs the committed `desktop-dark-analysis.png` (900×1368 on disk, confirmed): viewed side by side the content is **identical** — same header (`4 library items · 6 panels`), same 6 panel columns, same 4 library rows, same cells, same +Add chips and ✅ marks.
- **Why no refresh:** (a) the `.19` +222 px staleness does not reproduce on the capture path (confirms trap 7's `.20` re-measurement); (b) the two visible deltas are both non-signals — the baseline shows the session-only **Edit global descriptions** box (`#analysisEditDesc`, module var `analysisEditGlobal`, default off, set by no recipe step) ticked blue while a recipe-fresh render leaves it unticked, and the baseline is ~3× dimmer overall (mean luminance 11.4 vs 37.6 — a leftover dimming layer at capture time, not content). Regenerating now would flip the checkbox and the brightness with zero code signal. **Recipe note for any future refresh:** tick/untick `#analysisEditDesc` explicitly before capturing so its state is deterministic.
- **Infra note (for the next visual run):** full-`document.body` capture via `snapshot.js` currently hangs on the image-heavy live project (60 s abort) and froze the renderer once on the fixture path (recovered via `page_refresh`; author's map verified `1f7240d0` byte-identical afterwards each time). Element captures (`capture(el)`) work fine. The killed 30-min `visual-diff.js` run never wrote a capture — its per-capture 120 s timeouts just stacked. If a full run is attempted again, give `execute_js` the full 60-min budget and watch the first capture.

### 2026-09-27 — DOCS: archive-split the repo docs + AI-optimize the machine docs

- **Status:** ✅ **DONE 2026-09-27 (docs-only, no version)** — split + rewrite implemented and verified; pushed docs + `archive/*` + `SESSION-START.md` via the Contents API (10 files: 5 updated, 5 created), then the blob-sha drift check: **0 drift, 67 checked** (`scratch/gh-check/drift-docs.json`, head `5c9f1b9a`). No app push/`ghPush` (app files untouched), no stamp bump, no CHANGELOG entry.
- **Agreed shape (logged before work per the 2026-08-13 rule):** `DEV-NOTES.md` keeps the last ~8 `## BATCH` blocks, `PENDING.md` keeps header + open items + newest ~2 releases + full QUEUED, `CHANGELOG.md` keeps the newest ~45 KB with `.23` still the first `## ` heading (stamp match) and an archive pointer at the bottom; everything moved goes verbatim into `archive/` (`DEV-NOTES-2026-09-early.md`, `PENDING-done-2026-09.md`, `CHANGELOG-2026-09-early.md`) plus an `archive/INDEX.md` and a ~1.5k-token `SESSION-START.md` naming the exact read order. `AI-NOTES.md` is rewritten machine-first (keyed index, terse fragments, stable § IDs, pointer paths, "read these lines" map; target ≲20k tokens, zero facts dropped); `CHANGELOG.md` keeps its human voice.
- **Notes:** START NOW's older ✅ DONE entries move into the DONE archive alongside the existing `## ✅ DONE` history block (they were newest-first already; order preserved). The 4 genuinely open START NOW items (ghPush-fix/P3-1b entry, helper-persistence inquiry, Generate-(x)-to-(y), 8-item feature batch) stay live. `README.md`'s reading order points at `SESSION-START.md`.

### 2026-09-27 — BACKUP: the 2026.09.26.23 push (post-Save)

- **Status:** ✅ **DONE 2026-09-26.23** — the author saved the `.23` build (verified before pushing: the served page carries `2026.09.26.23` and no longer `.22`; 768,896 characters fetched with a `_v=` cache-buster), and the app's own **⬆ Backup to GitHub…** was then run from the chat — `openGhBackup(); await ghPush(); ghClose();` — finishing in **36 s** with **`✅ Pushed 15 files to cgoodwin97124/yacbpg-backup.`**: `main.pjs`, `index.html`, the four form files, the seven `src/core/*.js`, `src/state/store.js`, `src/state/commands.js`, one commit per file, head `a8243ae9 backup 2026.09.26.23 — 2026-09-27T21:56:52.941Z`.
- **The docs and the harness went up in the same session** via the GitHub Contents API (the app's backup deliberately covers only the 15 app files): `CHANGELOG.md`, `DEV-NOTES.md`, `PENDING.md`, `README.md`, `devtests/README.md`, `devtests/smoke.page.js`, `devtests/fixtures.page.js` — every PUT came back with the sha the drift check had computed locally for the same file, so the repo copies are byte-identical to the workspace. Head after those: `ad3299d0 tests 2026.09.26.23: devtests/smoke.page.js`.
- **Drift check: 0 drift** — 62 repo blobs compared against the workspace by git blob-sha, with `extraLocal: []` (nothing in the workspace is missing from the repo). The 24 repo-only files (`FUNCTION-MAP.md`, `UI-IDEAS.md`, `samples/`, `tickets/`) have no workspace copy by design. Result in `scratch/gh-check/drift-023.json`. `comicGen.githubLastBackup` moved, as it does on every real push.
- **Author, 2026-09-27, verbatim:** *“Saved!  Go ahead and push!”*
### 2026-09-27 — FEATURE: multi-select in 📚 Library (batch ⤒ copy to My catalogue, batch 🗑 delete)

- **Status:** ✅ **DONE 2026.09.26.23** — all eight questions were answered *“Your recommendations on all are good.  Go ahead and implement.”* (2026-09-27), and the feature is implemented, tested and documented; the push follows the author's Save. **What shipped:** a checkbox on every Library row; shift-click takes the range; a **☑ Select all** / **✕ Clear** chip in each section heading; the row's own chips relabel and act on the whole selection (**⧒ Copy N** / **⤓ Copy N** / **🗑 Delete N**); one batch-delete dialog that applies **one** policy to every selected project item (⤓ Leave the text as plain text / ✕ Clear the references and the text, else 🗑 Delete N items) and splits a mixed project+catalogue selection by name; a batch ⧒ that warns **only** when an item is already in My catalogue (that copy *updates* the catalogue entry) and changes nothing on Cancel; and a batch ⤓ that adds only the items this project lacks. The selection is **DOM-only** (`libSelection`, keys `proj:<id>` / `cat:<id>`), pruned on re-render, cleared after every action and by Esc (while the Library panel is showing and no other overlay is up), and never saved. **A real bug the new checks caught:** `batchDeleteLibrary` built its `buttons` array and then called `showChoiceDialog` **without** it, so a batch delete opened a dialog with a title, body and hint but no buttons at all — nothing could be clicked and the delete silently never happened (fixed by passing `buttons`; all 13 `showChoiceDialog` call sites now pass one). **Verified:** smoke **106 pass / 0 fail / 4 manual** (110 checks; eleven new, `G21: 99–109`), core **34/0**, module guards **21/0**, state layer **17/17**, generation **18/0** (+1 manual), fixtures **18/0**; **0** perchance errors; the author's map restored **byte-for-byte** after every runner. Probe of the two prior failures: `G21: 109`'s Esc check had been failing because `G11` left the Analysis matrix open, so the Esc went to the matrix's own guard — `G11: 58` now closes it (`closeAnalysis()`), which is the hygiene the group was missing.
- **Author, 2026-09-27, verbatim:** *"Another quick feature request.  I'd like each of the main Library items to be selectable, so that we can copy multiple items into My catalogue, or delete multiple items from the Library or My catalogue.  Go ahead and ask questions if you have them."*
- **FINDINGS (recon, 2026-09-27, before any code):**
  - **The two lists and their data.** `renderLibrary()` (`index.html:2125`) draws one container (`#libObjects`, the Library panel — and the ⛶ Full Screen overlay shows *the same* element, so one render target). It renders **📁 This project** (the project's own library, held in the `projectLibrary` array and saved inside the project as `settings.library`, with a top-level `libObjects` mirror in the file) and **🗂 My catalogue** (the browser-wide reusable set, `localStorage["comicGen.libObjects"]`, shared by every project). Rows come from `libRowEl(o, opts)` (`index.html:2073`), one per item, in four buckets per section: 👤 Characters, 📍 Locations, 🎬 Actions (only when one exists), 💬 Panel Descriptions.
  - **What a row already does.** Project row: a name input + description textarea (both save on every keystroke via `saveLibraryObjects`), ✎ rename (Character/Location only), ⤒ copy up to My catalogue (`copyProjectItemToCatalogue`), 🗑 delete (`deleteLibraryObject`). Catalogue row: name + description (saved to the catalogue as you type), ⤓ copy into this project (`copyCatalogueItemToProject`, disabled when the project already has that id), 🗑 delete (`deleteCatalogueObject`).
  - **The delete flows already ask the right question, per item.** `deleteLibraryObject(id)` counts the panel slots that reference the item (`countLibReferences`) and offers **⤓ Leave the text as plain text** vs **✕ Clear the references and the text** (both leave the slot showing "No Character Selected"); `deleteCatalogueObject(id)` is a plain confirm (a catalogue entry is never a project's own copy). Both use the shared `showChoiceDialog` (`index.html:6024`: title + paragraphs + hint + buttons, resolves to the picked `value`). A batch delete therefore needs one dialog that applies **one** of those two policies to every selected project item and states how many slots are affected.
  - **⤒ overwrites by id.** `copyProjectItemToCatalogue(id)` keys the catalogue entry on the *same id*, so copying an item that is already in the catalogue **updates** it (name + description), and a batch ⤒ of N items can therefore silently overwrite N catalogue entries.
  - **The pattern to mirror already exists for panels.** Panel selection (`index.html:5449`) is a DOM-only `Set` of panel indices with an anchor for shift-click ranges (`onPanelSelectClick`), a batch-mode test (`panelBatchMode`) so a chip acts on the selection instead of one panel, and it **never reaches the save** — that is invariant §21.11, pinned by smoke `G15`. A library selection should be the same kind of thing: in-memory, keyed by library id, pruned when an id disappears, cleared after the action, never stored.
- **QUESTIONS posted to the author (2026-09-27), with my recommendation for each — the author approved **every** recommendation (2026-09-27, verbatim: *“Your recommendations on all are good.  Go ahead and implement.”*), so each recommendation below is now the built behaviour:**
  1. **Selection UI — mirror the panel cards?** *Recommend:* a small checkbox at the left of every Library row (the same `panel-select-wrap` / `panel-select-cb` treatment the 24 panel cards already use), shift-click a checkbox to select a whole range, and the row's own chips **relabel and act on the selection** — `⤒ Copy 3 to My catalogue`, `🗑 Delete 3`, `⤓ Copy 3 into this project` — exactly as the panel chips already do (`⤒`/`🗑`/"N Panels"), rather than adding a separate batch toolbar.
  2. **Batch ⤓ too?** The request names batch ⤒ (into My catalogue) and batch 🗑 only. *Recommend:* yes — the same selection makes multi-⤓ (copy catalogue items into this project) free, and it is the more common setup action.
  3. **Select-all scope.** *Recommend:* a `☑ Select all` chip in each section header (**📁 This project** and **🗂 My catalogue**) that selects that whole section, plus shift-click ranges. Not per bucket (the four bucket headings can stay as they are).
  4. **One delete policy for the whole batch, or per item?** `deleteLibraryObject` currently asks per item between **⤓ Leave the text as plain text** and **✕ Clear the references and the text**, because a deleted item may be used in panel slots. *Recommend:* one dialog for the batch that applies a single policy to every selected project item, states the totals ("3 items · 7 panel slots use them") and lists the items by name; catalogue items never need the question (deleting a catalogue entry never touches a project's own copy). No per-item branching.
  5. **Mixed selection (project + catalogue at once).** *Recommend:* allow it — each chip is labelled for exactly what it will do (`🗑 Delete 3 from this project and 1 from My catalogue`) and the dialog splits the two groups; `⤒` appears only when project items are selected, `⤓` (`into this project`) only for catalogue items that the project lacks.
  6. **Batch ⤒ overwrite warning.** `copyProjectItemToCatalogue` keys a catalogue entry on the item's own id, so copying an item that already exists **updates** that catalogue entry. *Recommend:* a confirm *only when* at least one selected item already exists ("2 of the 5 are already in My catalogue — copy anyway and update them?"), and a plain "copied N" status when none do.
  7. **Selection lifetime.** *Recommend:* in-memory only, keyed by library id, pruned when an id disappears, and **cleared after every batch action** and after a Library re-render that drops the item — never saved (the same rule as the panel selection, invariant §21.11). `Esc` clears it while the Library is open; the selection is *not* remembered across a reload.
  8. **Anything else to batch?** Nothing else on the row is a candidate (name/description editing is per row by nature), so the scope stays: ⤒, ⤓, 🗑 (+ ✎ rename, which stays per item because it rewrites panel text).
  - **Nothing in the library is currently selectable or multi-action**, and there is no library-level bulk bar anywhere (the ⬆ Import… flow has its own checkbox modal, `libImportCandidates`, which is a *different* thing — items coming in from a file — and should stay as it is).

### 2026-09-27 — FIX + FEATURE: the `ghPush` served-page fix (own release), then Panel Descriptions in the Library

- **Status:** 🟢 **START NOW** — author said go ahead (verbatim below). Logged here on receipt, before any work, per the 2026-08-13 rule. **Recon first, as the author asked.** — **UPDATE:** part (1), the `ghPush` fix, is **✅ DONE 2026.09.26.21** (implemented, tested, documented; push follows the author's Save). Part (2), the Panel Descriptions feature, is **✅ DONE 2026.09.26.22** (implemented, tested, documented — copy-not-reference and named descriptions, per the author's answers below; push follows the author's Save).
- **Author, 2026-09-27, verbatim:** *"Go ahead and ship the ghPush fix on its own first.  Also, I have a feature to add; hopefully now is a good time to add it, but if it would make sense to add it as part of the refactor at some later step I can wait for it.  First part: I'd like to change the name of \"This Panel - Extra Description\" to Panel Description.  Next:  I'd like to have library elements have a memory for Panel Descriptions.  Requested behavior: * Creating an element (Character or Location) in the main Library should use the same dialog as when selecting + New Character from the Panel Library * The Panel Description created should go into storage in the Library * When selecting an element for a panel I should be able to select either one of the saved Panel Descriptions or enter one, and if I enter one I should have the option to save it back to the Library. * I think any Character or Location should be able to use any saved Panel Description, though that may change depending on how it works when I use it.  Recon first before either the ghPush fix or implementation."*
- **(1) The `ghPush` fix — its own release, first.** Append a cache-buster to `ghPush`'s served-page fetch (the editor preview's service worker intercepts the bare `location.href`, so the request never returns) and replace `extractTemplateSource`'s per-character string walk (`raw += c`, ~590 KB, the "out of memory") with a quote-scan + `slice`. No behaviour change otherwise; 15 files still pushed, same message format. See the 2026-09-27 BACKUP entry above for the evidence. **IMPLEMENTATION (2026.09.26.21):** `extractTemplateSource` now finds the template's closing quote by scanning the ~thirty quotes the escaped text contains and counting the backslashes before each (the first with an even count is the end), then `slice`s the run out and `JSON.parse`s it — one pass, no per-character concatenation. `ghPush`'s page fetch became `fetch(pageUrl + (pageUrl.indexOf('?') === -1 ? '?' : '&') + '_gh=' + Date.now(), { cache: 'no-store' })`. The pointer comment at the top of `index.html` records why. **Verified:** a harness stubs the GitHub endpoints (`fetch` wrapper: GET → `{sha:'stub'}`, PUT → 200 with a content sha) and runs the **real** `ghPush` over a **real** served-page fetch — the run assembles all **15** files in order (`main.pjs`, `index.html`, the four form files, the seven `src/core/*.js`, `src/state/store.js`, `src/state/commands.js`) with every base64 body in the expected range (`index.html` 755,072 base64 chars = 566,302 bytes = the served build exactly) and reports `✅ Pushed 15 files`, in **271 ms** with no hang and no OOM. That check ships in the smoke suite as **G19: 92**; smoke is now **89 pass / 0 fail / 4 manual**, state layer **17/17**, core **33/0**, module guards **21/0**, generation **18/0** (+1 manual), fixtures **18/0**; **0** perchance errors; the author's map restored byte-identical after every runner (23 keys, "Cow in field", `strays: []`).
- **(2) The Panel Descriptions feature — recon first.** Four asks: (a) rename the panel's **"This Panel - Extra Description"** label to **"Panel Description"**; (b) creating a **Character or Location in the main Library** should use the same dialog as **New Character/New Location from the panel's library picker**; (c) the **Panel Description** written in that dialog is **stored in the Library**; (d) when picking a library element for a panel, the description field becomes a **chooser** (pick a saved description *or* type a new one, with an option to save the new one back to the Library); (e) any element may use any saved description (to be reconsidered after use). Author's own hedge: *"if it would make sense to add it as part of the refactor at some later step I can wait for it."*
- **AUTHOR'S ANSWERS (2026-09-27, verbatim):** *"1. Your recommendation. 2. Confirmed."* — so: **(1)** a saved Panel Description is **copied** into a panel (copy-with-provenance): picking one fills the box, the box stays editable, and the ***edited*** badge plus the **⟳ Refresh from library** chip behave exactly as they do for a Basic Description; editing the library's copy later does **not** rewrite panels that already took its text. **(2)** saved Panel Descriptions are **named** (the name is what the picker lists and what "save back to the Library" asks for; the text stays free-form). Feature **started** on this answer.
- **IMPLEMENTATION (2026.09.26.22):** the box's label is now **Panel Description** and its row gained a 📋/✎ pill, a `.pl-desc-pick` select (`💬 Use a saved description…`) and a 💾 Save-to-library chip; the box keeps its old ids (`panel-char-extra-i-s` / `panel-loc-extra-i`). `src/core/library-core.js` and `src/core/schema.js` accept a **fourth library type**, `Panel Description`, with `pd-` ids, and `library-core.js` exports the pure **`panelDescMatch(objs, text)`**. `addLibraryEntryByType` and `newPanelLibraryEntry` now share one three-step dialog (`promptNewLibraryItem` + `promptPanelDescription` + `pushPanelDescriptionItem`), so 📚 Library's "+" and a panel's "＋ New Character…" ask the same questions. `renderLibrary` grew the always-visible **💬 Panel Descriptions** bucket (same rows, ✎-less, ⤒/⤓ catalogue offers); `refreshAllPanelLineDescs` also repaints the pills; `handleGridInput` gained the pick branch (returns after `pickPanelDescription`) and the typing branch (falls through so prompt-override invalidation + summary update still run). **Nothing new is persisted and no schema version changed** — the panel keeps its plain `extra` / `locExtra` text, which is exactly what "copy, not a reference" means; `src/state/*` was not touched. `src/manual.html` carries the renames and the new Library section.
- **VERIFIED (2026.09.26.22):** smoke **89 → 95 pass / 0 fail / 4 manual** (98 checks; the six new ones are `G20: 93–98`), core **33 → 34/0** (`panelDescMatch`), module guards **21/0** (`unspecced: []`), state layer **17/17**, generation **18/0** (+1 manual), fixtures **18/0**; **0** perchance errors; the author's map restored byte-for-byte after every runner (hash `c9542368`, 23 keys, "Cow in field", `strays: []`). Desktop 1440×900 and phone 390×844 vision-verified (label + picker + chip wrap cleanly inside the panel, the two description boxes stay aligned, the pills read 📋/✎ exactly as the state says, no horizontal overflow). One documentation correction made during this release: the ✎ rename sweep **does** still rewrite these boxes (`sweepPanelForRename` rewrites `extra`/`locExtra`), so a swept box reads ✎ not in your library until the saved description is picked again — `CHANGELOG.md` says so now. **Follow-up for P3:** the roadmap's leaf-setter list (`REFACTOR-ROADMAP.md` §3.5 P3.1) should gain `setPanelDesc`; this release added two new writers to that field.
- **FINDINGS (recon, 2026-09-27, before any code):**
  - **The label.** The string is `This panel — extra description` (em dash, sentence case), a `<span class="pl-line-label">` at `index.html:3577` (character line) and `3604` (location line). It is also in `src/manual.html` (lines 54, 73, 74, 75, 77, 225, 247) and in two in-app hints (`index.html:951` "the <i>extra description</i> boxes", `1911` the rename-sweep hint "the This-panel extra description"). The rename is text-only: no id, field or stored key carries the phrase (`panel-char-extra-*`, `panel-loc-extra-*`, `char.extra`, `p.locExtra` stay as they are). The author's capitals ("Panel Description") match the app's other field label, "Basic Description".
  - **Two creation flows today.** The main Library's green `+` per bucket calls `addLibraryEntryByType(type)` (`index.html:1559`): two native `prompt()`s — **name**, **library description** — then it pushes `{id, type, name, desc}` and saves. The panel Library's `＋ New Character…` / `＋ New Location…` calls `newPanelLibraryEntry(type, i, s)` (`index.html:1974`): three native `prompt()`s — name, library description, **panel description** — then creates the same object, selects it in the panel, refills the line's Basic Description and writes the panel description into the extra box. So "the same dialog" = the three-step version; the main Library's version is the one that lacks the third step. Native `prompt()` is already the idiom for this dialog family (no overlay exists for it).
  - **The library model.** An item is `{id, type, name, desc}` with `type ∈ {Character, Location, Action}`; ids are `char-|loc-|act-<ms>-<rand>` and a panel stores the *reference* string `lib:char:<id>` / `lib:loc:<id>` / `lib:act:<id>`. The pure helpers live in `src/core/library-core.js` (`LIB_TYPE_PREFIX`, `libIdFor`, `libRefValue`, `isLibRef`, `parseLibRef`, `libRefNeedles`, `countLibRefs`, `normalizeLibType`, `extractLibraryItems`, `libRefEntry`, `libRefDesc`). Items live in **two places**: the project's own library (`projectLibrary`, persisted inside the project as `library: [...]`, so it travels with backups and is what the panel dropdowns show, `index.html:1477-1530`) and **My catalogue** (`comicGen.libObjects` in localStorage, shared by every project, with ⤓ copy-in and ⤒ offer-to-catalogue). A panel's element is `chars[s-1].sel` (or `loc`), plus `base` (Basic Description: seeded from the library, editable, marked *edited* once diverged, with a ⟳ Refresh-from-library chip) and `extra`/`locExtra` (the freeform extra description: **plain text with no provenance**). `normaliseLibrary` (`src/core/schema.js:17`) keeps only `{id,type,name,desc}` and **drops anything whose type is not one of the three**; `extractLibraryItems` reads `libObjects` or the legacy `charLibrary`/`locLibrary`/`actLibrary` on import; the JSON editor validates `libObjects` entries (`index.html:9872`, `9908`).
  - **Where a description pool would live.** The natural home is the **project's library** (travels with the project and its backups), with the same optional ⤒ offer-to-catalogue — i.e. a fourth bucket in 📚 Library beside Characters/Locations/Actions (`💬 Panel Descriptions`), same rows (name + text, ✎, 🗑, ⤒/⤓) and the same green `+`. That means: a new type value (`'Panel Description'`), an id prefix (`pd-`), and a matching pass over `LIB_TYPE_PREFIX` / `normalizeLibType` / `normaliseLibrary` / `extractLibraryItems`, plus a decision for the two library-wide sweeps — the rename sweep (`1911`) and delete sweep (`sweepDeleteAcrossPages`, `index.html:1580`) key on element refs, and a description pool has no name-in-prompt role, so both should skip it (matching how Actions are already excluded from the rename sweep). The Analysis matrix lists library items against panels; a new kind should stay out of it initially (it has no per-panel reference to mark).
  - **How the panel side would work.** Follow the **Basic Description precedent** exactly: the box stays a plain textarea (so a project works with no library, and **the stored project format does not change at all** — the field stays `extra`/`locExtra` text, no migration), and it gains two small chips: **📋 Saved…** (a picker listing the project's saved Panel Descriptions by name, filling the box) and **💾 Save to Library** (stores the box's current text as a new named Panel Description). "Any element may use any saved description" then falls out for free, because the pool is not attached to an element. Optional extra: an *edited* badge + ⟳ Refresh chip like Basic Description's, if the author wants the pool to "follow" a picked description until edited.
  - **The one open design question (needs the author):** does a panel **reference** a saved description (editing it in the Library updates every panel that picked it, until that panel diverges) or merely **copy its text** (what the extra box does today — a pick just fills the box)? The author's wording ("select either one of the saved Panel Descriptions **or enter one**, and if I enter one I should have the option to **save it back** to the Library") reads as copy-with-provenance, which is also the only model that matches the existing storage format and the Basic-Description behaviour. Second, smaller question: a saved Panel Description needs a **name** (what the picker lists and what "save back" asks for) — confirm.
  - **Timing.** Recommendation: **now**, on its own after the `ghPush` fix. The feature is additive (a new library kind + a picker + one label + one dialog) and it changes nothing about what a project saves, so it does not disturb P3. The one interaction with P3: the description field gains a writer, which P3 would later want as a named command — so build it as one from the start (`setPanelDesc` in `src/state/commands.js`, alongside `setTitle` and `setImgCount`) and it needs no rework. If the author would rather keep P3's leaf setters to fields that already exist, the alternative is to split: the rename + the unified dialog now (no storage change), the pool after P3 step 1's leaf setters are done.

### 2026-09-26 — QUESTION: can the helper's own work keep going while the author is on another tab? (plus a possible "keep-awake" preference)
- **Status:** 🔬 **INQUIRY — answered in chat; the passive probe is installed in the live preview and waits for the author's 30–60 s tab switch.** Nothing about the app changed, so no version bump.
- **Author, 2026-09-26, verbatim:** "Is there any way your work can continue when I switch to another browser tab?  That's almost as sigh-worthy as the app stopping."
- **What is true (a platform rule, not this app):** the helper's page-level tools run in this browser tab, so hidden-tab throttling applies to them — `setTimeout` / `setInterval` slow to about 1 Hz, `requestAnimationFrame` stops, and after ~5 hidden minutes Chromium throttles further to roughly once a minute; promise and network work still completes. `execute_js` runs in a dedicated Worker, which is far less affected. The app's *own* generation is already immune while `comicGen.bgGenerate` is on (entry above), and the pixel-reading tools (Vision, page snapshots) are the most fragile of all while hidden.
- **Measurement delivered (no app change):** `devtests/bgprobe.page.js` installed in the live preview — `window.__bgReport()` / `window.__bgReset()`, with a 1 Hz page ticker, a rAF counter split visible/hidden, a `visibilitychange` log and a 100 ms blob-URL Worker ticker. Visible-tab baseline: page timer 1002–1014 ms, rAF ≈ 56 fps, worker 100.7 ms/tick. The author switches away for 30–60 s and the report shows the hidden-tab gaps, `rafWhileHidden` and the worker's per-tick time.
- **Offered, not built (needs the author's word):** a "keep awake while working" preference that plays a near-silent looping audio clip after a first click — Chromium exempts audible tabs from background throttling, so this is the one lever that actually defeats it. It should be opt-in and would need the usual version bump + changelog + manual note.

### 2026-09-25 — FEATURE: "Generate (x) to (y)" — pick an inclusive panel range to generate (ticket T-01's note 1b)
- **Status:** 🟢 **START NOW 2026-09-25** — logged on receipt as QUEUED (author-mandated "log every request first"), moved here the moment the author said "go ahead on the generate (x) to (y)!". Implementation in progress.
- **Author, 2026-09-25, verbatim (note attached to T-01 answer 1b):** "Maybe we do a \"Generate (x) to (y)\" button also that lets the user choose an inclusive range of panels to generate." — then, greenlighting it: "Saved!  And go ahead on the generate (x) to (y)!"
- **RELATES TO:** T-01 (the "⚡ Generate All To Here" chip, shipped 2026.09.25.1) — both are thin wrappers over `generateComicPage(startPanel, panelList)`, which already accepts an explicit ordered panel list, so a range button is the same engine with a different (start … end) list.
- **DESIGN CALLS (made at implement time — the author said go ahead, so the questions were answered by the AI rather than asked; each is easy to overrule):** the range is entered through a new **⚡ Generate (x) to (y)…** chip in the same ⚙ Panel chip row, which opens the app's existing non-blocking dialog (the one the import/new-project warnings use) with **two number spinners, From and To**; both ends are inclusive and limited to the current page's panel count; the From/To boxes prefill from a multi-selection when there is one (first … last selected), otherwise 1 … this panel; a live line under them says exactly how many panels will render and the Generate button is disabled while the numbers are out of order or out of range.
- **BEHAVIOUR DECISIONS:** 🔒 protected images inside the range are respected exactly as in every other run; already-generated panels inside the range ARE regenerated (the app has no "skip panels that already have images" concept, and inventing one here would be a surprise); the run sets the same remembered end panel as T-01, so pausing a range run and pressing ⚡ Generate All resumes up to the range's end rather than the page's.
- **IMPLEMENTATION (2026.09.25.2):** new ⚡ Generate (x) to (y)… chip (`#panel-genrange-btn-i`) in the ⚙ Panel chip row after ⚡ Generate All From Here; `panelGenerateRangeAction(i)` opens the app's existing choice dialog with two number boxes (`rangeFromInput` / `rangeToInput`), a live count line and a disabled-when-invalid generate button; the range prefills from a multi-selection and is cleared when the run starts; the run reuses `generateComicPage(null, [from…to])`, so the T-01 pause/resume clamp covers it. Also added the missing `#choiceBtns button:disabled` styling (a disabled dialog button used to look enabled). VERIFIED live: exact ranges (From 2 / To 4 → exactly panels 2, 3, 4 and never 1), invalid ranges refused with a warning + dimmed button, selection prefill + Cancel keeping the selection, a paused range run resuming only as far as the range end, and layout at 390px + desktop in both themes. All 19 `comicGen.*` keys were parked in `__test_backup_v7` and restored byte-for-byte (0 mismatches). Docs: CHANGELOG + DEV-NOTES BATCH 2026.09.25.2 + AI-NOTES §5/§17 + the shipped manual.
- **Status:** ✅ **DONE 2026.09.25.2** (2026-09-25) — shipped and verified; see `DEV-NOTES.md` BATCH 2026.09.25.2 and CHANGELOG 2026.09.25.2.
- **Recon 2026-09-29 (preliminaries, per the agreed order — the feature shipped .25.2 and still matches its spec):** range chip in the panel row plus the selection-menu copy, dialog with From/To spinners plus live count plus disabled-when-invalid Generate, selection-span prefill with clear-on-start, run via generateComicPage(null, [from..to]) so the T-01 end-panel clamp and the .29.3 resume-to-bound cover it; the manual documents it. Gaps found: (1) zero automated coverage — the dialog path was verified live 9-25 only, gen 18 plus smoke 109 touch other run paths; (2) five stale ALL-CAPS button labels left over from the rename — status lines index.html:4314/4678/9522/9526 plus the prefs label :1030, and manual lines 101/103/104/106 — the button is Generate All now; (3) pause/resume over-generation edge for NON-contiguous multi-selection lists (panelGenerateAction :6677 passes the raw selection; resume becomes contiguous resumePanel..runEndPanel and would generate unselected gap panels) — range and To-Here lists are contiguous so unaffected.
- **Questions (awaiting author, implementation waits per the 2026-09-20 directive):** (1) ship the label fixes as a small release on their own — good? (2) add automated range coverage in the gen suite — same release or separate? (3) fix the non-contiguous resume edge now or later? (4) anything in the range dialog itself to change while here?

### 2026-09-23 — FEATURE REQUEST (8 items): always-visible header · Preferences under Edit · always-fullscreen menus · Generate All/Pause/Stop as top-level menu items · theme & color scheme · one-click Library · drop the Library's Full Screen button
- **Status:** IN PROGRESS — author greenlit 2026-09-23. **Quick wins shipped as 2026.09.23.1**
  (Preferences -> Edit, one-click Library, new versioning scheme). **Header / menu / theme ship next as
  2026.09.23.2.** The deferred 8b item (a separate app-settings JSON file) gets its OWN ship AFTER
  header/menu/theme; until then the theme and any future Preferences -> Locale setting live in
  `comicGen.panelState` so they travel in Save / Export / Import.
- **Request (author, 2026-09-23, verbatim):** "Some more changes: * I'd like to have the app title bar and four
  buttons next to it always visible. * I'd like Preferences to live under Edit rather than File. * I'd like to
  have the menus always go full screen rather than needing to click the Full Screen button. I'd like to toggle
  this behavior (full screen or current behavior) under Edit -> Preferences. * I'd like to have "Generate All
  Panels On Page" renamed to Generate All. I'd like to move Generate All, Pause, and Stop, to the menu as top
  level menu items, in the same size and style (including capitalization) as File, Edit, Library, and Help. The
  Stop button can keep its color scheme (red button with white text), but Generate and Pause can be in white
  text with their emojis preceding them as the other menu buttons. I'd like to have an option under Edit ->
  Preferences whether to keep them visible when the rest of the rest of the menu items are hidden. * User
  configurable color scheme and theme (light / dark / system if possible) under Preferences. * Currently, when
  I click the Library menu button I have to click again to open the library proper.  I'd like to not have to
  make that second click; clicking Library should just have it open. * I think the Full Screen button inside
  Library is redundant and can be removed.  Keep the top bar Full Screen button though, and it should keep its
  current functionality. As usual, perform all of the pre-implementation tasks before beginning work. Thank
  you!"
- **AUTHOR'S ANSWERS (2026-09-23, verbatim):**
  1. "So far I don't see a need for the header to stay visible in the other full page views, but I may change
     my mind on that. So let's make this configurable under Preferences. :)" — header becomes a sticky,
     always-visible bar (while scrolling + in the full-screen menu), plus a Preferences toggle for "also keep
     it visible in the other full-page views" (default OFF).
  2. "Let's keep **Menu: Side** as is for now." — leave the Menu: Side toggle and all side-mode behaviour
     untouched.
  3. "Your recommendation is good." — ONE shared persisted switch: the Preferences "open menus full screen"
     option and the header Full Screen button are the same state (label flips Full Screen / Exit Full Screen).
  4. "Extra buttons inside the same row. Generate/Pause exactly matching the tabs. And I'm seeing white text in
     amber buttons (see included screenshot); I want Generate and Pause to match this style." — Generate All /
     Pause / Stop go INLINE in `#menuBar` as siblings of the four tab buttons and match them exactly. Two
     screenshots confirm the tabs render as dark #2a2a2a fill + 2px #ffcc00 border + WHITE bold text (the
     white is real: the platform's normalize.css `button:not([disabled]) { color: inherit }` out-specifies a
     single-class button colour, so `.menu-btn`'s declared #ffcc00 never applies — do NOT "fix" the tabs).
  5. "Your recommendation." — while the menu is hidden, Generate All / Pause / Stop appear in the header strip
     next to the four header buttons (behind a Preferences toggle).
  6. "Yes, leave untouched." — the Focus view's own Generate/Pause/Stop row is not changed.
  7. "Your recommendation." — theme = Mode (Light / Dark / System) + a user-pickable accent, built on new CSS
     custom properties; the default dark theme must stay pixel-identical.
  8. "Yes, include it in the project!" — the theme is stored in `comicGen.panelState` so it travels in
     Save / Export / Import, and it becomes an editable field in the JSON editor.
  8b. "Actually, would it be worth it to create a separate JSON file for saved settings? Any app level
     settings would live in there and are loaded when the page loads. Let's mark this for a separate
     post-header/menu/theme code ship, and questions on this one can hold until after header/menu/theme ships,
     unless it makes more sense to do this work at the same time you do header/menu/theme. I'll default to
     your recommendation; no need to get my separate decision." — DECISION: separate ship AFTER
     header/menu/theme (the visible work keeps moving, and the settings file then becomes the home for
     app-level prefs, incl. the Locale item).
  9. "Let's keep it, because we're keeping the Full Screen top button for now." — **the Library's Full Screen
     button STAYS** (this supersedes the original bullet that asked to remove it). To handle in the
     header/menu ship: with menus-always-full-screen that button would otherwise act as a second "exit full
     screen" control — give it a sensible behaviour (its label already flips via
     `updateMenuFullscreenLabels()`).
  10. "Ship the quick wins first, then header/menu/theme. Also, lets have the versioning go YYYY.MM.DD.S, for
     year/month/day/day's serial release number. A new day's work should start the day's release number at 1
     and increment it for each release (single digits up to 10, unless you think 01, 02, 03, etc. would be
     better; I'll default to your recommendation here). Additionally, regarding date/time, I'm in Pacific Time
     (currently Pacific Standard Time, switching to Pacific Daylight Time when the US customarily switches).
     This suggests adding a Preferences -> Locale item, which would live in the settings defaults (see item 8,
     above)." — versioning becomes YYYY.MM.DD.S with S = 1, 2, 3... (NO zero padding: S is read by a human and
     compared as a whole number; first release under the new scheme = 2026.09.23.1). Dates/times in the docs
     use Pacific Time. The Preferences -> Locale item is DEFERRED to the settings-file ship.
- **PLAN:** ship 1 (2026.09.23.1) = (2) Preferences -> Edit, (6) one-click Library, (10) versioning + docs.
  (The Library Full Screen button stays, so item 7 now needs no work.) ship 2 (2026.09.23.2) = (1)/(5) sticky
  always-visible header + its Preferences toggle, (3) menus full-screen by default behind one shared switch,
  (4) Generate All / Pause / Stop as inline menu-bar items + the "keep visible when the menu is hidden"
  toggle, (7)/(8) theme (Light / Dark / System + accent) on CSS variables, included in the project and the
  JSON editor.
- **SHIP 1 DONE (2026.09.23.1):** the Preferences panel moved from the end of File to the end of Edit
  (`#preferencesPanel`); `switchMenu()` now expands the Library group so 📚 Library opens straight away; the
  Library's ⛶ Full Screen button stays (item 7 dropped); the `YYYY.MM.DD.S` + Pacific-time conventions were
  written into the index.html dev-notes and AI-NOTES §12. Verified live at 866x604 (File = Project + Page Setup,
  Edit = Art Style / Presets / Keyword List / Project JSON / Reset / Preferences, Library opens with its list
  visible and no second click, zero window errors).
- **SHIP 2 DONE (2026.09.23.2):** (1)/(5) `.app-header` is now sticky (`position:sticky; top:0; z-index:9000`)
  with `syncHdrHeight()` publishing its height as `--hdr-h` so `.menu-frame` parks under it; new Preferences
  toggle `comicGen.hdrAllViews` (`applyHdrAllViews()`) makes the header a fixed strip on the OTHER full-page
  views too (`body.hdr-all-views`, per answer 1, default OFF). (3) menus open full-screen by DEFAULT via
  `comicGen.menuFullscreen` (default ON); `syncMenuMode()` moves the real `#menuFrame` into `#menuOverlay`
  whenever the pref is on and the menu is visible, `applyMenuFullscreenPref(on, section)` is the single setter
  the prefs checkbox, the header ⛶ button and the Library ⛶ button all use, `updateMenuFullscreenLabels()`
  reads the PREF (not `isMenuFullscreen()`), and `requestCloseMenuFullscreen()` = `applyMenuVisible(false)` for
  the overlay's `← Back to page` + Esc. `body.menu-fullscreen .app-header` is `position:fixed; z-index:10005`
  so the header sits ABOVE the overlay, and overlays get `padding-top: calc(var(--hdr-h) + 14px)`; the old
  `body.menu-fullscreen .gen-actions { display:none }` was REMOVED so the status line stays visible. (4)
  ⚡ Generate All / ⏸ Pause / ■ Stop are now `<button class="menu-btn …">` siblings of the four tabs INSIDE
  `#menuBar` (ids `#menuGenerateBtn` / `#globalPauseBtn` / `#globalStopBtn`); `.menu-btn.menu-action` is a
  TWO-CLASS `color:#fff` (needed to beat normalize's `button:not([disabled]) { color: inherit }`) and
  `.menu-stop` is red+white; the new `comicGen.genAlwaysVisible` pref + `placeGenButtons()` move the three into
  `#hdrGenCtr` in the header strip when the menu is hidden. The Focus view's own row was left untouched
  (answer 6). All three new prefs (`comicGen.menuFullscreen`, `comicGen.genAlwaysVisible`, `comicGen.hdrAllViews`)
  are persisted, and included in `buildExportData()` / `applyImportedSettings()` / the JSON editor's
  `JSON_OPEN_FLAGS` + apply path. Verified live at 866x604 and 390x844 (7 menu buttons, header pinned at
  top:0 while scrolling, `--hdr-h` 94→181 when the gen buttons move into the header, zero window errors).
- **BACKUP NOTE (2026-09-23, 17:52 UTC):** ship 2 was pushed to `cgoodwin97124/yacbpg-backup` (7 files).
  IMPORTANT: `ghPush()` reads `index.html` from the PUBLIC generator page (`location.href`), which serves the
  last SAVED version — at backup time that page was still the pre-2026.09.23.1 build (changelog head
  2026.08.16.24, 906692 bytes), so the repo's `index.html` does NOT contain ship 1 or ship 2 yet, while
  PENDING.md / CHANGELOG.md / AI-NOTES.md / ISSUES.md / src/user-manual.html (read from the live DOM) DO.
  FIX: after the author presses **Save**, re-run `openGhBackup(); await ghPush(); ghClose();` so the repo's
  index.html catches up. When verifying, check the repo's index.html for `menuGenerateBtn` + `2026.09.23.2`.
- **BACKUP NOTE RESOLVED (2026-09-23, 18:06 UTC):** the author pressed Save and the re-push succeeded — the
  served page grew from 906692 to 971690 bytes, and the repo's `index.html` now contains `themeModeSel` +
  `menuGenerateBtn` + `preferencesPanel` + `2026.09.23.3` (verified via the GitHub contents API). The gap
  described in the note above is CLOSED; no outstanding backup action. Latest commit:
  `backup 2026.09.23.3 — 2026-09-23T18:06:33.488Z`.
- **SHIP 3 DONE (2026.09.23.3):** (7)/(8) the theme. Every hard-coded colour is now a CSS variable
  (`:root` table of 74 vars whose dark values equal the old literals → dark is unchanged, verified), plus
  `:root[data-theme="light"]` and a `@media (prefers-color-scheme: light){ :root:not([data-theme]) }` mirror;
  new Preferences controls `#themeModeSel` (Match my device / Light / Dark, default **Dark**) and
  `#accentRow` (8 preset swatches + `#themeAccentInput` + Reset); JS `applyTheme()`, `themeEffectiveMode()`,
  `accentVarsFor()` (contrast-aware in light mode), `applyThemeFromProject()`, `onThemeModeChange()`,
  `onAccentChange()`/`onAccentInput()` — all exported; persisted in `comicGen.themeMode`/`comicGen.accent`
  AND in `settings.theme` (`collectPanelState`), applied by `applyImportedSettings`/`jsonApplyDoc`, editable
  in the JSON editor; a pre-paint square block sets `data-theme` before the first paint (no flash). A
  `LIGHT-READABILITY` tail block pins the single-class coloured chips (the normalize `color: inherit` trap)
  in light mode only, and the red-fill rules use the new `--on-danger`. Verified: dark probes byte-identical
  (body #1a1a1a / cards #2a2a2a / accent #ffcc00 / Stop #ff4d4d), light contrast audit 1 marginal node
  (a disabled chip) vs 53 in dark, theme + custom accent survive a reload, panelState carries
  `theme:{mode,accent}`, JSON editor shows the theme values as editable, phone 390x844 has no overflow.
  Docs updated: changelog 2026.09.23.3, index.html dev-note BATCH 2026.09.23.3, AI-NOTES §14 + the
  BUTTON COLOURS BAIT bullet, src/user-manual.html.
- **NEW AUTHOR DIRECTIVE (2026-09-23):** the AI may pause work mid-task and ask the author for input
  (especially visual checks) whenever it reaches a genuine decision point — logged as its own directive entry
  in the QUEUED section and in the index.html dev-notes.
- **RECON (2026-09-23):**
  - **1. Header / "title bar + four buttons".** `index.html:1880` `<div class="app-header">` = a flex row whose
    LEFT side is `.header-btns` with exactly four buttons — `▦ Storyboard` (`openStoryboard()`), `☰ Hide Menu`
    (`#menuToggleBtn`, `toggleMenu()`), `▤ Menu: Side` (`#layoutToggleBtn`, `toggleLayout()`), `⛶ Full Screen`
    (`#menuFullscreenBtn`, `toggleMenuFullscreen()`) — and whose RIGHT side is `<h1>` + `#projectNameEl`
    (`.project-name`). CSS `index.html:1440-1441` (plain flex, no `position`). The header is currently NOT
    sticky, so it scrolls out of view on a long page; `▧ Hide Panels` (`#panelsToggleBtn`,
    `position:fixed; bottom:16px; left:16px`) and `#pageNav` (fixed, bottom-centre) are separate body-level
    elements and are NOT part of the four. Note the OLD `body.hdr-offscreen` machinery + the floating
    `#menuRevealBtn` were removed on 2026-09-20 (changelog 2026.08.16.21), so nothing re-shows the header
    controls once they scroll away — the class and `refreshHdrOffscreen()`/`initHeaderObserver()` no longer
    exist in code (only in old dev notes). In SIDE mode (`.menu-frame` `position:sticky; top:10px`) and TOP
    mode (`top:0`) the menu frame is sticky, the header is not.
  - **2. Menu-section visibility.** `body.menu-hidden .menu-frame { display:none }` (index.html:1450); every
    other full-page view (`#singleOverlay`, `#storyboardOverlay`, `#analysisOverlay`, `#menuOverlay`,
    `#jsonEditorOverlay`, `#manualOverlay`) is `position:fixed; inset:0; z-index:10000` (`.view-overlay`
    index.html:1592) so it COVERS the header entirely. `#menuOverlay` (the full-screen menu) additionally
    adopts the real `#menuFrame` element into `#menuOverlayBody` (`openMenuFullscreen()`, index.html:5171) and
    sets `body.menu-fullscreen`; CSS at 1843-1846 restyles the frame to fill the overlay and hides
    `.gen-actions`.
  - **3. Preferences** currently = one `config-panel` at the END of `#menuGroup-file` (index.html:2022-2025),
    header `<h2>Preferences</h2>`, holding exactly one control: `#hidePasswordPref` (persisted
    `comicGen.hidePasswordPref`, `onHidePasswordPrefChange()`). New Preferences options therefore need a home
    in `#menuGroup-edit` (which today holds Art Style & Keywords, the preset panel, the keyword list and Reset
    to Defaults).
  - **4. Generate All / Pause / Stop.** Markup `index.html:2141` — `.gen-actions` (the LAST child of
    `#menuFrame`, CSS 1485, `border-top:2px solid #ffcc00`) > `.gen-row` (flex, 1552) > [`.btn-generate`
    `⚡ GENERATE ALL PANELS<br>ON PAGE ⚡` → `generateComicPage()`; `.btn-pause-global` `#globalPauseBtn`
    `⏸ Pause` → `pauseGenerations()` (disabled unless a run is in progress); `.btn-stop-global`
    `#globalStopBtn` `■ Stop` → `haltGenerations()` (red `#ff4d4d` / white, uppercase)] + `#statusEl.status`.
    The Focus view has its OWN `.focus-gen` row (`#focusPauseBtn`/`#focusStopBtn`/`#focusStatusEl`) mirroring
    these — leave that alone unless told otherwise. `body.menu-fullscreen .gen-actions { display:none }`
    (1846, changelog 2026.08.16.22) is the rule that must be revisited once the buttons move into the menu bar.
  - **5. Menu bar.** `#menuBar` (index.html:1897-1902) = four `<button class="menu-btn" data-menu=…>` —
    `📄 File`, `🎨 Edit`, `📚 Library`, `❓ Help` — each `switchMenu(name)`. CSS `.menu-bar` (1822: flex, wrap,
    gap 6px) and `.menu-btn` (1823-1825: `flex:1 1 76px; background:#2a2a2a; color:#ffcc00; border:2px solid
    #ffcc00; padding:9px 4px; font-weight:bold; font-size:0.82rem`, `.active` = amber fill). i.e. the four
    existing buttons are AMBER text (not white), and in full-screen mode `.menu-bar` becomes a
    `flex-direction:row; flex-wrap:wrap` row with `.menu-btn { flex:1 1 auto; width:auto }` (1844-1845); in SIDE
    mode it stacks vertically (`body.side-mode .menu-bar { flex-direction:column; align-items:stretch }`).
  - **6. "Menus always full screen".** Today full-screen is opt-in per click: `toggleMenuFullscreen()`
    (5201) ⇄ `openMenuFullscreen(section)` (5171) / `closeMenuFullscreen()` (5187), state = `body.menu-fullscreen`
    + `#menuOverlay.hidden` + `#menuFrame` re-parented into the overlay and put back from the remembered
    `menuFrameHome`; Esc is wired at 5214. `switchMenu()` (9117) collapses a freshly-opened group via
    `collapseGroupPanels()`, and while `body.menu-fullscreen` it EXPANDS the group instead (`expandGroupPanels`)
    — which is precisely why the second click is needed in the normal (non-full-screen) menu.
  - **7. Library second click.** `#menuGroup-library` (index.html:2091) contains ONE `.library-section`
    (header `<h2>Library</h2>` + `.lib-toolbar` + `#libObjects`). `setupMenuCollapse()` turns every
    `.config-panel`/`.library-section`/`.help-panel` header into an accordion toggle
    (`toggleMenuCollapse`, 9100) and `collapseGroupPanels` (9104) sets `data-collapsed="1"` on all of them the
    first time a non-full-screen group is shown — so clicking `📚 Library` shows the Library section COLLAPSED
    and you must click its header (the second click the author is describing). `switchMenu` also early-returns
    when the group is already open (unless full-screen), so clicking `📚 Library` twice does nothing.
  - **8. Library Full Screen button.** `#libFullscreenBtn` (`.btn-lib-fullscreen`, index.html:2099) sits in the
    Library `.lib-toolbar` next to `⬆ Import…` / `📊 Analysis` and calls `toggleMenuFullscreen('library')`;
    `updateMenuFullscreenLabels()` (5155) relabels BOTH `#menuFullscreenBtn` and `#libFullscreenBtn`, so
    removal must also drop it from that loop + the `.btn-lib-fullscreen` CSS + the Help text that advertises it
    (`#menuGroup-help` item 5, index.html:2116) and the user manual (src/user-manual.html §9).
  - **9. Theme / color scheme.** There are NO CSS custom properties anywhere (`:root` / `--name` = 0 matches):
    the —187 KB `<style>` (index.html:1418-1856) hardcodes **376 hex colors across 68 distinct values** +
    20 `rgba(...)` shadows. The recurring roles: accent amber `#ffcc00` (44 uses — borders, labels, menu-btn,
    panel-card borders), white text `#fff` (27) / on-accent dark `#111` (19) / `#000` (12), green `#4dff88`
    (27 — project name, storyboard chip, page nav, kw-mode), surfaces `#2a2a2a` (13), `#1a1a1a` (11 body bg),
    `#333` (14) inputs, `#444` (19) borders/hovers, `#3a3a3a` (7), `#222` (5), greys `#555/#666/#888/#bbb/#ddd`
    (9/6/6/6/6), danger red `#ff4d4d` (14) / `#ff3333` (7) hover, blue `#4d9fff` (12), purple `#c8a2ff` (8),
    amber variants `#ffcc66` (9) / `#ffd95e` / `#ffb84d` (6) / `#ff8a4d`. A theme therefore means introducing
    CSS variables for those roles and swapping —376 literals (plus the rgba shadows) — a mechanical but
    wide-reaching refactor that must keep every screen visually identical in the default (dark) theme.
  - **10. Persistence plumbing** available for new prefs: `comicGen.*` localStorage keys written directly, and
    per-setting load/save helpers next to each control (e.g. `hidePasswordPref`). Anything the author wants in
    the File→Export document must be added to `collectPanelState()`/`applyImportedSettings()` AND classified in
    the JSON editor's `jsonFieldClass` (see AI-NOTES §13).
- **QUESTIONS FOR THE AUTHOR (asked 2026-09-23, awaiting answers):**
  1. **"Always visible" header — which situations?** My reading: make `.app-header` STICKY so the title + the
     four buttons stay on screen while you scroll (today they scroll away on a long page), AND keep them
     visible while the full-screen menu is open (today `#menuOverlay` covers them). Should that also apply to
     the other full-page views (Storyboard, Focus, Library, Analysis, JSON editor, manual) — i.e. a permanent
     top strip on every screen — or only to scrolling + the menu?
  2. **Header contents**: keep all four buttons in every case (Storyboard / Hide Menu / Menu: Side / Full
     Screen)? And if menus become always-full-screen (item 3), is `▤ Menu: Side` still wanted (it only affects
     the non-full-screen menu), or should it be hidden/removed in that mode?
  3. **Always-full-screen menus**: should the new Preferences toggle change the DEFAULT only (the header ⛶
     button still opens/closes full-screen for the current session), or should the ⛶ button and the pref be
     the SAME persisted switch (button flips the pref; label shows ⛶ / ⤡)? I recommend the latter (one source
     of truth). Also: with "always full screen" ON, what should the menu look like — header strip at the top,
     then the File/Edit/Library/Help row, then the section (i.e. the current full-screen overlay, just opened
     automatically)?
  4. **Generate All / Pause / Stop placement**: as three extra buttons in the SAME row as File/Edit/Library/Help
     (`.menu-bar`), or a separate row directly under it styled identically? And note the existing four buttons
     are AMBER text on dark — do you want Generate/Pause to literally use white text (slightly different from
     the tabs), or to match the tabs exactly (amber)? I recommend a separate row under the tabs, matching the
     tab styling exactly, with Generate/Pause white-text as you asked (and Stop keeping red/white).
  5. **Status line**: keep `#statusEl` where it is (bottom of the menu, under the tabs area) once the buttons
     move to the top? And should Pause/Stop keep their current disabled-until-running behaviour?
  6. **"Keep them visible when the rest of the menu is hidden"**: when you press `☰ Hide Menu`, where should
     Generate All / Pause / Stop appear — (a) in the header strip next to the four buttons, or (b) as a small
     floating bar at the bottom (where the old floating ☰ button used to live)? I recommend (a).
  7. **Focus view's Generate/Pause/Stop** (the `.focus-gen` row inside 🔍 Focus): leave untouched? I assume yes.
  8. **Theme scope**: is "user configurable color scheme" (a) Mode only — Light / Dark / System — plus a
     user-pickable ACCENT color (the amber role), or (b) a full palette editor (page background, panel
     surface, borders, text, each accent)? I recommend (a) now (Light/Dark/System + accent picker, maybe a
     secondary "highlight" picker), with the CSS-variable foundation in place so a full editor can come later.
  9. **Theme persistence/exports**: save the theme in localStorage only, or also inside `comicGen.panelState`
     so it travels in 💾 Save / Export / Import and becomes an editable field in the 🧩 JSON editor? I
     recommend including it (and making it editable in the JSON editor).
  10. **Library single click**: should the Library section simply always open EXPANDED (recommended), and with
     always-full-screen on, should clicking `📚 Library` open the full-screen overlay already showing the
     Library (recommended)?
  11. **Removing the Library ⛶ Full Screen button**: OK to also remove its mention from the in-app Help text
     and the user manual? (The header ⛶ button keeps its current behaviour.)
  12. **Version**: this is a big change set — one release (e.g. 2026.08.16.25) or split? I recommend one release
     once all answers are in, unless you want the quick wins (items 2, 6, 7, 8 = Preferences move, one-click
     Library, remove the Library button) shipped first as 2026.08.16.25.
- **RE-PUSH (2026-09-23, 18:06 UTC) — Status: DONE.** Request verbatim: "Saved.  Go ahead and re-push."
  The author pressed Save; the public page grew from 906692 → 971690 bytes (now contains `themeModeSel` +
  `menuGenerateBtn` + `preferencesPanel` + `2026.09.23.3`), and the GitHub backup was re-run with a
  cache-busting `window.fetch` patch (7/7 files pushed, commit `backup 2026.09.23.3 —
  2026-09-23T18:06:33.488Z`). GitHub contents-API verification: repo `index.html` = 971690 bytes with all
  three ship-1/2/3 markers, `src/user-manual.html` = v2026.09.23.3, CHANGELOG head = `## 2026.09.23.3`,
  PENDING has the SHIP 3 DONE bullet. **The backup gap is now CLOSED** (see the BACKUP NOTE RESOLVED bullet
  above). No code changed for this request, so no version bump.

## 🕒 QUEUED — persistent pending items, awaiting the author's "go ahead" (newest first, DO NOT start)

### 2026-09-29 — STANDING DIRECTIVE: chat verbosity scale with level 4 as the default

- **Status:** ACTIVE (author-mandated 2026-09-29, in force until the author says otherwise). Docs-only — no changelog entry.
- **Directive (author, verbatim):** Yes please! Also lets make sure we have verbosity level 4, and the definitions, encoded as a user directive. Thank you!
- **Scale (reconstructed — the original wording is lost to compaction; L4 matches the surviving handoff note of what changed, why, numbers, docs; the author may correct any rung):**
- L1 — one-liners: the bare result only, no rationale.
- L2 — the result plus one line of what changed, no numbers.
- L3 — what changed plus why, still no verification detail.
- L4 (default) — what changed, why, verification numbers, docs impact. Every release report and every recommendation uses this shape.
- L5 — full drill-down: L4 plus recon detail, alternatives considered, and file-and-line references. Only on request.
- Chat replies stay at L4 unless the author names another level.

### 2026-09-27 — HARNESS (queued): refresh the two stale `*-analysis` visual baselines

- **Status:** ✅ **DONE 2026-09-29** — refreshed via the 2026-09-29 START NOW entry above (approach b: pinned library, all three analysis shots); no longer queued.
- **Why:** the analysis view's table is shaped by the **project library** (`loadLibraryObjects()`), and importing `fixtures/full-page.json` lands **4** items — the file carries them in its top-level `libObjects` (with no `settings.library`), and the import path falls back to that. The committed `devtests/shots/*-analysis.png` were captured when that number was different, so they have been **stale since the fixture gained its own library in 2026.09.26.15** — invisible until now because no release since has completed a 14-view visual run (the platform's wedged-preview state killed four attempts; `devtests/README.md` trap 6). Measured at `.19`: `desktop-dark-analysis` renders 900x1479 against the baseline's 900x1368 (**+222 CSS px**), and the light one will be the same class of difference.
- **Not a code change:** proved at `.19` by an in-page A/B — putting the pre-`.19` save path back (`window.savePanelState = … collectPanelState()`) and re-rendering that exact view gives **0 differing pixels**, as does a bare `renderAnalysis(); analysisAutoGrowAll();` re-render. Also note the general rule this turned into: **an analysis capture is only comparable to a baseline made with the same project library.**
- **Options:** (a) regenerate the two `*-analysis` baselines with `make-baseline.js` (vision-check them first, as the `.12` refresh did), or (b) first pin the fixture's library for the analysis subjects so the view stops depending on the file's library, then regenerate. (b) is the sturdier fix. Either way it is one deliberate act, with the author watching.

### 2026-09-26 — FEATURE (queued): up to three reference images per library object
- **Status:** 🕒 **QUEUED 2026-09-26** — logged on receipt (answer `P2-02` 2d of the round-2 form); not started. It is a *hook*, not a feature request for now.
- **Author, 2026-09-26, verbatim:** "Let's build in hooks for the possibility to allow up to three reference images, in case we get Image to Image generation capability or in case the user wants to have an idea of what their characters or locations look like."
- **Rough shape (NOT agreed with the author):** a `refs` array of at most three images on a library object (a thumbnail + the full image), shown in 📚 Library, stored with the project the object belongs to, and **never** added to a prompt while there is no image-to-image path. Needs its own question round before any UI exists — where the images live is tied to `P2-03` (the file is the only home for kept images) and to `P2-02` (project library vs browser catalogue).

### 2026-09-26 — BATCH: everything the R-01 … R-08 answers asked for (logged on receipt, 2026-09-26; none of it started)
- **Status:** 🕒 **QUEUED 2026-09-26** — logged when the author sent their R-round answers (one entry per batch, per the "log every request FIRST" rule). R-01 chose the refactor's first target: **P0 (harness) + P1 (pure logic), zero user-visible change**, with features still shipping alongside (1b). Everything below therefore waits for either the refactor to reach it or an explicit "go ahead". The refactor itself is tracked in `REFACTOR-NOTES.md`; the answers live in `tickets/R-01…R-08*.md`.
- **Author, 2026-09-26, verbatim (the parts that are requests rather than answers):**
  - (4a) "I'd sort of like a way to massage older files to make them readable -- maybe an offline script, or a separate app that can update older files for newer versions."
  - (4b) "I'm okay if the app is able to determine that an older file is older and deprecated, and recommends the aforementioned offline script or separate app."
  - (4c) "I'd really like each project to keep its own library."
  - (5a) "I think how many panels a page can have should be up to the user.  I sort of chose the 24 panel per page and 4 image per panel limits somewhat arbitrarily.  Honestly, I think pagination should be done by the user when the user decides it's time."
  - (5c) "I found myself with images I really liked but the prompts being lost when I started editing the library descriptions.  Maybe a way for me to manually add these to either the in-project history or a separate history file?  If that makes sense?"
  - (5d) "Actually the idea of dragging to reorder sounds wonderful, but I'm thinking the user should be able to drag panels around pages."
  - (7b) "The run panel! … If I'm putting things into priority order: * Run panel * Library picker * Prompt inspector * Consistent dialog style for destructive actions * One notification area"
  - (7c) "The amber / dark look and the colour-preset aesthetics; The full-screen menu on a phone" — must stay recognisable (constraints, not suggestions).
  - (8b) "Maybe character dialog for panels?  It doesn't have to render the dialog into the images -- in fact I'd almost prefer that it not."
  - (8d) "Yes — a REFACTOR-NOTES.md alongside the other docs" (created 2026-09-26).
- **THE LIST (grouped by what unlocks it; the R-tickets have the full text and the answers):**
  - **Data model (P2 of the roadmap):** panels get a real `id` instead of "position is identity" (4d — approved: "Do it — invisible is fine if it makes the app sturdier"), which is also the prerequisite for undo and for dragging panels between pages.
  - **Pages (P2/P6):** drop the 24-panel cap and let a page grow and scroll; pagination becomes something the author chooses rather than automatic overflow (5a/5b). Per-page extras they picked (5d): a page filmstrip with thumbnails, dragging pages to reorder, and a per-page art style/palette override — plus dragging **panels** between pages.
  - **Library (P2/P4):** ✅ **DECIDED 2026-09-26** — each project **owns** its library and the browser-wide library becomes a **catalogue** the project can copy entries from (the author's words: "The library import function was an attempt to give me reuse", so the catalogue→project copy is the part that must stay easy). Migration seeds a project's `library` from the browser one the first time an older project loads. Full reasoning in `REFACTOR-NOTES.md` §3. (4c)
  - **Images (P4/P6):** instead of a rolling per-slot history (measured cost ≈ 121 KB per kept image, so a "last 3 per slot" on a full page ≈ 35 MB — rejected, see `REFACTOR-NOTES.md`), a **⤓ Keep** action that pins an image *with the exact prompt text and seed that produced it*, so editing library descriptions can never lose a render they liked. ✅ **DECIDED 2026-09-26: kept images live in the project file** — the author is fine with big exports in exchange for portability. (5c)
  - **Generation & the run (P6):** a **run panel** — a queue of panels being rendered with progress, pause/stop and a per-panel re-roll (7b #1, motivated by 8a). Note 2026.09.26.4 already removed the biggest part of that complaint (the tab-focus pause); the run panel is the rest of it.
  - **Interface (P6, all from 6a–6d / 7a):** one inspector for the selected panel instead of ~60 controls per panel; **Compose / Render / Review** modes over the same project; an **Advanced** switch that hides the expert controls; a **library picker** with search, filters and thumbnails (7b #2) plus a "drifted from the library" marker; a **prompt inspector** showing the assembled prompt as labelled parts (7b #3); **undo everywhere**; one consistent destructive-action dialog style with a 5-second undo (7b #4); **one notification area** instead of scattered status lines (7b #5); a first-run sample project + getting-started checklist; an accessibility pass. Constraints: phone-first layout (they use the phone most, desktop for the screen space — 3d/6d), and keep the amber/dark look, the colour presets and the phone full-screen menu (7c).
  - **Compatibility (P4):** stamp exported projects with a format/app version, detect a file older than the supported ladder on import, and point at an **offline upgrader** (a small standalone page in this repo that runs the same migration code once P1 has extracted it) instead of silently mangling it (4a/4b). Only recent releases need to keep loading.
  - **Character dialogue (8b):** ✅ **DECIDED 2026-09-26** — a **configurable number of dialogue lines per panel**, held as text in the project and **not** rendered into the image ("they're intended for the user more than the renderer"). Needs a shape (`dialogue: [{speaker, text}]` on the panel + a per-panel line count) and a UI home; lands in P2's schema with P6 writing the UI.

### 2026-09-23 — STANDING DIRECTIVE: the AI may pause mid-task and ask for input
- **Status:** ACTIVE (author-mandated 2026-09-23, in force until the author says otherwise). Docs-only — no
  changelog entry.
- **Directive (author, 2026-09-23, verbatim):** "Oh, I have suggestion about the AI workflow. If this works for
  you, if you ever get to a point during work that you need my input on something (especially visual checks) you
  have my permission to pause work and ask. You can add this as a new top level directive as well."
- **How to apply it:** when a genuine decision point appears mid-implementation (an ambiguous instruction, a
  visual/UX choice that can't be resolved from the existing code, a trade-off with no obviously-right answer),
  STOP, finish the current safe step, and ask the author in the chat reply instead of guessing. This is the
  natural companion to the 2026-09-20 directive (recon + ask BEFORE starting); it now also covers DURING the
  work. Still prefer "make a reasonable choice and note it briefly" for small/mechanical things (naming, minor
  spacing) — the directive is for real decision points, not for trivia the author would rather not be pinged
  about.

### 2026-09-22 — BUG REPORT: perchance error dialog "interactionPointerMoveHandler@…:34:3414"
- **Status:** RECON DONE 2026-09-22 — questions for the author recorded below, awaiting answers (per the
  2026-09-20 standing directive). Logged before any work, per the 2026-08-13 rule. **RE-ASKED 2026.09.26.7** as ticket `BUG-01` in the round-2 answer form (`src/round2-form.html`, `window.__openRound2Form()`) — the five questions are unchanged, and the browser-console line is still the only thing that can pin the cause. **CLOSED — NO LONGER AN ISSUE (the author's call, 2026-09-27):** they have not seen it since 2026-09-22 and asked for the record closed this way ("BUG-01 is the one that the mouse movement was generating...  Let's close it with the status of 'no longer an issue'."). Nothing misbehaves, no console line was ever available, and the recon below found nothing in the generator to fix — the one surviving stack frame is the ENGINE's own `interactionPointerMoveHandler` bot-detection helper, and none of the generator-side suspects (a `history.replaceState` trap, synthetic pointer events, unclean handlers, third-party scripts) were present. Nothing is pending; the platform report (`923578bb`) stays on file, and if the dialog ever returns the console text is still the one thing that would pin it.
- **Request.** Author: "Hi, I'm getting this error." + screenshot
  (`scratch/message-attachments/pasted-image-20260922111138.png`).
- **What the screenshot shows (transcribed verbatim):** the perchance "*An error occurred*" dialog — the variant
  that reads "…its reported location is inside perchance's own runtime rather than your code — it may come from a
  browser extension or the platform itself. If your generator is working fine you can likely ignore this:". Its
  only stack line is `interactionPointerMoveHandler@?__generatorLastEditTime=1790045687825:34:3414`, followed by
  the usual "Note: You may need to open your browser console to see the full error message. The keyboard shortcut
  is Ctrl+Shift+J or Cmd+Option+J if using the Chrome browser, and you should see a red error message if you
  scroll down." and a `close` button.
- **Key limitation:** that dialog does NOT include the underlying exception message/type — only the platform's own
  frame. The real error text only appears in the browser console. Without it we're guessing at the cause.
- **RECON:** complete — see "RECON FINDINGS" below. **QUESTIONS FOR THE AUTHOR:** at the end of this entry;
  awaiting answers before implementing anything (per the 2026-09-20 standing directive).
- **RECON FINDINGS (2026-09-22):**
  - The frame is in the ENGINE's own page-bootstrap script, NOT our code. Verified against the served page
    (`https://da71b6561ab8d06c0f8758e7126559e7.perchance.org/f0vstb2fbe`, fetched + inspected): its line 34 is a
    16865-char minified line and column 3414 lands INSIDE
    `function interactionPointerMoveHandler(e){e.isTrusted&&(e.pointerType==="touch"||e.pointerType==="pen"||(sawMousePointerMove=!0,sawMousePointerDown&&sendInteractionSignals()))}`
    (the identifier starts at col 3381; the body expression at ~3410). That function is the engine's "human
    interaction signals" bot-detection helper, installed on every generator page via
    `window.addEventListener("pointerdown"|"pointermove", handler, true)`. It only reaches `sendInteractionSignals()`
    from the MOVE handler when a pointerdown happened FIRST (click, then move) — which matches the report.
  - Our code cannot throw from inside that function (it's engine code we cannot modify), and the engine's own stack
    cleaner strips everything below the first `PERCH.createPerchanceTree`/`PERCH.executeScriptTag` frame, so the
    single line shown IS the innermost surviving engine frame. Confirmed our generator does NOT (a) call
    `history.replaceState` — the engine overrides it to THROW when the pathname changes, a trap we avoid — nor
    (b) dispatch synthetic pointer events, and (c) our own pointer handlers are clean: dispatching
    pointerover/pointermove/pointerdown/pointerup on the live page produced ZERO console errors. The generator also
    loads no third-party scripts (no external `<script src>`, no dynamic script creation).
  - The dialog deliberately omits the exception message for engine-located errors (the `ctx.engineLocation`
    variant renders only the friendly intro + the stack), so the real `TypeError: …` text is only in the browser
    console — exactly what the dialog's own note tells the author to open.
  - Not reproducible from the AI helper's preview: synthetic events are never `isTrusted`, so the engine handler
    returns immediately (verified). The trigger is real/trusted input in the author's browser.
  - **PLATFORM BUG REPORT FILED 2026-09-22 — id `923578bb`** (category preview-page, severity annoyance): asks the
    platform to (a) try/catch that handler chain / always remove its listeners, and (b) include
    `error.name + ": " + error.message` for engine-located errors. Append follow-ups with
    `platform_bug_report({appendToReportId:"923578bb", note})` once the author supplies the console message.
- **MOST LIKELY CAUSE:** a browser extension (or a platform-side bug) making `e.isTrusted`/`e.pointerType` access
  throw inside the engine handler — the dialog's own text names extensions as the prime suspect. Nothing for the
  generator's code to fix unless the author's console message says otherwise.
- **QUESTIONS FOR THE AUTHOR (awaiting answers; do NOT implement anything yet):**
  1. Does the generator actually MISBEHAVE when this happens (does anything stop working), or is it only the
     dialog? (The dialog itself says it can likely be ignored if the generator works fine.)
  2. Please open the browser console (Ctrl+Shift+J, or Cmd+Option+J on Mac), then move the mouse again and copy the
     RED error line — the actual exception message plus the full stack. That one line pins the cause.
  3. Does it appear once, or on every mouse move after it first shows? In edit mode only, or also on the
     saved/public page?
  4. Which browser + OS, and does it still happen with extensions disabled / in a private window / a different
     browser? If it vanishes, it's an extension.
  5. Is there anything you want changed in the generator for this? (Engine-side there's nothing we can fix from
     here beyond the platform report I filed.)

### 2026-09-20 — STANDING DIRECTIVE: recon + clarifying questions before implementing any request
- **Status:** in force until the author says otherwise (process/directive — no changelog entry).
- Recorded 2026-09-20 at the author's request ("after I enter a new change request (including this one), please
  recon the code and ask me any clarifying questions if you have any, before continuing"). Every future session
  must, on receiving a change request: (a) log it in this PENDING file first (existing 2026-08-13 rule), (b)
  RECON the relevant code, (c) ASK any clarifying questions and WAIT for the answers before implementing, and
  (d) record the recon findings + the answers so they survive compaction. Where to record them (author's open
  question): the recon/Q&A live in the per-request PENDING entries (durable, request-scoped); durable
  architecture facts this recon uncovers also go into AI-NOTES.md. Do NOT create a volatile scratch/ `.md` for
  this — scratch/ is wiped between sessions, so a volatile file would lose the answers.
- **Note:** this doc + the embedded doc blocks are the ONLY durable homes; the standing directive is also
  mirrored in the top-of-file dev-notes and AI-NOTES §standings.

### 2026-08-15 — STANDING DIRECTIVE: back up to GitHub on every Save reminder
- **Status:** in force until the author says otherwise (no changelog entry — process/directive, not a feature).
  Recorded 2026-08-15 at the author's request ("add this to the ongoing directives: until I specify otherwise,
  always back it up to GitHub at the same time you remind me to Save"). Every future session must, at task end,
  run the GitHub backup in the same turn as the "press Save" reminder: openGhBackup() → ghPush() → ghClose().
  Also recorded in the top-of-file dev-notes and in AI-NOTES §standings.

## ✅ DONE — implemented (history, newest first)

### 2026-09-30 — LABELS: group-move wording says the selection moves as one block

- **Status:** ✅ **DONE 2026.09.29.9** — implemented, verified live, documented; app files (index.html) pushed via the button (15 files, repo `index.html` verified at `2026.09.29.9` with "(as one block)"); docs via Contents API in the same session.
- **Request (author, verbatim):** "Go ahead and implement it!" — following the recon recommendation, with prior answers: (1) label fixes ride the next release, (2) both labels in the same release, (3) fix now since it is strings-only, (4) nothing else pending.
- **Recon (2026-09-30):** non-contiguous picks (e.g. panels 2+4) already move as one ordered block with gaps closed — `moveMany([2,4]→4)` gives `[1,3,5,2,4]` live on `COMMANDS_VERSION 18`; every other batch path (Generate exact list, Clear/Clear-images/Delete loops, Duplicate after-each-original, cross-page sorted order) already handles gaps. The block semantic was already documented in help + two `⇅ Move` titles; only the picker optgroup ("Move N panels on this page") and the done message ("Moved N panels to position P.") were silent about it.
- **What shipped:** three string literals in `index.html` — optgroup label gains "(as one block)", both `moveSelectionWithinPage` status lines gain "as a block." for multi-selects (singular unchanged). No logic, no state, no commands.
- **Verified:** parked live 2-panel gapped move — optgroup read "Move 2 panels on this page (as one block)", status read "Moved 2 panels to position 1 as a block.", selection restored as the block; `restore().byteIdentical: true` (hash `248865b6`); fresh reload clean (24 cards, stamp `.9`, no errors).


Moved to `archive/PENDING-done-2026-09.md` on 2026-09-27 (docs archive-split): 91 entries, newest-first, verbatim. Read it only for historical questions.
