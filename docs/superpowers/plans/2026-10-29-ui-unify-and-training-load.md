# UI Unification + Training Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every inner page match the Rhodes Clinical cover, drop the legacy Cyber/dark styles, and add session-RPE training load: a debrief page, a cardio entry, the weekly numbers on the cover and a data page for exporting to AI.

**Architecture:** All new data logic goes into pure modules with Vitest tests: `historyModel.js`, `historyStore.js`, `format.js` and `dataExport.js`. These modules take `storage` and `now` as parameters instead of reading globals. All shared visuals come from one UI kit in `src/components/ui/`, plus a `DialogProvider` that replaces every native dialog. Design tokens live in `src/theme/tokens.js`. Tailwind's colors and the `:root` CSS variables are both generated from that file, so there is only one source.

**Tech Stack:** React 19, Vite 7, Tailwind 3, vite-plugin-pwa, lucide-react, Vitest (new dev dependency, tests only).

**Spec:** `docs/superpowers/specs/2026-10-28-ui-unify-and-training-load-design.md`. Read it before starting. The approved mockups are in `docs/superpowers/specs/mockups/`. Open them in a browser and match them. **Two parts of the mockups are superseded:** the compact START button in `03` (the spec removes START), and the NEXT UP badge in `04` (the spec has no NEXT UP).

## Global Constraints

- Work only on branch `feat/ui-unify-training-load`. Never push to `main`, because a push to `main` deploys to production. Do not push this branch either unless the user asks.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `npm run build` must pass. `npx eslint src` must report **≤ 18 errors** (the baseline).
- No network requests or server dependencies. Data lives only in localStorage.
- Palette (spec §6.2):

  | Token | Value |
  |---|---|
  | primary | `#84cc16` |
  | primary ink | `#1a2e05` |
  | bg | `#ffffff` |
  | surface | `#f4f4f5` |
  | text main | `#09090b` |
  | text muted | `#71717a` |
  | border | `#e4e4e7` |
  | green text on white | `#65a30d` |
  | primary soft fill | `#f7fee7` |
  | cover-only neon | `#D0FD3E` |

- Style rules (spec §6.3):
  - No italic headings, no `rounded-*` corners, no card shadows, no emoji icons (lucide only).
  - No `text-white` and no hard-coded dark colors on inner pages.
  - Page side gutters are 14–16px.
  - Labels and numbers use the monospace font.
- Style C primary button:
  - `#f7fee7` fill, 2px `#84cc16` border, 4px left bar in the primary color
  - A small mono label row above a bold action word, and a chevron on the right
  - Clip path `polygon(0 0,100% 0,100% 70%,95% 100%,0 100%)`
- Compact button: same fill, border and left bar, one centered mono uppercase line, about 38px tall, cut bottom-right corner. Used only for LOG SET.
- Secondary actions are mono uppercase muted text links, e.g. `← BACK TO SESSION`, `SKIP RATING`.
- English UI. Dates use the format `OCT 28 · WED`. Never call `toLocaleDateString(undefined)`. Short Chinese hint text is allowed, e.g. the RPE anchors `1 很轻松 / 5 吃力 / 10 极限`.
- No `window.alert` or `window.confirm` anywhere. Use `useDialog()`.
- Weeks start on Monday and use ISO week numbers.
- Load = `sessionRpe × durationMin`. If RPE is missing or the duration is unknown (missing, 0 or invalid), load is `null`. Such records still count as sessions.
- A record's time is `startTime ?? date`. New records set `date = startTime`.
- Cover: apart from the changes in spec §7.5, the cover must look exactly as it does today. Its `#D0FD3E` elements keep that color.

## Review Focus

