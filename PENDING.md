
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

### 2026-09-23 — FEATURE REQUEST (8 items): always-visible header · Preferences under Edit · always-fullscreen menus · Generate All/Pause/Stop as top-level menu items · theme & color scheme · one-click Library · drop the Library's Full Screen button
- **Status:** IN PROGRESS — author greenlit 2026-09-23. **Quick wins shipped as 2026.09.23.1**
  (Preferences -> Edit, one-click Library, new versioning scheme). **Header / menu / theme ship next as
  2026.09.23.2.** The deferred 8b item (a separate app-settings JSON file) gets its OWN ship AFTER
  header/menu/theme; until then the theme and any future Preferences -> Locale setting live in
  `comicGen.panelState` so they travel in Save / Export / Import.
- **Request (author, 2026-09-23, verbatim):** "Some more changes: * I'd like to have the app title bar and four
  buttons next to it always visible. * I'd like Preferences to live under Edit rather than File. * I'd like to
  have the menus always go full screen rather than needing to click the Full Screen button. I'd like to toggle
  this behavior (full screen or current behavior) under Edit -> Preferences. * I'd like to have "Generate All
  Panels On Page" renamed to Generate All. I'd like to move Generate All, Pause, and Stop, to the menu as top
  level menu items, in the same size and style (including capitalization) as File, Edit, Library, and Help. The
  Stop button can keep its color scheme (red button with white text), but Generate and Pause can be in white
  text with their emojis preceding them as the other menu buttons. I'd like to have an option under Edit ->
  Preferences whether to keep them visible when the rest of the rest of the menu items are hidden. * User
  configurable color scheme and theme (light / dark / system if possible) under Preferences. * Currently, when
  I click the Library menu button I have to click again to open the library proper.  I'd like to not have to
  make that second click; clicking Library should just have it open. * I think the Full Screen button inside
  Library is redundant and can be removed.  Keep the top bar Full Screen button though, and it should keep its
  current functionality. As usual, perform all of the pre-implementation tasks before beginning work. Thank
  you!"
- **AUTHOR'S ANSWERS (2026-09-23, verbatim):**
  1. "So far I don't see a need for the header to stay visible in the other full page views, but I may change
     my mind on that. So let's make this configurable under Preferences. :)" — header becomes a sticky,
     always-visible bar (while scrolling + in the full-screen menu), plus a Preferences toggle for "also keep
     it visible in the other full-page views" (default OFF).
  2. "Let's keep **Menu: Side** as is for now." — leave the Menu: Side toggle and all side-mode behaviour
     untouched.
  3. "Your recommendation is good." — ONE shared persisted switch: the Preferences "open menus full screen"
     option and the header Full Screen button are the same state (label flips Full Screen / Exit Full Screen).
  4. "Extra buttons inside the same row. Generate/Pause exactly matching the tabs. And I'm seeing white text in
     amber buttons (see included screenshot); I want Generate and Pause to match this style." — Generate All /
     Pause / Stop go INLINE in `#menuBar` as siblings of the four tab buttons and match them exactly. Two
     screenshots confirm the tabs render as dark #2a2a2a fill + 2px #ffcc00 border + WHITE bold text (the
     white is real: the platform's normalize.css `button:not([disabled]) { color: inherit }` out-specifies a
     single-class button colour, so `.menu-btn`'s declared #ffcc00 never applies — do NOT "fix" the tabs).
  5. "Your recommendation." — while the menu is hidden, Generate All / Pause / Stop appear in the header strip
     next to the four header buttons (behind a Preferences toggle).
  6. "Yes, leave untouched." — the Focus view's own Generate/Pause/Stop row is not changed.
  7. "Your recommendation." — theme = Mode (Light / Dark / System) + a user-pickable accent, built on new CSS
     custom properties; the default dark theme must stay pixel-identical.
  8. "Yes, include it in the project!" — the theme is stored in `comicGen.panelState` so it travels in
     Save / Export / Import, and it becomes an editable field in the JSON editor.
  8b. "Actually, would it be worth it to create a separate JSON file for saved settings? Any app level
     settings would live in there and are loaded when the page loads. Let's mark this for a separate
     post-header/menu/theme code ship, and questions on this one can hold until after header/menu/theme ships,
     unless it makes more sense to do this work at the same time you do header/menu/theme. I'll default to
     your recommendation; no need to get my separate decision." — DECISION: separate ship AFTER
     header/menu/theme (the visible work keeps moving, and the settings file then becomes the home for
     app-level prefs, incl. the Locale item).
  9. "Let's keep it, because we're keeping the Full Screen top button for now." — **the Library's Full Screen
     button STAYS** (this supersedes the original bullet that asked to remove it). To handle in the
     header/menu ship: with menus-always-full-screen that button would otherwise act as a second "exit full
     screen" control — give it a sensible behaviour (its label already flips via
     `updateMenuFullscreenLabels()`).
  10. "Ship the quick wins first, then header/menu/theme. Also, lets have the versioning go YYYY.MM.DD.S, for
     year/month/day/day's serial release number. A new day's work should start the day's release number at 1
     and increment it for each release (single digits up to 10, unless you think 01, 02, 03, etc. would be
     better; I'll default to your recommendation here). Additionally, regarding date/time, I'm in Pacific Time
     (currently Pacific Standard Time, switching to Pacific Daylight Time when the US customarily switches).
     This suggests adding a Preferences -> Locale item, which would live in the settings defaults (see item 8,
     above)." — versioning becomes YYYY.MM.DD.S with S = 1, 2, 3... (NO zero padding: S is read by a human and
     compared as a whole number; first release under the new scheme = 2026.09.23.1). Dates/times in the docs
     use Pacific Time. The Preferences -> Locale item is DEFERRED to the settings-file ship.
- **PLAN:** ship 1 (2026.09.23.1) = (2) Preferences -> Edit, (6) one-click Library, (10) versioning + docs.
  (The Library Full Screen button stays, so item 7 now needs no work.) ship 2 (2026.09.23.2) = (1)/(5) sticky
  always-visible header + its Preferences toggle, (3) menus full-screen by default behind one shared switch,
  (4) Generate All / Pause / Stop as inline menu-bar items + the "keep visible when the menu is hidden"
  toggle, (7)/(8) theme (Light / Dark / System + accent) on CSS variables, included in the project and the
  JSON editor.
- **SHIP 1 DONE (2026.09.23.1):** the Preferences panel moved from the end of File to the end of Edit
  (`#preferencesPanel`); `switchMenu()` now expands the Library group so 📚 Library opens straight away; the
  Library's ⛶ Full Screen button stays (item 7 dropped); the `YYYY.MM.DD.S` + Pacific-time conventions were
  written into the index.html dev-notes and AI-NOTES §12. Verified live at 866x604 (File = Project + Page Setup,
  Edit = Art Style / Presets / Keyword List / Project JSON / Reset / Preferences, Library opens with its list
  visible and no second click, zero window errors).
