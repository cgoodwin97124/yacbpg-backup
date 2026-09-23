
# CHANGELOG — Yet Another Comic Book Page Generator

Version history, newest first. The Help → About panel (index.html) fetches and parses THIS file at runtime.
Entry format: `## <ver> — <date> — <title>` followed by `- <item>` bullet lines.

## 2026.09.23.3 — 2026-09-23 — Light / Dark / System themes and a color accent you choose
- **New: the whole app can be light.** **Edit → Preferences → Theme** now has a **Color mode** setting — **Light**, **Dark**, or **Match my device**. Every colour in the interface (page, panel cards, menus, header, buttons, the Library, Storyboard, Analysis, the JSON editor) is theme-aware, so switching is instant and complete. The default is **Dark**, so the app looks exactly as it always has until you change it.
- **New: pick your accent color.** The same panel has an **Accent color** row: eight ready-made swatches (amber, blue, green, purple, teal, pink, orange, red), a custom colour box, and a **Reset** button. The accent is the highlight colour used for borders, active buttons, headings and labels everywhere. If you pick a pale colour, the light theme automatically deepens it just enough to stay readable on white.
- **It's part of your project.** Your theme is saved with everything else, so 💾 Save / Export / Import carries it and importing a project applies its theme; it's also editable in the 🧩 JSON editor (`settings.theme.mode` and `settings.theme.accent`).
- **No flash on load** — the theme is applied while the page is still being built, so you never see a dark flash before a light theme or vice versa.
- **Fixed in light mode:** the small colored chips — ⇤ copy-previous-seed, ✕ clear-seed, ⇅ Move, 📋 Copy — and the red buttons (Delete, Stop, Re-roll, Clear image) were inheriting a low-contrast text colour from the platform stylesheet; they now use white/dark text explicitly. The default dark theme is unchanged, pixel for pixel.

## 2026.09.23.2 — 2026-09-23 — A header that stays put, Generate All / Pause / Stop in the menu, and full-screen menus by default
- **The top header bar (the app title and the Storyboard / Hide Menu / Menu: Side / Full Screen buttons) now stays
  on screen.** It's pinned to the top of the window, so it no longer scrolls away when you're working on a long
  page, and it also stays visible while the menu is open full-screen — the menu now starts just below it.
- **Menus open full screen from now on.** No more pressing ⛶ Full Screen every time: every menu section opens as a
  roomy full-page overlay (with the tabs still on screen and each section already expanded). Prefer the old
  compact top/side menu? Turn off **🎨 Edit → Preferences → "Always open the menus full screen"**. The **⛶ Full
  Screen** button in the header is the same setting — it reads **⤡ Exit Full Screen** while full-screen is on.
- **⚡ Generate All / ⏸ Pause / ■ Stop are now menu items**, sitting in the row right beside File / Edit / Library /
  Help and matching their size and style (**Stop** keeps its red button with white text). The old bottom bar is
  gone; **Generate All Panels On Page** is now simply **⚡ Generate All**. The status line stays at the bottom of
  the menu — and it now stays visible in full-screen mode too, so you can watch a run from there.
- **New Preferences option: keep ⚡ Generate All / ⏸ Pause / ■ Stop visible while the menu is hidden.** They move
  into the header bar, so you can start, pause or stop a run without showing the menu.
- **New Preferences option: keep the header bar visible in the other full-page views too** (Storyboard, Focus,
  Library, Analysis, the JSON editor and the user manual). Off by default, so those views still get the whole
  screen.
- Preferences (already under **🎨 Edit**) collects these options; they're stored with your project, so they come
  back with 💾 Save / Export / Import and can be edited in the 🧩 JSON editor alongside the other UI flags.
- The 🔍 Focus view's own Generate / Pause / Stop row is deliberately unchanged.

## 2026.09.23.1 — 2026-09-23 — Preferences moves to Edit, one-click Library, and a new version numbering scheme
- **Preferences now lives under 🎨 Edit** instead of the bottom of 📄 File. It still holds the "Ask for a password
  when hiding the panels" option — and it's where the new look-and-feel preferences (themes, always-visible
  header, full-screen menus, and so on) will appear.
- **📚 Library opens straight away.** Clicking 📚 Library now shows your library list immediately — no second click
  on the "Library" heading to unfold it. 📄 File, 🎨 Edit and ❓ Help still open collapsed so you can see their
  sections at a glance.
