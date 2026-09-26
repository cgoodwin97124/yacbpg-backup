# The visual baseline

15 screenshots of the **fixture** project, not of the author's project — deterministic content, no images, so a
diff after a refactor step means the code changed and not the data. Compare them with the `vision` tool (or by
eye) after each phase; the exit criteria for P5 ("the same screenshots as the P0 baselines") refer to these.

## The recipe

Regenerate with `devtests/make-baseline.js` (an `execute_js` body). It parks the author's live state, imports
`fixtures/full-page.json` through the real import path, **reduces page 1 to 6 panels** (24 panels at a scaled
viewport made the snapshot step heavy enough to freeze the preview twice), then captures:

| File | Viewport | Theme | Subject |
|---|---|---|---|
| `desktop-dark-grid.png` | 1440×900 | dark | the panel grid, File menu open, scrolled to top |
| `desktop-dark-json.png` | 1440×900 | dark | the project JSON editor overlay |
| `desktop-dark-analysis.png` | 1440×900 | dark | the analysis matrix, page 1 |
| `desktop-dark-dialog.png` | 1440×900 | dark | the batch-delete confirmation (panels 1–3 selected) |
| `desktop-dark-storyboard.png` | 1440×900 | dark | the storyboard overlay |
| `desktop-dark-focus.png` | 1440×900 | dark | the focus view on panel 1 |
| `desktop-light-grid.png` / `-json` / `-analysis` | 1440×900 | light | the same three surfaces in the light theme |
| `phone-dark-grid.png` / `-analysis` / `-focus` | 390×844 | dark | the same three on a phone |
| `phone-light-grid.png` / `-dialog.png` | 390×844 | light | the grid and the confirmation dialog |

Capture details, all of which matter for reproducibility:

- `snapshot.capture(document.body, { scale: 0.5 })` — the **explicit scale** is required. The helper's default
  scales to fit a 1600 px cap, so at a 1440 CSS px viewport (devicePixelRatio 1.25) the file comes out
  1600×1512 instead of 1800×1701, and at other times it produced a 26 px wide image mid-relayout.
- The viewport must be **verified, not assumed**: `set_viewport_size` propagates asynchronously, so the runner
  polls `innerWidth`/`innerHeight` (up to 10 s) and refuses to capture until they match the plan. Each shot
  records the observed size in the run report.
- Each subject starts from a known UI state: any open choice dialog is dismissed, the panel selection cleared,
  the theme set explicitly, the page scrolled to the top, then a 700 ms settle before the capture.

The PNGs are 900×1331 for the desktop subjects (243×3396 for the phone grid, which is one column tall) — about
75–125 KB each, ~1.5 MB in total.

## What these are for

P1, P2 and P4 must not change any of these files. A diff is not automatically a bug — the light-theme and phone
shots are the ones most likely to catch a real regression (a hard-coded colour, a fixed width, a layout that
only works with two columns), and the JSON/analysis/dialog shots catch the surfaces with the most CSS.
