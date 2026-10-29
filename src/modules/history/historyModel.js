// Pure helpers for workout history records. No storage, no React.
// Dates are handled in local time; weeks start on Monday (ISO 8601).

const DAY_MS = 24 * 60 * 60 * 1000;

/** Legacy records stored `logs` as { [exerciseName]: sets }. Always return an array. */
export function normalizeLogs(logs) {
  if (Array.isArray(logs)) return logs;
  if (typeof logs === 'object' && logs !== null) {
    return Object.entries(logs).map(([exerciseName, sets]) => ({ exerciseName, sets }));
  }
  return [];
}

/** Fill in `type` for legacy records and normalize strength logs. Does not mutate the input. */
export function normalizeRecord(raw) {
  const type = raw.type ?? 'strength';
  const record = { ...raw, type };
  if (type === 'strength') record.logs = normalizeLogs(raw.logs);
  return record;
}

/** Timestamp (ms) a session belongs to: startTime, else the legacy `date`. */
export function sessionTime(record) {
  return record.startTime ?? new Date(record.date).getTime();
}

/** Duration in minutes, or null when missing, zero, negative or not a finite number. */
export function durationMinutes(record) {
  const d = record.duration;
  return typeof d === 'number' && Number.isFinite(d) && d > 0 ? d : null;
}

/** Session-RPE training load (sessionRpe x minutes), or null when either is unknown. */
export function recordLoad(record) {
  const minutes = durationMinutes(record);
  const rpe = record.sessionRpe;
  if (minutes === null || typeof rpe !== 'number' || !Number.isFinite(rpe)) return null;
  return rpe * minutes;
}

/** Local Monday 00:00 of the week containing ts. */
export function startOfIsoWeek(ts) {
  const d = new Date(ts);
  const sinceMonday = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - sinceMonday).getTime();
}

/** ISO 8601 week number (1-53) of the local date of ts. */
export function isoWeekNumber(ts) {
  const monday = new Date(startOfIsoWeek(ts));
  // The ISO year is the year of the week's Thursday.
  const thursday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
  const year = thursday.getFullYear();
  // Compare as UTC calendar days so DST shifts can't skew the division.
  const thursdayDay = Date.UTC(year, thursday.getMonth(), thursday.getDate());
  const jan1Day = Date.UTC(year, 0, 1);
  return 1 + Math.floor((thursdayDay - jan1Day) / (7 * DAY_MS));
}

/** A plan day that is meant to be trained (not a rest day, has exercises). */
export function isTrainingDay(day) {
  return !day.isRestDay && day.exercises?.length > 0;
}

const norm = (s) => String(s ?? '').trim().toLowerCase();

function dayIndexForRecord(record, plan) {
  const days = plan.days ?? [];
  if (record.planId && record.dayId) {
    if (record.planId !== plan.id) return -1;
    return days.findIndex((d) => d.id === record.dayId);
  }
  if (!record.planTitle || !record.dayName) return -1;
  if (norm(record.planTitle) !== norm(plan.title)) return -1;
  return days.findIndex((d) => norm(d.name) === norm(record.dayName));
}

/**
 * Which day of `plan` was trained most recently, from the newest matching strength record.
 * Records match by planId/dayId when they have them, otherwise by trimmed, case-insensitive names.
 */
export function lastTrainedDayIndex(history, plan) {
  let best = null;
  for (const raw of history) {
    if ((raw.type ?? 'strength') !== 'strength') continue;
    const dayIndex = dayIndexForRecord(raw, plan);
    if (dayIndex < 0) continue;
    const ts = sessionTime(raw);
    if (!Number.isFinite(ts)) continue;
    if (best === null || ts > best.ts) best = { dayIndex, ts };
  }
  return best;
}

/** Whole minutes >= 1 from a number or string, otherwise null. Decimals are rounded. */
export function parseMinutes(input) {
  if (typeof input !== 'number' && typeof input !== 'string') return null;
  const text = typeof input === 'string' ? input.trim() : input;
  if (text === '') return null;
  const n = Math.round(Number(text));
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/** Sets done / planned and total volume (kg) of a live session. */
export function sessionSummary(session) {
  const exercises = session.sessionExercises ?? [];
  const logs = session.sessionLogs ?? {};
  const setsPlanned = exercises.reduce((sum, ex) => sum + (ex.sets ?? 3), 0);
  let setsDone = 0;
  let volumeKg = 0;
  for (const sets of Object.values(logs)) {
    if (!Array.isArray(sets)) continue;
    for (const set of sets) {
      setsDone += 1;
      volumeKg += (Number(set.weight) || 0) * (Number(set.reps) || 0);
    }
  }
  return { setsDone, setsPlanned, volumeKg };
}

/**
 * Build the history record for a finished live session. The record belongs to the day the
 * session started (date = startTime), even if it is saved after midnight.
 */
export function buildStrengthRecord(session, { durationMin, sessionRpe, now }) {
  const { plan, dayIndex, sessionExercises, sessionLogs, startTime } = session;
  const activeDay = plan?.days?.[dayIndex];
  const logs = [];
  Object.entries(sessionLogs ?? {}).forEach(([exId, sets]) => {
    // Look in the session's exercises first (includes ad-hoc ones), then in the plan day.
    // Loose equality: log keys are strings, exercise ids may be numbers.
    const exercise =
      sessionExercises?.find((e) => e.id == exId) ?? activeDay?.exercises?.find((e) => e.id == exId);
    if (exercise) {
      logs.push({ exerciseId: exercise.id, exerciseName: exercise.name, sets, timestamp: now });
    }
  });
  return {
    id: now,
    type: 'strength',
    planId: plan?.id,
    planTitle: plan?.title,
    dayId: activeDay?.id,
    dayName: activeDay?.name,
    date: startTime,
    startTime,
    endTime: startTime + durationMin * 60000,
    duration: durationMin,
    sessionRpe,
    logs,
    meta: { appVersion: '0.2.0', source: 'manual_session' },
  };
}

/**
 * Apply a rating to a record. Records with a startTime keep it and move endTime; legacy
 * records (no startTime) treat their date as the end and derive the start. `date` is untouched.
 */
export function withRating(record, { sessionRpe, durationMin }) {
  const span = durationMin * 60000;
  if (record.startTime != null) {
    return { ...record, sessionRpe, duration: durationMin, endTime: record.startTime + span };
  }
  const endTime = sessionTime(record);
  return { ...record, sessionRpe, duration: durationMin, endTime, startTime: endTime - span };
}
