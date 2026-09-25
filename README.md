# yacbpg-backup
Yet Another Comic Book Page Generator backup

The generator: https://perchance.org/f0vstb2fbe — source is `main.pjs` + `index.html`, plus `src/manual.html`
(the shipped user manual). Everything else here is documentation for whoever works on it next.

Reading order for a new session:

- `DEV-NOTES.md` — the full development log and every hard-won gotcha. **Read before changing anything.**
- `AI-NOTES.md` — architecture, state shapes and an API map for AI sessions.
- `PENDING.md` — the request queue (START NOW / QUEUED / DONE). Log every request here FIRST.
- `ISSUES.md` — bug reports and post-mortems; grep it before diagnosing anything.
- `CHANGELOG.md` — user-facing version history. Its first `## ` heading is the live version, and it must match
  the `#embeddedVersion` stamp inside `index.html`.
- `tickets/` — the author's change-request tickets (T-01 …) with their answers, statuses and implementation notes.
- `samples/cow-in-field.zip` — the throwaway sample project used for testing. It may be clobbered at any time.
