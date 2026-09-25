---
ticket: T-05
title: "Recent-file count configurable under Edit → Preferences"
kind: feature
status: answered
answers: 3/3
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:21.147Z
generator: f0vstb2fbe
---

# T-05 — Recent-file count configurable under Edit → Preferences

- **Kind:** feature
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 3 of 3
- **Answered:** 2026-09-25T01:30:21.147Z

## Original request (verbatim)

> Let's add in: Allow the number of recent filename/paths kept to be configured by the user under Edit -> Preferences.

## Clarification questions & answers

### 5a. What shape should the “number of recent files kept” control take?

- **Answer:** Something else — see my notes
- **Note:** Can we do it as a "spinner" control?  I think that's what it's called. User enterable, or click up/down arrows.

### 5b. Should 0 be allowed, meaning the Recent list is hidden entirely?

- **Answer:** Yes — 0 hides the Recent list completely (recommended)
- **Note:** Yes, but keep the default five entries in memory anyway, and continue to populate them, just hidden.  If the user sets it up to five it will display that many, but there won't be any more in memory to display.

### 5c. Stored as a browser preference (comicGen.recentMax), separate from the project — agreed? (It cannot be project data: the file handles it counts are per-browser.)

- **Answer:** Yes — browser preference (recommended)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