- **SHIP 2 DONE (2026.09.23.2):** (1)/(5) `.app-header` is now sticky (`position:sticky; top:0; z-index:9000`)
  with `syncHdrHeight()` publishing its height as `--hdr-h` so `.menu-frame` parks under it; new Preferences
  toggle `comicGen.hdrAllViews` (`applyHdrAllViews()`) makes the header a fixed strip on the OTHER full-page
  views too (`body.hdr-all-views`, per answer 1, default OFF). (3) menus open full-screen by DEFAULT via
  `comicGen.menuFullscreen` (default ON); `syncMenuMode()` moves the real `#menuFrame` into `#menuOverlay`
  whenever the pref is on and the menu is visible, `applyMenuFullscreenPref(on, section)` is the single setter
  the prefs checkbox, the header ⛶ button and the Library ⛶ button all use, `updateMenuFullscreenLabels()`
  reads the PREF (not `isMenuFullscreen()`), and `requestCloseMenuFullscreen()` = `applyMenuVisible(false)` for
  the overlay's `← Back to page` + Esc. `body.menu-fullscreen .app-header` is `position:fixed; z-index:10005`
  so the header sits ABOVE the overlay, and overlays get `padding-top: calc(var(--hdr-h) + 14px)`; the old
  `body.menu-fullscreen .gen-actions { display:none }` was REMOVED so the status line stays visible. (4)
  ⚡ Generate All / ⏸ Pause / ■ Stop are now `<button class="menu-btn …">` siblings of the four tabs INSIDE
  `#menuBar` (ids `#menuGenerateBtn` / `#globalPauseBtn` / `#globalStopBtn`); `.menu-btn.menu-action` is a
  TWO-CLASS `color:#fff` (needed to beat normalize's `button:not([disabled]) { color: inherit }`) and
  `.menu-stop` is red+white; the new `comicGen.genAlwaysVisible` pref + `placeGenButtons()` move the three into
  `#hdrGenCtr` in the header strip when the menu is hidden. The Focus view's own row was left untouched
  (answer 6). All three new prefs (`comicGen.menuFullscreen`, `comicGen.genAlwaysVisible`, `comicGen.hdrAllViews`)
  are persisted, and included in `buildExportData()` / `applyImportedSettings()` / the JSON editor's
  `JSON_OPEN_FLAGS` + apply path. Verified live at 866x604 and 390x844 (7 menu buttons, header pinned at
  top:0 while scrolling, `--hdr-h` 94→181 when the gen buttons move into the header, zero window errors).
- **BACKUP NOTE (2026-09-23, 17:52 UTC):** ship 2 was pushed to `cgoodwin97124/yacbpg-backup` (7 files).
  IMPORTANT: `ghPush()` reads `index.html` from the PUBLIC generator page (`location.href`), which serves the
  last SAVED version — at backup time that page was still the pre-2026.09.23.1 build (changelog head
  2026.08.16.24, 906692 bytes), so the repo's `index.html` does NOT contain ship 1 or ship 2 yet, while
  PENDING.md / CHANGELOG.md / AI-NOTES.md / ISSUES.md / src/user-manual.html (read from the live DOM) DO.
  FIX: after the author presses **Save**, re-run `openGhBackup(); await ghPush(); ghClose();` so the repo's
  index.html catches up. When verifying, check the repo's index.html for `menuGenerateBtn` + `2026.09.23.2`.
- **BACKUP NOTE RESOLVED (2026-09-23, 18:06 UTC):** the author pressed Save and the re-push succeeded — the
  served page grew from 906692 to 971690 bytes, and the repo's `index.html` now contains `themeModeSel` +
  `menuGenerateBtn` + `preferencesPanel` + `2026.09.23.3` (verified via the GitHub contents API). The gap
  described in the note above is CLOSED; no outstanding backup action. Latest commit:
  `backup 2026.09.23.3 — 2026-09-23T18:06:33.488Z`.
- **SHIP 3 DONE (2026.09.23.3):** (7)/(8) the theme. Every hard-coded colour is now a CSS variable
  (`:root` table of 74 vars whose dark values equal the old literals → dark is unchanged, verified), plus
  `:root[data-theme="light"]` and a `@media (prefers-color-scheme: light){ :root:not([data-theme]) }` mirror;
  new Preferences controls `#themeModeSel` (Match my device / Light / Dark, default **Dark**) and
  `#accentRow` (8 preset swatches + `#themeAccentInput` + Reset); JS `applyTheme()`, `themeEffectiveMode()`,
  `accentVarsFor()` (contrast-aware in light mode), `applyThemeFromProject()`, `onThemeModeChange()`,
  `onAccentChange()`/`onAccentInput()` — all exported; persisted in `comicGen.themeMode`/`comicGen.accent`
  AND in `settings.theme` (`collectPanelState`), applied by `applyImportedSettings`/`jsonApplyDoc`, editable
  in the JSON editor; a pre-paint square block sets `data-theme` before the first paint (no flash). A
  `LIGHT-READABILITY` tail block pins the single-class coloured chips (the normalize `color: inherit` trap)
  in light mode only, and the red-fill rules use the new `--on-danger`. Verified: dark probes byte-identical
  (body #1a1a1a / cards #2a2a2a / accent #ffcc00 / Stop #ff4d4d), light contrast audit 1 marginal node
  (a disabled chip) vs 53 in dark, theme + custom accent survive a reload, panelState carries
  `theme:{mode,accent}`, JSON editor shows the theme values as editable, phone 390x844 has no overflow.
  Docs updated: changelog 2026.09.23.3, index.html dev-note BATCH 2026.09.23.3, AI-NOTES §14 + the
  BUTTON COLOURS BAIT bullet, src/user-manual.html.
- **NEW AUTHOR DIRECTIVE (2026-09-23):** the AI may pause work mid-task and ask the author for input
  (especially visual checks) whenever it reaches a genuine decision point — logged as its own directive entry
  in the QUEUED section and in the index.html dev-notes.
- **RECON (2026-09-23):**
  - **1. Header / "title bar + four buttons".** `index.html:1880` `<div class="app-header">` = a flex row whose
    LEFT side is `.header-btns` with exactly four buttons — `▦ Storyboard` (`openStoryboard()`), `☰ Hide Menu`
    (`#menuToggleBtn`, `toggleMenu()`), `▤ Menu: Side` (`#layoutToggleBtn`, `toggleLayout()`), `⛶ Full Screen`
    (`#menuFullscreenBtn`, `toggleMenuFullscreen()`) — and whose RIGHT side is `<h1>` + `#projectNameEl`
    (`.project-name`). CSS `index.html:1440-1441` (plain flex, no `position`). The header is currently NOT
    sticky, so it scrolls out of view on a long page; `▧ Hide Panels` (`#panelsToggleBtn`,
    `position:fixed; bottom:16px; left:16px`) and `#pageNav` (fixed, bottom-centre) are separate body-level
    elements and are NOT part of the four. Note the OLD `body.hdr-offscreen` machinery + the floating
    `#menuRevealBtn` were removed on 2026-09-20 (changelog 2026.08.16.21), so nothing re-shows the header
    controls once they scroll away — the class and `refreshHdrOffscreen()`/`initHeaderObserver()` no longer
    exist in code (only in old dev notes). In SIDE mode (`.menu-frame` `position:sticky; top:10px`) and TOP
    mode (`top:0`) the menu frame is sticky, the header is not.
  - **2. Menu-section visibility.** `body.menu-hidden .menu-frame { display:none }` (index.html:1450); every
    other full-page view (`#singleOverlay`, `#storyboardOverlay`, `#analysisOverlay`, `#menuOverlay`,
    `#jsonEditorOverlay`, `#manualOverlay`) is `position:fixed; inset:0; z-index:10000` (`.view-overlay`
    index.html:1592) so it COVERS the header entirely. `#menuOverlay` (the full-screen menu) additionally
    adopts the real `#menuFrame` element into `#menuOverlayBody` (`openMenuFullscreen()`, index.html:5171) and
    sets `body.menu-fullscreen`; CSS at 1843-1846 restyles the frame to fill the overlay and hides
    `.gen-actions`.
  - **3. Preferences** currently = one `config-panel` at the END of `#menuGroup-file` (index.html:2022-2025),
    header `<h2>Preferences</h2>`, holding exactly one control: `#hidePasswordPref` (persisted
    `comicGen.hidePasswordPref`, `onHidePasswordPrefChange()`). New Preferences options therefore need a home
    in `#menuGroup-edit` (which today holds Art Style & Keywords, the preset panel, the keyword list and Reset
    to Defaults).
  - **4. Generate All / Pause / Stop.** Markup `index.html:2141` — `.gen-actions` (the LAST child of
    `#menuFrame`, CSS 1485, `border-top:2px solid #ffcc00`) > `.gen-row` (flex, 1552) > [`.btn-generate`
    `⚡ GENERATE ALL PANELS<br>ON PAGE ⚡` → `generateComicPage()`; `.btn-pause-global` `#globalPauseBtn`
    `⏸ Pause` → `pauseGenerations()` (disabled unless a run is in progress); `.btn-stop-global`
    `#globalStopBtn` `■ Stop` → `haltGenerations()` (red `#ff4d4d` / white, uppercase)] + `#statusEl.status`.
    The Focus view has its OWN `.focus-gen` row (`#focusPauseBtn`/`#focusStopBtn`/`#focusStatusEl`) mirroring
    these — leave that alone unless told otherwise. `body.menu-fullscreen .gen-actions { display:none }`
    (1846, changelog 2026.08.16.22) is the rule that must be revisited once the buttons move into the menu bar.
  - **5. Menu bar.** `#menuBar` (index.html:1897-1902) = four `<button class="menu-btn" data-menu=…>` —
    `📄 File`, `🎨 Edit`, `📚 Library`, `❓ Help` — each `switchMenu(name)`. CSS `.menu-bar` (1822: flex, wrap,
    gap 6px) and `.menu-btn` (1823-1825: `flex:1 1 76px; background:#2a2a2a; color:#ffcc00; border:2px solid
    #ffcc00; padding:9px 4px; font-weight:bold; font-size:0.82rem`, `.active` = amber fill). i.e. the four
    existing buttons are AMBER text (not white), and in full-screen mode `.menu-bar` becomes a
    `flex-direction:row; flex-wrap:wrap` row with `.menu-btn { flex:1 1 auto; width:auto }` (1844-1845); in SIDE
    mode it stacks vertically (`body.side-mode .menu-bar { flex-direction:column; align-items:stretch }`).
  - **6. "Menus always full screen".** Today full-screen is opt-in per click: `toggleMenuFullscreen()`
    (5201) ⇄ `openMenuFullscreen(section)` (5171) / `closeMenuFullscreen()` (5187), state = `body.menu-fullscreen`
    + `#menuOverlay.hidden` + `#menuFrame` re-parented into the overlay and put back from the remembered
    `menuFrameHome`; Esc is wired at 5214. `switchMenu()` (9117) collapses a freshly-opened group via
    `collapseGroupPanels()`, and while `body.menu-fullscreen` it EXPANDS the group instead (`expandGroupPanels`)
    — which is precisely why the second click is needed in the normal (non-full-screen) menu.
  - **7. Library second click.** `#menuGroup-library` (index.html:2091) contains ONE `.library-section`
    (header `<h2>Library</h2>` + `.lib-toolbar` + `#libObjects`). `setupMenuCollapse()` turns every
    `.config-panel`/`.library-section`/`.help-panel` header into an accordion toggle
    (`toggleMenuCollapse`, 9100) and `collapseGroupPanels` (9104) sets `data-collapsed="1"` on all of them the
    first time a non-full-screen group is shown — so clicking `📚 Library` shows the Library section COLLAPSED
    and you must click its header (the second click the author is describing). `switchMenu` also early-returns
    when the group is already open (unless full-screen), so clicking `📚 Library` twice does nothing.
  - **8. Library Full Screen button.** `#libFullscreenBtn` (`.btn-lib-fullscreen`, index.html:2099) sits in the
    Library `.lib-toolbar` next to `⬆ Import…` / `📊 Analysis` and calls `toggleMenuFullscreen('library')`;
    `updateMenuFullscreenLabels()` (5155) relabels BOTH `#menuFullscreenBtn` and `#libFullscreenBtn`, so
    removal must also drop it from that loop + the `.btn-lib-fullscreen` CSS + the Help text that advertises it
    (`#menuGroup-help` item 5, index.html:2116) and the user manual (src/user-manual.html §9).
  - **9. Theme / color scheme.** There are NO CSS custom properties anywhere (`:root` / `--name` = 0 matches):
    the —187 KB `<style>` (index.html:1418-1856) hardcodes **376 hex colors across 68 distinct values** +
    20 `rgba(...)` shadows. The recurring roles: accent amber `#ffcc00` (44 uses — borders, labels, menu-btn,
    panel-card borders), white text `#fff` (27) / on-accent dark `#111` (19) / `#000` (12), green `#4dff88`
    (27 — project name, storyboard chip, page nav, kw-mode), surfaces `#2a2a2a` (13), `#1a1a1a` (11 body bg),
    `#333` (14) inputs, `#444` (19) borders/hovers, `#3a3a3a` (7), `#222` (5), greys `#555/#666/#888/#bbb/#ddd`
    (9/6/6/6/6), danger red `#ff4d4d` (14) / `#ff3333` (7) hover, blue `#4d9fff` (12), purple `#c8a2ff` (8),
    amber variants `#ffcc66` (9) / `#ffd95e` / `#ffb84d` (6) / `#ff8a4d`. A theme therefore means introducing
    CSS variables for those roles and swapping —376 literals (plus the rgba shadows) — a mechanical but
    wide-reaching refactor that must keep every screen visually identical in the default (dark) theme.
  - **10. Persistence plumbing** available for new prefs: `comicGen.*` localStorage keys written directly, and
    per-setting load/save helpers next to each control (e.g. `hidePasswordPref`). Anything the author wants in
    the File→Export document must be added to `collectPanelState()`/`applyImportedSettings()` AND classified in
    the JSON editor's `jsonFieldClass` (see AI-NOTES §13).
- **QUESTIONS FOR THE AUTHOR (asked 2026-09-23, awaiting answers):**
  1. **"Always visible" header — which situations?** My reading: make `.app-header` STICKY so the title + the
     four buttons stay on screen while you scroll (today they scroll away on a long page), AND keep them
     visible while the full-screen menu is open (today `#menuOverlay` covers them). Should that also apply to
     the other full-page views (Storyboard, Focus, Library, Analysis, JSON editor, manual) — i.e. a permanent
     top strip on every screen — or only to scrolling + the menu?
  2. **Header contents**: keep all four buttons in every case (Storyboard / Hide Menu / Menu: Side / Full
     Screen)? And if menus become always-full-screen (item 3), is `▤ Menu: Side` still wanted (it only affects
     the non-full-screen menu), or should it be hidden/removed in that mode?
  3. **Always-full-screen menus**: should the new Preferences toggle change the DEFAULT only (the header ⛶
     button still opens/closes full-screen for the current session), or should the ⛶ button and the pref be
     the SAME persisted switch (button flips the pref; label shows ⛶ / ⤡)? I recommend the latter (one source
     of truth). Also: with "always full screen" ON, what should the menu look like — header strip at the top,
     then the File/Edit/Library/Help row, then the section (i.e. the current full-screen overlay, just opened
     automatically)?
  4. **Generate All / Pause / Stop placement**: as three extra buttons in the SAME row as File/Edit/Library/Help
     (`.menu-bar`), or a separate row directly under it styled identically? And note the existing four buttons
     are AMBER text on dark — do you want Generate/Pause to literally use white text (slightly different from
     the tabs), or to match the tabs exactly (amber)? I recommend a separate row under the tabs, matching the
     tab styling exactly, with Generate/Pause white-text as you asked (and Stop keeping red/white).
  5. **Status line**: keep `#statusEl` where it is (bottom of the menu, under the tabs area) once the buttons
     move to the top? And should Pause/Stop keep their current disabled-until-running behaviour?
  6. **"Keep them visible when the rest of the menu is hidden"**: when you press `☰ Hide Menu`, where should
     Generate All / Pause / Stop appear — (a) in the header strip next to the four buttons, or (b) as a small
     floating bar at the bottom (where the old floating ☰ button used to live)? I recommend (a).
  7. **Focus view's Generate/Pause/Stop** (the `.focus-gen` row inside 🔍 Focus): leave untouched? I assume yes.
  8. **Theme scope**: is "user configurable color scheme" (a) Mode only — Light / Dark / System — plus a
     user-pickable ACCENT color (the amber role), or (b) a full palette editor (page background, panel
     surface, borders, text, each accent)? I recommend (a) now (Light/Dark/System + accent picker, maybe a
     secondary "highlight" picker), with the CSS-variable foundation in place so a full editor can come later.
  9. **Theme persistence/exports**: save the theme in localStorage only, or also inside `comicGen.panelState`
     so it travels in 💾 Save / Export / Import and becomes an editable field in the 🧩 JSON editor? I
     recommend including it (and making it editable in the JSON editor).
  10. **Library single click**: should the Library section simply always open EXPANDED (recommended), and with
     always-full-screen on, should clicking `📚 Library` open the full-screen overlay already showing the
     Library (recommended)?
  11. **Removing the Library ⛶ Full Screen button**: OK to also remove its mention from the in-app Help text
     and the user manual? (The header ⛶ button keeps its current behaviour.)
  12. **Version**: this is a big change set — one release (e.g. 2026.08.16.25) or split? I recommend one release
     once all answers are in, unless you want the quick wins (items 2, 6, 7, 8 = Preferences move, one-click
     Library, remove the Library button) shipped first as 2026.08.16.25.
- **RE-PUSH (2026-09-23, 18:06 UTC) — Status: DONE.** Request verbatim: "Saved.  Go ahead and re-push."
  The author pressed Save; the public page grew from 906692 → 971690 bytes (now contains `themeModeSel` +
  `menuGenerateBtn` + `preferencesPanel` + `2026.09.23.3`), and the GitHub backup was re-run with a
  cache-busting `window.fetch` patch (7/7 files pushed, commit `backup 2026.09.23.3 —
  2026-09-23T18:06:33.488Z`). GitHub contents-API verification: repo `index.html` = 971690 bytes with all
  three ship-1/2/3 markers, `src/user-manual.html` = v2026.09.23.3, CHANGELOG head = `## 2026.09.23.3`,
  PENDING has the SHIP 3 DONE bullet. **The backup gap is now CLOSED** (see the BACKUP NOTE RESOLVED bullet
  above). No code changed for this request, so no version bump.


## 🕒 QUEUED — persistent pending items, awaiting the author's "go ahead" (newest first, DO NOT start)

### 2026-09-23 — STANDING DIRECTIVE: the AI may pause mid-task and ask for input
- **Status:** ACTIVE (author-mandated 2026-09-23, in force until the author says otherwise). Docs-only — no
  changelog entry.
- **Directive (author, 2026-09-23, verbatim):** "Oh, I have suggestion about the AI workflow. If this works for
  you, if you ever get to a point during work that you need my input on something (especially visual checks) you
  have my permission to pause work and ask. You can add this as a new top level directive as well."
- **How to apply it:** when a genuine decision point appears mid-implementation (an ambiguous instruction, a
  visual/UX choice that can't be resolved from the existing code, a trade-off with no obviously-right answer),
  STOP, finish the current safe step, and ask the author in the chat reply instead of guessing. This is the
  natural companion to the 2026-09-20 directive (recon + ask BEFORE starting); it now also covers DURING the
  work. Still prefer "make a reasonable choice and note it briefly" for small/mechanical things (naming, minor
  spacing) — the directive is for real decision points, not for trivia the author would rather not be pinged
  about.

### 2026-09-22 — BUG REPORT: perchance error dialog "interactionPointerMoveHandler@…:34:3414"
- **Status:** RECON DONE 2026-09-22 — questions for the author recorded below, awaiting answers (per the
  2026-09-20 standing directive). Logged before any work, per the 2026-08-13 rule.
- **Request.** Author: "Hi, I'm getting this error." + screenshot
  (`scratch/message-attachments/pasted-image-20260922111138.png`).
- **What the screenshot shows (transcribed verbatim):** the perchance "*An error occurred*" dialog — the variant
  that reads "…its reported location is inside perchance's own runtime rather than your code — it may come from a
  browser extension or the platform itself. If your generator is working fine you can likely ignore this:". Its
  only stack line is `interactionPointerMoveHandler@?__generatorLastEditTime=1790045687825:34:3414`, followed by
  the usual "Note: You may need to open your browser console to see the full error message. The keyboard shortcut
  is Ctrl+Shift+J or Cmd+Option+J if using the Chrome browser, and you should see a red error message if you
  scroll down." and a `close` button.
- **Key limitation:** that dialog does NOT include the underlying exception message/type — only the platform's own
  frame. The real error text only appears in the browser console. Without it we're guessing at the cause.
- **RECON:** complete — see "RECON FINDINGS" below. **QUESTIONS FOR THE AUTHOR:** at the end of this entry;
  awaiting answers before implementing anything (per the 2026-09-20 standing directive).
- **RECON FINDINGS (2026-09-22):**
  - The frame is in the ENGINE's own page-bootstrap script, NOT our code. Verified against the served page
    (`https://da71b6561ab8d06c0f8758e7126559e7.perchance.org/f0vstb2fbe`, fetched + inspected): its line 34 is a
    16865-char minified line and column 3414 lands INSIDE
    `function interactionPointerMoveHandler(e){e.isTrusted&&(e.pointerType==="touch"||e.pointerType==="pen"||(sawMousePointerMove=!0,sawMousePointerDown&&sendInteractionSignals()))}`
    (the identifier starts at col 3381; the body expression at ~3410). That function is the engine's "human
    interaction signals" bot-detection helper, installed on every generator page via
    `window.addEventListener("pointerdown"|"pointermove", handler, true)`. It only reaches `sendInteractionSignals()`
    from the MOVE handler when a pointerdown happened FIRST (click, then move) — which matches the report.
  - Our code cannot throw from inside that function (it's engine code we cannot modify), and the engine's own stack
    cleaner strips everything below the first `PERCH.createPerchanceTree`/`PERCH.executeScriptTag` frame, so the
    single line shown IS the innermost surviving engine frame. Confirmed our generator does NOT (a) call
    `history.replaceState` — the engine overrides it to THROW when the pathname changes, a trap we avoid — nor
    (b) dispatch synthetic pointer events, and (c) our own pointer handlers are clean: dispatching
    pointerover/pointermove/pointerdown/pointerup on the live page produced ZERO console errors. The generator also
    loads no third-party scripts (no external `<script src>`, no dynamic script creation).
  - The dialog deliberately omits the exception message for engine-located errors (the `ctx.engineLocation`
    variant renders only the friendly intro + the stack), so the real `TypeError: …` text is only in the browser
    console — exactly what the dialog's own note tells the author to open.
  - Not reproducible from the AI helper's preview: synthetic events are never `isTrusted`, so the engine handler
    returns immediately (verified). The trigger is real/trusted input in the author's browser.
  - **PLATFORM BUG REPORT FILED 2026-09-22 — id `923578bb`** (category preview-page, severity annoyance): asks the
    platform to (a) try/catch that handler chain / always remove its listeners, and (b) include
    `error.name + ": " + error.message` for engine-located errors. Append follow-ups with
    `platform_bug_report({appendToReportId:"923578bb", note})` once the author supplies the console message.
- **MOST LIKELY CAUSE:** a browser extension (or a platform-side bug) making `e.isTrusted`/`e.pointerType` access
  throw inside the engine handler — the dialog's own text names extensions as the prime suspect. Nothing for the
  generator's code to fix unless the author's console message says otherwise.
- **QUESTIONS FOR THE AUTHOR (awaiting answers; do NOT implement anything yet):**
  1. Does the generator actually MISBEHAVE when this happens (does anything stop working), or is it only the
     dialog? (The dialog itself says it can likely be ignored if the generator works fine.)
  2. Please open the browser console (Ctrl+Shift+J, or Cmd+Option+J on Mac), then move the mouse again and copy the
     RED error line — the actual exception message plus the full stack. That one line pins the cause.
  3. Does it appear once, or on every mouse move after it first shows? In edit mode only, or also on the
     saved/public page?
  4. Which browser + OS, and does it still happen with extensions disabled / in a private window / a different
     browser? If it vanishes, it's an extension.
  5. Is there anything you want changed in the generator for this? (Engine-side there's nothing we can fix from
     here beyond the platform report I filed.)

### 2026-09-20 — STANDING DIRECTIVE: recon + clarifying questions before implementing any request
- **Status:** in force until the author says otherwise (process/directive — no changelog entry).
- Recorded 2026-09-20 at the author's request ("after I enter a new change request (including this one), please
  recon the code and ask me any clarifying questions if you have any, before continuing"). Every future session
  must, on receiving a change request: (a) log it in this PENDING file first (existing 2026-08-13 rule), (b)
  RECON the relevant code, (c) ASK any clarifying questions and WAIT for the answers before implementing, and
  (d) record the recon findings + the answers so they survive compaction. Where to record them (author's open
  question): the recon/Q&A live in the per-request PENDING entries (durable, request-scoped); durable
  architecture facts this recon uncovers also go into AI-NOTES.md. Do NOT create a volatile scratch/ `.md` for
  this — scratch/ is wiped between sessions, so a volatile file would lose the answers.
- **Note:** this doc + the embedded doc blocks are the ONLY durable homes; the standing directive is also
  mirrored in the top-of-file dev-notes and AI-NOTES §standings.

### 2026-08-15 — STANDING DIRECTIVE: back up to GitHub on every Save reminder
- **Status:** in force until the author says otherwise (no changelog entry — process/directive, not a feature).
  Recorded 2026-08-15 at the author's request ("add this to the ongoing directives: until I specify otherwise,
  always back it up to GitHub at the same time you remind me to Save"). Every future session must, at task end,
  run the GitHub backup in the same turn as the "press Save" reminder: openGhBackup() → ghPush() → ghClose().
  Also recorded in the top-of-file dev-notes and in AI-NOTES §standings.

## ✅ DONE — implemented (history, newest first)

### 2026-09-23 — FEATURE REQUEST: JSON editor in a full-page overlay (Edit menu) with Find/Replace
- **Status:** DONE 2026-09-23 (changelog 2026.08.16.24). Shipped as **Edit → 🧩 Open JSON Editor** — a full-page
  overlay editing the whole project as one JSON document.
- **Request (author, 2026-09-23, verbatim):** "Would it be possible to add a simple JSON editor in a full-page
  overlay? It should live under the Edit menu. The main functions I want are the ability to Find/Replace with an
  option for a global replace, and for the only editable fields in this JSON editor to be the ones the user could
  edit elsewhere in the app (i.e. panel titles, seed values, library data). Please ask any clarifying questions
  you need answers to before implementing. Thank you!"
- **RECON (2026-09-23):**
  - **Edit menu:** `#menuGroup-edit` holds 4 blocks — Art Style & Keywords (`#globalPos`/`#globalNeg`/`#nsfwCheck`),
    Presets (`#presetStyle`/`#presetPalette` → `comicGen.preset`), Full Keyword List (read-only chips), Reset to
    Defaults. The new "🧩 Open JSON Editor" block went at the end of that group.
  - **Full-page overlay precedent:** `.view-overlay` — `#singleOverlay`, `#storyboardOverlay`, `#analysisOverlay`,
    `#menuOverlay` — each `.view-overlay` > `.view-top` (`← Back to page` + `.view-title` + toolbar) + body;
    `#analysisOverlay` was the closest model (full-page tool with its own toolbar). z-index: `.view-overlay` 10000,
    `#manualOverlay` (`.manual-overlay`) 10001. Needed Esc handling + exports on `window`.
  - **What's actually persisted** (AI-NOTES §state): `comicGen.panelState` = `{version:2, projectName,
    imageSizeSel, imageSizeW, imageSizeH, guidanceScale, previewDelay, previewOn, globalPos, globalNeg, nsfw,
    currentPage, pages:{N: {name, summary, panelCountSel, panelCountCustom, seed, 1..24: {chars:[{sel,extra}]×3,
    title, protectSlots:[bool×4], loc, locExtra, action, seed, imgCount, style, promptOverride,
    extras:[{type,sel,desc}]}}}}`; `comicGen.libObjects` = `[{id,type,name,desc}]`; `comicGen.preset` =
    `{style,palette}`; UI prefs `activeMenu`/`layoutMode`/`menuVisible`/`panelsVisible`/`hidePasswordPref`.
    **GitHub creds (`comicGen.githubOwner/Repo/Token/LastBackup`) must NEVER appear in this editor.**
  - **An export JSON shape already exists:** `buildExportData()` / `exportSettings()` (File → Export →
    `comic-generator-settings.json` = `{version, exportedAt, settings:<collectPanelState()>, preset, libObjects,
    layoutMode, menuVisible, panelsVisible, activeMenu}`), applied back by `importSettingsFromFile()`. The editor
    uses THAT shape (minus `exportedAt`) so it round-trips with File → Export/Import.
  - **Editable elsewhere (candidate editable set):** per panel — title, seed, chars, loc, locExtra, action,
    extras, imgCount, style, promptOverride, protectSlots; per page — name, summary, seed, panelCountSel,
    panelCountCustom; globals — globalPos, globalNeg, nsfw, imageSize*, guidanceScale, previewDelay, previewOn;
    library — name/desc/type; preset — style/palette. **Not editable anywhere:** `version`, library `id`s,
    `currentPage`, `promptOverride` keys.
  - **NOT in the JSON at all:** generated images (in-memory only: `panelImages` / `pageSession[N].images`; only
    the ZIP export carries them) and `panelPromptOverrides` (session-only).
  - **Apply plumbing to reuse:** `savePanelStateShape(state)` (+ `loadCurrentPage()`, `populatePageSel()`,
    `updateDeletePageBtn()`), `saveLibraryObjects()` + `renderLibrary()` + `updatePanelSelects()` for the library,
    and the globals' own DOM controls + `schedulePanelSave()`/`renderKeywordChips()`/`updatePanelVisibility()`.
- **QUESTIONS ASKED + THE AUTHOR'S ANSWERS (2026-09-23, verbatim):**
  1. Document scope → **"Your recommendation."** → whole project, in the File→Export shape
     (`{version, settings, preset, libObjects, layoutMode, menuVisible, panelsVisible, activeMenu}`; no
     `exportedAt`, and GitHub creds are never included).
  2. Exact editable set → **"Your recommendation."** → every field that has a control elsewhere in the app.
  3. Read-only fields → **"Show whole document with locked parts greyed."**
  4. Find/Replace → **"I'd like to choose between replace all at once vs. confirming. Regex plus match case is
     fine. Replace only in editable values. I'd prefer searching only in editable values as well; if the user
     wants more editing functionality than that, they can hand edit the saved JSON file in the external text
     editor of their choice."**
  5. Apply semantics → **"Yes to Apply with validation and Reload (discard changes). Let's do an \"undo last
     apply\" along with a Ctrl-Z undo edits buffer of maybe the last 10 edits if that's reasonably do-able."**
  6. Structure edits → **"Your recommendation is fine."** → value edits only; adding/removing entries is rejected
     with a readable message.
  7. Editor surface → **"Your recommendations are fine. Let's also do line numbers. Maybe a checkbox option to
     highlight syntax. The validator should highlight any incorrect JSON entered by the user and provide
     Prev / Next navigation as well."**
- **IMPLEMENTED (2026.08.16.24):** new markup `#jsonEditorOverlay` (modeled on the other `.view-overlay`s:
  `← Back to page` + title, an actions row — ✔ Apply / 🔄 Reload / ↩ Undo last apply / 📋 Copy + status — a
  find/replace row, a validation row with syntax-highlight checkbox + ‹ Prev / Next › problem navigation + hint,
  and the editor body: `.json-gutter` line numbers + `.json-mirror` (colour/mark layer) under a transparent
  `.json-area` textarea). A new self-contained module (`jsonEditor*`, ~870 lines) provides: a position-aware
  recursive-descent JSON parser (per-token ranges + escape maps), editable/locked classification
  (`jsonFieldClass`: globals/preset/page/panel/library leaf fields + `promptOverride.pos|neg` are editable;
  `version`, `settings.version`, `settings.currentPage`, library ids, keys and structure are locked), a
  validate-then-Apply flow (`jsonValidateNow` → `jsonWalkProblems`/`jsonCountChanges`, option validation for
  select-backed fields, structural add/remove rejection, type checks), Find/Replace confined to editable string
  values (plain or Regex, Match case toggle, ⇄ Replace one, ⇄ Replace all with a confirm naming the match count),
  a 10-deep Ctrl+Z / Ctrl+Y undo buffer (Ctrl+F find, Ctrl+S apply, Esc close, Tab inserts two spaces), tests-free
  Apply/Reload/Undo-last-apply with a pre-Apply snapshot of panelState + libObjects + preset, and mirror/gutter
  scroll sync. Apply deliberately does NOT wipe `panelImages`/`pageSession`/`panelPromptOverrides` the way
  `applyImportedSettings` does. Perf: `jsonMarksHtml` is an O(N) boundary sweep (83KB doc: 1516ms → 36ms) and
  syntax colouring pauses above `JSON_SYNTAX_MAX_CHARS` (220k chars) while locked/match/problem marks still show.
- **BUG FIXED WHILE SHIPPING:** the new overlay was invisible because `#newProjectOverlay` had been left
  unclosed since an earlier session, so `#jsonEditorOverlay` (and `#ghBackupOverlay`, the embedded doc blocks)
  were nested inside a `hidden` container; its close tag was a stray `</div>` much further down (before
  `#embeddedIssues`). Both are now properly closed — see the matching ISSUES entry.
- **BOOT GUARD ADDED:** `savePanelState()` now refuses to write until `restorePanelState()` has finished
  (`panelStateRestored`), so a load-time JS error can no longer make the already-scheduled debounced save write a
  defaulted `collectPanelState()` over page 1.
- **VERIFIED LIVE (866×604):** editor opens from the Edit menu and Esc/← closes with a confirm when dirty; the
  document is 17.6KB / 824 lines with matching mirror+gutter heights (16500px), 13px/20px monospace, aligned
  gutter; 507 key / 403 string / 3 number token spans and 132 greyed locked marks (and the Syntax highlighting
  checkbox removes the colour spans but keeps the grey locks); searching "comic book art"/"768" finds 1/2
  matches, "version"/"promptOverride" find "No matches in the editable values."; Match case and Regex both
  filter correctly; ⇄ Replace all with 2 matches asks to confirm (Cancel leaves the document byte-identical) and
  Ctrl+Z restores it; a hand-typed seed + `panelCountSel` 4 → 6 validated as "Valid — 2 fields changed, ready to
  apply.", updated the live selects/storage on Apply ("Applied ✓ …"), and ↩ Undo last apply put the storage, the
  DOM and the text back; invalid JSON reports the exact offset and the "N problem(s)" message with working
  ‹ Prev / Next › navigation; locked fields (`settings.currentPage`, `version`) and a bad `imageSizeSel` value
  each report a readable read-only/option problem; no window errors. The four overlays and the app itself were
  re-checked after the markup fix (New Project, Import confirm, Library import and the GitHub dialog all render
  full-screen).

### 2026-09-22 — ⧉ Duplicate in the 🔍 Focus view threw and broke the page
- **Status:** DONE 2026-09-22 (changelog 2026.08.16.23).
- **Request (author, 2026-09-22).** "With an open project (confirmed it happens in test project 'Cow in field'),
  select Focus on a panel. Inside the panel, open the Panel menu. Select Duplicate. Expected result: it
  duplicates the panel."
- **ACTUAL (verbatim):** duplicate click → `singleNavTo@ line 55 > injectedScript:3498:26` /
  `openSingleView/li.onclick … :3465:37`; then "← Back to page" → `NotFoundError: Node.insertBefore: Child to
  insert before is not a child of this node` in `closeSingleView`, after which EVERY click errored until Ctrl-R.
- **RECON (2026-09-22):** 🔍 Focus MOVES the real `#panel-card-N` into `#singleStage` and remembers
  `singleAnchor = card.nextElementSibling`. Duplicate calls `buildPanelGrid()`, which does
  `grid.innerHTML = ''` and rebuilds all 24 cards — so the staged card + its anchor were left detached from the
  new grid and putting the card back threw NotFoundError. The staged old card and the fresh card also shared the
  id `panel-card-N`, which is why every later click broke inside
  `PERCH.reAttachSpecificDomElementEventWithRoot`. Duplicate itself actually succeeded — the throw came after
  (nav click / close). The same latent bug applied to Add Panel, Delete, page switch and panel-count changes.
- **IMPLEMENTED (2026.08.16.23):** `buildPanelGrid()` captures `singleResume`, calls new `detachSingleStage()`,
  then re-opens at the end (`openSingleView(Math.min(singleResume, getPanelCount()))`, or `closeSingleView()`
  when the page has no panels); new `restoreSingleCardToGrid()` replaces the raw `insertBefore` in
  `closeSingleView` + `singleNavTo`; `openSingleView` is re-entrant; `onPanelCountChange` re-opens the view
  clamped while focused; `duplicatePanel` now reports the copy's new number in the status line.
- **VERIFIED (author's own Cow-in-field state; restored afterwards):** focus → duplicate keeps the overlay open on
  the rebuilt card (nav 6 → 7) with exactly 24 unique `panel-card-N` ids; nav to another panel, close, Add Panel,
  Delete, shrinking the count 6 → 4 while focused on 6, and open→close all produce ZERO window errors and leave
  the grid in order 1..24; snapshot + vision of the focus view after a duplicate shows one card, one image slot,
  no overlap.
- **NOTE:** the author's other report (the `interactionPointerMoveHandler` platform dialog) is unrelated to this
  fix — it stopped happening for them, and that entry remains in QUEUED awaiting their console line.

### 2026-09-22 — Hide Generate All / Pause / Stop in full-screen menu mode
- **Status:** DONE 2026-09-22 (changelog 2026.08.16.22).
- **Request.** Author: "when the menu is in Full Screen mode, the Generate All Panels On Page / Pause / Stop
  buttons should not be visible."
- **RECON (2026-09-22):** those three buttons all live in `#menuFrame`'s LAST child, the `.gen-actions` bar
  (`index.html` ~line 2047): `.gen-actions` > `.gen-row` > [`.btn-generate` GENERATE ALL PANELS ON PAGE,
  `#globalPauseBtn` Pause, `#globalStopBtn` Stop] + a sibling `#statusEl.status`. CSS:
  `.gen-actions { flex: 0 0 auto; min-height: 0; overflow-y: auto; padding-top: 12px; margin-top: 12px;
  border-top: 2px solid #ffcc00 }` inside the flex-column `#menuFrame`, below the flex-1 `.menu-scroll`.
  Since the full-screen overlay MOVES the real `#menuFrame` (changelog 2026.08.16.20), hiding it for
  full-screen only needs a `body.menu-fullscreen .gen-actions` CSS rule — the DOM, the Pause/Stop disabled
  state, and any running generation are all untouched (generation keeps running; the buttons just aren't shown;
  the Focus view keeps its own `.focus-gen` Pause/Stop row). The `#statusEl` status line lives INSIDE
  `.gen-actions`, so hiding the bar hides the status line too — hence the open question.
- **ANSWER (author, 2026-09-22):** "Your default is good. Go ahead and implement." — i.e. hide the WHOLE
  `.gen-actions` bar (buttons + status line), unconditionally (a running generation keeps going; leave
  full-screen to pause/stop it).
- **IMPLEMENTED (2026-09-22):** `body.menu-fullscreen .gen-actions { display: none }` (one CSS rule, next to the
  other `body.menu-fullscreen` overrides) — no JS change, so the Pause/Stop disabled states and every handler are
  untouched. Verified live: at 866×604 side-mode `.menu-scroll` clientHeight goes 177 → 536 in full-screen and
  returns on close; no `.btn-generate`/`.btn-pause-global`/`.btn-stop-global` has a non-zero rect while
  full-screen; no overflow/overlap at 866×604 or 390×844.
  VERSION 2026.08.16.22.

### 2026-09-20 — Menu hidden after leaving the full-screen menu + remove the floating menu button
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.21).
- **Requests.** (1) "When I go to the full screen menus and then go Back to Page, the page menu is completely
  hidden. I have to Hide Menu and then Show Menu in order to get it to return." (2) "I'd like to remove the
  floating Show Menu button at the bottom right, and just have the Hide Menu button at the top toggle whether the
  menu is hidden. Have it say Hide Menu when the menu is showing and Show Menu when the menu is hidden."
- **RECON (2026-09-20):**
  - BUG REPRODUCED: `openMenuFullscreen()` forced the menu visible when `body.menu-hidden` and remembered it in
    `menuFullscreenRestoreHidden`; `closeMenuFullscreen()` then put the hidden state back. So if the menu was
    hidden when the full-screen menu was opened (e.g. via the header's ⛶ Full Screen button, which sits right
    next to ☰ Show Menu), "← Back to page" returned to a page with NO menu — the exact report. Verified live:
    after Back, body had `menu-hidden`, `#menuFrame` display:none, header button read "☰ Show Menu". Every other
    flow (menu already visible, portrait or landscape, opened from the header or the Library button) restores the
    menu correctly.
  - The floating button is ONE element, `#menuRevealBtn` (body-level), whose label and position change with
    state: `body.hdr-offscreen #menuRevealBtn { display:block }` (shown when the header buttons scroll out of
    view), `body:not(.menu-hidden) #menuRevealBtn { bottom:16px; right:16px }` + "✕ Hide Menu", and
    `body.menu-hidden #menuRevealBtn { top:12px; left:12px }` + "☰ Show Menu"; its onclick is `toggleMenu()`.
    `applyMenuVisible(visible)` sets both its and `#menuToggleBtn`'s labels; `refreshHdrOffscreen()`
    (scroll/resize) toggles `body.hdr-offscreen` — which NO other CSS rule uses, so it becomes vestigial once
    the floating button is gone.
- **IMPLEMENTED.** (1) `openMenuFullscreen` still makes the menu visible when it was hidden, but closing no longer
  re-hides it — "← Back to page" always returns to a page with the menu showing (drop
  `menuFullscreenRestoreHidden`). (2) Delete `#menuRevealBtn` + its CSS block; the header `#menuToggleBtn`
  becomes the only menu-visibility control and already flips its own label ☰ Hide Menu ↔ ☰ Show Menu.
  TRADE-OFF (flagged to the author): with the floating button gone, if the menu is hidden while the header is
  scrolled out of view, the only way to bring it back is to scroll to the top. VERSION 2026.08.16.21.
### 2026-09-20 — Full-screen Library overlay (and full-screen whole menu)
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.20).
- **Request.** Author: "I'd like to add a button under Menu -> Library that will toggle showing the Library in a
  full-screen overlay." Author's follow-up question: "Would it make more sense to allow the entire Menu
  ( File / Edit / Library / Help ) to open in a full-screen overlay? I ask because I'm starting to have screen
  real estate issues on my phone; I can't actually edit library objects there. Whatever the answer to this one is,
  I do want the full-screen Library overlay."
- **RECON (2026-09-20):** the Library is the ONE `comicGen.libObjects` store, rendered by `renderLibrary()` into the
  single `#libObjects` container inside `#menuGroup-library` (`.library-section` = `.library-header` + `.lib-hint` +
  `.lib-toolbar` [⬆ Import… `.btn-lib-import`, 📊 Analysis `.btn-lib-analysis`, `#libImportHint`] + hidden
  `#libImportInput` + `#libObjects`; each row = name input + `.lib-desc` textarea + 🗑 `.btn-del-lib`). The
  full-page overlay pattern is `.view-overlay` (fixed inset:0, z-index 10000) with a `.view-top` bar and
  `openX()`/`closeX()` exported on `window`; the opaque overlay automatically covers the floating bottom buttons
  (#panelsToggleBtn/#pageNav/#menuRevealBtn, z-index 1000/1001). Recon conclusion: build ONE generic full-screen
  menu overlay that hosts the REAL `#menuFrame`, and have the Library button open that same mechanism scoped to
  the Library tab — it delivers the requested Library overlay with a single source of truth AND fixes cramped
  editing in every menu section on a phone.
- **ANSWERS (author, 2026-09-20):** (1) "Editable, one source of truth. It should be the same live-editable library
  and reusing the #libObjects list." (2) "Your recommendation works. Next to Import / Analysis." (3) "The overlay
  should keep the Import / Analysis actions. Esc can also close it, but I want a Back to page button in it as
  well."
- **IMPLEMENTED (2026-09-20):** `#menuOverlay` (`.view-overlay`, markup just before `#analysisOverlay` so Analysis
  still paints above it) with a `.view-top` (← Back to page + `#menuOverlayTitle`) and `#menuOverlayBody`;
  `openMenuFullscreen(section)` moves the real `#menuFrame` into it (home remembered in `menuFrameHome`, restored
  on close by `closeMenuFullscreen()`), plus `toggleMenuFullscreen(section)`. Entry points: header
  `#menuFullscreenBtn` (`.menu-fs-toggle`, whole menu) and Library toolbar `#libFullscreenBtn` (`.btn-lib-fullscreen`,
  Library tab). Esc closes; switching tabs stays fullscreen and expands the section (`expandGroupPanels`), and
  re-clicking the active tab no longer empties the overlay. Full details in the BATCH 2026.08.16.20 dev-note.
  Verified live at 866×604, 1920×1080 and 390×844.
- **NOTE (2026-09-20):** a first cut put the general toggle in the `.menu-bar` as a 5th tab; that clipped the
  stacked side-menu tabs on short viewports, so it moved to the header next to ☰ Hide Menu / ▤ Menu: Side.

### 2026-09-20 — Floating bottom buttons cover content: reserve bottom space (menu + main page)
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.19).
- **Request.** Author: "the floating buttons at the bottom (Hide Panels, page navigator, Hide Menu) sometimes hide
  selectors. When the Menu is on the side, the Hide Panels button hides parts of the bottom (the Generate All
  Panels button, or the status message). Can we somehow add margin space at the bottom of the page (menu and main
  page both) so that we can scroll to the point where those aren't covering things we need to access?"
- **RECON (2026-09-20):** the three floating controls are viewport-fixed: `#panelsToggleBtn` (▧ Hide Panels —
  `bottom:16px; left:16px; z-index:1000`), `#menuRevealBtn` (☰ Menu — `bottom:16px; right:16px` while the menu is
  visible; when `body.menu-hidden` it moves to `top:12px; left:12px`), and `#pageNav` (page navigator —
  `bottom:16px` centred; in `@media (orientation: portrait)` it is raised to `bottom:74px` so it clears the two
  corner buttons). `body` has only `padding:20px`, so a scrolled-to-bottom page can never bring its last rows
  above those buttons. In SIDE mode (`@media (orientation: landscape) { body.side-mode .menu-frame { position:
  sticky; top:10px; max-height: calc(100vh - 20px) } }`) the left column's bottom edge sits ~10px above the
  viewport bottom, and `.gen-actions` (⚡ GENERATE ALL PANELS ON PAGE + `.gen-row` + `#statusEl`) is the LAST child
  of `.menu-frame` (`.menu-scroll` scrolls above it) — so the fixed buttons sit right on top of the generate bar
  and its status line. In TOP mode the sticky 45dvh `.menu-frame` is at the top and `.canvas-frame` (the panel
  grid) scrolls underneath, so only the page body needs extra room there.
- **FIX (2026-09-20):** (1) reserve bottom space on the page: `body { padding-bottom: 96px }` (+
  `@media (orientation: portrait) { body { padding-bottom: 156px } }` for the raised `#pageNav`), so the last
  panel/row can be scrolled clear of the floating buttons. (2) shorten the side-mode menu column so its
  `.gen-actions` bar (and status line) always ends ABOVE the floating buttons:
  `body.side-mode .menu-frame { max-height: calc(100vh - 112px) }` (was `calc(100vh - 20px)`) — only bites when
  the menu content is tall enough to fill the column, i.e. exactly when the bar would be covered. No JS changes;
  CSS-only.
- **NOTE (2026-09-20):** author also authorised clearing the leftover
  `comicGen.panelState.preClobberBackup` localStorage key (blonde woman / elf / apartment project — the author has
  their own copy). Deleted via `localStorage.removeItem(...)`; a data cleanup, not a code change.

### 2026-09-20 — Storyboard page navigator (multi-page)
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.18).
- **Request.** Author: "The storyboard view should have a page navigator, if there's more than one page. It can
  be right next to the 'Back To Page' button."
