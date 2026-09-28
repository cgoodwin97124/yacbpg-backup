---
ticket: T-06
title: "P3 step 2 — add / duplicate / move / delete panels as named commands"
kind: refactor
status: answered
answers: 5/5
form: yacbpg-tickets-2026-09-25
updated: 2026-09-28T02:22:57.585Z
---

# T-06 — P3 step 2 — add / duplicate / move / delete panels as named commands

- **Kind:** refactor
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 5 of 5
- **Answered:** 2026-09-28T02:22:57.585Z

## Original request (verbatim)

> The leaf phase is done (title, images, style, size, seed, same-seed, protect, prompt override all write through named commands). Next is §3.5 step 2: the structural commands. Recon first, questions in this form (author, 2026-09-27). Recon found: add/duplicate/delete/move all rebuild the page positionally from collectPanelState, then clear the panel selection, remap the image session, WIPE all prompt overrides/history on the page, and rebuild the grid. Delete has Delete-Only vs Delete-&-Refill (pull panels up from following pages); duplicate copies settings but no images; move works within a page and across pages (prepend/append/replace); every destructive dialog says it cannot be undone.

## Clarification questions & answers

### 6a. Release shape: one structural op per release (add, then duplicate, then move, then delete), each fully tested exactly like the leaf releases?

- **Answer:** Yes — one op per release, same proof bar as the leaves (recommended)

### 6b. Every destructive dialog says the action cannot be undone. Should step 2 introduce an undo stack for structural ops, or keep the dialogs and defer undo?

- **Answer:** Build undo for structural ops now, as part of step 2

### 6c. Add / duplicate / move currently discard ALL prompt overrides and prompt history on the page (the maps are wiped, even for untouched panels). Preserve exactly, or remap?

- **Answer:** Remap instead — keep the overrides of panels that survive, drop only the deleted ones

### 6d. Scope check: batch (multi-select) delete, Delete-&-Refill from following pages, cross-page move, and move-to-new-page — all in scope as commands, with page create/delete staying as-is for now?

- **Answer:** Include page create/delete too — see my notes
- **Note:** Is there any reason not to have page create/delete as commands too?

### 6e. Duplicate copies settings but no images (images live in the page session, not the saved project, which is why a pure command can't easily carry them). Keep it that way?

- **Answer:** Keep it — the copy arrives with no images, as today (recommended)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
