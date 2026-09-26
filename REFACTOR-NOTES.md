# REFACTOR NOTES — *Yet Another Comic Book Page Generator*

**The running log of the refactor: what moved where, what got deleted, what bit us.**
Started 2026-09-26, at the author's request (R-08 question 8d). Companion documents, all in this repo:
`FUNCTION-MAP.md` (what the app does, no interface), `REFACTOR-ROADMAP.md` (the measured code, the target
architecture, the six phases), `UI-IDEAS.md` (the interface proposals), `questions/REFACTOR-ROUND-1.md` and
`tickets/R-01…R-08*.md` (the author's answers — **the decisions of record**).

Read this file first when you (AI or human) pick the refactor up mid-flight: it says what phase we are in,
what has already been extracted, what was deliberately rejected and why, and what is still waiting on the
author. `DEV-NOTES.md` remains the log for *feature* releases; this file is for *structural* work.

---

## 1. The author's answers, digested (2026-09-26, round 1)

| Ticket | Question | Answer | Consequence |
|---|---|---|---|
| R-01 1a | How far should the refactor go? | **P0 + P1 first** (harness, then pure logic), zero user-visible change | The first target is the harness and then `core/*` modules, with the old code left in place as a fallback |
| R-01 1b | Do new features pause during a phase? | **No** — features keep shipping | Feature releases continue on `index.html` while the refactor happens around them (2026.09.26.4 is the first) |
| R-01 1c | What is the app to you, long-term? | 1) one generator to keep polishing, 2) something others can use, 3) a template to fork | Optimise for a single well-polished app, but keep the code readable and self-contained enough to fork |
| R-02 2a | Risk per release? | **None — behave identically** | No release may change behaviour; every phase ships behind the differential tests |
| R-02 2b | Extract-with-fallback? | **Yes**, delete the fallback one release later | The strangler pattern in the roadmap is the agreed mechanism |
| R-02 2c | How is "still works" proven? | Smoke suite **and** screenshot comparison, **and** the author clicks through | All three; the author volunteered to check intermediate stages themselves |
| R-02 2d | Anything sacred? | Nothing has broken that way; they keep their own backups | No process change needed |
| R-03 3a | Split into `src/` modules? | **Yes** — "This is really what I have in mind for the refactor." | P5 is not optional; the module tree in the roadmap is the target |
| R-03 3b | May `src/` hold the app's modules? Where do docs go? | "I would rather you decide" | **Decided:** `src/` holds only what the app serves (the manual, the forms, and the module tree). Docs stay at the repo root — that is where every existing cross-link points, and moving ten documents to buy a folder is churn for nothing. If the root ever gets crowded, the reference set (FUNCTION-MAP / REFACTOR-ROADMAP / UI-IDEAS / REFACTOR-NOTES) moves to `docs/` in one commit. |
| R-03 3c | Buildless? | "Decide for me once you have measured the load time" | **Measured:** the page is ~165 KB over the wire, `DOMContentLoaded` ≈ 238 ms, and the panel grid rebuild is 45 ms for 24 panels in the editor preview. Splitting into ~20–30 plain ES modules adds parallel same-origin requests, not sequential cost, and shortens the critical path (the browser parses modules while they arrive). **Decision: buildless plain ES modules.** No bundler, no build step, nothing that has to be remembered before a Save. If module count ever hurts, a bundle becomes a 10-minute esbuild step and nothing else changes. |
| R-03 3d | What environment? | Phone most often, desktop for screen space; must be usable on mobile; dialogs/panels should reflow with orientation | Mobile-first, desktop-second; overlays must reflow rather than scroll sideways |
| R-04 4a/4b | Must every old backup load? | Only recent releases; they'd like a deprecation **detector** and an offline upgrader | Add a format/app-version stamp to exports; on import, refuse-and-explain when the file predates the supported ladder, pointing at a standalone upgrader page in this repo (built once P1 extracts the migration code) |
| R-04 4c | Where should the library live? | "Talk me through the trade-off first" — but "I'd really like each project to keep its own library" | See §3 — recommendation recorded, **awaiting the author's choice** before any code |
| R-04 4d | Panels get real ids? | "Do it — invisible is fine if it makes the app sturdier" | Panel identity lands with the state layer (P2); it is also what makes undo and cross-page dragging possible |
| R-05 5a/5b | Keep the 24-panel cap and the overflow rule? | Drop the cap; let a page grow and scroll; pagination is the author's decision; they only ever used pages to get past 24 | Pages become optional containers rather than an overflow mechanism (P2/P6) |
| R-05 5c | Per-slot image history? | "Decide based on what it does to performance" | **Rejected as a rolling history** — a 512×512 render measures ≈ 121 KB, so "last 3 per slot" on a full page ≈ 35 MB, the memory-pressure class that killed a mobile tab once. Instead: a **⤓ Keep** that pins an image *with the prompt text and seed that produced it* (§3) |
| R-05 5d | Which page conveniences? | Filmstrip with thumbnails, drag pages to reorder, per-page style override — **and dragging panels between pages** | All queued (P6), with panel dragging dependent on 4d's ids |
| R-06 6a–6c | One inspector? Modes? Advanced switch? | **Yes to all three** | The P6 target is Compose / Render / Review over one inspector; expert controls behind **Advanced**; anything already set stays visible |
| R-06 6d | Where do you use it? | Both equally: **phone first, desktop second** | Layout work is phone-first |
| R-07 7a | Which wins do you want? | 10 of the 12 ticked (run panel, variants as a first-class action, prompt inspector, page filmstrip, library picker, undo everywhere, one destructive-dialog style, first-run sample + checklist, accessibility pass, one notification area) | All queued; nothing promised for a specific date |
| R-07 7b | Which matters most? | **Run panel → library picker → prompt inspector → consistent destructive dialogs → one notification area** | The P6 order |
| R-07 7c | What must stay recognisable? | The amber/dark look + the colour presets; the full-screen menu on a phone | **Hard constraints** for P6 — treat as requirements, not preferences |
| R-08 8a | Biggest annoyance? | **Generation stops when the tab loses focus** | Shipped already: **2026.09.26.4** (§4) |
| R-08 8b | Wanted but never asked for? | Per-panel **character dialogue**, deliberately *not* rendered into the image | Queued as a domain feature; needs a design (where it lives, how it appears in exports/JSON) |
| R-08 8c/8e | Reporting cadence? | One short message per release + a longer summary per phase; they use the app most days and can answer question batches quickly | This file is the per-phase summary; the question form stays the way questions get asked |
| R-08 8d | A refactor log? | **Yes** | This file |

