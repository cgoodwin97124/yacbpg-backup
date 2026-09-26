---
ticket: P2-03
title: "Kept images live in the project file — what that costs"
kind: technical
status: answered
answers: 3/3
form: yacbpg-round2-2026-09-26
updated: 2026-09-26T17:09:50.131Z
---

# P2-03 — Kept images live in the project file — what that costs

- **Kind:** technical
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 3 of 3
- **Answered:** 2026-09-26T17:09:50.131Z

## Original request (verbatim)

> Round 1 decided the kept images travel inside the project file (and that big exports are fine). This ticket is about the trade-offs that decision creates: file size, whether the browser keeps its own copy, and what happens when someone else's file arrives with images in it.

## Clarification questions & answers

### 3a. Export: one file with everything in it, or a second, lighter option?

- **Answer:** Two buttons: full export, plus “compact (no kept images)”

### 3b. Should the browser keep its own copy of a project's kept images, so the pictures are still there even if the file is lost?

- **Answer:** No — the file is the only home for kept images

### 3c. A project with many kept images can get large. At roughly what export size would you want a warning (e.g. “this export is 40 MB”)?

- **Answer:** 40 MB sounds about right.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