- **RECON (2026-09-20):** `#storyboardOverlay` / `.view-top` holds the `← Back to page` button +
  `#storyboardTitle`; `openStoryboard()` renders the CURRENT page only, `closeStoryboard()` hides it. The
  full-page page navigator (`#pageNav`, bottom-centre) is hidden while an overlay is open, so the storyboard
  needs its own controls.
- **IMPLEMENTED (2026-09-20):** `#storyboardNav` (◀ Prev + `#storyboardNavPages` numbered buttons + ▶ Next)
  sits in the storyboard `.view-top`, hidden when there is only one page; `updateStoryboardNav()` re-renders it
  and highlights the current page, `storyboardNavDelta(delta)` wraps via `switchPage` + `openStoryboard`.
  Because switching re-renders the current page, the storyboard live-updates in place.

### 2026-09-20 — Page reordering by renumbering the page
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.18).
- **Request.** Author: "We need a way to reorder pages; if there are multiple pages, we should be able to
  renumber a page, which moves it in the page order. Renumbering the page puts it in ahead of the previous page
  with that number, and renumbers subsequent pages (e.g. if the pages are 1, 2, 3, 4, and 5, if we renumber page
  4 to 2, then the previous pages 2 and 3 are renumbered to 3 and 4, respectively). All other page data remains
  with the page."