1. **Legacy records:** no `type`, `duration: 0`, and `logs` stored as an object keyed by exercise name. These must render in the calendar, the day list and the editor, and must export without crashing. → Task 1 normalizes them and Task 12 exports them, each with a fixture test.
2. **Reload or midnight during debrief:** the app must reopen on the debrief page, and the saved record must belong to the day the session started. → Task 8 has a reducer test for restore and a builder test showing `date === startTime`.
3. **Bad minutes input** (empty, `0`, `-5`, `abc`, `12.7`): must never produce a `NaN` load or negative times, and SAVE stays disabled. → Task 8 tests `parseMinutes`; Tasks 9 and 10 disable SAVE when it returns `null`.
4. **ISO week edges:** a Sunday-night session counts in its own week, and the year-end weeks (2026 has a week 53) are handled. → Task 1 has week tests.
5. **Restoring an old backup** that contains `app_style: cyber` or a dark `app_theme` must not bring the dark style back. → Task 12 has a `restoreBackup` test.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/theme/tokens.js` (new) | Palette constants. The only source of colors. |
| `tailwind.config.js` | Colors come from tokens; a plugin `addBase` writes them as `:root` CSS variables |
| `src/index.css` | Rhodes rules become the default (no `data-style` prefix); all Cyber and dark rules are deleted |
| `src/lib/format.js` (new) | `formatDayLabel`, `formatMonthDay`, `formatClock` |
| `src/modules/history/historyModel.js` (new) | Pure functions: record normalization, time, load, weeks, builders, summaries |
| `src/modules/history/historyStore.js` (new) | localStorage read and write, with the storage injected |
| `src/modules/data/dataExport.js` (new) | AI export, ISO times with offset, prompt text, backup and restore |
| `src/components/ui/Button.jsx` | Variants `primary` (style C), `compact`, `link` |
| `src/components/ui/Card.jsx` | Square card with a corner bracket in the primary color |
| `src/components/ui/PageHeader.jsx` (new) | `>_ TAG`, title, subtitle, right-hand slot |
| `src/components/ui/Sheet.jsx` (new) | Bottom sheet with a backdrop |
| `src/components/ui/Dialog.jsx` (new) | `DialogProvider` and `useDialog()` |
| `src/components/ui/RpePicker.jsx` (new) | 1–10 grid, 2 rows of 5, anchors underneath |
| `src/modules/tracker/DebriefView.jsx` (new) | Debrief page |
| `src/modules/history/CardioSheet.jsx` (new) | Create and edit a cardio entry |
| `src/modules/history/RatingSheet.jsx` (new) | Fill in or change RPE and minutes for a strength record |
| `src/modules/data/DataView.jsx` (new) | Replaces `AiManager` |
| Deleted | `HomeView_Cyber.jsx`, `AiManager.jsx`, `UserProfile.jsx`, `PromptGenerator.js` |

Tests are placed next to the modules as `*.test.js`. The `npm test` script runs `TZ=Asia/Shanghai vitest run`, so time-dependent tests are deterministic (+08:00).

---

### Task 1: Test harness, format helpers, history model core

**Files:**
- Modify: `package.json` (add devDependency `vitest`; add script `"test": "TZ=Asia/Shanghai vitest run"`)
- Create: `src/lib/format.js`, `src/lib/format.test.js`
- Create: `src/modules/history/historyModel.js`, `src/modules/history/historyModel.test.js`
- Create: `src/modules/history/__fixtures__/legacyHistory.js`

**Interfaces — Produces:**
- `formatDayLabel(ts: number) -> string` returns `'OCT 27 · TUE'`
- `formatMonthDay(ts) -> 'OCT 28'`
- `formatClock(ts) -> '18:42'` (24-hour clock)
- `normalizeLogs(logs: unknown) -> Array<{exerciseId?, exerciseName, sets: object[]}>`. Arrays pass through; a legacy object becomes `[{exerciseName: key, sets}]`; anything else becomes `[]`.
- `normalizeRecord(raw) -> Record`. Adds `type: 'strength'` when the field is missing. For strength records, `logs` goes through `normalizeLogs`. Every other field is kept.
- `sessionTime(record) -> number`, i.e. `record.startTime ?? new Date(record.date).getTime()`
- `durationMinutes(record) -> number | null`. Returns a finite `duration > 0`, otherwise `null`.
- `recordLoad(record) -> number | null`
- `startOfIsoWeek(ts) -> number`, the local Monday at 00:00
- `isoWeekNumber(ts) -> number`
- `isTrainingDay(day) -> boolean`, true when `!day.isRestDay && day.exercises?.length > 0`
- `lastTrainedDayIndex(history: Record[], plan) -> { dayIndex: number, ts: number } | null`. Uses the newest matching strength record. Match by `planId`/`dayId` when the record has them, otherwise by `planTitle`/`dayName` (trimmed, case-insensitive).

- [ ] **Step 1:** Run `npm install -D vitest`, add the `test` script, then run `npx vitest --version`. Expected: a version number prints.
- [ ] **Step 2: Write the failing tests.** `legacyHistory.js` exports:
  - `legacyRecord`: `{id:1, date:'2026-10-20T10:00:00.000Z', planTitle:'Excel Plan', dayName:'Push', duration:0, logs:{'Bench Press':[{weight:60,reps:8}]}}`
  - `modernStrength`: `{id:2, type:'strength', planId:'p1', planTitle:'Excel Plan', dayId:'d2', dayName:'Push', startTime, date: startTime, endTime, duration:58, sessionRpe:7, logs:[{exerciseId:'e1', exerciseName:'Bench Press', sets:[{weight:62.5, reps:8, rpe:8, restTime:120}]}]}`, where `startTime` = 2026-10-27 18:00 +08:00
  - `cardio`: `{id:3, type:'cardio', activity:'run', startTime, date: startTime, endTime, duration:42, sessionRpe:5}`

```js
expect(formatDayLabel(Date.parse('2026-10-27T18:42:00+08:00'))).toBe('OCT 27 · TUE');
expect(formatClock(Date.parse('2026-10-27T08:05:00+08:00'))).toBe('08:05');
expect(normalizeRecord(legacyRecord).type).toBe('strength');
expect(normalizeRecord(legacyRecord).logs).toEqual([{ exerciseName: 'Bench Press', sets: [{ weight: 60, reps: 8 }] }]);
expect(normalizeLogs(null)).toEqual([]);
expect(recordLoad(modernStrength)).toBe(406);
expect(recordLoad(cardio)).toBe(210);
expect(recordLoad(legacyRecord)).toBeNull();                        // duration 0
expect(recordLoad({ ...modernStrength, sessionRpe: null })).toBeNull();
expect(sessionTime(legacyRecord)).toBe(Date.parse('2026-10-20T10:00:00.000Z'));
expect(isoWeekNumber(Date.parse('2026-10-28T12:00:00+08:00'))).toBe(44);
expect(isoWeekNumber(Date.parse('2026-12-31T12:00:00+08:00'))).toBe(53);
expect(isoWeekNumber(Date.parse('2027-01-03T23:30:00+08:00'))).toBe(53);   // Sunday night, same week
expect(startOfIsoWeek(Date.parse('2026-11-01T23:59:00+08:00'))).toBe(Date.parse('2026-10-26T00:00:00+08:00'));
// lastTrainedDayIndex: id match wins even after rename; legacy falls back to names
const plan = { id: 'p1', title: 'Renamed', days: [{ id: 'd1', name: 'Pull', exercises: [{}] }, { id: 'd2', name: 'Push2', exercises: [{}] }] };
expect(lastTrainedDayIndex([modernStrength], plan)).toEqual({ dayIndex: 1, ts: modernStrength.startTime });
expect(lastTrainedDayIndex([legacyRecord], { id: 'x', title: 'excel plan ', days: [{ name: 'push', exercises: [{}] }] })?.dayIndex).toBe(0);
expect(lastTrainedDayIndex([cardio], plan)).toBeNull();
```
- [ ] **Step 3:** Run `npm test`. Expected: FAIL (modules missing).
- [ ] **Step 4:** Implement both modules. All date math is in local time.
- [ ] **Step 5:** Run `npm test`. Expected: all pass. Run `npx eslint src` and check the error count is ≤ 18.
- [ ] **Step 6:** Commit with the message `test: add vitest, format helpers and history model core`.

---

### Task 2: Remove legacy styles, single token source

**Files:**
- Create: `src/theme/tokens.js`
- Modify: `tailwind.config.js`, `src/index.css`, `index.html` (`theme-color` → `#ffffff`), `src/App.jsx`, `src/modules/home/HomeView_Rhodes.jsx`, `src/modules/tracker/FloatingRestTimer.jsx`
- Delete: `src/modules/home/HomeView_Cyber.jsx`

