# Refactor & UI Planning — the questions (round 1)

The companion form is `src/refactor-form.html` (open it on the generator page with `window.__openRefactorForm()`), which writes your answers back into `tickets/` from the browser. This file is the same set of questions in plain text, so they can be read — and answered — without the form: fill in the `Answer:` lines and hand the file back.

The three documents the questions refer to are `FUNCTION-MAP.md`, `REFACTOR-ROADMAP.md` and `UI-IDEAS.md`, all in this repo. Answer as much or as little as you like; every multiple-choice question defaults to the option marked **(recommended)**, and "all defaults" is a valid answer. (The form has a **✨ Use the recommended answers** button that fills them all in at once; this text version simply lists them.)

---

## R-01 — How far should the refactor go, and can features keep shipping meanwhile?

**Kind:** plan  ·  **Questions:** 3

I'd like a road map for eventually refactoring the code — a document covering the functions and functionality of the app, independently of the user interface, plus a second one with UI ideas once the functionality is fully mapped out. (Your request, 2026-09-26. The two documents — FUNCTION-MAP.md and REFACTOR-ROADMAP.md — are written and in the repo; this ticket decides how much of the roadmap we actually execute.)

### 1a. The roadmap is six phases (P0 safety net → P1 pure logic → P2 state layer → P3 commands → P4 services → P5 UI extraction → P6 redesign). How far should we go? (You can change your mind later — this just sets the first target.)

- P0 + P1 — safety net and the pure-logic modules; zero user-visible change (recommended first target)
- Docs only for now — read them, think about it, decide later
- Through P2 + P3 — the real state layer and commands (the structural change that kills the biggest bug class)
- Through P5 — the whole extraction, ending with no inline handlers and no window exports
- All the way, P6 included — the interface redesign too

**Answer:** 

**Note:** 

### 1b. While a refactor phase is in flight, should new feature requests pause?

- No — features keep shipping and the refactor works around them (recommended)
- Only during P3 (the risky phase) — pause features there
- Yes — freeze features until the current phase is finished

**Answer:** 

**Note:** 

### 1c. Long-term, what is this app to you? (Is it one generator you keep polishing, a template you might fork for other kinds of generators, or something you would like other people to be able to take and use?)

**Answer:** 

**Note:** 

---

## R-02 — Risk appetite, fallbacks, and how each refactor release gets verified

**Kind:** process  ·  **Questions:** 4

This ticket is about the safety rules for the refactor itself.

### 2a. How much risk is acceptable in a single release while refactoring?

- None — the app must behave identically after every single release (recommended)
- Small risk is fine if the old path stays behind a flag
- I accept an occasional broken release; put it right in the next one

**Answer:** 

**Note:** 

### 2b. The plan avoids cliff edges by extracting logic into a module but leaving the current implementation in place as a fallback, deleting the fallback one release later once the module has survived. Agreed?

- Yes — extract with a fallback, delete the fallback one release later (recommended)
- No — move each piece in one go and accept the risk
- Only for the risky pieces

**Answer:** 

**Note:** 

### 2c. After each refactor release, how should I prove it still works? (Tick everything you want.)

- [ ] Run an automated smoke suite of the app's main behaviours and report the results (recommended)
- [ ] Compare screenshots of the main screens — both themes, phone and desktop (recommended)
- [ ] You click through it yourself and tell me what looks wrong
- [ ] Ask you before each Save, so you can look first
- [ ] Nothing extra — just tell me what changed and I will test it myself

**Answer:** 

**Note:** 

### 2d. Has anything ever broken in a way you never want to see again? (Anything I should treat as sacred.)

**Answer:** 

**Note:** 

---

## R-03 — Splitting the app into modules under src/ — is that acceptable?

**Kind:** technical  ·  **Questions:** 4

This ticket is about the only real platform decision in the whole plan: whether the app may be split into ES modules under src/, or must stay in one index.html.

### 3a. The natural target is index.html as a thin shell plus ES-module files under src/ (core logic, state, services, views). The catch: unsaved src/ files are previewed through a service worker, and your saved generator only serves them after you press Save. Is that trade worth a far more maintainable app?

- Yes — split it into src/ modules (recommended)
- Yes, but only if the app can never break when a module fails to load (the fallback pattern in R-02)
- No — keep everything in index.html, refactor in place only
- I am not sure — recommend the safest option and I will follow it

**Answer:** 

**Note:** 

### 3b. src/ currently holds the manual (manual.html) and the ticket form (question-form.html). May it also hold the app's modules? (Docs like README.md / PENDING.md must never go in src/ — that wedges the platform's save flow.)

- Yes — src/ is for anything the app ships or loads, code included (recommended)
- Only the manual and forms stay there; the code stays in index.html
- I would rather you decide — you know the platform limits best