- **RECON (2026-09-20):** pages are keyed by number in `state.pages` (+ `pageSession`); `populatePageSel` /
  `updatePageNav` / `pageLabel` render them sorted. Nothing renumbers keys today, and `deletePage` can leave
  gaps, so the original label is preserved in `page.name` (= the page title) and moves with the page.
- **IMPLEMENTED (2026-09-20):** a "Reorder Pages" control in File → Page Setup (`#pageRenumberGroup`, shown
  only when there are ≥2 pages) with a `⇅ Renumber Page` button + a hidden position `<select>`
  (`togglePageRenumberPicker` / `onPageRenumberSelect`) → `renumberPageTo(fromKey, toPos)`: the moved page is
  spliced into the target POSITION and every page is renumbered 1..N in the new order, while each page's own
  data (panels, seed, title, summary) stays with it. `pageSession` + `currentPage` (+ `analysisPage` when the
  Analysis overlay is open) are remapped too.

### 2026-09-20 — Panel header shows the page number ("Page 1, Panel 1") on multi-page projects
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.18).
- **Request.** Author: "If there is more than one page, have the panel number also display the current page,
  so instead of 'Panel 1' followed by the Panel title entry, it would say 'Page 1, Panel 1' followed by the
  panel entry. This doesn't need to carry over to the Storyboard view."