**Interfaces — Produces:**
- Tailwind color names: `primary`, `primary-ink`, `primary-text`, `primary-soft`, `bg`, `surface`, `surface-hover`, `text-main`, `text-muted`, `border`, `alert`, `neon`
- The same names as CSS variables, e.g. `--color-primary-text` and `--color-neon`, so the existing `[var(--color-*)]` classes keep working.

- [ ] **Step 1: Capture the baseline.** Run the `dev` config from `.claude/launch.json` in the browser pane at 375×812, seed `localStorage.app_style = '{"id":"rhodes"}'`, and screenshot the cover. This is the reference for the cover.
- [ ] **Step 2:** Create `tokens.js`. Import it in `tailwind.config.js` for `theme.extend.colors`, and add a plugin `({ addBase }) => addBase({ ':root': { '--color-…': … } })`. Delete the `:root` color variables, the Cyber defaults and the radius/slant variables from `index.css`. Unwrap every `:root[data-style='rhodes'] X` rule into plain `X`. `surface-hover` is `#e4e4e7` and `primary-dim` is `#65a30d`.
- [ ] **Step 3: Change `App.jsx`.**
  - Delete `THEME_REGISTRY`, `STYLES`, theme and style state, `applyTheme`, `applyStyle`, the theme modal and the Cyber branch of `NavButton`. Make the nav always the opaque Rhodes nav, and always transparent on HOME.
  - On mount, call `localStorage.removeItem('app_style')` and `localStorage.removeItem('app_theme')`, and set `document.documentElement.style.colorScheme = 'light'`.
  - Render `HomeView_Rhodes` unconditionally.
  - Remove the `primaryInk` prop from `FloatingRestTimer`; it now uses `var(--color-primary-ink)`.
- [ ] **Step 4: Change `HomeView_Rhodes.jsx`.** Remove the MODE_SELECT button and the `onOpenTheme` prop. Replace every `primary` color class in this file with `neon` (`text-primary` → `text-neon`, `border-primary/70` → `border-neon/70`, and so on) so the cover keeps `#D0FD3E`.
- [ ] **Step 5: Verify.** Build passes, lint ≤ 18. Screenshot the cover at 375×812 and compare with Step 1. The only difference allowed is the missing MODE_SELECT. Also open a fresh profile with `app_style` set to `{"id":"cyber"}`: the app must still render Rhodes and the key must be removed.
- [ ] **Step 6:** Commit with the message `refactor(theme): single Rhodes Clinical palette, drop Cyber and dark themes`.

---

### Task 3: UI kit, dialogs, plans list

