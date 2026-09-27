# devtests — the regression harness

Everything here is a developer tool. None of it ships with the generator (only `main.pjs`, `index.html` and
`src/` do), and none of it is part of the app.

## The one rule: never run a suite without the park

Every suite in here **mutates the live preview** — it imports fixtures, resets the project, generates with a
stubbed image service. The author's real project lives in that same `localStorage`, so a suite must always
park it first and restore it afterwards. That is what `park.js` is for, and it is not optional.

```
park()    snapshot every localStorage key under __test_backup_v10, verify the read-back, hash the map
check()   hash the live map and diff it against the parked key list  (added / removed keys)
restore() delete every live key, write the parked map back, remove the park key, hash again
```

The runners (`run-smoke.js`, `run-gen.js`, `run-fixtures.js`, `run-state-diff.js`, `make-baseline.js`) all follow
the same shape, and it is the shape to copy for a new one:

**A probe is a write too.** A `page_eval` that only *sets a control* — the theme dropdown, a checkbox, a
`panel-seed` box — writes `localStorage` through the app's own handlers, and the theme also lands inside the
project JSON. On 2026-09-26 a two-line body-height probe (`themeModeSel` → dark, then light) left the author's
`comicGen.themeMode` and `settings.theme.mode` changed; it was caught by hashing the live map against an older
park file and repaired with the same control. Diff the live map against a park file whenever a session has
touched the page outside a runner, and put even "harmless" probe writes in a park/restore.

1. `park()`, then **immediately dump the whole map to `scratch/p0/parks/<name>-<timestamp>.json` and to
   `scratch/p0/last-park.json`**. The workspace copy is the safety net: if the renderer freezes or the run is
   stopped, the in-page park key may be unreachable, but the file is on disk.
2. Run the suite.
3. `restore()`; if that throws or reports anything other than byte-identical, `page_refresh` and write the
   workspace map back key by key.
4. `page_refresh` and verify, in a fresh page, that the FNV-1a hash of the live map equals the parked hash.
   Report that as `byteIdentical` — a run that did not restore cleanly is a failed run, whatever the suite said.
5. Leave `scratch/p0/last-park.json` in place. `devtests/restore-from-park.js` writes it back on demand.

A frozen preview: `page_refresh` recovers it, and the workspace park copy is how you get the author's project
back (`restore-from-park.js`, or paste the map in by hand). This has happened twice; both times the freeze
came from a heavy synchronous snapshot of the 24-panel fixture at a scaled viewport, which is why
`make-baseline.js` reduces the fixture page to 6 panels before capturing.

## The files

