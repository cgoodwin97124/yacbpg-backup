---
ticket: P2-04
title: "Old files, version stamps, and the upgrader"
kind: plan
status: answered
answers: 3/3
form: yacbpg-round2-2026-09-26
updated: 2026-09-26T17:09:51.255Z
---

# P2-04 — Old files, version stamps, and the upgrader

- **Kind:** plan
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 3 of 3
- **Answered:** 2026-09-26T17:09:51.255Z

## Original request (verbatim)

> Your R-04 answers: stamp exports with a format + app version, keep a migration ladder for recent shapes, and give an older file a clear “run it through the upgrader” message instead of a best-effort guess. These are the details I need to build that, and to decide how much the JSON editor should own once the store owns the state.

## Clarification questions & answers

### 4a. How far back should the automatic migration ladder reach?

- **Answer:** Only shapes from the v2 format onward (the last few weeks) — anything older goes to the upgrader (recommended)

### 4b. The upgrader page — it opens an old file, converts it in memory (nothing is uploaded), and hands you the result:

- **Answer:** Convert it and give me the new file to download (recommended)

### 4c. The JSON editor, once the store owns the state:

- **Answer:** Keep it as it is — edit raw JSON, normalise + validate on apply (recommended)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
