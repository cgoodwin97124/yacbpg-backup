---
ticket: T-04
title: "Panel Library “Library Description” → editable, project-saved “Basic Description”"
kind: feature
status: done
released: 2026.09.25.1
answers: 6/6
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:19.954Z
generator: f0vstb2fbe
---

# T-04 — Panel Library “Library Description” → editable, project-saved “Basic Description”

- **Kind:** feature
- **Status:** done — shipped in **2026.09.25.1** (2026-09-25)
- **Answers:** 6 of 6
- **Answered:** 2026-09-25T01:30:19.954Z

## Original request (verbatim)

> In the Panel Library menu, let's rename Library Description to Basic Description. By default it populates from the character or location's Library Description stored in the main Library, but it *can* be edited, and editing it causes the panel to use the edited description rather than pulling it in from the library. I'd like to be able to save it with the project, and I'd also like a small chip button that refreshes it from the library's description. If the character or location's Basic Description differs from the description stored in the library, use the Basic Description instead of the library's description. Clicking the "copy from the previous panel" button copies the previous panel's Basic Description, regardless of whether it's edited. Also, I'd like each one to in some way visually call out a Basic Description that is different from the library's description.

## Clarification questions & answers

### 4a. Merge the two fields, or keep both? Today there is a read-only “Library description” and a separate editable “This panel — extra description”.

- **Answer:** Keep both — add “Basic Description” on top of the existing extra field
- **Note:** To be clear, in the panel menu I want the name, Basic Description (formerly Library Description, and pulls from that) and keep "This panel -- extra description".

### 4b. For existing projects, how should the old extra descriptions migrate so prompts don’t silently change?

- **Answer:** _(no answer given)_
- **Note:** See 4a. I want to keep the old extras, because the extras are the panel specific description - I can, for instance, describe what a character is wearing in this panel but have it change for the next one.

### 4c. If you later edit a library object’s description, what should happen to a Basic Description you have NOT touched?

- **Answer:** It stays frozen at the text it was filled with
- **Note:** It stays at the text it was filled with.  The user can click the "Refresh from library" button to overwrite it with the saved library text.

### 4d. Do the built-in characters and locations (Hero, City, …) get the identical editable / override / call-out treatment?

- **Answer:** Yes — identical treatment for built-ins and library items (recommended)

### 4e. How should “this differs from the library” be decided when comparing the two texts?

- **Answer:** Trimmed, exact comparison — case-sensitive (recommended)

### 4f. How should a differing Basic Description be called out visually?

- **Answer:** Badge + coloured border only

## Implementation

T-04 — shipped in **2026.09.25.1** (2026-09-25) — see CHANGELOG.md and DEV-NOTES.md (BATCH 2026.09.25.1).

- The read-only "Library Description" is now the editable **Basic Description** (`.pl-base-field` + `.pl-base-head` with the `edited` badge and the "⟳ Refresh from library" chip); the "This panel — extra description" box is unchanged and still appends after it (answer 4a).
- State: `chars:[{sel,base,extra}]` plus `loc` / `locBase` / `locExtra` — saved with the project, carried through Export / Import / .zip and shown read-only in the 🧩 JSON editor.
- Seeding and freeze (4c): the field is filled from the library when a selection is made and never follows later library edits; ⟳ Refresh from library is the only way to pull the current library text back. `migratePanelBaseDescriptions` seeds projects saved by earlier versions — verified to leave the built prompt byte-identical.
- Comparison (4e): trimmed, exact, case-sensitive. Call-out (4f): the badge and a coloured left bar, nothing else. Built-ins get the identical treatment (4d).
- ⇤ copy-from-previous-panel copies the Basic Description edited or not; the built prompt uses the edited text in place of the library's.
- Verified live in both themes: 96 fields / 96 badges / 96 ⟳ chips and zero old `.pl-libdesc`; the badge and border track edits (a whitespace-only difference is NOT flagged, a case change is); ⟳ clears them; ⇤ copies an edited base; the built prompt carries the custom text and not the library text.
