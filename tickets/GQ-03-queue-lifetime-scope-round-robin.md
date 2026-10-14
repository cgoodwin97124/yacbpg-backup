---
ticket: GQ-03
title: "Queue lifetime, page scope, and round-robin"
kind: technical
status: answered
answers: 4/4
form: yacbpg-genqueue-2026-10-13
updated: 2026-10-14T23:22:50.325Z
---

# GQ-03 — Queue lifetime, page scope, and round-robin

- **Kind:** technical
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-10-14T23:22:50.325Z

## Original request (verbatim)

> Same request as GQ-01. This ticket settles whether the queue survives a reload, whether it can span pages, and how it interacts with the round-robin generation order.

## Clarification questions & answers

### 3a. How long should a queue live?

- **Answer:** Session-only in memory — it dies on reload (recommended for v1)

### 3b. Round-robin pre-builds every panel's prompt upfront and renders slot-by-slot, which conflicts with mid-run reordering. Acceptable compromise?

- **Answer:** Yes — snapshot the queue order when the run starts and render slot-major over that order; reorder only while paused (recommended)

### 3c. Should one queue be able to span multiple pages, or is it current-page-only?

- **Answer:** Current page only for v1 (recommended)
- **Note:** Cross page for a later version.

### 3d. Anything else the queue must do? (Priorities, a clear-queue button, badges on queued panels, a queue panel that stays open while generating — anything I have not asked.)

- **Answer:** The queue panel for sure and the clear-queue button, both for V1. 

I'd like the queue panel to be movable and minimizable somehow as well, but probably not for V1.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
