
# Comic Generator — Issue Log

Log of reported issues and their resolutions, newest first.
A future AI helper session should GREP THIS FILE before diagnosing anything —
the real root cause of a "same" symptom is usually already recorded here.

Convention: every resolved issue gets an entry (symptom → root cause → fix → gotchas).
Keep entries short but complete enough that a fresh session never re-diagnoses.

---

## 2026-09-24 — ⇤ chip ENABLEMENT pass scanned the wrong way (caught in development, never shipped)
- **Symptom (while testing 2026.09.24.1):** on a page whose panels 1–8 were populated, every copy-from-previous
  chip on that page named the SAME source — "Panel 1" — instead of each panel's own nearest predecessor. The copy
  action itself was right (clicking panel 5 copied panel 3, correctly skipping the blank panel 4); only the
  tooltip + disabled state were wrong.
- **Root cause:** `updateCopyPrevChipStates()` makes two scans. The reverse "seed" scan (earlier pages,
  nearest-first) and the forward scan (current page) were both written with the same "if this kind is already
  known, skip it" rule. That rule is only valid for the reverse scan — used forward it pins the map to the page's
  FIRST populated panel and never advances it.
- **Fix:** `absorbPanelItems(last, pg, j, pages, fillOnly)` — the reverse seeding scan passes `fillOnly = true`
  (first hit wins), the forward scan passes it falsy so each panel OVERWRITES its kind's entry and `last` always
  holds the nearest predecessor.
- **Gotcha worth remembering:** asserting only the copy RESULT hides this whole class of bug, because the copy
  path (`prevItemSource`) was independently correct and passed every value test. Assert the chip's `disabled` +
  `title` too; a screen full of chips naming the same panel is the signature.

## 2026-09-23 — AI-worker test protocol CLOBBERED `comicGen.panelState` (recovered from the live DOM, byte-length identical)
- **Symptom:** nothing visible in the app — this is a process failure. While testing 2026.09.23.13 the AI worker
  snapshotted the project with `window.__snap = localStorage.getItem('comicGen.panelState')`, then a `page_refresh()`
  reloaded the page. A later eval compared the live value with `window.__snap` (now `undefined`) and, since they
  differed, ran `localStorage.setItem(KEY, snap)` — storing the literal string `"undefined"` (9 bytes) over the
  author’s 7216-byte project state.
- **Root cause:** in-page JS state (`window.*`) does NOT survive `page_refresh()`, but localStorage does. Any write
  to localStorage derived from a `window` variable is therefore one reload away from writing `undefined`.
