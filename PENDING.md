
# PENDING — Request Queue

**RULE (author-mandated 2026-08-13): EVERY new author request is logged into this file FIRST — before
any work starts — even when the author says "go ahead" immediately.** Greenlit requests go straight into
the 🟢 START NOW section; everything awaiting the author's explicit "go ahead" goes into the 🕒 QUEUED
section. Move entries between sections as their status changes (greenlit → START NOW; implemented →
✅ DONE, with the changelog version + a matching dev-note block in index.html). A future AI helper
session should READ THIS FILE before planning new work.

Convention: date-stamped entry with Status, Request, and implementation Notes (newest first within
each section).

---

## 🟢 START NOW — author explicitly said "go ahead" (implement immediately)

(Empty — the freeform-action request was implemented 2026-08-16; see ✅ DONE.)



## 🕒 QUEUED — persistent pending items, awaiting the author's "go ahead" (newest first, DO NOT start)

(Empty — the Tier 3 Backup-to-GitHub request was greenlit 2026-08-14 and moved to 🟢 START NOW.)

### 2026-08-15 — STANDING DIRECTIVE: back up to GitHub on every Save reminder
- **Status:** in force until the author says otherwise (no changelog entry — process/directive, not a feature).
  Recorded 2026-08-15 at the author's request ("add this to the ongoing directives: until I specify otherwise,
  always back it up to GitHub at the same time you remind me to Save"). Every future session must, at task end,
  run the GitHub backup in the same turn as the "press Save" reminder: openGhBackup() → ghPush() → ghClose().
  Also recorded in the top-of-file dev-notes and in AI-NOTES §standings.

## ✅ DONE — implemented (history, newest first)
### 2026-08-16 — "Generate All Panels On Page" label + per-page panel counts (implemented 2026.08.16.7)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.7). Author request: Generate All Panels should generate
  only the current page and be labeled "Generate All Panels On Page"; also be able to vary the number of
  panels per page. Findings: Generate All ALREADY only generated the current page, and per-page panel counts
  ALREADY worked (each page stores its own count). Implemented: relabeled the ⚡ button, ■ Stop tooltip, 3
  status strings, embedded help, and src/user-manual.html to "GENERATE ALL PANELS ON PAGE"; made the Page
  Setup control's label explicit ("Number of Panels on This Page — each page remembers its own"). Plus layout
  fixes the longer label forced: two-line `<br>` button text, compact sizes, `color:#000` restored (a
  platform `button:not([disabled]){color:inherit}` override had silently made the ⚡ button white-on-yellow),
  and a 6px right margin so ■ Stop sits fully inside the sidebar. Verified live: black-on-yellow two-line
  label, Stop fully inside, generation uses the current page's count only. Author's project data verified
  intact after testing.

### 2026-08-16 — Page navigator + multi-page chain fixes (implemented 2026.08.16.6)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.6). Author go-ahead given 2026-08-16. Combined
  implementation: (1) **Page navigator** — `#pageNav` (◀ Prev + numbered `.page-nav-page` buttons with
  `.active` + ▶ Next) shows fixed bottom-center only when pageCount() > 1; `updatePageNav()` called from
  `populatePageSel` (covers switch/add/delete/rename), `pageNavDelta(delta)` wraps. Landscape: bottom 16px;
  `@media (orientation: portrait)` bottom 74px so it clears the fixed ▧ Hide Panels (bottom-left) and ☰ Menu
  (bottom-right) buttons. (2) **BUG 1** — `clearChainFor(i, suffix)` now deletes `syncState[i + suffix]`
  (was `currentPage + suffix`); deleting mid-chain no longer permanently breaks the chain or corrupts an
  unrelated panel's entry. (3) **BUG 2** — `applyCarryToPanel1` + new `panel1IsPristine()` only land a
  cross-page carry on a pristine panel 1 (matches applied, or holds the same value, or is untouched
  default); a deliberately different value set there is preserved. One-page-forward carry + decision point
  unchanged (verified continue + stop paths). All verified live with mocked image generation; test pages
  deleted and author's project data restored afterwards.