- **IMPLEMENTED (2026-09-20):** `buildPanelGrid`'s header label renders `Page <currentPage>, Panel <i>` when
  `pageCount() > 1`, else `Panel <i>`. The Storyboard keeps its plain `Panel <i>` labels.

### 2026-09-20 — Per-page Title + Summary, shown in the Storyboard
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.18).
- **Request.** Author: "Each page should have an entry for a user editable, optional page title/summary, and
  the page title should show in the Storyboard view."
- **ASSUMPTION (no blocking question asked; noted 2026-09-20):** the app already had an optional per-page
  `name` (shown in the page selector / navigator / Storyboard title), so it was RELABELLED to "Page Title" and
  a NEW optional "Page Summary" textarea was added (`page.summary`). Both are editable in File → Page Setup;
  the Storyboard shows the title in its heading and the summary in a bar under the controls.
- **IMPLEMENTED (2026-09-20):** `#pageNameInput` ("Page Title") + new `#pageSummaryInput` ("Page Summary"),
  both persisted (`collectPageData`/`restorePanelState`), carried by every page-preserving operation (added
  `'summary'` to the resequence/duplicate/add/delete key lists, `defaultPageData`, `ensurePages` legacy
  migration, and the export/`hasActiveProject` skip lists), and shown in the Storyboard (`#storyboardSummary`,
  plus the title in `#storyboardTitle`).

