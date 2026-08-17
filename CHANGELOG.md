
# CHANGELOG — Yet Another Comic Book Page Generator

Version history, newest first. The Help → About panel (index.html) fetches and parses THIS file at runtime.
Entry format: `## <ver> — <date> — <title>` followed by `- <item>` bullet lines.

## 2026.08.16.11 — 2026-08-17 — Panel Library persistence replaced with "copy from previous panel" buttons
- The ⟳ **persistence** system is gone: characters, Location, and Panel Action Prompt no longer have a
  ⟳ checkbox that copies them into every later panel (and on to the next page). Per the author's request,
  each row instead has a small **⇤** button that copies that item — selection plus freeform
  description/modifier — from the panel directly before it. Click panel 2's ⇤ character button to bring
  over panel 1's character, panel 3's for the next one, and so on; the Location and Action Prompt rows
  have the same button. Panel 1 has no previous panel, so its ⇤ buttons are disabled. Nothing copies
  automatically anymore, and there is no cross-page carry.
- All chain machinery was removed: `syncState`/`carryNext` (and the cross-page carry to next page's
  panel 1), the divergence/still-in-sync logic, and the persisted `persist`/`locPersist`/`actPersist`
  flags. Existing saved projects keep their characters/locations/actions (the flags are simply dropped
  on the next save) — the author's page-1 data was verified intact.
- Help text, the user manual, and the developer docs (AI-NOTES) were updated to describe the ⇤ buttons.
## 2026.08.16.10 — 2026-08-16 — Pause actually pauses (bug fix)
- A real-world retest found that ⏸ **Pause** stopped the current panel's image but the run kept going.
  Root cause: the text-to-image plugin's promise has **no `.stop()` method**, so Pause couldn't cancel the
  in-flight image — it kept rendering (each image takes 10–40s), its result landed on the "paused" panel
  anyway, and the run only stopped after that panel fully finished. It looked like the run never paused.
- Fixed: every image request during a run now races against an **abort signal**. ⏸ Pause (and ■ Stop, and
  the tab-background pause) fires it, so the loop stops **instantly** — the in-flight image is abandoned
  (no wait, and nothing appears on the paused panel). Pressing ⚡ still continues from exactly the panel
  it stopped on. As a bonus, ■ Stop now cancels immediately too instead of waiting for the current image.
## 2026.08.16.9 — 2026-08-16 — Pause and continue a run
- The generate bar now has a **⏸ Pause** button between ⚡ and ■ Stop. While a *Generate All Panels On
  Page* run is in progress, ⏸ Pause stops it right after the current panel finishes its image — and ⚡
  **GENERATE ALL PANELS ON PAGE** then *continues* from exactly where it left off (it does not re-do the
  panels that already generated). Pause/Stop turn themselves off while paused, and the status line says
  which panel the run will continue from.
- **■ Stop** still fully cancels a run (⚡ then restarts from panel 1, as before). Pausing has no effect
  outside a run.
- The 🔍 **Focus** view's row got its own ⏸ Pause button that mirrors the sidebar one through the whole
  run/pause/continue cycle.
- Tab-background auto-pause (when the generator tab goes to the background mid-run) now also resumes
  where it left off — press ⚡ when you come back instead of restarting the whole page. A panel started
  via **Generate This Panel / Generate All From Here** starts fresh from that panel regardless of any
  stored pause point.
## 2026.08.16.8 — 2026-08-16 — ⚡ Generate All Panels On Page button in Focus view
- The 🔍 **Focus** (single-panel) view now has its own **⚡ GENERATE ALL PANELS ON PAGE** button with the
  exact same behavior — it renders every panel of the current page while you work in Focus. It sits in a
  row beneath the Focus navigation (◀ Prev / Panel / Next ▶), together with a **■ Stop** button (so you can
  cancel a run without leaving Focus) and the live status line. All three mirror the main bar exactly:
  the button is disabled while a run is in progress, ■ Stop becomes active during a run, and the status
  text stays in sync at all times. The focused panel itself is generated like any other — you can watch the
  page render panel by panel and flip between panels while it runs.
## 2026.08.16.7 — 2026-08-16 — "Generate All Panels On Page" + per-page panel counts clarified
- The ⚡ button is now labeled **⚡ GENERATE ALL PANELS ON PAGE ⚡** and is explicitly a current-page
  operation: it renders every panel of the page you're on (it always worked that way — the label now says
  so). The ■ Stop button's tooltip, the pause/stop status messages, the in-app help, and the user manual
  were updated to match.