- **Recovery:** the state was rebuilt from the live DOM (which the reload had re-populated from the still-intact
  in-memory state) by dispatching an `input` event on a grid input → `handleGridInput` + `schedulePanelSave()`
  → `collectPanelState()` → localStorage. The result was byte-length identical to the original (7216) and carried
  the author’s real globals (`imgCountDefault: "3"`, theme dark / #ffcc00, both keyword lists), so nothing was
  permanently lost. The author was told.
- **Prevention (mandatory for every future session):** (1) read the snapshot INSIDE the same eval that writes it
  back; (2) if a snapshot must cross a reload, park it under a SECOND localStorage key (e.g.
  `comicGen.panelState.P3TEST`) — never a `window` variable — and delete that key afterwards; (3) never
  `setItem` a value that could be `undefined`: assert `typeof v === 'string' && v.length > 0` first. Test flows
  should keep the author’s state untouched where possible — the panel selection and the clipboard are in-memory,
  so select / copy / Esc can be exercised freely; anything that mutates panels must restore, `page_refresh`, and
  then RE-READ localStorage to prove the restore stuck.
- **Also worth knowing:** `comicGen.libObjects` is the saved library and `resetEverything()` / a test import can
  destroy it — never exercise those paths in the shared preview.

## 2026-09-23 — "Save" did nothing at all (no feedback, dot never cleared) — the EDITOR TAB, not the generator (fixed 2026.09.23.9)
- **Symptom:** Save clicked → no "saving…", no error, no toast; the src file-panel dot never clears; the
  platform keeps serving the previous build. Nothing in the generator's own code was ever at fault.
- **Root cause:** the editor page's save entry point bails out SILENTLY (console.warn only) in three
  states: (1) `window.__editorReady !== true` or the CodeMirror editors missing → "save ignored while
  editor content is still loading"; (2) `window.__saveInFlight` left set by a hung earlier save → "save
  ignored: a save is already in flight"; (3) `app.saveGenerator` is still the stub that throws "save
  machinery failed to initialize" until `loadAppExtras()` (`appExtras.js`) resolves. `_goToEditModeInner`
  additionally sets `saveBtn.style.pointerEvents="none"` while the editor is loading. Every one of these
  looks exactly like "the button does nothing".
- **Diagnosis path (repeatable):** clear the generator side cheaply first — `document.__perchanceInternal`
  on the preview gives `renderedContentStamp` (which `index.html` length the editor is rendering),
  `srcDebug` and `srcTrace` (pending src files); the SAVED src tree is readable by fetching
  `https://<publicId>.perchance.org/src/@<generatorName>/<path>` DIRECTLY (bypasses the service worker, so
  it is the server's copy rather than the editor's pending one); and the iframe can trigger a save with
  `window.parent.postMessage({type:"saveKeyboardShortcut"},"https://perchance.org")` (parent
  `handleIframeSaveRequest()`). If that is silently ignored too, the stuck state is in the editor page.
- **Fix:** leave edit mode and re-enter it (re-runs `_goToEditModeInner` → `__editorReady = true`), then
  Save. Fallback: reload the Perchance tab. No generator code change was needed.
- **Gotcha:** a files-panel "dot" that never clears = the wedged-upload state (2026-08-14 entry). The lock
  is tied to the FILENAME — recreating the same name re-wedges — so RENAME the file
  (`src/user-manual.html` → `src/manual.html` on 2026.09.23.9) instead of recreating it.

## 2026-09-23 — Unclosed `#newProjectOverlay` made the JSON editor invisible (fixed 2026.08.16.24)
- **Symptom:** the new full-page JSON editor (`#jsonEditorOverlay`) was in the DOM and all of its JS worked
  (open/close, find/replace, validate, Apply), but nothing on screen ever changed: `getBoundingClientRect()` was
  0×0 and `offsetParent` was null. The GitHub backup dialog (`#ghBackupOverlay`) and the four embedded
  `<script type="text/plain">` doc blocks were in the same boat — the gh dialog "worked" only because pushes are
  driven programmatically, so nobody noticed it had never been visible.
- **Root cause:** `<div id="newProjectOverlay" …>` (just above the overlays) had been left without its `</div>`
  since an earlier session — its intended closer was a stray `</div>` far below, immediately before
  `#embeddedIssues`, so everything in between (the new editor overlay, the gh dialog, the doc blocks) was parsed
  as a CHILD of that `hidden` container. `hidden` on an ancestor hides the whole subtree no matter what
  `display` a descendant sets, which is why the inline `display:flex` on `#ghBackupOverlay` didn't save it.
- **Fix (2026.08.16.24):** added the missing `</div>` right after `#newProjectOverlay`'s `.import-confirm-box`
  (where it had always belonged) and deleted the stray one before `#embeddedIssues`.
  `#importConfirmOverlay`, `#newProjectOverlay`, `#jsonEditorOverlay`, `#ghBackupOverlay` and
  `#libImportOverlay` are now all direct children of `#output-container` and each renders full-screen.
- **Gotcha for future sessions:** after ANY overlay markup edit, verify the parent chain
  (`getElementById('jsonEditorOverlay').parentElement.id === 'output-container'`) AND a non-zero
  `getBoundingClientRect()`. A mis-nested overlay is invisible while its JavaScript looks perfectly healthy, and
  neither `vision` nor the snapshot helper can see it (capturing the overlay returns an empty ~6-byte data URL,
  which is the tell-tale sign of a `display:none` ancestor).

---

## 2026-09-23 — A load-time error could overwrite page 1 with a blank default (guarded 2026.08.16.24)
- **Hazard (found while testing the JSON editor):** the boot sequence schedules a debounced `schedulePanelSave()`.
  If any JS error aborted the IIFE before `restorePanelState()` finished (it runs late in boot), that timer still
  fired and `savePanelState()` wrote a defaulted `collectPanelState()` over `comicGen.panelState` — silently
  wiping the live project's page 1 (and everything the DOM hadn't yet been told about).