- **New version numbering: `YYYY.MM.DD.S`** — the date plus that day's release number, restarting at 1 each day
  (this release is 2026.09.23.1). Nothing about your project changes; it just makes the history easier to follow.
- Housekeeping: the Library's **⛶ Full Screen** button stays (you asked to keep it), and the standing rules about
  release numbering/dates now live in the developer notes at the top of `index.html`.

## 2026.08.16.24 — 2026-09-23 — Edit → 🧩 Open JSON Editor: your whole project as an editable document
- **New: a full-page JSON editor for your project**, opened from **Edit → 🧩 Open JSON Editor**. It shows the
  entire project — every page and panel, your saved characters/locations, the global art-style keywords, the size
  and guidance settings, the preset and the UI flags — as one formatted JSON document you can edit directly.
- **Only the things you can change elsewhere are editable.** Everything else is shown **greyed out and locked**
  (the `version` numbers, the current page, library ids, the document's structure) so an edit — or a Replace all —
  can never corrupt the project. Fields backed by a dropdown (image size, panel count, character/location
  selection) are checked against the same choices the app offers.
- **Find / Replace inside the editable values only** — with **Regex** and **Match case** options, a **🔍 Find
  next** that jumps to the next hit, **⇄ Replace** for one at a time, and **⇄ Replace all**, which asks first and
  tells you how many matches it is about to replace (Cancel leaves the document untouched, and Ctrl+Z undoes it).
- **Validate, then Apply.** Nothing changes until you press **✔ Apply**, which validates the whole document first:
  invalid JSON is reported at the exact spot and any problem — a locked field, a bad value, a removed entry — is
  listed with **‹ Prev / Next ›** navigation that selects the offending text. **🔄 Reload** throws your edits away
  and rebuilds the document from the live project.
- **Undo is built in:** **↩ Undo last apply** puts the project back exactly as it was before your last Apply, and
  **Ctrl+Z / Ctrl+Y** (up to the last 10 edits) undo/redo your typing in the editor.
- **Line numbers**, a syntax-highlighting checkbox you can turn off for very large documents, and 📋 Copy for the
  whole document.
- Generated images are not part of this document — they still only travel in the 💾 Export `.zip`.
- **Fixed while shipping this:** a long-standing unclosed `<div>` had nested the new editor (and the GitHub backup
  dialog) inside the hidden "new project" confirmation layer. Both now sit at the top level of the page where they
  belong — the editor could not be displayed at all until this was fixed.
- **Fixed (data-safety):** if the page ever failed to load its saved project (a script error before the boot step),
  the automatic save could write a blank default project over page 1. Saving is now blocked until the saved
  project has been read back in, so a load error can no longer overwrite your work.

## 2026.08.16.23 — 2026-09-22 — Panel actions no longer break the 🔍 Focus view
- **Fixed bug:** in 🔍 Focus (single-panel) view, **⧉ Duplicate** — and any other action that rebuilds the panel
  grid (Add Panel, Delete, switching page, changing the panel count) — threw `NotFoundError: Node.insertBefore:
  Child to insert before is not a child of this node` and left the page erroring on every click until you
  reloaded. The Focus view now re-opens by itself on the fresh card, so those actions just work while a panel is
  focused; the view also can't be left showing nothing.
- **Duplicate now says where the copy landed** in the status line (e.g. "Panel 1 duplicated — the copy is now
  Panel 2 (it has no images yet)."), which is the visible confirmation in Focus view that the copy was inserted.
- Housekeeping: removed a leftover duplicated header + fragment that had been sitting inside the embedded Issue
  Log ever since the 2026-08-15 docs consolidation (it was being shipped in the GitHub ISSUES.md backup).

## 2026.08.16.22 — 2026-09-22 — Full-screen menu hides the generate bar
- The full-screen menu no longer shows the bottom bar — **⚡ GENERATE ALL PANELS ON PAGE**, **⏸ Pause**, **■ Stop**
  and the status line are hidden there, so the section you're working in gets the whole screen. Everything in the
  normal (non-full-screen) menu is unchanged.
- A generation that's already running keeps running while you're in full-screen; leave full-screen to pause or
  stop it.

## 2026.08.16.21 — 2026-09-20 — Menu reappears after the full-screen view; the floating menu button is gone
- **Fixed: the menu stayed hidden after leaving the full-screen menu.** If the menu happened to be hidden when you
  opened the full-screen menu, returning with **← Back to page** left it hidden (the one case where the app needed
  a second click to bring it back). Closing the full-screen menu now always returns you to a page with the menu
  showing.
- **The floating ☰ menu button at the bottom of the screen has been removed.** The **☰ Hide Menu** button at the
  top is now the single control: it reads **Hide Menu** while the menu is showing and **Show Menu** while the menu
  is hidden. (If you hide the menu while scrolled down, scroll back to the top of the page to show it again.)

## 2026.08.16.20 — 2026-09-20 — Full-screen menu (and full-screen Library)
- **The whole menu can now open full-screen.** A new **⛶ Full Screen** button in the header (next to **▤ Menu: Side**
  and **☰ Hide Menu**) expands the menu — File, Edit, Library and Help — to fill the screen, which makes editing far
  easier on a phone or any cramped window. The tabs stay at the top so you can switch sections without leaving
  full-screen, and each section opens with its panels expanded so there's no clicking to unfold them first.
- **📚 Library → ⛶ Full Screen.** The Library toolbar now has a **⛶ Full Screen** button next to **⬆ Import…** and
  **📊 Analysis** — it opens the same full-screen view already showing the Library, with the Import and Analysis
  buttons available right there. It's a toggle: press it again (or **← Back to page**, or **Esc**) to return.
- Nothing about your library changed — it's the exact same live-editable list, so anything you type full-screen is
  saved immediately and shows up in the panel dropdowns just as before.

## 2026.08.16.19 — 2026-09-20 — Floating bottom buttons no longer cover content
- **Reserved space at the bottom of the page.** The page now keeps a strip of empty space at the very bottom, so you
  can always scroll the last panel (and its dropdowns/buttons) up above the floating controls — **▧ Hide Panels**
  (bottom-left), the **page navigator** (bottom-centre) and **✕ Hide Menu** (bottom-right). The strip is taller in
  portrait, where the page navigator sits higher to clear the two corner buttons.
- **Menu-on-the-side: the generate bar is never covered.** With the menu as a side column, the column is now sized
  so its bottom — the **⚡ GENERATE ALL PANELS ON PAGE** / **⏸ Pause** / **■ Stop** row and the status line — always
  ends above those floating buttons, and it re-measures itself when the window is resized or rotated. The generate
  bar also no longer gets squeezed to nothing when the menu content is long: the menu list scrolls instead.
- No buttons moved and nothing else changed — this is a spacing fix.

## 2026.08.16.18 — 2026-09-20 — Seed chips + header Generate, cross-page panel moves, page titles & reordering
- **Seed chips in the panel header.** Each panel's header Seed entry now has two small square buttons: **⇤** copies
  the *preceding* panel's seed (or clears this panel's seed if the preceding seed is blank/random or −1), and **✕**
  clears this panel's seed. On Page 1 the ⇤ button of Panel 1 is disabled (nothing precedes it); on later pages
  Panel 1's ⇤ copies the **last panel of the previous page**.
- **Generate button in the panel header.** A **🔄 Generate** button now also sits in the panel header, right after
  the Seed entry, doing exactly what the Generate button at the bottom of the card does.
- **Move a panel to another page.** The **⇅ Move** picker now also lists a **"Move to another page"** group —
  every other page (pages already at the 24-panel maximum are greyed out and marked "(full)") plus **"＋ New
  page…"**. Moving to an *earlier* page appends the panel at the end of it; moving to a *later* page inserts it at
  the beginning; "＋ New page" creates a page holding just that panel. The panel's data **and its generated images**
  travel with it, the view switches to the destination page, and if the panel was the only one on its page you're
  asked to confirm deleting that (now empty) page. Same-page reordering is unchanged.
- **Page Title + Page Summary.** File → Page Setup now has a **Page Title** (the old "Page Name") and a new
  optional **Page Summary** for each page. Both are saved with the page and shown in the Storyboard view (the
  title in its heading, the summary in a bar beneath the controls).
- **"Page N, Panel M" labels.** On a multi-page project, each panel's header now reads **Page N, Panel M** instead
  of just **Panel M** (single-page projects are unchanged; the Storyboard keeps its plain "Panel M" labels).
- **Reorder pages by renumbering.** File → Page Setup gains a **⇅ Renumber Page** control (shown when there is
  more than one page). Move the current page to any position and every page is renumbered around it — e.g. with
  pages 1–5, renumbering page 4 to 2 makes the old pages 2 and 3 become 3 and 4. All of a page's content (panels,
  images in memory, title, summary, seed, panel count) stays with the page.
