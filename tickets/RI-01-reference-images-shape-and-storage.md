---
ticket: RI-01
title: "Reference images — what they are and where they live"
kind: technical
status: answered
answers: 5/5
form: yacbpg-refimages-2026-09-29
updated: 2026-09-30T11:28:41.147Z
---

# RI-01 — Reference images — what they are and where they live

- **Kind:** technical
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 5 of 5
- **Answered:** 2026-09-30T11:28:41.147Z

## Original request (verbatim)

> Your 2026-09-26 request, verbatim: “Let's build in hooks for the possibility to allow up to three reference images, in case we get Image to Image generation capability or in case the user wants to have an idea of what their characters or locations look like.” Recon: a library object today is exactly { id, type, name, desc } — the schema rebuilds that shape on every load, so a refs array would be dropped until the schema carries it (a P2-schema change, like kept images got). The kept-image precedent stores whole objects inside the project file (measured ≈121 KB per kept image; your export warning sits at 40 MB). There is no image-to-image path, so these are a visual memo only — never prompt input.

## Clarification questions & answers

### 1a. Which library types get reference images?

- **Answer:** Characters and Locations only (recommended — the types a likeness matters for)

### 1b. You copy an object between this project and My catalogue (copy in / offer back). What travels with it?

- **Answer:** Ask me each time

### 1c. How should the app store each image? (Three full originals per object across a big library is what would push exports toward your 40 MB warning.)

- **Answer:** Thumbnail only (around 256px) — a reminder, not a likeness
- **Note:** Just to be clear, this is for the reference images, correct?  The full generated images that get created, and exported to a project that exports them, will be stored at the size they're created, correct?

### 1d. A fourth image arrives on an object that already holds three. What happens?

- **Answer:** Let me pick which one it replaces

### 1e. Exports: do reference images ride along?

- **Answer:** A separate toggle on the export dialog: with or without reference images

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