- **Fix (2026.08.16.24):** `let panelStateRestored = false;` next to `savePanelState()`, which now returns early
  while it's false; `restorePanelState()` sets it to `true` as its very last statement. Boot-order rule: the flag
  may only be set after the saved state has been applied to the DOM (`loadCurrentPage()` / `buildPanelGrid()`).
- **Gotcha for future sessions:** the same pattern applies to any other "collect the DOM and persist it" timer —
  a failed load must never be allowed to look like a deliberate empty state.
- **Symptom (author report):** with a project open, 🔍 Focus a panel → open its ⚙ Panel menu → click ⧉ Duplicate →
  `singleNavTo … injectedScript:3498:26` / `openSingleView/li.onclick … injectedScript:3465:37`. Clicking
  "← Back to page" then gave `NotFoundError: Node.insertBefore: Child to insert before is not a child of this
  node` in `closeSingleView`, and after that EVERY click on the page raised an error until the page was reloaded.
- **Root cause:** 🔍 Focus MOVES the real `#panel-card-N` into `#singleStage`, remembering the sibling it must be
  put back before (`singleAnchor = card.nextElementSibling`). Duplicate — like Add Panel / Delete / page switch /
  panel-count change — calls `buildPanelGrid()`, which does `grid.innerHTML = ''` and rebuilds all 24 cards, so
  the moved card and its anchor were left detached from the new grid and `grid.insertBefore(singleCard,
  singleAnchor)` threw. Two elements with the same `panel-card-N` id also coexisted (the staged old one + the
  fresh one), which is what made every later click error inside
  `PERCH.reAttachSpecificDomElementEventWithRoot`.
- **Fix (2026.08.16.23):** `buildPanelGrid()` now remembers whether the Focus view was open, drops the staged
  card first (`detachSingleStage()`, so no duplicate ids survive the rebuild) and re-opens the view on the fresh
  cards afterwards (`openSingleView(Math.min(resume, getPanelCount()))`, or closes it if the page has no panels).
  `restoreSingleCardToGrid()` — used by `closeSingleView` and `singleNavTo` — inserts only when the anchor really
  is a child of the grid and drops a stale card otherwise, so no missed path can dead-end the page again.
  `openSingleView` is re-entrant (it restores a previously staged card first) and `onPanelCountChange` re-opens
  the view clamped, so shrinking the panel count while focused can't blank the stage or leave a stale nav list.
- **Gotcha for future sessions:** anything that rebuilds `#comicGrid` destroys the focused card — never wipe the
  grid directly, always go through `buildPanelGrid()` so the Focus view re-syncs. After a rebuild both `singleCard`
  and `singleAnchor` are references into the OLD DOM; `restoreSingleCardToGrid()` is the only safe way to put the
  card back (a raw `insertBefore` with a stale anchor is exactly the crash above).

---

## 2026-08-16 — "Add" button doesn't add an Action to Panel Objects (fixed 2026.08.16.2)
- **Symptom:** clicking the Add button while adding an Action to a panel's 🧩 Panel Objects did nothing — the
  Action never appeared.
- **Root cause (two bugs):** (1) The 2026.08.16.1 freeform-action feature left stale state when the add menu
  was switched away from "＋ New Action…": onPanelAddSelect's pick: and empty branches never cleared
  `picker.dataset.mode`, never unhid the identity dropdown, and never restored the "Add" label. After
  freeform→"Add from library→Action…" the picker was still in freeform mode (dropdown hidden, button "Ok"),
  and panelAddPick's new-action branch early-returned on an empty description — so the click did nothing.
  (2) routeObject's Action branch set the action slot to the freeform description `d` and ignored `sel`, so
  picking a library Action without typing a description set the slot to "" and silently failed.
- **Fix (2026.08.16.2):** onPanelAddSelect now runs resetPicker() on every menu change (incl. "— add object —")
  — clears dataset.mode, shows the dropdown, restores "Add" label + default placeholder. routeObject's Action
  branch falls back to the library entry's desc when `d` is empty.
- **Gotcha for future sessions:** any UI that toggles between hidden/freeform states must clear ALL its state
  on every transition, not only on success. Also: when browser_eval drives the UI across an innerHTML re-render
  (routeObject→renderPanelObjects rebuilds the add bar), cached element references go stale — re-query
  getElementById after any render.

---

