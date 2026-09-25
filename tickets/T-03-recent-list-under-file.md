---
ticket: T-03
title: "“Recent” list under File — reopen a saved project without the system dialog"
kind: feature
status: answered
answers: 4/4
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:18.570Z
generator: f0vstb2fbe
---

# T-03 — “Recent” list under File — reopen a saved project without the system dialog

- **Kind:** feature
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-25T01:30:18.570Z

## Original request (verbatim)

> Can we add a "Recent" list under File that would hold the path and filename of the saved file? Clicking on that would directly load the project (JSON or ZIP) with the usual warning to the user rather than going through the system's Load File dialog.

## Clarification questions & answers

### 3a. Browsers deliberately hide a file’s folder, so an entry can only show the FILENAME plus when it was saved/opened — never a real path. Is that enough, and should there be a “＋ Add…” entry using the browser’s open-file picker (.json AND .zip) as the way files get into the list?

- **Answer:** Yes — filename + time is fine, AND add a ＋ Add… button using the open-file picker (recommended)

### 3b. Should the Recent list hold ZIPs as well as JSON? (The app only ever SAVES JSON, so a ZIP can only enter the list through that ＋ Add… picker.)

- **Answer:** Yes — allow both .json and .zip in the list (recommended)

### 3c. Where should the Recent list sit under 📄 File?

- **Answer:** Directly under the Backup Project chip row, with a “Clear recent list” action (recommended)

### 3d. How many entries should the Recent list keep by default? (This becomes configurable — see ticket T-05.)

- **Answer:** 5 (recommended)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
