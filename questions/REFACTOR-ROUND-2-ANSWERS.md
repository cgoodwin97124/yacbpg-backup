# REFACTOR ROUND 2 — THE AUTHOR'S ANSWERS (verbatim)

Form: `yacbpg-round2-2026-09-26` (v2026-09-26) · sent back 2026-09-26, 10:10.
Digested into `REFACTOR-NOTES.md` §1b. The questions themselves are `src/round2-form.html`.

**Two questions came back blank — `P2-01` 1a and 1b — and their notes still hold BUG-01's stray text
("I'm not seeing it lately."), so they need re-asking (or the recommended defaults).** Everything else is
answered, and every note below is the author's, verbatim.

---

## BUG-01 — The perchance "An error occurred" dialog (report, 2026-09-22)

**[1a]** Does the generator actually misbehave when the dialog appears — does anything stop working — or is the dialog the only symptom?
> I haven't seen it since then.  I think it may have gotten fixed; if I see it again I'll let you know.
> NOTE: I'm not seeing it lately.

**[1b]** The red console line (type, message, full stack).
> n/a
> NOTE: I'm not seeing it lately.

**[1c]** How often does it appear, and where?
> Once — and I have not seen it since

**[1d]** Which browser and operating system; does it still happen with extensions disabled / private window / another browser?
> I'm not seeing it any longer, so n/a.

**[1e]** Is there anything you want changed in the generator for this?
> Nothing — ignore it as long as the app works (recommended)
> NOTE: If I see it again I'll report it again.  👍

## P2-01 — Several projects, and how the app opens them

**[1a]** Opening a Recent entry (or importing a file) while the current project has unsaved changes — what should happen?
> (no answer given)
> NOTE: I'm not seeing it lately.   ← stray text from BUG-01; question left blank

**[1b]** When you load the generator, what should it open?
> (no answer given)
> NOTE: I'm not seeing it lately.   ← stray text from BUG-01; question left blank

**[1c]** What should a Recent entry remember beyond the project data itself?
> Nothing extra — the project data only (recommended)

## P2-02 — The project's own library, and the browser catalogue

**[2a]** How should the project's objects and the catalogue's objects appear together?
> Two sections: "This project" then "My catalogue"

**[2b]** Importing someone else's project file — what should happen to your catalogue?
> Offer to copy the file's objects in — my choice each time (recommended)

**[2c]** Deleting a library object that panels still reference?
> Tell me what it does today and I will decide
> NOTE: Warn me, then allow me to choose whether to clear the references, leave them as plaintext, or cancel the delete operation.

**[2d]** Anything else about the library you want changed while the ownership moves to the project?
> Let's build in hooks for the possibility to allow up to three reference images, in case we get Image to Image generation capability or in case the user wants to have an idea of what their characters or locations look like.

## P2-03 — Kept images live in the project file — what that costs

**[3a]** One file with everything in it, or a second, lighter option?
> Two buttons: full export, plus "compact (no kept images)"

**[3b]** Should the browser keep its own copy of a project's kept images?
> No — the file is the only home for kept images

**[3c]** At roughly what export size would you want a warning?
> 40 MB sounds about right.

## P2-04 — Old files, version stamps, and the upgrader

**[4a]** How far back should the automatic migration ladder reach?
> Only shapes from the v2 format onward (the last few weeks) — anything older goes to the upgrader (recommended)

**[4b]** The upgrader page:
> Convert it and give me the new file to download (recommended)

**[4c]** The JSON editor, once the store owns the state:
> Keep it as it is — edit raw JSON, normalise + validate on apply (recommended)

## P2-05 — When it saves, what it remembers, and where the backup goes

**[5a]** Should the working project save itself to the browser as you work?
> Yes, but only the panel data, never the images
> NOTE: Make this user configurable, but default to only the panel data.

**[5b]** A real undo/redo stack — how deep, and how long does it live?
> The last 50 changes, and it survives a reload (recommended)

**[5c]** Where should "back up to GitHub" point once projects are first-class?
> One file per project in a projects/ folder — I pick which project to back up (recommended)

**[5d]** Which of these would you like as its own small release while P2 is in flight?
> Nothing for now — just the refactor

## P2-06 — How P2's steps should be released and verified

**[6a]** Release cadence for P2's steps:
> One release per step, so I can watch each piece land (recommended)

**[6b]** What should each release note show?
> Both: a plain-language summary first, then the suite/differential/park-hash numbers (recommended)

**[6c]** Anything you are nervous about in a state layer — a behaviour you rely on, or a way you use the app that I should be careful not to disturb?
> Nope!
