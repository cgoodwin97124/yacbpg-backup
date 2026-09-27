# yacbpg-backup
Yet Another Comic Book Page Generator backup

The generator: https://perchance.org/f0vstb2fbe — source is `main.pjs` + `index.html`, plus `src/manual.html`
(the shipped user manual), `src/question-form.html` (the author's ticket form), `src/refactor-form.html`
(the R-01 … R-08 refactor questions), `src/round2-form.html` (the P2 round) and `src/core/*.js` (the app's
extracted pure logic — seven modules: P1's six, plus P2's `schema.js`). Everything else here is
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
- `src/core/` — the app's pure-logic modules (`zip.js`, `jsontext.js`, `keywords.js`, `seeds.js`, `prompt.js`,
  `library-core.js`, `schema.js`), loaded by `coreLoad()` at the top of `index.html`. The boot waits for them and a
  module that cannot load is reported in a bar at the top of the page. Since 2026.09.26.14 **every one of them is the
  only copy** — `zip`/`jsontext`/`keywords`/`seeds` lost their in-file fallbacks in 2026.09.26.9 and
  `prompt`/`library-core` in 2026.09.26.14, which completes P1's cleanup; `index.html` now only declares the names,
  so `devtests/diff-core.js` is a guards-only suite (there is no inline half left to diff against). `schema.js`
  (2026.09.26.10) is the first P2 module — the project defaults,
  `newPanelId`, and the `normalise` / `validate` pair the state layer is built on; 2026.09.26.15 added the project's own
  `library` field with `normaliseLibrary` / `normaliseLibType` (the project owns its library, and `comicGen.libObjects`
  is now the browser-wide **catalogue** a project copies entries from — see `AI-NOTES.md` §28); 2026.09.26.16 added the
  project's own `kept` array with `normaliseKept` — the home for kept images (nothing writes to it until the ⤓ Keep feature
  ships — `AI-NOTES.md` §29).
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
  Round 2 (the P2 questions) is answered too: the answers are in `questions/REFACTOR-ROUND-2-ANSWERS.md`, digested
  in `REFACTOR-NOTES.md` §1b, and the fill-in form is `src/round2-form.html` (`window.__openRound2Form()`).
