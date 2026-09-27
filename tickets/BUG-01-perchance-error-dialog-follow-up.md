---
ticket: BUG-01
title: "The perchance “An error occurred” dialog (your report, 2026-09-22) — the last piece I need"
kind: bug
status: closed
answers: 5/5
closed: 2026-09-27
form: yacbpg-round2-2026-09-26
updated: 2026-09-26T17:09:46.232Z
---

# BUG-01 — The perchance “An error occurred” dialog (your report, 2026-09-22) — the last piece I need

- **Kind:** bug
- **Status:** closed — **no longer an issue** (the author's call, 2026-09-27)
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

**Closed 2026-09-27 as "no longer an issue"** — no generator change, and no changelog entry (nothing shipped).

The author, 2026-09-27, verbatim: *"BUG-01 is the one that the mouse movement was generating, correct? I'm pretty sure you already fixed that one. Let's close it with the status of 'no longer an issue'."*

- **Which report this is:** the engine dialog whose only stack line is `interactionPointerMoveHandler@?__generatorLastEditTime=…:34:3414` — i.e. the pointer-*move* one. (There was no generator-side fix to attribute it to; see below.)
- **Why "no longer an issue" is the honest label:** the dialog has not been seen since 2026-09-22, nothing in the app misbehaved at any point, and the author's own answers here are "I haven't seen it since… if I see it again I'll let you know" and "Nothing — ignore it as long as the app works".
- **What the recon found (unchanged, and why nothing was fixed):** the surviving frame is inside the PLATFORM's page-bootstrap script — its `isTrusted`-gated "human interaction signals" bot-detection helper, installed on every generator page for `pointerdown`/`pointermove` — not generator code. The dialog hides the real exception text for engine-located errors, so the underlying `TypeError` was only ever visible in the browser console, and the author never had a console line to send. None of the generator-side suspects existed: no `history.replaceState` call (a platform trap that throws), no synthetic pointer events, clean pointer handlers, and no third-party scripts. Synthetic events are never `isTrusted`, so the error cannot be reproduced from the AI preview — it needs real input in the author's browser.
- **Kept on file:** platform report `923578bb` (asks the platform to try/catch that handler chain and to include `error.name + ": " + error.message` for engine-located errors). If the dialog ever returns, the console line is still the one thing that would pin it — send it and this ticket reopens.
