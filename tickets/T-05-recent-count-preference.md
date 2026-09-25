---
ticket: T-05
title: "Recent-file count configurable under Edit → Preferences"
kind: feature
status: done
released: 2026.09.25.1
answers: 3/3
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:21.147Z
generator: f0vstb2fbe
---

# T-05 — Recent-file count configurable under Edit → Preferences

- **Kind:** feature
- **Status:** done — shipped in **2026.09.25.1** (2026-09-25)
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

T-05 — shipped in **2026.09.25.1** (2026-09-25), together with T-03 — see CHANGELOG.md and DEV-NOTES.md (BATCH 2026.09.25.1).

- `#prefRecentMax` is a spinner (`<input type="number" min="0" max="50">`) in a `pref-row` under a new "Recent files" heading in 🎨 Edit → Preferences (answer 5a). It persists as `comicGen.recentMax` — a per-browser preference, never project data (5c).
- 0 hides the Recent list entirely and replaces it with a short explanation (5b).
- Answer 5b's extra rule, as confirmed on 2026-09-25 (T-05/5b): the STORED list always keeps at least the newest FIVE regardless of the setting — the setting only decides how many are SHOWN. So 0 hides the list but still remembers five, and going back to 5 brings five entries straight back.
- Values are clamped to 0…50 and applied immediately. Verified live: 2 → "Remembering the 2 most recent project files.", 0 → the hidden message, 5 → the list restored.