### 2026-09-20 — Panel header: seed clear/copy chips + panel Generate in the header
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.18).
- **REQ 1 — seed chips.** Author: "a pair of chips next to the panel's Seed value in the header: one to clear the
  panel's seed, and one to copy the preceding panel's seed; the latter will overwrite the current panel's seed
  (including clearing it if the preceding panel's seed is empty)."
- **REQ 2 — panel Generate in the header.** Author: "bring the Generate button for the entire panel up to the
  panel's header, immediately after the panel's Seed entry."
- **RECON (2026-09-20):** the panel header row is built in `buildPanelGrid()` (~line 5690) as
  `.panel-header-row` = [Panel N title] [`#panel-title-N`] [Images: `#panel-img-count-N`] [Style:
  `#panel-style-N`] [Size: `#panel-size-N`] [Seed: `#panel-seed-N` (`.panel-seed-input`, wrapped in a
  `.panel-imgs-sel`) with class `.panel-header-row input.panel-seed-input`] [⇅ Move `#reorder-btn-N` +
  hidden `#panel-reorder-N`]. The row is `display:flex; flex-wrap:wrap; gap:6px` so extra items just wrap.
  Seed semantics: blank = follow the page seed; the box shows the RESOLVED seed as a placeholder
  (`updatePanelSeedPlaceholders()`), and `getPanelSeed(i)`/`pinPanelSeedForRun(i)` (right after it, ~line 6450)
  resolve panel > page > random. Existing "copy from previous panel" precedent = `.btn-copy-prev` (⇤, 22px
  square, disabled on panel 1) calling `copyFromPrevPanel(i, kind, s)` (~line 5624) — it reads the previous
  panel's DOM, is same-page only, and ends with `clearPanelPromptOverride`/`schedulePanelSave`. The panel-level
  Generate button currently lives at the BOTTOM of the card in `.panel-header-btns`:
  `<button class="btn-reroll" onclick="generateSinglePanel(${i})">🔄 Generate</button>` (~line 5751), next to
  Show/Hide Menus and 🔍 Focus. `.btn-reroll` = red, uppercase, bold.
- **QUESTIONS (asked 2026-09-20):** (1) Move the bottom Generate up to the header, or keep BOTH (header +
  bottom)? (2) Chip style — reuse the small square ⇤/✕ look (like `.btn-copy-prev`/`.btn-line-del`) or the
  `.btn-img-chip` pill look? (3) Copy-seed chip disabled on Panel 1 (no previous panel)? (4) When the previous
  panel's seed box is blank (following the page seed), confirm "copy" CLEARS this panel's seed (i.e. copies the
  raw box value, not the resolved placeholder).
- **ANSWERS (author, 2026-09-20):** (1) Chip style — REUSE the small square ⇤/✕ look. (2) Copy-from-previous:
  disabled on Panel 1 of PAGE 1 only. (3) Copy the previous panel's raw seed value if it has one (already
  generated/entered); if that value is blank (random) or -1, the copy chip CLEARS this panel's seed. (4)
  Generate — DUPLICATE it: keep the bottom one AND add one in the header immediately after the Seed entry.
