---
ticket: T-03
title: "“Recent” list under File — reopen a saved project without the system dialog"
kind: feature
status: done
released: 2026.09.25.1
answers: 4/4
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:18.570Z
generator: f0vstb2fbe
---

# T-03 — “Recent” list under File — reopen a saved project without the system dialog

- **Kind:** feature
- **Status:** done — shipped in **2026.09.25.1** (2026-09-25)
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

T-03 — shipped in **2026.09.25.1** (2026-09-25) — see CHANGELOG.md and DEV-NOTES.md (BATCH 2026.09.25.1).

- A `Recent:` block sits directly under the Backup Project chip row in 📄 File (`#recentAddBtn`, `#recentListEl`, a Clear-list button and a hint that explains the browser difference). Entries are stored newest-first in the existing `comicGenSaveState` IndexedDB under the key `recent`.
- `beginImport(file, isZip)` was factored out of `importSettingsFromFile` so clicking an entry runs the SAME import path as the file dialog, including the usual replace-this-project warning.
- Entries are added by 💾 Save as…, by the download fallback of 💾 Save…, by ⬆ Import Project (.json and .zip) and by ＋ Add / Open… (the real picker where available, a hidden file input otherwise).
- DESIGN NOTE for this author's browser: Firefox has no File System Access API, so where the browser cannot hand back a real file handle the entry keeps its own in-browser copy of the project as it was saved; it still opens even if the original file has since been moved or deleted. Chrome/Edge store a real handle and always load that file's current contents. The hint under the list says which behaviour is in force.
- How many entries are kept is configurable — see T-05.
