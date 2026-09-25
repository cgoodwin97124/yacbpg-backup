---
ticket: T-01
title: "“Generate To Here” chip in the Panel menu"
kind: feature
status: answered
answers: 3/3
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:15.565Z
generator: f0vstb2fbe
---

# T-01 — “Generate To Here” chip in the Panel menu

- **Kind:** feature
- **Status:** answered (answered — awaiting the implementation go-ahead)
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

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