- **IMPLEMENTED (2026-09-20):** `.seed-chips` ⇤ `.btn-copy-prev` (`copySeedFromPrevPanel`) + ✕ `.btn-line-del`
  (`clearPanelSeed`) inside the seed `.panel-imgs-sel`; header `<button class="btn-reroll btn-header-gen">🔄
  Generate</button>` right after the seed entry (bottom one kept). Panel 1's ⇤ is disabled only on page 1
  (`updateSeedChipStates`); on later pages it copies the last panel of the PREVIOUS page (read from stored
  state), per the "preceding panel in document order" reading.

### 2026-09-20 — Move a panel to another page (with "create new page")
- **Status:** DONE 2026-09-20 (changelog 2026.08.16.18).
- **Request.** Author: "When moving a panel, I'd like to be able to move it to another page, with the option to
  create a new page to move it to. The selector should grey out the pages that are already at 24 panels."
- **RECON (2026-09-20):** the Move UI is `#reorder-btn-N` (⇅ Move) toggling `#panel-reorder-N`, a `<select>` of
  positions 1..`getPanelCount()` built by `populateReorderSelects()` (~line 5872); `onReorderSelect(i, sel)` →
  `resequencePanel(from, to)` (~line 5917) reorders WITHIN the current page only (rebuilds `state.pages[
  currentPage]` with a reordered key map, `remapPanelSession(order, total)` remaps `panelImages`, then
  `buildPanelGrid()`). Pages live in `panelState.pages[n]` = `{name, panelCountSel, panelCountCustom, seed,
  1..24}`, max 24 panels/page (`panelCountStateFor(n)`); a stored page's count is computed by
  `analysisPanelCount(page)` (same rule: 'custom' → clamp 1..24, else parse). Cross-page precedent:
  `duplicateToNewPage(i)` (~line 6003) creates a new numbered page, puts a copy of a panel at slot 1, switches
  to it, and `addPage()` (~line 5419) creates an empty 4-panel page. Per-page generated images live in
  `pageSession[pg].images` (current page's = the live `panelImages`); `switchPage`/`loadCurrentPage` swap them,
  so a cross-page move has to move the panel's `pageSession` images too (or accept losing them). Page labels =
  `pageLabel(page, n)`. There is currently NO empty page (min 1 panel), and deleting a page's last panel deletes
  (or resets) the page — see `deletePanel`.
- **Likely implementation:** give the Move picker a richer `<select>`: an `<optgroup>` of positions on the
  current page (existing behaviour) + an `<optgroup>` of "→ <page label>" options for other pages, with the
  24-panel pages rendered `disabled` (greyed) + an "＋ New page…" option. Choosing a page removes the panel from
  the current page (closing the gap / renumbering) and appends it to the target page (or to a new page), moving
  its images along.
- **QUESTIONS (asked 2026-09-20):** (1) Landing position on the target page — append at the END, or should the
  picker also let you choose a slot there? (2) After the move, stay on the current page or switch to the target
  page? (3) If the panel is the ONLY one on its page, is that allowed (which page handling — leave an empty
  page, delete the source page, or refuse)? (4) Do the panel's generated images travel with it to the other
  page? (5) Should the existing same-page reorder keep working exactly as now (just with the page options
  added)?
- **ANSWERS (author, 2026-09-20):** (5) Landing position — moving to a PREVIOUS (earlier-numbered) page with
  space APPENDS the panel at the END; moving to the FOLLOWING (later-numbered) page with ≤23 panels INSERTS it
  at the BEGINNING (slot 1, others shift down). (6) After the move, SWITCH to the target page. (7) If the panel
  is the only one on its page, DELETE the source page — on confirm. (8) Yes — the panel's existing images and
  all its other data travel with it. (9) The existing same-page reorder stays exactly as it is.
- **IMPLEMENTED (2026-09-20):** `populateReorderSelects` now adds a "Move to another page" `<optgroup>` (each
  other page as `pg-<n>`, DISABLED/greyed when that page is already at 24 panels, labelled " (full)") plus an
  "＋ New page…" option. `onReorderSelect` dispatches to the new `movePanelToPage(i, target, mode)` /
  `movePanelToNewPage(i)`; mode = `prepend` when target > source, `append` when target < source, `replace`
  for a freshly created page. The move relocates the panel data + its `pageSession` images, shifts/renumbers
  the source page (and deletes it on confirm when it was the panel's only one), then switches to the target.

### 2026-09-19 — Analysis: add the Panel Action Prompt field (as the first field per panel)
- **Status:** DONE 2026-09-19 (changelog 2026.08.16.17). Author request: "On the Library Analysis page, I'd like to
  add the Panel Action Prompt field for each panel. On this page I'd like it to be the first field for each
  panel." First built as a field inside each panel's header; the author then CLARIFIED: "I did mean a dedicated
  first row across the panels instead." So the header field was removed and the final implementation is a
  dedicated **▶ Panel Action Prompt** row as the FIRST BODY ROW of the matrix (one editable box per panel column,
  aligned under each panel). When ⇄ Swap makes panels the rows, it becomes the FIRST COLUMN (right of the panel
  names) — the transpose, so it stays "first" relative to the panels. It edits the panel's real action live
  (current page) or saves to the browsed page, auto-grows to fit its text, keeps that panel's Action-item cells in
  sync, and stays in sync when the action is changed via a cell or ＋ Add. Verified live, desktop + 390px.

### 2026-09-19 — Analysis: project defaults + per-panel style/size/seed in the matrix
- **Status:** DONE 2026-09-19 (changelog 2026.08.16.16). Author request: "I'd like the Analysis page to show the
  project's NSFW state and its default style, image size, and seed (all of these in the header), and to be able to
  modify them from here. I'd also like each panel's column to show its style, size, and seed, and to be able to
  edit them from here as well; make these as compact as possible. (Probably a small button for each under the
  image, similar to each image's 'view in new tab/download/clear/protect/set representative' buttons in the main
  view.)" Implemented: a "Project defaults:" bar in the Analysis header (NSFW, default style, default size, seed,
  all editable and writing through to the real settings) + three compact 🎨/📐/🎲 chips under each panel header
  that open in-place editors. Inherited values are dimmed/dashed; overrides are highlighted. Edits on a browsed
  (non-current) page are written to that page's saved state. Verified live on the Cow sample, desktop + 390px.
- **Assumption (no blocking question asked):** the header "seed" is per-PAGE in this app (File → Page Setup stores
  it as `page.seed`), so it reads/writes the page selected in the Analysis page selector.

### 2026-09-19 — Library → Analysis: panel × library cross-reference matrix
- **Status:** DONE 2026-09-19 (changelog 2026.08.16.15). Author idea: a new 📚 Library menu
  tool showing a matrix of the current page's panels vs. the whole library, marking at each intersection
  whether that library item is used in that panel (✅ green check), with the per-panel description editable
  right there. The user can toggle which thing (panels or library items) is rows vs. columns. Assumed
  orientation (library items as ROWS, panels as COLUMNS): the leftmost column shows each library item's
  GLOBAL description; the top row shows each panel's representative-image thumbnail; a cell shows ✅ when the
  item is used in that panel, and when used, that panel's per-panel description is editable in the cell.
- **DECISIONS (author, 2026-09-19):** (1) A used cell edits exactly the character slot's modifier
  (panel-char-extra-N-S) or the location modifier (panel-loc-extra-N), and autosaves. (2) When an item is used
  in MORE THAN ONE slot of a panel, show it PER SLOT (up to 3 character slots). (3) Scope = the CURRENT PAGE,
  with a page selector to browse pages. (4) Show ALL library items, including ones used in no panel.
  (5) Thumbnail = the panel's representative image (⭐ Cover if set, else the panel's first image; placeholder
  when the panel has none). (6) The global-description column is READ-ONLY by default; an "allow inline
  editing" checkbox (unchecked by default) makes it editable inline. (7) Placement = a FULL-PAGE overlay like
  the ▦ Storyboard view and the user manual; the grid scrolls BOTH horizontally and vertically with a STICKY
  first row and first column. (8) Clicking a non-✅ intersection offers to ADD that library item to that panel.


