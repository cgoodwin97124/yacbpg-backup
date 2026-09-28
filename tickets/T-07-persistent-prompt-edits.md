---
ticket: T-07
title: "Manual Prompt edits persist through other field changes"
kind: feature
status: answered
answers: 5/5
form: yacbpg-tickets-2026-09-25
updated: 2026-09-28T02:42:05.459Z
---

# T-07 — Manual Prompt edits persist through other field changes

- **Kind:** feature
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 5 of 5
- **Answered:** 2026-09-28T02:42:05.459Z

## Original request (verbatim)

> Author, 2026-09-28: manual edits to a panel's Prompt editor (both positive and negative) should persist through changes to other fields. Today typing there saves a joint {pos, neg} override, but ~12 other paths clear it (any char/loc select, base/extra text, action, style, palette, library pick, panel deletes of those fields, Analysis edits). There is no manual revert UI — editing another field is currently the only way back to the auto-composed prompt. Seed, size, image count and title never clear.

## Clarification questions & answers

### 7a. Once you hand-edit a panel's Prompt, other fields stop touching it: the pos/neg text stays frozen exactly as you typed it until you change it again or explicitly revert. Agreed?

- **Answer:** Something else — see my notes
- **Note:** Yes, freeze the manual text exactly, but provide a "revert to global defaults" chip/button for each.

### 7b. Pos and neg persist together as one override (editing either box snapshots both — this matches how they are stored today). Or should each box persist independently?

- **Answer:** Together as one — editing either box keeps both (recommended)

### 7c. Since editing other fields will no longer take you back to the auto-composed prompt, the Prompt editor needs an explicit way back (e.g. a Revert-to-auto chip beside the Prompt button). Add it?

- **Answer:** Yes — add a Revert-to-auto chip in the Prompt editor (recommended)

### 7d. Which fields stop clearing? The proposal: ALL content fields stop (characters, location, action, descriptions, style, palette, library picks, Analysis edits). Seed/size/image-count/title already never clear. Any field that should still reset the Prompt?

- **Answer:** Style and palette should still reset it (they change the keywords)

### 7e. Ship shape: one release (behaviour change + revert chip + tests proving an edit survives every other field), or fold it into the next structural-ops release?

- **Answer:** Fold it into the next structural release (addPanel + undo)
- **Note:** Unless it's easier to release it as its own release, let's fold it into the next structural release.

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