- **Per-page panel counts:** the Number of Panels control in File → Page Setup is per-page — each page
  remembers its own panel count (1, 4, 6, 12, 24, or Custom 1–24) when you switch away and back, and
  ⚡ GENERATE ALL PANELS ON PAGE uses that page's count. The control's label now says "Number of Panels on
  This Page — each page remembers its own" so it's clear.
- The ⚡ button's label now sits on two clean lines (it was wrapping awkwardly), its text color is properly
  black-on-yellow again (a platform stylesheet override had silently made it white), and the button + ■ Stop
  row was rebalanced so both fit comfortably inside the sidebar.
## 2026.08.16.6 — 2026-08-16 — Page navigator + multi-page chain fixes
- **Page navigator:** when your comic has more than one page, a green page bar appears at the bottom center
  of the screen — ◀ Prev, a row of numbered page buttons, ▶ Next (your current page is highlighted). It
  jumps straight to any page and wraps around with ◀/▶. On landscape browsers it sits in the same bottom
  row as the floating buttons; on mobile/portrait it floats higher, above the ▧ Hide Panels and ☰ Menu
  buttons.
- **⟳ chains no longer break when you delete mid-chain:** removing a character/location/action (✕) from
  the middle of a copy chain previously froze that panel forever (and could scramble an unrelated panel's
  chain). Now the chain keeps flowing to every later panel, including the one you deleted.
- **⟳ chains respect what you set on the next page's panel 1:** when a chain carries to the next page, it
  only fills panel 1 if that spot is still blank (or already holds the same value). If you'd deliberately
  put a different character/location/action there, it stays — the chain pauses instead of overwriting it.
- The one-page-forward carry is unchanged: the chain lands on the next page's panel 1, and you decide there
  whether to continue it (turn that panel's ⟳ on to keep it flowing page to page, or leave it alone to
  stop).
## 2026.08.16.5 — 2026-08-16 — Add characters/locations straight from the Library menu
- Each section of the 📚 Library menu now has a small green **+** button to the right of its heading
  (👤 Characters / 📍 Locations). Click it, give the new entry a name and an optional reusable description
  (the same description used in every panel prompt that references it), and it's saved to that bucket and
  appears in every panel's dropdown immediately — no need to jump to a panel first.
## 2026.08.16.4 — 2026-08-16 — Panel Action Prompt box spans the full entry width
- The Panel Action Prompt textarea in a panel's 📖 Panel Library now spans the same combined width as a
  row's Identity dropdown + Freeform Description together (grid-column 1/3), so the action box is as wide
  as the character/location entry controls. The ⟳ copy-to-later-panels checkbox and ✕ remove button stay
  aligned with the other rows' columns.
## 2026.08.16.3 — 2026-08-16 — Panel library reverted to fixed slots; Library back to buckets
- Panels: each panel's accordion is again a single 📖 Panel Library showing **three fixed Character slots**, **one Location slot**, and **one Panel Action Prompt** (a plain freeform text box). Creating a character/location from a panel uses the three-prompt flow again: **name → reusable library description → separate panel description** that fills that panel's own slot. The 2026.08.15.1 row-based "Panel Objects" (Type column, add-object menu, extra rows) and the action library (＋ New Action, "From Action Library" dropdown) are gone; existing saved action prompts and custom-type objects were deleted.
- 📚 Library menu displays two buckets again — **👤 Characters** and **📍 Locations** — instead of one flat "Panel Library Objects" list with a Type dropdown per row; "+ Add Library Object" removed (entries are created from the panels). Entries keep their name/description/delete, edited in place.
- Hover/long-press tooltips (2026.08.15.5) still work on the slot dropdowns and description boxes.
## 2026.08.16.2 — 2026-08-16 — Fix: adding an Action via the Panel Objects Add button
- Two fixes for adding Actions from a panel's 🧩 Panel Objects menu. (1) If you opened **＋ New Action…** (freeform mode) and then switched to **Add from library → Action…**, the picker stayed stuck in freeform mode — the identity dropdown stayed hidden and the button still read "Ok", so clicking it with an empty description did nothing and the Action was never added. Switching the add menu to any other choice (or back to "— add object —") now fully resets the picker: identity dropdown shown, button back to "Add", placeholder restored. (2) Adding a library Action now uses the library entry's own action text when you don't type a freeform description (previously the slot was set to the empty description and the pick silently failed).
## 2026.08.16.1 — 2026-08-16 — Panel actions: no more name prompts
- Adding an Action from a panel's 🧩 Panel Objects "add an object" menu no longer asks for a name or description prompt — just pick **＋ New Action…**, type a **freeform action description**, and hit **Ok** (or press Enter). It lands straight in the panel's action slot (or as an extra action row if the panel already has an action) and appears in the panel's prompt. No library entry is created, so no name is needed. The **Add from library → Action… → ＋ New Action…** path works the same way. Characters, locations, and custom types still ask for a name, as before.
## 2026.08.15.6 — 2026-08-15 — Fix: image hover preview invisible in 🔍 Focus view
- Hovering/long-pressing a generated image in a panel's 🔍 Focus (single-panel) view now shows the preview again. The Focus view moves the real panel card into a full-screen overlay (.view-overlay, z-index 10000) that was painted ABOVE the preview overlay (z-index 9999), so the preview fired but rendered invisibly behind it. Bumped .img-preview to z-index 10002.