### 2026-09-19 — Library → Import: pick Characters / Locations out of a project file
- **Status:** DONE 2026-09-19 (changelog 2026.08.16.14). Author request: "add a function under
  the Library menu item called Import. When the user selects Import, it will allow them to select a project
  file (either zip or json). It will allow the user to select Library items (either Characters or Locations)
  from that file and import them into the current project."
- **Recon (2026-09-19):** Library is ONE store `comicGen.libObjects` = `[{id, type, name, desc}]` (type
  'Character'|'Location'|'Action'; migrateLibObjects prunes Action, so only Character/Location are surfaced).
  renderLibrary() (~line 3454) builds the 📚 Library menu (`#libObjects`) as two buckets each with a green +
  add button. Project backups (File → Project, per-panel ⬇ Export, Export .zip) all carry `libObjects` (v2) —
  or, for OLD v1 files, `charLibrary`/`locLibrary`/`actLibrary` arrays (applyImportedSettings migrates them).
  Zip support already exists: unzipEntries() (~5860) returns {name: Uint8Array}; the settings file inside is
  `comic-generator-settings.json`. Current whole-project import = doImportFile()/importSettingsFromFile()
  (~6038/~6076) with a hasActiveProject() gate + 3-choice Save/Continue/Cancel modal. Panel selects reference
  library items by `lib:${char|loc}:${id}`, so imported items should get FRESH ids to avoid collisions.
- **Likely implementation:** new "Import" button/section in the 📚 Library menu + a hidden file input
  (.json/.zip) → parse to the libObjects array (handle legacy v1 keys too) → a selection modal (checkbox list
  grouped Characters/Locations, showing name + description, Select All / None, Import button) → append the
  chosen items to `comicGen.libObjects` with new ids, then renderLibrary() + updatePanelSelects(). Nothing else
  from the file is touched (no panels, settings, or images).
- **DECISIONS (author, 2026-09-19):** (1) DUPLICATES — skip when the name AND description both match an
  existing item; if the NAME matches but the description differs, highlight it and offer three choices:
  append the new description to the current one, overwrite the current one, or import it under a new name.
  (2) SELECTION UI — modal with checkbox list grouped Characters/Locations (good), AND the user can edit each
  item's name/description before importing. (3) SCOPE — Characters and Locations; if the file contains saved
  Action items, offer to import those too. Never touch panels, settings, or images. (4) OLD FILES — accept
  legacy v1 backups (charLibrary/locLibrary/actLibrary arrays) as well. (5) MULTIPLE FILES — allow selecting
  several files and merging their items into one list.
- **NOTE (author, 2026-09-19):** UX handling = library items only on import (no art-style/seed changes).

### 2026-09-18 — Show each panel's seed in the panel header (user-editable)
- **Status:** DONE 2026-09-18 (changelog 2026.08.16.13). Author request: "Is it possible to have each panel
  display the seed it uses? I'd like to have it placed in the panel header area, where the panel title, number
  of images, style, and size are. I'd also like to make this user-editable, so if the user changes it here it
  uses that seed for that panel." Implemented: the per-panel seed input moved from the ⚙ Panel accordion into
  the panel header row (next to title/Images/Style), keeps the id `panel-seed-N` and its Enter-to-render
  behavior, and now SHOWS the resolved seed (panel override > global+(N−1)) via a live placeholder ("random"
  when neither is set; typing = override, clearing = follow global). New pin-on-generation: when a panel's
  seed would be random, one random integer is chosen at generation, written into that panel's seed field, and
  held for later regenerations (so results are reproducible after the first run). Verified live with a mocked
  image service; desktop + 390px layouts checked (no overflow/overlap).

### 2026-08-22 — File → New Project should clear the library (bug report)
- **Status:** DONE 2026-08-22 (changelog 2026.08.16.12). Author: "File -> New is not clearing the
  library." Root cause: doNewProject() → resetEverything(true) only wiped comicGen.libObjects when the Edit→Reset
  "Also permanently delete my saved library objects" checkbox was checked (it defaults off and resets to false), so
  New Project never cleared it. Fixed: doNewProject() now always removes comicGen.libObjects + re-renders the
  library panel. Edit→Reset checkbox path unchanged.

### 2026-08-17 — Remove Panel Library persistence; add "copy from previous panel" buttons
- **Status:** DONE 2026-08-17 (changelog 2026.08.16.11). Author request: "I'd like to eliminate the Panel
  Library persistence function. Instead, I'd like to replace it with a small button that copies the
  corresponding item from the previous panel. And we'll go ahead with this now." Implemented: the entire ⟳
  persistence system (checkbox propagation to later panels + cross-page carry) was removed and replaced
  with a small ⇤ button on each character slot, the Location row, and the Panel Action Prompt row that
  copies that item (selection + modifier) from the panel directly before it. Panel 1's buttons are
  disabled. Nothing copies automatically anymore. Old saved projects keep their content (persist flags
  dropped on next save). Help + user manual + dev docs updated. Verified live; author's project intact.

### 2026-08-16 — Pause a run and continue it (implemented 2026.08.16.9)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.9). Author request: "Is there a way we can pause a run
  rather than disabling it, and be able to continue it?" Implemented: a ⏸ Pause button (sidebar gen-row
  between ⚡ and ■ Stop, plus a mirrored ⏸ in the Focus overlay's .focus-gen row) that pauses the running
  Generate All Panels On Page run after the current panel; pressing ⚡ GENERATE ALL PANELS ON PAGE again
  CONTINUES from the panel it paused on — done panels are NOT regenerated. ■ Stop still fully cancels
  (⚡ then restarts from panel 1). Tab-background auto-pause now also resumes mid-run instead of
  restarting. Mechanics: `pausedManually` + `resumePanel` state; `pauseGenerations()` (guard on
  generateAllRunning) stops the in-flight generation like Stop does; the generateComicPage loop's break
  block records `resumePanel = (result === 'cleared') ? i : i + 1` (clamped to totalPanels) and the next
  ⚡ click starts from there; "Generate All From Here" (startPanel) clears resumePanel; button states:
  ⏸+■ disabled while paused, ⚡ enabled. Verified live with mocked image generation: pause mid-run →
  status "Paused — press ⚡ ... to continue from panel N", resume regenerated only from panel N (skipped
  count correct, done panel images kept), Stop still cancels cleanly (loop breaks, ⚡ restarts fresh from
  panel 1), Focus overlay ⏸ mirrors sidebar state through a full pause/resume cycle, from-here overrides a
  stored resume point. Test page deleted and author's project data verified intact after testing.
  (REVISED 2026-08-16 after author retest: the first live verification used a mock WITH a `.stop()`
  method, which the real text-to-image plugin does not have — so Pause couldn't cancel the in-flight
  image, the current panel kept rendering and its result landed anyway, and the run only paused after it
  finished. Fixed in 2026.08.16.10 with a per-run abort signal raced against each image request; see the
  BATCH 2026.08.16.10 dev-note. Re-verified live with a realistic no-.stop mock.)

### 2026-08-16 — ⚡ Generate All Panels On Page button in Focus view (implemented 2026.08.16.8)
- **Status:** DONE 2026-08-16 (changelog 2026.08.16.8). Author request: put the Generate All Panels On Page
  button on the Focus page with the same functionality; implement now. Implemented: a `.focus-gen` row in
  the #singleOverlay (Focus) with its own ⚡ button (calls the same generateComicPage), a ■ Stop button, and
  a status line. No changes to generation internals — state is mirrored via MutationObservers
  (syncFocusControls/initFocusSync): sidebar ⚡ disabled → focus ⚡, globalStopBtn disabled → focus Stop,
  statusEl text → focusStatusEl. Verified live: both buttons disabled during a run and both Stops enabled,
  status synced through the run, black-on-yellow label rendering, visual pass. Author's project verified
  intact after testing.

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
