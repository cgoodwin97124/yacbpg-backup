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

The four runners (`run-smoke.js`, `run-gen.js`, `run-fixtures.js`, `make-baseline.js`) all follow the same
shape, and it is the shape to copy for a new one:
+
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
| `smoke.page.js` + `run-smoke.js` | the capability walk: 77 checks over the factory reset, pages, panels and reflow, content and the freeze rule, prompt composition and override invalidation, seeds, keywords and presets, the library, export/zip/import round trips, the JSON editor, the analysis matrix, the views, confirmations, the preferences (including the keep-awake setting, checks 76–77), and the panel selection + clipboard (`G15`, which is what pins invariant §21.11 — the selection is DOM-only and never reaches the save). 73 pass, 3 manual lines + 1 cross-reference line. |
| `gen.page.js` + `run-gen.js` | the generation engine against a stubbed `root.generateImage`: skip/protected/failed paths, seed offsets and pinning, the same-seed flag, prompt history, pause and stop settling cleanly, the run tally, and the 2026.09.26.4 background gate in both directions. 18 pass, 1 manual. |
| `fixtures.page.js` + `run-fixtures.js` | imports every file in `fixtures/` through the real import path and asserts what came back. 16 pass. |
| `core.test.js` | the DOM-free suite. Extracts `crc32`, `initCrcTable`, `buildZip`, `inflateRawDeflate`, `unzipEntries`, `scrubMinusOneSeeds`, `getEffectiveKeywords`, `applyPreset`, `ART_STYLES`, `COLOR_PALETTES`, `JSON_NUM_RE`, `jsonTokenize`, `jsonDecodeRaw` and `jsonParse` **out of `index.html` by name** and runs them in a worker against a fake `document`. 14 pass. |
| `diff-core.js` | the **differential** suite for `src/core/*.js` (P1). Extracts the same functions out of `index.html`, imports each module by blob URL, and asserts the two agree over generated input: 300 CRC buffers, 120 zips (byte-identical with the timestamps masked, plus 480 cross-reads), 50 data URLs, 40 deflate streams, 600 JSON texts (200 documents + 400 mutations of them, including the error message and span), 150 escape-heavy strings, the 12 styles × 9 palettes tables, 400 keyword/NSFW combinations, 400 seed inputs, 300 (seed, k, same) triples, 200 scrubbed documents. Also asserts that every discovered `src/core/*.js` is listed in `index.html`'s `GH_SRC_FILES` (the ghPush manifest) — a module that is not in that manifest would never be backed up. 21 pass. **Run it after every extraction.** |
| `visual-diff.js` | the **visual regression check**: re-captures the `devtests/shots/` baseline into `scratch/shots-*` and compares it pixel-by-pixel with the stored PNG (differing pixels, mean/max channel delta). It uses the same park/restore protocol. **Capture order matters** — see the note below. |
| `bgprobe.page.js` | the **live-measurement probe** (2026-09-26, for the tab-background question): a page script that samples a 1 Hz page timer, a `requestAnimationFrame` counter split visible/hidden, a 100 ms worker ticker and every `visibilitychange`, and reports them with `window.__bgReport()` / `__bgReset()` / `__bgStop()`. Live-only: its samples die with the page. |
| `keepawake-probe.page.js` | the **reload-proof** version of the same measurement (2026-09-26, for the keep-awake setting): samples a 250 ms timer **while hidden**, a 1 s timer while visible, a 100 ms worker, and the keep-awake preference at each sample, and **persists everything to `sessionStorage` (`yacbpg.awake.probe`)** so the numbers survive a preview reload / save. `window.__awakeReport()` reads the stored rows even in a page where the probe is not running (re-inject the file to start sampling again; `__awakeReset()` / `__awakeStop()`). It splits the hidden heartbeat gaps into *keep-awake off* vs *keep-awake on*, which is what shows whether the audio really defeated the throttling. Writes nothing to `localStorage`. |
| `make-fixtures.js` | regenerates `fixtures/*.json`. Run after a schema change; it writes only those three files. |
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

As of 2026.09.26.5 that replacement has started: `src/core/zip.js`, `jsontext.js`, `keywords.js` and
`seeds.js` exist, `index.html` loads each one through `coreLoad()` and swaps its inline copy for the module's,
and `diff-core.js` compares module against inline copy. The inline copies stay in `index.html` as the fallback
(and as the extraction source) until the module has survived a release; then the copy is deleted and
`core.test.js` imports the module instead.

### Why capture order matters in `visual-diff.js`

**2026-09-26 addendum — it is the harness's session state, not the app.** The keep-awake release (2026.09.26.6,
a new preference row in the Edit menu) made the same phone/light captures wobble again, so the question "is the
size change the app or the harness?" was settled with an A/B instead of an argument: the *previous* `index.html`
(kept at `scratch/p1/index-old.html` during that session, 533,898 bytes) and the new one (540,294 bytes) were
captured **alternately in the same session at the same position** — new, old, new, old — with the identical
fixture + phone viewport + `grid` subject recipe. All four captures came back **243x3396 and pixel-identical to
each other** (0 differing pixels; the baseline's size). The builds differ by a whole preference row, so a
session-position effect is the only thing that can explain the visual-diff runs' 3508-px captures. Conclusion:
**a `sizeChanged` or non-zero `differingPct` on the light/phone views is a harness artefact until proven
otherwise — re-capture in the baseline's order (or A/B it as above) before blaming a code change.**

The first full run of the visual check reported the three `desktop-light-*` captures differing from the
baseline by 11-19% of their pixels, and the two `phone-light-*` captures 224 CSS px taller. Re-running with the
light captures **first in the session** made all of them pixel-identical (0 differing pixels). The difference
was not the code: each capture is taken after five earlier "subjects" (json, analysis, dialog, storyboard,
focus), and some of them leave in-memory state - an accordion, a scroll position, a half-finished animation -
that depends on how the session got there, so the same recipe renders differently depending on what ran
before it. **Compare like with like:** run the baseline and the check in the same order, or capture a group
first. The park/restore protocol is what keeps this safe: the fixture import and the theme/viewport changes
are all hung under the park, and every run restores the author's map byte-for-byte.

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
rAF ≈ 56–61 fps, worker 100.7 ms/tick. The hidden numbers with the setting on and off are the measurement the
author's switch supplies.

## Running them

Each `*.js` here is an `execute_js` body (it uses `fs` and `tools`). From a session:

```
read devtests/run-smoke.js  →  execute_js with that text
read devtests/core.test.js  →  execute_js with that text     (no page needed)
read devtests/diff-core.js  →  execute_js with that text     (no page needed; run after any extraction)
read devtests/visual-diff.js →  execute_js with that text    (parks, captures, compares, restores)
```

The runners are self-contained: they read the suite files, park, run, restore, reload and verify. They return
a compact report (pass/fail counts, failure lines, `byteIdentical`) and write the full per-check results to
`scratch/p0/*.json`.

## What P0 still does not cover

- **Images**: copy-to-other-panel, download-one/all, and the upscale path touch the clipboard, the file system
  and canvas, so they are manual checks (`gen.page.js` MAN:19).
- **`ghTest`/`ghPush`**: network and a live token; verified by hand at the end of every release. The *list of
  files* ghPush uploads is checked automatically — `diff-core.js` fails if a `src/core/*.js` module is missing
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