## 2026-08-15 — Duplicate embedded docs + broken ISSUES close (consolidated; ~230KB removed)
- **Symptom:** the four embedded docs (embeddedPENDING/AINOTES/Changelog/Issues) existed TWICE in index.html
  (a second copy sat mid-file), and the FIRST embeddedIssues block had lost its closing script tag — its
  element swallowed ~1870 stray lines (a duplicate of the top dev-notes block, a stale <style>, and the second
  docs copy) as text/plain content. Consequence: the ISSUES element's .textContent was ~182KB of mixed garbage
  and every GitHub backup pushed that garbage as ISSUES.md.
- **Root cause:** a past session pasted the docs section twice while moving them out of src/; the first
  copy's Issues close tag was lost in the shuffle.
- **Fix (2026-08-15):** consolidated programmatically — the whole region from the first embeddedIssues open
  through the second set's close was replaced with ONE clean embeddedIssues block (content taken from the
  verified-clean duplicate copy, with the two 2026-08-15 entries re-added by hand). Result: exactly one of
  each doc id, no swallowed text, no visible garbage; verified live (counts =1, app boots, no console errors).
- **Gotchas for future sessions:** (1) NEVER paste the four doc blocks twice — and NEVER write the literal
  close-script sequence ("</" + "script>") inside a text/plain doc block: the HTML parser closes the script
  element at the first such sequence, silently swallowing everything after it as inert text (getElementById
  keeps returning the first element but its .textContent now contains garbage — and ghPush ships it). If you
  must mention it in doc prose, split it (as done here). (2) After any big edit, verify
  document.querySelectorAll('#embeddedX').length === 1 and sane .textContent.length.

## 2026-08-15 — Image hover/long-press preview invisible in 🔍 Focus (single-panel view)
- **Symptom:** hover/long-press preview of a generated image works in the grid page but not when a panel is in
  single-panel view (🔍 Focus button).
- **Root cause:** Focus doesn't clone the card — it MOVES the real #panel-card-N into #singleOverlay
  (.view-overlay, position:fixed; z-index:10000). The preview overlay #imgPreview is a body-level sibling with
  .img-preview { z-index:9999 }, so it was painted BEHIND the opaque #1a1a1a single overlay — the trigger
  logic (document-level pointerover on .panel-img-box + id regex ^imgbox-panel-(\d+)-(\d+)$) still fired;
  the user just couldn't see it.
- **Fix:** .img-preview z-index 9999 → 10002 (above .view-overlay 10000 AND the password/manual overlays
  10001; the GitHub backup overlay at 2147483647 still covers it, but that blocks hovering image boxes anyway).
- **Gotcha:** html2canvas doesn't render the fixed #imgPreview, so it can't be vision-verified that way — verify
  with real-browser hit testing: temporarily set pointerEvents:auto on #imgPreview and confirm
  document.elementsFromPoint(center) returns imgPreviewImg first.

## 2026-08-14 — "another_upload_in_progress" blocks ALL saves forever on specific src/ files (platform bug + workaround)
- **Symptom:** Save fails with "Couldn't save the src files: couldn't upload src/<file>: another_upload_in_progress"
  for hours on end; survives full browser restarts and network changes; every retry names a file in the same set.
- **Root cause (diagnosed, not confirmed by platform):** a src/ file whose first upload ever got interrupted
  (e.g. an AI-session hard page reload killing the in-flight sync) leaves a permanent server-side per-file upload
  lock. The dot next to the file's size in the editor's files panel = dirty/pending-upload state; it NEVER clears.
  While a wedged file exists in src/, EVERY save of the generator fails — including main.pjs/index.html. The
  throwaway-generator test proved it's per-generator, not per-account. ISSUES.md / user-manual.html / changelog.js
  (never wedged) save fine.
- **Cure (only one that worked):** delete the offending file(s) from the files panel → Save succeeds. Recreating
  the file (even without any reload) re-wedges it — the lock is tied to the file name.
- **Fallout / permanent workaround applied:** the AI-facing docs were relocated OUT of src/ into `<script
  type="text/plain">` blocks embedded in index.html (ids: embeddedPENDING, embeddedAINOTES, embeddedChangelog)
  — read via .textContent; inert to the perchance template engine (script contents are not template-processed,
  so `[...]` inside them is safe). renderChangelog now reads #embeddedChangelog first (src/ fetch kept only as a
  stale-copy fallback). src/PENDING.md, src/CHANGELOG.md, src/AI-NOTES.md are PERMANENTLY GONE from src/ —
  future sessions edit the embedded blocks in index.html instead. Do NOT recreate those src/ file names.
