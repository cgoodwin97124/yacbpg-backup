# Generation queue — V1 spec (2026-10-13/14)

Answers: tickets/GQ-01, GQ-02, GQ-03 (all 11 answered 2026-10-14). Author accepted the risk and asked for a full spec before any build; no implementation until go-ahead.

## 1. Model

- New module-level genQueue array, session-only: never saved, never exported, dies on reload (answer 3a).
- Item: {key, panel i, slot k|null}. slot null = whole panel (unprotected slots resolved at render time). key = unique id so rows survive reorder.
- Dedupe (decision D1, author may veto): enqueueing a panel+slot already pending is skipped with a status notice. Re-enqueueing a finished item is allowed.

## 2. Entry points

- In-panel Generate becomes a split dropdown: Generate now / Add to queue. The button face stays on whichever was used last (sticky, per 2a note).
- Selection-bar Generate gets the same dropdown. Multi-select Generate Now = implicit queue in panel order (req 1); the queue panel opens so order can be reviewed, and the run starts immediately if idle (req 6: rearrange allowed if desired, no forced friction).
- Per-slot reroll arrows get Reroll now / Queue this slot (answer 1b).
- Generate All / To Here / From Here / Range keep today's immediate run when the queue is empty and nothing runs (decision D2, author may veto). If a queue exists or a run is active, their panels APPEND to the queue instead of today's silent refuse.
- Single-panel Generate Now while idle runs immediately (runPanelSingle, no queue theater). While a run is active it auto-appends to the end (answer 2c).
- Generate-queued controls (answer 2b): a page-level button beside GENERATE ALL, a run-panel control, and a Commands palette entry under Generate. Idle + non-empty opens the queue panel and starts; empty shows a notice.

## 3. Runner

- New queue runner drains genQueue FIFO. Page-run code paths are otherwise untouched (minimal blast radius).
- At start the runner snapshots and expands whole panels into (panel,slot) units over unprotected slots only; protected/kept semantics unchanged.
- Non-round-robin: units render grouped by queue item. Round-robin: units render ordered by (slot number, queue position) — today's slot-major logic over the snapshot order (answer 3b).
- Prompts for pending units rebuild on resume (so reorder + edits apply); completed units are never re-rendered. Seeds pin at unit render exactly as today, so reorder cannot disturb them.
- Pause keeps today's meaning (in-flight unit restarts on resume); reorder/remove enabled only while paused or idle (answer 2d). Progress = completed-unit set, which is what makes pause/reorder/resume coherent (today's resumePanel/resumeSlot assume contiguous ranges and cannot express a reorder).
- Stop halts the run but pending items STAY queued; Generate queued resumes, Clear empties (decision D3, author may veto).
- A failed image is marked failed and the queue continues (answer 2e). Tallies, status text, and notifications keep today's shape, counted across the queue.

## 4. Queue panel UI (answer 3d: queue panel + clear-queue button are V1)

- The existing run panel grows up/down/remove controls per row (enabled while paused/idle), a Clear-queue button, and the Generate-queued/Start control. Rows reuse today's state badges. No badges on panel cards in V1. Movable/minimizable explicitly NOT V1.

## 5. Explicitly not V1

Cross-page queues (later, per 3c note), persistence, movable panel, priorities, card badges.

## 6. Verification

- New regression pins: FIFO order, multi-Now treated as panel-order queue, append-while-running, pause-reorder-resume honors new order, remove pending, clear, queued slot renders, round-robin snapshot order, stop-keeps-pending, sticky button face, Commands entry present.
- Full suites (core, diff-core, smoke, fixtures, state-diff, gen) green with byte-identical restores before ship. Single release (tall but atomic; flagging the risk per author note).