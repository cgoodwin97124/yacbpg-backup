---
ticket: R-03
title: "Splitting the app into modules under src/ — is that acceptable?"
kind: technical
status: answered
answers: 4/4
form: yacbpg-refactor-2026-09-26
updated: 2026-09-26T03:25:40.143Z
---

# R-03 — Splitting the app into modules under src/ — is that acceptable?

- **Kind:** technical
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 4 of 4
- **Answered:** 2026-09-26T03:25:40.143Z

## Original request (verbatim)

> This ticket is about the only real platform decision in the whole plan: whether the app may be split into ES modules under src/, or must stay in one index.html.

## Clarification questions & answers

### 3a. The natural target is index.html as a thin shell plus ES-module files under src/ (core logic, state, services, views). The catch: unsaved src/ files are previewed through a service worker, and your saved generator only serves them after you press Save. Is that trade worth a far more maintainable app?

- **Answer:** Yes — split it into src/ modules (recommended)
- **Note:** This is really what I have in mind for the refactor.

### 3b. src/ currently holds the manual (manual.html) and the ticket form (question-form.html). May it also hold the app's modules? (Docs like README.md / PENDING.md must never go in src/ — that wedges the platform's save flow.)

- **Answer:** I would rather you decide — you know the platform limits best
- **Note:** Whatever makes sense.  A separate doc/ directory for documentation?  I'm not sure what best practices are in software deesign.

### 3c. Should the build stay buildless?

- **Answer:** Decide for me once you have measured the load time
- **Note:** I'm honestly not sure.  I lean strongly towards your recommendation, but let's look at performance data so we know for sure.

### 3d. Any environment I should assume? (Phone vs desktop, in-app browsers, offline use, slow connections, a device you care about most.)

- **Answer:** I use it most often on my phone, but I prefer the screen real estate of the desktop.  I always have my phone with me.  It just needs to be usable on mobile, maybe by hiding text in some cases, or allowing dialogs and panels to reflow with changing device orientation and movement through the app (if that makes any sense to you?)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