**Files:**
- Modify: `src/components/ui/Button.jsx`, `Card.jsx`, `Input.jsx`
- Create: `PageHeader.jsx`, `Sheet.jsx`, `Dialog.jsx` (all in `src/components/ui/`)
- Modify: `src/main.jsx` (wrap `<App/>` in `<DialogProvider>`), `src/modules/plans/PlanManager.jsx`

**Interfaces — Produces:**
- `<Button variant="primary" label="SESSION · PUSH" onClick disabled>SAVE LOG</Button>` renders style C; `label` is optional.
- `variant="compact"` renders the compact button; `variant="link"` renders a text link; `tone="danger"` on a link colors it with `alert`.
- `<Card active?>`: a square card with a corner bracket; `active` gives it a primary border and a white background.
- `<PageHeader tag="PLAN" title="Excel Plan" sub="2 TRAINING DAYS" right={node} />` renders `>_ PLAN`.
- `<Sheet open onClose title tag>{children}</Sheet>`
- `useDialog() -> { confirm({ title, message, confirmLabel = 'CONFIRM', tone }) -> Promise<boolean>, notify(message, { tone }) -> void }`. `notify` is a toast that disappears after 2.5 s.

- [ ] **Step 1:** Build the kit to match `mockups/02` (option C) and `mockups/01`.
- [ ] **Step 2: Restyle `PlanManager`.** This covers the list, the empty state and the import modal (now a `Sheet`). Use `PageHeader tag="FILES" title="My Plans"`, with `+ IMPORT` and `+ CREATE` as link-style controls on the right. Replace all 6 native dialogs with `useDialog`. For deleting a plan, use `confirm` with `tone: 'danger'`.
- [ ] **Step 3: Verify.** Build and lint pass. At 375px, with two plans made via `+ CREATE`: list, empty state, import (PASTE a JSON plan), and delete confirm. Run `grep -n "alert(\|confirm(" src/modules/plans/PlanManager.jsx`; expected: no matches.
- [ ] **Step 4:** Commit with the message `feat(ui): Rhodes UI kit, in-app dialogs, restyled plans list`.

---

### Task 4: Day picker and plan editor

**Files:** Modify `src/modules/plans/PlanDetail.jsx`, `src/modules/plans/PlanEditor.jsx`, `src/App.jsx` (pass `history` to `PlanDetail`)

**Interfaces — Consumes:** `lastTrainedDayIndex`, `isTrainingDay`, `normalizeRecord` (Task 1); `PageHeader`, `Card`, `Button` (Task 3)

- [ ] **Step 1: Rework `PlanDetail`** per spec §6.4.1 and the left half of `mockups/04` (no NEXT UP).
  - The whole training-day `Card` is a button that calls `onStartDay(index)`, with a narrow `›` column on its right.
  - Rest days render as a thin muted divider (`── REST ──`) that cannot be tapped.
  - The subtitle shows `N TRAINING DAYS`, counted with `isTrainingDay`.
  - A single `LAST · {n}D AGO` badge goes on the result of `lastTrainedDayIndex`. Use `TODAY` when n = 0.
- [ ] **Step 2: Restyle `PlanEditor`.** Add 16px gutters. The footer has a `CANCEL` link and a style-C `SAVE` with label `PLAN`, kept on one line. `Home` becomes a link. Inputs get the square style.
- [ ] **Step 3: Verify.** Build and lint pass. At 375px, a 5-day plan with a rest day in the middle shows days in plan order, the rest divider cannot be tapped, the count excludes the rest day, and tapping any day starts that day.
- [ ] **Step 4:** Commit with the message `feat(plans): tap-to-start day picker with LAST badge, restyled editor`.

---

### Task 5: Workout page

**Files:** Modify `src/modules/tracker/SessionDashboard.jsx`, `src/modules/tracker/ExerciseLogger.jsx`

- [ ] **Step 1: Restyle to match the left screen of `mockups/03`.**
  - Header `PageHeader tag="SESSION · {mm:ss}"` with the day name as the title.
  - Exercise cards use `Card`, with an `active` card for the expanded exercise. No italics.
  - The progress ring and the `NOW` header must be visible on white.
  - Inputs are square on white.
  - LOG SET (and `+ BONUS SET`) use `variant="compact"`.
- [ ] **Step 2:** Replace the 7 native dialogs in the alternatives flow with `useDialog`. **Leave** the FINISH confirm in place; Task 9 removes it.
- [ ] **Step 3: Fix the fixed FINISH bar.** It must sit flush above the nav when the nav is visible, with no overlap and no gap. The FINISH button uses style C with label `SESSION · {DAY}`.
- [ ] **Step 4: Verify.** Build and lint pass. At 375px: log 2 sets, add an ad-hoc exercise, keep it as an alternative (in-app confirm), scroll to the bottom with the nav visible, and confirm nothing overlaps. Run `grep -n "window\.\(alert\|confirm\)" src/modules/tracker`; the only expected match is the FINISH confirm.
- [ ] **Step 5:** Commit with the message `feat(tracker): restyle workout page and logger`.

---

### Task 6: History and tools