| File | What it is |
|---|---|
| `park.js` | the park/check/restore helper (the only file here that runs on its own) |
| `smoke.page.js` + `run-smoke.js` | the capability walk: 93 checks over the factory reset, pages, panels and reflow, content and the freeze rule, prompt composition and override invalidation, seeds, keywords and presets, the library, export/zip/import round trips, the JSON editor, the analysis matrix, the views, confirmations, the preferences (including the keep-awake setting, checks 76–77 — 76 asserts that an absent key reads as `off` and that the off state stores `"0"`, unchecks the box and relabels), the panel selection + clipboard (`G15`, which is what pins invariant §21.11 — the selection is DOM-only and never reaches the save), and panel identity (`G16`, checks 78–83: unique ids that agree with the save, an id surviving a grid rebuild while a duplicate gets a fresh one, a minted id on add, every id present in an export, ids surviving a page switch away and back, and the id locked in the JSON editor). `G9:50` compares an export → import → export **in full**, menu state included (since 2026.09.26.11 — before that it excepted the two menu fields, which is what the toggle bug broke). 89 pass, 4 manual lines (one of them a cross-reference). `G18` (checks 89–91, 2026.09.26.16) is the project's own **kept-image** hook: the saved project and the export carry a `kept` array, a kept entry survives save → export → import → export, and the JSON editor refuses a change to it (it is locked). `G19: 92` (2026.09.26.21) is the **GitHub backup**: every `api.github.com/repos/...` call is stubbed (GET → a sha, PUT → 200) while everything else passes through — including the real fetch of the served page — and the real `openGhBackup()` + `ghPush()` is then driven and asserted: fifteen PUTs in the manifest's order, every body over 900 base64 characters, `index.html`'s over 500,000, and a success status line. It is the regression test for the `.21` fix, and it self-skips (`{ skip: "no token in this browser" }`) where no token is saved. `G7:47` is the per-panel colour palette override (2026.09.26.12): it sets `panel-palette-1`, asserts panel 1's prompt changed and panel 2's did not, then clears it. `G17` (checks 84–88, 2026.09.26.13) is the library rename: check 84 drives the `✎` dialog (preview text, a duplicate name disables the confirm, Cancel changes nothing), 85 applies `applyLibraryRename` and asserts the whole-word/case-sensitive sweep touches only the renamed item's `base`/`extra`/`action` (a decoy `RNameAlphaX`, a lowercase `rnamealpha`, and a *different* item's description are untouched) and blocks a duplicate, 86 follows the slot label and the composed prompt, 87 sweeps a panel on another page, 88 sweeps the item's library description. 2026.09.26.15 made the library the project's own and left `comicGen.libObjects` as a browser-wide *catalogue*: library-row queries are now scoped to `.lib-row-proj`, `G8:46` drives both delete paths (leave the text as plain text / clear the references and the text), and `G8:47` asserts the export carries the project's library **and** the top-level `libObjects` mirror while the catalogue is untouched and the saved state agrees. |
| `gen.page.js` + `run-gen.js` | the generation engine against a stubbed `root.generateImage`: skip/protected/failed paths, seed offsets and pinning, the same-seed flag, prompt history, pause and stop settling cleanly, the run tally, and the 2026.09.26.4 background gate in both directions. 18 pass, 1 manual. |
| `fixtures.page.js` + `run-fixtures.js` | imports every file in `fixtures/` through the real import path and asserts what came back. 18 pass (the two extra assert that a legacy file gains panel ids, and that a file's own ids are kept while a repeated one is repaired). Since 2026.09.26.15 `FX4`/`FX10` also assert that the file's own library lands in the *project* while the catalogue's length is unchanged (`window.__fxCatBefore`). |
| `state-diff.page.js` + `run-state-diff.js` | the **state-layer differential suite** (2026.09.26.18/19, `REFACTOR-ROADMAP.md` §3.4 steps 4 and 5). For every case it requires `JSON.stringify(window.__storeJson()) === JSON.stringify(window.collectPanelState())` — the store's project object vs the app's own, character for character — and reports the **first differing path** on failure. 17 checks (`SD1`–`SD17`): the author's live project; the boot store instance vs the pure `serializeProject()` (+ `STORE_VERSION === 2`); the full-page fixture (3 pages, 24 panels); **every page** with that page on screen; a **non-current** page (its panels are only reachable from storage, which is what pins the stored-pages half of the serializer); every per-panel field driven by hand through the DOM, with `eqArr` on the collected model so a check cannot pass vacuously; every project-wide field; all six panel-count domains; the legacy v1 file after migration; the every-dead-key file; edits surviving a page switch away and back; a stray unknown key written into `comicGen.panelState` (dropped by both sides, the stored copy left unmutated); a full `resetEverything(true)`; and — since the save path moved onto the store — **`SD14`/`SD15`** (after an edit + `window.savePanelState()`, the bytes in `localStorage` are exactly `JSON.stringify(window.__storeJson())` and equal `collectPanelState()`'s, on the live project and on the re-imported 3-page fixture) and **`SD16`** (a factory reset matches the schema's own `defaultProject()`/`defaultPanel()` field for field — 11 project-wide, 5 page and 18 panel fields), and — since the first named command landed — **`SD17`**: typing into `#panel-title-1` through a real `input` event puts the value in `localStorage` **synchronously** (i.e. before the 250 ms autosave could have fired, which is what proves the command is the writer), byte-for-byte equal to both `window.__storeJson()` and `collectPanelState()`, with the neighbouring panel untouched, an unknown command name returning `false`, and the typed title surviving a page switch away and back. The runner injects `fixtures/*.json` as `window.__fixtures` and parks/restores like the others. **Run it after any change to `store.js`, `commands.js`, `collectDomSnapshot()`, `collectPageData()`, `savePanelState()`, `handleGridInput()` or `resetEverything()`** — it is the gate that licensed the save path to move onto the store, and now the gate that keeps every command honest. 17 pass. |
| `core.test.js` | the DOM-free suite. **Since 2026.09.26.9 it imports every `src/core/*.js` module, since 2026.09.26.17 `src/state/store.js` and since 2026.09.26.20 `src/state/commands.js` too** (blob URL — since 2026.09.26.10 the loader rewrites each module's relative `./x.js` import to the sibling's blob URL, which is what lets `schema.js` import `keywords.js`). Since **2026.09.26.14** it extracts only the DOM-bound names that never became modules (`getEffectiveKeywords`, `applyPreset`) **out of `index.html` by name** and merges the modules into the sandbox so the extracted code can call them. **33 pass** (the base64 / zip-internals / JSON-escape cases moved here from the differential suite, plus the `core/schema.js` checks: id shape and uniqueness, the default shapes, normalise keeping unknown keys and minting ids, dedupe / repair / idempotence, the `panelCountSel` fold, validate-vs-normalise, `normaliseLibrary`/`normalise` handling the project's own `library` array, and — 2026.09.26.16 — `normaliseKept` doing the same for the project's own `kept` array, including that it invents no field and that a state without the key keeps its exact shape; and — 2026.09.26.17 — four checks for `src/state/store.js`: the envelope `serializeProject()` builds from a snapshot (key order, `theme`, the live page replacing the stored copy, the snapshot left unmutated), the store API (a cached `toJSON`, the dirty flag, subscribe/unsubscribe, a listener that throws), the `ensurePages` agreement with `index.html`'s own copy over eight stored shapes, and a null-or-junk snapshot still serialising a valid project), and — 2026.09.26.20 — **three checks for `src/state/commands.js`**: `findPanelById` finding a panel by id on any page (and being a no-op for junk ids, junk projects and junk pages, with the project provably unmutated), `setTitle` writing **exactly one leaf** (a recursive differ reports `["$.pages.1.2.title"]` and nothing else) and reporting `{ page, index, fields }`, and its coercion / unknown-id no-op / registry behaviour (`COMMANDS.setTitle === setTitle`, `COMMANDS_VERSION === 1`). |
| `diff-core.js` | the **module guard suite** for `src/core/*.js` **and `src/state/*.js`** (the discovery widened to `src/state/` in 2026.09.26.17) — since **2026.09.26.14** it no longer compares anything, because no module keeps an in-file copy to compare against (that differential half was retired with the last copy; until 2026.09.26.9 it covered all six modules, then just `prompt` and `library-core`). What remains are the four guards: each module loads and exports its complete surface (9 modules, `unspecced: []`), every discovered `src/` module is listed in `index.html`'s `GH_SRC_FILES` (the ghPush manifest — a module missing from it would never be backed up), **the deleted in-file copies are really gone** (no implementation left for the 29 names deleted in 2026.09.26.9 and .14), and **every module-provided name is still declared in `index.html`** (40 names — a missing declaration would leave the module's value nowhere to land). 21 pass. **Run it after every extraction and after every deletion.** |
| `visual-diff.js` | the **visual regression check**: re-captures the `devtests/shots/` baseline into `scratch/shots-*` and compares it pixel-by-pixel with the stored PNG (differing pixels, mean/max channel delta). It uses the same park/restore protocol. **Capture order matters** — see the note below. |
| `bgprobe.page.js` | the **live-measurement probe** (2026-09-26, for the tab-background question): a page script that samples a 1 Hz page timer, a `requestAnimationFrame` counter split visible/hidden, a 100 ms worker ticker and every `visibilitychange`, and reports them with `window.__bgReport()` / `__bgReset()` / `__bgStop()`. Live-only: its samples die with the page. |
| `keepawake-probe.page.js` | the **reload-proof** version of the same measurement (2026-09-26, for the keep-awake setting): samples a 250 ms timer **while hidden**, a 1 s timer while visible, a 100 ms worker, and the keep-awake preference at each sample, and **persists everything to `sessionStorage` (`yacbpg.awake.probe`)** so the numbers survive a preview reload / save. `window.__awakeReport()` reads the stored rows even in a page where the probe is not running (re-inject the file to start sampling again; `__awakeReset()` / `__awakeStop()`). It splits the hidden heartbeat gaps into *keep-awake off* vs *keep-awake on*, which is what shows whether the audio really defeated the throttling. Writes nothing to `localStorage`. |
| `make-fixtures.js` | regenerates `fixtures/*.json`. Run after a schema change; it writes only those three files. `blankPanel()` carries every per-panel field (so a new one, like `palette` in 2026.09.26.12, is added here first). |
| `make-baseline.js` | regenerates `devtests/shots/*.png`. See `shots/README.md`. |
| `restore-from-park.js` | writes `scratch/p0/last-park.json` back into the live page. |
| `shots/` | the visual baseline. |

### Why `core.test.js` extracts source text

The pure logic still lives inside one IIFE in `index.html`, so neither `page_eval` nor a worker can reach it
by name. The suite therefore reads `index.html`, pulls the named functions and constants out with a brace
matcher (`braceEnd`, the same one `scratch/inventory.js` used to build the function inventory), and builds
them into a sandbox with a fake `document`. That is deliberately temporary: **P1 moves these functions into
`src/core/*.js`, at which point the extraction is replaced by a real `import` of the module text via a blob
URL** — and this file is where that change lands first.

The extraction reports `missing` names, so a rename in `index.html` shows up as an explicit failure rather
than as a silent skip.

As of 2026.09.26.5 that replacement started (`src/core/zip.js`, `jsontext.js`, `keywords.js`, `seeds.js`, then
`prompt.js` and `library-core.js` in 2026.09.26.8), and **as of 2026.09.26.14 it is COMPLETE for all seven `src/core/`
modules**: `core.test.js` imports them, and every in-file copy has been deleted — `zip`/`jsontext`/`keywords`/`seeds` in
2026.09.26.9 and `prompt`/`library-core` in 2026.09.26.14. `index.html` keeps only a bare `let` declaration for each
name, `coreLoad()` fills it, the boot waits for the modules (`coreReady` / `window.appReady`), and `coreLoadWarning`
puts a bar at the top of the page if one cannot be loaded. **Since 2026.09.26.17 the same loader also carries
`src/state/store.js`** (P2 step 3, the state layer) **and since 2026.09.26.20 `src/state/commands.js`** (P3 step 1a,
the named commands), so the boot waits for **nine** modules. Only the DOM-bound names
that never became modules (`getEffectiveKeywords`, `applyPreset`) are still extracted by `braceEnd`/`grab` — plus
`ensurePages` since 2026.09.26.17, which is extracted *on purpose*: the store owns a pure copy of it, `index.html`'s
inline copy is what all ~30 existing callers still use, and the suite asserts the two agree over eight stored shapes
(the strangler rule, pinned while both copies exist) — and it is why that machinery survives in `core.test.js`, which
is also why `diff-core.js`, with no inline half left to compare against, could drop its copy of it (2026.09.26.14;
until then the deletion had slipped through `.10`, `.11`, `.12` and `.13`).
**Note the trade a deletion makes:** with no in-file copy, a module that cannot load leaves its name `undefined`,
which is why the boot waits for all nine and reports the failure instead of silently degrading.

### Why capture order matters in `visual-diff.js`

**2026-09-26.10 — root cause found, and fixed in the recipe.** The mystery was never the app and never a
mysterious "in-memory state": the `grid` subject called `switchMenu('file')`, and **`switchMenu` is a
*toggle***, not a setter. If a menu happened to be open when the subject ran, "click File" *closed* it; if
none was open, it *opened* it — and an open menu in a non-full-screen layout adds **224 CSS px** to the page
(a whole menu row, and a menu left open by the import path stays open for the rest of the group). So the
capture's height depended on the parked author state (`comicGen.activeMenu` / `comicGen.menuFullscreen` /
`comicGen.menuVisible`) and on which subject had run before it — which is exactly why the 224 px moved from
the light group to the dark group between two runs of the same build, and why the .9 A/B (new, old, new, old
at the same session position) came back identical: both builds were being measured with the menu in the same
state. The `grid` subject now **closes whatever menu is open** instead of toggling File, so every capture
starts from the same known state and the baseline compares cleanly (measured 2026-09-26.10: 13 of the 14
baselines pixel-identical, and the two `*-json` captures differing only where the project JSON legitimately
gained a panel `id` line).

**Historical note — the same artefact, diagnosed as a session effect.** The keep-awake release (2026.09.26.6,
a new preference row in the Edit menu) made the same phone/light captures wobble again, so "is the size change
the app or the harness?" was settled with an A/B instead: the *previous* `index.html` (kept at
`scratch/p1/index-old.html` during that session, 533,898 bytes) and the new one (540,294 bytes) were captured
**alternately in the same session at the same position** — new, old, new, old — with the identical fixture +
phone viewport + `grid` subject recipe. All four captures came back **243x3396 and pixel-identical to each
other** (0 differing pixels; the baseline's size). The builds differ by a whole preference row, so a
session-position effect was the only explanation available at the time. **A `sizeChanged` or non-zero
`differingPct` on the light/phone views is a harness artefact until proven otherwise — check the menu state
first, then re-capture in the baseline's order (or A/B it as above) before blaming a code change.**

The first full run of the visual check reported the three `desktop-light-*` captures differing from the
baseline by 11-19% of their pixels, and the two `phone-light-*` captures 224 CSS px taller. Re-running with the
light captures **first in the session** made all of them pixel-identical (0 differing pixels). The difference
was not the code: each capture is taken after five earlier "subjects" (json, analysis, dialog, storyboard,
focus), and some of them leave UI state — a menu, an accordion, a scroll position, a half-finished animation —
that depends on how the session got there, so the same recipe renders differently depending on what ran
before it. **Compare like with like:** run the baseline and the check in the same order, or capture a group
first. The park/restore protocol is what keeps this safe: the fixture import and the theme/viewport changes
are all hung under the park, and every run restores the author's map byte-for-byte.

**2026-09-26.12 — the baseline was intentionally regenerated.** The per-panel colour palette adds a control to every panel header, and it wraps onto a row of its own: **+74 CSS px** over the 6-panel desktop grid (two card rows) and **+214 px** on the phone single column, which is what all 14 captures showed as a `sizeChanged`. Before writing the new baseline the header was vision-verified in dark and light at desktop and phone widths; `make-baseline.js`'s `grid` subject was also aligned with `visual-diff.js`'s (close the active menu instead of `switchMenu('file')`), so the two recipes agree. The regenerated baseline then compared **12/14 pixel-identical**, the 2 `*-json` views differing by ~0.01% of pixels (the editor's text rows — the known small wobble).

### Ten harness traps (found 2026.09.26.8, .9, .13, .18, .19 and .20)

Each of these has cost time, and none of them was the app's fault. Read them before doubting a suite result.

1. **A tool result redacts `comicGen.githubToken` only when it is a *top-level key* of the returned object.**
   The runners park by dumping the whole map (`dumpParked`), which the harness redacts, and then compared
   `fnvOf(parkedMap)` against a hash the page had computed *with* the token — so `byteIdentical` printed `false`
   on a perfectly clean restore, and had been doing so silently. The fix is to compare like with like:
   `run-smoke.js`, `run-gen.js` and `run-fixtures.js` now use the page's own `park()` hash against the page's
   post-reload hash, and `visual-diff.js` / `make-baseline.js` hash both sides through a `noTok()` filter. The
   authoritative check remains `park.js`'s `restore().byteIdentical`, which never leaves the page.
2. **Never inject `devtests/park.js` on its own through `page_eval`.** Its last line used to be `return window.__park.park();`, so a bare injection **re-parks the live map** — and if the page is holding a *fixture* (which is exactly the state a frozen `visual-diff` run leaves behind), that silently overwrites the author's parked copy with the fixture. It happened on 2026-09-26 and cost an afternoon of recovery. `park.js` now ends with `window.__parkReady = true;` — injecting it only defines `window.__park` — and the five runners read the file directly (the old `strip()` regex was removed from `run-smoke.js`, `run-gen.js`, `run-fixtures.js`, `visual-diff.js` and `make-baseline.js`). **Recovery recipe if the park copy is ever lost again:** every runner dumps the author's map to `scratch/p0/parks/<name>-<timestamp>.json` *before* it touches anything, so write the newest one back with a `page_eval` that deletes every key and re-adds the file's map — reading the live `comicGen.githubToken` first, because the copy inside the file has been redacted by the tool result. Then `page_refresh` and check the project name, the panel count and the token length.
3. **A `sizeChanged` in the visual check can be a session artefact, not a code change.** 2026.09.26.8's run again
   reported the six dark views **112 CSS px taller** than the stored baseline (the light views pixel-identical),
   so the *previous* build was written back into the workspace and captured in the same session: **both builds
   produced identical numbers**, and the extraction touched no markup. That is the second independent A/B of the
   same conclusion as the addendum above — A/B first, blame later.

4. **A full-page `snapshot.js` capture paints the hidden password overlays, so a `vision` check of any dialog sees "Protect your hidden panels" behind it.** `#passwordOverlay` and `#ghBackupOverlay` both use `.password-overlay { display: flex }` with **no `[hidden]` guard**; what keeps them hidden in the real page is the platform's global `[hidden]{display:none!important}` rule, which the capture's cloned document does not carry, so the class wins and they render. It is a capture artifact — the live DOM (`getComputedStyle`) says `display:none` and `getBoundingClientRect` is `0×0` — so ignore the phantom dialog instead of diagnosing it. (It is also why the stored `desktop-dark-dialog` baseline shows the password box behind the delete confirmation.) **Re-confirmed 2026.09.26.21:** two full-page captures were reported by the `vision` pass as "a blocking modal is open — 'Protect your hidden panels'", while `#passwordOverlay.hidden === true` both immediately before and immediately after each capture and no `[id$="Overlay"]` was open — so when a `vision` read of a full-page capture claims a modal, check `hidden` in the live DOM before believing it.

5. **An FNV hash mismatch is a *hashing* artefact until the maps have been diffed field by field** (2026.09.26.18). `run-state-diff.js`'s first draft copied the `FNVSrc` line from the other runners with one escaping level too many — the page-side `__hash()` joined the map with a **literal backslash-n** while `park.js`'s `canon()` joins with a **real newline** — so every hash differed and a perfectly clean restore reported `byteIdentical: false`. The diagnosis is two lines: dump the live map and hash it *both* ways in the page; the real-newline hash came back equal to the parked one (`bb80c43e`) and the mis-escaped one equal to the reported mismatch (`a48b68bf`). `run-state-diff.js` now uses `join(String.fromCharCode(10))`, which cannot be mis-escaped. **Rule: when a hash mismatches, diff the parked file against the live map before believing anything was lost.** This is the same family as trap 1 (the redacted token) and as `comicGen.githubLastBackup` — a `ghPush` rewrites that timestamp, so a park hash taken before a backup and one taken after will differ with nothing wrong.

6. **The panel thumbnails' placeholder alt text paints in some sessions and not others, so a `grid` view can
   differ from its baseline by ~5% of its pixels** (2026.09.26.18, measured 2026-09-27). An ungenerated panel
   holds `<img id="img-panel-1-1" src="" alt="Click Generate to render image" loading="lazy" decoding="async">`
   in a 145×145 box, and the alt text only *sometimes* paints: a `vision` read of the differing region sees the
   clipped tail of it (`"img"`). Two `desktop-dark-grid` captures taken back-to-back in the same session came
   back **0 pixels apart**, and both differed from the stored baseline in exactly two bands (y 382–471 and
   531–619 of the 900×1368 capture — 62 200 px, 5.05%), with **everything outside those bands pixel-identical**;
   the `scratch/shots-new/` capture of the earlier run is byte-identical to the baseline, i.e. that session
   rendered the placeholders empty. The sizes agree exactly, so it cannot be a layout change, and the cause was
   not pinned past "session-level rendering of that placeholder" (font warm-up and the lazy-image state are the
   candidates). **Diagnosis: capture the same subject twice — if the repeats agree and only the thumbnail bands
   differ, it is this, and the baselines do not need regenerating.** Not to be confused with the `*-json`
   views, which always differ by ~0.01% of pixels because the editor legitimately shows a freshly generated
   panel `id` (`p-muiubwou-lipsld` vs `p-mujc7e4g-ucwhme` in the 2026.09.26.18 run).

7. **An `*-analysis` capture is only comparable to a baseline made with the same project library** (2026.09.26.19, measured 2026-09-27). `renderAnalysis()` sizes its table from `loadLibraryObjects()` — the *project* library, which in a capture means whatever the fixture import lands. `fixtures/full-page.json` carries **four** items in its top-level `libObjects` (and no `settings.library`), and the import path falls back to `libObjects`, so the analysis view renders four library columns and a correspondingly taller table. The committed `*-analysis` baselines were captured when that number was different, which makes them **stale since the fixture gained its own library in 2026.09.26.15** — measured at `.19`, `desktop-dark-analysis` rendered 900×1479 against the baseline's 900×1368 (**+222 CSS px**). Four wedged-preview freezes hid it: no full visual run had completed since. **Before blaming a code change for an analysis delta, run the two-line test the `.19` session used:** `renderAnalysis(); analysisAutoGrowAll();` (a re-render of the same state must be 0 pixels — it was), then an in-page A/B that restores the *previous* save path (`window.savePanelState = … collectPanelState()`) and re-renders that same view (also 0 pixels; the view measured 2367 CSS px, 12 columns, 4 library items, 6 panels). The baseline refresh is queued in `PENDING.md`.
   **Re-measured at 2026.09.26.20 — the staleness does not reproduce on the capture path.** With the fixture imported and `analysisAutoGrowAll()` *not* called, `desktop-dark-analysis` renders **900×1368, the baseline's exact size** (and 10,204 px of difference, all inside trap 6's thumbnail bands) — so the `+222 px` came from the auto-grow step in the `.19` measurement, not from the ordinary capture. Both builds were measured in one session: `.19` and `.20` render the analysis view at the same 7 columns / 5 rows / 532 px table / 2189 px body on the fixture, and the same 5 / 3 / 405 / 1297 on the author's project. The queued baseline refresh is therefore **cosmetic, not a stale-data fix** — worth doing when a visual run next completes, but never a code-change signal.

8. **`set_viewport_size` to the size the preview already has hangs the tool call** (2026.09.26.20). Calling it with the current `innerWidth`/`innerHeight` (a no-op) never returns, which silently eats a whole orchestration's budget — an `execute_js` script that called it at the top of every plan hung with **no console output at all** (a timed-out worker's console output is dropped, so the failure looked like a mystery). Always poll `page_eval({js:"return {iw:innerWidth,ih:innerHeight}"})` first and skip the call when it already matches.