## 2026.08.15.5 — 2026-08-15 — Panel Objects tooltips + per-panel image size override
- Hover over (or long-press on touch) a 🧩 Panel Objects **Identity dropdown** or **Freeform Description** and its full contents appear in a floating tooltip — handy when a description is cut off.
- Every panel now has its own **Size** dropdown in the panel header, right next to Style: **\[Default (Global)\]** follows the Image Size in File → Page Setup, or override it with any of the same presets (512×512 / 768×768 / 1024×1024 / 1920×1080 / 1080×1920) or **Custom…** (own width × height, clamped 64–1920 × 64–1080; blank custom fields fall back to the global size). The override is saved with the panel — it survives saves, loads, imports/exports, and duplicating a panel — and is used by 🔄 Generate, single-slot generation, and ⚡ Generate All From Here.
## 2026.08.15.4 — 2026-08-15 — Fix: Backup dialog Close button
- The Close button stopped working right after the visibility fix: the hardened overlay is pinned with inline `display:flex !important`, which overrides perchance's `[hidden]{display:none !important}` rule — so `ghClose()`'s `hidden=true` no longer hid anything. `ghClose()` now also forces `display:none !important`, and a `_ghClosed` flag makes the 2s visibility guard stop re-showing it. Open → Close → Reopen verified.
## 2026.08.15.3 — 2026-08-15 — Fix: Backup dialog opening invisibly in some browsers
- The "⬆ Backup to GitHub…" dialog opened invisibly for the author (Firefox, devtools docked) even though it was in the DOM with `display:flex`. Hardened `openGhBackup()`: pins the overlay with inline `!important` styles, moves it to the end of `<body>`, raises its z-index to the max (2147483647), detects any ancestor that breaks `position:fixed` (transform/filter/perspective/contain) and falls back to a viewport-pinned absolute position, locks body scroll while open, and re-asserts visibility for ~2s so nothing can re-hide it. The dialog box is now scroll-safe in short viewports (margin:auto centering + max-height 100% + internal scroll) instead of being clipped. It also logs a diagnostic line (`[gh] opened — …rect… viewport… fixed-breaker…`) so if it ever fails again the console shows exactly why.

## 2026.08.15.2 — 2026-08-15 — "Backup to GitHub" — version history for your generator
- File → Backup Project → "⬆ Backup to GitHub…" saves your repo settings (owner, repo, token) in your browser. Backups themselves are run by the AI assistant on request — say "back it up to GitHub" in the chat — and each backup is a commit on GitHub you can view, compare, and restore. (There's deliberately no push button in the shipped generator: the token stays in your browser, scoped to your repo, and visitors can't trigger commits.)
- The backup includes main.pjs, index.html (the full live page), src/user-manual.html, and the PENDING / AI-NOTES / CHANGELOG / ISSUES docs.
- One-time setup: create a private repo + a fine-grained Personal Access Token (Contents: read & write, scoped to that repo), paste it in the Backup dialog, and press 🔍 Test. The token is stored only in your browser — it's never in exports, backups, or the shipped generator.
- Each backup lands as a commit titled "backup <version> — <timestamp>"; the dialog shows when the last backup happened.
## 2026.08.15.1 — 2026-08-15 — Batch: JSON-only backups drop image protection; unified "Panel Objects" in every panel
- JSON-only backups (⬇ Export / 💾 Save) no longer include the image protection status — restoring a .json-only backup comes back fully unprotected. Backups that also include the images (.zip export) keep the protection exactly as it was.
- Each panel's Panel Library (Characters / Location / Action) is now a single "🧩 Panel Objects" section: every object in the panel is one row showing its Type, Identity, and Freeform Description, with the same Type dropdown as the main 📚 Library menu.
- The "add object" dropdown offers ＋ New Character…, ＋ New Location…, ＋ New Action…, and ＋ New <Your Type>… for every custom type you've created (plus ＋ New Type… to invent another), or you can add an existing object from the "Add from library" list.
- A panel can hold any number of objects — extra characters, extra locations/actions, or objects of a custom type. A warning notes that too many objects can confuse the image AI, and no limit is enforced.
- Changing a row's Type moves it to the right place automatically (Character → a character slot, Location → the location slot, Action → the action box).
- Picking a saved character or location now auto-fills the row's Freeform Description with the library description (like actions already did).
- Your existing panels loaded exactly as before.

