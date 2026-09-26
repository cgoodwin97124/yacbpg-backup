---
ticket: BUG-01
title: "The perchance “An error occurred” dialog (your report, 2026-09-22) — the last piece I need"
kind: bug
status: answered
answers: 5/5
form: yacbpg-round2-2026-09-26
updated: 2026-09-26T17:09:46.232Z
---

# BUG-01 — The perchance “An error occurred” dialog (your report, 2026-09-22) — the last piece I need

- **Kind:** bug
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 5 of 5
- **Answered:** 2026-09-26T17:09:46.232Z

## Original request (verbatim)

> You sent a screenshot of a perchance error dialog whose only stack line was interactionPointerMoveHandler@…:34:3414. Recon (2026-09-22) says that frame is inside the platform's own page-bootstrap script — its bot-detection pointer handler — not our code, and that the dialog deliberately hides the real exception text, which is why the questions below ask for one line from your console. A platform bug report is already filed (id 923578bb). As far as I can tell nothing in the generator is broken; your console line is what would turn this into a platform follow-up with evidence, or into a real fix.

## Clarification questions & answers

### 1a. Does the generator actually misbehave when the dialog appears — does anything stop working — or is the dialog the only symptom? (The dialog itself says you can likely ignore it if the page works.)

- **Answer:** I haven't seen it since then.  I think it may have gotten fixed; if I see it again I'll let you know.
- **Note:** I'm not seeing it lately.

### 1b. Please open the browser console (Ctrl+Shift+J — Cmd+Option+J on Mac), move the mouse again, and paste the RED error line here: the exception type, its message and the full stack. That single line pins the cause.

- **Answer:** n/a
- **Note:** I'm not seeing it lately.

### 1c. How often does it appear, and where?

- **Answer:** Once — and I have not seen it since

### 1d. Which browser and operating system, and does it still happen with extensions disabled / in a private window / in a second browser? (If it disappears there, it is an extension, and there is nothing for the generator to fix.)

- **Answer:** I'm not seeing it any longer, so n/a.

### 1e. Is there anything you want changed in the generator for this?

- **Answer:** Nothing — ignore it as long as the app works (recommended)
- **Note:** If I see it again I'll report it again.  👍

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