**Answer:** 

**Note:** 

### 3c. Should the build stay buildless?

- No build step — plain ES modules the browser loads directly (recommended)
- Use a bundler (esbuild-wasm) so the app is one file again, even if it complicates releases
- Decide for me once you have measured the load time

**Answer:** 

**Note:** 

### 3d. Any environment I should assume? (Phone vs desktop, in-app browsers, offline use, slow connections, a device you care about most.)

**Answer:** 

**Note:** 

---

## R-04 — Old projects, the migration ladder, and where the library lives

**Kind:** data  ·  **Questions:** 4

The refactor touches how state is stored, so I need to know how forgiving it has to be.

### 4a. How important is it that every old backup still loads? (The app carries a migration ladder for five historical shapes; keeping it costs work in the refactor.)

- Essential — every backup I have ever exported must keep working (recommended)
- Only recent releases need to work; older files can be re-made
- It is a hobby project — if the structure changes, I will redo my projects

**Answer:** 

**Note:** 

### 4b. Do you actually still have older backup .json / .zip files lying around that you might load again?

- Yes — several, and I would load them (the migration ladder stays)
- Maybe one or two, not sure which
- No — I only keep the current project

**Answer:** 

**Note:** 

### 4c. Right now the library (characters / locations / action prompts) is shared by every project in the browser, and a project export carries a copy of it. After the refactor, where should it live?

- Keep it shared in the browser, as now (recommended — least change)
- Move it into the project file so a project is completely self-contained
- Both — a browser-level library plus an optional per-project set
- I am not sure — talk me through the trade-off first

**Answer:** 

**Note:** 

### 4d. Invisible-but-important: panels currently have no identity (their position IS their identity), which is why moving, duplicating and reflowing needs so much careful code. Giving each panel a real id changes nothing you can see, but fixes a whole class of bugs and makes undo possible. Any objection?

- Do it — invisible is fine if it makes the app sturdier (recommended)
- Explain the change to me before you do it
- No — keep the current model

**Answer:** 

**Note:** 

---

## R-05 — Pages, the 24-panel rule, and whether images should keep a history

**Kind:** direction  ·  **Questions:** 4

These are behaviour questions the roadmap has to answer before P3/P4, because they decide how panels and images are modelled.

### 5a. Today a page holds at most 24 panels and anything beyond that overflows onto the following page automatically. Keep that, or should a page simply grow and scroll?

- Keep the automatic overflow onto the next page (recommended — it is what makes a comic page a page)
- Let a page grow: drop the 24 cap and scroll (no more overflow, no more pages needed)
- Raise the cap (say 48) but keep the overflow behaviour

**Answer:** 

**Note:** 

### 5b. How much do you actually use multiple pages?

- Often — multi-page projects are normal for me
- Sometimes — a story needs a second page now and then
- Rarely / never — I work one page at a time
- I use pages, but only as a way to get past the 24-panel limit

**Answer:** 

**Note:** 

### 5c. Should each image slot be able to keep a small history of what was rendered there (the last few renders, each with its seed, so you can go back to an earlier variant), or is only the current image ever needed? (History costs memory — a few hundred KB per kept image.)

- Keep a small history — the last 3 renders per slot (recommended)
- Keep a full history until I clear it (more memory, more control)
- Current image only — history lives in the Generated Prompt list, as now
- Not sure — decide based on what it does to performance

**Answer:** 

**Note:** 

### 5d. Which page-related conveniences would you want, if pages became first-class? (Tick anything interesting.)

- [ ] A page filmstrip with thumbnails, so I can see and click pages instead of using a dropdown
- [ ] Drag pages to reorder them
- [ ] Copy / duplicate an entire page
- [ ] Save a page as a template and reuse its layout
- [ ] A different art style or palette for one page while the rest of the project stays on the global style
- [ ] None of these — pages are fine as they are

**Answer:** 

**Note:** 

---

## R-06 — The shape of the interface: one inspector, modes, and expert controls

**Kind:** ui  ·  **Questions:** 4

The UI document (UI-IDEAS.md) proposes a different shape for the app. This ticket asks which parts of that shape you actually want before any of it is designed in detail.

### 6a. The biggest proposal: the page becomes a canvas of compact panel cards (number, title, thumbnail, status) and all editing happens in ONE inspector for the selected panel — instead of every panel carrying ~60 controls of its own. Acceptable?

- Yes — one inspector for the selected panel (recommended)
- Yes, but keep an 'expand all panels' mode exactly like today, so I can work the old way when I want
- No — I like editing every panel in place
- Not sure — show me a mock-up of one panel done both ways first

**Answer:** 

**Note:** 

### 6b. Should the app have explicit modes — Compose (describe panels), Render (queue, progress, re-roll), Review (read the comic, compare, export) — instead of one screen that does all three at once?