## 2026.08.14.7 — 2026-08-14 — Batch: Generate All From Here, floating panels button, hide-panels password, File → New Project, unified Panel Library Objects
- ⚡ Each panel's ⚙ settings now has "Generate All From Here" — regenerates that panel and everything after it (best for a fresh look after a tweak).
- The Hide/Show Panels button now floats at the bottom-left of the screen so it's always within reach, no matter how far you've scrolled.
- You can now require a password to show the panels after hiding them (File → Preferences → "Require password to show panels"). Set it once; hiding the panels locks them, and showing them again asks for the password.
- File → 📄 New Project starts a fresh project: back up the current one (💾 Save & New), skip the backup (Continue), or abort (Cancel).
- 📚 Library is now one unified "Panel Library Objects" section — one list with all your saved characters, locations, and action prompts. Each entry has a Type (Character / Location / Action — or make your own type), a name, and a description. What type an entry has decides which panel dropdown it appears in. Your existing saved characters, locations, and action prompts were migrated over automatically.
- Fixed an import bug (an import from a freshly-loaded page could fail with a "syncState" error).

- New 📚 Library section "My Saved Action Prompts" — save reusable action prompts (what happens in a panel)
  with a name and text; edit or delete them anytime.
- Every panel's 🎬 Action Prompt now has a "From Action Library" dropdown: pick a saved action to drop its
  text into that panel's action box, or "＋ New Action…" to create a new saved action right there. Your own
  typed actions still work exactly as before.

## 2026.08.14.5 — 2026-08-14 — Creating a character/location: separate panel description
- When you create a new character or location from the dropdowns, you're now asked three things: a name, the
  main library description (reusable — shows in 📚 Library and in every prompt that uses that entry), and a
  separate panel description that fills that panel's own slot in 📖 Panel Library.

## 2026.08.14.4 — 2026-08-14 — New Character / New Location moved into the dropdowns
- The ＋ New Character / ＋ New Location buttons are gone — each character slot's dropdown and the location
  dropdown now have their own "＋ New Character…" / "＋ New Location…" option.
- Pick it, name the entry (description optional), and it's created and placed in exactly the slot you chose.

## 2026.08.14.3 — 2026-08-14 — New characters & locations: optional description
- The ＋ New Character / ＋ New Location buttons now also ask for an optional freeform description — how the
  character looks or what the place is like — which is woven into every panel prompt that uses that entry.
  You can leave it blank and fill it in later from 📚 Library.

## 2026.08.14.2 — 2026-08-14 — Create characters & locations right from a panel
- Each panel's 👤 Characters and 📍 Location sections now have a ＋ New Character / ＋ New Location button.
- Click it, give the new entry a name, and it's saved to your library and used in that panel immediately —
  no need to jump to the Library tab first.

## 2026.08.14.1 — 2026-08-14 — Cleaner start: menus closed by default
- The app no longer opens a menu or highlights a menu button when it loads — everything starts tucked away,
  so nothing looks "open" that isn't. (Previously a previously-used menu could stay highlighted while a
  different menu was actually showing.)

## 2026.08.13.10 — 2026-08-13 — User Manual
- A full user manual is now included with the generator and opens from **❓ Help → 📖 Open User Manual** —
  a guide covering building panels, generating images, persistence and backups, multi-page projects, and more.