**Files:** Modify `src/modules/history/HistoryManager.jsx`, `src/modules/history/OneRepMax.jsx`

**Interfaces — Consumes:** `normalizeRecord`, `normalizeLogs`, `sessionTime`, `formatDayLabel`, `formatClock` (Task 1); the kit (Task 3)

- [ ] **Step 1: Change data access.** Load history through `normalizeRecord`, and assign every record to a day with `sessionTime`. Remove the inline `normalizeLogs` copy.
- [ ] **Step 2: Calendar.**
  - Weeks start on Monday (`M T W T F S S`), with an offset of `(getDay() + 6) % 7`.
  - Restyle to match `mockups/04` (right half).
  - The selected-day heading uses `formatDayLabel` and times use `formatClock`.
  - Fix the monthly card so it counts only records in the shown month **and year**.
  - The page header is `PageHeader tag="LOGS" title="History"`.
- [ ] **Step 3:** Restyle `OneRepMax` (no dark block, no italics, style-C `CALCULATE`). In the TOOLS backup block, replace the emojis with lucide `Download`/`Upload` icons and the 3 native dialogs with `useDialog`. Only restyle it; Task 12 moves it.
- [ ] **Step 4: Verify.** Build and lint pass. At 375px, seed `legacyRecord` from the fixture into `workout_history`. It must appear on its day, open in the editor and save. Switch months with records in two different years and check the counts.
- [ ] **Step 5:** Commit with the message `feat(history): restyle history calendar and tools`.

---

### Task 7: App shell — nav, resume bar, discard

**Files:** Modify `src/App.jsx`

- [ ] **Step 1:** The nav is always opaque with a top border on every view except HOME. HOME keeps the transparent nav over its gradient.
- [ ] **Step 2: Replace the floating RESUME pill.** Use a slim full-width bar fixed directly above the nav.
  - Text `>_ SESSION ACTIVE · {DAY}`, or `STALE SESSION · {DAY}` in amber when it is from another day.
  - Tapping it resumes the session; an `✕` discards it through `useDialog().confirm` with the existing two messages.
  - `<main>` gets extra bottom padding while the bar shows, so nothing is covered.
- [ ] **Step 3: Verify.** Build and lint pass. With an active session, visit every tab at 375px. The bar never covers a header, a back link or content, and discard asks in-app. Run `grep -rn "window\.\(alert\|confirm\)\|[^.]alert(\|[^.]confirm(" src`; the only expected match is the FINISH confirm.
- [ ] **Step 4:** Commit with the message `feat(app): opaque nav and non-blocking session bar`.

---

### Task 8: Session phases, record builder, history store

**Files:**
- Modify: `src/modules/tracker/SessionContext.jsx` (export `reducer` and `initialState`)
- Modify: `src/modules/history/historyModel.js`
- Create: `src/modules/history/historyStore.js`, `src/test/fakeStorage.js` (exports `fakeStorage()`, a Map-backed `getItem`/`setItem`/`removeItem` stub that Task 12 reuses)
- Tests: `src/modules/tracker/SessionContext.test.js`, additions to `historyModel.test.js`, `src/modules/history/historyStore.test.js`. Test plan used throughout: `plan = {id:'p1', title:'Excel Plan', days:[{id:'d1', name:'Push', exercises:[{id:'e1', name:'Bench Press', sets:4}]}]}`, with `sessionExercises = plan.days[0].exercises` and `sessionLogs = {e1:[{weight:60, reps:8}]}`.

**Interfaces — Produces:**
- State gains `phase: 'active' | 'debrief'` (`START_SESSION` sets `'active'`; restoring a state without it gives `'active'`) and `endTime: number | null`.
- Actions `BEGIN_DEBRIEF { endTime }` and `RESUME_ACTIVE` (sets phase `'active'` and `endTime: null`).
- Context gains `beginDebrief(endTime = Date.now())` and `resumeActive()`.
- `parseMinutes(input: string | number) -> number | null` returns an integer ≥ 1, otherwise `null`. Decimals are rounded.
- `sessionSummary(session) -> { setsDone, setsPlanned, volumeKg }`. `setsPlanned` sums `ex.sets ?? 3`; `volumeKg` sums `weight × reps`.
- `buildStrengthRecord(session, { durationMin, sessionRpe, now }) -> Record` with:
  - `id: now`, `type: 'strength'`
  - `planId`, `planTitle`, `dayId`, `dayName`
  - `date: startTime`, `startTime`, `endTime: startTime + durationMin * 60000`, `duration: durationMin`
  - `sessionRpe`, `logs` (the same lookup as the current `App.finishWorkout`), `meta: { appVersion: '0.2.0', source: 'manual_session' }`
- `withRating(record, { sessionRpe, durationMin }) -> Record`:
  - If the record has a `startTime`: set `endTime = startTime + d`.
  - If it is legacy: set `endTime = sessionTime(record)` and `startTime = endTime − d`, and leave `date` unchanged.
- `historyStore`: `readHistory(storage) -> Record[]` (normalized), `writeHistory(records, storage)`, `appendRecord(record, storage)` (prepends), `replaceRecord(record, storage)` (matches by `id`).

