# DEV-NOTES — Yet Another Comic Book Page Generator

Development log + hard-won gotchas, newest batch first. Until 2026.09.23.6 this lived as a
top-of-file comment inside `index.html`; it moved out (along with `PENDING.md`, `AI-NOTES.md`
and `ISSUES.md`) because ~360KB of internal documentation was being downloaded by every visitor.

Other docs in this repo: `AI-NOTES.md` (architecture / state / API reference), `PENDING.md`
(the request queue — LOG EVERY REQUEST THERE FIRST), `ISSUES.md` (bug log), `CHANGELOG.md`
(user-facing version history — since 2026.09.23.8 fetched from this repo by Help → About;
index.html keeps only a tiny `#embeddedVersion` stamp as the offline fallback).

## BATCH 2026.09.25.3 — 🎲 Same seed for every image — a per-panel checkbox in the ⚙ Panel menu

Released 2026-09-25 (stamp 2026.09.25.3). Author request, verbatim: "I'd like to have a checkbox under the panels Panel menu that forces all images in the panel to use the same seed, rather than (seed) for panel 1, (seed+1) for panel 2, etc." Logged in `PENDING.md` on receipt (standing rule). index.html + the shipped manual; repo docs as usual.

### What was built
- **The one place the per-image offset exists:** `renderPanelSlot` does `const seed = useSeed ? seedOverride : pinPanelSeedForRun(i);` and then `if (seed !== -1) opts.seed = useSeed ? seed : (seed + (k - 1));` — so image *k* of a panel renders with the panel's seed + (k − 1). The whole feature is that single condition: `opts.seed = (useSeed || panelSameSeedOn(i)) ? seed : (seed + (k - 1));`.
- **State:** a per-panel boolean `sameSeed` on `pages[N][i]`, collected by `collectPageData()` and restored by `restorePanelState()` — which means it rides along for free everywhere page data is deep-copied (duplicate / add / move / reflow / cut / paste), is written into settings export + import, and is visible in the 🧩 JSON editor.
- **UI:** a full-width `<label class="check-label panel-acc-check">` containing `<input type="checkbox" id="panel-sameseed-i" onchange="onPanelSameSeedChange(i)">`, as the LAST child of the ⚙ Panel accordion body (below 🗑 Delete), separated by a `border-top` rule. The accordion body is `display:flex; flex-wrap:wrap`, so the row needs `flex: 1 1 100%` — `.check-label` on its own does not give it one (this is the CSS gotcha to remember).
- **Helpers:** `panelSameSeedOn(i)` (reads the box), `setPanelSameSeed(i, on)`, `onPanelSameSeedChange(i)` (status line + `schedulePanelSave()`); all three exported on `window`. `resetEverything()` unticks every panel, so Edit → Reset to Defaults / New Project clears it like the rest of a panel's content.
- **Deliberately NOT changed:** a `useSeed` run — i.e. a 🕘 Generated Prompt replay via `generateFromPromptHistory` → `seedForSlot(k)` — keeps the per-image seeds that entry recorded. The history is a frozen snapshot of "what that generation actually used"; the checkbox is about how a NEW run derives its seeds.

### Verified live (2026-09-25, `root.generateImage` stubbed to capture its options)
- Panel seed 500, 3 images: checkbox OFF → seeds **500, 501, 502**; ON → **500, 500, 500**.
- Page-seed path: `#seedInput` = 1000 with panel 2's Seed box empty → placeholder `1001`, and with the box ticked the images were **1001, 1001, 1001**.
- Ticking the box persisted `comicGen.panelState…pages["1"]["1"].sameSeed = true`; after a full `buildPanelGrid()` re-render panel 1 was still ticked and panel 3 (never touched) was unticked.
- Toggled by a real `cb.click()` (not just the helper): the status line read "Panel 1: every image will use the same seed." and the value persisted.
- Layout: no horizontal overflow at 390 px (⚙ Panel body 316 px wide, label wrapping to 3 lines) or desktop; separator, alignment and contrast confirmed with `vision` in dark and light themes.
- Storage safety: all 20 `comicGen.*` keys were parked in `__test_backup_v8` before any synthetic write and restored byte-for-byte — an FNV-1a hash of the whole storage map was identical before and AFTER a full page reload (0 mismatches, 0 extra keys, no perchance errors).

### Interpretation recorded for the author
"All images in the panel" was read as *the images within one panel* (image 1 gets the panel seed, image 2 gets seed + 1, …), which is why the checkbox drops only the per-image offset and keeps the page-seed + panel-index rule. The other reading — "ignore the page seed + panel index offset, so every panel uses the page seed verbatim" — is a one-line change, and the author was told so explicitly in the reply.

## BATCH 2026.09.25.2 — ⚡ Generate (x) to (y)… — an explicit inclusive panel range

Released 2026-09-25 (stamp 2026.09.25.2). Requested as a note on ticket T-01's answer 1b ("Maybe we do a \"Generate (x) to (y)\" button also that lets the user choose an inclusive range of panels to generate"), logged in PENDING.md as QUEUED on receipt per the standing rule, and greenlit by the author ("Saved!  And go ahead on the generate (x) to (y)!"). index.html only; the shipped manual and the repo docs are the other moving parts.

### What was built
- New chip `#panel-genrange-btn-i` = **⚡ Generate (x) to (y)…**, inserted in the ⚙ Panel chip row right AFTER ⚡ Generate All From Here and before ⧉ Duplicate (so the three generate-chips read together: Generate · To Here · From Here · (x) to (y)).
- `panelGenerateRangeAction(i)` (async, beside `panelGenerateFromHereAction`, exported as `window.panelGenerateRangeAction`) opens the app's EXISTING non-blocking dialog helper `showChoiceDialog` — the same overlay the import / new-project warnings use — with a `.range-row` of two `<input type="number">` boxes (ids `rangeFromInput` / `rangeToInput`, min 1 / max `getPanelCount()`), a live `.range-info` span (`rangeInfoEl`) and two buttons (⚡ Generate range = value `go`, Cancel = null).
- THE DIALOG PROMISE PATTERN: `showChoiceDialog` builds its DOM synchronously before returning its promise, so the handler grabs the promise first, then attaches `oninput` listeners to the two boxes, then `await`s the promise. `readRange()` returns `{from, to}` or null AND drives the UI (the info text, the `.bad` class, and `goBtn.disabled`) — the generate button is disabled whenever the values are out of range or From > To, so an impossible range cannot be submitted. Escape / Cancel resolves null and simply returns (the listeners are detached first).
- Prefill: `from = 1`, `to = i` normally; with a multi-selection (`panelBatchMode(i) && panelSelection.size > 1`) it becomes the SELECTION SPAN (`panelSelectionSorted()` first … last), and the selection is cleared when the run actually starts (same as the other batch chips — not when the dialog is cancelled). From/To are clamped into 1…total and swapped if inverted.
- The run itself is the existing explicit-list path: `generateComicPage(null, [from … to])`. Because a list run records its own `runEndPanel`, a PAUSED range run resumes only as far as the range's end — the T-01 clamp applies here for free.
- Behaviour decisions (the author greenlit without the questions being asked — all recorded in the PENDING entry so they are easy to overrule): already-generated panels inside the range ARE regenerated (the app has no "skip existing" concept and inventing one here would surprise); 🔒 protected images inside the range are respected exactly as in any other run; the range is limited to the current page.

### CSS added
- `.range-row` (flex, wrap, gap) with `.range-row input { width: 5em; flex: 0 0 auto }` — the global `input { width: 100% }` rule would otherwise stretch the number boxes across the dialog; `.range-info` + `.range-info.bad` (`--red-text`) for the valid/invalid line.
- **`#choiceBtns button:disabled { opacity: 0.45; cursor: not-allowed; }`** — the dialog's buttons had NO disabled styling at all, so the disabled Generate looked identical to an enabled one (caught with `vision`: the button still appeared bright blue while `go.disabled === true`). Worth knowing: the existing `.btn-add-lib:disabled, .btn-view:disabled` rule never covered `#choiceBtns`, which is why every choice dialog button now dims properly.

### Verified live (all with the mandatory back-up-first protocol)
- All 19 `comicGen.*` keys were parked in `localStorage.__test_backup_v7` (19 keys, 74,766 bytes, read-back verified) plus a workspace file, then restored byte-for-byte afterwards (0 mismatches, no stray keys, the `recent` IndexedDB key untouched) and the test mutations to panels 2-4 (distinct `RANGE-TEST-n` action prompts used to identify each panel) were rolled back.
- Chip order: `Collapse Menu · 🔄 Generate · ⚡ Generate All To Here · ⚡ Generate All From Here · ⚡ Generate (x) to (y)… · ⧉ Duplicate · ＋ Add Panel · 🗑 Clear Images · 🗑 Clear · 🗑 Delete`.
- Dialog defaults on panel 1 of a 4-panel page: From 1 / To 1, info "→ panels 1–1 (1 panel)", Generate enabled, hint naming the page's 4 panels.
- Validation: From 3 / To 1 → "⚠ Use numbers from 1 to 4, with From not greater than To.", `.range-info.bad` applied (computed colour `rgb(255,107,107)`), `go.disabled === true` and `opacity 0.45`. From 2 / To 4 → "→ panels 2–4 (3 panels)", enabled, opacity 1.
- EXACT RANGE PROOF (call-counting stub): From 2 / To 4 generated exactly panels 2, 3 and 4 — three calls whose prompts carried `RANGE-TEST-2/3/4` and never panel 1 — then the dialog closed itself.
- Multi-selection: ticking panels 2 and 4 and opening the chip on panel 2 prefilled From 2 / To 4; Cancel closed the dialog AND left both panels selected (no calls); generating cleared the selection and ran exactly panels 2, 3, 4.
- PAUSE / RESUME: a range run 1–3 paused during panel 2 printed "Paused — press ⚡ GENERATE ALL PANELS ON PAGE to continue from panel 2." and the resume made exactly two calls (`RANGE-TEST-2`, `RANGE-TEST-3`) with the status stepping (2/4) → (3/4) → Done — i.e. it stopped at the range's end and never slid to panel 4.
- Layout: dialog 358×283 at 390px viewport, inside the screen, the number row wrapping readably, both buttons on one line, no horizontal overflow; and it renders correctly at desktop width in both themes. Verified visually with `vision` (the capture-artifact caveats for small chips / hidden overlays in BATCH 2026.09.25.1 still apply).
## BATCH 2026.09.25.1 — ⚡ Generate All To Here · editable 📖 Basic Descriptions · 📄 Recent files + a count preference

Released 2026-09-25 (stamp 2026.09.25.1). Five author tickets went out together (T-01…T-05 in the repo tickets/ folder); T-02 was docs-only. Code changes are all in `index.html` — `main.pjs` untouched. The shipped manual (`src/manual.html`) and these repo docs are the other moving parts.

### 1. ⚡ Generate All To Here (T-01)
- New chip `#panel-gento-btn-i`, inserted BETWEEN 🔄 Generate and ⚡ Generate All From Here in the same chip row as `#panel-gen-btn-i` / `#panel-genfrom-btn-i` (built in `buildPanelGrid`). Label "⚡ Generate All To Here".
- `panelGenerateToHereAction(i)` (~index.html:4894) mirrors the multi-selection exactly like `panelGenerateFromHereAction` does (end = the LAST selected panel, then clears the selection), otherwise end = i; it builds the literal list `[1 … min(end, totalPanels)]` and calls `generateComicPage(null, list)` — the explicit-list path already existed, so the engine needed no change.
- RESUME CLAMP (author answer 1c). A new module var `runEndPanel` sits beside `resumePanel` (declared ~2804) and records the run's own end panel (`runEndPanel = endPanel` inside `generateComicPage`). A NON-list run that is RESUMING (`resumePanel` set, no explicit `startPanel`) reuses it: `from = resumePanel`, `endPanel = Math.min(runEndPanel, totalPanels)`. A paused To-Here run therefore resumes only as far as the panel it was aiming for. Cleared in `stopAllGenerations`, in `haltGenerations` and in the stop branch of the run loop.
- `window.panelGenerateToHereAction` is exported next to the other two actions.
- VERIFIED live against a stubbed `root.generateImage` that counts calls: multi-select 2+5 then To Here on 2 → exactly 5 calls (range 1…5); To Here on 3 → 3 calls; a following plain ⚡ Generate All → the whole page (no stale cap). Pause test: a To-Here(3) run on a 6-panel page, paused while panel 2 was in flight, printed "Paused — press ⚡ GENERATE ALL PANELS ON PAGE to continue from panel 2." and the resumed run made exactly 2 calls (panels 2 and 3) and never touched panels 4-6 — the clamp holds. Two false starts are worth remembering: (a) a click is IGNORED while `generateAllRunning` is still true, so the previous run must be allowed to reach "Done" before starting the next one; (b) a pause stub that referenced `p` inside its own Promise executor hit a TDZ error and rejected instantly.
- NOT implemented (still QUEUED; the author raised it as a note on ticket 1b): the arbitrary-range "Generate (x) to (y)" chip. Logged in PENDING.md with its open questions.

### 2. 📖 Basic Description (T-04)
- The old READ-ONLY `div.pl-libdesc` inside each character/location line is gone. Each `.pl-line-body` now carries a `.pl-base-field` (`#panel-char-basefield-i-s` / `#panel-loc-basefield-i`) holding: `.pl-base-head` (label "Basic Description" + `span.pl-base-badge` "edited" = `#panel-char-basediff-i-s` / `#panel-loc-basediff-i` + `button.pl-base-refresh` "⟳ Refresh from library" = `#panel-char-baseref-i-s` / `#panel-loc-baseref-i`) and the textarea (`#panel-char-base-i-s` / `#panel-loc-base-i`). The old "This panel — extra description" textarea is untouched and is still appended AFTER the Basic Description in the prompt.
- State shape: `chars:[{sel, base, extra}]` plus `loc` / `locBase` / `locExtra` — updated in `collectPageData`, `renderPanelObjects`, `restorePanelState`, `readPanelItem`, `copyFromPrevPanel`, `deletePanelChar` / `deletePanelLoc`, `clearPanelImage`, the reset / new-project paths and `newPanelLibraryEntry`. New helpers: `panelLineIds`, `panelLibDescSeed`, `applyPanelLineBase`, `refreshPanelLineBase`, `refreshPanelLineDesc`, `seedPendingPanelBases`, `migratePanelBaseDescriptions`.
- SEEDING SENTINEL: `panelLibDescSeed(kind, sel)` returns the library text, or NULL when the built-in description maps are not loaded yet (`builtinDescMaps === null` during the first restore). `applyPanelLineBase(kind,i,s,null)` therefore writes `''` and sets `data-needSeed="1"`; the boot callback `getMaps().then(…)` then runs `seedPendingPanelBases()`, which fills every still-flagged field through `refreshPanelLineBase`. A selection change also re-seeds (the `panel-(char|loc)-base` branch of `handleGridInput` writes the value straight into the state as well).
- FREEZE: a project's `base` is only ever written by the seed / ⟳ refresh / ⇤ copy paths — never by the library — so editing a library object cannot change a panel that already has a Basic Description. `⟳ Refresh from library` (exported as `window.refreshPanelLineBase`) is the only way to pull the library's current text back into a filled field.
- DIFF CALL-OUT: `refreshPanelLineDesc(kind,i,s)` compares `baseEl.value.trim() !== plLineDescText(...).trim()` — trimmed, exact, CASE-SENSITIVE (author answer 4e) — and toggles `.differs` on the field and `.on` on the badge. CSS gives a differing field `border-color: var(--accent-outline)` plus a 3px inset left bar. An EMPTY base (nothing selected) is never flagged.
- MIGRATION: `migratePanelBaseDescriptions(page)`, called from `restorePanelState` right after `migratePanelExtraCopies`, fills `base` / `locBase` with `panelLibDescSeed(...)` (null for built-ins, the library text for `lib:` selections) for every slot with no `base` key — so a legacy project re-seeds itself and its prompt is byte-identical. VERIFIED by capturing a panel's prompt, stripping `base`/`locBase` from `comicGen.panelState`, reloading, and capturing again: identical strings, field re-seeded from the library, no badge.
- PROMPT: `buildPanelPrompt` uses `baseEl.value.trim() || resolveDesc(...)` per character and `locBase || resolveDesc(locKey, locMap)`. VERIFIED that a custom Basic Description appears in the built prompt while the library text does NOT, for both a character and the location.
- VERIFIED live in dark and light themes: 96 base fields / 96 badges / 96 refresh chips / ZERO `.pl-libdesc`; the badge and `.differs` turn on for an edited value, stay OFF for a whitespace-only difference, turn on for a case difference, clear on ⟳ refresh, and ⇤ copies the previous panel's EDITED base. `collectPageData` writes `base`/`locBase` after the debounced save.

