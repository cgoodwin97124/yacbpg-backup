---
ticket: GQ-01
title: "What lives in the queue: panels, slots, or both?"
kind: plan
status: answered
answers: 2/2
form: yacbpg-genqueue-2026-10-13
updated: 2026-10-14T23:22:47.366Z
---

# GQ-01 — What lives in the queue: panels, slots, or both?

- **Kind:** plan
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 2 of 2
- **Answered:** 2026-10-14T23:22:47.366Z

## Original request (verbatim)

> Your request (2026-10-13): every Generate button should offer Generate Now or queue-for-later, with FIFO ordering, pause/reorder/remove, and multi-panel selection feeding the queue. Recon says the engine is already sequential (one image at a time) and the run panel already shows per-panel queued/rendering/done rows — the natural host for the queue UI. This ticket settles the unit of work.

## Clarification questions & answers

### 1a. What is one item in the queue?

- **Answer:** I am not sure — recommend based on the round-robin and reorder constraints

### 1b. The per-slot reroll buttons (each image's own regenerate arrow) — should they also be queueable, or stay immediate-only?

- **Answer:** Also queueable through the same Now/Queue choice

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
