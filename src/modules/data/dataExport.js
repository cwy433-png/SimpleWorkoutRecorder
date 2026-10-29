// Export for AI, backup and restore. Pure functions; storage is injected so tests can fake it.
import { normalizeRecord, sessionTime, durationMinutes, recordLoad } from '../history/historyModel';

const pad = (n) => String(n).padStart(2, '0');

function offsetString(date) {
  const offsetMin = -date.getTimezoneOffset(); // minutes east of UTC
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Local time with the local UTC offset, e.g. 2026-10-28T18:42:00+08:00. Null for an invalid timestamp. */
export function toIsoWithOffset(ts) {
  const d = new Date(ts);
  if (ts === null || ts === undefined || Number.isNaN(d.getTime())) return null;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offsetString(d)}`
  );
}

/** Local calendar date YYYY-MM-DD, for file names. */
export function localDateStamp(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const numberOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// The logger stores set values as strings ('8', '62.5'); blanks and non-numbers become null.
function toNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') return numberOrNull(Number(v));
  return null;
}

function exportSets(sets) {
  return (Array.isArray(sets) ? sets : []).map((s) => ({
    weightKg: toNum(s?.weight),
    reps: toNum(s?.reps),
    rpe: toNum(s?.rpe),
    restSec: toNum(s?.restTime),
  }));
}

function exportSession(raw, plans) {
  const record = normalizeRecord(raw);
  const startTs = sessionTime(record);
  const isCardio = record.type === 'cardio';
  const plan = isCardio
    ? null
    : record.planTitle ?? (Array.isArray(plans) ? plans.find((p) => record.planId && p.id === record.planId)?.title : null) ?? null;

  const session = {
    id: record.id ?? null,
    type: record.type,
    activity: isCardio ? record.activity ?? null : null,
    plan,
    day: isCardio ? null : record.dayName ?? null,
    start: toIsoWithOffset(startTs),
    end: toIsoWithOffset(record.endTime),
    durationMin: durationMinutes(record),
    sessionRpe: numberOrNull(record.sessionRpe),
    load: recordLoad(record),
  };

  if (!isCardio) {
    session.exercises = record.logs.map((log) => ({
      name: log.exerciseName ?? null,
      sets: exportSets(log.sets),
    }));
  }
  return { session, startTs };
}

/** The file given to an AI together with Garmin data. Sessions are ordered by start time. */
export function buildAiExport(history, plans, now) {
  const exported = (Array.isArray(history) ? history : []).map((r) => exportSession(r, plans));
  exported.sort((a, b) => (a.startTs || 0) - (b.startTs || 0));
  return {
    schemaVersion: 1,
    exportedAt: toIsoWithOffset(now),
    timezoneOffset: offsetString(new Date(now)),
    sessions: exported.map((e) => e.session),
  };
}

export const AI_PROMPT = `I am sending you my training log exported from a workout recorder app (JSON). I may also send you data exported from my Garmin watch. Please analyze them together.

FILE STRUCTURE
- schemaVersion: format version of this file (1).
- exportedAt: when the file was exported, as a local time with an offset.
- timezoneOffset: the UTC offset of the phone that recorded the sessions, e.g. +08:00.
- sessions: one entry per training session, ordered by start time.

FIELDS OF EACH SESSION
- id: unique id of the session.
- type: "strength" (weight training) or "cardio".
- activity: the cardio kind, e.g. "run"; null for strength sessions.
- plan, day: the name of the training plan and of the plan day; null for cardio.
- start, end: local times with a UTC offset, e.g. 2026-10-28T18:42:00+08:00. Match a session to a Garmin activity by time: the Garmin activity whose start/end window overlaps this session's start/end is the same workout. end is null when unknown.
- durationMin: session length in minutes. null means a legacy record from an old app version: its start is only approximate (the time of day may be inaccurate) and it has no duration or load.
- sessionRpe: how hard the whole session felt, 1 (very easy) to 10 (maximal); null if not rated.
- load: training load = sessionRpe x durationMin; null when either is missing.
- exercises (strength only): a list of { name, sets }.
- sets: a list of { weightKg, reps, rpe, restSec } - weight in kg, repetitions, per-set effort (RPE 1-10, null if not recorded) and rest after the set in seconds (null if not recorded).

WHAT I WOULD LIKE
1. Match each session to the Garmin data by time and compare my perceived effort (sessionRpe, load) with heart rate and the watch's own training load.
2. Describe my weekly training load and how it trends; point out weeks with sudden jumps or too little recovery.
3. For strength exercises, show progression in weight, reps and volume (weightKg x reps), and flag stalls.
4. Give concrete, practical suggestions for the coming weeks, and tell me which data you would need to be more certain.`;

export const BACKUP_KEYS = ['workout_history', 'workout_plans', 'default_plan_id', 'enabled_quote_packs'];

function readJson(storage, key, fallback) {
  const raw = storage.getItem(key);
  if (raw === null || raw === undefined || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Everything needed to restore the app's data. Never includes theme or style keys.
 *  Stored history that cannot be read as an array is kept verbatim as `workout_history_raw`
 *  (and `workout_history` is omitted) so a backup never silently exports an empty history.
 *  Copies set aside by the history store (`workout_history_unreadable`) are included as-is. */
export function createBackup(storage, now) {
  const rawHistory = storage.getItem('workout_history');
  let history = [];
  let unreadable = false;
  if (rawHistory !== null && rawHistory !== undefined && rawHistory !== '') {
    try {
      const parsed = JSON.parse(rawHistory);
      if (Array.isArray(parsed)) history = parsed;
      else unreadable = true;
    } catch {
      unreadable = true;
    }
  }
  const setAside = storage.getItem('workout_history_unreadable');
  return {
    ...(unreadable ? { workout_history_raw: rawHistory } : { workout_history: history }),
    ...(setAside ? { workout_history_unreadable: readJson(storage, 'workout_history_unreadable', setAside) } : {}),
    workout_plans: readJson(storage, 'workout_plans', []),
    default_plan_id: storage.getItem('default_plan_id') ?? null,
    enabled_quote_packs: readJson(storage, 'enabled_quote_packs', null),
    exportedAt: toIsoWithOffset(now),
  };
}

/** Write the allowed keys found in `data`; returns the keys written. Anything else is ignored. */
export function restoreBackup(data, storage) {
  const written = [];
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return written;

  for (const key of BACKUP_KEYS) {
    const value = data[key];
    if (value === undefined) continue;

    if (key === 'default_plan_id') {
      if (value === null) storage.removeItem(key);
      else if (typeof value === 'string' || typeof value === 'number') storage.setItem(key, String(value));
      else continue;
    } else if (key === 'enabled_quote_packs') {
      if (Array.isArray(value)) storage.setItem(key, JSON.stringify(value));
      else if (value === null) storage.removeItem(key);
      else continue;
    } else {
      if (!Array.isArray(value)) continue;
      storage.setItem(key, JSON.stringify(value));
    }
    written.push(key);
  }
  return written;
}
