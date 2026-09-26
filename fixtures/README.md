# Fixtures — known project files

Loadable project files for the regression harness. Each one is a **settings export** in the exact shape
`buildExportData()` produces (`{version, exportedAt, settings, preset, libObjects, layoutMode, ...}`), so a
fixture goes in through the app's real import path — `devtests/run-fixtures.js` hands the file to the same
`#importSettingsInput` a user's file chooser feeds and answers the "Save & Import" prompt with **Continue**
(the safe button; `Save & Import` opens a native file picker and must never be clicked by a test).

Regenerate them after a schema change with `devtests/make-fixtures.js` (an `execute_js` script — it writes
the three files and nothing else). They are hand-authored data, not app output, which is the point: the app
must still be able to load files it did not write.

## `full-page.json` — 49 KB, version 2

The "everything at once" fixture. Three pages; library objects `Fixture Hero`, `Fixture Sidekick`,
`Fixture Rooftop`, `Fixture Action`.

| Page | `panelCountSel` | What it pins down |
|---|---|---|
| 1 "The Long Page" | `24` | a full page: mixed character/location/extra content, per-panel `imgCount` 4/2/1, panel 2 seed `4242`, panel 3 `sameSeed`, panel 4 `style: "photo"`, panel 5 `sizeSel: "custom"` 640×960, panel 6 a 🔒 protected slot 1, panel 7 a `promptOverride`, panel 8 one `promptHistory` entry, panel 9 a display-only title |
| 2 "Short Page With Hidden Panels" | `custom` / `3` | the off-page trap: the page shows 3 panels but slots 4–6 still carry content (the app writes all 24 slots on save, so this is what a real file looks like) |
| 3 "One Panel Page" | `1` | a one-panel page with a page seed and a hand-written Basic Description |

Expected after import (asserted by `devtests/fixtures.page.js` FX1–FX7): project name `Fixture Full Page`,
3 pages, page 1 showing 24 panels, every override above intact, a re-export that still carries page 2's
hidden slots, and a JSON editor that opens and parses the result.

## `legacy-v1.json` — 3 KB, version 1

The migration-ladder fixture: `version: 1`, page 1 (`custom`/`2`), and the legacy shapes the map lists as
dead but still tolerated —

- `charLibrary` / `locLibrary` / `actLibrary` arrays at the top level (no `libObjects`),
- `panel.extras = [{type, sel, desc}]` on both panels,
- `chars[].persist`, `locPersist`, `actPersist`.

Expected: both panels import; the extras fold in (`migratePanelExtras`) — panel 1 gains a character extra
"from the extras array", its location `lib:loc:legacy-loc-1` and the action "an action recovered from
extras"; panel 2 gains "only in extras" and "legacy action text". The three legacy libraries are **merged
into the existing browser library** (by id, skipping duplicates) and the three legacy `localStorage` keys
are consumed. Note the asymmetry that falls out of this: a **v2** file replaces the browser library with its
own `libObjects`, while a **v1** file merges its legacy libraries into whatever the browser already has.
Recorded in `REFACTOR-NOTES.md` §3 because the P2 project-owned-library work has to decide what an import
should do to the browser catalogue.

## `legacy-keys.json` — 50 KB, version 2

Tolerance fixture: `full-page.json` plus every dead key at once — `undoProject` in the settings, a
`charLibrary` alongside a real `libObjects`, `watchdogReloads`, per-panel `persist` / `locPersist` /
`actPersist`, and an `extras` entry on panel 9 (a panel that already has a location, so the fold must skip
it) plus `extras` on panel 10.

Expected: loads clean, page structure identical to `full-page.json`, the dead per-panel keys are gone, panel
10's character and action survive, panel 9's location is untouched by the extras entry, and a re-export
contains none of the dead key names.

## Not here

A **v0/unknown-shape** file and a **zip with images** are covered elsewhere: the zip path already has
`samples/cow-in-field.zip` (the author's own project, imported by hand), and an unknown `version` must be
rejected rather than migrated — which `devtests/fixtures.page.js` does not attempt because the failure path
writes a status message and no state, and is currently checked by hand.
