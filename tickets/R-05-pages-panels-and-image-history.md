---
ticket: R-05
title: "Pages, the 24-panel rule, and whether images should keep a history"
kind: direction
status: answered
answers: 4/4
form: yacbpg-refactor-2026-09-26
updated: 2026-09-26T03:25:42.209Z
---

# R-05 — Pages, the 24-panel rule, and whether images should keep a history

- **Kind:** direction
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-26T03:25:42.209Z

## Original request (verbatim)

> These are behaviour questions the roadmap has to answer before P3/P4, because they decide how panels and images are modelled.

## Clarification questions & answers

### 5a. Today a page holds at most 24 panels and anything beyond that overflows onto the following page automatically. Keep that, or should a page simply grow and scroll?

- **Answer:** Let a page grow: drop the 24 cap and scroll (no more overflow, no more pages needed)
- **Note:** I think how many panels a page can have should be up to the user.  I sort of chose the 24 panel per page and 4 image per panel limits somewhat arbitrarily.  Honestly, I think pagination should be done by the user when the user decides it's time.

### 5b. How much do you actually use multiple pages?

- **Answer:** I use pages, but only as a way to get past the 24-panel limit
- **Note:** I haven't been using it so much for creating comics as for generating images, but the intent is to use it to create comics.

### 5c. Should each image slot be able to keep a small history of what was rendered there (the last few renders, each with its seed, so you can go back to an earlier variant), or is only the current image ever needed? (History costs memory — a few hundred KB per kept image.)

- **Answer:** Not sure — decide based on what it does to performance
- **Note:** I found myself with images I really liked but the prompts being lost when I started editing the library descriptions.  Maybe a way for me to manually add these to either the in-project history or a separate history file?  If that makes sense?

### 5d. Which page-related conveniences would you want, if pages became first-class? (Tick anything interesting.)

- **Answer:** A page filmstrip with thumbnails, so I can see and click pages instead of using a dropdown; Drag pages to reorder them; A different art style or palette for one page while the rest of the project stays on the global style
- **Note:** Actually the idea of dragging to reorder sounds wonderful, but I'm thinking the user should be able to drag panels around pages.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
