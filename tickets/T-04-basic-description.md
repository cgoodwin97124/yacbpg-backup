---
ticket: T-04
title: "Panel Library “Library Description” → editable, project-saved “Basic Description”"
kind: feature
status: answered
answers: 6/6
form: yacbpg-tickets-2026-09-25
updated: 2026-09-25T01:30:19.954Z
generator: f0vstb2fbe
---

# T-04 — Panel Library “Library Description” → editable, project-saved “Basic Description”

- **Kind:** feature
- **Status:** answered (answered — awaiting the implementation go-ahead)
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

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
