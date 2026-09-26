---
ticket: R-04
title: "Old projects, the migration ladder, and where the library lives"
kind: data
status: answered
answers: 4/4
form: yacbpg-refactor-2026-09-26
updated: 2026-09-26T03:25:41.137Z
---

# R-04 — Old projects, the migration ladder, and where the library lives

- **Kind:** data
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-26T03:25:41.137Z

## Original request (verbatim)

> The refactor touches how state is stored, so I need to know how forgiving it has to be.

## Clarification questions & answers

### 4a. How important is it that every old backup still loads? (The app carries a migration ladder for five historical shapes; keeping it costs work in the refactor.)

- **Answer:** Only recent releases need to work; older files can be re-made
- **Note:** I'd sort of like a way to massage older files to make them readable -- maybe an offline script, or a separate app that can update older files for newer versions.

### 4b. Do you actually still have older backup .json / .zip files lying around that you might load again?

- **Answer:** Maybe one or two, not sure which
- **Note:** I'm okay if the app is able to determine that an older file is older and deprecated, and recommends the aforementioned offline script or separate app.

### 4c. Right now the library (characters / locations / action prompts) is shared by every project in the browser, and a project export carries a copy of it. After the refactor, where should it live?

- **Answer:** I am not sure — talk me through the trade-off first
- **Note:** I'd really like each project to keep its own library.

### 4d. Invisible-but-important: panels currently have no identity (their position IS their identity), which is why moving, duplicating and reflowing needs so much careful code. Giving each panel a real id changes nothing you can see, but fixes a whole class of bugs and makes undo possible. Any objection?

- **Answer:** Do it — invisible is fine if it makes the app sturdier (recommended)
- **Note:** No objection at all.  How easy would it be to make this change for the current app?

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