- **Storyboard page navigator.** The Storyboard view now has its own **◀ / numbered pages / ▶** navigator next to
  "← Back to page" whenever the project has more than one page, so you can page through the storyboard without
  leaving it.

## 2026.08.16.17 — 2026-09-19 — Analysis: a dedicated Panel Action Prompt row across the panels
- The **📊 Library Analysis** matrix now has a dedicated **▶ Panel Action Prompt** row as its **first body row**.
  Its first cell carries the label and each of the other cells holds that panel's editable action prompt — the
  same freeform "what happens" text as the panel's Action Prompt box on the main page. It sits directly above the
  library-item rows, aligned with each panel's column.
- When you press **⇄ Swap rows / columns** (panels become rows) the action prompts become the **first column**,
  right after the panel names — i.e. it always stays "first" relative to the panels.
- Typing in a box edits the panel live (on the current page it updates the real panel Action Prompt and the
  panel's summary line; on a browsed page it's saved to that page). Boxes grow to fit their text automatically
  (capped, scrollable beyond that).
- Any **🎬 Action** library item cells for that panel refresh in place as you type — the ✅ / ＋ Add / — mark
  updates immediately, and using ＋ Add fills the action box too.
- Verified live on the "Cow in field" sample: the row shows/edits/saves each panel's action, the swapped view
  shows it as a column, it stays in sync with the cell editors and ＋ Add, updates an Action item's ✅→—→✅ as
  the text changes, and works on the current page and a second page; desktop + 390px layouts checked.