9. **One heavy `page_eval` per `page_refresh`** (2026.09.26.20). A `page_eval` that reads thousands of elements — `getComputedStyle` in a loop, `document.querySelectorAll("*")`, or `textContent` on an element that wraps the whole page (where the first version of the layout fingerprint went wrong: `String(el.textContent)` on an ancestor of everything is megabytes, *per element*) — can wedge the harness's render detection, after which the *next* `page_eval` times out (and a nested `tools.page_eval` from inside `execute_js` may never return at all). Take one heavy measurement, then `page_refresh` before the next. If a run hangs with no console output, bisect by writing a marker to a workspace file at each step: the files survive the worker being torn down, the logs do not.

10. **A wedge that reproduces with the PREVIOUS build loaded is the platform's, not the release's** (2026.09.26.20). The wedged-preview state killed three image runs in one session; the third happened while the workspace `index.html` had been swapped back to the *previous* build for an A/B, which is exactly what proves the freeze is not the change under test. When a visual run dies, spend the next one asking "does it die on the old build too?" before hunting a bug in the new one — and keep a safety copy of the swap target in `scratch/` while swapping, because a torn-down worker can leave the wrong `index.html` in the workspace (`filesWritten` is the only clue about what landed).
   **When the image path is unusable, the DOM fingerprint is the stronger check anyway.** Instead of pixels, take a fingerprint of every element with an id — id, tag, rounded `getBoundingClientRect`, computed `display`/`visibility`/`opacity`/`fontSize`/`color`/`backgroundColor`, `value`, leaf `textContent`, and the `hidden`/`display:none` flags — plus `body.scrollHeight`, and compare the **two builds in the same session**. Normalise the version string (`2026\.09\.26\.\d+` → `VV`) first: the stamp appears **11 times** in the page, so without that every A/B "differs". At 2026.09.26.20 this turned an unusable 14-view run into a byte-exact statement about 2,125 elements (`.19` and `.20` both `8eee1954`, 213,179 chars).

