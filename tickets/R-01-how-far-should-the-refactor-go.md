---
ticket: R-01
title: "How far should the refactor go, and can features keep shipping meanwhile?"
kind: plan
status: answered
answers: 3/3
form: yacbpg-refactor-2026-09-26
updated: 2026-09-26T03:25:37.701Z
---

# R-01 — How far should the refactor go, and can features keep shipping meanwhile?

- **Kind:** plan
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 3 of 3
- **Answered:** 2026-09-26T03:25:37.701Z

## Original request (verbatim)

> I'd like a road map for eventually refactoring the code — a document covering the functions and functionality of the app, independently of the user interface, plus a second one with UI ideas once the functionality is fully mapped out. (Your request, 2026-09-26. The two documents — FUNCTION-MAP.md and REFACTOR-ROADMAP.md — are written and in the repo; this ticket decides how much of the roadmap we actually execute.)

## Clarification questions & answers

### 1a. The roadmap is six phases (P0 safety net → P1 pure logic → P2 state layer → P3 commands → P4 services → P5 UI extraction → P6 redesign). How far should we go? (You can change your mind later — this just sets the first target.)

- **Answer:** P0 + P1 — safety net and the pure-logic modules; zero user-visible change (recommended first target)

### 1b. While a refactor phase is in flight, should new feature requests pause?

- **Answer:** No — features keep shipping and the refactor works around them (recommended)

### 1c. Long-term, what is this app to you? (Is it one generator you keep polishing, a template you might fork for other kinds of generators, or something you would like other people to be able to take and use?)

- **Answer:** All of the above, I guess?  I guess in order of priority it's:

1. one generator I keep polishing 
2. something I'd like other people to be able to use
3. a template to fork for other kinds of generators.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
