### 2026-10-05 — Toast X-to-close control (QUEUED, recon authorized, sequenced AFTER menu reversion ships)
- **Status:** 🕓 QUEUED — recon authorized; build NOT greenlit, sequenced after the menu reversion is finished, saved, and pushed.
- **Request (author, verbatim):** "the status toast is occasionally covering up things I need to click on, and they're not disappearing. Can they have an X control to close them?"
- **Scope:** recon toast system (notify/stacking/auto-dismiss) + questions if needed, then build after reversion ships.

### 2026-10-05 — Revert main menu to pre-Commands state, keep Ctrl-K palette (RECON ONLY, build NOT greenlit)
- **Status:** 🟢 START NOW — author greenlit the reversion (2026-10-05). Answers: (1) the missing piece is Page Setup — old way back until new way learned; (2) structure-only revert, keep newer rows (Paste/Focus/cursor-pref); (3) KEEP the View tab; (4) keep palette View group name; (5) Help reword OK; (6) usual process (suites+park/Save/re-push), deletion stays queued.
- **Build decision:** Page Setup MOVES back to File as plain H2 (single copy — duplicating its inputs would fork IDs/state); Edit › Page accordion goes away; palette Edit › Page rows stay as the new-way path. Panel Selection + Page accordions unwrap to plain h3s.
- **Request (author, verbatim):** "I'm finding some functionality missing or altered, so I'd like to keep the Ctrl-K Commands menu but revert the main menu to before the initial Commands menu implementation. Recon and ask any clarifying questions at verbosity 5. Thank you!"
- **Scope:** identify the Commands-menu intro release, diff the main menu then vs now, confirm what stays vs what returns; build waits for go-ahead.
- **Recon (2026-10-05):** Commands palette born in .31 (2026.10.04.31); pre-Commands main menu = .30: 4 tabs (File/Edit/Library/Help), Page Setup H2 inside File, Panel Selection as plain h3, no Paste/Focus rows in Edit, Focus only as per-panel chip, no View tab. Main-menu deltas since: .35 added View tab + moved Page Setup File->Edit-as-Page + new Edit Paste row (+Edit Focus row same era); .37 wrapped Panel Selection + Page as accordions. Page section controls byte-identical, only relocated+wrapped. All View-tab buttons have twins (File/Edit/Library/Help/header) except the tab itself; palette View-group rows all resolve via shared data-actions (w1-0/148/42/79/81/1-4), so dropping menuGroup-view breaks no palette row. Touch points for build: w1-150 + MENU_NAMES + activeMenu validation + Help items naming Edit-Page + devtests referencing view. .42 ✅ DONE 2026.10.05.42 — Page Setup moved File-as-H2, both accordions unwrapped to plain h3, Help/title strings reworded, suites green (114/18/18/38/79/24, byte-identical, 0 errors), pushed pre-Save; re-push after Save. View tab kept; palette untouched.

### 2026-10-05 — Cursor phase (BUILD GREENLIT)
- **Status:** 🟢 START NOW — author said "Let's do the cursor phase!"; recon + shape-confirm before code.
- **Agreed answers carried in:** (1) pref in Edit → Preferences; (2) gap checkboxes render ONLY while pref on; (3) Shift+arrows extend from anchor; (4) Duplicate/Move can target cursor; (5) gap-click inside/adjacent keeps selection else deselects; (6) Page Break = split + standard reflow OR new page with only the split-off panels.
- **Shape-confirm answers (author, verbatim decisions):** (1) cursor session-only OK; (2) pref default off YES; (3) page-break no-reflow = new page with only split-off panels; (4) three releases (.39 cursor+gaps+keys, .40 to-cursor destinations, .41 Page Break). .39 ✅ DONE 2026.10.05.39 — cursor+gaps+keys, 15th pref row (w1-180/181, w2-76), suites green, ✅ Saved + re-pushed 18 files (repo index.html = .39 verified). Next: .40 to-cursor destinations — answers: all recommendations approved (single keeps after-self, move-onto-self refuses, dup/add/paste-into-selection allowed, separate paste row, dropdown+palette, within-page only, one release). .40 ✅ DONE 2026.10.05.40 — Cursor group (w1-182…185), dropdown option, 3 commands (v35), suites green, ✅ Saved + re-pushed 18 files (repo index.html = .40 verified). Next: .41 Page Break — answers: all recommendations approved (two buttons, insert right after, refuse 0/N, inherit seed only, stay+clear, single release). .41 ✅ DONE 2026.10.05.41 — Page Break (w1-186), splitPageToNewPage (v36), suites green (114/38/18/18/79/24), pushed pre-Save; ✅ Saved + re-pushed 18 files 2026-10-05 (repo index.html = .41, w1-186 + splitPageToNewPage + commands.js v36 verified). Cursor phase COMPLETE (.39+.40+.41).

### 2026-10-05 â Parity round answers (plan approved, build NOT greenlit)
- **Status:** ð¢ START NOW â answers logged; phase (a) parity rows ✅ DONE 2026.10.04.38 — 29 acts w1-151…179, prompt dialog, Style + Preferences groups. Suites green, pushed pre-Save; ✅ Saved + re-pushed 18 files 2026-10-05 (repo index.html = .38, w1-179 + promptOverlay + Preferences verified).
- **Answers:** header extras stay (incl. Hide Panels + password flow); recommendations approved as listed; order parity â cursor â deletion; deletion deferred.
- **Decisions:** (2) new prompt dialog for free text ok; (3) full chooser rows for style/palette; (4) guidance chooser with fixed stops; (5) Library overlay kept, launched from palette; (6) palette Reset skips arming.

### 2026-10-05 Ã¢ÂÂ Toolbar-to-palette parity round (RECON, not greenlit)
- **Status:** Ã°ÂÂÂ¢ START NOW Ã¢ÂÂ recon + questions + recommendations only; no code yet.
- **Request (author, verbatim):** "I'd really like to have everything under the main toolbar menu available under the Commands menu, and then get rid of the main toolbar menu; that would lose us the Hide Menu, location toggle, and full screen menu controls as well. Everything under the main Edit menu that's not already in the Commands menu is fair game; specifically, the art style, color palette, keywords, and NSFW toggle."
- **Confirmed:** gap checkboxes render only while pref on; Page Break dialog gets a "Split without reflow" checkbox.
- **Scope:** gap analysis toolbar-vs-palette, questions, recommendations; cursor build waits for this round.

### 2026-10-04 ÃÂ¢ÃÂÃÂ Cursor answers + Preferences palette row + more Commands requests coming
- **Status:** ÃÂ°ÃÂÃÂÃÂ¢ START NOW ÃÂ¢ÃÂÃÂ cursor answers logged; Preferences-under-Edit-palette greenlit (rides with cursor build); further Commands requests awaited from author.
- **Answers:** (1) pref lives in Edit ÃÂ¢ÃÂÃÂ Preferences. (2) gap checkboxes render ONLY while pref on [recommendation]. (3) Shift+arrows extend selection from anchor. (4) Duplicate/Move can target cursor as destination. (5) gap click inside/adjacent to selection keeps it, elsewhere deselects. (6) Page Break = split with standard reflow + optional no-reflow checkbox (confirm shape before build).
- **New request (author, verbatim):** "Preferences isn't showing up under Edit in the Commands menu; I'd like to have it there as well."
- **Process:** author to state remaining Commands requests first; palette-touching ones ride with the cursor build, independent ones first.

### 2026-10-04 ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Edit Panel/Page accordions ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ DONE 2026.10.04.37
- **Status:** ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ DONE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ wrapped as open-by-default accordions in the same release as the palette anchor.