### Measuring the hidden-tab throttling (and whether keep-awake defeats it)

`bgprobe.page.js` and `keepawake-probe.page.js` are not suites — they are measurements, and they are run by hand:

```
read devtests/keepawake-probe.page.js  →  execute_js with that text      (installs the probe in the live page)
```

…then the author leaves the tab for ~45 s and comes back, and the next session reads the stored rows (re-injecting
the file also works, and `window.__awakeReport()` alone works in a page where the probe is not running — that is the
whole point of the `sessionStorage` copy).

What the report contains and how to read it:

- `hiddenHeartbeatGap_awakeOff` / `hiddenHeartbeatGap_awakeOn` — the gaps between the 250 ms heartbeat samples
  **while the page was hidden**, split by whether `comicGen.keepAwake` was `"1"` at the time. This is the whole
  experiment: with the setting off, a throttled tab shows a median gap near the engine's clamp (Firefox 1000 ms;
  Chromium 1000 ms, and 60 000 ms once its *intensive* stage kicks in after 5 hidden minutes); with it on, a
  working keep-awake leaves the median near 250 ms.
- `hiddenSpans` — when the page was hidden, for how long, and whether keep-awake was on.
- `raf.visible` / `raf.hidden` — a background page stops animating (`requestAnimationFrame` is suspended while
  hidden); a page that is merely *throttled* still gets ~1 fps in Firefox, which is a useful second opinion.
