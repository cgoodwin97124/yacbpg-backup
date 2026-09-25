---
ticket: T-01
title: "“Generate To Here” chip in the Panel menu"
kind: feature
status: done
released: 2026.09.25.1
answers: 3/3
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:15.565Z
generator: f0vstb2fbe
---

# T-01 — “Generate To Here” chip in the Panel menu

- **Kind:** feature
- **Status:** done — shipped in **2026.09.25.1** (2026-09-25)
- **Answers:** 3 of 3
- **Answered:** 2026-09-25T01:30:15.565Z

## Original request (verbatim)

> I'd like a "Generate To Here" button to go with "Generate From Here" under the Panel menu. Clicking this button will generate all of the current page's panels from panel 1 up to and including the panel where it was clicked.

## Clarification questions & answers

### 1a. Label and placement for the new chip in the Panel menu.

- **Answer:** ⚡ Generate All To Here — placed between 🔄 Generate and ⚡ Generate All From Here (recommended)

### 1b. With several panels multi-selected, ⚡ Generate All From Here starts at the FIRST selected panel. Should ⚡ Generate All To Here mirror that and finish at the LAST selected panel?

- **Answer:** Yes — mirror the selection: generate panels 1 … last-selected (recommended)
- **Note:** Maybe we do a "Generate (x) to (y)" button also that lets the user choose an inclusive range of panels to generate.

### 1c. After pausing a To-Here run, ⚡ Generate All currently resumes to the end of the page (a pre-existing quirk of the explicit-list path). What should happen?

- **Answer:** Remember the To-Here end panel and resume only up to it

## Implementation

T-01 — shipped in **2026.09.25.1** (2026-09-25) — see CHANGELOG.md and DEV-NOTES.md (BATCH 2026.09.25.1).

- New chip `#panel-gento-btn-i`, placed BETWEEN 🔄 Generate and ⚡ Generate All From Here in the panel's ⚙ Panel accordion; `panelGenerateToHereAction(i)` mirrors the multi-selection for its end panel (the LAST selected one) and then calls the existing `generateComicPage(null, panelList)` with `[1 … end]`.
- Answer 1c is done with a new `runEndPanel` module variable: the run records the end panel it is aiming for, so a paused run resumes from where it stopped but clamps its end to that panel (cleared by Stop / halt / page switch).
- Verified live with a call-counting `root.generateImage` stub: multi-select 2+5 then To Here on 2 → exactly 5 calls; To Here on 3 → 3 calls; a plain ⚡ Generate All afterwards → the whole page. Pausing a To-Here(3) run printed "Paused — … continue from panel 2." and the resumed run made exactly 2 calls, never touching the later panels.
- 1b's note (an arbitrary "Generate (x) to (y)" chip) is logged as its own QUEUED item in PENDING.md with open questions — it was NOT part of this release.