- **Gotchas for future sessions:** (1) NEVER hard-reload (browser_eval/browser_refresh) immediately after writing
  a src/ file — the reload kills the in-flight sync and wedges that file name. (2) upload_file probes return
  "another_upload_in_progress" while the generator's upload state is wedged — a handy diagnostic. (3) The user's
  full backup is in the chat (generator-full-backup.zip) and the docs content lives in index.html now.

## 2026-08-14 — Description entered at creation doesn't appear in the panel's slot (Not A Bug — clarified)
- **Symptom:** After creating a New Character / New Location from the dropdown and typing a description, the
  slot in 📖 Panel Library → Characters / Location showed nothing.
- **Investigation:** The description typed at creation is the LIBRARY description (`entry.desc`), stored on the
  reusable library entry and woven into every panel prompt that uses that entry (resolveDesc). The panel slot's
  own description field (the modifier/extra textarea) is intentionally SEPARATE and per-panel — it was never
  meant to be auto-filled from the library description.
- **Resolution (2026.08.14.5):** not a bug. Per the author's clarification, the create flow now asks THREE
  prompts: (1) name, (2) the main library description (reusable, shows in 📚 Library), (3) a separate PANEL
  description that fills the placed slot's own description field. Both descriptions feed that panel's prompt
  (library desc via resolveDesc + panel desc as the modifier) — deliberately distinct.

## 2026-08-14 — On load, a menu button is highlighted that doesn't match the menu actually open (Resolved)
- **Symptom:** On refresh, the app came up with the ❓ Help button highlighted — implying the Help menu was
  open — while the 📄 File menu was actually the one showing.
- **Root cause:** `initMenu()` restored a previously-used menu from localStorage ('comicGen.activeMenu',
  defaulting to 'file') and highlighted its button, but it NEVER hid the other menu groups. The File group
  has no `hidden` attribute in the HTML (visible by default), so when a different menu (e.g. Help) was the
  saved one, BOTH groups ended up visible — the File menu open on the page while the Help button alone was
  highlighted.
- **Fix (2026.08.14.1):** the app now always starts with every `.menu-group` hidden and no `.menu-btn`
  highlighted — `initMenu()` explicitly hides all groups and strips `active` from all buttons (no
  auto-restore of 'comicGen.activeMenu' on load). `menuGroup-file` also got the `hidden` attribute so
  nothing flashes before initMenu runs. `switchMenu()` still persists the active menu so an import can
  restore it.
- **Gotcha:** this is a deliberate behavior change (author-requested default state = all closed). Do NOT
  re-add the load-time restore of 'comicGen.activeMenu'.

## 2026-08-14 — Manual "↗ Open in new tab" → "No src manifest available for this page" (Resolved)
- **Symptom:** The in-app reader works great, but the manual overlay's "↗ Open in new tab" button opened a
  new tab at `https://<publicId>.perchance.org/src/user-manual.html` (the absolute URL the previous fix
  computed) that showed: "No src manifest available for this page (service worker had no state for the client)."
- **Root cause:** Top-level navigation to a `src/` file is fundamentally unsupported in this environment.
  The generator runs behind a perchance service worker that keeps "src manifest" state only for the app page
  itself; a brand-new tab pointed straight at a `src/` asset URL has no such client state, so the service
  worker refuses to serve it. The absolute-URL correction below was necessary but NOT sufficient — any
  `window.open`/anchor whose target is a `src/` asset of this generator can never work here.
- **Fix:** Removed the "↗ Open in new tab" button from `#manualOverlay` and deleted `openUserManualTab()`
  (function + window export). The manual now opens ONLY in the in-app reader (`openUserManual()` → fetch →
  `<iframe#manualFrame>` srcdoc), which works reliably in the editor preview and when published.
- **Gotcha:** NEVER ship a `window.open` / anchor navigation targeting a `src/` asset of this generator —
  the service worker blocks it with "No src manifest available for this page". In-app `fetch('src/...')`
  continues to work fine.

## 2026-08-14 — 📖 Open User Manual → "Cannot GET /src/user-manual.html" (Resolved)
- **Symptom:** Clicking Help → 📖 Open User Manual (added in 2026.08.13.10) opened a new tab that 404'd with
  "Cannot GET /src/user-manual.html".