- `worker.gapMs` — the 100 ms blob-URL worker: worker timers are **not** throttled the way page timers are, so a
  worker that keeps its 100 ms rhythm while the page timer stretches to 1000 ms is proof that the throttling is
  per-page and that `execute_js` work is much less affected by it.
- `ua` — recorded, because all of this is engine behaviour and the answer differs per browser.

Baseline recorded on the author's machine (Firefox 156 / Windows, 2026-09-26): visible page timer 1005–1014 ms,
rAF ≈ 56–61 fps, worker 100.7 ms/tick.

**The measurement itself, run by the author on 2026-09-26** — both halves of the A/B, same page, same machine,
the preference flipped between them:

| state | hidden time measured | samples | min | median | p90 | max |
|---|---|---|---|---|---|---|
| keep-awake off (control) | 190 s | 189 | 724 ms | **1005 ms** | 1014 ms | 1077 ms |
| keep-awake on | ~6 min | 1374 | 249 ms | **262 ms** | 265 ms | 5 h 59 m (the laptop asleep) |

Off, the 250 ms heartbeat is pinned to Firefox's hidden clamp: 189 samples in a 190 s period is ~1 Hz, exactly
`dom.min_background_timeout_value = 1000`. On, the same timer ran at a 262 ms median (1371 of 1374 gaps under
400 ms). **The silent tone defeats the throttling** — 3.8× the off rate, same interval, same machine.