---

## 2. What is in progress

- **P0 — the regression harness.** Started 2026-09-26. `devtests/park.js` exists (park / check / restore of
  the whole localStorage map with an FNV-1a hash, so "nothing was written" is provable). Still to come:
  `devtests/smoke.page.js` (the capability walk from `FUNCTION-MAP.md` §22 against the live preview),
  `devtests/pure.test.js` (the pure-function tests, runnable in a worker), the `fixtures/` set (a multi-page
  project at the panel limit with overrides, a legacy v1 project, a project carrying every legacy key) and the
  screenshot baseline (panel grid, JSON editor, analysis matrix, batch dialogs × both themes × 390 px / 1440 px).
  **Exit criteria:** the suite passes against the *unmodified* build, and every invariant in `FUNCTION-MAP.md`
  §21 has a test or an explicit "manual check" line.
- **P1 — pure logic** (after P0): `core/zip.js`, `core/keywords.js`, `core/seeds.js`, `core/prompt.js`,
  `core/library-core.js`, `core/jsontext.js`, each extracted with the in-file implementation left as a fallback
  and deleted one release later. **Exit criteria:** a differential test over hundreds of inputs finds zero
  differences and nothing user-visible changes.
- **In parallel:** feature releases keep shipping (R-01 1b). 2026.09.26.4 is the first of the refactor era.

### Running log
- **2026-09-26** — created this file; recorded the round-1 answers and the decisions above. `devtests/park.js`
  written and used to park/restore the live preview (`hash 6548bd20`, 21 keys, byte-identical round trip).
- **2026-09-26 — 2026.09.26.4 shipped** (a feature, not a refactor step): generation keeps running while the
  tab is in the background (`comicGen.bgGenerate`, default ON; see `AI-NOTES.md` §19). It was the author's
  single biggest complaint and it was the app's own `visibilitychange` handler doing the damage.

