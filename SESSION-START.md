# SESSION-START — read this first (fresh session, ~2 min)

Repo: `cgoodwin97124/yacbpg-backup`. Generator: https://perchance.org/f0vstb2fbe. App = `main.pjs` + `index.html` + `src/` (manual, forms, `core/*.js`, `state/*.js`). Docs live here at the root; NEVER in `src/` (wedging the platform save flow) and NEVER as long blocks inside `index.html` (pointer comment only).

## Read order (in full, newest-first within each)

1. `README.md` (map) + this file.
2. `PENDING.md`: 🟢 START NOW (open items + newest 2 releases) + 🕒 QUEUED. STOP unless the task is historical.
3. `DEV-NOTES.md`: last 2 `## BATCH` blocks only.
4. `AI-NOTES.md`: §0 (index/map) + ONLY the §§ the task touches (stable IDs, grep by `## N.`).
5. `tickets/*.md`: only if the task implements a ticket. `ISSUES.md`: grep, don't read.

Do NOT read `archive/` (verbatim retired history: DEV-NOTES batches < .15, PENDING DONE, old CHANGELOG). Do NOT re-read the whole of `DEV-NOTES.md`/`PENDING.md`/`CHANGELOG.md`.

## Standing rules (author-mandated, no exceptions)

- LOG EVERY REQUEST in `PENDING.md` FIRST (greenlit → START NOW, else QUEUED). Recon → ask → wait → implement.
- Versions `YYYY.MM.DD.S` (Pacific day, serial from 1, no zero-pad). One release per step. Every release: `CHANGELOG.md` entry + identical `#embeddedVersion` stamp line in `index.html` (first `## ` heading == stamp). `CHANGELOG.md` stays human-voiced (About panel fetches + renders it).
- Tests park the author's whole localStorage map and restore it BYTE-FOR-BYTE (see `devtests/README.md` traps). Stub `confirm`/`prompt`/`alert` before driving UI. Author's browser = Firefox/Windows. `hidden` > `display:none`. ids end `El`/`Btn`/`Ctn`/`Input`.
- Push: app files via `openGhBackup(); await ghPush(); ghClose()` AFTER the author Saves; docs/harness via Contents API; then the blob-sha drift check, expect 0.
- Per-release doc budget: CHANGELOG ≤ 600 tok, DEV-NOTES ≤ 2.5k, PENDING entry ≤ 1.5k.
- "Cow in field" = throwaway test project; may be clobbered anytime. Token (`comicGen.githubToken`) lives ONLY in page localStorage — never in a file; return it as `{t:…}`, never top-level.