### 2026-08-16 — Library menu: add Characters/Locations via green + button (implemented 2026.08.16.5)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.5). Author request: in the main Library menu, a small
  green square button with a + sits to the right of the Characters / Locations subheaders, above the rows'
  Delete buttons, and adds a new Character / new Location. Implemented: renderLibrary's bucket header is
  now a `.lib-bucket-row` flex row (h3 + `.btn-add-bucket`, 22×22 green #2ea043, "+") with
  title "Add a new Character/Location"; clicking calls the new `addLibraryEntryByType(type)` — two
  prompts (name, then the reusable library description), saves to libObjects, re-renders the library +
  all panel dropdowns. No panel is involved, so there's no separate panel-description prompt. Verified
  live: both buttons render green with correct titles, Character creation lands in the right bucket with
  the typed description, and panel dropdowns pick it up.

### 2026-08-16 — Panel Action Prompt box width (implemented 2026.08.16.4)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.4). Author request: the Panel Action Prompt entry
  control should have the combined width of the dropdown + freeform description controls of the
  Characters/Location rows. The action textarea (a 4-column grid row with nothing filling the description
  column) now gets `grid-column: 1 / 3` via a `.pl-act-wide` class — it spans both columns, leaving the ⟳
  and ✕ to auto-place into their correct columns (previously they sat misaligned in the middle columns).
  Verified by pixel measurement: action box left edge == dropdown left edge, right edge == description
  right edge, ⟳/✕ x-positions identical to the other rows.

### 2026-08-16 — Panel library → fixed slots; Library → Character/Location buckets (revert, 2026.08.16.3)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.3). Author request: revert panel adding of chars/locs
  to 2026.08.14.5 (name → reusable library description → separate panel description), keep one panel
  accordion, and revert the main Library menu display to separate Character/Location buckets. Author
  decisions: delete saved Action prompts + custom types; migrate any extra panel objects into empty main
  slots (none existed); remove "+ Add Library Object"; keep hover tooltips. Implemented: 📖 Panel Library
  accordion renders 3 fixed char slots + loc slot + freeform action box (no type column, no add-object
  menu, no extra rows, no action library); char/loc creation goes through newPanelLibraryEntry's 3 prompts
  via handleGridInput; Library menu renders 👤 Characters / 📍 Locations buckets (name+desc+🗑 rows);
  migrateLibObjects prunes non-Character/Location entries + deletes comicGen.libTypes; migratePanelExtras
  folds legacy extras into main slots at restore. Verified live: 3-prompt flows (library desc vs panel
  desc distinct), save→reload round trip, buckets render, tooltips intact, page error-free, panel library
  layout vision-checked.

### 2026-08-16 — Bug: Panel Objects "Add" button doesn't add an Action (fixed 2026.08.16.2)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.2). Author report: "When I click the Add button in
  order to add an Action to the Panel Objects, the Action is not added." Two root causes found + fixed:
  (1) switching the add menu from "＋ New Action…" (freeform) to "Add from library → Action…" left the
  picker in stale freeform mode — identity dropdown stayed hidden, button still said "Ok", and clicking
  it with an empty description returned early (nothing added). onPanelAddSelect now fully resets the
  picker on every menu change (mode cleared, dropdown shown, label "Add", placeholder restored), including
  "— add object —". (2) routeObject's Action branch ignored the library selection and set the action slot
  to the (possibly empty) freeform description — picking a library Action with no typed description
  silently added nothing; it now falls back to the library entry's action text. Verified live: the stale-
  switch sequence, clean library pick + prefill, freeform (slot + extra-row), and full reset.

### 2026-08-16 — Panel Menu: adding an Action without a name (implemented)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.1). Author request: when adding an Action via the
  Panel Menu's add flow, the name doesn't matter — a freeform description alone should suffice. Flow now:
  selecting "Action" from either entry point (the add-bar dropdown's "＋ New Action…" option, or the
  object picker's pick:Action → "＋ New Action…") switches the add bar into freeform mode: no name prompt,
  no library entry created. The description textarea shows "Freeform action description — goes straight
  into the panel prompt", the Add button relabels to "Ok", and Enter (without Shift) confirms. On Ok,
  the trimmed description lands directly in the panel's Action slot (#panel-act-N) and its summary
  (#ps-act-N); if the panel already has an action, it queues as an extra row. The picker's "＋" (__new_act__)
  now routes to the same freeform mode. Library entries (__new_char__ / __new_loc__) are unaffected.

### 2026-08-15 — Bug: hover-to-preview for images invisible in Focus view (fixed 2026.08.15.6)
- **Status:** DONE 2026-08-15 (changelog 2026.08.15.6). Author report: "The hover-to-preview for images
  doesn't work when the panel has Focus." Root cause: Focus moves the real panel card into #singleOverlay
  (.view-overlay z-index 10000), which painted ABOVE #imgPreview (z-index 9999). Fixed by bumping .img-preview
  to z-index 10002. Verified with real-browser hit testing (elementsFromPoint returns imgPreviewImg first),
  since html2canvas can't capture fixed-position elements.



### 2026-08-15 — Panel Objects tooltips + per-panel image size selector (implemented)
- **Status:** DONE 2026-08-15 (changelog 2026.08.15.5). Greenlit same day ("Go ahead and greenlight these,
  unless you need me to make any decisions..."). (1) Hover / long-press over a Panel Objects Identity dropdown
  (.po-sel) or Freeform Description (.po-desc) shows the full contents in a floating tooltip (delegated
  document listeners + a single #poTooltip div, 350ms hover / 500ms long-press delay, viewport-clamped,
  hidden on scroll/touchmove; perchance engine reload-proof). (2) Each panel header now has a Size dropdown
  (panel-size-N) next to Style: [Default (Global)] / the same presets as File → Page Setup / Custom… (inline
  panel-size-w/h inputs). getPanelImageSize(i) falls back to the global getImageSize() when blank/custom-empty;
  used by generateSinglePanel + generateSinglePanelSlot. Saved in panelState page[i].sizeSel/sizeW/sizeH
  (version stays 2 — fields are optional/back-compatible), restored on load, reset by Edit → Reset to Defaults,
  copied by Duplicate (whole-page[i] deep copy). Verified live: override/custom/fallback logic, save→restore
  round trip (persisted to localStorage, restored on reload), both tooltip types.


### 2026-08-15 — Bug: Backup dialog's Close button did nothing (fixed 2026-08-15.4)
- **Status:** DONE 2026-08-15 (changelog 2026.08.15.4). After the dialog-visibility hardening made the overlay
  visible for the author at last (2026.08.15.3), Close stopped working: the hardening pins the overlay with
  inline `display:flex !important`, which beats perchance's `[hidden]{display:none !important}` — so
  `ghClose()`'s `hidden=true` had no visual effect. Fixed by forcing `display:none !important` in ghClose and
  having the 2s visibility guard stop once `_ghClosed` is set. Open → Close → Reopen verified live.

### 2026-08-15 — Tier 3: "Backup to GitHub" feature (implemented)
- **Status:** DONE 2026-08-15 (changelog 2026.08.15.2). Greenlit 2026-08-14 evening; built + verified live
  2026-08-15. File → Backup Project → "⬆ Backup to GitHub…" → #ghBackupOverlay (owner/repo/token inputs; 💾
  Save settings / 🔍 Test connection / ⬆ Push to GitHub). Token stored ONLY in the browser (localStorage
  comicGen.githubOwner/Repo/Token/LastBackup) — never in panelState/exports/shipped code. ghPush() pushes:
  main.pjs (via the CORS-open perchance getGeneratorsAndDependencies API), index.html (fetch(location.href) =
  the live page — raw index.html is unreachable at runtime), src/user-manual.html (relative fetch), and the 4
  embedded docs as .md files; GitHub Contents API with GET-first sha resolution; commit msg "backup <ver> —
  <timestamp>". Verified live: dialog open/close, settings round-trip, auth-error handling. REMAINING for the
  author: create the fine-grained PAT and run the first real push (repo exists: cgoodwin97124/yacbpg-backup).

### 2026-08-15 — Batch (2 items, author: "Go ahead and make it happen!")
- **Status:** DONE 2026-08-15 (changelog 2026.08.15.1). Both items implemented + verified live;
  documented in the index.html dev-notes "BATCH 2026-08-15.1" block (incl. a TESTING GOTCHA about the
  debounced panel save overwriting test restores).
- **(1) Export protection gating** — `buildExportData(includeProtection)`; JSON-only paths pass false
  (exportSettings, settingsBlob → saveSettings/saveSettingsAs/confirmImportSave/confirmNewProjectSave) so
  protectSlots is stripped from all exported panel entries; exportZip passes true (kept). Import unchanged
  (nukes then applies). Verified: JSON-only export has NO protectSlots; zip export HAS them.
- **(2) Panel Objects consolidation** — each panel's 📖 Panel Library accordion (👤/📍/🎬 sub-accordions)
  replaced by one 🧩 Panel Objects accordion: warning, unified rows (Type/Identity/Freeform Description/⟳/✕,
  same Type dropdown as main menu incl ＋ New Type…), add bar ("Create new…" ＋ New Character/Location/
  Action/<CustomType>…/＋ New Type… + "Add from library…" picker). Primary rows reuse existing element ids
  (empty slots render no row); new per-panel `extras` array supports arbitrary objects; type change routes
  rows (Character→char slot else extras, Location→loc slot else extras, Action→action box else extras,
  custom→extras); ensurePanelObjectRow keeps ⟳ chains + carry working on previously-empty slots;
  buildPanelPrompt null-safe + appends extras; lib-desc auto-fills rows; desc-only rows preserved.
  Verified live: migration of existing data (author's panel 1: Blonde Woman + monkey + "hiding behind a
  door" all intact), picker add + prefill, custom-type creation ("＋ New Object…"), extras overflow +
  persistence across reload, type routing, desc-only loc preservation, prompt inclusion, real generation.
  (NOTE: the author's libTypes contains a custom "Object" type and libObjects has a few extra entries —
  "Sword", blank rows, "hide" — which appear to be the author's own experiments; left untouched.)

### 2026-08-14 — Batch (5 items, author: "Let's go ahead and start now!")
- **Status:** DONE 2026-08-14 (changelog 2026.08.14.7). All five greenlit items implemented + verified live;
  documented in the index.html dev-notes "BATCH 2026-08-14.7" block.
- **(1) Generate All From Here** — `generateComicPage(startPanel)` takes an optional start (guard + `from`);
  ⚡ button in each panel's ⚙ accordion (after Collapse Menu) calls `generateComicPage(i)`. Verified: button
  present, param honored.
- **(2) Floating Hide/Show Panels button** — `#panelsToggleBtn` now fixed bottom-left (16px/16px, z-index 1000).
  Verified position.
- **(3) Hide-panels password + Preferences** — `panelsPassword` (session-only, cleared on reveal);
  `#hidePasswordPref` in File → Preferences (persisted comicGen.hidePasswordPref); `#passwordOverlay`
  (set/enter modes, 👁 eyes, wrong password stays hidden). All dialogs exported. Verified live end-to-end.
- **(4) File → New Project** — `newProject()` + 3-choice overlay (Save & New / Continue / Cancel) →
  `doNewProject()` = resetEverything(true) + optional name. Verified overlay opens + cancels.
- **(5) Panel Library Objects consolidation** — one `comicGen.libObjects` store `[{id,type,name,desc}]` +
  custom types (comicGen.libTypes); Library menu is one "Panel Library Objects" section (Type select/name/
  desc/🗑 rows, "＋ New Type…"); dropdowns filter by type (char/loc/act slugs); `migrateLibObjects()` merges
  the legacy charLibrary/locLibrary/actLibrary (ids preserved) and deletes the keys — runs at boot AND inside
  applyImportedSettings so old backups import correctly; buildExportData exports libObjects (version 2);
  imports accept either format; reset consolidated to one checkbox (resetDelLibCheck). Author's 6 saved
  entries migrated with types intact and panel selections preserved. Verified: migration, per-row type
  changes, custom types, all three create flows, resolveDesc in prompts, legacy-key removal, old-format
  import → merged.
- **Bonus fix:** `let syncState = {}` was missing (implicit global only set by loadCurrentPage) — importing
  from a fresh page threw "syncState is not defined". Declared at IIFE top; legacy-format import now reports
  "Imported ✓".

- **Status:** DONE 2026-08-14 (changelog 2026.08.14.6) — new `comicGen.actLibrary` + 📚 Library "My Saved
  Action Prompts" section (renderLibrary('act'), + Add Action Prompt, name/desc/delete rows). Each panel's
  🎬 Action Prompt gained a "From Action Library:" dropdown (`panel-act-lib-N`) above the freeform textarea:
  saved actions INSERT their text into `panel-act-N` (dropdown resets to ''; textarea remains the source of
  truth so freeform actions are untouched); "＋ New Action…" → `newActLibraryEntry(i)` runs the same 3-prompt
  flow (name, library action text, optional panel action text). ⟳ re-propagates when persisted; summary/
  override/save updated. Backup/import/reset round-trip actLibrary (new reset checkbox). Verified live.
- **Request (author):** "I'd like to have a library of action prompts as well, working with the same options
  as the ones for characters and locations."
- **Plan:** new library `comicGen.actLibrary` (`{id, name, desc}`) + a 📚 Library tab section for it (+ Add
  Action Prompt button, name/desc/delete rows, renderLibrary/import/export/reset all extended). Each panel's
  🎬 Action Prompt section gets an "Action Library" dropdown: "(none)", "My Actions" optgroup, "＋ New
  Action…". Picking a saved action INSERTS its description into the existing freeform action textarea (the
  textarea stays the source of truth so freeform actions keep working — decision noted); "＋ New Action…" runs
  the same 3-prompt create flow (name, main library desc, panel desc) and inserts the panel desc (or lib
  desc) as the panel's action. ⟳/✕/summary/persistence all stay driven by the textarea.

### 2026-08-14 — Clarified (NOT a bug): description entered at creation doesn't appear in the panel's slot
- **Status:** DONE 2026-08-14 (changelog 2026.08.14.5) — the description typed at creation is the LIBRARY
  description (`entry.desc`, reusable, shown in 📚 Library, woven into every prompt that uses the entry via
  resolveDesc). The slot's own description field (modifier textarea) is intentionally per-panel and separate.
  Per the author's clarification, the create flow now asks THREE prompts instead: (1) name, (2) main library
  description, (3) a PANEL description that fills the placed slot's own description field
  (`panel-char-extra-i-s` / `panel-loc-extra-i`). Both feed this panel's prompt (library desc + slot desc as
  the modifier) — deliberately distinct. Brief write-up in src/ISSUES.md.

### 2026-08-14 — Request: move "New Character / New Location" into the dropdown (per-slot placement)
- **Status:** DONE 2026-08-14 (changelog 2026.08.14.4) — the ＋ buttons are gone. Every character slot + the
  location select now end with a "＋ New Character…" / "＋ New Location…" option (`__new_char__` / `__new_loc__`).
  handleGridInput intercepts the special value, reverts the select to 'none' first, then
  `newPanelLibraryEntry(type, i, s)` (name prompt, optional description prompt) creates the entry in the
  library and places it in THAT slot (s), updates summary/override/save, and re-propagates ⟳ chains if that
  line is persisted. Guards in propagateSlot/propagateLoc skip the special values so they never reach syncState.
  Verified live (picked option from a slot dropdown with stubbed prompt → entry created, placed in that slot).

### 2026-08-14 — Request: New Character / New Location buttons should also ask for a description
- **Status:** DONE 2026-08-14 (changelog 2026.08.14.3) — `newPanelLibraryEntry(type, i)` now runs TWO native
  prompts: a name (cancel aborts), then an OPTIONAL freeform description (cancel just skips it → desc:'').
  The description is stored on the library entry `{id, name, desc}` (same field 📚 Library edits) and feeds
  panel prompts via resolveDesc. Verified live with a stubbed prompt() (name + desc both saved, selected in
  the panel, summary updated, state restored afterwards).

### 2026-08-14 — Request: in Panel Library, create a new character / location right from a panel, then use it immediately
- **Status:** DONE 2026-08-14 (changelog 2026.08.14.2) — each panel's 📖 Panel Library → 👤 Characters and
  📍 Location sections now have a "＋ New Character" / "＋ New Location" button → `newPanelLibraryEntry(type, i)`
  (exported on window). It prompts for a name (native prompt(); cancel aborts), adds `{id, name, desc:''}` to
  comicGen.charLibrary / comicGen.locLibrary, re-renders the library tab + all panel dropdowns
  (renderLibrary + updatePanelSelects), then immediately SELECTS the new entry in that panel (char → first
  empty slot else slot 1; loc → the location slot), refreshes the panel summary, clears the panel prompt
  override, and saves. Buttons are in buildPanelGrid markup, so single-panel view (reuses the same card DOM)
  gets them too. Verified live (create char + loc, both selected immediately, persisted to localStorage).
- **Request:** The 👤 Characters and 📍 Location sections of each panel's 📖 Panel Library should offer a way
  to CREATE a new character / location. After creating it, the new entry must be selected/used in THAT panel
  immediately (dropdown repopulates, value set, modifier maybe left empty). The new entry must also persist
  to the normal library storage (comicGen.charLibrary / comicGen.locLibrary) so it appears everywhere.

### 2026-08-14 — Fix: on load, highlighted menu button didn't match the open menu (default state = all closed)
- **Status:** DONE 2026-08-14 (changelog 2026.08.14.1) — the app now ALWAYS starts with every menu group
  closed and no menu button highlighted. initMenu() hides all .menu-group's + strips .active from all
  .menu-btn's (no auto-restore of 'comicGen.activeMenu' on load; switchMenu still writes it for import-time
  restore). Also added the missing `hidden` to menuGroup-file so nothing flashes before initMenu runs. Root
  cause: old initMenu opened only the saved group and never hid the others (the File group was HTML-visible
  by default), so a saved 'help' left Help highlighted while File stayed open. Full write-up in src/ISSUES.md.

### 2026-08-14 — Fix: manual "↗ Open in new tab" → "No src manifest available for this page"
- **Status:** DONE 2026-08-14 — top-level navigation to a `src/` asset is NOT supported in this
  environment: the perchance service worker only holds "src manifest" state for the app page itself, so
  `window.open(location.origin + '/src/user-manual.html')` (the absolute URL the previous fix computed)
  opened a tab showing "No src manifest available for this page (service worker had no state for the client)".
  Since the in-app overlay reader works reliably, the "↗ Open in new tab" button and `openUserManualTab()`
  were REMOVED — the manual now opens ONLY in the in-app reader. Full write-up in src/ISSUES.md (2026-08-14,
  second entry). No changelog version (folded into the 2026.08.13.10 entry, same as the 404 fix).

### 2026-08-14 — Fix: 📖 Open User Manual 404 ("Cannot GET /src/user-manual.html")
- **Status:** DONE 2026-08-14 — manual now opens in an in-app overlay (`#manualOverlay` + `<iframe#manualFrame>`
  srcdoc from `fetch('src/user-manual.html')`), with a secondary new-tab button using the corrected URL
  `location.origin + '/src/user-manual.html'`. Root cause: Perchance's injected `<base>` makes relative URLs
  resolve against `perchance.org/<name>`, which 404s top-level `/src/...`. Full write-up in src/ISSUES.md.
  (The secondary new-tab button was later removed — see the entry above.)

### 2026-08-13 — Ship the HTML design doc as an in-project user manual
- **Status:** DONE 2026-08-14 (changelog 2026.08.13.10) — `src/user-manual.html` (copy of the styled design
  doc, footer updated to v2026.08.13.10 + snapshot caveat) + Help menu panel with 📖 Open User Manual →
  `openUserManual()` (window.open relative URL). Note: the manual is a SNAPSHOT — keep it roughly current
  when major features land (regenerate from the design doc / markdown or hand-edit), since it ships with the app.

### 2026-08-13 — Design document (markdown + styled HTML) delivered
- **Status:** DONE 2026-08-14 — user-facing doc written from the code + AI-NOTES, both versions handed over
  via attach_file (also kept at `scratch/design/` for this session). Docs-only; no changelog entry.
  Note: `src/AI-NOTES.md` remains the AI-facing architecture reference; the design doc is the human one.

### 2026-08-13 — ■ Stop button active during ANY generation
- **Status:** DONE 2026-08-13 (changelog 2026.08.13.9) — `syncStopButton()` =
  `setStopButtonEnabled(inFlightGen.size > 0 || generateAllRunning)` wired into renderPanelSlot (register +
  finally), generateComicPage finally, haltGenerations, stopAllGenerations, visibilitychange, and the three
  clear functions. Verified live: enables within ~200ms of a single-panel run starting, disables after stop/done.

### 2026-08-13 — Per-image Open/Save/Clear/Protect/Cover buttons back under each image
- **Status:** DONE 2026-08-13 (changelog 2026.08.13.9) — the `slotbtns-panel-N-K` rows moved out of the
  collapsed 🖼 Image Controls accordion into each `.panel-img-slot` (after the image box); the accordion was
  removed; buttons are icon-only chips (↗ ⬇ ✕ 🔓/🔒 ⭐) and `setSlotProtected` now toggles '🔒'/'🔓'.
  Same ids, so all JS selectors still work. Verified live (96 rows under the 24×4 slots).

### 2026-08-13 — Show/Hide Menus button (single button does both)
- **Status:** DONE 2026-08-13 (changelog 2026.08.13.9) — static label "Show/Hide Menus"; click →
  `togglePanelMenus(i)` (any `.panel-acc` open ⇒ collapse all, else open all). Verified live.

### 2026-08-13 — ⟳ propagate Location + Action Prompt to later panels (cap at next page's panel 1); add per-line Delete buttons
- **Status:** DONE 2026-08-13 (changelog 2026.08.13.8). Delete-button chain decision made: ✕ also unchecks the
  line's ⟳ checkbox and clears its syncState/carry chain entries (delete = full line reset).
- **Request:**
  - In the panel menus, give 📍 Location and 🎬 Panel Action Prompt the SAME ⟳ persist checkbox the
    character entries have, so checking it propagates that panel's location (incl. the location modifier)
    / action prompt to the later panels too.
  - Character propagation (and the new location/action propagation) should extend NO FURTHER than
    panel 1 of the NEXT page, if a next page exists (same-page panels + next page's first panel, then stop).
  - Add a small DELETE button next to each character line, and next to the Location and the Panel Action
    Prompt lines. Pressing it clears that line:
    1. Characters → set select to "No Character Selected" (value `none`) and clear that character's
       modifier text (`#panel-char-extra-N-S`).
    2. Location → set select to "No Location Selected" (value `none`) and clear the location modifier
       (`#panel-loc-extra-N`).
    3. Panel Action Prompt → clear the prompt entry (`#panel-act-N`).
- **Notes / current behavior:**
  - Character ⟳ propagation already exists: `.persist-check[data-s]` in each char slot →
    `isPersisted(i,s)` → `propagateSlot(i,s)` (copies sel+extra to panels i+1..24 of the CURRENT page via
    per-page `syncState['i-s'] = {sel, extra}`; a `stillInSync` check skips later panels the user has
    diverged from the chain).
  - Location (`panel-loc-select-N` / `panel-loc-extra-N`) and action (`panel-act-N`) currently have NO
    persist flag and NO propagation.
  - The `none` dropdown options exist and read exactly "No Character Selected" / "No Location Selected"
    (no brackets); `handleGridInput` already clears a char's extra field when its select flips to `none`,
    and the same pattern applies to `panel-loc-select-N` → `panel-loc-extra-N`. `schedulePanelSave()`
    persists after grid edits; `updatePanelSummary(i)` must be refreshed after any delete-button click so
    the `.panel-summary` line stays in sync. Decide (and note) whether the Delete button also unchecks the
    line's ⟳ persist checkbox / clears the chain (`syncState` / `stillInSync`).
  - Pages: `currentPage` + `panelState.pages` + `pageSession`; each page has its own 24-card grid
    (`loadCurrentPage` → `buildPanelGrid`). The NEXT page's panel 1 is NOT in the DOM until you switch to
    it, so cross-page propagation must buffer the value (e.g. in page/session state) and apply it when the
    next page loads.
  - Suggested implementation order: (1) extend the panel model + persistence with `persistLoc`/`persistAct`
    flags (collect/restore/export/import/reset), add the ⟳ checkboxes to the Location and Action rows, and
    wire them to same-page propagation; (2) add the cross-page panel-1 propagation (buffer on page switch,
    apply on page load); (3) add the Delete buttons (a small × next to each char line, the Location, and the
    Action Prompt) with the clear behaviors above. Keep character propagation behavior consistent.

### 2026-08-13 — Stop Generation button: improve discoverability (author couldn't find it)
- **Status:** DONE 2026-08-13 (changelog 2026.08.13.7) — implemented as a single GLOBAL ■ Stop button next
  to the ⚡ button, always visible, enabled while a Generate All run is active.
- **Request:** The per-panel ■ Stop Generation button EXISTS and works (24 × `.btn-view.btn-stop` →
  `haltGenerations()`, verified live 2026-08-13) but is `hidden` unless a ⚡ Generate All Panels On Page run is
  active (`setStopButtonsVisible`), so the author couldn't see it in normal use. Pick/implement a more
  discoverable presentation — e.g. always visible (disabled when nothing is running), or a single global
  ■ Stop in the Generate bar (`#gen-actions`), while keeping it functional during runs.
- **Notes / current behavior:** hidden-by-default design (changelog 2026.08.13.2 / 2026.08.13.4);
  `setStopButtonsVisible(visible)` toggles all; `haltGenerations()` sets `stopRequested`, stops in-flight
  gens, marks boxes `.stopped`. If "always visible" is chosen, the touch points are the `hidden` attribute,
  `setStopButtonsVisible`, and the `.stopped` reset paths.
