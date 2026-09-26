# yacbpg-backup
Yet Another Comic Book Page Generator backup

The generator: https://perchance.org/f0vstb2fbe — source is `main.pjs` + `index.html`, plus `src/manual.html`
(the shipped user manual), `src/question-form.html` (the author's ticket form), `src/refactor-form.html`
(the R-01 … R-08 refactor questions) and `src/core/*.js` (P1's extracted pure logic). Everything else here is
documentation for whoever works on it next.

Reading order for a new session:

- `DEV-NOTES.md` — the full development log and every hard-won gotcha. **Read before changing anything.**
- `AI-NOTES.md` — architecture, state shapes and an API map for AI sessions.
- `PENDING.md` — the request queue (START NOW / QUEUED / DONE). Log every request here FIRST.
- `ISSUES.md` — bug reports and post-mortems; grep it before diagnosing anything.
- `CHANGELOG.md` — user-facing version history. Its first `## ` heading is the live version, and it must match
  the `#embeddedVersion` stamp inside `index.html`.
- `tickets/` — the author's change-request tickets (T-01 …) with their answers, statuses and implementation notes.
- `samples/cow-in-field.zip` — the throwaway sample project used for testing. It may be clobbered at any time.
- `devtests/` — the regression harness: the park/restore protocol, the smoke / generation / fixtures / core
  suites and how to run them (+ `devtests/shots/`, the visual baseline). **Read `devtests/README.md` before
  running any test** — every suite mutates the live preview and must park and restore the author's storage.
- `fixtures/` — known project files (full page, legacy v1, every-legacy-key) for the fixture suite.
- `src/core/` — the pure logic extracted so far (`zip.js`, `jsontext.js`, `keywords.js`, `seeds.js`), loaded by
  `coreLoad()` at the top of `index.html` and diffed against the in-file fallback by `devtests/diff-core.js`.
- `FUNCTION-MAP.md` — what the app *does*, capability by capability, written with **no reference to the interface**;
  ends with the 21 invariants any refactor has to keep honouring.
- `REFACTOR-ROADMAP.md` — the measured state of the code today, why it is tangled, and a six-phase reversible plan
  to untangle it (P0 safety net → P1 pure logic → P2 state → P3 commands → P4 services → P5 UI → P6 redesign).
- `UI-IDEAS.md` — 17 interface proposals that only make sense once the functionality is mapped, each with its risk.
- `REFACTOR-NOTES.md` — the running log of the refactor: the author's answers digested into decisions, what is
  in each phase, what was deliberately rejected and why, and what is still open with the author. **Start here
  when picking the refactor up mid-flight.**
- `questions/REFACTOR-ROUND-1.md` — the open questions this plan needs answered (the R-01 … R-08 round); the same
  set is in the fill-in form `src/refactor-form.html`, opened on the generator page with `window.__openRefactorForm()`.
  **Answered 2026-09-26** — the digest is `REFACTOR-NOTES.md` §1, and the plan's progress is tracked there.