---

## 3. Decisions, written down so they are not re-litigated

- **Buildless ES modules** (R-03 3c) — see the table. No bundler unless module count actually hurts.
- **`src/` = what the app serves; the repo root = documentation.** Never `README.md` / `PENDING.md` /
  `CHANGELOG.md` / `AI-NOTES.md` / `ISSUES.md` inside `src/` (the platform's save flow wedges permanently).
  Harness and fixtures live in `devtests/` and `fixtures/`, which also never ship.
- **No rolling per-slot image history** (R-05 5c). 121 KB per image × 3 × 4 slots × 24 panels ≈ 35 MB per page
  is exactly the memory-pressure class that once killed a mobile tab. The need it was meant to serve ("images
  I liked, but the prompts were lost when I edited the library") is met better by a **⤓ Keep**: pin an image
  and its *resolved* prompt text + seed, so later library edits cannot change what produced it. **DECIDED
  2026-09-26 - kept images live in the project file**, not a separate browser store; the author is fine with
  bigger exports in exchange for portability. Cap around a dozen per project (a soft warning past that).
- **Panel ids before undo** (R-04 4d). Position is the only identity today, which is why move/duplicate/reflow
  need so much care. Adding `id` is invisible, backward-compatible (old files simply gain one on load), and is
  the prerequisite for undo, for dragging panels between pages, and for a saner reorder.
- **The library trade-off** (R-04 4c) — the choice the author asked to be talked through:
  - *Today:* one library per browser, shared by every project; a project export carries a copy. Editing a
    library entry changes every project that still points at it.
  - *Per-project:* each project owns its library. Isolation ("this comic's cast"), self-contained exports, and
    edits can never disturb another project. Cost: a new project starts empty, and existing projects need a
    migration that copies today's browser library into them.
  - *Recommended:* **per-project ownership + the existing browser library kept as a catalogue you can pull
    from** (a "＋ from my library" picker when adding a character/location). That keeps the reuse the author
    has now, adds the isolation they asked for, and makes the "editing the library changed my panel's prompt"
    class of surprise impossible — panel text is already frozen once seeded, and with a project-owned copy
    there is nothing global left to edit underneath it.
  - **DECIDED 2026-09-26 - the author took the recommendation above.** Their own words: "The library import
    function was an attempt to give me reuse." So the catalogue-to-project copy is the part that must stay
    easy; the project-owned copy is what they actually want. Build it in P2 with `core/schema.js` (a project
    carries its own `library`; loading an older project seeds it from the browser library the first time).
- **Character dialogue** (R-08 8b) - **DECIDED 2026-09-26: a configurable number of dialogue lines per panel**,
  held as text in the project and deliberately **not** rendered into the image. The author's reasoning: "they're
  intended for the user more than the renderer", and they do not want to guess how many lines anyone needs, so
  the count is a setting (per panel, default small). Shape: `dialogue: [{ speaker, text }]` on the panel, an
  editable list in the inspector, a configurable row count, and a read-only rendering in Storyboard / Focus / a
  future Review mode. Belongs in P2's schema work (a field on the panel) with P6 writing its UI.
- **Old-file compatibility** (R-04 4a/4b): stamp exports with a format + app version; keep the migration ladder
  for recent shapes only; on import, a file older than the supported ladder gets a clear "this file predates
  the current format, run it through the upgrader" message plus a link, instead of a best-effort guess. The
  upgrader is a standalone page in this repo that reuses `core/migrations.js` once P1/P4 extract it.

---

## 4. Closed with the author (2026-09-26)

All three questions from round 1 are answered - see section 3 for the decisions and their reasoning.

1. **The library** - project-owned, the browser library becomes a catalogue, existing projects seeded on first load.
2. **Kept images** - in the project file (big exports are fine).
3. **Character dialogue** - a configurable number of lines per panel, text-only, never rendered.

Nothing is waiting on the author. The next thing that needs them is a **question batch at the end of P0**, which
will be packaged in the same answer form (`window.__openRefactorForm()`, or a fresh round file) rather than as
prose here.