## 2026.08.16.16 — 2026-09-19 — Analysis: project defaults + per-panel style/size/seed
- The **📊 Analysis** overlay now has a **"Project defaults:"** bar at the top with the project's **NSFW**
  checkbox, **default art style**, **default image size**, and **seed** — all editable right there. Changes
  write straight through to the real settings (Edit → Art Style / NSFW, File → Page Setup size / seed), so the
  main page and the Analysis view never disagree; headers/keyword chips update immediately.
- Each **panel column** (or row) now shows three compact chips under its thumbnail — **🎨 style**, **📐 size**,
  **🎲 seed** — using the same small-button style as each image's ✕ / protect / ⭐ chips. Click a chip to edit
  it in place: style and size open a dropdown, custom size reveals W/H boxes with a ✓ apply button, and seed
  opens a one-line text box (blank = follow the page seed).
- Inherited values (using the project default) are shown dimmed with a dashed border; a panel's own overrides
  are shown in normal color (seed overrides in blue). Hover any chip for an explanation + the resolved value.
- Edits made while browsing **another page** in the Analysis page selector are written to that page's saved
  state (the same way the per-panel descriptions already work); the currently-loaded page edits the live
  controls. Nothing else about the project is changed.
- Verified live on the "Cow in field" sample: NSFW / style / size / seed all round-trip to the real settings;
  per-panel style, preset size, custom size (W×H), and seed all edit and persist, on both the current page and
  a second page; desktop + 390px-phone layouts checked (bar wraps cleanly, no overflow).
- Fix (same batch): **Backup to GitHub** could fail with `PUT 409 … does not match <sha>` on every file except
  the ones that happened to have a fresh response, because GitHub's contents GET is cacheable for ~60&nbsp;s and
  handed back a stale file SHA right after a previous backup. The contents-GET now uses `cache: 'no-store'`,
  and a 409 triggers one re-read-and-retry before reporting failure.
## 2026.08.16.15 — 2026-09-19 — Library → Analysis (panel × library cross-reference matrix)
- The 📚 Library menu has a new **📊 Analysis** button. It opens a full-page matrix that cross-references your
  library items against every panel on a page: **👤 Characters**, **📍 Locations** (and **🎬 Actions**, if you
  have any) along one axis, the page's **panels** along the other.