- [ ] **Step 1: Write the failing tests.**

```js
const s1 = reducer(reducer(initialState, { type: 'START_SESSION', plan, dayIndex: 0 }), { type: 'BEGIN_DEBRIEF', endTime: 1000 });
expect(s1.phase).toBe('debrief'); expect(s1.endTime).toBe(1000);
expect(reducer(s1, { type: 'RESUME_ACTIVE' })).toMatchObject({ phase: 'active', endTime: null });
expect(reducer(initialState, { type: 'RESTORE_SESSION', payload: { ...s1 } }).phase).toBe('debrief');
expect(reducer(initialState, { type: 'RESTORE_SESSION', payload: { plan, dayIndex: 0 } }).phase).toBe('active');
['', '0', '-5', 'abc', null].forEach(v => expect(parseMinutes(v)).toBeNull());
expect(parseMinutes('12.7')).toBe(13); expect(parseMinutes(58)).toBe(58);
// started 23:30, debrief saved next day: record belongs to the start
const start = Date.parse('2026-10-27T23:30:00+08:00');
const rec = buildStrengthRecord({ plan, dayIndex: 0, sessionExercises, sessionLogs, startTime: start }, { durationMin: 75, sessionRpe: 8, now: start + 9e6 });
expect(rec).toMatchObject({ type: 'strength', planId: plan.id, dayId: plan.days[0].id, date: start, startTime: start, endTime: start + 75 * 60000, duration: 75, sessionRpe: 8 });
expect(withRating(legacyRecord, { sessionRpe: 6, durationMin: 50 })).toMatchObject({ endTime: Date.parse(legacyRecord.date), startTime: Date.parse(legacyRecord.date) - 50 * 60000, date: legacyRecord.date });
// store with a fake storage
const mem = fakeStorage(); appendRecord(rec, mem); expect(readHistory(mem)[0].id).toBe(rec.id);
replaceRecord({ ...rec, sessionRpe: 5 }, mem); expect(readHistory(mem)[0].sessionRpe).toBe(5);
```
- [ ] **Step 2:** Run `npm test`. Expected: the new tests FAIL.
- [ ] **Step 3:** Implement the reducer changes, the builders and the store.
- [ ] **Step 4:** Run `npm test`. Expected: all pass. Run lint and check it is ≤ 18.
- [ ] **Step 5:** Commit with the message `feat(session): debrief phase, strength record builder, history store`.

---

### Task 9: Debrief page

**Files:**
- Create: `src/components/ui/RpePicker.jsx`, `src/modules/tracker/DebriefView.jsx`
- Modify: `src/modules/tracker/SessionDashboard.jsx`, `src/App.jsx`

**Interfaces:**
- `<RpePicker value onChange />`: values 1–10 in 2 rows of 5, with the anchors `1 很轻松 / 5 吃力 / 10 极限` underneath.
- `<DebriefView onSave={(record) => void} onBack={() => void} />` reads the session context.
- Consumes `sessionSummary`, `parseMinutes`, `buildStrengthRecord`, `appendRecord`, `beginDebrief` and `resumeActive` from Task 8.

- [ ] **Step 1: Build `DebriefView`** to match `mockups/01` screen ①.
  - Header `>_ SESSION COMPLETE`, the day name, and `{plan} · {formatMonthDay} · {formatClock(startTime)}`.
  - SUMMARY row: an editable TIME input, defaulting to `max(1, round((endTime − startTime)/60000))`; SETS as `done/planned`; VOLUME in tonnes with 1 decimal.
  - `RpePicker`.
  - A live `LOAD` line `7 × 58 min = 406`, shown only when both the RPE and the minutes are valid.
  - Style-C `SAVE LOG` with label `SESSION · {DAY}`. It is disabled until an RPE is picked and `parseMinutes(time)` is not null.
  - The link `SKIP RATING · 稍后在历史里补`. It saves with `sessionRpe: null`, and is disabled only when the minutes are invalid.
  - The link `← BACK TO SESSION`, which calls `resumeActive()`.
- [ ] **Step 2: Wire it up.**
  - FINISH calls `beginDebrief()` and nothing else (delete the confirm and the `onFinishWorkout` prop).
  - App renders `DebriefView` instead of `SessionDashboard` when `session.state.phase === 'debrief'`.
  - `onSave` does `appendRecord(record, localStorage)`, then `session.endSession()`, then `setView('HOME')`.
  - Delete `App.finishWorkout`.
- [ ] **Step 3: Verify.** Build and lint pass. At 375px: FINISH → BACK → FINISH → reload the page (still on the debrief page) → pick 7, set the time to 58 → SAVE. Then `workout_history[0]` must have `sessionRpe: 7`, `duration: 58` and `date === startTime`. Run the skip path once. Run `grep -rn "confirm(\|alert(" src`; expected: no native dialogs left.
- [ ] **Step 4:** Commit with the message `feat(tracker): debrief page with session RPE`.

---

### Task 10: Cardio entry, history markers, rating