Three things the same run teaches:

- **Read the spans, not the wall clock.** The overnight hidden period was 9 h 33 m, but the laptop slept through
  9 h 28 m of it (two heartbeat gaps: 3 h 28 m and 5 h 59 m). A suspended machine stops the timers too, and only
  the ~5.5 min it was awake *and* hidden is a measurement.
- **The sample counts come from the live probe's full in-memory list.** `P.save()` keeps only the most recent 900
  rows in `sessionStorage` (that is what makes the numbers survive a reload), so a later `__awakeReport()` can
  report fewer samples than the table above. The medians are unaffected — they are per-row, not per-run.
- **`raf.hidden` stayed at 28 frames in total.** Keep-awake holds the timers, not the rendering — a background
  run keeps ticking while the screen is not being redrawn.

## Running them

Each `*.js` here is an `execute_js` body (it uses `fs` and `tools`). From a session:

```
read devtests/run-smoke.js  →  execute_js with that text
read devtests/core.test.js  →  execute_js with that text     (no page needed)
read devtests/diff-core.js  →  execute_js with that text     (no page needed; run after any extraction)
read devtests/run-state-diff.js → execute_js with that text (parks, imports the fixtures, compares the store against collectPanelState(), restores)
read devtests/visual-diff.js →  execute_js with that text    (parks, captures, compares, restores)
```