- **Root cause:** The generator iframe's `document.baseURI` is `https://perchance.org/<name>` — Perchance
  injects a `<base>` tag pointing at the PUBLIC generator URL on `perchance.org`. The old implementation did
  `window.open('src/user-manual.html')`, which resolved the relative URL against that base
  → `https://perchance.org/src/user-manual.html` — a top-level navigation the `perchance.org` host 404s.
  The file actually serves on the PUBLIC-ID subdomain root (`location.origin + '/src/user-manual.html'`,
  verified fetch 200), and the app's own `fetch('src/user-manual.html')` also returns 200.
- **Fix (superseded 2026-08-14 — see the entry above):** The manual now opens IN-APP: `#manualOverlay`
  (same pattern as the view overlays) with `<iframe#manualFrame>` whose `srcdoc` is set from
  `fetch('src/user-manual.html')` — isolated styling, guaranteed to work in the editor preview and when
  published. `closeUserManual()` hides the overlay. Exported: openUserManual / closeUserManual. (The
  secondary "↗ Open in new tab" button / `openUserManualTab` using the corrected absolute URL was REMOVED —
  new-tab navigation to a `src/` asset is refused by the service worker.)
- **Gotcha (recorded for the future):** in this generator's iframe, relative URLs resolve against
  `perchance.org/<name>` (the injected `<base>`), NOT against `location.origin`. For any `window.open` of an
  app asset, build the URL from `location.origin` explicitly. For in-app loading, plain relative `fetch`
  works (server-side it's the same subdomain).

## 2026-08-13 — ■ Stop button "missing" next to Generate All Panels on mobile (Resolved — Not An Issue)
- **Symptom:** Author reported the global ■ Stop button (`#globalStopBtn`, sits beside ⚡ GENERATE ALL
  PANELS in `.gen-actions`) was not visible on mobile — suspected screen real estate or a mobile-specific
  layout issue — and could NOT reproduce it by resizing the editor preview.
- **Investigation:** Checked markup (button always present, no `hidden`), CSS (`.btn-stop-global` has no
  mobile hiding rule; `.gen-row` flex + `white-space:nowrap` keeps it on-screen down to ~320px), and logic
  (`setStopButtonEnabled(true)` runs at every Generate All start). Measured layout live — the row fits at
  narrow widths. Nothing device-specific hides it.
- **Resolution:** Author re-checked on mobile and confirmed the Stop button IS present → **Resolved — Not
  An Issue**. No code change.
- **Gotchas / latent observations:** (1) `body.menu-hidden .menu-frame {
  display:none }` still hides the ENTIRE generate bar with the menu — contradicts CHANGELOG 2026.08.13.2's
  "⚡ stays visible when menu hidden" promise (a regression carried in by the older-index.html merge; the
  fix would hide only `.menu-scroll`). STILL OPEN. (2) FIXED 2026-09-20 (changelog 2026.08.16.19):
  `.gen-actions` is now `flex: 0 0 auto`, so a tall `.menu-scroll` can no longer flex-squeeze the generate
  row/status to near-zero on short screens — the menu list scrolls instead.

## 2026-08-13 — Show / Collapse Menu buttons missing after reload
- **Symptom:** Per-panel Show Menu (opens all of a panel's accordion menus at once) and the ⚙ Panel's
  Collapse Menu button were gone after a reload, though Help → About listed them (2026.08.13.1).
- **Root cause:** Same file-merge mishap as Stop/Hide Panels — newer docs kept, older index.html without
  the implementations.
- **Fix:** Re-implemented 2026-08-13 (CHANGELOG 2026.08.13.5): `showPanelMenus(i)` / `collapsePanelMenus(i)`
  set every `.panel-acc` in `#panel-card-i` to open/collapsed via `setPanelAccsCollapsed` (nested sections
  included); Show Menu button added to the action row (`.btn-view.menu-show`), Collapse Menu button added to
  the ⚙ Panel accordion body (`.btn-panel-menu`); both exported on window.
- **Gotchas:** Buttons are inline-onclick, so they must stay exported on window; accordion collapse state is
  NOT persisted (session-only, by design).

## 2026-08-13 — Stop button + Hide Panels button missing after reload
- **Symptom:** Author reloaded and the ■ Stop button (cancel a Generate All run) and the ▧ Hide/Show Panels
  header button were gone, even though Help → About listed them (version 2026.08.13.2).
- **Root cause:** A file-merge/reconciliation kept the NEWER changelog + AI notes but an OLDER index.html
  that never contained the implementations — the features were described in docs but absent from code.
- **Fix:** Re-implemented 2026-08-13 (see CHANGELOG 2026.08.13.4): haltGenerations()/stopRequested/
  generateAllRunning + per-panel ■ Stop buttons (visible only during Generate All) + `.stopped` box/card
  states; ▧ Hide/Show Panels header button toggling `body.panels-hidden` (hides only `.canvas-frame`;
  generation keeps running), persisted as `comicGen.panelsVisible` and included in exports/imports.
- **Gotchas:** `.stopped` is cleared wherever box/card states reset; renderPanelSlot bails early when
  stopRequested is set; single-slot generation clears a stale stopRequested via `!generateAllRunning`;
  stopAllGenerations still marks `.paused`, not `.stopped`.

## 2026-08-13 — Panels seem to "keep" their old art style after switching the global style
- **Symptom:** After switching the global Art Style to Photorealistic, some panels (created under
  Comic Book) still showed comic-style images.
- **Root cause:** There was NO per-panel style storage — style is keyword-driven and read LIVE from
  `globalPos` at generation time, so non-overridden panels always render in the current global style.
  Two things made it LOOK sticky: (1) generated images persist in the page session (memory) until you
  reload or regenerate that panel — switching the style never re-renders existing images; (2) a panel
  with a custom 📝 Prompt override uses exactly those keywords. Note: `applyPreset()` calls
  `clearAllPromptOverrides()` when the global style changes, so overrides only matter if set AFTER the
  switch (or imported — applyImportedSettings does NOT clear overrides).
- **Fix (v2026.08.12.24):** added the per-panel **Style** dropdown (feature request) — see the
  PER-PANEL ART STYLE dev note. No persistence bug existed; the sticky look was stale images /
  prompt overrides.
- **Gotcha:** Existing images never restyle themselves — regenerate (or Clear + Generate) a panel to
  see its new style. If a panel stubbornly keeps a style after regenerating, its 📝 Prompt override
  is the cause.

## 2026-08-12 — AI's test harness deleted the author's project page (tooling hazard)
- **Symptom:** During verification of the new delete-panel feature, the author's saved project
  (page 1 of "Sample NSFW Comic") vanished from localStorage; only a leftover test page remained.
- **Root cause:** The AI's browser_eval created throwaway pages for testing, then called
  `deletePage()` to clean up. `deletePage()` is gated by `confirm(...)`, and `confirm()`
  AUTO-ACCEPTS (returns true) inside the eval harness, so the cleanup deleted page 1.
- **Fix/lesson (2026-08-12):** NEVER mutate via confirm()-gated or delete functions in
  browser_eval against a live project. Prefer read-only evals, or if a mutation test is
  unavoidable, run it against a disposable page and restore the original panelState JSON
  (save it to scratch/ first) instead of relying on in-app deletion for cleanup.
- **Author recovery used:** re-imported the last exported settings file. (Alternative: a trivial
  edit in a stale tab still holding the data auto-saves it back — see the tab-model entry below.)

## 2026-08-12 — Menu chips/buttons overlap the hint text below them
- **Symptom:** In the menu, buttons (e.g. the new ▦ Storyboard View chip, the Backup Project
  buttons) visually overlap the small gray hint text underneath by a few pixels.
- **Root cause:** `.lib-hint { margin-top: -8px }` — the negative margin pulled every hint
  8px up into whatever preceded it. When that predecessor is an `input`/`select` (5px bottom
  margin) the overlap was invisible; when it's a `.chip-row` of buttons (0 bottom margin, 8px
  bottom padding) the hint text landed right at/over the button's bottom edge.
- **Fix (v2026.08.12.20):** `.lib-hint` margin-top `-8px` → `0`. Hints now sit below their
  predecessor with a small clean gap everywhere; top and side menu both.
- **Gotcha:** `.lib-hint` is used globally (menu panels, library rows) — the fix intentionally
  changes spacing everywhere, not just the one reported spot.

## 2026-08-12 — "Generate does nothing" after moving the Prompt Obedience slider
- **Symptom:** Generated a panel fine at default settings (4 images), then every subsequent
  Generate click (panel chip, image chip, Generate All) appeared to do nothing — no image,
  no error, no status change, even after clearing images.
- **Root cause:** The image service requires `guidanceScale` to be a WHOLE NUMBER (1–30).
  The Prompt Obedience slider allowed 0.5 steps; at 9.5 the plugin returned an ERROR TILE — a
  plain String, e.g. `(text-to-image-plugin: <b>guidanceScale</b> should be a whole number
  between 1 and 30...)` — returned synchronously, NOT a thenable. `withTimeout`'s
  `Promise.race` resolved instantly with that string, `result.dataUrl` was undefined, and the
  app reported "generated" with no image → silent nothing.
- **Fix (v2026.08.12.12):** slider `step` 0.5→1; load/migrate/restore round & clamp saved
  values to integers (saved 9.5 → 10); generation passes an `parseInt`ed integer.
- **Hardening (v2026.08.12.11):** `renderPanelSlot` now throws if `result.dataUrl` is missing,
  so ANY plugin option/rejection error shows as a visible `.failed` box + alt text instead of
  silent success; Generate All catches per-panel failures and reports them in the "Done:" line.
- **Gotchas:** (1) `root.generateImage()` returns error tiles as non-thenable STRINGS — never
  assume the return is a real Promise; always check `result.dataUrl`. (2) Don't trust a
  "generated" return — verify the image actually appeared. (3) This plugin validates options
  and returns error-tile strings for invalid values; surface these to the user.

## 2026-08-12 — "Generate does nothing" after tab went to background
- **Symptom:** After the tab was backgrounded mid-generation (visibilitychange pause, status
  "Stopped generations — tab went to background"), clicking a panel / per-image Generate chip
  silently did nothing.
- **Root cause:** The pause set `pausedByVisibility = true`; only `generateComicPage` reset it.
  Single-panel and per-slot generation never did, so a subsequent failing or timed-out
  generation was swallowed as `'cleared'` by `renderPanelSlot`'s catch.
- **Fix (v2026.08.12.10):** `generateSinglePanel` and `generateSinglePanelSlot` now set
  `pausedByVisibility = false` right after their `panelBusy` guard.
- **Gotcha:** The stale "Stopped generations…" status text persists until any generation runs.

## 2026-08-12 — Saved project "vanished" during troubleshooting (NOT an app bug — tab model)
- **Symptom:** Data loaded in one tab was not visible in the preview pane of another tab; and a
  troubleshooting step appeared to erase the saved project.
- **Root cause (platform model):** App data lives in `localStorage`, which is SHARED across all
  tabs of the same browser on the same origin (`https://<generatorPublicId>.perchance.org/
  <generatorName>`). But each tab only READS it at load, keeps its own in-memory state, and
  generated images are session-only (never in localStorage). Consequences: (a) a stale tab's
  DOM does not update when another tab imports/changes data until it reloads; (b) any
  auto-save triggered in a STALE tab writes that tab's empty/old DOM over the shared good state.
- **Recovery used:** the user did a trivial edit in the tab that still held the data → its
  auto-save rewrote the full good state back into shared localStorage. (Alternative: re-import
  the last export file.)
- **Gotchas for future sessions:** (1) Confirm WHICH page your browser_eval is attached to
  (preview pane vs the user's live tab) before mutating anything. (2) Never trigger the app's
  auto-save (any clear / input handler / toggle) in a tab whose DOM may be stale — it clobbers
  the shared saved state. Prefer read-only evals during troubleshooting. (3) localStorage is
  shared per-origin but NOT synced across already-open tabs and NOT shared across devices.

## 2026-08-12 — Import replaced current project without warning; protected images not cleared
- **Symptom:** Importing a project over an active project cleared it silently; protection
  survived an import.
- **Root cause:** No confirmation flow, and `applyImportedSettings` didn't reset protect chips.
- **Fix (v2026.08.12.8):** `hasActiveProject()` check → three-choice modal (💾 Save & Import /
  Continue / Cancel) via `#importConfirmOverlay`; import now "nukes" first (all 24×4 slots
  `setSlotProtected(i,k,false)`) before applying imported state. See the IMPORT WARNING + NUKE
  dev note for details.