- Yes — three modes over the same project (recommended)
- No — one screen, but tidy it up
- Only Compose and Review; keep rendering inline
- Not sure — mock it up first

**Answer:** 

**Note:** 

### 6c. Should expert controls (prompt obedience/guidance, custom image sizes, seed boxes, the per-panel prompt override, per-panel style and size overrides, panel titles) be hidden behind an 'Advanced' switch by default? (Anything you have actually set stays visible, so nothing becomes invisible-but-active.)

- Yes — hide the expert controls until I switch Advanced on (recommended)
- Hide some of them — I will list which in the notes
- No — I want everything visible all the time

**Answer:** 

**Note:** 

### 6d. Where do you actually use it?

- Mostly on a phone
- Mostly on a desktop or laptop
- Both, about equally (recommended: design for phone first, desktop second)
- Tablet

**Answer:** 

**Note:** 

---

## R-07 — Which interface ideas do you want, and what must stay exactly as it is?

**Kind:** ui  ·  **Questions:** 3

A checklist of the concrete interface ideas in UI-IDEAS.md, plus the list of things that must not be touched.

### 7a. Tick everything you would want (I will sequence them — ticking is not a promise to build it immediately).

- [ ] A command palette (press a key, type 'duplicate', get the action) + a right-click menu on a panel
- [ ] A run panel: a queue of panels being rendered, with progress, pause/stop and a re-roll per panel
- [ ] Variant rendering as a first-class action ('give me 3 more takes of this panel') with a version strip per image
- [ ] A prompt inspector that shows the assembled prompt as labelled parts (globals · style · each character · location · action) instead of one blob, so I can see why a phrase is in there
- [ ] A page filmstrip with thumbnails instead of a page dropdown
- [ ] A library picker with search, filters and thumbnails instead of a dropdown, plus a marker showing when a panel's text has drifted from the library
- [ ] Undo everywhere (not just in the JSON editor) with an 'Undo delete 2 panels' button
- [ ] One consistent dialog style for every destructive action, with a 'just this panel' escape and a 5-second undo
- [ ] A first-run sample project and a three-step 'getting started' checklist
- [ ] A keyboard map (next panel, generate, variants, undo, save, export) with a '?' cheat sheet
- [ ] An accessibility pass (real buttons, focus handling in overlays, screen-reader labels)
- [ ] One notification area instead of several status lines scattered around

**Answer:** 

**Note:** 

### 7b. Of everything you ticked above, which one would improve your day the most — and why?

**Answer:** 

**Note:** 

### 7c. Tick everything that must stay recognisable (I will treat these as constraints, not suggestions).

- [ ] The amber / dark look and the colour-preset aesthetics
- [ ] The emoji chip style (🔄 ⧉ 🔒 ⭐ ⟳ ⇤ ✕ …)
- [ ] The bottom selection bar with Copy / Cut / Clear
- [ ] The full-screen menu on a phone
- [ ] The JSON editor (keep it, behind the new structure)
- [ ] The local-first model: no accounts, no server, my projects stay in my files
- [ ] One-click ⚡ Generate All from the top bar, always reachable

**Answer:** 

**Note:** 

---

## R-08 — Cadence, reporting, and the things that annoy you most

**Kind:** process  ·  **Questions:** 5

The last ticket — and the two most useful free-text questions in the whole batch.

### 8a. What is the single most annoying thing about the app today? (Not a feature request — the thing that makes you sigh. This decides the order of the UI work.)

**Answer:** 

**Note:** 

### 8b. Is there anything you have wanted but never asked for? (Half-formed ideas welcome — they often expose a missing piece of the model.)

**Answer:** 

**Note:** 

### 8c. How should I report progress on a long refactor?

- One short message per release, and a longer summary at the end of each phase (recommended)
- Only a message when a whole phase is finished
- Tell me everything in detail as you go

**Answer:** 

**Note:** 

### 8d. Do you want a phase-by-phase refactor log kept in the repo (like DEV-NOTES, but for the refactor: what moved where, what was deleted, what gotchas turned up)?

- Yes — a REFACTOR-NOTES.md alongside the other docs (recommended)
- No — the DEV-NOTES / AI-NOTES entries you already write are enough
- Only if a phase turns out to be complicated

**Answer:** 

**Note:** 

### 8e. Roughly how often do you use the app, and how much time do you usually have to answer questions like these?

- Most days — and I can answer a batch of questions quickly
- A few times a week
- Every week or two, when I get an idea
- Rarely, but I have time when I do (long batches are fine)

**Answer:** 

**Note:** 

---

Questions per ticket: R-01 (3), R-02 (4), R-03 (4), R-04 (4), R-05 (4), R-06 (4), R-07 (3), R-08 (5) — 31 in total.