The runners are self-contained: they read the suite files, park, run, restore, reload and verify. They return
a compact report (pass/fail counts, failure lines, `byteIdentical`) and write the full per-check results to
`scratch/p0/*.json`.

## What P0 still does not cover

- **Images**: copy-to-other-panel, download-one/all, and the upscale path touch the clipboard, the file system
  and canvas, so they are manual checks (`gen.page.js` MAN:19).
- **`ghTest`/`ghPush`**: network and a live token; verified by hand at the end of every release. The *list of
  files* ghPush uploads is checked automatically — `diff-core.js` fails if a `src/` module is missing
  from `index.html`'s `GH_SRC_FILES`, because a module that is not in that manifest would never be backed up.
- **Not-exported internals**: `getPanelSeed`, `pinPanelSeedForRun`, `scrubMinusOneSeeds` (in the page),
  `cascadePageSequence`, `reflowInsertOnFullPage`, `isSlotProtected`, `setSlotProtected`, `buildExportData`,
  `applyImportedSettings`, `analysisFillCell`, `deleteLibraryObject`, `countLibReferences`. What they do is
  covered indirectly through the exported surface and the DOM; P1's extraction makes them directly testable.
- **An unknown `version` file** is rejected with a status message and no state change; currently a manual check.
- **The four manual lines** are `MAN:22b` (the private reflow helpers, covered indirectly by `G3` and by P1),
  `MAN:40` (a cross-reference: the seed offsets and the `-1` scrub are automated in `gen.page.js` `G15:3` /
  `G15:5`), `MAN:67` (protected slots, automated in `gen.page.js`) and `MAN:75` (`ghTest`/`ghPush`). Nothing in
  the invariant list is left without a check: `§21.11` (the selection is ephemeral) is pinned by `G15:72`, and
  `G15:73`/`G15:74` cover the copy / cut / paste clipboard that the selection drives.
