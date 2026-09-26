---
ticket: R-06
title: "The shape of the interface: one inspector, modes, and expert controls"
kind: ui
status: answered
answers: 4/4
form: yacbpg-refactor-2026-09-26
updated: 2026-09-26T03:25:43.334Z
---

# R-06 — The shape of the interface: one inspector, modes, and expert controls

- **Kind:** ui
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-26T03:25:43.334Z

## Original request (verbatim)

> The UI document (UI-IDEAS.md) proposes a different shape for the app. This ticket asks which parts of that shape you actually want before any of it is designed in detail.

## Clarification questions & answers

### 6a. The biggest proposal: the page becomes a canvas of compact panel cards (number, title, thumbnail, status) and all editing happens in ONE inspector for the selected panel — instead of every panel carrying ~60 controls of its own. Acceptable?

- **Answer:** Yes — one inspector for the selected panel (recommended)

### 6b. Should the app have explicit modes — Compose (describe panels), Render (queue, progress, re-roll), Review (read the comic, compare, export) — instead of one screen that does all three at once?

- **Answer:** Yes — three modes over the same project (recommended)
- **Note:** That's sort of what I was going for with storyboard mode and panel focus.  Yes for sure to this!

### 6c. Should expert controls (prompt obedience/guidance, custom image sizes, seed boxes, the per-panel prompt override, per-panel style and size overrides, panel titles) be hidden behind an 'Advanced' switch by default? (Anything you have actually set stays visible, so nothing becomes invisible-but-active.)

- **Answer:** Yes — hide the expert controls until I switch Advanced on (recommended)

### 6d. Where do you actually use it?

- **Answer:** Both, about equally (recommended: design for phone first, desktop second)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
