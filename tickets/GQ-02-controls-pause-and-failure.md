---
ticket: GQ-02
title: "Controls: Now-vs-Queue buttons, pause, and mid-queue failures"
kind: ui
status: answered
answers: 5/5
form: yacbpg-genqueue-2026-10-13
updated: 2026-10-14T23:22:48.936Z
---

# GQ-02 — Controls: Now-vs-Queue buttons, pause, and mid-queue failures

- **Kind:** ui
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 5 of 5
- **Answered:** 2026-10-14T23:22:48.936Z

## Original request (verbatim)

> Same request as GQ-01. This ticket settles what the buttons look like, what Generate Now means while a run is active, what pause guarantees, and what a failed image does to the rest of the queue.

## Clarification questions & answers

### 2a. How should each Generate button offer the Now-vs-Queue choice?

- **Answer:** A dropdown on each Generate button: Generate now / Add to queue (recommended — matches the Images-per-panel dropdowns)
- **Note:** The button should remain on whichever function it was used on last.

### 2b. Where should the page-level “Generate queued” control live?

- **Answer:** Both — a button and a run-panel control
- **Note:** I think it should also exist in the Ctrl/Cmd-K Commands menu under Generate.

### 2c. Generate Now is pressed while a queue run is already generating — what happens?

- **Answer:** Auto-append it to the end of the queue instead

### 2d. Pause today aborts the in-flight image (that slot regenerates on resume). Keep that, with reorder/remove allowed only while paused or idle?

- **Answer:** Yes — keep today's pause; reorder/remove only while paused or idle (recommended)

### 2e. An image fails mid-queue — what should the queue do?

- **Answer:** Mark it failed and continue to the next item, as today (recommended)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
