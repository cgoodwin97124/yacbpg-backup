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
| `smoke.page.js` + `run-smoke.js` | the capability walk: 72 checks over the factory reset, pages, panels and reflow, content and the freeze rule, prompt composition and override invalidation, seeds, keywords and presets, the library, export/zip/import round trips, the JSON editor, the analysis matrix, the views, confirmations and the preferences. 68 pass, 4 are explicit manual lines. |
| `gen.page.js` + `run-gen.js` | the generation engine against a stubbed `root.generateImage`: skip/protected/failed paths, seed offsets and pinning, the same-seed flag, prompt history, pause and stop settling cleanly, the run tally, and the 2026.09.26.4 background gate in both directions. 18 pass, 1 manual. |
| `fixtures.page.js` + `run-fixtures.js` | imports every file in `fixtures/` through the real import path and asserts what came back. 16 pass. |
| `core.test.js` | the DOM-free suite. Extracts `crc32`, `initCrcTable`, `buildZip`, `inflateRawDeflate`, `unzipEntries`, `scrubMinusOneSeeds`, `getEffectiveKeywords`, `applyPreset`, `ART_STYLES`, `COLOR_PALETTES`, `JSON_NUM_RE`, `jsonTokenize`, `jsonDecodeRaw` and `jsonParse` **out of `index.html` by name** and runs them in a worker against a fake `document`. 14 pass. |
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

## Running them

Each `*.js` here is an `execute_js` body (it uses `fs` and `tools`). From a session:

```
read devtests/run-smoke.js  →  execute_js with that text
read devtests/core.test.js  →  execute_js with that text     (no page needed)
```

The runners are self-contained: they read the suite files, park, run, restore, reload and verify. They return
a compact report (pass/fail counts, failure lines, `byteIdentical`) and write the full per-check results to
`scratch/p0/*.json`.

## What P0 still does not cover

- **Images**: copy-to-other-panel, download-one/all, and the upscale path touch the clipboard, the file system
  and canvas, so they are manual checks (`gen.page.js` MAN:19).
- **`ghTest`/`ghPush`**: network and a live token; verified by hand at the end of every release.
- **Not-exported internals**: `getPanelSeed`, `pinPanelSeedForRun`, `scrubMinusOneSeeds` (in the page),
  `cascadePageSequence`, `reflowInsertOnFullPage`, `isSlotProtected`, `setSlotProtected`, `buildExportData`,
  `applyImportedSettings`, `analysisFillCell`, `deleteLibraryObject`, `countLibReferences`. What they do is
  covered indirectly through the exported surface and the DOM; P1's extraction makes them directly testable.
- **An unknown `version` file** is rejected with a status message and no state change; currently a manual check.