### 3. 📄 Recent list under File (T-03) + the count preference (T-05)
- STORAGE: IndexedDB `comicGenSaveState` → store `main` → key `'recent'` (the same DB the save handle uses; `idbGet`/`idbSet`/`idbDelete` already existed). An entry is `{kind:'handle', handle, name, at}` or `{kind:'snapshot', name, at, text}`.
- THE FIREFOX DECISION — important: the author's browser is Firefox, which has NO `showOpenFilePicker` / `showSaveFilePicker`, so a handle-only Recent list would have shipped DEAD for them. `canUseFileHandles()` gates the behaviour: where handles are available the entry keeps the real file handle and always loads the file's current contents; where they are not, the app stores a SNAPSHOT of the project text, so Recent still reopens the project (exactly as it was when saved) even if the original file has since been moved or deleted. The hint under the list spells out which one the user's browser is getting.
- Entries are added by `saveSettingsAs` (handle), by the DOWNLOAD fallback of `saveSettings` / `saveSettingsAs` (`rememberRecentSnapshot()`), by `doImportFile` (JSON and ZIP) and by `＋ Add / Open…` (`openRecentPicker` → real picker or the hidden `#importSettingsInput`). Clicking an entry (`openRecentEntry`) re-reads the handle (auto-removing the entry if the file is gone) or builds a `File` from the stored text, then goes through `beginImport(file, isZip)` — factored out of `importSettingsFromFile` for exactly this reuse — and so gets the standard `#importConfirmOverlay` replace-this-project warning.
- UI: a `Recent:` `input-group` directly under the Backup Project chip row in 📄 File (`#recentAddBtn`, `#recentListEl`, a Clear-list button, a long hint that explains the browser difference). `renderRecentList` renders "📄 <name> · <file|in-browser copy> · <when>"; `recentStoreCap() === Math.max(5, recentMaxPref)`. Helpers: `canUseFileHandles`, `loadRecentEntries`, `saveRecentEntries`, `addRecentEntry`, `addRecentSnapshot`, `rememberRecentSnapshot`, `renderRecentList`, `recentTimeText`, `clearRecentList`.
- PREFERENCE (T-05): `#prefRecentMax` is an `<input type="number" min=0 max=50>` (a spinner — the author's 5a note asked for exactly that) in a `pref-row` under a new `pref-sub` "Recent files" in `#preferencesPanel`; it persists as `comicGen.recentMax` (`RECENT_MAX_KEY`, browser-level, never project data). `onPrefRecentMaxChange` clamps 0…50 and re-renders; 0 replaces the list with a "Recent list hidden — the last five are still remembered" message.
- THE 5b RULE (author confirmed 2026-09-25): the STORED list always holds at least the newest FIVE no matter what the setting says — the setting only decides how many are SHOWN. So going to 0 (or 2) and back to 5 brings the five straight back, and a project saved while the setting was 2 is still there at 50.
- VERIFIED live: a synthetic `DataTransfer` import recorded "📄 cow-in-field.json · in-browser copy"; clicking the entry raised the usual warning and re-imported; the timestamp bumped; pref 2 → "Remembering the 2 most recent project files."; pref 0 → the hidden message; 5 restored; `comicGen.recentMax` written. This preview is Firefox, so the SNAPSHOT path is the one actually exercised (the handle path is untestable here).

### 4. Docs-only (T-02)
- The "Cow in field" project is a THROWAWAY. AI-NOTES §1 TEST DATA, the PENDING.md test-protocol notes and the ISSUES.md post-mortem now all say it may be loaded, overwritten or clobbered at any time by anyone, including a future AI session.

### 5. Verification & process notes for the next session
- The whole batch was verified against a stubbed `root.generateImage` (call counting + prompt capture) under the mandatory protocol: all 19 `comicGen.*` keys were parked in `localStorage.__test_backup_v5` AND in a workspace file BEFORE any mutation, `confirm`/`prompt`/`alert` were stubbed, and afterwards every key was restored byte-for-byte (per-key read-back comparison: 0 mismatches), the test page was dropped, `comicGen.recentMax` (which the backup did not contain) was deleted and the test `recent` IndexedDB key was removed. Only `comicGen.panelState` and `comicGen.recentMax` were ever different from the backup; page 1 of the project was byte-identical throughout.
- The djb2 hash map recorded during the previous session could NOT be reproduced: no djb2 / fnv variant over any key/value separator reproduced the stored values, and the map was internally inconsistent (`comicGen.genAlwaysVisible` and `comicGen.hidePasswordPref` both hold `"1"` but hashed differently). Byte-for-byte string comparison against the parked VALUES (strictly stronger) was used instead. Do not trust that hash map; park the values.
- Layout was checked at 390px and at desktop width, dark and light. The new three-chip row wraps onto its own lines on a phone exactly like the pre-existing From Here chip; the Basic Description label line wraps gracefully at 390px (label + badge + ⟳ chip fall to two lines, no overlap, no overflow); no horizontal page overflow anywhere.
- CAPTURE-ARTIFACT WARNING for future sessions: snapdom full-page captures of this app re-render small chips with slightly different font metrics, so the "⟳ Refresh from library" chip can LOOK vertically clipped (the word "library" half cut off). DOM measurement proves it is an artifact — the text's Range client-rect sits inside the button's border box, `scrollWidth === clientWidth`, one line, with a 3px gap to the textarea. Verify chip clipping with `getBoundingClientRect` + a Range, never with a snapshot alone. The same caveat applies to HIDDEN overlays: snapdom re-renders elements that carry the `hidden` attribute (the engine's global `[hidden] { display: none !important }` is not reproduced in the clone), so a full-page capture can look as though `#passwordOverlay` or another hidden dialog is open — check `el.hidden` + `getComputedStyle(el).display` before believing it.
## BATCH 2026.09.24.5 — one thumbnail PER generated image in the 🕘 Generated Prompt history + ↩ Restore Previous Project removed

Author requests (2026-09-24, verbatim): (1) "Is it possible to get a thumbnail of each generated image, rather
than just the first/representative image, in the filed prompt under Generated Prompts?" (2) "Also: I'd like to
remove the Restore Previous Project function under Edit -> Reset to Defaults." Both greenlit immediately, and both
logged in `PENDING.md` before any work started.

### Thumbnails — one per generated image
- RECON: the data was already there. `promptHistoryRuns[i]` is created by `generateSinglePanel` /
  `generateSinglePanelSlot` as `{pos, neg, seeds: []}` and `renderPanelSlot` pushes `{k, seed}` for EVERY slot it
  renders, so `addPromptHistoryEntry` has always received one seed record per image. Only the thumbnail side was
  narrow: 2026.09.24.4's `attachPromptHistoryThumb(i, entry, run)` looked exclusively at `run.seeds[0].k` and
  stored a single `entry.thumb` key. The fix is therefore entirely in the thumbnail pipeline.
- DATA MODEL: `entry.thumbs = [{k, key}]`, ordered by `k`. The legacy single `entry.thumb` is still READ —
  `promptHistoryEntryThumbs(entry)` folds it into `[{k: the first recorded seed's k, key}]`, and
  `promptHistoryEntryThumbKeys(entry)` feeds that to `prunePromptThumbs()`, so old entries both render and stay
  protected from eviction exactly like new ones. There is deliberately no migration pass: `attachPromptHistoryThumb`
  simply adds the `k`s an entry is missing (and deletes `entry.thumb` once it has some), so a legacy entry heals
  itself the next time that prompt is generated. Verified against the author's own legacy entry (panel 1, seeds
  772347241-4): it still renders its one 224px thumbnail, with no number badge and the new per-image label.
- SIZE BUDGET: a 4-image run would have cost ~44 KB of `comicGen.promptThumbs` at the old 224px side, and the store
  is capped at 1.4M chars because localStorage is roughly 5 MB of UTF-16 per origin, shared with `panelState` and
  everything else. So `buildPromptThumb(dataUrl, side)` now takes the side: a multi-image entry builds at
  `PROMPT_THUMB_SIDE_MULTI` = 168px (≈7 KB), a single-image entry keeps `PROMPT_THUMB_SIDE` = 224px. A 4-image
  entry therefore costs about what 2 used to.
- RENDER: `promptHistoryThumbHtml(i, idx, entry)` now returns a `.gp-thumbs` flex-wrap row placed ABOVE `.gp-head`
  (a 4-up row inside the header line would fight the seed label and the Copy/Generate buttons) holding one
  `.gp-thumb-cell` per image. A cell gets a numbered `.gp-thumb-cap` badge only when the entry has more than one
  image, so single-thumbnail entries look exactly as they did. Labels are per image ("Saved prompt #N · Panel i ·
  image k (seed S)"), and the hover / press-and-hold preview path needed no changes at all because every `<img>`
  still carries `class="gp-thumb"` + `data-thumb-label` (which `previewDataFromTarget` matches).
- VERIFIED LIVE end-to-end with `root.generateImage` temporarily stubbed to a canvas data URL (so no real image
  quota was spent) on a 3-image panel: 3 thumbnails rendered, badges 1/2/3, `data-thumb-label` per image with the
  right seed, `panelState` recorded `thumbs: [{k:1},{k:2},{k:3}]` with `seeds` 100/101/102, and the store gained 3
  keys while the author's adjacent legacy entry still rendered. Every `comicGen.*` key was then restored
  byte-for-byte (djb2 hash comparison, no leftover keys) per the mandatory test protocol — see `ISSUES.md` for why
  that protocol exists. A mock-up of the 4-up layout was also rendered and captured with `vision` to confirm the
  row does not wrap at the panel's width, the badges sit in each tile's bottom-left corner, and the row sits above
  the "#N" header line.

### ↩ Restore Previous Project — removed
- Removed whole rather than hidden: both buttons (`#fileUndoProjectBtn`, `#resetUndoProjectBtn` + `#resetUndoHint`),
  the `.reset-undo-row` / `.undo-btn` CSS, the entire snapshot block (`UNDO_PROJECT_KEY`, `undoSnapshot`,
  `undoSnapshotLabel`, `readStoredUndoSnapshot`, `hasUndoSnapshot`, `captureUndoSnapshot`,
  `updateUndoRestoreControls`, `applyUndoSnapshot`, `restoreUndoSnapshot`), its boot call, the
  `window.restoreUndoSnapshot` export, the `prunePromptThumbs` snapshot scan, the `reason` option threaded from
  `doNewProject()` into `resetEverything()`, and every mention in the Reset panel description, the New-Project
  overlay hint and the reset confirmation (which now reads "This cannot be undone.").
- Deliberately left alone: `hasActiveProject()` (the Import flow uses it), `collectAllPageImages()` (Export .zip),
  `repopulateImportedImages()` (Import), and every other safety net — `#newProjectDelLibCheck`, the
  `deleteLibraryObject` confirmation and Export / Import. `resetEverything(noConfirm, opts)` keeps its signature
  and `opts.delLib`; only `opts.reason` disappeared.
- `comicGen.undoProject` is now inert. The author's browser still holds one (~8.7 KB). It was NOT deleted — the
  test run's restore put every `comicGen.*` key back exactly as found, and their storage is not ours to prune; the
  key is documented as dead in `AI-NOTES.md` instead and mentioned in the reply.
- Docs scrubbed so a future session cannot re-add it by accident: `AI-NOTES.md` (§3 storage-key list + the feature
  bullet, now flagged "REMOVED … do NOT re-add"), `CHANGELOG.md` (a new .5 entry, and the .3 entry retitled with a
  note that its snapshot half was removed), `src/manual.html` (the `comicGen.undoProject` storage row and the
  Restore bullet deleted, the thumbnails paragraph rewritten for per-image thumbnails, new changelog highlight,
  footer bumped), and `#embeddedVersion` bumped to match the new CHANGELOG heading exactly.

## BATCH 2026.09.24.4 — Generated Prompt thumbnails + the 120s watchdog unhandled rejection

Author requests (2026-09-24, verbatim): (1) "I keep getting this message: 'An error has occurred somewhere in your
code (in lists or HTML): An unhandled promise rejection occurred: Timed out after 120s — click Generate to retry
withTimeout/timeout injectedScript:2307:39 ...' This isn't particularly critical, is it? It just means that
we've lost an image in transit, correct? If that's all it is, can we trap it or otherwise gracefully prevent
it?" (2) "When a prompt gets filed under Generated Prompts, can we add a small thumbnail of the image it
generated? It can be maybe 8-16kb in file size. I'd like to be able to hover over it and see it larger, even if
it doesn't have as much detail; I'd just like to have an idea of what the prompt plus seed generated."

### 1. The 120s watchdog
- `GENERATION_TIMEOUT_MS = 120000`, raced in `renderPanelSlot` as
  `withRunSignal(withTimeout(pending, GENERATION_TIMEOUT_MS))`. The pause/stop/visibility paths call
  `runSignal.fire()`, so `withRunSignal`'s race settles with 'abort' and the slot returns 'cleared' — but the
  INNER withTimeout race was left pending. `pending.stop()` does not settle the plugin promise, so ~120s later the
  timeout rejected with nobody awaiting it: an `unhandledrejection`, which the engine surfaces in its error dialog.
  So the author's reading was right: NON-CRITICAL, one image from an already-abandoned run, press Generate again.
- Fix (two layers): `withTimeout(promise, ms, abortPromise)` — `renderPanelSlot` passes the current `runSignal.p`,
  so the watchdog settles (and its `finally` clears the timer) the instant a run is paused/stopped; and
  `raced.catch(() => {})` marks the returned promise handled for the residual case (no/superseded abort promise).
  Success/failure semantics are unchanged — a genuine stall still reaches the awaiting caller, which marks the box
  `.failed` with "Generation failed: Timed out after 120s — click Generate to retry".
- Verified live with a `preambleJs` that wrapped `setTimeout`/`clearTimeout` (recording the 120000ms timers) and
  listened for `unhandledrejection`, plus a never-settling stubbed `root.generateImage`: pausing a real
  `generateComicPage` run cleared its watchdog at +512ms (previously it would sit for 120s), and the residual
  path (a direct `generateSinglePanel` with no armed run signal) produced NO unhandled rejection even 130s past
  its timeout. No unhandled rejections were reported anywhere in the test window.

### 2. Generated Prompt thumbnails
- Where they live: `comicGen.promptThumbs` = `{key: dataUrl}`, deliberately separate from `panelState` — an entry
  lives in `pages[N][i].promptHistory`, which is both persisted to localStorage on every panel save AND rendered
  into the 🧩 JSON editor document, so base64 inside an entry would bloat both. The entry only stores a short
  `thumb` key.
- Size/caps: `PROMPT_THUMB_SIDE = 224`, `PROMPT_THUMB_QUALITY = 0.6` (canvas JPEG, letterboxed on #101010) —
  measured ~11 KB for a deliberately busy 768x768 test panel; `PROMPT_THUMB_MAX = 240` entries and
  `PROMPT_THUMB_BUDGET = 1400000` characters, oldest evicted first (unreferenced first), which covers a full
  single page of 24 panels x 5 entries. `savePromptThumbStore()` keeps evicting if localStorage refuses the write
  rather than ever leaving a broken store.
- Creation: `attachPromptHistoryThumb(i, entry, run)` fires at the end of `addPromptHistoryEntry`, picks
  `panelImages[i][run.seeds[0].k - 1]` (the first slot the run actually rendered), downscales it in
  `buildPromptThumb()`, stores it and re-saves + re-renders. `promptHistoryThumbHtml()` prepends
  `<img class="gp-thumb">` (84x84, `object-fit: contain`) to `.gp-head` with a `data-thumb-label` for the preview.
- Preview reuse: `previewDataFromTarget()` now also matches `img.gp-thumb` (returns `{label, dataUrl, thumb:true}`),
  and `showImagePreview()` renders `info.label` and toggles `.img-preview--thumb`, a CSS class that caps that
  preview at `min(85vw, 420px)` instead of the panel images' 1100px. So hover delay / press-and-hold / the
  "Enable image preview" checkbox all behave exactly like panel images.
- Garbage collection: `prunePromptThumbs()` keeps only keys referenced by the live project state AND by the last
  cleared-project snapshot (`undoSnapshot` or the stored `comicGen.undoProject` doc), so a snapshot restore brings
  the thumbnails back with the entries. Called from `addPromptHistoryEntry`, `clearPanelImage`, `resetEverything`
  and the end of `applyImportedSettings`.
- Verified live (stubbed `root.generateImage`): the thumb renders (colourful, undistorted, correct label), hover
  opens the preview with `img-preview--thumb`, `clearPanelImage` drops only that panel's thumbs, reset+restore
  keeps the snapshot-referenced thumbs and re-renders them after restoring, a reload renders them from
  localStorage, and a 390x844 phone viewport shows no horizontal overflow with the header wrapping tidily. The
  author's own storage was backed up (second localStorage key + workspace file) and restored byte-for-byte.

## BATCH 2026.09.24.3 — safety nets: one-step project snapshot (↩ Restore Previous Project) + library deletions always confirmed

Author request (2026-09-24, verbatim): "Go ahead and implement them.  Also, put a note into wherever the right
place is that \"Cow in field\" is my throwaway test project." — "them" = the two safety nets offered after an
AI-worker test wiped the live project + library (see ISSUES.md 2026-09-24).

Implementation:
- `comicGen.undoProject` (localStorage) plus the module-level `undoSnapshot` hold the last cleared project:
  `{at, reason, imgCount, doc, pageImages}` where `doc = jsonBuildDoc()` (= `buildExportData(true)` minus
  `exportedAt`: settings + libObjects + preset + layout/UI flags) and the in-memory slot alone keeps
  `pageImages = collectAllPageImages()` for the images.
- `captureUndoSnapshot(reason)` runs inside `resetEverything()` AFTER its confirmation and BEFORE any mutation,
  so it covers every reset path (armed reset button, New Project, deletePage only-page case, deletePanel
  only-panel case, panel multi-select delete). Restore is `restoreUndoSnapshot()` -> confirm ->
  `applyUndoSnapshot()`: clear `panelImages`/`pageSession`/`panelPromptOverrides`/`panelPromptHistory`, clamp
  `currentPage` to a page the doc actually contains, then `jsonApplyDoc(doc)` (the JSON editor's own applier)
  and, only when the in-memory snapshot exists, `repopulateImportedImages(pageImages)`.
- `updateUndoRestoreControls()` (boot + after every capture) drives the two entry points: `#fileUndoProjectBtn`
  (File menu, after New Project) and `#resetUndoProjectBtn` + `#resetUndoHint` (Reset to Defaults panel). A
  stored-only snapshot (page reloaded) is labelled "settings + library, no images".
- Library safety: `deleteLibraryObject()` now opens a `showChoiceDialog` that names the object and counts its
  references (`countLibReferences()` = deep scan of `collectPanelState()` for `lib:<type>:<id>` strings);
  `doNewProject()` reads the new `#newProjectDelLibCheck` and passes it to `resetEverything(noConfirm, {delLib,
  reason})`; the old unconditional `localStorage.removeItem('comicGen.libObjects')` is gone, and
  `resetEverything` now takes an explicit `delLib` instead of reading the reset panel's checkbox (that
  cross-wiring is what allowed New Project to delete the library based on an unrelated checkbox).
- Gotchas met while testing: menu sections start collapsed, so a snapdom capture of a collapsed `.help-panel`
  is just its heading — click the `h3.menu-collapse-toggle` first; panel images are attached to `img.src` lazily
  by an IntersectionObserver, so an off-screen panel's image is in `panelImages` but its `<img>` has no `src`.
- Test protocol followed: the live `comicGen.panelState` / `libObjects` / `undoProject` bytes were copied to both
  a second localStorage key and `scratch/author-state-backup.json` (hash-checked) before a synthetic project was
  loaded, and restored + hash-verified byte-for-byte afterwards (7672 bytes, djb2 3579177367).

## BATCH 2026.09.24.2 — 🕘 Generated Prompt: per-panel prompt + seed history

Author request (2026-09-24, verbatim): "Under the panel's Prompt menu, I'd like to add an accordion menu: generated
prompt. When a panel is generated, its full prompt is copied into the field; this text remains protected from *any*
prompt changes, and there's a space for the seed used as well. Generated Prompt will hold up to five prompts with
seed. Its purpose is to act as a prompt history for that panel."

Author's answers (2026-09-24, verbatim): "1. Per generation. 2. If we can store the exact seed of each seed, yes.
3. Yes. 4. Yes. 5. Your suggestions are good." plus a new requirement: "I'd actually like each entry to have its own
generate button, and the tooltip specifies that it's generated from this prompt. Generating from here doesn't
reorder the entries."

### Data model
- Per panel: `promptHistory` — an array (newest first, max `PROMPT_HISTORY_MAX` = 5) of
  `{pos, neg, seeds: [{k, seed}], at}`. Lives inside `pages[N][i]` in `comicGen.panelState`, collected by
  `collectPageData()` (`promptHistory: panelPromptHistory[i] || []`) and restored by `restorePanelState()`
  (only when non-empty), exactly like the existing `promptOverride`. That means it rides in Save / Export /
  Import / the .zip for free, and it is LOCKED (greyed) in the JSON editor because `jsonFieldClass` returns
  `lock` for any path it does not explicitly allow — verified (`promptHistory` leaves are locked, Apply reports
  "No changes to apply." on an untouched document).
- In-memory map `panelPromptHistory` (mirrors `panelPromptOverrides`): reset at all six `panelPromptOverrides = {}`
  sites, cleared in `applyImportedSettings` and `resetEverything` (delete-loops), populated in
  `restorePanelState`. `clearPanelImage(i)` ("🗑 Clear") deletes the panel's entry; `clearPanelImages` does not.

### Capture (one entry per generation EVENT, not per image)
- `promptHistoryRuns` is a PER-PANEL map (`promptHistoryRuns[i] = {pos, neg, seeds: []}`), not a single global.
  That matters: a user can start panel B's generation while panel A is still rendering, and a single shared
  variable would let A's later slots push into B's run (A's `finally` then commits B's run and B loses it).
  Keying by panel index removes the whole class of bug (`panelBusy[i]` already prevents two runs of the SAME
  panel). `renderPanelSlot()` pushes `{k, seed: opts.seed}` after each successful `showPanelImage`, and
  `generateSinglePanel` / `generateSinglePanelSlot` create the run and `commitPromptHistoryRun(i)` it in their
  `finally` (so a partially-rendered run still records the images that WERE produced, and a no-content or
  fully-protected run records nothing).
- `addPromptHistoryEntry` de-dupes on an identical (pos, neg, seeds) — an identical repeat MOVES that entry back
  to the top instead of adding a duplicate — then unshifts, truncates to 5, and persists immediately with
  `savePanelStateShape(collectPanelState())` (once per generation event, not per image) so a page switch or a
  rebuild can never lose the newest entry to the 250ms debounce.

### Generating FROM an entry
- `generateSinglePanel(i, runOverride)` grew an optional second argument: `{pos, neg, seedForSlot}`.
  `renderPanelSlot` grew a matching `seedOverride` parameter: when it is a number ≥ 0 the slot uses EXACTLY that
  seed (`opts.seed = seedOverride`, no `+ (k - 1)`) and — importantly — `pinPanelSeedForRun` is NOT called, so
  the panel's Seed box is not touched. `seedForSlot(k)` returns the entry's recorded seed for slot k, or
  `lastSeed + (k - lastK)` if the panel's image count has grown since. Because a run override DELETES
  `promptHistoryRuns[i]`, the history is never written, reordered or duplicated by this path ✓ (the author's
  explicit requirement).

### UI
- New nested accordion inside the `📝 Prompt` accordion body, reusing the established `.panel-acc-stack` nesting
  pattern: `🕘 Generated Prompt` → a hint line + `#gp-list-<i>`. Entries are rendered LAZILY — `togglePanelAcc`
  and `setPanelAccsCollapsed` (Show/Hide Menus) call the new `renderAccHistory(acc)`, which only renders when the
  accordion is actually open and whose `[id^="gp-list-"]` lookup is pinned to its own `closest('.panel-acc')` so the
  outer Prompt accordion does not render the inner block's list. Without that guard, opening any panel's Prompt
  menu would build up to 5 × 2 read-only textareas per panel.
- Each entry: `#N`, a seed label (`seed 123456` or `img 1: … · img 2: …`), a timestamp, `📋 Copy`, and
  `🔄 Generate` whose tooltip states that the entry's prompt + seed(s) are used and the history is left alone.
  The positive prompt is the main read-only textarea, the negative is a second smaller one (the author's "secondary
  line" choice). Read-only textareas (not divs) so the text is selectable/copyable with a visible field boundary.

### Gotcha found while shipping (process, not code)
Testing this feature destroyed the author's live project + library — full post-mortem, timeline and the NEW
MANDATORY TEST PROTOCOL are in `ISSUES.md` (2026-09-24). In short: the tests installed a synthetic project into the
live `comicGen.panelState`, one eval left a NATIVE `confirm()` blocking the page, and the recovery path let a
silent `newProject()` (which needs no confirmation when `hasActiveProject()` is false and deletes
`comicGen.libObjects`) wipe everything. The new protocol: never write a synthetic project into the live state;
if unavoidable, back it up to a WORKSPACE FILE as well as a second localStorage key and verify it reads back;
stub `confirm`/`prompt`/`alert` AND neutralise `newProject` / `resetEverything` / `deletePage` /
`deletePanel` before driving any UI.

### Testing done (feature itself; synthetic state, author's state restored byte-for-byte)
Stubbed `root.generateImage`. Verified: a per-panel run records ONE entry whose `pos`/`neg` are byte-identical to
what was sent and whose `seeds` are the exact per-image values (`[{k:1,seed:111},{k:2,seed:112}]` for a 2-image
panel with panel seed 111); the seed label reads `img 1: 111 · img 2: 112`; an identical repeat de-dupes to one
entry; changing the action adds a second entry newest-first; clicking an entry's `🔄 Generate` produces
byte-identical calls and leaves the history completely unchanged; the cap holds at 5; `🗑 Clear` empties both the
panel's history and the persisted copy; `📋 Copy` works; the JSON editor opens the document with the history
locked and applies cleanly with "No changes to apply."; the author's own state was restored and re-verified
afterwards.

## BATCH 2026.09.24.1 — ⇤ copy-from-previous-panel crosses pages + skips blank panels

Author request (2026-09-24, verbatim): "I'd like the \"Copy (x) from previous panel\" to be available on panel 1
of page 2 and subsequent pages. Generally speaking, I'd like the \"Copy (x) from previous panel\" buttons to
copy from the last panel on the last page that has an example of the item. So if page 1 has 24 panels, and only
up to panel 8 is populated, and I create 10 empty pages after that, I'd like panel 1 of page 11 to be able to
pull from panel 8 of page 1."

Author approved both recon questions (2026-09-24, verbatim): "Your reading is good, and go with your
recommendations on both." — i.e. keep the within-page skip (one uniform "nearest panel that has an example" rule
everywhere) and leave the Seed ⇤ alone.

### What changed (index.html)
- The three row templates (charRowHtml / locRowHtml / actRowHtml) lost their hard `disabled` + `i === 1`
  tooltip and gained ids: `char-copy-prev-<i>-<s>`, `loc-copy-prev-<i>`, `act-copy-prev-<i>`. Enablement is
  now computed at render/edit time, never baked into the markup.
- NEW `readPanelItem(kind, s, pg, j, pages)` — one value accessor that reads the LIVE DOM when
  `pg === currentPage` (`panel-char-select-<j>-<s>` + `panel-char-extra-…`, `panel-loc-select-<j>` +
  `panel-loc-extra-…`, `panel-act-<j>`) and the STORED state otherwise (`pages[pg][j].chars[s-1].sel|extra`,
  `.loc|.locExtra`, `.action`). `panelItemIsSet(kind, v)` is the "has an example" test: a real selection
  ≠ `none`, or non-blank action text.
- NEW `prevItemSource(kind, i, s)` — walks the global panel sequence BACKWARDS: panels `i-1..1` of the current
  page from the DOM, then each earlier page from its `analysisPanelCount(page)`-th panel down from the stored
  state, and returns the first panel that has an example (`{page, panel, value}`) or `null`.
- `copyFromPrevPanel(i, kind, s)` rewritten on `prevItemSource`; the copy itself is still the same
  option-exists-guarded select set + extra textarea write, ending in `refreshPanelLineDesc` /
  `clearPanelPromptOverride` / `updatePanelSummary` / `schedulePanelSave`. Nothing on an earlier page is ever
  written, so a previous page cannot be disturbed.
- NEW `updateCopyPrevChipStates()` (+ `applyCopyPrevChips`, `copyPrevChipTitle`, `absorbPanelItems`): seeds a
  `last` map by scanning earlier pages nearest-first (reverse panel order, `fillOnly = true` so the first hit
  per kind wins, early-out once all four slots are known), then walks the CURRENT page forward applying each
  chip's `disabled` + tooltip and re-absorbing every panel as the LATEST (`fillOnly` falsy = overwrite). Hooks:
  `buildPanelGrid()`'s tail (next to `updateSeedChipStates()`) and `updatePanelSummary()` — the latter is what
  every panel edit already calls (`handleGridInput`, `deletePanelChar/Loc/Act`, `clearPanel`,
  `analysisSetDesc`, the import paths), so the chips stay live while you type, at the cost of one
  O(pages ≤ current) pass per call. Exported as `window.updateCopyPrevChipStates`.

### GOTCHA (cost one test round — see ISSUES.md 2026-09-24)
The first cut used "fill only if unset" for BOTH scans. That is right for the reverse seeding scan but wrong for
the forward scan, which then pins `last` to the page's FIRST populated panel (every later panel is skipped as
"already set"), so every chip on the page claimed "Panel 1". The forward scan must OVERWRITE. The click path was
correct all along, so asserting the copies alone does not catch this — assert the chip `disabled` + `title` too.

### Testing (live preview; the author's real project left untouched)
Built a throwaway 4-page state, rendered it with `window.buildPanelGrid()`, asserted, restored, and re-verified
byte equality of `comicGen.panelState` (the author's state is parked in a SECOND localStorage key first — see
the ISSUES.md test-protocol entry). Fixture: page 1 = 24 panels with 1, 2, 3, 5, 6, 7, 8 populated (panel 4
deliberately blank; panel 1 also carries a second villain), pages 2–4 blank, currentPage 4.
Verified — page 4 panel 1: slot 1 → "Page 1, Panel 8", slot 2 → "Page 1, Panel 1", slot 3 → greyed "No earlier
panel has a character to copy", location + action → "Page 1, Panel 8"; clicking copied `hero|E8`, `city|L8`,
`ACT8`; and panel 2's chip immediately retitled to "Page 4, Panel 1" (the live-update hook). Page 1: panel 1 all
greyed; panel 4 → "Page 1, Panel 3"; panel 5 → "Page 1, Panel 3" (skips the blank panel 4 — the new
behaviour); panel 5 slot 2 → "Page 1, Panel 1"; panels 9 and 24 → "Page 1, Panel 8"; clicking panel 24's chip
copied `hero|E8`. The Seed chip on page 1 panel 1 is still OFF (unchanged by design).
Restore verified: `localStorage['comicGen.panelState']` byte-identical to the original 7,671-byte single-page
"Cow in field" state, `pageSel` = 1, 72 chips present (24 char slot-1 + 24 location + 24 action).

## BATCH 2026.09.23.14 — floating ＋ Add Page button (bottom-right)

Author request (2026-09-23, verbatim): "Let’s add a floating \"Add Page\" button, in the same color scheme as
the page navigator, to the bottom right corner of the screen." Follow-up correction: "Let’s make it in the same
visual style as the Hide Panels and page navigator buttons as well."

Deliberately built out of existing machinery:
- `#addPageFab` is a plain body-level `<button>` sitting right after `#pageNav` (both are viewport-fixed, so the
  DOM position is cosmetic) with `onclick="addPage()"` — the SAME function File → Page Setup’s button calls, so
  there is nothing to keep in sync and no new persisted state.
- The CSS copies `#panelsToggleBtn` property-for-property (radius 6, padding 10px 14px, font-size 0.9rem, the
  same `0 4px 12px rgba(0,0,0,0.6)` shadow and `:hover { background: var(--hover) }`), mirrored to `right: 16px`
  instead of `left: 16px`, at `z-index: 1000` — below the page nav (1001) and far below the selection bar, above
  the page content.
- `positionAddPageFab()` is the only new logic. It starts from `bottom: 16px` and then, in up to 4 passes, lifts
  the button to `r.top - 12 - fh` for any of `#selectionBar` / `#pageNav` / `#panelsToggleBtn` whose bounding box
  it would intersect (both axes tested, with a small margin). The loop must RE-EVALUATE after each lift: measured
  at 390 × 844, clearing the selection bar (753..830) alone put the button at 699..741 — straight inside the page
  navigator (726..770) — so a single-pass version still collided. Converged result: button 672..714, zero
  collisions, 12px gap. Desktop needs nothing: at 866px the centred bar (236..630) never reaches the button
  (734..850), so it stays exactly 16px from both edges.
- No show/hide logic was added: Focus / Storyboard / Library-fullscreen / Analysis / the JSON editor and the
  user manual are all opaque full-page overlays at `z-index >= 10000` and the dialogs sit at 11000/12000, so they
  cover the fixed button automatically. (Same reason the page nav and ▧ Hide Panels need none.)
- Called from `updateSelectionUI()` (the bar’s visibility AND its wrapped height change there), from `resize` and
  `orientationchange` (registered beside the other layout listeners inside `initHeaderObserver`), plus once at
  init. Also exported on `window` for testing.

Verified live 2026-09-23 (viewports 866 × 563 and 390 × 844): the FAB’s computed style is identical to
`#panelsToggleBtn`’s in every measured property (background rgb(26,26,26), colour rgb(77,255,136), 2px green
border, radius 6px, padding 10px 14px, weight 700, the same shadow) and it renders as the expected rounded green
button reading "＋ Add Page". Clicking it added Page 2, switched to it, printed "Page 2 added (4 empty
panels)." and revealed the page navigator with 2 numbered buttons (2 active). At 390 × 844, with a panel
selected AND a multi-page project, it cleared all three bottom bars (bar 753..830, nav 726..770, toggle
786..828) and stayed fully inside the viewport. The author’s project state was snapshotted before the click and
restored afterwards (7671 bytes, 1 page, `currentPage: 1`).

## BATCH 2026.09.23.13 — panel multi-selection, phase 3 (Copy / Cut / Paste) — the feature is COMPLETE

Author greenlit phase 3 ("Let’s do it!") 2026-09-23. Delivered exactly per the approved spec (decisions 10 /
11 recorded in `PENDING.md`): a selection bar hosting Copy / Cut / Clear + "N selected", a Paste chip on
every panel header shown only while the buffer is non-empty, Cut consumed by the first Paste while Copy
persists, and Paste inserting the buffer *before* the clicked panel through the full-page reflow.

New state (in memory only, like the selection): `panelClipboard` (an array of `{panel, img}`) plus
`panelClipboardCut`. `panel` is a deep JSON snapshot of the stored panel object (chars / title /
protectSlots / loc / locExtra / action / seed / imgCount / style / sizeSel / sizeW / sizeH / promptOverride
— exactly what `collectPageData()` produces) and `img` is that panel’s `panelImages[i]` slot array (data
URLs), so a Paste carries the generated images too — unlike Duplicate, which deliberately passes `img: null`.
Nothing here reaches `collectPanelState()`, Export, or localStorage.

Functions: `clipboardCount()`, `clipboardText(count, withImgs)`, `copySelectionToClipboard(mode)`,
`panelCopyAction()`, `panelCutAction()`, `emptyPageAfterCut()`, `panelPasteAction(i)`, `updatePasteUI()`. All
are exported on `window` because the selection bar and every panel header use inline `onclick` handlers.

Markup / CSS: `#selectionBar` is now count + 📋 Copy + ✂ Cut + ✕ Clear. The `.btn-paste-chip` button is the
SECOND child of `.panel-header-row` (right after the select checkbox, before `.panel-title`) so it never
displaces the title, and it carries `.btn-paste-chip[hidden] { display: none }` — the platform’s normalize
stylesheet out-specifies a single-class button colour/display the same way it does for the menu tabs (see
2026.09.23.2). `.selection-bar` gained `max-width: calc(100vw - 12px); width: max-content; flex-wrap: wrap;
justify-content: center`. The `width: max-content` matters: a fixed `left: 50%` element shrink-to-fits
against the space from the 50% mark to the right edge, so it measured just 195 px on a 390 px phone and
wrapped to THREE rows; max-content clamps to the viewport instead (measured 378 × 77 at x = 6, two rows).

Paste = rebuild `entries` (panels 1..total with the clipboard spliced in before index `i`) and call
`cascadePageSequence(currentPage, entries)` — the primitive Duplicate / Add / Move already use, so the
overflow cascades onto the following pages and a page is created at the end when needed. `batchReflowPlan(n)`
drives the single combined `confirm()` on a full page. Because `cascadePageSequence` ends in
`loadCurrentPage()` (which clears the selection), Paste does NOT re-select the pasted panels — matching
approved decision 5 ("after a batch op the selection clears, except Move").

Cut = copy, then remove. With a partial selection it calls `performBatchDelete(false)` — the dialog-free
core of "Delete Only" — after `stopAllGenerations()`. When the whole page is selected that helper bails out
(`kept.length === 0`), so Cut routes through `showChoiceDialog` instead: multi-page → `deletePage(true)`,
single page → `emptyPageAfterCut()` (keeps name / summary / seed, leaves one blank panel,
`panelCountSel = '1'`, images cleared). Cancelling the dialog keeps the panels in the clipboard and says so
in the status line.

Verified live 2026-09-23 in the preview (the author’s panel state was snapshotted first and restored after):
- 6 panels, 2 of them with an image → select 2 + 3 → Copy → all 24 headers show "📋 Paste 2" → Paste before
  Panel 5 → the page becomes 8 panels with the copies at 5 and 6, the image really renders in slot 1 of the
  new Panel 5 (`img.src` === the copied data URL), status "Pasted 2 panels into Page 1 as Panels 5–6."
- Cut 2 + 3 (with images) → 6 panels, "Cut 2 panels (with images)" → Paste before 5 → 8 panels,
  "Moved 2 panels into Page 1 as Panels 5–6. The clipboard is now empty." and every Paste chip hides.
- Esc clears the selection but leaves the clipboard (the chips stay visible).
- 24-panel full page: Copy Panel 1 → Paste before Panel 24 → one `confirm()` ("…reflow the overflow onto the
  following page and create a new page"), the copy lands at 24, Page 2 is created holding the old Panel 24,
  and the status names Page 2.
- Cross-page: with the buffer still holding a copy, switch to Page 2 and Paste before Panel 1 → it lands
  there (the clipboard deliberately survives a page switch, unlike the selection).
- Cut-all of a page: multi-page → "🗑 Cut & Delete Page" deleted Page 2 and switched to Page 1; single-page
  → "🗑 Cut & Empty Page" left one blank panel at `panelCountSel = '1'`, and pasting the 24-panel buffer back
  before Panel 1 restored 24 panels and created Page 2 for the overflow. Cancel leaves everything alone and
  keeps the clipboard.
- Layout: `.panel-header-row` scrollWidth === clientWidth at both 866 px and 1440 px card widths (the chip
  fits inline and adds only +6 px of header height); no document horizontal overflow; the bar is one centred
  row on desktop and two rows fully inside the viewport at 390 × 844.

GOTCHA OF THE SESSION (full post-mortem in `ISSUES.md`): the AI worker’s own test protocol clobbered the
author’s project state. `window.__snap = localStorage.getItem('comicGen.panelState')` does NOT survive a
`page_refresh()`, but localStorage does — so a later eval’s `if (now !== snap) localStorage.setItem(KEY, snap)`
wrote the literal string `"undefined"` (9 bytes) over the 7216-byte state. It was rebuilt from the live DOM
(dispatch an `input` event on any grid input → `handleGridInput` + `schedulePanelSave` → `collectPanelState`)
and came back byte-length identical (7216) with the author’s real globals intact (`imgCountDefault: "3"`,
theme dark / #ffcc00, both keyword lists). Rules from now on: read the snapshot inside the SAME eval that
writes it back; if a snapshot must cross a reload, park it in a SECOND localStorage key (never a `window`
variable) and assert the value is a non-empty string before `setItem`.

## BATCH 2026.09.23.12 — panel multi-selection, phase 2 (batch Generate / Clear / Clear Images / Delete)

Phase 2 of the panel-selection feature (see the 2026.09.23.11 block above and `PENDING.md` for the
approved spec). Phase 3 — Copy / Cut / Paste — is still to come.

WHAT SHIPPED
- **Batch Generate.** `generateComicPage(startPanel, panelList)` gained an optional SECOND parameter: a
  list of panel numbers. When it is a non-empty array the run iterates exactly those panels; the original
  single-argument behaviour (including the `${i}/${totalPanels}` progress text and the `resumePanel`
  arithmetic) is untouched, so ⚡ Generate All / Generate All From Here behave exactly as before. For a
  list run the progress reads `${step}/${list.length}` and `resumePanel` is set to the panel just attempted
  (so pressing ⚡ Generate All afterwards carries on from there to the end of the page).
  `panelGenerateAction(i)` (the new ⚙ Panel 🔄 Generate button) generates the selection when more than one
  panel is selected, else `generateSinglePanel(i)`. `panelGenerateFromHereAction(i)` starts the batch run
  at the FIRST selected panel and runs to the end of the page (the union of "from here" over the
  selection).
- **A generic multi-button dialog.** `#choiceOverlay` reuses the import-confirm chrome — `.import-confirm-overlay`
  (+ its `:not([hidden])` display rule), `.import-confirm-box`, `.ic-hint`, `.import-confirm-btns` — so Esc
  and the full-screen backdrop behave like the other dialogs. `showChoiceDialog({title, paragraphs, hint,
  buttons})` returns a Promise resolving to the picked `value` (or `null` for Cancel/Esc). The buttons are
  built with `document.createElement` + `el.onclick`, so none of them needs a `window.*` export.
  `choiceDialogPick(null)` cancels; the selection's Esc handler *first* closes an open choice dialog (it
  used to jump straight to clearing the selection).
- **Uniform dialog buttons.** The app's `.btn-view` / `.btn-clear` / `.btn-danger` have mismatched padding
  (an import-dialog-style row rendered a 42px row above a 25px row — confirmed with
  `getBoundingClientRect`), so the dialog has its own `#choiceBtns button` rules with `choice-danger` /
  `choice-plain` / `choice-neutral` variants (red / blue / outlined) at a shared height.
- **Clear / Clear Images / Delete batch actions.** `panelClearAction`, `panelClearImagesAction` and
  `panelDeleteAction` are the new ⚙ Panel handlers; each falls through to the existing single-panel
  function when fewer than two panels are selected, so nothing changes for the ordinary one-panel case.
  Clear and Clear Images loop the existing `clearPanelImage` / `clearPanelImages` (each stops only its own
  in-flight generations), then clear the selection. The multi-panel forms confirm through
  `showChoiceDialog` with `🎯 Only This Panel` offered; picking it performs the single-panel action and
  leaves the selection alone.
- **Delete & Refill.** `batchDeletePanels()` computes the dialog (`Delete & Refill` / `Delete Only` /
  `Only This Panel` / `Cancel`, or without the refill option on a single-page project), then
  `performBatchDelete(refill)` does the work: it re-collects the state first (the dialog is async, so the
  project may have changed while it was open), builds the surviving `{panel, img}` list, and — when
  refilling — repeatedly pulls the FIRST panel of the next page (by key) to the end of the source page until
  the source page is back to its pre-delete panel count or the following pages run out. A dry run over the
  same walk feeds the dialog: the hint names the pages that will be emptied, and if any will be, a native
  `confirm()` asks once before the pull is applied. The source page and every affected following page are
  rebuilt through `pageObjectFromEntries`, saved, and re-loaded once at the end.
- **Selecting every panel on a page** deletes the page instead: `batchDeletePanels` offers a single-purpose
  dialog, and when that page is the only page it falls back to the same strong "reset the ENTIRE project"
  confirm `deletePanel` uses (never a silent `resetEverything`).
- **Clear Images stays reachable in batch mode.** `updatePanelAllButtons` and `updateSelectionUI` now
  force-show `.btn-clear-images` on a selected panel while more than one panel is selected (its normal rule
  hides it below 2 images), so the batch action is never hidden behind a panel that happens to have one
  image.

GOTCHAS FOUND WHILE TESTING (worth remembering)
- **`#panelCount` only has the options 1 / 4 / 6 / 12 / 24 / custom.** Setting `sel.value = '2'` silently
  produces `value === ''` (no matching option), and `getPanelCount()` then falls back to 4 — so a test that
  "sets 2 panels" is really testing a 4-panel page. For an arbitrary count set `value = 'custom'` and fill
  `#panelCountCustom`. (This cost a test round: the "a refill empties the next page" path silently did not
  trigger because the second page was 4 panels, not 2.)
- Empty panels are the cheap way to exercise a batch Generate end-to-end: `generateSinglePanel` returns
  `'skipped'` for a panel with no content BEFORE it touches the image service, so a selection of blank
  panels runs the whole queue (progress text, counters, pause/stop bookkeeping, selection release) without
  generating anything or spending quota.
- `analysisPanelCount()` clamps to a minimum of 1, so a following page can never be "empty" — refill takes
  those pages down to zero by DELETING them, which is why the deletion confirm exists at all.

VERIFIED LIVE (2026.09.23.12), then rolled back by restoring `comicGen.panelState`
- Clear with 2 selected → dialog; `Only Panel 1` cleared just that panel and kept the selection; then
  `Clear 2 Panels` cleared both and released the selection.
- Clear Images with 3 selected → dialog; Esc closed it with nothing changed and the selection intact.
- Delete on a 2-page project with 2 selected → `Delete & Refill` / `Delete Only` / `Only Panel 1` / Cancel;
  repeated with the second page holding exactly 2 panels: the hint named Page 2 as about to be emptied, the
  confirm fired, both of Page 2's panels were pulled up (their names verified) and **Page 2 was deleted**
  (page keys went 1,2 → 1; status reported "Deleted 1 emptied page").
- `Delete Only` on the same setup left the source page one shorter with no pull.
- Selecting every panel of a page offered "Delete the N panels of Page X?" → `Delete Page` removed it and
  the remaining pages renumbered.
- Batch Generate with 3 blank panels selected → "Done: generated 0, skipped 3, failed 0.", ⏹ re-disabled,
  selection released; `Generate All From Here` with 2 selected ran from the first to the end of the page.
- 4-button dialog layout checked with `getBoundingClientRect` (two rows of two, no overflow:
  scrollHeight === clientHeight) and rendered for vision.

## POST-2026.09.23.9 — "Save" silently did nothing; and the user manual was renamed

Author report (2026-09-23, immediately after the .9 work was finished): pressing Save gave NO feedback at
all ("it didn't give me any feedback that it was saving"), the src file-panel dot never cleared, and no
error appeared — while the platform went on serving the .8 build.

Diagnosis (from the live page and the platform's own code):
- The generator was fine and the .9 code WAS in the editor: the preview's `renderedContentStamp` read
  `otLen` 409688 (the .9 `index.html` length), and the src bridge reported the pending `src/manual.html`.
- The blocker was the EDITOR TAB's save machinery, which fails SILENTLY (console.warn only, zero UI
  feedback) in several states. In `appExtras.js`, `this.saveGenerator` returns early with "save ignored
  while editor content is still loading" when `window.__editorReady !== true` (or the CodeMirror editors
  are missing), and with "save ignored: a save is already in flight" when `window.__saveInFlight` was left
  set by a hung earlier save. `_goToEditModeInner` (top-level page) also sets
  `saveBtn.style.pointerEvents = "none"` while the editor loads and only restores it on failure; and until
  `loadAppExtras()` resolves, `app.saveGenerator` is a stub that throws "save machinery failed to
  initialize" into an uncaught promise.
- The preview iframe can ask the editor to save — it posts `{type:"saveKeyboardShortcut"}` and the parent's
  `handleIframeSaveRequest()` runs `saveGenerator()`. We sent it three times; every attempt was silently
  ignored, which proved the stuck state was in the editor page, not the generator.
- CURE (author-verified, immediate): LEAVE EDIT MODE AND RE-ENTER IT. That re-runs `_goToEditModeInner`
  and sets `window.__editorReady = true`; Save then works. Falling back, reload the Perchance tab.
- Useful probes for next time: the SAVED src tree (the server's copy rather than the editor's pending one)
  is readable with a direct `https://<publicId>.perchance.org/src/@<generatorName>/<path>` fetch, which
  bypasses the service worker (in-page `src/<path>` may be answered from the editor's pending store).
  `document.__perchanceInternal.renderedContentStamp` / `srcDebug` / `srcTrace` show what the editor is
  rendering and which src files it is holding.

Rename applied: `src/user-manual.html` → `src/manual.html`.
- The author confirmed the files-panel "dot" was showing on `user-manual.html`. Per the 2026-08-14
  `another_upload_in_progress` entry in ISSUES.md that dot is the wedge, and the lock is tied to the FILE
  NAME, so deleting-and-recreating the same name re-wedges it — it has to be renamed.
- Follow-up in `index.html`: all five `src/user-manual.html` references now point at `src/manual.html`
  (openUserManual's fetch, ghPush's fetch + pushed path, the backup dialog's help text, and the
  top-of-file comment), so the backup now pushes `src/manual.html`. The stale repo copy
  `src/user-manual.html` was deleted.
- Un-wedging rules restated: never hard-reload right after writing a src/ file (that kills the in-flight
  sync and wedges that filename); if a src file ever wedges again, RENAME it rather than recreating it.

## BATCH 2026.09.23.11 — panel multi-selection, phase 1 (selection + batch Duplicate / Add / Move)

Author request (2026-09-23): "Panel Selection: This one has a lot of moving parts and a lot of verbiage
from me, so definitely ask me clarifying questions." Eleven RECON recommendations were sent; the author
replied **"all of your recommendations are good"**, so those eleven ARE the spec now — they are recorded
in full in `PENDING.md`. Only phase 1 shipped; P2 (batch Generate / Clear / Clear Images / Delete + their
dialogs) and P3 (Copy / Cut / Paste + the buffer) are still to come, with a review after each phase.

WHAT SHIPPED
- `let panelSelection = new Set()` (1-based panel numbers) + `let selectionAnchor = null`, declared just
  above `duplicatePanel`. There is exactly ONE classic `<script>` in index.html, so a plain top-level `let`
  is visible to `loadCurrentPage` and friends — but it is NOT on `window` (only the explicitly exported
  functions are; the new inline handlers were added to the export block by `window.deletePanel`).
- `#panel-select-N.panel-select-cb` wrapped in `.panel-select-wrap`, the FIRST child of `.panel-header-row`,
  with `onclick="onPanelSelectClick(N, event)"`. The handler reads `ev.target.checked`, which is the
  POST-toggle value for a real click, so it must NOT also listen for `change` (that would double-fire).
- `updateSelectionUI()` is the single render pass: it drops out-of-range indices (> `getPanelCount()`),
  toggles `.panel-selected` on the card, sets each checkbox, rewrites the per-card button labels to include
  the count when the panel is selected and `size > 1`, and updates `#selectionBar` / `#selectionBarCount`.
  It is called at the END of `buildPanelGrid()`, so every rebuild re-syncs the UI to the in-memory set.
- `panelDuplicateAction(i)` / `panelAddAction(i)` are the new handlers on the ⚙ Panel buttons; when
  `panelSelection.size > 0 && panelSelection.has(i)` they call the batch function, otherwise the original
  single-panel function. `size === 1` still routes through the batch function, which simply delegates to the
  single-panel one (which clears the selection) — so a lone selected panel behaves exactly as before.
- `cascadePageSequence(srcPage, entries)` — the general primitive, factored out of
  `reflowInsertOnFullPage` (which is left untouched and is still what the single Duplicate / Add use).
  `entries` is the whole new panel sequence for `srcPage` as `{panel, img}` objects and MAY exceed 24: the
  first 24 become the page, the rest are PREPENDED to the next page (by key) and cascade the same way,
  creating one page at the end if there is nothing left to push into. It rebuilds each page through
  `pageObjectFromEntries` so the page's name/summary/seed and its `panelCountSel`/`panelCountCustom` are
  always consistent. It does `stopAllGenerations()` → `collectPanelState()` → writes `pages` →
  `savePanelStateShape` → `currentPage = srcPage` → `setPageImagesFor(srcPage, …)` → `loadCurrentPage()`
  → `populatePageSel()` → `updateDeletePageBtn()`.
- Batch ops: `batchDuplicatePanels` (a copy directly after each selected panel; copies carry NO images);
  `batchAddPanels` (one empty panel per selected panel, all after the LAST selected one); and the Move set
  `moveSelectionWithinPage(toPos)` (the block re-inserted so it STARTS at `toPos`),
  `batchMoveToPage(targetPage, replaceTarget)` and `batchMoveToNewPage()`. `batchDuplicatePanels` /
  `batchAddPanels` confirm ONCE via `batchReflowPlan(extra)` (is a reflow needed? will a page be created?
  how many following pages are touched?) instead of once per panel.

GOTCHAS / DECISIONS WORTH KNOWING
- `analysisPanelCount()` CLAMPS to a minimum of 1 panel, so a page can never be empty — a freshly created
  page already "has" one blank panel. `batchMoveToNewPage` therefore calls `batchMoveToPage(n, true)`, which
  makes the moved block REPLACE that blank (the batch analogue of the single-panel
  `movePanelToPage(i, n, 'replace')`). Without it you get a stray empty panel at the front — observed
  live: 3 moved panels produced a 4-panel page.
- The selection is cleared inside `loadCurrentPage()` (before `buildPanelGrid()`), which is how a page
  switch, `addPage`, `deletePage`, and every single-panel structural op (duplicate / add / delete /
  resequence / move-to-page) drop it. The batch **Move** paths therefore re-add their indices AFTER
  `loadCurrentPage` runs and set `selectionAnchor` to the last moved panel — recommendation 5: Move keeps
  the selection, everything else clears it.
- `#selectionBar` is `position: fixed; left: 50%; transform: translateX(-50%); bottom: 14px`. Verified with
  `getBoundingClientRect` at 866×563 and at a 390×844 phone viewport: dead centre with a 14px bottom gap,
  and no ancestor has a transform / filter / contain that would break `fixed` (the same "fixed-breaker"
  walk `openGhBackup` does). Because the class sets `display: flex`, it needs its own
  `.selection-bar[hidden] { display: none }` rule — an author `display` declaration beats the UA
  `[hidden]` rule.
- The selection highlight is HARD-CODED blue (`#4d9fff` border + a translucent `#4d9fff` tint
  `linear-gradient` background-image) rather than an `--accent`-derived var: `--accent` is user-pickable and
  can itself be blue. A translucent background-image also works on both themes without touching the three
  theme var blocks. `.panel-select-cb` uses `accent-color: #4d9fff` for the native tick.
- Esc clears the selection from a `document` keydown listener, but ONLY when no overlay is open — it bails
  if any `[id$="Overlay"]` element is visible, otherwise it would steal Esc from the Focus view, the JSON
  editor, the manual, etc.
- `handleGridInput` ignores the new checkbox id safely (no regex matches it), and the grid's `change`
  listener merely schedules a save — the selection itself is never collected into the project state, so it
  cannot leak into Save / Export / Import.
- Verified live on 2026.09.23.11: click → 1 selected; Shift-click → the range, with
  "⧉ Duplicate 3 Panels" / "＋ Add 3 Panels" / "⇅ Move 3" on exactly the selected cards and the plain labels
  on the others; a click on a panel body changes nothing; Esc clears; `localStorage['comicGen.panelState']`
  is byte-identical before and after (proving the selection is session-only). Batch matrix: 4 panels →
  Duplicate all → 8 interleaved (T1,T1,T2,T2,…) with the count field `custom`/8; Add with 2 selected → +2
  empties after position 2; Move panels 1–2 to position 7 → order 3,4,5,6,7,8,1,2,9,10 with the selection
  following to 7,8; Move 2 panels to a brand-new page → that page holds exactly 2; 24 panels + Duplicate 3
  → ONE confirm, the page stays at 24 and 3 panels reflow to the next page; with no next page → a new page
  is created holding exactly the 3. Every test ran against the author's LIVE project state and was rolled
  back by restoring `comicGen.panelState` and reloading.
- Vision-checked at desktop and phone widths: the checkbox is the leftmost header-row item, selected cards
  read clearly blue against the amber default, the header row still wraps cleanly at 390px with no
  horizontal overflow (`documentElement.scrollWidth === innerWidth`), and the selection bar sits centred at
  the bottom.

## BATCH 2026.09.23.10 — a remembered "Images per Panel" default
- Author request, part of the 3-item "next tasks" batch, greenlit for immediate implementation ("if there are no
  questions you can implement this one immediately … implement using your recommendations and alert me"): the number
  of images per panel should be settable and default to that on the next open, or at least travel in the project's JSON.
- What changed: 📄 File → Page Setup's control (formerly "Image Count for All Panels") is now **Images per Panel** and
  its value is a real setting rather than only an apply-button. New top-level state field `imgCountDefault` (declared
  next to `guidanceScale`/`imageSizeSel` in `collectPanelState()`) → it rides in `comicGen.panelState`, in Export/Import
  `.json` + `.zip`, and in the JSON editor, where it is editable (it lives under `settings`, so `jsonFieldClass` already
  allows it) and validated with `jsonOptionProblem('bulkImgCountSel', val)`.
- Mechanism: a module-level `imgCountDefaultPref` mirrors the setting in the page; `imgCountOptionHtml()` renders the
  per-panel `<option>`s with the default marked `selected` (used by `buildPanelGrid`), and the panel-restore line now
  falls back to it — `if (ic) ic.value = (p.imgCount && [...ic.options].some(o => o.value === p.imgCount)) ? p.imgCount : imgCountDefaultPref;`
  Wiring: `onBulkImgCountChange()` (new; exported to `window`) saves the default as soon as the select changes,
  `applyAllImageCount()` records it too, and `resetEverything()` puts it (and every panel) back to 1. Help text (in-app
  Help ▸ Fill in each panel, and the control's own hint) and `src/manual.html` (File bullet, Export-contents row,
  version, changelog) were updated.
- Deliberate behaviour: changing the default does NOT retroactively rewrite panels that already have their own count —
  it only decides what NEW / blank panels start at. Verified live: with one panel's stored `imgCount` removed, that
  panel came back as the default (3) after a reload while panels 1 and 12 kept their stored 1; the exact original state
  was written back afterwards.
- Not done, offered to the author: an app-wide `localStorage` mirror so the default would also carry into a brand-new
  project. It is project-scoped for now, so Reset to Defaults means 1 — matching how `guidanceScale` resets to 7.
- The batch's other two items: "New Panel on a full page uses the Duplicate reflow" was already implemented in
  2026.09.23.9 (verified, no change needed); **Panel Selection** is greenlit but ON HOLD pending the author's answers to
  the RECON questions (logged in PENDING.md).

## BATCH 2026.09.23.9 — full-page panel reflow (Duplicate / ＋ Add Panel) + the −1 seed scrub
- Author request (2 items; recon + questions first, per the standing directive): (1) duplicating a panel on a full
  page should no longer offer "start a new page with a copy" — the overflow should reflow onward recursively;
  (2) an imported project with −1 as a project or panel seed should be quietly made random. Author's answers: the
  ORIGINAL last panel is the one pushed (the copy keeps the slot immediately after the panel it copies); ＋ Add
  Panel gets the same recursive treatment; the −1 scrub is import-only and never touches a seed the user typed.
- Author's worked example, which defines the behaviour: three pages of 24, duplicating Panel 6 on page 1 → create
  page 4; move page 3's Panel 24 → page 4 panel 1; page 2's Panel 24 → page 3 panel 1; page 1's Panel 24 → page 2
  panel 1; insert the copy as page 1 panel 7. End state 24/24/24/1.
- Implementation: a page is `state.pages[n] = {name, summary, seed, panelCountSel, panelCountCustom, 1..24}` with
  its images in `pageSession[n].images` keyed by panel position. New helpers beside `duplicatePanel`:
  `sortedPageKeys()`, `pageImagesOf()`/`setPageImagesFor()` (the current page's LIVE `panelImages` object is
  mutated in place so `buildPanelGrid()`/`loadCurrentPage()` see it), `planReflow()` (dry run → `{moves,
  willCreate}` for the confirm wording) and `reflowInsertOnFullPage(i, panel, img)`.
- `reflowInsertOnFullPage` works on ONE collected state and saves once: it rebuilds the source page at 24 panels
  with the incoming panel at `min(i+1, 24)`, dropping the page's ORIGINAL last panel into `carry`; then, while
  there is a `carry`, it finds the next existing page key, prepends the carry at position 1, and — if that page now
  holds 25 — carries ITS last panel onward; if no next page exists it creates one (max key + 1) holding the carry at
  panel 1. Images shift with their panels at every step (deep-copied across page boundaries). `currentPage` stays
  put, so the user sees the result where they clicked. Note `movePanelToPage(i, target, 'prepend')` already did the
  single-page half of this, which is why prepend-at-position-1 is the established semantic.
- `duplicatePanel(i)` and `addPanel(i)` now share that full-page branch (confirm → reflow). `duplicateToNewPage()`
  was DELETED (it was the old "new page with the copy" behaviour and had no other caller). `addPage()` (＋ Add Page)
  is untouched. Confirm text: "<Sheet> is full (the 24-panel maximum). Duplicating Panel N will [create a new page
  and ]reflow X panel(s) onto the following page(s). Continue?" — Cancel just writes a status line.
- Item 2: `scrubMinusOneSeeds(settings)` is called inside `applyImportedSettings()` immediately before the settings
  are written to PANEL_STATE_KEY, so it covers BOTH import paths (.json and .zip) and the "save current first?"
  branch (they all converge there). It clears `seed` when it is `-1`, `'-1'` or a padded `' -1 '` — on the page
  (project) seed, on panels 1..24, and on the settings object itself (the legacy flat shape `ensurePages()`
  accepts). `'42'`, `'92'`, `''` etc. are untouched.
- VERIFIED with synthesised project ZIPs imported through the real `importSettingsFromFile()` path (fake event →
  applyImportedSettings + parseZipImages + repopulateImportedImages for real): [24,10] duplicate → 1 move, page 2
  at 11 panels, no new page; [24,24] duplicate → new page, 24/24/1; [24,10] ＋ Add → blank inserted at 7, 1 move;
  Cancel → nothing changes (only the status line); duplicate Panel 24 of a full page → the ORIGINAL (with its
  image) goes to the new page and the copy stays at 24 with no images; a page that is NOT full → unchanged
  behaviour, no dialog. Images demonstrably travel across pages (page 2/3/4 panel 1 rendered the image that had
  been on the previous page's panel 24). Seed fixture: `-1` (number), `'-1'` and `' -1 '` all cleared, `'42'` and
  `'92'` kept.
- GOTCHA (cost a test cycle): the first fixture run silently tested NOTHING because the poll loop watched
  `#backupStatusEl` for /Imported/ — which still held the PREVIOUS import's message, so it broke out instantly and
  the action ran against stale state before the new import landed. Clear that element before importing, then wait
  for it to change.
- WARNING: those import tests overwrite the LIVE preview's project — the preview shares the generator's real
  origin, so `comicGen.panelState` and `comicGen.libObjects` are also the author's own in-browser project. Both
  got replaced by the fixtures; the preview was reset to defaults afterwards (and the author was told). Snapshot
  the `comicGen.*` keys before any destructive test from now on.

## BATCH 2026.09.23.8 — About loads the changelog from the repo; readable panel-summary separators
- Author request (the two optional items offered right after 2026.09.23.7 shipped): (1) raise the contrast
  of the decorative `.ps-sep` "·" separators in a panel's summary line — the last sub-4.5:1 text node in
  dark mode; (2) move the ~60KB `#embeddedChangelog` block out of index.html into the repo and have
  Help → About fetch `CHANGELOG.md` instead. The author said "go ahead" for both.
- Item 1: `.panel-summary .ps-sep` was `var(--text-10)` (#666666) on the panel surface (#2a2a2a) = **2.50:1**.
  Now `var(--text-8)` (#999999) = **5.04:1** in dark (5.03:1 in light against --bg), still dimmer than the
  item names (--text-3 = 10.57:1), so the hierarchy is unchanged. Measured with a WCAG relative-luminance
  calculation in page_eval and confirmed with `vision` on a 3x capture of a real `.panel-summary`.
- Item 2: the `#embeddedChangelog` `<script type="text/plain">` block (62,582 chars) is replaced by a tiny
  `#embeddedVersion` stamp holding only the current release's `## <ver> — <date> — <title>` heading plus one
  bullet. New JS: `ghRepoInfo()`, `changelogFetchTargets()`, `changelogSourceMd()`, `parseChangelog()`,
  `setChangelogStatus()`, `renderChangelogEntries()`, `renderChangelog()` (sync — stamp only) and
  `loadFullChangelog()` (async — the real file). A new `.changelog-status` line above `#changelogCtn`
  carries the loading/loaded/⚠️ message and a "View on GitHub ↗" link.
- LAZY BY DESIGN: `renderChangelog()` runs at init and renders ONLY the bundled stamp; the network fetch
  happens on the FIRST expand of the About section, hooked in `toggleMenuCollapse()` (only when a panel that
  contains `#changelogCtn` goes to `data-collapsed="0"`) and in `expandGroupPanels()` (guarded by
  `group.querySelector('#changelogCtn')`). Verified with a `preambleJs` fetch-logger that the page makes
  ZERO changelog requests at load. `changelogFullLoaded` memoises per page load.
- GOTCHA (measured): `raw.githubusercontent.com` is edge-cached for ~5 MINUTES and a `?cb=<timestamp>` query
  does NOT bust it — right after the CHANGELOG push, the Contents API served the new 85-entry file while raw
  still served the previous 84. So the About panel now tries the **Contents API first**
  (`api.github.com/repos/<o>/<r>/contents/CHANGELOG.md` with `Accept: application/vnd.github.v3.raw` —
  CORS-open and unauthenticated for this public repo, ~60s cache, no token needed) and falls back to raw.
  ghPush's commit-message version now reads `#embeddedVersion`, and its `docMap` (which used to push the four
  embedded docs) was DELETED — ghPush no longer touches CHANGELOG.md / PENDING.md / AI-NOTES.md / ISSUES.md.
- Also fixed (found by `vision` while verifying the About panel): changelog bullets are Markdown and the
  About panel had ALWAYS printed the raw `**bold**` and backtick markers. New `appendInlineMarkdown()`
  renders `**bold**` → `<strong>` and `` `code` `` → `<code>`, recursively (either can contain the other;
  unmatched markers stay literal; DOM nodes only, never innerHTML). Result: 165 `<strong>` + 34 `<code>`
  nodes and ZERO stray markers across all 235 rendered bullets. 4 historical bullets had an ODD number of
  `**` markers (they were truncated when first written) — those 4 dangling markers were dropped from
  CHANGELOG.md.
- Impact: index.html 460,851 → 403,805 chars (the served page drops the same ~57KB of escaped text).
- Verified live: no console/perchance errors; About shows the stamp instantly then 85 entries plus the
  "Loaded live from the project repo." status and link once expanded; a simulated-offline run (fetch stubbed
  to reject) showed the ⚠️ "Could not load the full history" status, the single stamp entry, and
  `#aboutVersion` = 2026.09.23.8; no horizontal overflow at 390px with the Help group + About open
  (`documentElement.scrollWidth == clientWidth`); phone-width capture reviewed with `vision`; left in the
  default state (dark theme, accent #ffcc00, File menu open, 0 expanded sections).
- NOTE: the repo's index.html is pushed from the SERVED page (the last SAVED build), so it only picks up
  this release after the author presses Save — as always, re-run ghPush after they save.

## BATCH 2026.09.23.7 — collapsible per-panel character/location lines; Library/menu tidy-up
- Author request (2 items, then an expansion): (1) in the Library tab, show everything directly under the
  top-level Library tab, and make the OTHER menu groups' sections default to CLOSED; (2) a panel's
  character/location description can go stale relative to the library — the author wanted either a re-select or a
  "refresh from library" chip. The author then REPLACED item 2's fix with a redesign: make each character/
  location line COLLAPSIBLE (collapsed = just the name; expanded = the read-only library description + an
  editable per-panel extra description), stop auto-filling, and let a panel generate from a name alone.
- `switchMenu(name)` now expands ONLY the library group (`name === 'library'`), so File/Edit/Help open with
  their sections collapsed in BOTH modes; `openMenuFullscreen()` mirrors that. Full screen no longer
  force-expands every section — THAT behaviour was the author's "all of the other menu item groups are
  defaulting to open" (the inline menu already collapsed them; only full screen did not).
- Library group: the collapsible "Library" header and the `⛶ Full Screen` button (`#libFullscreenBtn`) are
  GONE. `setupMenuCollapse()` no longer wraps `.library-section` — its `h3` fallback would otherwise latch onto
  the first `.lib-bucket` ("👤 Characters") heading and turn the bucket title into the collapse toggle. Classic
  trap: a section with no dedicated header picks up whatever heading it contains.
- Panel lines are now `.pl-line[data-pl-key][data-collapsed]` > `.pl-line-head` (toggle + select + ⇤ + ✕) +
  `.pl-line-body` (read-only `.pl-libdesc` + editable `.po-desc`). See AI-NOTES §5.
- **Long-standing prompt bug found and fixed:** `buildPanelPrompt` pushes `resolveDesc(sel)` (the library
  description, resolved LIVE from `comicGen.libObjects`) AND `extra.value`, while the select handler used to
  auto-fill an EMPTY extra box with a copy of that same description — so a saved character/location with a
  description was sent to the model TWICE. Verified live: a probe character whose desc was `ZZUNIQUEDESC`
  produced "…, ZZUNIQUEDESC, ZZUNIQUEDESC" in the built prompt. Auto-fill removed; `migratePanelExtraCopies(page)`
  (called beside `migratePanelExtras(page)` in `restorePanelState`, so it runs per page as it loads) clears a box
  whose text EXACTLY equals the selected library item's current description. Custom text is left alone.
- **Location-only panels were being skipped:** `hasContent` was `charParts.length > 0 || locParts.length > 0 || …`
  but `locParts` was a DEAD variable that was never pushed to, so a description-less location contributed
  nothing (a description-less CHARACTER did, via charParts). Replaced with `hasLocSelected`. A saved "Holstein
  cow" with no description — the author's own example — now renders.
- Verified live: no console/perchance errors; 24 panels x 4 lines, all folded by default; built-in and library
  descriptions both display read-only; toggling works; no duplication; the migration clears the old copy while
  keeping custom text; no horizontal overflow at 390px; light and dark themes both legible.
## BATCH 2026.09.23.6 — internal docs moved out of index.html into this repo
- The four internal docs (dev-notes / PENDING / AI-NOTES / ISSUES) no longer ship inside
  index.html; it now carries only a compact "docs live on GitHub" pointer comment at the top.
  Exactly ONE embedded doc block remained at that point: `#embeddedChangelog` (Help → About + the
  version number, parsed from its FIRST `## ` heading). That one is gone as of 2026.09.23.8 too —
  only a tiny `#embeddedVersion` stamp is left.
- Why: index.html was ~819KB, of which ~422KB (52%) was internal documentation (dev-notes
  comment 161.5KB + PENDING 116KB + CHANGELOG 60KB + AI-NOTES 54KB + ISSUES 30KB). Because the
  platform embeds/escapes the whole file, the served page was ~986KB — downloaded by every visitor.
- `ghPush()` needed NO change: its docMap skips missing/empty blocks, so it now pushes main.pjs /
  index.html / src/user-manual.html / CHANGELOG.md and leaves the other three alone.
- The repo cgoodwin97124/yacbpg-backup was made PUBLIC the same day (read + fork by anyone; push
  stays with the owner). Raw reads need no token.
- index.html also lost its 1.5KB TROUBLESHOOTING NOTE comment (moved here, below).

---


  DEV NOTES FOR FUTURE AI SESSIONS (read before editing):
  - LOG EVERY REQUEST FIRST (2026-08-13, author-mandated): every author request must be added to
    src/PENDING.md BEFORE any work starts — even "go ahead now" requests. The queue is split into
    🟢 START NOW (greenlit, implement immediately) / 🕒 QUEUED (awaiting "go ahead", don't start) /
    ✅ DONE (with the changelog version). The session that set up this rule logged it as its own
    START NOW entry first (see PENDING.md) — a docs-only change, so no changelog entry for it.
  - STANDING DIRECTIVE (2026-08-15, author-mandated, in force until the author says otherwise): whenever a
    task ends with the usual "press Save" reminder, ALSO run the GitHub backup in the same turn — openGhBackup()
    (loads saved token from localStorage), ghPush(), ghClose(). Keeps GitHub history in lockstep with shipped code.
  - STANDING DIRECTIVE (2026-09-20, author-mandated): for EVERY new change request — after logging it in the
    PENDING queue (the 2026-08-13 rule) — RECON the relevant existing code and, if anything is ambiguous, ASK the
    author any clarifying questions and WAIT for the answers BEFORE implementing. Record the recon findings and
    the answers so they survive compaction: the per-request PENDING entries are the durable home (request-scoped),
    and durable architecture facts the recon uncovers also go into AI-NOTES. Do NOT keep them only in a volatile
    scratch/ file (scratch/ is wiped between sessions).
  - STANDING DIRECTIVE (2026-09-23, author-mandated): the AI may PAUSE mid-task and ask the author for input
    whenever it reaches a genuine decision point — especially for visual/UX choices that can't be settled from
    the existing code. This extends the 2026-09-20 rule (which only covered asking BEFORE starting) to DURING the
    work: finish the current safe step, then ask in the chat reply rather than guessing. Small/mechanical choices
    (naming, minor spacing) still get "reasonable choice + brief note" instead of a question.
  - VERSIONING / DATE CONVENTION (author-mandated 2026-09-23): versions are `YYYY.MM.DD.S` where S is that day's
    serial release number starting at 1 (NO zero padding — 1, 2, ... 10 — since S is read by a human and compared
    as a whole number). A new day's first release is `.1`. All dates/times written into these docs and the
    changelog use the AUTHOR'S timezone, US Pacific (PST/PDT). First release under this scheme: 2026.09.23.1.
  - FILE-CLEANUP 2026-08-15 (IMPORTANT): the four embedded doc blocks were DUPLICATED (a second mid-file
    copy, plus the first embeddedIssues block had lost its closing script tag and swallowed ~1870 stray lines
    incl. a stale <style> and the second docs copy as inert text). Consolidated to ONE clean set (~230KB
    removed). The app reads docs via getElementById → FIRST element, so only the first set was ever live, but
    the ISSUES element's .textContent had included the garbage and ghPush shipped it. See ISSUES entry
    2026-08-15. Rules going forward: never paste the doc blocks twice; never write a literal close-script
    sequence inside a text/plain doc block; verify querySelectorAll('#embeddedX').length === 1 after big edits.
  - BATCH 2026.09.23.5 (author bug report, 2026-09-23): "requestCloseMenuFullscreen is not defined" when clicking
    the full-screen menu's "← Back to page" button (perchance reported it as an error in that element's onclick).
    CAUSE: the function was declared inside the IIFE (directly above the Esc keydown handler, which calls it
    internally, so Esc worked) but was NEVER added to the window.<fn> = <fn> export block at the end of the IIFE,
    so the inline onclick could not resolve it. A ship-2 (2026.09.23.2) omission — NOT a 2026.09.23.4 regression
    (.4 touched only CSS variables, one CSS rule, the boot theme default, the Focus label and one inline button
    colour; none of those touch this). FIX: added "window.requestCloseMenuFullscreen =
    requestCloseMenuFullscreen;" right after "window.toggleMenuFullscreen = toggleMenuFullscreen;". AUDIT for the
    same class of bug, two ways: (a) LIVE DOM — for every element carrying an on* attribute, extract each
    identifier invoked as fn( and require typeof window[fn] === 'function' → 1635 calls / 120 distinct functions,
    ONLY requestCloseMenuFullscreen missing; (b) STATIC — every on*= "..." attribute in the source (186 of them)
    vs the set of names assigned by window.X = → the same single miss. RULE for future agents: a function
    referenced by any inline on* attribute MUST have a matching window.NAME = NAME; line in the export block; the
    two audit snippets above are the cheap way to re-check after adding handlers. Released as 2026.09.23.5.
  - BATCH 2026.09.23.4 (author request, 2026-09-23 — "Your rec." answering my offer to fix the dark-mode
    low-contrast chips, plus "it covers the two small offers too"): DARK CONTRAST PASS + two follow-ups. I
    audited every visible text node in dark (computed color vs nearest opaque background, WCAG ratio): 53 nodes
    under 3.4, in three buckets. (1) THE REAL BUG — the per-panel seed chips were rendering AMBER on their
    fills: 4x #seed-clear-N.btn-line-del amber-on-red (~2.18) and 4x #seed-copy-prev-N.btn-copy-prev
    amber-on-blue-3 (~2.47), because they sit inside .panel-imgs-sel{color:var(--accent)} and normalize's
    button:not([disabled]){color:inherit} (0,1,1) out-specifies .btn-line-del / .btn-copy-prev (0,1,0). The
    LIGHT-READABILITY tail block already fixed exactly this, but was scoped to light only, so dark was missed.
    FIX: added ".panel-imgs-sel .btn-copy-prev:not(:disabled), .panel-imgs-sel .btn-line-del { color:#fff }"
    (0,2,1, theme-agnostic). The same trap hit the 4 "⇅ Move" .btn-reorder chips (amber on --grey-btn #6b6b6b,
    3.52) — fixed with the unscoped ".btn-reorder:not(.active) { color: var(--text) }" (0,2,0, beats
    normalize; the light block already had this scoped so light is unchanged and dark now matches). (2) WHITE
    text on saturated fills (~44 nodes, teal/blue/red/green-3 at 2.7–3.4) — FIX: darkened the DARK values ONLY
    of --teal #2a9d8f->#238377, --teal-2 #23857a->#1f776d, --blue #4d9fff->#3a77bf, --blue-2 #3b8ce0->#2e6cae,
    --blue-3 #4d7fff->#436fde, --blue-4 #3d6ae6->#3962d5, --red #ff4d4d->#d34040, --red-2 #ff3333->#cc2929,
    --green-3 #2ea043->#278738, --green-4 #248f38->#1f7b30 (each now >=4.5 against white; hovers >=5.3). The
    light values were already darker and pass, so light is untouched. (3) the Import Project button
    (background:var(--purple) + inline color:#fff) was white on lavender (~2.0) in dark — FIX: new theme-aware
    var --on-purple (#111111 in dark, #ffffff in light + its media mirror) and the inline style now uses it.
    DECORATIVE .ps-sep "•" (8 nodes, ~2.5) deliberately LEFT ALONE (my rec). Post-fix dark audit: 9 nodes under
    4.5, all intentional (8 decorative dots + 1 disabled chip, which is exempt). ALSO, the two small offers the
    author approved: (a) default color mode — the init fallback changed 'dark'->'system' (the module default was
    already 'system'), so a first-time visitor matches their device; verified live by clearing
    localStorage['comicGen.themeMode'] (my device prefers light -> app came up light, select on "Match my
    device"), then the author's 'dark' preference was restored. (b) Focus view — #focusGenerateBtn relabelled
    "⚡ GENERATE ALL PANELS ON PAGE ⚡" -> "⚡ Generate All", with text-transform:none added to .focus-gen
    .btn-generate (the base .btn-generate rule is uppercase) so it renders mixed-case like the menu item; its
    Pause/Stop title attributes were reworded too. Released as 2026.09.23.4.
  - BATCH 2026.09.23.3 (author request, 2026-09-23 — items 7 & 8 of the 8-item request, the LAST ship of that
    batch): THEME. Every hard-coded colour in the app is now a CSS custom property, and the app can run in
    Light / Dark / System mode with a user-picked accent. (a) The style block now opens with a `:root{...}` table of
    74 variables (`--hdr-h` is merged in) whose DARK values ARE the old literals, so the default look is unchanged
    — verified: body #1a1a1a, cards #2a2a2a, project name #4dff88, accent #ffcc00, Stop #ff4d4d all identical.
    A `:root[data-theme="light"]{...}` block overrides them for light mode, and the SAME declarations are mirrored
    inside `@media (prefers-color-scheme: light){ :root:not([data-theme]){...} }` so a "System" pref resolves with
    zero flash even before JS runs. (b) VAR FAMILIES: `--bg/--surface/--surface-N/--well-N/--hover-N/--grey-btn/
    --act-cell/--teal` = fills; `--text/--text-N` = foreground greys (N grows with dimness); `--ink/--ink-2` =
    text on bright fills (stays dark in both themes); `--accent/--accent-soft/--accent-2…5/--accent-pulse/
    --accent-outline/--accent-deep` = the accent family; `--red/--red-2/--green…/--blue…/--purple…` = fills and
    the matching `--*-text` names = those hues as TEXT; `--border/--border-2…8`; `--on-danger` = white text on the
    red buttons. The literal→variable swap was mechanical, keyed by (property, literal) so e.g. `background:#111`
    became `--well` while `color:#111` became `--ink`, and `color:#fff` became `--text` (fill sites keep `--ink`).
    `rgba()` shadows/scrims were deliberately left as literals (they read correctly on both themes), except the
    one `background:#fff` on `#manualFrame`, which is pinned to `--surface`. (c) JS API (all exported on window):
    `applyTheme()` sets/removes `data-theme` on `<html>` and writes the accent vars as INLINE custom properties on
    `documentElement`; `themeEffectiveMode()`; `accentVarsFor(hex, mode)` derives the whole accent family from ONE
    picked colour via `mixHex`, and in light mode walks the mix until `contrastAgainst(white) >= 4.2` so a pale
    accent can never produce unreadable text; `applyThemeFromProject(theme)`; `onThemeModeChange()`,
    `onAccentInput()`, `onAccentChange(hex)` (UI entry points), `syncThemeControls()`, `persistTheme()`. Constants
    `THEME_MODE_KEY`/`THEME_ACCENT_KEY` + `THEME_MEDIA` (its `change` listener re-applies while the pref is
    "system"). (d) PERSISTENCE: `comicGen.themeMode` + `comicGen.accent` in localStorage (fast path, and what the
    pre-paint bootstrap reads) AND `settings.theme = {mode, accent}` in `collectPanelState()` so it travels in
    Save/Export/Import; `applyImportedSettings()` and `jsonApplyDoc()` both call `applyThemeFromProject`, and
    `jsonFieldClass` locks the `settings.theme` OBJECT but marks `mode`/`accent` editable. The DEFAULT is `dark`,
    so nothing changes for anyone who never opens Preferences. (e) NO-FLASH BOOTSTRAP: a hidden `<span>` with one
    square block sits immediately before `<style>` — it runs during template render (before the first paint) and
    sets `data-theme` from localStorage, resolving `system` via `matchMedia`. (f) LIGHT-READABILITY tail block
    (`/* LIGHT-READABILITY */`, light scope only — dark untouched): normalize's `button:not([disabled])
    { color: inherit }` (0,1,1) was beating single-class colour rules (0,1,0) on the small coloured chips, so
    `.btn-line-del/.btn-reroll/.btn-img-clear/.btn-img-reroll/.btn-stop-global/.btn-del-lib/.btn-danger/.btn-copy/
    .btn-copy-prompt/.btn-copy-prev:not(:disabled)` are pinned to `#fff` and `.btn-reorder:not(.active)` to
    `var(--text)` under `:root[data-theme="light"]` AND `:root:not([data-theme])` (inside the light media query).
    The 8 rules whose fill is `var(--red)` now use `color: var(--on-danger)`. `.menu-btn.menu-action` moved from a
    literal `#fff` to `color: var(--text)` so the Generate/Pause items stay readable when the menu bar turns
    white in light mode (dark is unchanged: `--text` is #fff there). `--accent` in light mode is a deliberately
    darkened gold (#9a6b00) so amber TEXT on white clears ~4.7:1. (g) MEASURED RESULT: the light theme's own
    contrast audit (every visible text node vs its effective background, ratio < 3.4) reports 1 marginal case
    (a disabled ⇤ chip) versus 53 in the untouched dark theme, and the dark theme's numbers/probes are unchanged.
    (h) NOT theme-aware, on purpose: `poTip` (the hover tooltip stays dark — a dark tooltip on a light UI is
    conventional and it reads fine) and the user-manual iframe's srcdoc error page (CSS variables do not cross
    into another document, so it keeps literal colours).
  - BATCH 2026.09.23.2 (author request, 2026-09-23 — items 1, 3, 4 & 5 of the 8-item request; answers in the
    PENDING START NOW entry): HEADER + MENU. (a) `.app-header` is now STICKY (`position:sticky; top:0; z-index:6;
    background:#1a1a1a; margin:0 -20px 8px; padding:6px 20px` — the negative margin makes its background span the
    body's 20px gutters) so the title + four buttons stay on screen while scrolling; `--hdr-h` (JS-set by
    `syncHdrHeight()`, ResizeObserver + resize) drives the sticky `top` of `.menu-frame` (and
    `calc(var(--hdr-h) + 10px)` in side mode) so the two never overlap. (b) NEW PREFS, all persisted + exported
    (see below): `menuFullscreen` (default ON — "menus always open full screen"), `genAlwaysVisible` (default
    OFF — keep ⚡/⏸/■ in the header strip while the menu is hidden), `hdrAllViews` (default OFF — keep the header
    on top of the other `.view-overlay`s too). `body.menu-fullscreen .app-header` / `body.hdr-all-views
    .app-header` become `position:fixed; z-index:10005` (above the 10000 overlays) and the overlays get
    `padding-top: calc(var(--hdr-h) + 14px)` so nothing hides under it. (c) MENU MODE IS NOW PREF-DRIVEN:
    `syncMenuMode()` = "if the pref is on and the menu is visible → the overlay; else the inline frame";
    `applyMenuFullscreenPref(on, section)` is the single setter, `toggleMenuFullscreen()` just flips it, and
    `updateMenuFullscreenLabels()` labels the ⛶/⤡ buttons from the PREF (not from `isMenuFullscreen()`).
    `applyMenuVisible()` calls `syncMenuMode()` + `placeGenButtons()`, so ☰ Hide Menu → `body.menu-hidden` →
    the overlay closes (with the pref ON the menu has no inline form any more). The overlay's `← Back to page`
    and Esc now call `requestCloseMenuFullscreen()` = `applyMenuVisible(false)`. `openMenuFullscreen()` no longer
    calls `applyMenuVisible(true)` (that would recurse). (d) ⚡ Generate All / ⏸ Pause / ■ Stop MOVED into
    `#menuBar`: `<button class="menu-btn menu-action" id="menuGenerateBtn">⚡ Generate All</button>`,
    `#globalPauseBtn` / `#globalStopBtn` keep their ids (so `setPauseButtonEnabled`/`setStopButtonEnabled` and
    the Focus mirroring are untouched) with `class="menu-btn menu-action"` / `class="menu-btn menu-stop"`.
    `.menu-action` uses the TWO-CLASS selector `color:#fff` to beat normalize's
    `button:not([disabled]){color:inherit}`; `.menu-stop` = red fill + white text. The old `.gen-row` + the big
    `.btn-generate` are gone from `.gen-actions` (now just `#statusEl`), so
    `syncFocusControls()`/`initFocusSync()` now read `#menuGenerateBtn` instead of
    `document.querySelector('.btn-generate')` (which would have silently retargeted to the Focus view's own
    button). `body.menu-fullscreen .gen-actions { display:none }` (2026.08.16.22) was REMOVED — the status line
    stays visible in full-screen. (e) `placeGenButtons()` moves those three buttons between `#menuBar` and the new
    `#hdrGenCtr` inside `.header-btns` (hidden by default) whenever the menu is hidden and the pref is on.
    (f) Preferences gained the three toggles + a `.pref-sub` "Header & menus" sub-heading;
    `onPrefMenuFullscreenChange`/`onPrefGenAlwaysVisibleChange`/`onPrefHdrAllViewsChange` are exported on window
    (inline handlers need that). (g) The three new flags are in `buildExportData()`, honoured by
    `applyImportedSettings()`, added to `JSON_OPEN_FLAGS` (so they're editable — and applied — in the JSON
    editor), and `applyMenuFullscreenPref`/`applyGenAlwaysVisible`/`applyHdrAllViews`/`syncMenuMode`/
    `placeGenButtons`/`syncHdrHeight` are exported for debugging. VERIFIED live at 866x604 and 390x844 (dark):
    with the pref ON the app opens straight into the full-screen overlay with the header fixed above it
    (`#menuOverlay` back button at y=157 = 143px header + 14), the menu bar shows all 7 buttons, scrolling keeps
    the header at top:0, ☰ Hide Menu + the pref ON → `body.menu-hidden` with 4 panels visible, `genAlwaysVisible`
    then moves the three buttons into the header (and ResizeObserver grows `--hdr-h` 94 → 181px), and the JSON
    editor / Focus / Storyboard / manual / GitHub overlays all still open. NO window errors. The Focus view's own
    Generate/Pause/Stop row is untouched (author's explicit answer 6) — its button still reads
    "⚡ GENERATE ALL PANELS ON PAGE". VERSIONING: this is release 2026.09.23.2.
  - BATCH 2026.09.23.1 (author request, 2026-09-23 — items 2 & 6 of the 8-item request; the author's full answers
    live in the PENDING 🟢 START NOW entry): QUICK WINS. (a) The Preferences panel MOVED from the end of
    `#menuGroup-file` to the end of `#menuGroup-edit` (now `<div class="config-panel" id="preferencesPanel">`) —
    `#hidePasswordPref` + `onHidePasswordPrefChange()` are unchanged and `setupMenuCollapse()` picks the panel up
    automatically (it binds every `.menu-group .config-panel` at init). (b) `switchMenu()` now also expands a
    group when `name === 'library'` (previously only while `body.menu-fullscreen`), so clicking 📚 Library shows
    the list straight away instead of needing a second click on the Library heading; File/Edit/Help still open
    collapsed. (c) The Library's ⛶ Full Screen button STAYS — the author reversed the original request to remove
    it. (d) VERSION SCHEME CHANGED to `YYYY.MM.DD.S` (S = that day's serial release, starting at 1, NO zero
    padding) with dates in the author's Pacific time — see the top-of-file convention bullet. VERSION 2026.09.23.1.
  - BATCH 2026.08.16.24 (author request, 2026-09-23): PROJECT JSON EDITOR (Edit → 🧩 Open JSON Editor). A
    full-page overlay (`#jsonEditorOverlay`, modeled on the other `.view-overlay`s) that edits the whole project
    as one JSON document in the `buildExportData(true)` shape minus `exportedAt`. Markup: title row + actions row
    (✔ Apply / 🔄 Reload / ↩ Undo last apply / 📋 Copy + status) + find/replace row (Find / Replace with / Match
    case / Regex / 🔍 Find next / ⇄ Replace / ⇄ Replace all + status) + validation row (Syntax highlighting
    checkbox + hint + ‹ Prev / Next › + problem status) + body (`.json-gutter` line numbers, `.json-mirror`
    colour/mark layer, transparent `.json-area` textarea on top). Code: one self-contained `jsonEditor*` module
    (~870 lines) — position-aware recursive-descent parser (`jsonParse` → per-token ranges + escape maps),
    `jsonFieldClass` editable/locked classification (globals/preset/page/panel/library leaves + `promptOverride
    .pos|neg` editable; `version`, `settings.version`, `settings.currentPage`, library ids, keys and structure
    locked), validate-then-Apply (`jsonValidateNow` → `jsonWalkProblems` + `jsonCountChanges` + option checks for
    select-backed fields), Find/Replace confined to editable STRING values (`jsonEditStrings`, plain/Regex/Match
    case, Replace all confirms with the match count), a 10-deep Ctrl+Z/Ctrl+Y buffer (`JSON_UNDO_MAX`), pre-Apply
    snapshot + ↩ Undo last apply, Esc/Ctrl+F/Ctrl+S/Tab handling, mirror+gutter scroll sync, and an O(N)
    `jsonMarksHtml` sweep with `JSON_SYNTAX_MAX_CHARS` (220k) pausing colouring on huge docs. Apply replays the
    app's own render paths but deliberately does NOT wipe `panelImages`/`pageSession`/`panelPromptOverrides`
    (unlike `applyImportedSettings`). ALSO FIXED: `#newProjectOverlay` had been missing its `</div>` since an
    earlier session (its close was a stray `</div>` right before `#embeddedIssues`), so `#jsonEditorOverlay` +
    `#ghBackupOverlay` + the doc blocks were nested inside that `hidden` container — invisible no matter what
    their own JS did. And `savePanelState()` now refuses to write until `restorePanelState()` has finished
    (`panelStateRestored`), closing a hazard where a load-time JS error let the debounced save write a defaulted
    `collectPanelState()` over page 1. VERSION 2026.08.16.24.
  - BATCH 2026.08.16.23 (author bug report, 2026-09-22): DUPLICATE IN 🔍 FOCUS BROKE THE PAGE. Repro: open a
    project → 🔍 Focus a panel → ⚙ Panel → ⧉ Duplicate → `singleNavTo … injectedScript:3498:26`; then
    "← Back to page" → `NotFoundError: Node.insertBefore: Child to insert before is not a child of this node`
    (closeSingleView); after that every click on the page errored until reload. ROOT CAUSE: 🔍 Focus MOVES the
    real `#panel-card-N` into `#singleStage` and remembers `singleAnchor = card.nextElementSibling`; Duplicate
    (like Add Panel / Delete / page switch / panel-count change) calls `buildPanelGrid()`, which does
    `grid.innerHTML = ''` and rebuilds all 24 cards — the staged card + its anchor were then detached from the
    new grid, so putting the card back threw, and two elements shared the id `panel-card-N` (which is what broke
    `PERCH.reAttachSpecificDomElementEventWithRoot` on every later click). FIX (all in the single-view region):
    `buildPanelGrid()` snapshots `singleResume = singleCard ? currentSingle : 0`, calls new
    `detachSingleStage()` (clears `#singleStage`, nulls `singleCard`/`singleAnchor` — kills the duplicate ids),
    and at the END re-opens via `openSingleView(Math.min(singleResume, getPanelCount()))` (or `closeSingleView()`
    if the page has 0 panels); new `restoreSingleCardToGrid()` replaces the raw `grid.insertBefore` in
    `closeSingleView` + `singleNavTo` (inserts only if `singleAnchor.parentNode === grid`, else `singleCard.remove()`
    on a stale card); `openSingleView` is now re-entrant (restores a previously staged card if it differs);
    `onPanelCountChange` re-opens clamped when focused; `duplicatePanel` sets a status line naming the copy.
    VERIFIED LIVE (author's own "Cow in field" project state, restored afterwards): focus→duplicate keeps the
    overlay open on the rebuilt card 1 with nav 6→7 and EXACTLY 24 unique `panel-card-N` ids; nav to panel 2
    returns card 1 to the grid; close leaves the grid in order 1..24; add/delete while focused, shrink count 6→4
    while focused on 6 (clamps to 4, stage not blank), and open→close produce ZERO window errors. Also removed a
    leftover duplicated header + fragment that had been inside `embeddedIssues` since the 2026-08-15
    consolidation (799 chars; it was being shipped in the GitHub ISSUES.md). VERSION 2026.08.16.23.
  - BATCH 2026.08.16.22 (author request, 2026-09-22): FULL-SCREEN MENU HIDES THE GENERATE BAR. Request:
    "when the menu is in Full Screen mode, the Generate All Panels On Page / Pause / Stop buttons should not be
    visible." Those three buttons (`.btn-generate`, `#globalPauseBtn`, `#globalStopBtn`) plus `#statusEl` all
    live in `.gen-actions`, the last child of `#menuFrame`, so the fix is one CSS rule:
    `body.menu-fullscreen .gen-actions { display: none }` (added next to the other `body.menu-fullscreen` rules).
    The author chose the whole bar (status line included) hidden unconditionally — a running generation is
    UNAFFECTED (it keeps rendering; only the buttons/status aren't shown, so pause/stop requires leaving
    full-screen; the 🔍 Focus view still has its own `.focus-gen` row). No JS change, so the Pause/Stop disabled
    states and every existing handler are untouched. Verified live: `#menuFrame`/`.menu-scroll` now take the full
    frame height (at 866×604 side-mode, `.menu-scroll` clientHeight 177 → 536 when full-screen), `.gen-actions`
    returns on close, no `.btn-generate`/`.btn-pause-global`/`.btn-stop-global` has a non-zero rect while
    full-screen, and no overflow/overlap at 866×604 or 390×844. VERSION 2026.08.16.22; PENDING entry moved to
    ✅ DONE.
  - BATCH 2026.08.16.21 (author bug report + request, 2026-09-20): MENU HIDDEN AFTER FULL-SCREEN + FLOATING MENU
    BUTTON REMOVED. (a) BUG: "When I go to the full screen menus and then go Back to Page, the page menu is
    completely hidden." Root cause: `openMenuFullscreen()` forced the menu visible when `body.menu-hidden` and
    remembered it in `menuFullscreenRestoreHidden`, and `closeMenuFullscreen()` put the hidden state back — so
    opening the full-screen menu from a hidden menu (the header ⛶ Full Screen button sits right next to
    ☰ Show Menu) returned to a page with no menu. Fix: the flag is gone; `openMenuFullscreen` still calls
    `applyMenuVisible(true)` when hidden, but closing never re-hides. (b) The floating `#menuRevealBtn` is
    DELETED (element + its 5 CSS rules + the `rev` label block in `applyMenuVisible`); the header
    `#menuToggleBtn` (`.menu-toggle`) is now the ONLY menu-visibility control and sets its own text/title
    ("☰ Hide Menu" ↔ "☰ Show Menu") in `applyMenuVisible`. CONSEQUENCE: `body.hdr-offscreen` is now vestigial —
    nothing styles it (it was only used by `body.hdr-offscreen #menuRevealBtn { display:block }`), though
    `refreshHdrOffscreen()`/`initHeaderObserver()` still toggle it harmlessly. Also means that when the header is
    scrolled out of view you must scroll back to the top to toggle the menu (author accepted; flagged to them).
    Verified live: hidden→fullscreen→Back leaves the menu visible; toggle flips the label; no `#menuRevealBtn`
    anywhere; `#pageNav[hidden]`/`#panelsToggleBtn` unchanged. VERSION 2026.08.16.21; PENDING entry moved to
    ✅ DONE.
  - BATCH 2026.08.16.20 (author request, 2026-09-20): FULL-SCREEN MENU OVERLAY (Library + whole menu).
    Request: "add a button under Menu -> Library that will toggle showing the Library in a full-screen overlay",
    plus (author's follow-up question) whether the WHOLE menu should open full-screen for phone screen-space
    reasons — answer: yes, and the Library overlay is that same mechanism scoped to the Library tab. Single
    source of truth: `#menuOverlay` (class `.view-overlay`, markup placed just BEFORE `#analysisOverlay` so the
    Analysis overlay still paints on top of it — same 10000 z-index, DOM order breaks the tie) contains a
    `.view-top` (← Back to page + `#menuOverlayTitle`) and `#menuOverlayBody`, and `openMenuFullscreen(section)`
    MOVES the real `#menuFrame` into that body (home parent + nextSibling remembered in `menuFrameHome`;
    `closeMenuFullscreen()` inserts it back before `#canvasFrame`). Everything inside (#libObjects, the panel
    dropdowns' source, Import/Analysis, the generate bar) comes along, so the library stays live-editable with no
    duplicate ids. Entry points: header `.menu-fs-toggle` `#menuFullscreenBtn` → `toggleMenuFullscreen()` (no
    section = keep current, else File) and the Library toolbar `.btn-lib-fullscreen` `#libFullscreenBtn` →
    `toggleMenuFullscreen('library')`; both labels flip to "⤡ Exit Full Screen" via
    `updateMenuFullscreenLabels()`. Esc closes (document keydown, guarded on the overlay being open; the
    storyboard/analysis overlays still have no Esc). `switchMenu` gained two fullscreen behaviours: it refuses to
    close the active section while fullscreen (no blank overlay) and expands instead of collapses the group, and
    it refreshes the overlay title; `expandGroupPanels(group)` is the counterpart of `collapseGroupPanels`.
    `openMenuFullscreen` also forces the menu visible if `body.menu-hidden` (else the moved frame stays
    `display:none`) and restores the hidden state on close (`menuFullscreenRestoreHidden`); `syncSideMenuHeight`
    clears the inline max-height while fullscreen. CSS: `body.menu-fullscreen .menu-frame { position:static;
    width:100%; max-height:none; flex:1 1 auto; min-height:0; background:transparent; z-index:auto }`,
    `body.menu-fullscreen .menu-bar { flex-direction:row; flex-wrap:wrap }`,
    `body.menu-fullscreen .menu-btn { flex:1 1 auto; width:auto }` (overrides the side-mode vertical stack),
    `.menu-fullscreen-body`, `.btn-lib-fullscreen`, `.menu-fs-toggle`. NOTE (2026-09-20): a first cut put the
    general toggle in the `.menu-bar` as a 5th tab, which clipped the stacked side-menu tabs on short viewports
    (a 5th 45px row inside `.menu-scroll`, which is only ~177px tall at 604px viewport height with 4 tabs already
    ~176px) — moved to the header, where the menu-level controls (☰ Hide Menu, ▤ Menu: Side) already live; the
    header already wrapped to 2 rows at the editor width with or without the button, so no regression there.
    Verified live (DOM geometry + snapshots): no overlaps/overflow at 866×604, 1920×1080 and 390×844; overlay
    fills the viewport, menu scrolls internally, generate bar pinned at the bottom inside the viewport; Esc/Back/
    toggle all restore the frame to `.page-layout` before `#canvasFrame`. VERSION 2026.08.16.20; PENDING entry
    moved to ✅ DONE (recon + the author's three answers: Editable/one source of truth, toolbar placement,
    keep Import+Analysis, Esc AND a Back to page button).
  - BATCH 2026.08.16.19 (author bug report, fixed 2026-09-20): FLOATING BOTTOM BUTTONS COVERED CONTENT.
    Report: the viewport-fixed buttons at the bottom (`#panelsToggleBtn` = ▧ Hide Panels, `bottom:16px; left:16px`;
    `#pageNav`, `bottom:16px` centred, raised to `bottom:74px` in portrait; `#menuRevealBtn` = ☰/✕ Hide Menu,
    `bottom:16px; right:16px`) cover the bottom of the content — in SIDE mode the left column's `.gen-actions`
    (⚡ GENERATE ALL PANELS ON PAGE + `#statusEl`) is right behind the ▧ Hide Panels button. Fix (mostly CSS):
    (a) `body { padding-bottom: 96px }` (+ `@media (orientation: portrait) { body { padding-bottom: 156px } }`
    next to the `#pageNav` portrait rule) reserves scrollable space so the last panel card clears the buttons
    (verified: at max scroll the last card's bottom sits 96px / 156px above the viewport bottom vs the buttons'
    top at 60px / 118px). (b) `body.side-mode .menu-frame` keeps `max-height: calc(100vh - 112px)` as a
    CSS fallback, but the real value is set by the new `syncSideMenuHeight()` — it measures
    `window.innerHeight - menuFrame.offsetTop` (offsetTop includes the app-header, which is 37/82/126px tall
    depending on how many lines it wraps to, so a static calc can't be right) and reserves ~112px (adaptive,
    floored at 80px, so very short viewports keep a usable menu). Called from `applyLayoutMode`,
    `applyMenuVisible`, and `resize`/`load`/`orientationchange` listeners; clears the inline style outside side
    mode. Result: the frame's bottom (and so `.gen-actions` + `#statusEl`) always lands `reserve` px above the
    viewport bottom — verified at 1280×800, 1920×1080, 900×600, 844×390 and 390×844 (frame-bottom 112/112/112/
    80/—, all ≥ the buttons' 60/118px tops, and the ⚡/⏸/■ buttons + status pass `elementFromPoint` hit tests).
    (c) `.gen-actions` is now `flex: 0 0 auto` (was `flex: 0 1 auto; min-height: 0`) — the long-standing latent
    bug where a tall `.menu-scroll` squeezed the generate bar/status to nearly nothing now scrolls `.menu-scroll`
    instead; the status line stays visible. Verified live (DOM rect + `elementFromPoint` probes + vision on the
    menu column), and the author's stored state was restored afterwards.
  - BATCH 2026.08.16.18 (author request, implemented 2026-09-20): PANEL SEED CHIPS + HEADER GENERATE, CROSS-PAGE
    PANEL MOVES, PAGE TITLE/SUMMARY, PAGE REORDER, STORYBOARD PAGE NAV. Author answers: reuse the 22px square
    ⇤/✕ chip look; disable copy-from-previous only on Panel 1 of PAGE 1; copy the preceding panel's RAW seed box
    value (blank/random/−1 → clear); DUPLICATE the Generate button into the header; moving to an earlier page
    APPENDS, moving to a later page PREPENDS, then SWITCH to the target; if the panel was alone on its page, delete
    that page on confirm; images + all data travel; same-page reorder unchanged.
    (a) `buildPanelGrid`'s seed `.panel-imgs-sel` now holds `<span class="seed-chips">` = ⇤ `#seed-copy-prev-N`
    (`copySeedFromPrevPanel`) + ✕ `#seed-clear-N` (`clearPanelSeed`), plus `<button class="btn-reroll
    btn-header-gen">🔄 Generate</button>` immediately after the seed entry. Helpers `previousPanelSeedRaw(i)`
    (panel i−1 in the DOM, or — for i===1 — the LAST panel of the previous page key read from stored state via
    `analysisPanelCount`) and `updateSeedChipStates()` (disables Panel 1's ⇤ on page 1; called from buildPanelGrid).
    (b) `populateReorderSelects` adds an optgroup "Move to another page" (`pg-<n>` options, `disabled` + " (full)"
    when `analysisPanelCount(page) >= 24`) and "＋ New page…" (`newpage`); `onReorderSelect` dispatches to the new
    `movePanelToPage(i, target, mode)` / `movePanelToNewPage(i)`. `mode` = 'prepend' (target > src), 'append'
    (target < src) or 'replace' (brand-new page) → insertAt 1 / tCount+1 / 1 and finalCount tCount+1 / tCount+1 /
    tCount. The move shifts+renumbers the SOURCE page (`panelCountStateFor`), deletes it (on confirm) when it held
    only that panel, inserts into the TARGET page carrying `pageSession` images (moved via
    `pageSession[src] = {images: panelImages}` then rebuilt), switches to the target and reloads. ALSO: every
    `['name', …]` page-key copy list gained `'summary'`, and the export/`hasActiveProject` page-key skip lists too.
    (c) Page Setup gained `#pageSummaryInput` (`onPageSummaryInput`, `page.summary`) and the old `#pageNameInput`
    was relabelled "Page Title"; both are shown in the Storyboard (`#storyboardSummary` bar; title already in
    `#storyboardTitle`). `collectPageData`/`restorePanelState`/`defaultPageData`/`ensurePages`/reset all handle
    `summary`. (d) `updatePanelHeaderLabels()` (called at the end of buildPanelGrid AND in resetEverything) sets
    each `.panel-title` to `Page <currentPage>, Panel <i>` when `pageCount() > 1`, else `Panel <i>` — this must run
    AFTER `restorePanelState()` (which is what sets `currentPage` from storage) because buildPanelGrid's header
    HTML is built before that, which otherwise leaves the labels one page stale on load/import. (e)
    `#pageRenumberGroup` (button `#pageRenumberBtn` + hidden `#pageRenumberSel`) in Page Setup, shown only when
    ≥2 pages (`updatePageRenumberUI`, called from populatePageSel); `togglePageRenumberPicker` /
    `onPageRenumberSelect` → `renumberPageTo(fromKey, toPos)` splices the moved page into position `toPos` and
    renumbers EVERY page 1..N, remapping `pageSession` + `currentPage` (+ `analysisPage` if mapped). (f)
    `#storyboardNav` (◀ `storyboardNavDelta` + `#storyboardNavPages` + ▶) in the storyboard `.view-top`, hidden
    when there is one page; `openStoryboard` now calls `renderStoryboardPage()` (which also renders the summary bar
    and `updateStoryboardNav()`), and `switchPage` calls `refreshStoryboardIfOpen()` so the open storyboard follows
    page navigator clicks. Verified live (desktop + 390px): chips copy/clear within and across pages, cross-page
    move append/prepend/new-page/delete-source all land correctly with data, renumber reproduces the author's
    A,B,C,D,E example, storyboard nav + summary render and follow. Author's stored project state captured before
    testing and restored byte-for-byte afterwards.
  - BATCH 2026.08.16.17 (author request, implemented 2026-09-19): ANALYSIS — DEDICATED PANEL ACTION PROMPT ROW.
    (Author first asked for "the Panel Action Prompt field ... the first field for each panel", which was built as
    a field inside `analysisPanelHeader`; the author then clarified they meant a DEDICATED FIRST ROW ACROSS THE
    PANELS, so the header field was REMOVED and replaced with this.) renderAnalysis now emits an action
    row/column: `analysisActionField(pg,i,pageData)` builds a textarea `.an-act` (`data-panel=N`). When panels are
    COLUMNS (`analysisLibRows` true → `colLib` false) the tbody's FIRST row is `<tr class="an-actrow">` with
    `th.an-rowhead.an-actrow-head` = "▶ Panel Action Prompt" and one `td.an-actcell` per panel. When panels are
    ROWS (`colLib` true) the thead gets an extra `th.an-colhead.an-actcol-head` right after the corner and every
    panel row gets an `td.an-actcell` right after its rowhead — the transpose, so the prompts always stay "first"
    relative to the panels and Swap flips the row ↔ the column. Getter `analysisPanelAction(pageData,i)`; setter
    `analysisSetPanelAction(pg,i,val)` mirrors analysisSetDesc (current page → `#panel-act-N`.value +
    updatePanelSummary + clearPanelPromptOverride + schedulePanelSave; other page → collectPanelState().pages[pg]
    .action + savePanelStateShape) and, when the library has any Action items (`analysisHasActionItems`, cached in
    renderAnalysis), calls `analysisRefreshActionCells(pg,i,val)` to re-run analysisFillCell for that panel's
    Action-item `<td>`s (each matrix cell now carries `data-item-id`/`data-panel`). Two-way sync:
    `analysisSyncActionField(i,val)` updates the action box when the action changes elsewhere (analysisSetDesc
    'act', analysisAddItem Action). Auto-grow: `analysisAutoGrow` measures scrollHeight (+border, capped 126px) so
    the box fits its text; called per-`input`, plus `analysisAutoGrowAll()` at the end of renderAnalysis AND in
    openAnalysis AFTER `ov.hidden=false` (the initial render happens while the overlay is still hidden, where
    scrollHeight is 0 — hence the second call). CSS: `.analysis-table th.an-actrow-head` / `th.an-actcol-head` /
    `td.an-actcell` (background #223038) + `.an-act`, after the .an-chip-apply rules. Verified live: row shows/
    edits/saves each panel's action, swapped view shows it as a column, syncs with the cell editors + ＋ Add,
    Action-item ✅→—→✅ updates live, current-page + other-page paths OK, desktop + 390px.
  - BATCH 2026.08.16.16 (author request, implemented 2026-09-19): ANALYSIS — PROJECT DEFAULTS + PER-PANEL
    STYLE/SIZE/SEED. (a) `#analysisGlobalBar` (a `.analysis-globalbar` row inserted in #analysisOverlay between
    `.view-top` and `#analysisWrap`) shows editable project defaults: `#analysisGlobalNsfw` (→ #nsfwCheck,
    dispatched as a real 'change' so renderKeywordChips/schedulePanelSave/clearAllPromptOverrides all run),
    `#analysisGlobalStyle` (→ #presetStyle + applyPreset()), `#analysisGlobalSize` (+ #analysisGlobalSizeW/H →
    #imageSizeSel + onImageSizeChange() / #imgSizeW-H), and `#analysisGlobalSeed` (→ #seedInput +
    updatePanelSeedPlaceholders + schedulePanelSave when the selected page is the current page, else
    page.seed in collectPanelState() + savePanelStateShape). Populated by `renderAnalysisGlobalBar(pageData)`,
    called at the top of renderAnalysis. (b) `analysisPanelHeader(i, images, pageData, pg)` now appends an
    `.an-chips` row (🎨/📐/🎲) via `analysisStyleChip` / `analysisSizeChip` / `analysisSeedChip`; inherited
    values get `.an-chip-inherit` (dimmed + dashed), a seed override gets `.an-chip-seed-set`. Clicking a chip
    swaps it for an `.an-editor` (`analysisStyleEditor` / `analysisSizeEditor` / `analysisSeedEditor`); the
    style/size selects carry an `[Global]` option + all ART_STYLES / ANALYSIS_SIZES; custom size reveals W/H
    number inputs + a ✓ apply button; the seed box applies on change/blur. Setters `analysisSetPanelStyle/Size/
    Seed` mirror `analysisSetDesc`: current page writes the DOM (#panel-style-N, #panel-size-N+W/H,
    #panel-seed-N) then runs the existing onPanelStyleChange/onPanelSizeChange/schedulePanelSave; another page
    edits `collectPanelState().pages[pg]` + savePanelStateShape. renderAnalysis now preserves #analysisWrap
    scrollTop/Left across its rebuild. New window exports: analysisGlobalNsfwChanged / analysisGlobalStyleChanged
    / analysisGlobalSizeChanged / analysisGlobalSizeCustomChanged / analysisGlobalSeedChanged. CSS: .analysis-
    globalbar / .agb-* + .an-chips / .an-chip* / .an-editor rules after .an-empty. NOTE: the header seed is
    per-PAGE in this app (File → Page Setup "Seed" → page.seed), so it reads/writes the page selected in the
    Analysis page selector. Verified live: all four header controls round-trip to the real settings; per-panel
    style/preset-size/custom-size/seed edit & persist on the current page AND a second page; desktop + 390px OK.
    ALSO in this batch: `pushGitHubFile()` GET now uses `cache:'no-store'` + a one-shot 409 re-read/retry, fixing
    repeated `PUT 409 … does not match <sha>` backup failures caused by GitHub's cacheable contents GET returning
    a stale SHA right after a previous push (was pushing 2/7; now ✅ 7/7).
  - BATCH 2026.08.16.15 (author request, implemented 2026-09-19 — the "then Analysis" half): LIBRARY →
    ANALYSIS. New 📊 Analysis button in the Library toolbar (`.btn-lib-analysis`) → `openAnalysis()` renders the
    full-page `#analysisOverlay` (class `.view-overlay`, top-level — inserted just before #libImportOverlay so it
    is NOT inside the unclosed #newProjectOverlay). It is a table `#analysisWrap > table.analysis-table` with a
    `position:sticky` first ROW (thead th, top:0) and first COLUMN (`.an-rowhead`, left:0) plus a sticky corner.
    Module state: `analysisPage`, `analysisLibRows` (true = library items are ROWS / panels are COLUMNS, the
    default), `analysisEditGlobal`. `renderAnalysis()` reads `collectPanelState()` (so the CURRENT page reflects
    live DOM) + `analysisPageImages(pg)` (panelImages for the current page, else `pageSession[pg].images`) +
    `loadLibraryObjects()`, and builds headers as either a lib item (`analysisLibHeader` = name + type + global
    desc; becomes a textarea when analysisEditGlobal) or a panel thumbnail (`analysisPanelHeader`,
    representative = images[i][0]). Cells (`analysisFillCell`): a Character item matches every char slot whose
    select === `lib:char:<id>` and shows one editable field PER SLOT (`analysisSlot`, label #1/#2/#3) bound to
    that slot's extra; a Location matches `lib:loc:<id>` → its locExtra; an Action matches when the panel action
    text exactly equals the item's desc. Used cells get ✅ + `.an-cell-used`; a cell whose target slot is FREE
    shows a "＋ Add" (`.an-add` → `analysisAddItem`); otherwise empty/na. Edits go through
    `analysisSetDesc(pg,i,kind,s,val)` — for the current page it writes the DOM field (panel-char-extra-N-S /
    panel-loc-extra-N / panel-act-N) then updatePanelSummary + clearPanelPromptOverride + schedulePanelSave; for
    another page it edits `collectPanelState().pages[pg]` and savePanelStateShape (which preserves the current
    page's DOM-derived state). `analysisAddItem` fills the first free char slot / an empty loc / an empty action.
    `analysisSetGlobalDesc` writes libObjects. Controls: analysisSetPage / analysisSwap / analysisToggleEditDesc;
    exported on window (openAnalysis/closeAnalysis/analysisSwap/analysisToggleEditDesc/analysisSetPage). CSS:
    .analysis-* + .an-* rules. Verified live: 2×4 matrix on the Cow sample (✅ panel 1, ＋ panels 2-4, thumbnails
    + placeholders), per-slot desc edit persisted, ＋ added the cow to panel 2 slot 1, global-desc edit updated
    libObjects, swap transposed 2×5 ↔ 4×3, page selector listed/browsed 2 pages, sticky first row/column held
    (top 54 / left 17) while scrolling both axes, desktop + 390px OK (toolbar wraps, first column stays). All
    test edits to the sample were reverted.
  - BATCH 2026.08.16.14 (author request, implemented 2026-09-19): LIBRARY → IMPORT. The 📚 Library menu gained an
    "⬆ Import…" toolbar (.lib-toolbar, green .btn-lib-import) + a hidden `#libImportInput` (type=file, multiple,
    accept .json/.zip) → `libraryImportFiles(ev)` → `importLibraryFromFiles(files)`. Each file is parsed by
    `readProjectFileData()` (zip → unzipEntries() → the `comic-generator-settings.json` entry; json → text) and
    its items extracted by `extractLibraryItems()` (v2 `libObjects`, or legacy v1 `charLibrary`/`locLibrary`/
    `actLibrary`; `normalizeLibType()` infers type from the id prefix when unlabeled). Candidates are classified
    against the CURRENT store: exact name+desc match → 'identical' (auto-skipped), same name + diff desc →
    'conflict', else 'new'. `renderLibImportModal()` shows `#libImportOverlay` (a centered .lib-import-box — it
    is inserted BEFORE the unclosed #newProjectOverlay so it is NOT nested inside it) with groups Characters/
    Locations/Actions, per-row editable name + desc, and a status tag; conflicts get a `.li-resolve` select
    (append [default] / overwrite / rename). `confirmLibraryImport()` writes to `comicGen.libObjects` with fresh
    ids via `newLibraryId()`, then renderLibrary()+updatePanelSelects(); `cancelLibraryImport()` closes + resets
    the hint. Exported on window: libraryImportFiles/libImportSelectAll/confirmLibraryImport/cancelLibraryImport.
    ACTION SUPPORT: migrateLibObjects() no longer prunes Action items (filter now keeps Character/Location/
    Action), addLibraryEntryByType() handles Action, and renderLibrary() shows a 🎬 Actions bucket when any
    Action item exists (so imported actions aren't invisible / pruned on boot). CSS: .lib-toolbar / .lib-import-*
    rules after .btn-del-lib, PLUS a @media (max-width:560px) stacked-row fallback (the default 4-col grid
    overflowed at 390px). Verified live with the sample "Cow in field" project (real .zip + a legacy v1 .json
    merged in one pass: cow/pasture identical-skipped, horse/barn new), synthetic conflict tested for both
    'overwrite' (2 added, 1 updated, 1 skipped) and the identical path; Actions bucket appears; desktop + 390px
    visually checked. NOTE: nothing but comicGen.libObjects is ever written (panels/settings/images untouched).
  - BATCH 2026.08.16.13 (author request "Is it possible to have each panel display the seed it uses? I'd like
    to have it placed in the panel header area... I'd also like to make this user-editable, so if the user
    changes it here it uses that seed for that panel.", implemented 2026-09-18): PER-PANEL SEED MOVED INTO THE
    PANEL HEADER + PIN-ON-GENERATION. The panel-seed-N input was removed from the ⚙ Panel accordion
    (.panel-acc-stack) and added to the panel header row (.panel-header-row) in buildPanelGrid (~line 4353),
    as a "Seed:" label + input.panel-seed-input placed just before the ⇅ Move chip. Same id panel-seed-N, so
    the existing save/restore/reset plumbing and getPanelSeed are untouched. New CSS
    `.panel-header-row input.panel-seed-input { width:104px; min-width:84px; margin:0; padding:6px 8px;
    font-size:.85rem; min-height:auto; line-height:normal; text-align:center }` (~line 1199); the older
    `.panel-card input[id^="panel-seed-"]` 1-line rule still applies. The box now SHOWS THE RESOLVED SEED:
    new updatePanelSeedPlaceholders() sets each EMPTY box's placeholder to String(global + (i−1)) when a
    global seed is set, else "random" (a box with a typed value gets placeholder ""), and is called after
    restorePanelState()/updatePanelVisibility() in buildPanelGrid, on #seedInput 'input', and at the end of
    handleGridInput for panel-seed-N. New pinPanelSeedForRun(i) (right after getPanelSeed ~line 5085) resolves
    the seed for a run: panel override > global+(i−1); otherwise it picks ONE random integer 0..1e9, WRITES
    it into #panel-seed-N, calls schedulePanelSave() + updatePanelSeedPlaceholders(), and returns it — so the
    panel now HOLDS that seed and every later regeneration is reproducible until the user edits/clears the box
    (behavior change: unseeded panels used to re-randomize on every run). renderPanelSlot now does
    `const seed = pinPanelSeedForRun(i);` (was getPanelSeed(i).seed), still `if (seed !== -1) opts.seed = seed
    + (k - 1);`. getPanelSeed is retained but no longer used by render. Enter in the header seed box still
    triggers generateSinglePanel(i). Verified live with a mocked generateImage: a random seed is pinned on the
    first run and reused on the next; global 777 → panel 1 uses 777 WITHOUT writing the box; override 55
    respected; placeholders blank→"random" and global 500→panel1 "500"/panel3 "502". Visual pass (snapshot +
    vision) at desktop and 390px: Seed field visible in the header, wrapped cleanly, no overflow/overlap.
  - BATCH 2026.08.16.12 (bug fix, 2026-08-22): author reported "File -> New is not clearing the
    library." ROOT CAUSE: doNewProject() → resetEverything(true) only wipes comicGen.libObjects when the
    Edit→Reset "Also permanently delete my saved library objects" checkbox (resetDelLibCheck) is checked — and
    that box defaults to unchecked and resetEverything sets it back to false at the end, so the New Project
    path NEVER cleared the library. FIX: doNewProject() now explicitly does
    `localStorage.removeItem('comicGen.libObjects'); renderLibrary();` right after resetEverything(true), so File→
    New Project always starts fully clean. The Edit→Reset checkbox path is unchanged (still honors resetDelLibCheck).
    Note: both this and resetEverything call renderLibrary() — renderLibrary is idempotent (rebuilds #libObjects
    from CURRENT store), no double-render issue since the store is already emptied.
  - BATCH 2026.08.16.11 (author request, implemented 2026-08-17): PANEL LIBRARY PERSISTENCE REMOVED —
    the ⟳ persist checkboxes (char slots `.persist-check[data-s]`, `#panel-loc-persist-N`,
    `#panel-act-persist-N`), the auto-propagation to later panels (propagateSlot/propagateLoc/propagateAct,
    isPersisted/isLocPersisted/isActPersisted, syncState `'i-s'`/`'i-loc'`/`'i-act'` chains, stillInSync
    divergence logic) and the cross-page carry (carryNext, bufferCarry, nextPageNumber, panel1DomValue,
    setPanel1Value, panel1IsPristine, applyCarryToPanel1) are ALL GONE. Replaced by a per-row ⇤ button
    (`copyFromPrevPanel(i, kind, s)`, exported on window; `.btn-copy-prev`, 22px blue, disabled on panel 1)
    that copies the corresponding item (sel + extra / action text) from the panel DIRECTLY BEFORE (i−1) via
    the previous panel's DOM controls, then clears the prompt override + updates summary + saves. Layout:
    `.po-row` grid changed `1fr 1.8fr 44px 32px` → `1fr 1.8fr 28px 32px`. Removed persisted flags
    `chars[].persist`/`locPersist`/`actPersist` (collectPageData no longer writes them; restorePanelState /
    renderPanelObjects no longer read them; old saved data keeps them inert until the next save drops
    them — verified the author's page-1 content survived). ALSO removed: `let syncState`, `let carryNext`,
    ensurePanelObjectRow, clearChainFor (+ its calls in deletePanelChar/Loc/Act), attachSlotListeners (+ its
    call in buildPanelGrid), the syncState remap blocks in remapPanelSession/remapPanelSessionForDuplicate,
    `pageSession[N] = {images, sync}` → `{images}`, the syncState/carryNext clears in applyImportedSettings
    & reset, the `delete carryNext[n]` in deletePage, the isPersisted/propagate calls in handleGridInput.
    NOTE for future sessions: the top-of-file dev-notes and embeddedAI-NOTES §3/§4 still contain HISTORICAL
    descriptions of the old ⟳ system in older BATCH entries — read those only for context, the current model
    has no chains/carry. Verified live: 120 ⇤ buttons (24 panels × 5 rows), 0 `.persist-check` left, panel-1
    buttons disabled, real click copies char/loc/act values from panel i−1 (incl. modifier), saves + reloads
    clean, row layout aligned (⇤/✕ identical x across char/loc/act rows), author's project data intact.
  - BATCH 2026.08.16.10 (bug fix, 2026-08-16): author retest found ⏸ Pause "stopped the panel but the run
    continued". ROOT CAUSE: the real text-to-image-plugin promise has NO `.stop()` method (grep "stop"
    imports/text-to-image-plugin/main.pjs → zero matches). Every stop/pause path guards with
    `typeof pending.stop === 'function'`, which silently skips on the real plugin, so the in-flight image
    kept generating (10-40s), its result was shown anyway, and the loop only reached its break check after
    that panel finished. Earlier "verified" tests were invalid because their mocks HAD .stop(). FIX: per-run
    abort signal — module-level `let runSignal = null;`; `armRunSignal()` creates `{fired, fire(), p}` and is
    called at the start of each generateComicPage run, `runSignal = null` in its finally (so standalone
    per-panel/per-slot generations outside a run don't race); `withRunSignal(promise)` = `Promise.race([
    promise, runSignal.p])` when armed, else the plain promise; renderPanelSlot awaits
    `withRunSignal(withTimeout(pending, GENERATION_TIMEOUT_MS))`. pauseGenerations, haltGenerations, and the
    visibilitychange handler fire the signal (resolve 'abort' → renderPanelSlot throws its 'no image'
    error → catch sees pausedManually/stopRequested/pausedByVisibility → 'cleared' → loop breaks INSTANTLY).
    The orphaned plugin promise is discarded: the race already settled, so its later resolve/reject is
    inert, and race-attached handlers prevent unhandledrejections. GOTCHA (cost a debug cycle): do NOT write
    `runSignal = { p: new Promise(res => { runSignal.fire = ... }) }` — the object literal evaluates
    `new Promise(...)` BEFORE the assignment completes, so the executor reads runSignal=null → TypeError →
    promise rejects immediately → every race settles instantly → every panel fails with "can't access
    property 'fire', runSignal is null". Build the object first, attach p after (see armRunSignal). Verified
    live with a NO-.stop mock (the realistic case): pause mid-panel-1-slot-2 → mock count FREEZES, status
    "Paused — press ⚡ ... from panel 1" immediately, box .paused, no image lands; resume regenerates from
    panel 1; halt → instant "Stopped — ... to generate." then ⚡ restarts fresh; full run → "Done: generated
    8 panels."; standalone panel 🔄 Generate works (runSignal null). Caveat: the abandoned in-flight request
    still completes server-side (unavoidable without plugin support) but its result is discarded.
  - BATCH 2026.08.16.9 (author request "Is there a way we can pause a run rather than disabling it, and be
    able to continue it?", implemented 2026-08-16): PAUSE/RESUME. New state: `let pausedManually = false;`
    and `let resumePanel = null;` (near the other generation flags, ~line 3401). New sidebar button
    `#globalPauseBtn` (⏸ Pause, class .btn-pause-global, onclick pauseGenerations) in the .gen-row between
    ⚡ and ■ Stop; mirrored `#focusPauseBtn` in the Focus .focus-gen row (added to the existing
    syncFocusControls/initFocusSync mirror list). CSS .btn-pause-global: amber (#ffb84d, color #111, hover
    #ffa726, disabled opacity .45). `setPauseButtonEnabled(active)` toggles #globalPauseBtn.disabled;
    `syncStopButton()` now also calls it (pause enabled ⟺ generateAllRunning). `pauseGenerations()`:
    guard `if (!generateAllRunning) return`, set pausedManually=true, stop all inFlightGen pending via
    `.stop()`, mark boxes .paused, clear inFlightGen, syncStopButton — mirrors halt/stopAll. haltGenerations
    and stopAllGenerations both now set `resumePanel = null;` first. generateComicPage's `from` logic:
    explicit `startPanel` (Generate All From Here) → `from = startPanel; resumePanel = null;`; else a valid
    `resumePanel` → `from = resumePanel; resumePanel = null;`; else 1. It also resets pausedManually=false
    and calls setPauseButtonEnabled(true) at run start. The loop's break block is now
    `if (stopRequested || pausedByVisibility || pausedManually)`: Stop → resumePanel=null + "Stopped —
    ... to generate."; else (paused) → `resumePanel = (result === 'cleared') ? i : i + 1` (clamped to
    totalPanels) + "Paused — press ⚡ ... to continue from panel N." (pausedManually) / "Page N: paused —
    tab went to background — ... continue from panel M." (pausedByVisibility). Done-block now also requires
    `!pausedManually && !pausedByVisibility`. renderPanelSlot's catch and generateSinglePanel's cleared
    check both added `pausedManually ||` to their return-'cleared' conditions. window.pauseGenerations
    exported. VERIFICATION NOTE (important for future sessions): the Stop path looked BROKEN during testing
    ("run stuck after halt, ⚡ does nothing") but it was a TEST ARTIFACT — evals were run WITHOUT a reload
    so a stale mock + in-flight run from an earlier eval left generateAllRunning/inFlightGen polluted.
    withTimeout (Promise.race + finally) DOES propagate pending.stop() rejections correctly, and both the
    rejecting-mock and the real plugin (stop → resolves falsy → 'no image' throw → catch) break the loop
    identically. Always browser_refresh between independent test scenarios. Verified live with a slowed
    mock ({dataUrl} result, 2000ms, p.stop = reject): pause mid-panel-3 → status "Paused ... from panel 3",
    resume regenerated ONLY from 3 ("generated 1, skipped 1", panel 1 image kept), Stop mid-panel-1 → loop
    breaks ("Stopped ... to generate.", buttons reset) then ⚡ restarts fresh from 1 (mc 1→2), Focus ⏸
    mirrored both buttons+status through run/pause/resume, Generate All From Here (3) while paused cleared
    resumePanel (status "(3/8)"). NOTE: page 1 panels 1 and 8 have imgCount "4" (4 mock calls each); the
    test-created page 2 was deleted via deletePage(true) and author data verified intact (single page
    custom/8, 768x768, nsfw, lib char c-blonde, "Sample NSFW Comic").
  - BATCH 2026.08.16.8 (author request, implemented 2026-08-16): ⚡ GENERATE ALL PANELS ON PAGE button added
    to the 🔍 Focus (single-panel) overlay (#singleOverlay). New `.focus-gen` row under `.view-top`:
    `#focusGenerateBtn` (class .btn-generate, onclick generateComicPage — SAME function/behavior, works on
    the focused page since generateSinglePanel reads cards by getElementById regardless of their DOM
    location), `#focusStopBtn` (class .btn-stop-global, onclick haltGenerations), and `#focusStatusEl`
    (class .status). CSS: `.focus-gen` flex wrap row; `.focus-gen .btn-generate { width:auto; color:#000 }`
    (needed because the platform `button:not([disabled]){color:inherit}` override would otherwise render
    white-on-yellow). State mirroring WITHOUT touching generateComicPage internals: `syncFocusControls()`
    (exported on window) copies #globalStopBtn.disabled → #focusStopBtn.disabled, sidebar
    .btn-generate.disabled → #focusGenerateBtn.disabled, and #statusEl.textContent → #focusStatusEl;
    `initFocusSync()` (called in app init after buildPanelGrid) sets MutationObservers on the three source
    elements (attributeFilter ['disabled'] + characterData/childList). NOTE: querySelector('.btn-generate')
    still returns the SIDEBAR button (first in document order), so generateComicPage's genBtn handling is
    unchanged; the focus button follows via the observer. Verified live with a slowed mock: during the run
    BOTH ⚡ buttons disabled + both ■ Stop enabled (14/14 samples), status mirrored to the same text, then
    all reset after "Done". Visual pass (html2canvas + vision): black-on-yellow one-line label in the
    overlay, Stop fully visible, blue status below, no overlap. Test page deleted; author's project verified
    intact (single page custom/8, 768x768, lib char c-blonde; no stray pages this time).
  - BATCH 2026.08.16.7 (author request, implemented 2026-08-16): ⚡ button relabeled to "GENERATE ALL PANELS
    ON PAGE" — it generates only the current page (unchanged behavior; generateComicPage never crossed pages,
    but the label + stop-tooltip + 3 status strings + embedded help + src/user-manual.html all said otherwise).
    Per-page panel counts verified working (each page stores its own panelCountSel/panelCountCustom, restored
    by restorePanelState on switch; ⚡ uses getPanelCount of the current page) — only the Page Setup label
    changed to "Number of Panels on This Page (1–24) — each page remembers its own:". CSS/layout fixes for the
    longer label: `.gen-row .btn-generate` now `font-size:1.05rem; padding:10px; line-height:1.25;
    color:#000` with a `<br>` in the button text so the label is two clean lines; `.btn-stop-global` shrunk
    to `0.9rem/10px 14px`; `.gen-row` gets `padding-right:6px` so ■ Stop no longer sits flush/clipped at the
    sidebar edge. IMPORTANT (pre-existing platform quirk found while testing): the platform injects
    `button:not([disabled]) { color: inherit }` (specificity 0,1,1) which silently OVERRIDES many single-class
    button color rules — e.g. `.btn-generate`'s `color:#000` computed to white (white-on-yellow!), `.btn-dup`'s
    `#111` computed white, `.btn-add-lib`'s `#fff` computed #111. Fixed for the ⚡ button via the higher-
    specificity `.gen-row .btn-generate { color:#000 }`. Other affected buttons (.btn-dup dark text, etc.) are
    STILL miscolored — a future task should audit all single-class button colors and bump their specificity
    (or use :where-guard selectors). TESTING INCIDENT: 7 stray empty addPage pages (3-9) appeared in the
    author's localStorage during testing with no matching addPage calls in the evals — cause unknown (suspected
    eval re-execution on the reload triggered by file edits). Always dump pageSel/storedPages before and after
    testing, and delete stray pages. Author data was verified intact (single page, custom/8, 768x768,
    lib char c-blonde). Verified live: new label renders black-on-yellow on two lines, ■ Stop fully inside the
    sidebar (6px margin), Generate All On Page generates exactly the current page's panels with the current
    page's count (custom/2 page → "generated 1, skipped 1").
  - BATCH 2026.08.16.6 (author request, implemented 2026-08-16): multi-page fixes + page navigator.
    (1) `clearChainFor` now takes the panel index and uses `syncState[i + suffix]` (was
    `syncState[currentPage + suffix]` — a PAGE number used as the panel key). Deleting a char/loc/act (✕)
    mid-chain no longer permanently breaks the ⟳ chain at that panel (verified: after deletePanelChar(5,1)
    a re-propagate now re-fills panel 5; before, it stayed 'none') nor wrongly clears an unrelated panel's
    chain entry. (2) `applyCarryToPanel1` now only lands a cross-page carry when panel 1 of the next page
    is pristine — matches the last-applied carry, or already holds the same value, or is untouched
    (sel 'none'/'' with empty extra; act ''). A deliberately DIFFERENT value set there is respected and
    never overwritten (verified: 'sidekick'/'rooftop' survived the carry). New `panel1IsPristine(key,val,
    applied)` helper. The one-page-forward carry + creator decision point is UNCHANGED (toggle ⟳ on the
    landed panel 1 to continue the chain → propagates that page + re-carries one page further; leave it to
    stop — both verified). (3) Page navigator: `#pageNav` (fixed, bottom-center, green-bordered bar:
    ◀ Prev + numbered `.page-nav-page` buttons with `.active` state + ▶ Next) shows only when
    `pageCount() > 1`. `updatePageNav()` (called from `populatePageSel`, so it follows switch/add/delete/
    rename) + `pageNavDelta(delta)`; both exported on window. CSS: default `bottom:16px` (landscape, same
    row as the floating buttons), `@media (orientation: portrait) { bottom:74px }` so it clears the fixed
    ▧ Hide Panels (#panelsToggleBtn, bottom-left 16px) and ☰ Menu (#menuRevealBtn, bottom-right) buttons.
    z-index 1001 (above both floating buttons). Verified live: hidden with 1 page, visible with 4, correct
    active state, ◀/▶ wrap, bottom-center at 870×458 (centerOffset 0). Test pages deleted + author data
    restored afterwards.
  - BATCH 2026.08.16.5 (author request, implemented 2026-08-16): Library menu can now add new entries
    directly. Each bucket header in renderLibrary is a `.lib-bucket-row` (flex, space-between): the
    `.lib-bucket` h3 + a 22×22 green (#2ea043) square `.btn-add-bucket` with "+" and
    title "Add a new Character/Location". Clicking calls `addLibraryEntryByType(type)` (exported on
    window) — two native prompts (name, then the reusable library description) — saves to libObjects,
    re-renders the library + all panel dropdowns. Library-only entries have no panel, so no separate
    panel-description prompt (unlike the panels' 3-prompt newPanelLibraryEntry flow). Library hint text
    updated to mention the + buttons. Verified live: both buttons (green, correct titles), Character
    creation lands in the right bucket, panel selects pick it up. NOTE: html2canvas cannot capture the
    Library menu area in this environment (returns empty/0×0 — the menu-group is display:none until
    opened and html2canvas 1.4.1 struggles with it) — verify the library menu via DOM queries instead.
  - BATCH 2026.08.16.4 (author request, implemented 2026-08-16): the Panel Action Prompt textarea now spans
    the full combined width of a row's Identity dropdown + Freeform Description columns. In the 4-column
    .po-row grid the action row previously left the 1.8fr description column empty (and its ⟳/✕ auto-placed
    into the wrong columns). The textarea gets class `pl-act-wide` (CSS `.po-row .po-desc.pl-act-wide {
    grid-column: 1 / 3; }`), so it covers columns 1-2 and ⟳/✕ drop into columns 3-4, aligned with the other
    rows. Verified by bounding-rect measurement (left/right edges match the dropdown/description edges
    exactly; ⟳/✕ x-positions identical across rows).
  - BATCH 2026.08.16.3 (author request — REVERT of the Panel Objects era, implemented 2026-08-16):
    Panels went back to the pre-08.15.1 fixed-slot layout, kept as ONE 📖 Panel Library accordion:
    renderPanelObjects now always renders 3 char slots + loc slot + a freeform Panel Action Prompt box
    (sub-headers .pl-subhead; .po-row grid dropped the Type column). NO type dropdowns, NO add-object
    menu, NO extras, NO action library — "an Action is always only a freeform prompt entry". Char/loc
    creation = newPanelLibraryEntry's THREE prompts (name / reusable library desc / separate panel desc
    that fills the placed slot's own description field), triggered by the "＋ New Character/Location…"
    options in the slot dropdowns via handleGridInput (pre-08.15.1 behavior). 📚 Library menu now renders
    two buckets (👤 Characters / 📍 Locations, .lib-bucket headers, name+desc+🗑 rows, no Type select, no
    "+ Add Library Object" button). Removed functions: addLibraryObject, libTypeOptions, saveLibTypes,
    typeOptionsHtml, actionOptionsHtml, extraIdentityOptions, readDomExtras, queueExtra (extraQueue),
    emptyCharSlot, extraRowHtml, addBarHtml, createLibraryEntry, routeObject, onPanelAddSelect,
    onPanelAddIdChange, resetAddBar, panelAddPick, onPanelObjTypeChange, onPanelExtraTypeChange,
    deletePanelExtra, onActLibChange, newActLibraryEntry, and the LIB_TYPES_BASE const. ensurePanelObjectRow
    is now a no-op. migrateLibObjects prunes libObjects to Character/Location + deletes comicGen.libTypes;
    migratePanelExtras(page) folds any legacy stored page[i].extras into empty main slots at restore
    (author had none). collectPageData/buildPanelPrompt/updatePanelSummary drop extras. Tooltips (po-sel/
    po-desc classes on the slot dropdowns/descs) unchanged and verified. NOTE: AI-NOTES §5 (panel card
    DOM) and the BATCH 2026.08.15.1/16.1/16.2 entries describe the SUPERSEDED Panel Objects/add-bar/
    action-library — historical only.
  - BATCH 2026.08.16.2 (bugfix for 2026.08.16.1, author report: "the Add button ... Action is not added"):
    TWO fixes. (1) onPanelAddSelect: switching the add menu away from "＋ New Action…" left stale freeform
    state (dataset.mode='new-action', identity dropdown hidden, button still "Ok") — panelAddPick then
    early-returned on an empty description → nothing added. Added resetPicker() (clears dataset.mode, shows
    #panel-add-id-N, label "Add", default placeholder) run on EVERY menu change incl. "— add object —".
    (2) routeObject Action branch ignored `sel` and set the slot to the freeform desc (empty for library
    picks) — now falls back to the library entry's .desc when the freeform text is blank. Verified live:
    freeform→pick:Action switch now clean, library pick + prefill works, freeform slot/extra-row works,
    reset works. NOTE for future sessions: browser_eval element refs go stale across renderPanelObjects'
    innerHTML rebuilds — re-query after renders.
  - BATCH 2026.08.16.1 (author request, implemented 2026-08-16): PANEL MENU — adding an Action no longer
    needs a name. Selecting "Action" (via the add-bar "＋ New Action…" option or the picker's
    pick:Action → "＋ New Action…", and the picker "＋" __new_act__) puts the add bar in freeform mode:
    description textarea placeholder "Freeform action description — goes straight into the panel prompt",
    name/id row hidden, Add button relabels to "Ok", Enter (no Shift) confirms. panelAddPick handles
    mode==='new-action': non-empty trimmed desc → routeObject(i,'Action','',txt) → panel action slot +
    summary; extra rows when the slot is occupied. No library entry created. resetAddBar restores the
    default mode. Verified live: both entry points, empty-slot vs extra-row behavior, Enter, library untouched.
  - BATCH 2026-08-15.1 (author greenlit both queued items at once: "Go ahead and make it happen!"):
  - BATCH 2026-08-15.5 (greenlit same day, "Go ahead and greenlight these..."). Two items:
    (1) PANEL OBJECTS TOOLTIPS — hovering (or long-pressing on touch) a Panel Objects Identity dropdown
    (.po-sel) or Freeform Description (.po-desc) shows the full contents in a floating tooltip. Implemented
    as a single #poTooltip div appended to body + DOCUMENT-LEVEL delegated mouseover/touchstart listeners
    (350ms hover / 500ms long-press delay, viewport-clamped, hidden on scroll/touchmove, pointer-events:none).
    Delegated on document so renderPanelObjects' innerHTML rebuilds can't detach it. Blank/"— none —" values
    show no tooltip. (2) PER-PANEL IMAGE SIZE — each panel header (panel-header-row) got a Size dropdown
    `#panel-size-N` right after the Style select: [Default (Global)] + 512x512 / 768x768 / 1024x1024 /
    1920x1080 / 1080x1920 / custom, plus `#panel-size-custom-N` span with `#panel-size-w-N` / `#panel-size-h-N`
    (toggle via onPanelSizeChange(i), exported). Generation: NEW `getPanelImageSize(i)` — returns the panel
    override, or Custom (clamped 64-1920x64-1080; blank custom fields fall back to global), else the global
    getImageSize() — and generateSinglePanel + generateSinglePanelSlot now call `getPanelImageSize(i)` (covers
    Generate / single-slot / Generate All From Here). Persistence: collectPageData writes page[i].sizeSel/sizeW/
    sizeH; restorePanelState reads them + toggles the custom span; Edit → Reset to Defaults clears them;
    Duplicate copies them for free (deep-copies page[i]). panelState stays version 2 (optional fields,
    back-compatible). Verified live: override/custom/empty-custom-fallback logic, save→localStorage→restore-on-
    reload round trip, both tooltip types.
  - BATCH 2026-08-15.3 (dialog-visibility fix): the author saw the Backup dialog's console logs but no dialog
    (Firefox + docked devtools). Root cause never reproduced in the editor preview (overlay rendered fine there),
    so openGhBackup() was hardened to survive every plausible cause: inline `!important` styles pin it
    (position:fixed; inset/width/height 100%; z-index 2147483647), it's appended to the END of <body>, a
    transform/filter/perspective/contain ancestor scan switches it to a viewport-pinned absolute fallback, body
    scroll is locked, a 2s guard re-asserts visibility, and the .password-box is scroll-safe (margin:auto +
    max-height:100% + internal overflow) instead of clipped in short viewports. It logs
    `[gh] opened — …rect… viewport… fixed-breaker…`; if the author ever reports invisible again, that console
    line tells us whether the rect was 0-sized/off-screen (→ absolute fallback should've kicked in) or sane
    (→ the editor chrome/extension above the iframe is the culprit, out of our reach). FOLLOW-UP 2026.08.15.4:
    the author reported Close doing nothing — the inline display:flex !important beat perchance's
    [hidden]{display:none !important}, so hidden=true no longer hid the overlay. ghClose() now forces
    display:none !important and sets _ghClosed so the 2s guard doesn't re-show it. Verified open→close→reopen.
  - BATCH 2026-08-15.2 (author greenlit Tier 3): "Backup to GitHub" — File → Backup Project → "⬆ Backup to GitHub…"
    opens #ghBackupOverlay (owner/repo/token inputs + 💾 Save settings / 🔍 Test / ⬆ Push). Token stored ONLY in the
    browser (localStorage comicGen.githubOwner/Repo/Token/LastBackup; NEVER in panelState/exports/shipped code).
    ghPush() assembles the file set: main.pjs ← fetch of
    https://perchance.org/api/getGeneratorsAndDependencies?generatorNames=<window.generatorName> (CORS-open; returns
    the SAVED code — the dialog warns to press Save first); index.html ← fetch(location.href) = the LIVE page (raw
    index.html is NOT fetchable at runtime; the live page is a self-contained archive incl. all embedded docs —
    ~1.4MB in the editor, smaller in production); src/user-manual.html ← relative fetch (shipped src files fetch
    fine; src/changelog.js is dead/not shipped → excluded). It used to also push the four embedded docs
    (#embeddedPENDING / #embeddedAINOTES / #embeddedChangelog / #embeddedIssues .textContent); that docMap
    was REMOVED in 2026.09.23.8 — no such blocks exist now, and pushing the stamp would clobber the real
    CHANGELOG.md. Push = GitHub Contents API (PUT /repos/{owner}/{repo}/contents/{path}, base64 via
    btoa(unescape(encodeURIComponent(s))), GET-first to resolve sha, no branch = default branch). Commit message
    "backup <latest-ver> — <ISO timestamp>" parsed from #embeddedVersion (as of 2026.09.23.8). GitHub API is CORS-open from the page
    (verified); the singular perchance getGenerator endpoint is CORS-blocked — use getGeneratorsAndDependencies.
    Verified live: dialog open/close, settings round-trip, auth-error handling.
    SECURITY FOLLOW-UP (author question "does public mean anyone can commit?"): NO — the token lives only in the
    author's browser localStorage and never ships, so visitors can't push (localStorage is per-browser). At the
    author's request the ⬆ Push button was REMOVED from the public dialog — ghPush stays exported and is run only
    by the AI via browser_eval on request ("back it up to GitHub"), reading the token from localStorage without
    echoing it. ghPush tolerates the missing #ghPushBtn.
    (1) EXPORT PROTECTION GATING — `buildExportData(includeProtection)`: the JSON-only paths pass `false`
    (exportSettings, settingsBlob → used by saveSettings/saveSettingsAs/confirmImportSave/confirmNewProjectSave)
    so `protectSlots` is STRIPPED from every panel entry of the exported `settings` (image protection is NOT
    saved in .json-only backups); exportZip passes `true` so .zip (JSON+images) backups KEEP protectSlots.
    Import is unchanged (applyImportedSettings nukes all protections, then restorePanelState applies whatever
    came in) — so a .json-only round-trip loses protection, a .zip round-trip keeps it. Verified live.
    (2) PANEL OBJECTS CONSOLIDATION — each panel's 📖 Panel Library accordion (with its three nested 👤
    Characters / 📍 Location / 🎬 Action sub-accordions) is REPLACED by ONE 🧩 Panel Objects accordion:
    a ⚠️ warning (too many objects may confuse the image AI; no limit enforced), a unified row list
    (`#panel-objects-N`, rendered by `renderPanelObjects(i, mode, force)`), and an add bar. Each row shows
    [Type select — same options as the main menu incl. ＋ New Type…] [Identity select] [Freeform Description
    textarea] [⟳ persist (chars/loc/act only)] [✕]. Primary rows REUSE the existing element ids
    (panel-char-select-N-S / panel-char-extra-N-S / .persist-check[data-s], panel-loc-select-N /
    panel-loc-extra-N / panel-loc-persist-N, panel-act-N / panel-act-lib-N / panel-act-persist-N) so
    handleGridInput / propagate / restore / collect keep working unchanged; empty slots render NO row (rows
    appear only for filled objects). collectPageData now ALWAYS writes a full 3-entry chars array (using
    'none'/''/false when a control is missing) and tolerates missing loc/act controls. NEW per-panel
    `extras: [{type, sel, desc}]` in panelState supports ARBITRARY extra objects (4th+ char, 2nd+ loc/act,
    custom-type objects); extras rows use ids panel-extra-type/sel/desc-N-IDX, are read by collectPageData,
    and round-trip through state/export/import/duplicate automatically (NO ⟳ chains on extras). Add bar:
    one select with "Create new…" (＋ New Character… / ＋ New Location… / ＋ New Action… / ＋ New <CustomType>…
    / ＋ New Type…) and "Add from library…" (Character / Location / Action / <custom types>) — 'new:' →
    `createLibraryEntry(type)` (name+desc prompts) then `routeObject` auto-places (first empty char slot →
    loc slot → action box → extras); 'pick:' → inline picker (identity select + desc textarea + Add button).
    Type change on a row routes it (`onPanelObjTypeChange(i, kind, selEl)` for c1-c3/loc/act,
    `onPanelExtraTypeChange(i, idx, selEl)` for extras): Character→first empty char slot else extras,
    Location→loc slot else extras, Action→action box else extras, custom→extras; the source is cleared
    first (deletePanelChar/Loc/Act incl. its ⟳ chain + override + summary). renderPanelObjects also:
    preserves desc-only rows (a loc row with No Location Selected but a freeform description survives a
    re-render), auto-fills a row's Freeform Description from the library desc when a lib object is picked
    (handleGridInput 'lib:' branch for char/loc selects — matches the existing action quick-pick), and is
    called from buildPanelGrid ('state' mode reads storedPanelEntry), clearPanelImage, resetEverything, and
    from propagateSlot/propagateLoc/propagateAct + setPanel1Value via `ensurePanelObjectRow` (creates a
    missing target row so ⟳ chains + cross-page carry still land on previously-empty slots). New window
    exports: onPanelAddSelect, onPanelAddIdChange, panelAddPick, onPanelObjTypeChange, onPanelExtraTypeChange,
    deletePanelExtra. attachSlotListeners guarded against missing char controls. buildPanelPrompt is
    null-safe for missing loc/act and appends extras by type (Character→char list, Location→loc list,
    Action→act list, custom→misc clause "name, desc"). updatePanelSummary includes extras names. CSS:
    .po-warning/.po-colheads/.po-row/.po-empty/.po-addrow/.po-picker (grid layout Type 110px | Identity |
    Desc | ⟳ | ✕). TESTING GOTCHA (bit me twice): schedulePanelSave is debounced ~250ms — after mutating
    panel state in browser_eval ALWAYS wait >400ms THEN restore the snapshot (and re-restore once more)
    before reloading, or the debounced save overwrites the restore with test DOM.
  - BATCH 2026-08-14.7 (author greenlit all five queued items at once, "Let's go ahead and start now!"):
    (1) ⚡ Generate All From Here — `generateComicPage(startPanel)` now takes an optional start index
    (`if (generateAllRunning) return;` guard + `from = valid ? start : 1`); a button in the ⚙ Panel
    accordion (after Collapse Menu) calls `generateComicPage(${i})` to regenerate THIS panel and every
    panel after it. (2) The Hide/Show Panels button is now `#panelsToggleBtn`, fixed bottom-LEFT corner
    (`position:fixed; bottom:16px; left:16px; z-index:1000`; old `.panels-toggle` rules unused). (4) Hide
    panels can now be password-locked: `let panelsPassword = null;` — `applyPanelsVisible(true)` clears it;
    `togglePanels()` routes to `openSetPasswordDialog()` (set mode: pwSet1+pwSet2, must match) or
    `openEnterPasswordDialog()` (enter mode) depending on the new "Require password to show panels"
    preference (`#hidePasswordPref` in a new File → Preferences config-panel, persisted comicGen.hidePasswordPref
    '1'/'0', loaded at boot before applyPanelsVisible). `#passwordOverlay` has both modes; all dialog fns
    (cancelPasswordDialog, togglePwEye, confirmSetPassword, confirmEnterPassword) exported. Wrong/empty
    password keeps panels hidden. (5) File → 📄 New Project — `newProject()` (hasActiveProject gate → overlay)
    / confirmNewProjectSave (await saveSettings() then doNewProject) / confirmNewProjectNoSave /
    cancelNewProject; `doNewProject()` = resetEverything(true) + optional name prompt → projectNameInput.
    (3) PANEL LIBRARY OBJECTS CONSOLIDATION — the three parallel libraries (charLibrary/locLibrary/actLibrary)
    are REPLACED by ONE store `comicGen.libObjects` = `[{id, type, name, desc}]` where `type` is a LABEL
    ('Character'/'Location'/'Action' or custom from a per-row "＋ New Type…" select, persisted in
    comicGen.libTypes) that decides which panel dropdown the object appears in (slug char/loc/act; ids keep
    old prefixes). Functions: loadLibraryObjects/saveLibraryObjects/libTypeOptions/saveLibTypes/
    objectsOfType(typeLabel)/libraryOptions(slug,typeLabel)/migrateLibObjects/addLibraryObject/
    deleteLibraryObject(id)/renderLibrary(). Library menu now ONE "Panel Library Objects" section
    (#libObjects rows: Type select + name + desc + 🗑). `migrateLibObjects()` merges the three legacy keys
    (preserving ids so old panel selections stay bound) and DELETES them so removed objects don't resurrect;
    it runs at boot AND inside applyImportedSettings after the legacy-write branch (so old-format backups
    import correctly). buildExportData exports `libObjects` (version still 2); imports accept data.libObjects
    OR the three legacy keys. reset consolidated to one "delete saved library objects" checkbox
    (resetDelLibCheck); window.addLibraryObject replaces addLibraryEntry. CSS: `.lib-row select.lib-type {
    flex: 0 0 130px; min-width: 0; }`. BONUS FIX: `let syncState = {}` was MISSING (was an implicit global
    only set by loadCurrentPage) — applyImportedSettings line `for (const k in syncState)` threw
    "syncState is not defined" on a fresh page; declared at IIFE top (pre-existing import bug, found while
    testing the migration).
  - BATCH 2026-08-13.9 (author greenlit all four queued items at once): (a) ■ Stop button now activates for
    ANY generation — `syncStopButton()` = `setStopButtonEnabled(inFlightGen.size > 0 || generateAllRunning)`,
    called from renderPanelSlot (on in-flight register + finally), generateComicPage finally, haltGenerations,
    stopAllGenerations, the visibilitychange handler, and clearPanelImage/clearPanelImages/clearPanelImageSlot.
    (b) The per-image slots-btns (slotbtns-panel-N-K) MOVED back out of the old 🖼 Image Controls accordion
    into each `.panel-img-slot` (after `.panel-img-box`) — the 🖼 Image Controls accordion is GONE; the
    `.slot-btn-label` spans and "Image 1-4" labels were dropped; buttons are now icon-only chips
    (↗ ⬇ ✕ 🔓/🔒 ⭐) and `setSlotProtected` sets the protect text to '🔒'/'🔓'. Panel card now has FOUR
    `.panel-acc` groups: 📖 Panel Library, 📝 Prompt, ⚙ Panel, 💾 Files. (c) The blue Show Menu button is now
    a static "Show/Hide Menus" toggle → `togglePanelMenus(i)` (open all if any `.panel-acc` open, else
    collapse all; exported). `showPanelMenus`/`collapsePanelMenus` still exist for the ⚙ Collapse Menu button.
  - NEW CHARACTER / LOCATION VIA DROPDOWNS (2026-08-14.4; was section buttons in .2/.3; storage SUPERSEDED
    by the Panel Library Objects consolidation in BATCH 2026-08-14.7 — entries now land in
    `comicGen.libObjects` as `{id, type, name, desc}` and `comicGen.charLibrary/locLibrary` are migrated and
    deleted; the three-prompt flow below is unchanged): every character slot
    and the location select now end with a special "＋ New Character…" / "＋ New Location…" option (values
    `__new_char__` / `__new_loc__`, rendered in updatePanelSelects). Picking it → handleGridInput intercepts
    (regex `^panel-(?:char-select-(\d+)-(\d+)|loc-select-(\d+))), reverts the select to 'none' FIRST, then
    `newPanelLibraryEntry(type, i, s)` runs THREE native prompts — NAME (cancel = abort), then the MAIN LIBRARY
    DESCRIPTION (cancel = skip, stored as `entry.desc`, reusable everywhere), then a PANEL DESCRIPTION (cancel =
    skip) that fills the placed slot's OWN description field (`panel-char-extra-i-s` / `panel-loc-extra-i`) — so
    the library desc and the slot desc are deliberately SEPARATE (see src/ISSUES.md 2026-08-14, "not a bug").
    Stores `{id, name, desc}` in comicGen.charLibrary / comicGen.locLibrary,
    re-renders library + dropdowns, and sets THAT SLOT to the new entry (s = the slot that was picked). Then, if
    that line's ⟳ persist is on, re-propagates (propagateSlot/propagateLoc) so the chain follows. Guards: the
    special values must NEVER reach syncState — propagateSlot/propagateLoc return early on `__new_char__` /
    `__new_loc__`. newPanelLibraryEntry still exported on window (harmless, useful for tests). NOTE: `prompt()`
    returns null on cancel.
  - ACTION LIBRARY (2026-08-14.6; SUPERSEDED by the Panel Library Objects consolidation in BATCH
    2026-08-14.7 above — the `comicGen.actLibrary` key is migrated into `comicGen.libObjects` and deleted):
    library, fully parallel to chars/locs. 📚 Library tab gained "My Saved Action Prompts" (actLibrary
    container, "+ Add Action Prompt", name/desc/delete rows via renderLibrary('act')). Each panel's 🎬 Action
    Prompt accordion gained a "From Action Library:" dropdown (`panel-act-lib-N`, values '' / lib:act:id /
    `__new_act__`, rendered in updatePanelSelects) ABOVE the existing freeform textarea. Picking a saved
    action INSERTS its desc into `panel-act-N` (the textarea stays the source of truth — freeform actions
    still work; the dropdown is a quick-pick/insert tool and resets to '' after use). "＋ New Action…" →
    `newActLibraryEntry(i)` (3 native prompts: name, library action text, optional panel action text; the
    panel text or the library text goes into the textarea), then updatePanelSummary/clearPanelPromptOverride/
    schedulePanelSave + ⟳ re-propagate if persisted. `onActLibChange(i, sel)` handles the dropdown; both
    exported on window. Backup/import/reset round-trip actLibrary; reset gained a "delete saved action
    prompts" checkbox.
  - USER MANUAL (2026-08-13.10; FIXED 2026-08-13 for "Cannot GET /src/user-manual.html"): the styled design
    doc ships as `src/user-manual.html` (static, standalone full-page HTML — no perchance deps). Help has a
    "📖 User Manual" panel → `openUserManual()` (async, exported) which OPENS AN IN-APP OVERLAY
    (`#manualOverlay`, like the view overlays) and loads the manual into an `<iframe#manualFrame>` via
    `srcdoc` from `fetch('src/user-manual.html')` — this is the RELIABLE path. GOTCHA: never open the manual
    via `window.open('src/user-manual.html')` — Perchance injects a `<base href="https://perchance.org/<name>">`
    into the iframe, so relative URLs resolve against `perchance.org` (which 404s top-level `/src/...`); and a
    NEW TAB at even the corrected absolute `location.origin + '/src/user-manual.html'` is refused by the
    service worker ("No src manifest available for this page") — so the in-app overlay is the ONLY way to open
    the manual. The "↗ Open in new tab" button / `openUserManualTab()` were REMOVED 2026-08-14.
    `closeUserManual()` hides the overlay.
  - ⟳ LOCATION/ACTION PERSIST + LINE DELETE BUTTONS (2026-08-13, author-requested): 📍 Location and 🎬 Panel
    Action Prompt now have the SAME ⟳ persist checkbox the character slots have. Checking it (or editing a
    persisted line) propagates that panel's location (incl. modifier) / action to the later panels of the
    CURRENT page — syncState keys 'i-loc' / 'i-act', mirroring the char 'i-s' chains (propagateLoc / propagateAct,
    same still-in-sync skip). It ALSO buffers a carry (carryNext[page].pending) so the value lands on panel 1 of
    the NEXT page when it loads (applyCarryToPanel1, called in loadCurrentPage after buildPanelGrid) — propagation
    stops exactly there ("cap at next page's panel 1"). The carry honors the same divergence rule: it only
    overwrites next-page panel 1 while the last-applied chain value (carryNext[page].applied) matches its DOM;
    diverged panels keep the user's edit. Char chains got the identical cross-page carry (propagateSlot now calls
    bufferCarry too). New persisted flags: panelEntry.locPersist / panelEntry.actPersist (collectPageData /
    restorePanelState; round-trip via export/import/reset like char persist). New small red ✕ buttons (.btn-line-del)
    on every character line, the Location, and the Action Prompt: deletePanelChar(i,s) / deletePanelLoc(i) /
    deletePanelAct(i) — set the select to 'none' + clear the modifier/action, UNCHECK the line's ⟳ checkbox, clear
    its syncState/carry chain entries (clearChainFor), clear the panel prompt override, refresh the panel summary,
    and save. handleGridInput now also clears the location modifier when the loc select flips to 'none' (mirroring
    the existing char behavior). attachSlotListeners wires loc/act (checkbox.onchange → propagateLoc/propagateAct;
    select.onchange & extra.oninput fire while the line is persisted). remapPanelSession / remapPanelSessionForDuplicate
    now also remap 'i-loc' / 'i-act' syncState keys so chains survive reorder/duplicate/delete renumbering.
  - REQUESTED WORKFLOW (2026-08-11): the author wants the dev notes updated after EVERY change, automatically,
    without being asked, until they say otherwise. Always end a task by adding/updating the relevant note
    (even tiny tweaks), and if a task needs a one-line note where none exists, add one.
  - AUTHOR DIRECTIVE (2026-08-11): unless the author specifies otherwise for a given request, it is OK to
    CLOBBER any library data (saved characters/locations) or settings (panelState, keywords, layout, etc.)
    while implementing and testing — you may reset them to defaults before and after testing. EXEMPTION:
    TROUBLESHOOTING. When investigating a reported bug/issue, PRESERVE the user's current library/settings
    as-is, because something in them may be the cause — don't reset them as part of debugging.
  - AUTO-SAVE DIRECTIVE (2026-08-12): until the author specifies otherwise, treat saving as automatic for
    every completed change request — don't ask or remind. Edits to main.pjs/index.html/src are applied and
    persisted by the AI helper the moment they're made (the workspace files ARE the generator's source, and
    the live page is hard-reloaded with the new code before the next check), so there is no separate save step
    for the AI to perform. The ONE thing the AI cannot do is press the editor's manual Save/publish button —
    that lives in the parent editor window, outside the live output iframe the AI runs in — so any manual
    commit/publish remains the author's action.
    UPDATE (2026-08-12): the author clarified this refers to the EDITOR's Save/publish button specifically,
    and wants a REMINDER: after every completed change request, tell the author to press Save in the editor.
    Keep doing this until the author specifies otherwise.
  - CHAR SELECT LABEL + MODIFIER (2026-08-13, author-requested): the "none" option in character dropdowns
    no longer shows square brackets ("No Character Selected" instead of "[No Character Selected]" — updated in
    CHAR_OPTIONS and the hard-coded option built in buildPanelGrid). Selecting "No Character Selected" on a
    character line now clears that line's modifier textarea (panel-char-extra-N-S) — handled in
    handleGridInput (matches panel-char-select-N-S, clears the extra when value === 'none'); the grid's
    delegated listener saves state right after, so the cleared modifier persists.
  - PERSIST PROPAGATES "NO CHARACTER" (2026-08-13, author-requested): the ⟳ persist checkbox on a character
    line now also propagates "No Character Selected" down the chain — propagateSlot's early-return gate
    (`sel.value === 'none'`) was removed so a 'none' source copies 'none' + clears the modifier on all still-
    in-sync later panels (syncState updated). This also covers selecting 'none' on an already-persisted slot
    (sel.onchange → isPersisted → propagateSlot).
  - SIDE MENU STACKS CHIPS (2026-08-12, author-requested): the menu's action-chip rows are now a shared
    `.chip-row` class (display:flex; gap:8px; flex-wrap:wrap — identical to the old inline styles, so top
    mode is unchanged) covering: Backup Project (💾 Save… / 💾 Save as… / ⬇ Export Project / ⬆ Import
    Project), Page (pageSel select + ＋ Add Page + 🗑 Delete Page), and Image Count for All Panels (select +
    Apply to all). `body.side-mode .chip-row { flex-direction: column; align-items: stretch; }` +
    `body.side-mode .chip-row > * { width: 100% }` stacks them full-width vertically when the menu is on
    the side; top mode stays horizontal. Other menu rows (preset-row selects, kw-chips keyword chips,
    lib-row form rows) intentionally left as-is.
  - SIDE MENU STACKS MENU BAR (2026-08-12, author-requested): the File/Edit/Library/Help `.menu-bar` buttons
    also stack full-width vertically in side mode: `body.side-mode .menu-bar { flex-direction: column;
    align-items: stretch; }` + `body.side-mode .menu-btn { flex: none; width: 100%; }`. Top mode unchanged.
  - MENU VISIBILITY TOGGLE (2026-08-12, author-requested): a ☰ Hide/Show Menu button (.menu-toggle, blue
    border) sits in the app header next to ▤ Menu: Side. `applyMenuVisible()` toggles a `menu-hidden` class
    on <body> (`body.menu-hidden .menu-frame { display: none }`), updates the button label, and persists to
    localStorage `comicGen.menuVisible` ('1'/'0', default visible). Works in BOTH top and side modes and both
    orientations (the layout-toggle is hidden in portrait, the menu-toggle is NOT). When hidden, a fixed
    floating #menuRevealBtn (☰ Menu, bottom-right corner, z-index 1000) appears so the menu can be reopened
    after scrolling (the header is not sticky). menuVisible is exported/imported with backups and restored by
    applyImportedSettings (defaults to current visibility when a backup predates the field). Toggle is
    orthogonal to layoutMode; both persist independently.
  - HEADER BUTTONS ON THE LEFT (2026-08-12, author-requested): the app-header button cluster (▦ Storyboard,
    ☰ Hide/Show Menu, ▤ Menu: Side) moved from the upper-RIGHT to the upper-LEFT (DOM order swapped — buttons
    div now precedes the title div, which keeps flex:1 and fills the rest). Layouts, menu structure, and all
    toggle behavior unchanged.
  - PANEL ACCORDION LAYOUT (2026-08-13, author-requested; partially SUPERSEDED 2026-08-13.9 — the 🖼 Image
    Controls accordion was removed and its slotbtns rows moved back under each image — see the BATCH note
    above): panels were fully reorganized for minimal
    clutter. Card order is now: header (title, Images, Style, Move, Seed — the per-panel Seed box moved here
    from the ⚙ Panel accordion on 2026-09-18, see the .13 BATCH note) → image boxes + per-slot 🔄 Generate →
    🔍 Focus / 🔄 Generate row → then FIVE collapsed `.panel-acc` groups: 🖼 Image Controls (per-image
    Open/Save/Clear/Protect/Cover rows, id slotbtns-panel-N-K, labeled Image 1-4), 📖 Panel Library
    (characters, location, action prompt — in a .panel-acc-stack), 📝 Prompt (Prompt + Copy buttons and the
    prompt-editor), ⚙ Panel (Duplicate, Add Panel, Clear Images, Clear, Delete — its Panel Seed input lives in
    the card header since 2026-09-18), 💾 Files (Open All, Save All, Export). CSS: .panel-acc-stack { flex:1 1 100% } keeps
    stacked content full-width inside the wrapping body; .slot-btn-label labels each image row;
    .panel-img-box.protected::before shows a 🔒 corner badge since Protect buttons are now hidden (set in
    setSlotProtected). JS selectors that target the moved slot buttons were updated to #slotbtns-panel-N-K
    (isSlotProtected/setSlotProtected/setPanelImageButtons); updatePanelImgSlots hides both the slot AND its
    button row when imgCount drops.
  - PANEL LIBRARY SUB-ACCORDIONS (2026-08-13, author-requested): inside 📖 Panel Library, the Characters,
    Location, and Panel Action Prompt sections are now individually collapsible nested `.panel-acc` groups
    (👤 Characters / 📍 Location / 🎬 Action Prompt), each default collapsed, reusing togglePanelAcc — the
    `closest('.panel-acc')` logic keeps clicks scoped to the clicked section. CSS: `.panel-acc-stack >
    .panel-acc { flex:1 1 100% }` + a dashed separator and indented smaller toggles
    (`.panel-acc-stack .panel-acc-toggle { padding-left:8px; font-size:.75rem }`) to show the nesting level.
    The old .divider between Location and Action was removed (sections are now separate).
  - FLOATING MENU BUTTON TRACKS HEADER (2026-08-12, author-requested): on mobile, unhiding the menu after
    scrolling left no way to hide it again (header scrolled away). Fix: the header button cluster now has
    class .header-btns and an IntersectionObserver (initHeaderObserver, threshold 0; scroll/resize fallback)
    toggles body.hdr-offscreen when it leaves the viewport. CSS: `body.menu-hidden #menuRevealBtn,
    body.hdr-offscreen #menuRevealBtn { display: block }` — the fixed floating button now appears whenever
    the header buttons are out of view OR the menu is hidden, and applyMenuVisible keeps its label in sync
    (☰ Show Menu when hidden / ✕ Hide Menu when shown). So you can hide AND unhide from anywhere on the page
    without scrolling to the top.
  - FLOATING BUTTON POSITION (2026-08-12, author-requested): the floating button is now position-aware —
    when the menu is HIDDEN it floats in the UPPER-LEFT corner (top:12px; left:12px; where the header buttons
    live), and when the menu is OPEN it floats BOTTOM-RIGHT (bottom:16px; right:16px) so it never covers the
    sticky menu-frame that occupies the top of the screen on mobile. It still only appears while the header
    buttons are off-screen (body.hdr-offscreen). The IntersectionObserver was replaced by refreshHdrOffscreen()
    (manual getBoundingClientRect check) wired to scroll + resize, AND called from applyMenuVisible so the
    class stays correct right after a menu toggle.
  - STORYBOARD IN FILE → PROJECT (2026-08-12, author-requested): the Project panel of the 📄 File menu now has
    a Storyboard input-group ("▦ Storyboard View" green chip, calls the same openStoryboard() as the header
    button). Header button unchanged.
  - DELETE PANEL (2026-08-12, author-requested): every panel's action row has a red 🗑 Delete chip
    (deletePanel(i), exported). Mirrors resequencePanel's model: confirm() first, then collectPanelState,
    remove panel i from a 1..total order array, rebuild the page with panelCount adjusted via
    panelCountStateFor(newTotal), save, remapPanelSession(order, newTotal) to shift session images/sync,
    clear panelPromptOverrides, mark cards cleared, buildPanelGrid. UPDATE (2026-08-13): deleting the LAST
    panel of a page now warns that the PAGE will be deleted too, and deleting the only panel on the ONLY page
    warns that the whole project will be reset (→ resetEverything(true)).
  - PER-PANEL ART STYLE (2026-08-13, author-requested): each panel's header row has a "Style:" select
    (id panel-style-N) with [Default (Global)] + every ART_STYLES entry. Persisted in panelState[i].style
    (collectPageData + restorePanelState; rides along export/import/duplicate/reset). buildPanelPrompt now
    uses getPanelKeywords(i): if a per-panel style is set it builds pos/neg from that style's keywords +
    the GLOBAL palette's keywords (and the style's own negatives), else falls back to getEffectiveKeywords()
    (global style). onPanelStyleChange(i) clears the panel's 📝 prompt override (so a stale override can't
    fight the new style) + saves. NOTE: changing the GLOBAL style never re-renders existing images — users
    must regenerate a panel to see a new style; and applyPreset() clears ALL prompt overrides on global
    style change. See src/ISSUES.md "Panels seem to keep their old art style".
  - PANEL ACTION ACCORDIONS (2026-08-13, author-requested): each panel's two action rows were replaced by
    ONE always-visible row (🔍 Focus + 🔄 Generate) plus three collapsible `.panel-acc` groups, each a slim
    gold toggle bar with ▾/▸ (CSS: `.panel-acc[data-collapsed="1"] > .panel-acc-body { display:none }`; JS:
    togglePanelAcc(el), exported): 📝 Prompt (📝 Prompt editor + 📋 Copy Prompt), ⚙ Panel (⧉ Duplicate, ＋
    Add Panel, 🗑 Clear Images [hidden unless ≥2 images], 🗑 Clear, 🗑 Delete), 💾 Files (↗ Open All, ⬇ Save
    All .zip, ⬇ Export). All accordions default COLLAPSED on every render (not persisted). Button enable/
    hidden state logic (updatePanelAllButtons, flashPromptBtn, prompt-editor toggle) is querySelector-based
    and unaffected by the new nesting.
  - ADD PANEL (2026-08-13, author-requested): a green ＋ Add Panel chip sits next to 🗑 Delete (inverse of
    delete — it inserts an EMPTY panel right after the current one, shifting later panels down; mirrors
    duplicatePanel's model: order splice with a 0 marker, panelCountStateFor(newTotal), and
    remapPanelSessionForDuplicate(order, insertPos) so the new slot gets no images). At 24 panels it offers
    to start a new page (addPage()). deletePanel's confirm() gating: confirm() auto-accepts inside the
    browser_eval harness, so NEVER drive confirm()-gated mutations from evals against live data (see ISSUES.md
    "AI's test harness deleted the author's project page").
  - DELETE LAST PAGE NUKES PROJECT (2026-08-13, author-requested): deletePage() no longer refuses the only
    page — it now warns and resets the whole project via resetEverything(true) (same as Edit > Reset to
    Defaults). The 🗑 Delete Page button in File → Page Setup is always enabled (updateDeletePageBtn sets
    title accordingly); deleting the last panel of the only page reaches the same nuke. resetEverything gained
    a noConfirm param so callers can pre-confirm.
  - ⚠ INCIDENT (2026-08-12): the AI's browser_eval verification of deletePanel created temp pages and its
    cleanup called deletePage() which — because confirm() AUTO-ACCEPTS inside the eval harness — deleted the
    wrong page (the author's page 1) from localStorage. The author recovered via re-import. LESSON: never run
    deletePage()/confirm()-gated mutations via browser_eval against a live project; test with read-only evals
    or build a disposable page and DON'T clean up via deletePage. Logged in src/ISSUES.md.
  - LIB-HINT OVERLAP FIX (2026-08-12, author-reported bug, logged in src/ISSUES.md): `.lib-hint` had
    `margin-top: -8px`, which pulled hint text up into whatever preceded it — visibly overlapping buttons in
    `.chip-row`s (Storyboard View, Backup Project, Page, etc.). Changed to `margin-top: 0`. Affects ALL
    lib-hint placements globally (slightly more breathing room after inputs too).
  - ISSUE LOG (2026-08-12, author-requested): src/ISSUES.md is the persistent, newest-first log of reported
    issues and their resolutions (symptom → root cause → fix → gotchas), written so a future session never
    re-diagnoses a known bug. GREP src/ISSUES.md before diagnosing anything. After resolving an issue, add an
    entry there (in addition to the usual dev-note). This file ships publicly with the generator; keep entries
    free of secrets. The dev notes above remain the place for implementation/architecture notes.
  - PENDING QUEUE (2026-08-13): open feature requests now live in `src/PENDING.md` (newest first, one entry
    per request). READ IT before planning new work. All items of the original 2026-08-12 list below are DONE.
    As of 2026-08-14 there are 4 queued items (newest first): (1) float the Hide/Show Panels button at the
    bottom-left like the floating ☰ Menu button (model: #menuRevealBtn); (2) consolidate Characters /
    Locations / Action Prompts into one "Panel Library Objects" store with a user-settable Type dropdown
    (+ New Type, starting categories Character / Location / Action; Name + project-level Description going
    into prompts + optional per-panel Panel Description); (3) Hide-panels password (casual lock, non-secure)
    + a new 📄 File → Preferences section — Preferences holds ONLY an OFF-by-default "ask for a password when
    hiding the panels" toggle; the password is set at hide time via a two-field confirm modal (each field
    with its own 👁 show/hide) and clears on reveal; (4) 📄 File → New (save → Edit's Reset to Defaults →
    optional project name).
  - QUEUE UPDATE (2026-09-19): BOTH greenlit requests are now DONE — 📚 Library → Import (changelog
    2026.08.16.14) and 📚 Library → Analysis (changelog 2026.08.16.15). The 🕒 QUEUED section then holds only
    the STANDING DIRECTIVE. The seed-header request (2026-09-18) is DONE (changelog 2026.08.16.13).
  - PENDING FEATURE REQUESTS (2026-08-12, author-supplied list): DO NOT implement any of these until the
    author explicitly says "go ahead". The list may still be
    incomplete (author said they'd say when it's complete). Work through the phases below in order unless the
    author redirects. Author approved arranging the order now (by technical sense) but NO code changes until
    told. UPDATE (2026-08-12): author approved BATCHING — the tasks grouped in each phase may be done together
    in one pass (they share code areas); phases still run in order, one phase at a time.
      1. Multiple pages — ability to create multiple pages. (DONE 2026-08-12 — Phase E, see PAGES note below.)
      2. Duplicate a panel — duplicate a panel 1+ times; copies land immediately after the original and push
         later panels down (same model as resequencePanel); images NOT duplicated but all panel data/prompts
         are; warn if this exceeds the 24-per-page limit and offer to start a new page for overflow.
         (DONE 2026-08-12 — Phase C, see DUPLICATE PANEL note below. The "offer to start a new page" half
         COMPLETE 2026-08-12 — Phase E: a full page now offers to start a new page with a copy of the
         duplicated panel as its first panel.)
      3. Protect image(s) in a panel — checkbox so a panel's images can't be overwritten by a Generate. (DONE
         2026-08-12 — Phase B, see PROTECT note below.)
      4. Choose a panel's "representative" image — which image represents the panel (shown highlighted; likely
         by reordering so the chosen image is first). (DONE 2026-08-12 — Phase B, see REPRESENTATIVE note
         below.)
      5. Storyboard view — temporarily hide the whole UI and show just the panel images as a comic
         page/storyboard; empty panels get a placeholder. (DONE 2026-08-12 — Phase D, see VIEW MODES note
         below.)
      6. Change images-per-panel en masse — set the image count for all panels at once. (DONE 2026-08-12 —
         Phase B, see BULK IMAGE COUNT note below.)
      7. Single panel view with list selector — a chip toggling single-panel view (defaults to that panel);
         landscape: full list on the left + up/down arrow keys; mobile: dropdown + prev/next buttons.
         (DONE 2026-08-12 — Phase D, see VIEW MODES note below.)
      8. Menu option collapsability — when a menu section opens, its options start collapsed and the user
         expands them to interact. (DONE 2026-08-12 — Phase A, see MENU COLLAPSE note below.)
      9. Complete project export/import — download, then reupload + repopulate, the current images alongside
         the JSON; add the ability to name the project. (DONE 2026-08-12 — Phase F, see PROJECT NAME + ZIP
         IMPORT note below.)
      10. Local hosting — run the generator locally in a desktop browser; determine whether image-generation
          prompts can still work there. (DONE 2026-08-12 — assessment only, no code; see LOCAL HOSTING note
          below.)
      11. User-viewable changelog — Help → About shows a brief per-revision summary; versioning by timestamp.
         (DONE 2026-08-12 — Phase G, see CHANGELOG note below.)
      12. Move the "No Character Selected" (deselect) option to the BOTTOM of the character dropdowns —
          ideally after the user-added library characters, or at least to the bottom of the precreated
          (built-in) character list. (DONE 2026-08-12 — Phase A.)
      13. Image-preview disable checkbox — a checkbox in 📄 File (next to Image Preview Delay) that turns the
          hover/long-press preview OFF entirely. (DONE 2026-08-12 — Phase A, see PREVIEW TOGGLE note below.)
    SUGGESTED IMPLEMENTATION ORDER — BATCHED INTO PHASES (2026-08-12, technical sense; author-approved):
      Phase A — Quick wins (no dependencies): 10 (local-hosting assessment, no code) + 8 (menu
        collapsability, pure UI) + 12 (char-dropdown option ordering, pure UI) + 13 (image-preview disable
        checkbox, pure UI toggle on shipped preview code). COMPLETE 2026-08-12.
      Phase B — Image-slot management (single pass over the slot/generation/persistence code): 3 (protect
        images per panel) + 4 (representative image via reordering; enabler for 5/7) + 6 (en-masse image
        count — trivial, fits naturally here). COMPLETE 2026-08-12.
      Phase C — Panel operations: 2 (duplicate panel; data/model, reuses resequencing). COMPLETE 2026-08-12.
      Phase D — View modes (shared presentation infrastructure; both build on 4): 5 (storyboard view) + 7
        (single-panel view). COMPLETE 2026-08-12.
      Phase E — Structural: 1 (multiple pages; largest change — kept after the panel-level features so those
        don't need redoing across pages). COMPLETE 2026-08-12.
      Phase F — Project: 9 (export/import with images + project name; depends on pages). COMPLETE 2026-08-12.
      Phase G — Meta: 11 (changelog; last, aggregates everything). COMPLETE 2026-08-12.
    vs. the old one-at-a-time order: 6 moved up to join 3/4 (same code region); 5/7 grouped (both view
    modes); 8 grouped with 10 (both dependency-free quick wins); the rest keep their relative position.
    UPDATE (2026-08-12): items 12 + 13 added to the queue and assigned to Phase A (both dependency-free
    pure-UI quick wins — 12 in the char-select/updatePanelSelects code, 13 a toggle on the shipped image-preview
    code). No phase ordering changed; Phase A simply runs them alongside 8/10.
  - App: Yet Another Comic Book Page Generator. main.pjs = tiny character/location lists + {import:text-to-image-plugin}.
  - APP TITLE (2026-08-13, author-requested): the app was renamed "Yet Another Comic Book Page Generator" —
    updated in main.pjs `title`, the header <h1>, the About line, and this dev note. URL unchanged; internal
    identifiers (comicGen.* storage keys, comic-generator-settings.json / comic-generator.zip filenames) are
    intentionally untouched (they're persistence/import plumbing).
  - CHANGELOG LOCATION (2026-08-13, author-requested): the changelog is now a markdown file —
    `src/CHANGELOG.md` (newest first, format `## <ver> — <date> — <title>` + `- item` bullets), alongside
    `src/ISSUES.md` and `src/AI-NOTES.md`. It is the SINGLE source of truth: the Help → About panel's
    renderChangelog() fetches it at runtime and parses it. The old `const CHANGELOG` array in index.html was
    removed and `src/changelog.js` was DELETED (dead — no longer referenced). Adding a revision = prepend an
    entry to `src/CHANGELOG.md` (and, for accuracy, a matching dev-note block here). Versions are
    timestamp-based: YYYY.MM.DD.R, next ordinal per day.
    index.html = the ENTIRE app (CSS + one IIFE <script>). No src/ files, no external scripts.
  - LAYOUT (2026-08-10, author-requested): .menu-frame is pinned TOP of the screen by default in BOTH
    orientations — full-width, position:sticky, max-height 45vh, internal .menu-scroll above the
    always-visible .gen-actions. A "▤ Menu: Top/Side" toggle (top-right of the header, hidden on portrait)
    flips to the old landscape sidebar layout via body.side-mode + orientation media query; the choice is
    persisted in localStorage 'comicGen.layoutMode'. Menu must stay reachable; don't revert to a single
    scrolling column.
  - MENU STRUCTURE (2026-08-10; DEFAULT-STATE FIX 2026-08-14): the menu frame is an accordion menubar —
    .menu-bar buttons (File / Edit / Library / Help) toggle .menu-group sections via switchMenu(); one open
    at a time. The app ALWAYS STARTS with every menu closed and no button highlighted — initMenu() hides all
    .menu-group's and strips .active from every .menu-btn (do NOT re-add auto-restore of
    'comicGen.activeMenu' on load). switchMenu() still writes 'comicGen.activeMenu' (used to restore the menu
    after an import, not on load). The Generate button + status live in .gen-actions, always visible at the
    bottom of the menu frame (.menu-scroll scrolls above it).
    File = page setup (panel count, seed); Edit = keywords, NSFW, presets, keyword list, reset;
    Library = saved chars/locs; Help = how-to.
  - PANEL SKIP LOGIC (2026-08-10, author-requested): a panel is SKIPPED only when it has NO user content
    beyond the preset style keywords — no character, location, location modifier, or action. buildPanelPrompt
    returns `hasContent` (previously the skip rule was "no character selected"). The Copy Prompt chip shows
    "⚠ No Content" for empty panels. An empty panel's image box shows a "Skipped — empty panel" note.
  - SAVED CHARACTER AUTO-DRAW (2026-08-11, author-requested): a panel with NO explicitly selected character
    automatically drew from the saved char library (comicGen.charLibrary), BUT only if the panel already had
    a scene prompt (action, location modifier, or selected location) — so a truly EMPTY panel (no prompt
    beyond presets) was still skipped. If a saved character's NAME appeared in the panel's Action or
    Location-modifier text, that character (or all named ones) was used; otherwise one was picked at random, or
    deterministically via Math.abs(seed + N) % count when a Seed was set (mirrors the seed+N rule in
    generateSinglePanel). Explicit selections always win. **BACKED OUT 2026-08-11**: the author asked to
    remove it — a panel now uses a saved character only when explicitly selected. The auto-draw block in
    buildPanelPrompt is deleted; `hasOther` no longer exists.
  - CROSS-PANEL LOOKS (2026-08-11, diagnosed): author saw a blonde character rendered with another panel's
    brown hair + green bow. Verified NOT a code bug: buildPanelPrompt(i) reads only panel-i inputs + the
    shared library; a 2-panel real-generation test (blonde/red dress vs brown/green bow, 768x768, real
    plugin) produced both images EXACTLY to their prompts (vision-checked). This is a known image-model
    artifact — features occasionally bleed across a queue of similar sequential generations. If it recurs,
    mitigations: raise guidanceScale (default 7) for tighter prompt adherence, or set a distinct Seed.
  - SEED: the Seed input's placeholder is intentionally short ("Leave blank for random") so it doesn't get
    clipped in the narrow side-menu; the full "Panel N uses seed+N" explanation lives in the Help > How to Use
    section.
  - SEED PERSISTENCE + PER-PANEL SEED (2026-08-11): the global seed now persists across reloads with the
    panel details (saved in comicGen.panelState.seed; the seed input has its own listener since it's outside
    the grid — see init). Every panel also has a `panel-seed-N` input: if set, it overrides the global seed
    for that panel only. getPanelSeed(i) returns {seed, hasSeed}: panel seed > global seed+N > -1/random.
    Used by generateSinglePanel. Panel seeds are saved in panelState
    and cleared by Reset.
  - PER-PANEL SEED IN THE HEADER + PIN-ON-GENERATION (2026-09-18, author-requested): see BATCH 2026.08.16.13.
    The panel-seed-N box now lives in the panel HEADER row (not the ⚙ Panel accordion) and DISPLAYS the
    resolved seed: empty boxes show a `placeholder` of global+(i−1) (or "random") via
    updatePanelSeedPlaceholders(). pinPanelSeedForRun(i) replaces getPanelSeed in renderPanelSlot: a random
    seed is chosen ONCE and written into the box, so an unseeded panel is reproducible after its first run
    (previously it rolled fresh each run). getPanelSeed is retained but unused by render.
  - SETTINGS PERSISTENCE (2026-08-11): global keywords (globalPos/globalNeg) and the NSFW flag now persist
    too — they're stored in comicGen.panelState (restored by restorePanelState, which calls renderKeywordChips
    after) and saved via input/change listeners wired in initKeywords; applyPreset() and resetEverything()
    also schedule a save. So every menu setting survives reloads.
  - EXPORT / IMPORT (2026-08-11): File menu → Backup Settings. exportSettings() downloads a versioned .json
    (v1) containing: settings+panels (collectPanelState()), preset, charLibrary, locLibrary, layoutMode,
    activeMenu. importSettingsFromFile() validates version, writes panelState + libraries to localStorage,
    restores the DOM (restorePanelState, renderLibrary, updatePanelSelects/Visibility, keyword chips, layout,
    menu), then schedulePanelSave. NOTE: savePanelState was refactored — the state-building logic now lives
    in collectPanelState() (pure, returns the object); savePanelState just writes it.
  - PER-PANEL EXPORT (2026-08-11, author-requested): every panel card now has an "⬇ Export" chip
    (class .btn-export, always enabled — setPanelImageButtons doesn't touch it). Clicking it calls the SAME
    exportSettings() as File → Project → Backup Project, so ALL panels' settings land in ONE shared JSON file
    (comic-generator-settings.json). No per-panel image data is included (settings only).
  - ZIP EXPORT WITH IMAGES (2026-08-11, author-requested): File → "Export + Images (.zip)" — exportZip()
    bundles comic-generator-settings.json plus every generated panel image (panels/panel-N.jpg|png, from the
    panelImages data URLs) into one .zip via a self-contained STORE-only ZIP writer (buildZip + table-based
    crc32, no external libs). exportSettings() was refactored to share buildExportData() + downloadBlob().
    Export-only: the ZIP's settings JSON is importable via the normal .json import if extracted; panel images
    are NOT re-imported (session-only, not persisted).
  - SAVE / SAVE AS (2026-08-11, author-requested): File-menu "Export Settings" became two buttons.
    💾 Save… (saveSettings) NEVER opens the picker: if a FileSystemFileHandle is remembered it writes to it
    silently (after ensureWritePermission → queryPermission/requestPermission); otherwise it just downloads
    to saveFileName (default comic-generator-settings.json). 💾 Save as… (saveSettingsAs) always calls
    window.showSaveFilePicker (native path picker, confirms overwriting), stores the handle + filename, and
    falls back to a plain downloadBlob() when the API is unavailable (Firefox/Safari, sandboxed preview
    iframe → SecurityError) or the user cancels. The handle + filename are persisted in IndexedDB
    ('comicGenSaveState' DB, 'handle'/'name' keys — FileSystemFileHandle is structured-cloneable) and
    restored at startup by restoreSaveState(), so Save… keeps working silently across reloads. Data is
    buildExportData() JSON (v1) — identical to the old export. Per-panel ⬇ Export chips still call
    exportSettings() (plain download, unchanged).
  - KNOWN ISSUE (2026-08-11): "Save…" can still open a file picker / save dialog in some environments
    (e.g. the deployed page inside Perchance's cross-origin iframe, or browsers configured to "ask where to
    save each download"). Likely platform limitation: the cross-origin/sandboxed iframe can't persist the
    FileSystemFileHandle across reloads (IndexedDB storage partitioning), so the silent-write path has no
    remembered handle and the download fallback surfaces the browser's own save dialog. Accepted as-is —
    author opted to document rather than fix further.
  - PANEL ACTIONS (2026-08-11): pressing Enter in a panel's Action prompt (panel-act-N) renders that panel
    (generateSinglePanel). Since 2026-08-11 the Panel Seed input (panel-seed-N) has the same Enter-to-render
    behavior. Each panel also has a 🗑 Clear chip (clearPanelImage, exported on window) that
    removes ALL of the panel's images, resets failed/paused/skipped states, and stops any in-flight generation
    for that panel (marks the card `.cleared` so generateSinglePanel's catch returns 'cleared' instead of
    showing a failure). Since 2026-08-11 it ALSO resets the panel's characters (selects to 'none', modifier
    textareas to ''), location (select to 'none', modifier ''), and action textarea to '' — i.e. the whole
    panel's content — and calls schedulePanelSave() so the cleared state persists. (The per-image
    ✕ Clear this image chip clears ONLY that image.) Layout: the Clear chip sits alone on its OWN line at the
    bottom of the panel's chip section, LEFT-aligned (the other chips are right-aligned above it) — two
    .panel-header-btns rows in the card.
  - PER-IMAGE REROLL (2026-08-11, author-requested): every image slot has a 🔄 Reroll row (`.slot-reroll` +
    .btn-img-reroll) ABOVE its image box. It calls generateSinglePanelSlot(i, k) — regenerates just that one image using the panel's
    prompt (same seed+slot rule). The slot loop in generateSinglePanel was refactored into renderPanelSlot
    (per-slot generate, returns 'ok'/'cleared'/throws on failure); generateSinglePanel loops slots calling it,
    and generateSinglePanelSlot is the single-slot entry point (both guard panelBusy[i]).
    FIX (2026-08-11): per-image reroll initially did NOT update the displayed image — the imgObserver's
    intersecting branch had an `!img.src` guard, so re-observing a card whose <img> already had an old src
    never applied the new dataUrl (panel Reroll worked only because generateSinglePanel pre-clears srcs).
    The guard is removed (src is always refreshed from panelImages when intersecting) AND renderPanelSlot now
    clears the slot's src when generation starts.
    UPDATE (2026-08-12, author-requested): the per-image 🔄 Generate chip is now shown on ALL devices — the old
    `@media (max-width: 768px)` gate (mobile-only) was removed; .slot-reroll is `display: block` unconditionally.
    Help text updated to match.
  - IMAGE HOVER/LONG-PRESS PREVIEW (2026-08-12, author-requested): a fixed overlay (#imgPreview) shows the
    image at up to ~85vw/80vh when the user hovers a panel image (desktop: pointerover/pointermove/pointerout,
    mouse pointerType only) or press-and-holds it ~450ms (mobile: touchstart timer, cancelled on >12px finger
    drag; contextmenu + touchmove-preventDefault active only while a touch preview is shown, so scrolling and
    the native long-press menu still work normally otherwise). It reads the FINAL data URL from panelImages
    (panelImages[i][k-1]) via the box id regex imgbox-panel-N-K, so upscaled images preview at full res and
    off-screen/evicted images still work. Overlay is pointer-events:none so it never steals the hover.
    .panel-img-box got -webkit-touch-callout:none + user-select:none + touch-action:manipulation to stop the
    iOS image callout during long-press.
    UPDATE (2026-08-12, author-requested): the preview trigger delay is now CONFIGURABLE — 📄 File →
    "Image Preview Delay (ms)" (0–5000, default 350) drives BOTH the desktop hover timer (pointerover starts a
    timer; preview shows when it fires) and the mobile long-press duration (previewDelayMs()). Persisted in
    panelState.previewDelay (collect/restore/reset + exported/imported via settings), wired via an input
    listener like the seed. Helper: previewDelayMs() clamps 0..5000, NaN→350.
  - CLEAR-IMAGES CHIP (2026-08-12, author-requested): each panel's bottom row now has a 🗑 Clear Images chip
    (.btn-clear-images, clearPanelImages(i), exported on window) that removes ALL of that panel's images at
    once but KEEPS its characters/location/action (stops any in-flight generations for the panel and marks the
    card .cleared like the full Clear chip does). It is visible ONLY while the panel has 2+ generated images —
    updatePanelAllButtons toggles clearBtn.hidden = count < 2 (called from setPanelImageButtons on every
    per-slot change and from resetEverything), so it appears/disappears automatically as images are generated
    or cleared.
  - PANEL TITLES + RESEQUENCING (2026-08-12, author-requested): each panel's header row is now
    [Panel N] [title input #panel-title-N] [Images: selector] [⇅ Move chip #reorder-btn-N + hidden picker
    #panel-reorder-N]. The title is display-only (never injected into prompts), saved as panelState[i].title
    (collect/restore, exported/imported like all panel fields). The Move chip toggles open a 1..N picker
    (populateReorderSelects, options = current panel count, refreshed by updatePanelVisibility); picking a
    position calls resequencePanel(from,to) which: reads the whole DOM state, computes the shift order
    (remove `from`, insert at `to`), remaps panelState keys 1..N (positions above N keep their identity),
    persists it, remaps the session data via remapPanelSession (panelImages arrays + ⟳ syncState entries move
    with panels; all in-flight generations are stopped), clears panelPromptOverrides (restored from the new
    state by restorePanelState), marks old cards .cleared so any stopped generation resolves as 'cleared',
    and rebuilds the grid (buildPanelGrid is idempotent for rebuilds — the grid input/change listeners are
    only attached once via the gridHasListeners flag). Order persistence is INHERENT: state is keyed by
    position, so reorder = rekeying; backups/imports round-trip the order automatically. The global
    seed+N rule follows each panel's NEW number; per-panel seed overrides travel with the panel.
    Images travel with panels in-session (remapped); hidden panels (beyond the count) keep their own state.
    resetEverything also clears the title inputs (added alongside the panel-seed clearing loop).
  - PHASE A COMPLETE 2026-08-12 (queue items 8, 10, 12, 13):
    * MENU COLLAPSE (#8): setupMenuCollapse() (idempotent, called from initMenu) wraps every
      .config-panel/.library-section/.help-panel's non-header children in a .menu-collapse-body div and turns
      its header (.config-header, .library-header, or first h3) into a .menu-collapse-toggle with a ▾/▸
      indicator; clicking toggles panel.dataset.collapsed, and CSS `[data-collapsed="1"] > .menu-collapse-body`
      hides the body. collapseGroupPanels() runs whenever a menu group is opened (switchMenu), so
      a section's panels always start collapsed. renderLibrary targets inner #charLibrary/#locLibrary
      containers, so the wrapping doesn't disturb it.
    * LOCAL HOSTING ASSESSMENT (#10, no code): NOT directly hostable as-is. Opening index.html standalone
      cannot work because (a) main.pjs's pjs lists + `{import:text-to-image-plugin}` are evaluated by the
      Perchance platform (no pjs engine in a raw browser), and (b) image generation is a Perchance server
      service. Everything else (localStorage, IndexedDB, canvas upscale, zip export, download chips, hover
      preview) is plain browser tech that WOULD work. Real local hosting would require vendoring the pjs
      lists into plain JS and replacing generateImage with a local/external image service. Author to decide
      if worth pursuing.
    * CHAR DROPDOWN ORDERING (#12): updatePanelSelects now emits the precreated options minus 'none', then the
      "My Characters" optgroup (library), then a final "none" option labelled "No Character Selected" LAST
      (after library chars). Location selects unchanged (request was chars only). The `selected` attr
      keeps the default 'none' selection; restorePanelState still overrides with saved values.
    * PREVIEW TOGGLE (#13): new #previewEnabledCheck in 📄 File (default checked). previewEnabled() guards
      both the pointerover and touchstart handlers; unchecking also clears pending timers + hides any visible
      preview (change listener in init). Persisted as panelState.previewOn (collect/restore/reset; included in
      resequencePanel's scalar list so reordering keeps it). resetEverything re-checks it.
  - PHASE B COMPLETE 2026-08-12 (queue items 3, 4, 6):
    * PROTECT (#3): per-panel 🔒 Protect checkbox (.panel-protect-check) in the header row. isPanelProtected(i)
      + guard at the top of generateSinglePanel and generateSinglePanelSlot: when protected AND the panel has
      images (hasPanelImages), generation is refused (returns 'protected', status message shown); protected
      panels with NO images still generate their first render. generateComicPage counts 'protected' in its
      summary. Clearing chips still work (user action). Persisted as panelState[i].protect; cleared by Reset.
      The grid's delegated change listener picks up the checkbox (collectPanelState reads it).
    * REPRESENTATIVE (#4): every slot has a ⭐ Cover chip (btn-star, disabled when the slot is empty — added
      to setPanelImageButtons' disabled list). makeRepresentative(i,k) swaps panelImages[i][0] with
      panelImages[i][k-1] and refreshes both slots via showPanelImage. The representative = slot 1, which gets
      .rep (gold border + ⭐ badge via ::before — ::after stays free for generating/failed/paused/skipped
      states). updateRepHighlight(i) runs inside updatePanelAllButtons, so it stays correct after every
      generate/clear/count/resequence change. Session-only (images are session-only), consistent with images.
    * BULK IMAGE COUNT (#6): 📄 File → "Image Count for All Panels" (select 1-4 + "Apply to all" →
      applyAllImageCount(), exported). Sets every panel-img-count-N select to the chosen value, calls
      updatePanelImgSlots(i) for each (updates slot visibility/buttons), then schedulePanelSave. Not itself
      persisted — it just writes the normal per-panel imgCount values.
  - PHASE C COMPLETE 2026-08-12 (queue item 2):
    * DUPLICATE PANEL (#2): every panel's bottom row has a ⧉ Duplicate chip (btn-dup, duplicatePanel(i),
      exported). It mirrors resequencePanel's model: reads the full DOM state, builds a 1..24 order array with
      a copy of `i` spliced in right after it (order.splice(i,0,i)), remaps panelState keys 1..24
      (newState[p] = state[order[p-1]]), bumps the panel count via panelCountStateFor(newTotal) — setting the
      📄 panelCount select to a preset value (1/4/6/12/24) or 'custom'+value otherwise — persists, stops
      in-flight gens, clears panelPromptOverrides (restored by restorePanelState, so the copy inherits the
      source's prompt override), marks cards .cleared, and rebuilds. Images are NOT copied:
      remapPanelSessionForDuplicate skips the copy position (copyPos = i+1) when remapping panelImages, but
      DOES copy syncState (⟳ persist chains) so the duplicate inherits the source's sync entries. Total limit:
      if the page already has 24 panels the chip warns via statusEl and refuses (the queue's "offer to start a
      new page for overflow" half is deferred to Phase E multi-page; noted in the queue entry). Everything else
      — title, chars, modifiers, loc, action, panel seed, imgCount, protect, prompt override — is copied.
      UPDATE (2026-08-12, author-requested): the ⧉ Duplicate chip MOVED from the bottom-left row (which now
      holds only the 🗑 Clear Images + 🗑 Clear chips, so Clear is isolated and can't be clicked by accident)
      into the top right-aligned chip row (Open All / Save All / ⧉ Duplicate / 🔍 Focus / Export / Prompt /
      Copy Prompt / Generate).
  - PHASE D COMPLETE 2026-08-12 (queue items 5, 7):
    * VIEW MODES (#5 + #7): two fixed full-screen overlays (.view-overlay, z-index 10000, above the hover
      preview; #singleOverlay + #storyboardOverlay, added next to #imgPreview before <script>).
      * STORYBOARD (#5): ▦ Storyboard button (app header, .storyboard-toggle — green outline, visible in ALL
        orientations, unlike the layout toggle). openStoryboard() builds a .storyboard-grid of one .sb-cell
        per panel 1..N (N = current panel count): the cell shows the panel's REPRESENTATIVE image
        (panelImages[p][0] — builds on #4) or, when the panel has no image, a dashed "No image yet" placeholder;
        each cell labels "Panel N — <title>". closeStoryboard() hides the overlay. Content is rebuilt each time
        it opens, so it always reflects the latest images/titles/count.
      * SINGLE-PANEL VIEW (#7): every panel's top chip row has a 🔍 Focus button (openSingleView(i)). It moves
        the ACTUAL panel card element into #singleStage (not a clone — ids/handlers stay live), remembering its
        grid position via card.nextElementSibling (singleAnchor) so closeSingleView() can restore exact order.
        Navigation: #singleList on the left (landscape only — hidden on portrait via media query), a dropdown
        (#singlePanelSel) + ◀ Prev / Next ▶ buttons always, and ↑/↓ arrow keys (singleKeyHandler ignores key
        events from INPUT/TEXTAREA/SELECT so typing isn't hijacked); Esc also closes. singleNavTo(p) swaps the
        stage card (returns old to grid at its anchor, pulls new in). The imgObserver auto-restores images as
        the card moves in/out of view. currentSingle/singleAnchor/singleCard are module state reset on close.
      Both modes re-read getPanelCount() on open, so resequencing/duplicating before opening is reflected.
  - PHASE E COMPLETE 2026-08-12 (queue item 1 + the overflow half of item 2):
    * PAGES (#1): the app now supports MULTIPLE PAGES. 📄 File → Page Setup → "Page:" selector (＋ Add
      Page / 🗑 Delete Page) plus an optional "Page Name" input. Each page has its OWN panel count (1–24),
      its own Seed, its own panels 1..24 (titles, chars, modifiers, loc, action, panel seeds, imgCount,
      protect, prompt overrides) and its own in-session images. App-wide settings stay SHARED: image size,
      image preview delay/on, global keywords, NSFW flag, presets, layout, menu. Persistent shape is now
      panelState = {version:2, ...globals, currentPage, pages:{N: pageData}} where pageData = {name,
      panelCountSel, panelCountCustom, seed, 1..24 panel entries}. Legacy flat v1 localStorage AND old v1
      export files are auto-migrated by ensurePages() (flat → pages{1}); exports now say version 2 and
      import accepts BOTH 1 and 2 (Phase F reworks project export/import properly). Session images + ⟳
      sync state live per page in pageSession[N] = {images, sync}; the `panelImages`/`syncState` variables
      are now `let` and always hold the CURRENT page's objects (reassigned on switch). switchPage(n) stops
      in-flight generations, saves the old page's DOM data (collectPageData) + session, writes panelState
      with currentPage=n, then loadCurrentPage() rebuilds the grid (restorePanelState restores that page's
      inputs/panels/overrides). addPage() creates a default page (4 empty panels) and switches to it;
      deletePage() refuses when it's the only page, else confirms, drops the page + its session, and
      switches to the lowest remaining page number. The page selector label comes from the page name when
      set, else "Page N". Generate / Focus / Storyboard / Move / Duplicate all act on the CURRENT page;
      Generate's status and the Storyboard title name the current page.
    * DUPLICATE OVERFLOW (#2's deferred half): duplicating when the page already has 24 panels now offers
      to start a NEW page containing a copy of that panel as its first panel (panel count 1, all data
      copied incl. prompt override, no images) instead of just refusing; declining keeps the old refusal
      message. duplicatePanel was rewritten for the page shape and deep-copies panel entries (JSON
      round-trip) so the copy is isolated from the source.
    * ZIP EXPORT: Export + Images now walks EVERY page's in-session images (collectAllPageImages =
      pageSession ∪ the current live panelImages) under panels/page-<P>/panel-<i>-<k>.jpg|png.
    * IMPORT: applyImportedSettings now clears pageSession/panelImages/syncState/panelPromptOverrides
      before restoring, so a switched project doesn't show the previous project's session images.
  - PHASE F COMPLETE 2026-08-12 (queue item 9):
    * PROJECT NAME (#9 half): 📄 File → new "Project" panel (top of the File menu) has a "Project Name
      (optional)" input. Persisted at the top level of panelState (collect/restore/reset + exports), shown
      under the page title in the app header (#projectNameEl, hidden when empty), and used for export/save
      filenames: projectSlug() lowercases + hyphenates the name (defaultFileName() →
      "<slug>.json" for Save…/Save as…/per-panel Export, "<slug>.zip" for Export Project). onProjectNameInput
      updates the display + default filename (only when no Save-as handle is remembered) and saves.
    * ZIP IMPORT (#9 half): Import now accepts .json OR .zip (accept attr + isZip detection on
      name/type). A project .zip (from Export Project) is parsed by unzipEntries() — reads the EOCD +
      central directory, supports STORE (method 0) and DEFLATE (method 8, via the browser's native
      DecompressionStream — no external lib), extracts comic-generator-settings.json (matched by filename
      suffix), applies it via applyImportedSettings (clears old session), then parseZipImages() walks every
      panels/page-<P>/panel-<i>-<k>.<ext> entry (legacy no-page zips → page 1) → data URLs, and
      repopulateImportedImages() files them into panelImages (current page) / pageSession[P].images (other
      pages), shows the current page's images via showPanelImage, refreshes all panel buttons, and reports
      the count in backupStatusEl. Imported images are session-only, consistent with the app's image model.
      The .zip settings entry is matched by suffix so a renamed/restructured zip still imports.
    * FIX (2026-08-12): applyImportedSettings wrote the imported charLibrary/locLibrary to localStorage
      AFTER buildPanelGrid()/restorePanelState ran, so panel selections that referenced IMPORTED library
      characters (sel = "lib:char:<id>") silently reset to "none" — the grid restore couldn't see the new
      library options. The library writes now happen BEFORE the settings block, so restorePanelState sees
      the imported library and panel character/location selections round-trip correctly.
  - PHASE G COMPLETE 2026-08-12 (queue item 11):
    * CHANGELOG (#11): Help menu now has an "About / Version History" panel (.about-panel) below "How to
      Use", showing the current version (#aboutVersion, taken from CHANGELOG[0]) and a newest-first list of
      every revision. The data lives in a CHANGELOG array (const, near ART_STYLES) of {ver, date, title,
      items[]} entries, rendered by renderChangelog() (called once at init; DOM-built so no escaping
      concerns). Versions are timestamp-based: YYYY.MM.DD.R where R is the revision ordinal for that day
      (2026.08.10.1 initial → 2026.08.12.6 Phase F; the next change session adds a new entry with the next
      ordinal/date). To add a revision, a future session only needs to prepend a new CHANGELOG entry (and,
      for accuracy, a matching dev-note block). SUPERSEDED 2026-08-13: the changelog now lives in
      `src/CHANGELOG.md` (see the CHANGELOG LOCATION note near the top of these notes) — prepend there, not
      in a JS array.
  - STOP + HIDE PANELS (re-implemented 2026-08-13, author-requested): these existed per the changelog
    (2026.08.13.2) but were LOST in a file-merge — the workspace index.html was an older version that never
    had them. Re-added: (1) per-panel ■ Stop button (.btn-view.btn-stop, `hidden` unless a Generate All run
    is active — setStopButtonsVisible) → haltGenerations() sets `stopRequested`, stops all in-flight gens,
    marks boxes `.stopped` ("Stopped — generation cancelled.") and deletes their images, sets the status;
    generateComicPage sets stopRequested=false + generateAllRunning=true at start, breaks on stopRequested
    OR pausedByVisibility, and resets the buttons in finally. renderPanelSlot bails early (and its catch
    returns 'cleared') when stopRequested is set, and generateSinglePanel/Slot clear a stale stopRequested
    via `if (!generateAllRunning) stopRequested = false;`. `stopAllGenerations` (page-switch/delete paths)
    still marks `.paused` (not `.stopped`). (2) ▧ Hide/Show Panels header button (#panelsToggleBtn) toggles
    `body.panels-hidden` → CSS hides `.canvas-frame` only (menu + ⚡ Generate bar stay visible; generation
    keeps writing to panelImages, imgObserver evicts srcs while hidden). Persisted as 'comicGen.panelsVisible'
    (PANELS_VISIBLE_KEY, '1'/'0'), restored at init, exported/imported (buildExportData/applyImportedSettings),
    reset by resetEverything. `.stopped` was added to every box/card class-reset list so rerolls/clears clear it.
    UPDATE (2026-08-13, author-requested): the per-panel ■ Stop buttons were REPLACED by ONE global ■ Stop
    button (#globalStopBtn, .btn-stop-global) sitting next to the ⚡ button in .gen-actions (.gen-row flex).
    It is ALWAYS VISIBLE, enabled only while a Generate All run is active (setStopButtonEnabled(true/false)
    toggles its disabled state; called at run start / in finally / by resetEverything). haltGenerations()
    and all the stopRequested flow are unchanged. The per-panel `.btn-view.btn-stop` markup + CSS and
    `setStopButtonsVisible` are gone.
  - STOP BUTTON NOT-SHOWN REPORT (2026-08-13, resolved — NOT an issue): author reported the global ■ Stop
    button (#globalStopBtn) missing on mobile; investigation found the markup/CSS/logic all correct (always
    visible, enabled while a Generate All runs, no mobile-specific hiding rule) and the author then
    confirmed on-device that the button is present → closed, no code change (logged in src/ISSUES.md).
    LATENT OBSERVATIONS left as-is per that resolution, candidates for a future fix: (1)
    `body.menu-hidden .menu-frame { display:none }` hides the WHOLE generate bar with the menu —
    contradicts changelog 2026.08.13.2's "⚡ stays visible when the menu is hidden" promise (regression
    carried in by the older-index.html merge; fix = hide only `.menu-scroll`); (2) `.gen-actions` is
    `flex:0 1 auto; min-height:0` inside the 45dvh `.menu-frame`, so tall `.menu-scroll` content on short
    screens (phones) can flex-squeeze the generate row out of view (fix = `flex:0 0 auto`).
  - SHOW / COLLAPSE MENU BUTTONS (restored 2026-08-13, author-requested; changelog 2026.08.13.1, also lost in
    the same merge): each panel's action row now leads with a blue Show Menu button
    (`.btn-view.menu-show`, onclick `showPanelMenus(${i})`) that opens ALL of that panel's `.panel-acc`
    accordions at once (including the nested 📖 Panel Library sub-accordions), and the ⚙ Panel accordion body
    now leads with a Collapse Menu button (`.btn-panel-menu`, onclick `collapsePanelMenus(${i})`) that sets
    them all back to collapsed. Implemented via `setPanelAccsCollapsed(card, collapsed)` (iterates
    `card.querySelectorAll('.panel-acc')`, sets data-collapsed) + `showPanelMenus`/`collapsePanelMenus`
    (all exported on window).
  - PANEL INFO SUMMARY (2026-08-13, author-requested): each panel card has a one-line `.panel-summary`
    under the header row — `.ps-char` (selected character names comma-joined, or "No Character Selected"),
    ` · `, `.ps-loc` (location option text, or "No Location Selected"), ` · `, `.ps-act` (action prompt;
    `flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis` truncates it with "…", or "No
    Action Prompt" when empty). `updatePanelSummary(i)` (exported) reads the selects/action and sets the
    spans + a `title` tooltip with the full text. Wired into: handleGridInput (user edits), propagateSlot
    (⟳ chains), restorePanelState (refresh-all after restore), resetEverything, clearPanelImage.
    Also: `[No Location Selected]` → "No Location Selected" (LOC_OPTIONS, matching the character dropdown).
  - UI NOTE (2026-08-12, author-requested): the Backup group (💾 Save… / 💾 Save as… / ⬇ Export Project
    (.zip) / ⬆ Import Project) moved from the 📄 File → "Page Setup" panel to the 📄 File → "Project"
    panel, sitting right under the Project Name input; its label reads "Backup Project:". Page Setup now
    ends at Image Preview Delay. Help text + the PER-PANEL EXPORT dev note updated to match.
  - PROTECT IMAGE (2026-08-12, author-requested) — SUPERSEDES the Phase B PROTECT note: the per-panel 🔒
    Protect header checkbox was REMOVED; every image slot now has a 🔓 Protect / 🔒 Protected chip
    (.btn-img-protect) in its .slot-btns row (beside ⭐ Cover). The chip is disabled while the slot has no
    image, but the protect flag is DORMANT-PERSISTENT: on a fresh load (images are session-only) a
    protected slot keeps protectSlots=true with its chip disabled — the setting survives reloads even
    though the image doesn't, and re-arms the moment an image exists (chip enabled + active). Only
    EXPLICIT clearing unprotects a slot: the per-slot ✕, 🗑 Clear Images, and 🗑 Clear all call
    setSlotProtected(...,false) (in clearPanelImageSlot / clearPanelImages / clearPanelImage);
    setPanelImageButtons itself never unprotects. State is per-SLOT:
    panelState[i].protectSlots is a 4-bool array (index k-1, like panelImages); old saved `protect: true`
    migrates to all four slots protected. Helpers: isSlotProtected(i,k) reads the chip's .active class,
    setSlotProtected(i,k,on) sets label+active, toggleSlotProtect(i,k) (exported) flips + saves, and
    makeRepresentative ALSO swaps the two slots' protect flags so protection follows the image when a ⭐
    Cover swap happens. Generation guards: generateSinglePanelSlot refuses a protected slot ("Image k of
    Panel i is 🔒 protected"); generateSinglePanel KEEPS protected slots (never clears their src/buttons)
    and regenerates only unprotected ones — a fully-protected panel returns 'protected', a mixed panel
    reports "regenerated N, kept M protected", and the empty-content skip path leaves protected images
    intact (returns 'protected' instead of skipping). Explicit clear chips (per-slot ✕, 🗑 Clear Images,
    🗑 Clear) still clear protected images AND unprotect them — protection guards GENERATION overwrites
    only, same philosophy as the old panel protect. resetEverything unprotects all slots.
  - IMAGE-SERVICE ERROR-TILE DETECTION + FRACTIONAL-GUIDANCE BUG (2026-08-12, bug report — ROOT CAUSE
    FOUND): the REAL cause of "generate does nothing" was the text-to-image-plugin REJECTING fractional
    guidanceScale values. When any generateImage option is invalid, the plugin returns an ERROR TILE — a
    plain String (observed: "(text-to-image-plugin: <b>guidanceScale</b> should be a whole number between 1
    and 30...") — synchronously, NOT a thenable. withTimeout's Promise.race resolves instantly with that
    string, result.dataUrl is undefined, and the app reported 'generated' with no image — silent nothing
    (also why a probe saw `p.then is not a function`; there was no plugin wedge, the slider sat at 9.5 the
    whole time). FIX (v2026.08.12.12): slider step changed 0.5→1; onGuidanceScaleChange + restorePanelState
    round/clamp to integers 1–30 (migrating a saved 9.5 → 10); renderPanelSlot parseInts. HARDENING
    (v2026.08.12.11, kept): renderPanelSlot guards `if (!result || !result.dataUrl) throw new Error(...)` so
    ANY plugin option/rejection error shows a clear .failed box + alt message instead of silent success, and
    generateComicPage's per-panel loop catches generateSinglePanel failures as 'error' in the "Done:" status.
  - GENERATE-AFTER-BACKGROUND FIX (2026-08-12, bug report): after a tab-went-to-background pause
    (visibilitychange handler sets pausedByVisibility=true and stops in-flight generations), clicking a
    panel 🔄 Generate chip or a per-image 🔄 chip did NOTHING: generateSinglePanel / generateSinglePanelSlot
    never reset pausedByVisibility (only generateComicPage did), so a subsequent failing or timed-out
    generation was silently swallowed as 'cleared' by renderPanelSlot's catch (`if (pausedByVisibility ||
    ...) return 'cleared'`) — no status, no error. FIX: both now set `pausedByVisibility = false;` right
    after the panelBusy guard, so any user-initiated generation clears the stale pause (generateComicPage
    already did this). Note: the pause still applies mid-generate-all (the loop re-checks the flag after each
    panel and breaks, and the visibilitychange handler re-sets it on the next backgrounding).
  - GUIDANCE SCALE SLIDER (2026-08-12, author-requested): a "Prompt Obedience (guidance scale)" slider
    (#guidanceScaleInput, type=range, 1–30 step 1, DEFAULT 7) lives in File → Page Setup right under
    Image Size. WHOLE NUMBERS ONLY — the text-to-image-plugin REJECTS fractional guidanceScale and returns
    an error tile (see the IMAGE-SERVICE ERROR-TILE note); onGuidanceScaleChange/restorePanelState/
    renderPanelSlot all round/clamp to integers 1–30. Visual passive warning: the track is a fixed
    green→yellow→red gradient (green 0–33% ≈ 1–10,
    yellow 33–50% ≈ 10.5–14.5, red 50–100% ≈ 15–30) and the live value readout (#guidanceScaleValue)
    recolors via .guidance-value.g-low/.g-mid/.g-high (green ≤10.5, yellow 10.5–14.5, red ≥15) — the
    diminishing-returns zone. Persisted at top level of panelState as `guidanceScale` (collect/restore/reset
    + auto in exports; old/imported files without it fall back to 7). Applied at GENERATION TIME in
    renderPanelSlot: reads the slider, sets opts.guidanceScale on the root.generateImage() options object
    (NOT appended to the prompt text, so Copy Prompt / the prompt editor stay clean) — every generation path
    (panel, slot, Generate All) goes through renderPanelSlot, and prompt overrides are unaffected since
    guidanceScale is a generation option, not prompt text. Handler onGuidanceScaleChange() (exported,
    oninput wired) updates the readout + schedulePanelSave. Note for the author: guidanceScale 15+ causes
    oversaturation/halo/text artifacts — hence the red zone.
  - IMPORT WARNING + NUKE (2026-08-12, author-requested): importing (File → Project → ⬆ Import Project)
    now first checks hasActiveProject() (live session images in panelImages/pageSession, or any non-default
    saved state: project name, NSFW flag, non-default keywords, >1 page, page name/seed/panel count,
    any panel content incl. imgCount≠1 or protectSlots) and, if true, shows a three-choice modal
    (#importConfirmOverlay, z-index 11000 above view overlays): 💾 Save & Import (await saveSettings() =
    the silent Save… — then imports), Continue (imports without saving), Cancel (aborts). The chosen file is
    stashed in pendingImportFile/pendingImportIsZip and run by doImportFile(file,isZip) (extracted from
    importSettingsFromFile, which now always resets the input value immediately so the same file can be
    re-chosen). "NUKE": applyImportedSettings STARTS by clearing every protect chip
    (for i=1..24, k=1..4 setSlotProtected(i,k,false)) so an import wipes protection from the old project
    before the imported settings (with their own protectSlots) replace localStorage + restorePanelState.
    The existing pageSession/panelImages/syncState/panelPromptOverrides clears follow, so nothing — not even
    protected images — survives an import.
  - MULTI-IMAGE PANELS (2026-08-11, author-requested): every panel has an "Images:" selector
    (panel-img-count-N, 1-4, DEFAULT 1 — the "1" option has the `selected` attribute; restorePanelState only
    overrides it when a valid saved value exists, so new/imported panels always start at 1, persisted in
    panelState[i].imgCount) controlling how many images render per
    panel. All images use the SAME panel prompt; slot k is generated with seed + (k-1) when a seed is set so
    they vary. Each panel card has FOUR image slots (imgbox-panel-N-K / img-panel-N-K), hidden beyond the
    chosen count; panelImages[i] is now an ARRAY (index k-1 = data URL; hidden slots keep their image if you
    raise the count again). Each slot is a .panel-img-slot wrapper (id imgslot-panel-N-K — hide THIS when
    shrinking the count, not the box) containing the image box (imgbox-panel-N-K / img-panel-N-K) and, BELOW
    the image, a .slot-btns row with ↗ Open / ⬇ Save (openPanelImage/savePanelImage, now (i,k);
    setPanelImageButtons targets #imgslot-panel-N-K) and ✕ Clear this image (clearPanelImageSlot — clears that
    slot only, marks the box `.cleared` so its in-flight generation aborts with 'cleared' while the other slots
    keep generating). NOTHING overlays the images (the old absolute .img-chips overlay was removed).
    NOTE (2026-08-11): button LABELS on the panel-level and per-image reroll buttons now read "🔄 Generate"
    (function names/classes unchanged: btn-reroll / btn-img-reroll / generateSinglePanel / generateSinglePanelSlot).
    Failed/paused/generating overlay states live on the BOX (per-slot). generateSinglePanel loops slots and
    returns 'generated'; a per-slot failure returns 'error' (earlier slots keep their images).
    exportZip writes panels/panel-N-K.jpg.
  - OPEN/SAVE ALL (2026-08-11, author-requested): each panel's bottom .panel-header-btns row now has
    ↗ Open All (openPanelAll — opens every image of the panel in new tabs via blob URLs) and
    ⬇ Save All (.zip) (savePanelAll — zips all panel images as comic-panel-N.zip using the existing buildZip,
    entries named panel-N-K.jpg|png). Both are disabled until hasPanelImages(i) is true; setPanelImageButtons
    calls updatePanelAllButtons(i) after every per-slot change, so the state always tracks the images.
    Per-image ↗ Open / ⬇ Save chips remain below each image. resetEverything explicitly re-disables all
    per-slot + panel-level chips after clearing panelImages.
  - PANEL PROMPT EDITOR / OVERRIDE (2026-08-11, author-requested): each panel has a 📝 Prompt chip
    (togglePromptEditor, exported on window) that opens an inline .prompt-editor (prompt-pos-N / prompt-neg-N
    textareas) populated from buildPanelPrompt(i) — the full positive + negative prompt incl. preset keywords.
    Typing in the editor stores panelPromptOverrides[N] = {pos, neg} (persisted in panelState[i].promptOverride,
    restored on load, cleared by Reset), and buildPanelPrompt returns {fullPrompt: override.pos,
    negativePrompt: override.neg, hasContent: pos non-empty} when an override exists — so ALL generation paths
    (generateSinglePanel, per-image reroll, generateComicPage) and Copy Prompt use the override. Edits do NOT
    write back to the interface fields. Interface changes RESET the override: the grid's delegated input/change
    handler (handleGridInput) matches panel-char-*/panel-loc-*/panel-act-* ids → clearPanelPromptOverride(i),
    and global keywords / NSFW / presets (initKeywords + applyPreset) call clearAllPromptOverrides(); any OPEN
    editor is repopulated from the new defaults. Seed + image-count changes do NOT reset (not prompt content).
    Editor open/closed state itself is NOT persisted (session-only).
  - PANEL INPUT SIZING (2026-08-11, author-requested): the panel's text-entry controls are now
    <textarea rows="2"> ELEMENTS (char modifiers panel-char-extra-N-S, location modifier panel-loc-extra-N,
    action panel-act-N) so they ACTUALLY wrap and show two lines — `<input>`s can't. `.panel-card
    input[type="text"], .panel-card textarea` sets line-height 1.4 + extra vertical padding + min-height
    calc(2.8em + 18px); textareas get font-family:inherit + resize:vertical. The action textarea keeps
    Enter-to-render (Shift+Enter inserts a newline). The per-panel Seed input (panel-seed-N) is EXEMPT —
    stays a 1-line <input> via `.panel-card input[id^="panel-seed-"]` (padding 8px, min-height auto).
    The Library's saved character/location DESCRIPTION fields (renderLibrary → descInput) are ALSO 2-row
    .lib-desc textareas matching the panel textareas (same .lib-desc sizing rule) so they wrap/edit the same
    way — but they have NO Enter handler (nothing to reroll there); Shift+Enter/newlines work by default.
    The Library Name field stays a single-line input.
  - IMAGE SIZE + OPEN/SAVE (2026-08-11): size chosen in File menu (imageSizeSel: 512x512 / 768x768 default /
    1024x1024 / 1920x1080 / 1080x1920 / custom W×H ≤ 1920×1080). The text-to-image plugin only generates at
    512x512 | 512x768 | 768x512 | 768x768, so pickSourceResolution() picks the closest aspect and
    upscaleDataUrl() cover-crops + upscales to the target on a canvas (JPEG q0.92); native if already exact.
    Each image slot has ↗ Open (openPanelImage) and ⬇ Save (savePanelImage) chips (both take (i,k)) that act
    on the slot's data URL via a Blob URL (data: URLs are blocked as top-level navigations); they're disabled
    whenever that slot has no image (setPanelImageButtons(i,k,has)). Image size is persisted in
    comicGen.panelState (imageSizeSel/W/H).
    NOTE (2026-08-11): chips overflowed the card at some widths — .panel-header-btns now wraps
    (flex-wrap: wrap). Open/Save also swallow errors + fall back to an <a target=_blank> click when
    window.open is popup-blocked (e.g. inside sandboxed preview frames, which may log console errors —
    that's the frame, not the code; it works on the deployed page).
  - MOBILE MEMORY HARDENING (implemented 2026-08-10):
      * Off-screen panel images are EVICTED from the DOM: generated data URLs live in the `panelImages`
        JS object; an IntersectionObserver (`imgObserver`) sets/clears each slot's img.src as cards scroll
        in/out. Use `showPanelImage(i, k, dataUrl)` to display a new image — never assign img.src directly.
      * In-flight generations are tracked in the `inFlightGen` Map (key = {i, k} per slot); when the tab goes
        to background a visibilitychange handler stops them, marks the slot boxes `.paused`, and sets
        `pausedByVisibility` so the generateComicPage loop breaks. Reroll retries.
  - NEVER ADD auto-reload/watchdog code to this generator. The original mobile-tab hang was caused by one.
  - The whole script is an IIFE; internal functions exist on window only if explicitly exported
    (e.g. window.showPanelImage). Export what you need to debug.
  - localStorage keys: comicGen.charLibrary, comicGen.locLibrary, comicGen.panelState, comicGen.preset,
    comicGen.activeMenu (open accordion section), comicGen.layoutMode (menu top vs side).
    sessionStorage 'comicGen.watchdogReloads' is legacy and only ever removed.
  - OPEN QUESTION from author: a "split view / new-frame" option they saw in the perchance EDITOR UI
    (not in this code) that stopped appearing. Unresolved — likely a platform/editor feature, not generator code.
  - See the TROUBLESHOOTING NOTE below for the resolved mobile-tab-hang history.


  TROUBLESHOOTING NOTE (2026-08-10, mobile editor tab hang):
  - Symptom: on the author's phone, the perchance EDITOR tab goes blank and shows the browser's rotating
    restore spinner, persisting (stuck tab-restore/reload loop). Works fine on other devices.
  - Trigger: author pressed "back" during a previous AI session's operation (~2h prior).
  - Current code verified lean + error-free (page builds 24 panels, no console errors, no external scripts).
  - Leftover from the old session: sessionStorage key comicGen.watchdogReloads = "0". The old watchdog
    auto-reload code is GONE from the current files, but if the phone tab is running stale cached code
    it may loop reload -> blank -> spinner. Full-close the tab to break the loop.
  - Suspected root cause: mobile memory pressure. 24 generated images held as base64 data URLs in DOM
    img.src (~30-70MB decoded) + perchance editor + in-flight generation iframes => browser kills tab.
  - IMPLEMENTED (2026-08-10): off-screen panel images are evicted from the DOM (kept as data URLs in JS,
    restored via IntersectionObserver); in-flight generations are stopped and the run pauses when the tab
    goes to background (visibilitychange); panel <img> has loading="lazy" + decoding="async"; no auto-reload
    code exists and none should be added.
  - Status: resolved — hang was stale session state in one tab (old cached watchdog + session leftovers);
    cleared on full tab close/reopen. Author retested clean.