- The **leftmost column** (or top row) shows each library item's **name and global description**; the **top
  row** (or leftmost column) shows each panel's **representative-image thumbnail** (⭐ Cover if set, else its
  first image; a "No image" placeholder otherwise).
- Each intersection shows **✅** when that item is used in that panel. When it is, the panel's **per-panel
  description** is editable right there — one field **per character slot** (so a character used in two slots
  shows both), plus the location modifier. Empty cells offer a **＋ Add** button to drop that item straight
  into the panel.
- **⇄ Swap rows / columns** flips which axis is which. A **Page:** selector browses every page (you can edit
  other pages too — changes are written to that page), and an **Edit global descriptions** checkbox (off by
  default) makes the global descriptions editable inline.
- The matrix scrolls both ways with a **sticky first row and first column**. Nothing outside the descriptions
  you edit is changed — panels' selections only change when you click **＋ Add**.
- Verified live on the "Cow in field" sample (✅/Add cells, per-slot editing, swap, page selector, sticky
  headers) at desktop and 390px-phone widths.
## 2026.08.16.14 — 2026-09-19 — Library → Import (bring Characters / Locations / Actions in from a project file)
- The 📚 Library menu now has an **⬆ Import…** button. Pick one or more project files — a `.json` backup or a
  full `.zip` (the settings inside; images are ignored) — and it reads the library objects out of them,
  including old v1 backups (`charLibrary`/`locLibrary`/`actLibrary`).
- A selection modal lists the found items grouped into **Characters / Locations / Actions** (the Actions group
  appears only when the files contain any). Every row has a checkbox, an editable **name** and **description**,
  and a status tag; there are **Select all** / **Select none** buttons and a live selected count.
- **Duplicates:** an item whose name *and* description already exist is tagged "identical — skipped" and left
  out. If the name matches but the description differs, the row is flagged "name already exists" and offers
  three choices: **append** the new description to the existing one (default), **overwrite** the existing one,
  or **import as a new item** (new name).
- Nothing else in your project is touched — panels, settings, and images are left completely alone. Imported
  items get fresh ids and appear immediately in the Library and in every panel's dropdowns.
- Because the store now keeps Action items, a **🎬 Actions** bucket appears in the Library whenever any exist.
- Verified live against the sample "Cow in field" project (a real `.zip` and a legacy `.json` merged in one
  pass) plus synthetic duplicate/conflict cases; desktop and 390px-phone layouts checked.
## 2026.08.16.13 — 2026-09-18 — Per-panel Seed moves into the panel header (shows the resolved seed, pins on first run)
- Each panel's **Seed** box now sits in the **panel header** — right next to its title, **Images** count, and
  **Style** — instead of being tucked inside the ⚙ Panel accordion. It behaves the same way (type a value to
  override the page seed for that one panel; clear it to fall back to the page seed), keeps the same Enter-to-
  generate shortcut, and is still saved with the project.
- The box now **shows the seed the panel will actually use**: when it's empty it displays the resolved value as
  ghost text — the page seed + (panel number − 1), or "random" when no page seed is set. So you can see at a
  glance whether a panel is deterministic or free.
- **New: the seed is pinned on the first run.** Previously an unseeded panel rolled a fresh random seed every
  time. Now, when a panel has no seed (and no page seed), one random seed is chosen when it first generates,
  filled into its Seed box, and reused — so re-generating that panel reproduces the same image until you edit or
  clear the box. This makes "I liked that result, keep it" the default instead of "reroll every time."
- Verified live (mocked image service): pinning, page-seed fallback, per-panel override, and the header
  placeholders all behave correctly; desktop and 390px-phone layouts checked.
## 2026.08.16.12 — 2026-08-22 — File → New Project now clears the library (bug fix)
- File → 📄 New Project runs `doNewProject()` → `resetEverything(true)`, which only wiped the saved library
  objects (`comicGen.libObjects`) when the separate "Also permanently delete my saved library objects" checkbox
  in Edit → Reset was checked — and that checkbox defaults to unchecked and is reset to off after every reset, so
  New Project never actually cleared the library. The reusable library is supposed to be a fresh-start thing too.
- Fixed: `doNewProject()` now always removes `comicGen.libObjects` and re-renders the library panel, so File →
  New Project starts fully clean (characters, locations, and action-prompt library all wiped), independent of the
  Edit → Reset checkbox (that path is unchanged and still honors it).
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
