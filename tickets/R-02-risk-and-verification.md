---
ticket: R-02
title: "Risk appetite, fallbacks, and how each refactor release gets verified"
kind: process
status: answered
answers: 4/4
form: yacbpg-refactor-2026-09-26
updated: 2026-09-26T03:25:39.036Z
---

# R-02 — Risk appetite, fallbacks, and how each refactor release gets verified

- **Kind:** process
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-26T03:25:39.036Z

## Original request (verbatim)

> This ticket is about the safety rules for the refactor itself.

## Clarification questions & answers

### 2a. How much risk is acceptable in a single release while refactoring?

- **Answer:** None — the app must behave identically after every single release (recommended)

### 2b. The plan avoids cliff edges by extracting logic into a module but leaving the current implementation in place as a fallback, deleting the fallback one release later once the module has survived. Agreed?

- **Answer:** Yes — extract with a fallback, delete the fallback one release later (recommended)

### 2c. After each refactor release, how should I prove it still works? (Tick everything you want.)

- **Answer:** Run an automated smoke suite of the app's main behaviours and report the results (recommended); Compare screenshots of the main screens — both themes, phone and desktop (recommended); You click through it yourself and tell me what looks wrong
- **Note:** I'm happy to go through it to check things for myself during the intermediate stages in order to avoid later bug fixes and feature requests.

### 2d. Has anything ever broken in a way you never want to see again? (Anything I should treat as sacred.)

- **Answer:** Nothing has broken like that so far. I've been making it a point to keep backups of my own projects and even of various releases.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
