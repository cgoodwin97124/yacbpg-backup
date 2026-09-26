---
ticket: P2-05
title: "When it saves, what it remembers, and where the backup goes"
kind: plan
status: answered
answers: 4/4
form: yacbpg-round2-2026-09-26
updated: 2026-09-26T17:09:52.276Z
---

# P2-05 — When it saves, what it remembers, and where the backup goes

- **Kind:** plan
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-26T17:09:52.276Z

## Original request (verbatim)

> The state layer is the prerequisite for autosave and for a real undo stack. Round 1 said feature releases keep shipping while a phase is in flight, so these are things I can do one at a time — this ticket is about which ones you actually want.

## Clarification questions & answers

### 5a. Should the working project save itself to the browser as you work?

- **Answer:** Yes, but only the panel data, never the images
- **Note:** Make this user configurable, but default to only the panel data.

### 5b. A real undo/redo stack (P3 is when it becomes possible): how deep, and how long does it live?

- **Answer:** The last 50 changes, and it survives a reload (recommended)

### 5c. Once projects are first-class, where should “back up to GitHub” point?

- **Answer:** One file per project in a projects/ folder — I pick which project to back up (recommended)

### 5d. Which of these would you like as its own small release while P2 is in flight? (Pick any.)

- **Answer:** Nothing for now — just the refactor

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