**Files:**
- Create: `src/modules/history/CardioSheet.jsx`, `src/modules/history/RatingSheet.jsx`
- Modify: `historyModel.js` (+ tests), `HistoryManager.jsx`

**Interfaces — Produces:**
- `CARDIO_ACTIVITIES = ['run', 'bike', 'swim', 'row', 'other']`
- `buildCardioRecord({ activity, endTime, durationMin, sessionRpe, id, now }) -> Record` with `type: 'cardio'`, `startTime = endTime − durationMin * 60000`, `date = startTime`, `endTime`, `duration`, `sessionRpe`, and `id: id ?? now`.
- `<CardioSheet open initial?: Record onSave(record) onClose />`. When `initial` is given, every field is prefilled and the same `id` is kept.
- `<RatingSheet open record onSave(record) onClose />` uses `withRating`.

- [ ] **Step 1: Write the failing test.**

```js
const end = Date.parse('2026-10-27T19:30:00+08:00');
expect(buildCardioRecord({ activity: 'run', endTime: end, durationMin: 42, sessionRpe: 5, now: 9 }))
  .toEqual({ id: 9, type: 'cardio', activity: 'run', startTime: end - 42 * 60000, date: end - 42 * 60000, endTime: end, duration: 42, sessionRpe: 5 });
expect(buildCardioRecord({ activity: 'run', endTime: end, durationMin: 42, sessionRpe: 5, id: 3, now: 9 }).id).toBe(3);
```
- [ ] **Step 2:** Run `npm test` (FAIL), implement, then run `npm test` again (PASS).
- [ ] **Step 3: `CardioSheet`**, matching `mockups/01` screen ②.
  - TYPE grid, an `ENDED` datetime input defaulting to now, MINUTES, `RpePicker`, the live LOAD line, and a style-C `SAVE`.
  - SAVE is disabled unless a type is picked, `parseMinutes` is valid and an RPE is picked.
- [ ] **Step 4: Change `HistoryManager`.**
  - `+ CARDIO` sits on the header's right and opens the sheet.
  - Calendar markers: a primary square for strength, a `#38bdf8` dot for cardio, plus a legend.
  - Day list cards show a `STRENGTH`/`CARDIO` badge, the time, `TIME {m}m · RPE {r} · LOAD {l}`, and `—` for unknown values.
  - Cardio cards have an `EDIT` link that opens `CardioSheet` with `initial`.
  - Strength cards with no RPE or an unknown time show a tappable `RATE` slot that opens `RatingSheet`.
  - Every save goes through `appendRecord` or `replaceRecord`, then the list reloads. The existing set editor keeps working on strength cards only.
- [ ] **Step 5: Verify.** Build and lint pass. At 375px: add a run "ended yesterday 19:30, 42 min, RPE 5". It shows a dot on yesterday's cell, LOAD 210, and EDIT changes the minutes. Rate the legacy fixture record.
- [ ] **Step 6:** Commit with the message `feat(history): cardio entry, markers and session rating`.

---

### Task 11: Cover weekly summary

**Files:** Modify `historyModel.js` (+ tests), `HomeView_Rhodes.jsx`, `App.jsx`

**Interfaces — Produces:**
`weekSummary(history: Record[], now: number, plan | null) -> { weekNumber, sessions, strength, cardio, load, lastWeekLoad, strengthTarget: number | null }`
- Weeks are `[startOfIsoWeek(now), +7d)`.
- `load` is the sum of non-null `recordLoad` values; `lastWeekLoad` is the same for the previous week.
- `strengthTarget` is the number of `isTrainingDay` days in `plan`, or `null` when there is no plan.

- [ ] **Step 1: Write the failing test.** Use a Monday 08:00 strength record (load 406), a Sunday 23:30 cardio record (load 210, same week), a record from the previous Sunday (load 300) and an unrated strength record (no load, still counted):

```js
expect(weekSummary(history, Date.parse('2026-10-28T12:00:00+08:00'), planWith3TrainingDays1Rest))
  .toEqual({ weekNumber: 44, sessions: 3, strength: 2, cardio: 1, load: 616, lastWeekLoad: 300, strengthTarget: 3 });
expect(weekSummary([], Date.now(), null).strengthTarget).toBeNull();
```
- [ ] **Step 2:** Run `npm test` (FAIL), implement, then run `npm test` again (PASS).
- [ ] **Step 3: Change the cover**, per spec §7.5 and `mockups/01` screen ③, keeping the neon styling.
  - The top label becomes `WEEK {n} · {formatMonthDay(now)}`.
  - Left tile: `THIS WEEK` / `{sessions} SESSIONS` / `{strength} STRENGTH · {cardio} CARDIO`.
  - Right tile: `WEEK LOAD` / `{load}` with thousands separators / `LAST WEEK {lastWeekLoad}`.
  - Bar: `STRENGTH` / `{strength}/{strengthTarget}`, with the fill capped at 100%. When `strengthTarget` is null, hide the bar.
  - Both tiles are buttons that do `setView('HISTORY')`.
  - The backup hint now reads `TO BACKUP: GO TO DATA`.
  - App computes the summary from `readHistory(localStorage)` and the default plan whenever `view === 'HOME'`.
