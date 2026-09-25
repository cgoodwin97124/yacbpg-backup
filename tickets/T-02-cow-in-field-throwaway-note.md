---
ticket: T-02
title: "Document that the “Cow in field” project is a throwaway"
kind: doc
status: done
released: 2026.09.25.1
answers: 1/1
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:17.085Z
generator: f0vstb2fbe
---

# T-02 — Document that the “Cow in field” project is a throwaway

- **Kind:** doc
- **Status:** done — shipped in **2026.09.25.1** (2026-09-25)
- **Answers:** 1 of 1
- **Answered:** 2026-09-25T01:30:17.085Z

## Original request (verbatim)

> Add a note in your documents that the "Cow in field" project is a throwaway, and if it's loaded it can always be clobbered.

## Clarification questions & answers

### 2a. The note is documentation only — no code, nothing shipped. When should it be added?

- **Answer:** Later — together with the go-ahead for the other requests

## Implementation

Done 2026-09-25 — docs only, no code and no changelog entry.

- The note now reads: anything loaded under the name "Cow in field" — including a project a session just built there — can be loaded, overwritten or wiped without warning by anyone, including a future AI session; nothing important should ever be parked in it, and it must never be treated as a source of truth for the author's real work.
- It was added in three places: `AI-NOTES.md` §1 TEST DATA, the STANDING NOTES at the top of `PENDING.md` (beside the test protocol), and the `ISSUES.md` 2026-09-24 post-mortem.
