---
ticket: T-04
title: "Panel Library “Library Description” → editable, project-saved “Basic Description”"
kind: feature
status: answered
answers: 6/6
form: yacbpg-tickets-2026-09-25
updated: 2026-09-28T02:22:55.231Z
---

# T-04 — Panel Library “Library Description” → editable, project-saved “Basic Description”

- **Kind:** feature
- **Status:** answered (answered — awaiting the implementation go-ahead)
- **Answers:** 6 of 6
- **Answered:** 2026-09-28T02:22:55.231Z

## Original request (verbatim)

> In the Panel Library menu, let's rename Library Description to Basic Description. By default it populates from the character or location's Library Description stored in the main Library, but it *can* be edited, and editing it causes the panel to use the edited description rather than pulling it in from the library. I'd like to be able to save it with the project, and I'd also like a small chip button that refreshes it from the library's description. If the character or location's Basic Description differs from the description stored in the library, use the Basic Description instead of the library's description. Clicking the "copy from the previous panel" button copies the previous panel's Basic Description, regardless of whether it's edited. Also, I'd like each one to in some way visually call out a Basic Description that is different from the library's description.

## Clarification questions & answers

### 4a. Merge the two fields, or keep both? Today there is a read-only “Library description” and a separate editable “This panel — extra description”.

- **Answer:** Keep both — add “Basic Description” on top of the existing extra field
- **Note:** I'd like to keep both.  My intent is that the Library description is a character's default settings.  This would generally cover their name and basic appearance, not taking things like clothing into account.  I'd like to make it editable on the panel's character menu, in case there's a change I want to make in it for that panel; I might want to try out a different prompt, or possibly a prompt won't turn out the way I expect; I'd want to overwrite the original prompt at least temporarily in that case.  The "This panel - extra description" would be for things like their clothing, injuries they've suffered, and other things that might change from panel to panel, so I don't have to keep changing the Library Description or Basic Description.  
  
  And I'm finding that I also want to make a library of "This Panel - Extra Description", so that I could have for instance a library of costume prompts, or poses, or injuries, or similar.  
  
  (And I also want to change the name of "This Panel - Extra Description", maybe to something like "Panel Specific Description".  Let's go with that for now.)
  
  To summarize: 
   * I want the character or location to have a basic, default description drawn from the library, that I can modify for the panel if necessarily, but that the Library still maintains as a default.
   * I want the character or location to have a panel-specific description that might appear in multiple panels, but that I can change, possibly to preset, saved descriptions (such as a costume for a character). 
  
  And please double check your understanding of this point with me before proceeding on this step.

### 4b. For existing projects, how should the old extra descriptions migrate so prompts don’t silently change?

- **Answer:** Set each Basic Description to “library description + extra” — reproduces today’s prompt exactly, and flags those as differing (recommended)
- **Note:** See my answers to 4a.

### 4c. If you later edit a library object’s description, what should happen to a Basic Description you have NOT touched?

- **Answer:** It follows the new library text — it is still “inherited” (recommended)

### 4d. Do the built-in characters and locations (Hero, City, …) get the identical editable / override / call-out treatment?

- **Answer:** Yes — identical treatment for built-ins and library items (recommended)

### 4e. How should “this differs from the library” be decided when comparing the two texts?

- **Answer:** Trimmed, exact comparison — case-sensitive (recommended)

### 4f. How should a differing Basic Description be called out visually?

- **Answer:** A small “custom” badge beside the label, a coloured left border on the field, AND a dot on the ▸/▾ toggle row so it is visible while collapsed (recommended)

## Implementation

_Pending — filled in when the work is done (branch / PR, released version, changelog entry)._