- [ ] **Step 4: Verify.** Build and lint pass. Compare the cover at 375px with the Task 2 baseline: only the label, the tile text, the bar text and the hint differ. Save a debrief, return to the cover, and check the numbers go up.
- [ ] **Step 5:** Commit with the message `feat(home): weekly sessions and load on the cover`.

---

### Task 12: Data page — export for AI, backup and restore

**Files:**
- Create: `src/modules/data/dataExport.js` (+ `dataExport.test.js`), `src/modules/data/DataView.jsx`
- Modify: `App.jsx` (the nav tab becomes `DATA` with the lucide `Database` icon, and the view renders `DataView`), `HistoryManager.jsx` (remove the backup block from TOOLS)
- Delete: `AiManager.jsx`, `UserProfile.jsx`, `PromptGenerator.js`

**Interfaces — Produces:**
- `toIsoWithOffset(ts) -> 'YYYY-MM-DDTHH:mm:ss±HH:MM'` in local time
- `buildAiExport(history, plans, now) -> { schemaVersion: 1, exportedAt, timezoneOffset, sessions: [...] }`. Each session has:
  - `{ id, type, activity|null, plan|null, day|null, start, end|null, durationMin|null, sessionRpe|null, load|null }`
  - for strength records, also `exercises: [{ name, sets: [{ weightKg, reps, rpe, restSec }] }]`
- `AI_PROMPT: string`. It explains every field, says that `start` and `end` are local times with an offset that can be matched to Garmin activities by time, and says that a null `durationMin` means a legacy record whose `start` is only approximate.
- `createBackup(storage, now) -> object`. It contains `workout_history`, `workout_plans`, `default_plan_id`, `enabled_quote_packs` and `exportedAt`.
- `restoreBackup(data, storage) -> string[]`. It writes only those four keys and returns the keys it wrote.

- [ ] **Step 1: Write the failing tests.**

```js
expect(toIsoWithOffset(Date.parse('2026-10-28T18:42:00+08:00'))).toBe('2026-10-28T18:42:00+08:00');
const out = buildAiExport([legacyRecord, modernStrength, cardio], [], Date.parse('2026-10-29T00:00:00+08:00'));
expect(out.sessions).toHaveLength(3);
expect(out.sessions.find(s => s.type === 'cardio')).toMatchObject({ activity: 'run', durationMin: 42, load: 210 });
expect(out.sessions.find(s => s.id === legacyRecord.id)).toMatchObject({ durationMin: null, load: null, end: null });
expect(out.sessions.find(s => s.id === modernStrength.id).exercises[0].sets[0]).toHaveProperty('weightKg');
const mem = fakeStorage();
expect(restoreBackup({ workout_history: [], app_style: { id: 'cyber' }, app_theme: { type: 'dark' } }, mem)).toEqual(['workout_history']);
expect(mem.getItem('app_style')).toBeNull();
```
- [ ] **Step 2:** Run `npm test` (FAIL), implement, then run `npm test` again (PASS).
- [ ] **Step 3: Build `DataView`** with `PageHeader tag="DATA" title="Export"` and three sections:
  - `EXPORT FOR AI`: style C, downloads `workout-recorder-ai-YYYY-MM-DD.json`
  - `COPY PROMPT`: a link; it writes `AI_PROMPT` to the clipboard and then calls `notify('PROMPT COPIED')`
  - `BACKUP`: style C, downloads `workout-recorder-backup-YYYY-MM-DD.json`
  - `RESTORE`: a link with a file input; it shows an in-app danger confirm, then calls `restoreBackup`, then `notify` and reloads
- [ ] **Step 4: Verify.** Build and lint pass. At 375px: download both files, and check that the AI file's times carry `+08:00`. Back up, change one record, restore, and check the record is reverted and `app_style` is still absent. TOOLS shows only the 1RM calculator.
- [ ] **Step 5:** Commit with the message `feat(data): export-for-AI, backup and restore page`.

---

### Task 13: Acceptance pass

- [ ] **Step 1:** Run `npm test`, `npm run build` and `npx eslint src`. Expected: all tests pass, the build succeeds, and lint is ≤ 18.
- [ ] **Step 2: Migration check.** In a clean browser profile, set `workout_history` to `[legacyRecord]`, `app_style` to `{"id":"cyber"}` and `app_theme` to `{"name":"Rhodes OS","type":"dark"}`, then reload. Check:
  - the app renders light Rhodes and both style keys are gone
  - the legacy record shows on its day with a `RATE` slot
  - the cover counts it as a session with no load
- [ ] **Step 3:** Walk through every check in spec §10 at 375×812. Also screenshot every page, every sheet and every empty state, and check them against the style rules in Global Constraints.
- [ ] **Step 4:** Fix whatever fails and make a separate commit for each fix. Then report to the user: what was verified, the screenshots, and anything not covered. Do not merge; the user decides when to merge, because merging is releasing.
