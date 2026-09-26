---
ticket: P2-02
title: "The project's own library, and the browser catalogue"
kind: technical
status: answered
answers: 4/4
form: yacbpg-round2-2026-09-26
updated: 2026-09-26T17:09:48.839Z
---

# P2-02 — The project's own library, and the browser catalogue

- **Kind:** technical
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-26T17:09:48.839Z

## Original request (verbatim)

> Round 1 decided: the project owns its library, and the browser-wide library becomes a catalogue you copy from. core/library-core.js (the lib:<type>:<id> parsing, reference counting, extractLibraryItems) is the same work either way — these questions shape the screens and the import path around it.

## Clarification questions & answers

### 2a. In the library UI, how should the project's objects and the catalogue's objects appear together?

- **Answer:** Two sections: “This project” then “My catalogue”

### 2b. You import someone else's project file. What should happen to your catalogue?

- **Answer:** Offer to copy the file's objects in — my choice each time (recommended)

### 2c. You delete a library object that panels still reference. What should happen?

- **Answer:** Tell me what it does today and I will decide
- **Note:** Warn me, then allow me to choose whether to clear the references, leave them as plaintext, or cancel the delete operation.

### 2d. Anything else about the library you want changed while the ownership moves to the project?

- **Answer:** Let's build in hooks for the possibility to allow up to three reference images, in case we get Image to Image generation capability or in case the user wants to have an idea of what their characters or locations look like.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