- The manual opens in a reader window inside the app (opening it in a separate browser tab isn't supported
  on this platform, so the in-app reader is the way to read it).
  (It's a snapshot document, so the very latest revisions are best seen in Help → About / Version History.)

## 2026.08.13.9 — 2026-08-13 — Stop button for any generation, per-image buttons restored, Show/Hide Menus
- The ■ Stop button now activates whenever ANY generation is running — a ⚡ batch, a single panel, or a
  single image reroll — and deactivates when nothing is in flight. Stopping still cancels everything cleanly.
- The per-image ↗ Open / ⬇ Save / ✕ Clear / 🔓 Protect / ⭐ Cover buttons are back directly under each
  generated image (they had been tucked into a collapsed "Image Controls" accordion). The 🖼 Image Controls
  accordion is gone; the buttons live under the image again, as small icon chips.
- Each panel's blue Show Menu button is now a single **Show/Hide Menus** toggle: click to open all of that
  panel's accordion menus, click again to collapse them.

## 2026.08.13.8 — 2026-08-13 — ⟳ Location & Action persistence + line delete buttons
- 📍 Location and 🎬 Panel Action Prompt now have a ⟳ persist checkbox (like the character slots): checking it
  copies that panel's location (with its modifier) or action prompt to all later panels on the page.
- All ⟳ chains (characters, location, action) now also reach exactly one panel beyond the page — panel 1 of the
  next page — then stop. The value lands when you switch to that page, and only if you haven't already changed
  that panel yourself.
- Each character line, the Location, and the Action Prompt now have a small ✕ delete button that clears the line
  (No Character Selected / No Location Selected + modifier cleared, action prompt emptied) and turns its ⟳ off.
- Choosing "No Location Selected" now also clears the location modifier box (matching the character behavior).

## 2026.08.13.7 — 2026-08-13 — Global Stop button
- The per-panel ■ Stop buttons are now one GLOBAL ■ Stop button next to ⚡ GENERATE ALL PANELS — always
  visible, and enabled while a run is in progress. Clicking it cancels the run cleanly (stops in-flight
  images, marks them "Stopped").

## 2026.08.13.6 — 2026-08-13 — Panel info summary + cleaner dropdown label
- Each panel now shows a one-line summary under its "Panel N" heading: the selected characters (or
  "No Character Selected"), the location (or "No Location Selected"), and the action prompt (truncated
  with "…" when too long, or "No Action Prompt"). It updates live as you edit and survives reloads.
- The "No Location Selected" dropdown option no longer shows square brackets.

## 2026.08.13.5 — 2026-08-13 — Show / Collapse Menu buttons restored
- Each panel's blue Show Menu button (next to 🔍 Focus) is back — it opens all of that panel's accordion
  menus (📖 Panel Library, 📝 Prompt, ⚙ Panel, 💾 Files, and the nested 👤/📍/🎬 sections) at once.
- The ⚙ Panel accordion's Collapse Menu button is back too — it collapses them all again.
- Like Stop + Hide Panels, these were lost in the same file-merge mishap; re-implemented 2026-08-13.

## 2026.08.13.4 — 2026-08-13 — Stop + Hide Panels restored
- The ■ Stop button and the ▧ Hide/Show Panels header button are back. They had been lost in a file-merge
  mishap (Help → About listed them but the app code didn't have them). Re-implemented 2026-08-13:
- ■ Stop (per panel, appears only while a ⚡ Generate All Panels run is going) cleanly cancels the run —
  stops in-flight images and marks them "Stopped".
- ▧ Hide Panels hides every panel card while rendering keeps running invisibly in the background; the choice
  is remembered and included in backups.

## 2026.08.13.3 — 2026-08-13 — App renamed
- The app is now called "Yet Another Comic Book Page Generator" — new title in the header and the Help > About page.

## 2026.08.13.2 — 2026-08-13 — Generate always visible + Hide Panels + Stop
- ⚡ Generate All Panels stays visible even when you hide the menu — it just sits in a slim bar on its own.
- New ▧ Hide Panels button in the header hides every panel card so you can watch the status line instead, while rendering keeps running invisibly in the background (show it again any time).
- Each panel now has a ■ Stop button that cleanly cancels a running Generate All Panels run.

## 2026.08.13.1 — 2026-08-13 — Show / Collapse Menu buttons
- Each panel now has a blue Show Menu button right next to 🔍 Focus that opens all of that panel’s accordion menus (📖 Panel Library, 📝 Prompt, ⚙ Panel, 💾 Files, and the nested sections) at once.
- The ⚙ Panel accordion now has a Collapse Menu button that collapses them all again.

## 2026.08.12.29 — 2026-08-13 — Deselect polish
- The "No Character Selected" dropdown option no longer shows square brackets.
- Selecting "No Character Selected" also clears that slot’s modifier box.

## 2026.08.12.28 — 2026-08-13 — Image buttons back under each image
- The 🖼 Image Controls accordion is gone — each image now has its own small icon button row right beneath it: ↗ Open, ⬇ Save, ✕ Clear, 🔓 Protect, ⭐ Cover (hover for the tooltip).
- Protected images keep the little 🔒 badge on their corner.

## 2026.08.12.27 — 2026-08-13 — Panel Library sections collapsible
- Inside 📖 Panel Library, the Characters, Location, and Action Prompt sections can now each be collapsed or expanded individually.

## 2026.08.12.26 — 2026-08-13 — Panels slimmed down with more accordions
- Characters, Location, and Panel Action Prompt now hide inside a 📖 Panel Library accordion.
- Panel Seed moved into the ⚙ Panel accordion.
- Each image’s buttons (Open / Save / Clear / Protect / Cover) moved into a 🖼 Image Controls accordion, so each panel just shows its images. Protected images show a small 🔒 badge on the corner so you can still tell at a glance.

## 2026.08.12.25 — 2026-08-13 — Panel buttons organized into accordions
- Each panel now shows just 🔍 Focus and 🔄 Generate, with the rest of the buttons tucked into three slim accordions: 📝 Prompt (prompt editor + copy), ⚙ Panel (duplicate / add / clear / delete), and 💾 Files (open all / save all / export).

## 2026.08.12.24 — 2026-08-13 — Per-panel art style
- Each panel now has its own Style dropdown (next to the Images selector) — pick any art style for just that panel, or [Default (Global)] to follow the global Art Style.
- The choice is saved with the panel, copied when you duplicate it, and included in exports.
- About the "sticky comic style": the style never actually stuck — those were the panel’s old images still displayed (images persist until you regenerate or reload the page). Switching style only affects new generations. If a panel still looks wrong after regenerating, it has a custom 📝 Prompt override pinning its keywords.

## 2026.08.12.23 — 2026-08-13 — Deleting the last panel/page resets the project
- Deleting the last panel of a page now warns that the page will be deleted too.
- Deleting the only page (via 🗑 Delete Page in File → Page Setup, or by deleting the only panel) warns you and then resets the whole project to defaults — like Edit > Reset to Defaults.

## 2026.08.12.22 — 2026-08-12 — Add a panel
- Every panel now has a green ＋ Add Panel chip next to 🗑 Delete — it inserts a new empty panel right after, moving later panels down and renumbering them (the exact inverse of Delete).

## 2026.08.12.21 — 2026-08-12 — Delete a panel
- Every panel now has a red 🗑 Delete chip. Deleting a panel removes it (settings, generated images, protection) and moves all later panels up, renumbering them.
- You are asked to confirm before a panel is deleted, and the last panel on a page cannot be deleted.
- ☝ Heads-up: verifying this feature destroyed the sample project in this browser’s local save (my test cleanup bug). Re-import your last export to bring it back — the generator code is unaffected.

## 2026.08.12.20 — 2026-08-12 — Fixed menu buttons overlapping hint text
- The small gray hint texts in the menu no longer get pulled up into the buttons above them (fixed for the Storyboard View chip, the Backup Project buttons, and everywhere else).

## 2026.08.12.19 — 2026-08-12 — Storyboard button in File → Project
- The 📄 File → Project panel now has a ▦ Storyboard View button — handy when the menu is on the side and you do not have to use the header button.

## 2026.08.12.18 — 2026-08-12 — Floating menu button now lives upper-left
- The floating Show Menu button now appears in the upper-left corner (where the header buttons are) instead of the lower-right.
- When the menu is open, the floating Hide button stays in the lower-right so it never covers the menu itself.
- It still only appears once you scroll past the header buttons.

## 2026.08.12.17 — 2026-08-12 — Floating menu button tracks the header
- On mobile, the floating menu button now appears whenever the header buttons are scrolled out of view — not just when the menu is hidden — so you can hide and unhide the menu from anywhere without scrolling back to the top.
- It doubles as a Show Menu / Hide Menu toggle and stays labeled accordingly.

## 2026.08.12.16 — 2026-08-12 — Header buttons moved to upper left
- The Storyboard / Hide Menu / Menu: Side buttons moved from the upper-right to the upper-left corner of the header, next to the title — handier when quickly hiding and unhiding the menu.

## 2026.08.12.15 — 2026-08-12 — Menu visibility toggle
- A ☰ Hide/Show Menu button in the header now hides or restores the whole menu panel (top or side). A floating ☰ Menu button appears bottom-right when it is hidden, so you can bring it back after scrolling.
- Your menu visibility choice is remembered between visits and included in project backups.

## 2026.08.12.14 — 2026-08-12 — Side menu stacks menu bar
- The File / Edit / Library / Help buttons now also stack full-width vertically when the menu is on the side — they stay side-by-side with the top menu.

## 2026.08.12.13 — 2026-08-12 — Side menu stacks chips
- With the menu moved to the side, the action-chip rows (Backup, Page buttons, Image Count) now stack vertically — they stay horizontal with the top menu.

## 2026.08.12.12 — 2026-08-12 — Guidance slider must be a whole number
- The Prompt Obedience slider now only allows whole numbers 1–30 — the image service rejects fractional values (your 9.5 was silently killing every generation after it).
- Saved fractional values (like 9.5) are rounded on load; generation also rounds defensively.

## 2026.08.12.11 — 2026-08-12 — Detect stalled image service
- If the image service stops responding (e.g. after a tab switch mid-generation), Generate now shows a clear error telling you to reload the page — no more silently doing nothing.
- Generate All Panels reports per-panel failures instead of stopping without a word.

## 2026.08.12.10 — 2026-08-12 — Generate-after-background fix
- After a tab-went-to-background pause, clicking a panel or image Generate chip silently did nothing — now it resets the pause flag and generates normally (or shows a real error).

## 2026.08.12.9 — 2026-08-12 — Prompt obedience slider
- New Prompt Obedience (guidance scale) slider in File → Page Setup (1–30, default 7) — how literally the AI follows your prompt.
- Green–yellow–red slider track + value readout warn about diminishing returns (red past ~15: oversaturation, halo/text artifacts).

## 2026.08.12.8 — 2026-08-12 — Safer project import
- Importing warns when you have a project in progress — Save (back it up first), Continue, or Cancel.
- Import fully clears the current project, including image protection.

## 2026.08.12.7 — 2026-08-12 — Protect Image
- Protect individual images instead of whole panels.
- Protected images are never overwritten by Generate — panel Generate keeps them and regenerates the rest.
- Backup buttons moved under File → Project.

## 2026.08.12.6 — 2026-08-12 — Project export/import + project name
- Project naming (shown in the header, used for export/save filenames).
- Export Project (.zip) bundles settings + every generated image (all pages).
- Import a project .zip to restore settings AND images; .json restores settings.

## 2026.08.12.5 — 2026-08-12 — Multiple pages
- Add, name, switch, and delete pages — each with its own panels, panel count, and seed.
- Duplicating a panel on a full page offers to start a new page with a copy of it.

## 2026.08.12.4 — 2026-08-12 — View modes
- Storyboard view — all panels at a glance with placeholders for empty panels.
- Single-panel Focus view with a panel list, dropdown, prev/next, and arrow keys.

## 2026.08.12.3 — 2026-08-12 — Panel operations
- Duplicate a panel — full data/prompt copy, no images.

## 2026.08.12.2 — 2026-08-12 — Image slots
- Protect a panel’s images from regeneration.
- Star a panel’s Cover/representative image.
- Set the image count for all panels at once.

## 2026.08.12.1 — 2026-08-12 — Menu & preview polish
- Collapsible menu panels.
- Image hover / long-press preview (configurable delay, with an on/off toggle).
- No Character Selected moved to the bottom of the dropdowns.

## 2026.08.11.1 — 2026-08-11 — Persistence & export overhaul
- All menu settings persist across reloads.
- JSON backup/import, silent Save… / Save as…, ZIP export with images.
- Per-panel reroll, multi-image panels, prompt editor, image size + upscale.

## 2026.08.10.1 — 2026-08-10 — Initial release
- Core panel grid with characters, locations, and actions.
- Menu system (File / Edit / Library / Help), style presets, keyword chips.
- Mobile memory hardening for generated images.
