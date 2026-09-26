---
ticket: R-07
title: "Which interface ideas do you want, and what must stay exactly as it is?"
kind: ui
status: answered
answers: 3/3
form: yacbpg-refactor-2026-09-26
updated: 2026-09-26T03:25:44.493Z
---

# R-07 — Which interface ideas do you want, and what must stay exactly as it is?

- **Kind:** ui
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 3 of 3
- **Answered:** 2026-09-26T03:25:44.493Z

## Original request (verbatim)

> A checklist of the concrete interface ideas in UI-IDEAS.md, plus the list of things that must not be touched.

## Clarification questions & answers

### 7a. Tick everything you would want (I will sequence them — ticking is not a promise to build it immediately).

- **Answer:** A run panel: a queue of panels being rendered, with progress, pause/stop and a re-roll per panel; Variant rendering as a first-class action ('give me 3 more takes of this panel') with a version strip per image; A prompt inspector that shows the assembled prompt as labelled parts (globals · style · each character · location · action) instead of one blob, so I can see why a phrase is in there; A page filmstrip with thumbnails instead of a page dropdown; A library picker with search, filters and thumbnails instead of a dropdown, plus a marker showing when a panel's text has drifted from the library; Undo everywhere (not just in the JSON editor) with an 'Undo delete 2 panels' button; One consistent dialog style for every destructive action, with a 'just this panel' escape and a 5-second undo; A first-run sample project and a three-step 'getting started' checklist; An accessibility pass (real buttons, focus handling in overlays, screen-reader labels); One notification area instead of several status lines scattered around

### 7b. Of everything you ticked above, which one would improve your day the most — and why?

- **Answer:** The run panel!  I hate that taking focus off the browser page loses image generation, but I understand if this is a limitation of the medium. If I'm putting things into priority order: 

* Run panel
* Library picker
* Prompt inspector
* Consistent dialog style for destructive actions
* One notification area

### 7c. Tick everything that must stay recognisable (I will treat these as constraints, not suggestions).

- **Answer:** The amber / dark look and the colour-preset aesthetics; The full-screen menu on a phone
- **Note:** So far, Generate All has been less useful to me the more panels there are, just because I have to keep the browser tab open while it's going.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
