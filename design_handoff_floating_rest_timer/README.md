# Handoff: Floating Rest Timer (Chunk C-2)

> Implementation handoff for the **悬浮休息计时器** task described in `PLAN.md` Chunk C.
> Target branch: `feat/floating-timer-impl-claude`
> Design fidelity: **High** — match prototype pixel-for-pixel within the existing Rhodes design system.

---

## 1. The reframe

The existing `RestTimer.jsx` is built as a **countdown tool** the user manages: `+30s`, `-10s`, `GO`, cancel. User research (n=1, the app's developer) revealed:

> "我基本不会去点 +30s -10s 这些按钮，也懒得点 GO。"

The user wants to **glance and know "歇够了没"**, not operate a stopwatch. This redesign collapses the timer to a single ambient indicator with one affordance.

### What changes conceptually

| | Before | After |
|---|---|---|
| Counting direction | **Down** from target | **Up** from 0:00 |
| `target` field | Hard deadline; reaching 0 triggers OVERTIME | **State cue only** — when `elapsed ≥ target`, widget turns green ("READY") |
| `+30s` / `-10s` buttons | Present | **Removed** |
| Cancel button | Present | **Removed** (no equivalent — the only exit is "lock in") |
| `GO` button | Separate small button inside the widget | **The whole widget is the button.** Tapping anywhere on it records `restTime` to the last logged set and dismisses the widget |
| Overtime indication | Red color + `+m:ss` | Green ("READY") + one-shot ding animation. Counter keeps going up; no red state |
| Scope | Lives inside `SessionDashboard` JSX | True global overlay, rendered at App level — survives view changes |

### What stays the same

- `target` value is **per-exercise** (`exercise.targetRest`, default 90s). Drivers: complex movements get longer; isolation gets shorter. The `calculateSmartRest` heuristic in `PlanEditor.jsx` already populates this from `reps` / `rpe`.
- Existing storage: `restState` in `SessionContext` continues to be the source of truth; persisted via the existing debounced-localStorage layer.
- `SAVE_SET` reducer's `isRestUpdate` path is reused to write `restTime` onto the last logged set.

---

## 2. Files to change

### NEW

- `src/modules/tracker/FloatingRestTimer.jsx` — the global overlay component (the V4 variant from the prototype). See §5 below.

### MODIFIED

- `src/modules/tracker/SessionContext.jsx`
  - **Rename `restState.endTime` → `restState.startTime`** (count-up). Update `START_REST`, persistence reads.
  - Add `commitRest()` action: writes `restTime` to last logged set of the last-active exercise, then sets `restState.isActive = false`. Replaces the old `stopRest` semantics for the "lock-in" path. Keep `stopRest` for code paths that need a silent dismissal (e.g. workout end).
  - Track `restState.exerciseId` so `commitRest` knows which exercise's last set to update. `startRest(exerciseId, target)` now takes both.

- `src/App.jsx`
  - Import `FloatingRestTimer` and render it at top level (sibling of `<main>` / Resume pill / bottom nav), inside the `WorkoutSessionProvider`.
  - The component reads `restState` from context and self-shows when `restState.isActive`.

- `src/modules/tracker/SessionDashboard.jsx`
  - **Delete the existing "Global Floating Rest Timer" JSX block (lines 386-406)** — the real global timer replaces it.
  - **Bug fix:** `startRest(ex.rest || 90)` → `startRest(ex.id, ex.targetRest || 90)`. Field was misnamed; per-exercise rest never actually took effect.
  - Remove `restInitialSeconds` `useMemo` (no longer needed once `RestTimer` is gone).

- `src/modules/tracker/RestTimer.jsx`
  - **Delete the file.** All its responsibilities move to `FloatingRestTimer.jsx`.

- `src/modules/tracker/ExerciseLogger.jsx`
  - No changes needed — it already calls `onNext('REST_START')` which the dashboard translates into `startRest`. Only the signature changes (now needs `exerciseId`).

### Backwards compatibility

- Existing `active_session` localStorage payloads carry `restState.endTime`. On load, if `endTime` exists but `startTime` doesn't, derive: `startTime = endTime - target * 1000`. Then `endTime` can be dropped. Put this in `loadInitialState` in `SessionContext`.

---

## 3. State model (final)

```js
restState = {
  isActive: boolean,
  startTime: number | null,     // ms epoch; renamed from endTime
  target: number,                // seconds; cue for "ready" state, not a deadline
  exerciseId: string | null,     // which exercise this rest belongs to
}
```

### Actions

```js
startRest(exerciseId, target = DEFAULT_REST_SECONDS)
  → restState = { isActive: true, startTime: Date.now(), target, exerciseId }

commitRest()
  → reads elapsed = Math.floor((Date.now() - restState.startTime) / 1000)
  → dispatches SAVE_SET for { exerciseId: restState.exerciseId, setData: { isRestUpdate: true, restTime: elapsed } }
  → restState.isActive = false

stopRest()  // unchanged: silent dismissal, no restTime recorded
  → restState.isActive = false
```

---

## 4. Visual spec (V4 Corner Marker)

The prototype canvas explores 4 directions; **the chosen direction is V4 Corner Marker**. See `prototype/timers.jsx → TimerV4_Corner` for reference implementation.

### Position
- `position: fixed`
- Bottom-right corner of the viewport, offset to clear bottom nav + FINISH button:
  ```css
  right: 12px;
  bottom: calc(/* nav height */ + /* finish-bar height */ + 12px);
  ```
- When on a non-workout view (no FINISH bar): bottom offset = `navHeight + 12px`. Detect via `view !== 'WORKOUT_DASHBOARD'` or pass `showFinishBar` prop from App.
- `z-index: 50` (above bottom nav at z-50, below modals at z-100).

### Dimensions
- **68px × 68px** square. No border-radius (Rhodes squared aesthetic).

### States

| State | Background | Border | Text color | Animation |
|---|---|---|---|---|
| **REST** (elapsed < target) | `var(--color-bg)` | `1px solid var(--color-border)` | `var(--color-text-muted)` for label, `var(--color-text-main)` for time | none |
| **READY** (elapsed ≥ target, not just crossed) | `var(--color-primary)` | `1px solid var(--color-primary)` | dark ink (`#1a2e05` on light, `#0b0b0d` on dark) for both | `restPulse 1.8s ease-in-out infinite` (scale 1 ↔ 1.025) |
| **DING** (one-shot, fires on the rising edge of `elapsed ≥ target`) | (same as READY) | (same) | (same) | `restDing 0.5s ease-out` overrides pulse; + outward halo ring (`restHalo 0.55s`) — iOS PWA stand-in for `navigator.vibrate(80)` |
| **LOCKED** (1.4s after tap, before dismissal) | `var(--color-primary)` | `1px solid var(--color-primary)` | dark ink | none; pulse stopped |
| **IDLE** (post-lock dismissal) | n/a | n/a | n/a | fade out + `translateY(8px) scale(0.92)`, 320ms; `pointer-events: none` |

### Inner layout

```
┌─[Tech corner L]──[Tech corner L]──┐
│                                    │
│          REST   ← 7px mono         │
│         0:45    ← 17px mono 900    │
│                                    │
└─[Tech corner L]──[Tech corner L]──┘
   └─ bottom progress bar ─────────┘  ← 2px, fills left→right as elapsed/target
```

- **Tech corners**: 6px × 6px L-shaped, 1.5px stroke, inset 3px from each corner. Color = `var(--color-primary)` in REST state, `primaryInk` in READY/LOCKED states. (See `prototype/mock.jsx → TechCorners` for the SVG-less div-based implementation.)
- **Progress bar**: along the bottom edge, 2px tall, full width minus 2px (1px inset each side to align with the border). Hidden in READY/LOCKED (filled = `transparent`, background already conveys completion).
- **Label**: `JetBrains Mono`, 7px, weight 700, `letter-spacing: 0.25em`, line-height 1, lowercase tracking via `text-transform: uppercase`. Text: `REST` / `READY` / `LOGGED`.
- **Time**: `JetBrains Mono`, 17px, weight 900, `letter-spacing: -0.05em`, `font-variant-numeric: tabular-nums`, line-height 1, margin-top 2px from label.
- **Shadow**:
  - Light theme: `0 4px 16px rgba(0,0,0,0.15)`
  - Dark theme: `0 4px 16px rgba(0,0,0,0.6)`

### Animations (CSS)

```css
@keyframes restPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.025); }
}

@keyframes restDing {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(132,204,22,0.5); }
  40%  { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(132,204,22,0.25); }
  100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(132,204,22,0); }
}

@keyframes restHalo {
  0%   { opacity: 0.9; transform: scale(1);    }
  100% { opacity: 0;   transform: scale(1.45); }
}
```

The halo is a separate child div (`position: absolute; inset: -2px; border: 2px solid var(--color-primary)`) only mounted while the ding is active.

---

## 5. Component behavior

### Render conditions
- Renders nothing when `!restState.isActive`.
- Stays mounted across view changes (App-level render).

### Tap behavior (`onClick`)
1. Snapshot `elapsed = Math.floor((Date.now() - restState.startTime) / 1000)`.
2. Enter local phase `'locked'`: freeze displayed time at the snapshot, swap label to `LOGGED`, keep background green.
3. After **1400ms**, enter local phase `'idle'`: fade out (opacity 0, translateY 8px scale 0.92, 320ms, `pointer-events: none`).
4. After another **700ms** (or when fade-out finishes), dispatch `commitRest()`. This writes the rest time to the last set and flips `restState.isActive = false`. The component then unmounts naturally.

The 1400 + 700 = 2100ms total dismissal feels intentional but not slow. The "logged → fade → unmount" sequence is purely local UI state; `restState.isActive` only flips at the very end so reads from other components stay consistent.

### Ding edge detection
Track `prevReady = useRef(false)` and `dinged = useState(false)`. In `useEffect`:
- Skip entirely outside the `resting` phase.
- On the rising edge of `elapsed >= target` (`ready && !prevReady`), `setDinged(true)` + `setTimeout(() => setDinged(false), 520)`.
- Reset `prevReady` to `false` when `!ready` (so re-entry after a jump backwards re-fires the ding — relevant only for the prototype Tweaks; production won't go backwards).

### Tick rate
- `setInterval` at **200ms** (5Hz) is enough for a per-second display. Don't burn cycles at 60fps. The CSS animations are independent and run at frame rate.
- Wall-clock based — never accumulate ticks. Compute `elapsed` from `Date.now() - restState.startTime` on each render so background-tab pauses don't drift.

### Persistence
Nothing — all derived from `restState.startTime` + `Date.now()`. After a hard reload mid-rest, the widget snaps back to the correct elapsed and (if applicable) ready state. The ding doesn't re-fire after reload (intentional: avoid surprise ding when restoring an old session).

---

## 6. Design tokens used

All already defined in `src/index.css` under `:root[data-style='rhodes']`. The component must work in both light (`Clinical`) and dark (`Rhodes OS`) themes by relying only on CSS variables, no hardcoded colors except for the `primaryInk` text-on-primary value (handled below).

| Token | Light value | Dark value |
|---|---|---|
| `--color-bg` | `#ffffff` | `#0b0b0d` |
| `--color-primary` | `#84cc16` | `#A4C639` |
| `--color-text-main` | `#09090b` | `#e4e4e7` |
| `--color-text-muted` | `#71717a` | `#71717a` |
| `--color-border` | `#e4e4e7` | `#27272a` |

**`primaryInk` (text on primary background):** light theme uses `#1a2e05`, dark uses `#0b0b0d`. Hardcode these in the component or expose as new variables.

**Halo / ding RGB:** `132,204,22` (the lime in `rgba(...,0.5)`). Hardcode or extract from `--color-primary` at runtime if you prefer.

---

## 7. Acceptance criteria (from PLAN.md §C)

- [ ] Start workout → log a set → widget appears bottom-right
- [ ] Switch to History/Plans/Home → widget still visible, still counting
- [ ] Cross target → one ding animation fires, widget turns green, gentle pulse starts
- [ ] Tap widget → freezes time, label "LOGGED", green held 1.4s, fades out
- [ ] After fade, `sessionLogs[exerciseId][lastIndex].restTime` == captured elapsed seconds
- [ ] Hard reload mid-rest → widget restores at correct elapsed, no re-ding
- [ ] Workout finish → widget disappears (no orphan)
- [ ] Mobile keyboard open → widget stays out of the way (it's already in the corner, but verify it doesn't get pushed off-screen)
- [ ] Both Rhodes themes (Clinical light + Rhodes OS dark) look correct
- [ ] No regressions to V1/V2 history import (`isRestUpdate` writes still parse correctly)

---

## 8. Out of scope for this PR

These were considered and explicitly **deferred**:
- Cancel / abort gesture (no equivalent — the user said cancel is the most useless feature; not implementing).
- Long-press to dismiss without recording — same reasoning.
- Drag-to-reposition (V4 corner is fixed; PLAN.md §C-1 left this as an open question — closing it as "fixed").
- Sound feedback. The visual ding is sufficient. No audio in this PR.
- Per-exercise UI for `targetRest` — already exists in `PlanEditor.jsx`, no changes needed.

---

## 9. The bundled prototype

`prototype/index.html` is a side-by-side exploration of 4 variants × 2 themes on a design canvas. **V4 is the chosen variant.** V1/V2/V3 are kept in the bundle as design context only — they are not to be shipped.

The prototype is an HTML/React/Babel design reference, not production code. Don't copy it verbatim. Match the visual spec above using the existing Rhodes design system tokens and patterns from the codebase.

To view the prototype: open `prototype/index.html` in a browser. The Tweaks panel (bottom-right toggle) lets you adjust target time, speed up the clock, and jump to ready/overtime states.

### File list

```
prototype/
  index.html         ← entry
  app.jsx            ← top-level + Tweaks wiring
  timers.jsx         ← TimerV4_Corner is the production target
  mock.jsx           ← Rhodes-styled mock workout dashboard (for context)
  design-canvas.jsx  ← starter scaffold (not for production)
  ios-frame.jsx      ← starter scaffold (not for production)
  tweaks-panel.jsx   ← starter scaffold (not for production)
```

---

## 10. Suggested PR description (paste into git commit)

```
feat(tracker): floating rest timer as count-up ambient indicator

Replaces the in-dashboard countdown widget with a true global overlay
rendered at App level. Single affordance: tap to lock in rest time.

- New: src/modules/tracker/FloatingRestTimer.jsx (V4 Corner variant)
- Removed: src/modules/tracker/RestTimer.jsx (folded into FloatingRestTimer)
- Removed: in-dashboard "Global Floating Rest Timer" JSX block
- SessionContext: restState.endTime → startTime; new commitRest action;
  tracks restState.exerciseId so commit knows where to write restTime
- Bug fix: SessionDashboard was reading ex.rest (undefined) instead of
  ex.targetRest, so per-exercise rest configuration never took effect
- Backwards-compatible restore: old endTime payloads derive startTime
  on load

Closes: PLAN.md Chunk C-2
Design ref: design_handoff_floating_rest_timer/
```
