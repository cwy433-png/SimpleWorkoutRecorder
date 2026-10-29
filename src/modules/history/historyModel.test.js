import { describe, it, expect } from 'vitest';
import {
  normalizeLogs,
  normalizeRecord,
  sessionTime,
  durationMinutes,
  recordLoad,
  startOfIsoWeek,
  isoWeekNumber,
  isTrainingDay,
  lastTrainedDayIndex,
  parseMinutes,
  sessionSummary,
  buildStrengthRecord,
  withRating,
  buildCardioRecord,
  CARDIO_ACTIVITIES,
  weekSummary,
} from './historyModel';
import { legacyRecord, modernStrength, cardio } from './__fixtures__/legacyHistory';

describe('normalizeLogs', () => {
  it('passes arrays through', () => {
    const arr = [{ exerciseName: 'A', sets: [] }];
    expect(normalizeLogs(arr)).toBe(arr);
  });
  it('converts legacy object keyed by exercise name', () => {
    expect(normalizeLogs({ Squat: [{ weight: 1, reps: 2 }] })).toEqual([
      { exerciseName: 'Squat', sets: [{ weight: 1, reps: 2 }] },
    ]);
  });
  it('returns [] for anything else', () => {
    expect(normalizeLogs(null)).toEqual([]);
    expect(normalizeLogs(undefined)).toEqual([]);
    expect(normalizeLogs('x')).toEqual([]);
    expect(normalizeLogs(5)).toEqual([]);
  });
});

describe('normalizeRecord', () => {
  it('adds type strength and normalizes legacy logs', () => {
    const r = normalizeRecord(legacyRecord);
    expect(r.type).toBe('strength');
    expect(r.logs).toEqual([{ exerciseName: 'Bench Press', sets: [{ weight: 60, reps: 8 }] }]);
    expect(r.planTitle).toBe('Excel Plan');
    expect(r.duration).toBe(0);
  });
  it('keeps modern strength unchanged', () => {
    expect(normalizeRecord(modernStrength)).toEqual(modernStrength);
  });
  it('does not touch cardio and keeps every field', () => {
    expect(normalizeRecord(cardio)).toEqual(cardio);
  });
  it('does not mutate its input', () => {
    const copy = JSON.parse(JSON.stringify(legacyRecord));
    normalizeRecord(legacyRecord);
    expect(legacyRecord).toEqual(copy);
  });
});

describe('sessionTime / durationMinutes', () => {
  it('uses startTime, else date', () => {
    expect(sessionTime(legacyRecord)).toBe(Date.parse('2026-10-20T10:00:00.000Z'));
    expect(sessionTime(modernStrength)).toBe(modernStrength.startTime);
  });
  it('durationMinutes is a finite positive number or null', () => {
    expect(durationMinutes(modernStrength)).toBe(58);
    expect(durationMinutes(legacyRecord)).toBeNull();
    expect(durationMinutes({})).toBeNull();
    expect(durationMinutes({ duration: -3 })).toBeNull();
    expect(durationMinutes({ duration: NaN })).toBeNull();
    expect(durationMinutes({ duration: Infinity })).toBeNull();
    expect(durationMinutes({ duration: '30' })).toBeNull();
  });
});

describe('recordLoad', () => {
  it('is sessionRpe x duration', () => {
    expect(recordLoad(modernStrength)).toBe(406);
    expect(recordLoad(cardio)).toBe(210);
  });
  it('is null when duration or rpe is missing', () => {
    expect(recordLoad(legacyRecord)).toBeNull();
    expect(recordLoad({ ...modernStrength, sessionRpe: null })).toBeNull();
    expect(recordLoad({ ...modernStrength, sessionRpe: undefined })).toBeNull();
    expect(recordLoad({ ...modernStrength, duration: 0 })).toBeNull();
  });
});

describe('ISO weeks (local time, Asia/Shanghai)', () => {
  it('isoWeekNumber', () => {
    expect(isoWeekNumber(Date.parse('2026-10-28T12:00:00+08:00'))).toBe(44);
    expect(isoWeekNumber(Date.parse('2026-12-31T12:00:00+08:00'))).toBe(53);
    expect(isoWeekNumber(Date.parse('2027-01-03T23:30:00+08:00'))).toBe(53);
    expect(isoWeekNumber(Date.parse('2027-01-04T00:00:00+08:00'))).toBe(1);
  });
  it('startOfIsoWeek is local Monday 00:00', () => {
    expect(startOfIsoWeek(Date.parse('2026-11-01T23:59:00+08:00'))).toBe(
      Date.parse('2026-10-26T00:00:00+08:00'),
    );
    expect(startOfIsoWeek(Date.parse('2026-10-26T00:00:00+08:00'))).toBe(
      Date.parse('2026-10-26T00:00:00+08:00'),
    );
    expect(startOfIsoWeek(Date.parse('2026-10-28T12:00:00+08:00'))).toBe(
      Date.parse('2026-10-26T00:00:00+08:00'),
    );
  });
});

describe('isTrainingDay', () => {
  it('requires non-rest and at least one exercise', () => {
    expect(isTrainingDay({ exercises: [{}] })).toBe(true);
    expect(isTrainingDay({ isRestDay: true, exercises: [{}] })).toBe(false);
    expect(isTrainingDay({ exercises: [] })).toBe(false);
    expect(isTrainingDay({})).toBe(false);
  });
});

describe('lastTrainedDayIndex', () => {
  const plan = {
    id: 'p1',
    title: 'Renamed',
    days: [
      { id: 'd1', name: 'Pull', exercises: [{}] },
      { id: 'd2', name: 'Push2', exercises: [{}] },
    ],
  };
  it('id match wins even after rename', () => {
    expect(lastTrainedDayIndex([modernStrength], plan)).toEqual({
      dayIndex: 1,
      ts: modernStrength.startTime,
    });
  });
  it('legacy falls back to trimmed case-insensitive names', () => {
    const p = { id: 'x', title: 'excel plan ', days: [{ name: 'push', exercises: [{}] }] };
    expect(lastTrainedDayIndex([legacyRecord], p)?.dayIndex).toBe(0);
  });
  it('ignores cardio', () => {
    expect(lastTrainedDayIndex([cardio], plan)).toBeNull();
  });
  it('picks the newest matching record regardless of array order', () => {
    const older = { ...modernStrength, id: 9, dayId: 'd1', startTime: modernStrength.startTime - 86400000 };
    const newer = modernStrength;
    expect(lastTrainedDayIndex([newer, older], plan).dayIndex).toBe(1);
    expect(lastTrainedDayIndex([older, newer], plan).dayIndex).toBe(1);
  });
  it('returns null for empty history or no match', () => {
    expect(lastTrainedDayIndex([], plan)).toBeNull();
    expect(lastTrainedDayIndex([modernStrength], { id: 'zz', title: 'Other', days: [] })).toBeNull();
  });
});

const plan = {
  id: 'p1',
  title: 'Excel Plan',
  days: [{ id: 'd1', name: 'Push', exercises: [{ id: 'e1', name: 'Bench Press', sets: 4 }] }],
};
const sessionExercises = plan.days[0].exercises;
const sessionLogs = { e1: [{ weight: 60, reps: 8 }] };

describe('parseMinutes', () => {
  it('rejects empty, zero, negative and non-numeric input', () => {
    ['', '0', '-5', 'abc', null, undefined, NaN, Infinity, '  ', 0.4, '0.4'].forEach((v) =>
      expect(parseMinutes(v)).toBeNull(),
    );
  });
  it('rounds decimals and trims strings', () => {
    expect(parseMinutes('12.7')).toBe(13);
    expect(parseMinutes(' 45 ')).toBe(45);
    expect(parseMinutes(58)).toBe(58);
  });
});

describe('sessionSummary', () => {
  it('counts sets, planned sets (default 3) and volume', () => {
    const session = {
      sessionExercises: [{ id: 'e1', sets: 4 }, { id: 'e2' }],
      sessionLogs: { e1: [{ weight: 60, reps: 8 }, { weight: 62.5, reps: 6 }], e2: [{ weight: 20, reps: 10 }] },
    };
    expect(sessionSummary(session)).toEqual({ setsDone: 3, setsPlanned: 7, volumeKg: 480 + 375 + 200 });
  });
  it('handles an empty session', () => {
    expect(sessionSummary({ sessionExercises: [], sessionLogs: {} })).toEqual({
      setsDone: 0,
      setsPlanned: 0,
      volumeKg: 0,
    });
  });
});

describe('buildStrengthRecord', () => {
  // started 23:30, debrief saved later: record belongs to the start
  const start = Date.parse('2026-10-27T23:30:00+08:00');
  const session = { plan, dayIndex: 0, sessionExercises, sessionLogs, startTime: start };
  const now = start + 9e6;

  it('anchors the record at the session start', () => {
    const rec = buildStrengthRecord(session, { durationMin: 75, sessionRpe: 8, now });
    expect(rec).toMatchObject({
      id: now,
      type: 'strength',
      planId: 'p1',
      planTitle: 'Excel Plan',
      dayId: 'd1',
      dayName: 'Push',
      date: start,
      startTime: start,
      endTime: start + 75 * 60000,
      duration: 75,
      sessionRpe: 8,
      meta: { appVersion: '0.2.0', source: 'manual_session' },
    });
    expect(rec.logs).toEqual([
      { exerciseId: 'e1', exerciseName: 'Bench Press', sets: [{ weight: 60, reps: 8 }], timestamp: now },
    ]);
  });

  it('falls back to the plan day for exercises missing from the session, and drops unknown ids', () => {
    const rec = buildStrengthRecord(
      { ...session, sessionExercises: [], sessionLogs: { e1: [{ weight: 1, reps: 1 }], nope: [{ weight: 2, reps: 2 }] } },
      { durationMin: 30, sessionRpe: null, now },
    );
    expect(rec.logs.map((l) => l.exerciseId)).toEqual(['e1']);
    expect(rec.sessionRpe).toBeNull();
  });

  it('matches exercise ids loosely (number key vs string id)', () => {
    const rec = buildStrengthRecord(
      { ...session, sessionExercises: [{ id: 7, name: 'Row' }], sessionLogs: { 7: [{ weight: 1, reps: 1 }] } },
      { durationMin: 30, sessionRpe: 6, now },
    );
    expect(rec.logs[0]).toMatchObject({ exerciseId: 7, exerciseName: 'Row' });
  });
});

describe('withRating', () => {
  it('legacy record: derives start from its date and leaves date untouched', () => {
    const out = withRating(legacyRecord, { sessionRpe: 6, durationMin: 50 });
    const t = Date.parse(legacyRecord.date);
    expect(out).toMatchObject({
      endTime: t,
      startTime: t - 50 * 60000,
      date: legacyRecord.date,
      sessionRpe: 6,
      duration: 50,
    });
    expect(legacyRecord.duration).toBe(0);
  });
  it('legacy record with a numeric date', () => {
    const out = withRating({ ...legacyRecord, date: 1000000 }, { sessionRpe: 6, durationMin: 10 });
    expect(out).toMatchObject({ date: 1000000, endTime: 1000000, startTime: 1000000 - 600000 });
  });
  it('record with startTime keeps it and moves endTime', () => {
    const out = withRating(modernStrength, { sessionRpe: 9, durationMin: 40 });
    expect(out).toMatchObject({
      startTime: modernStrength.startTime,
      endTime: modernStrength.startTime + 40 * 60000,
      date: modernStrength.date,
      sessionRpe: 9,
      duration: 40,
    });
  });
});

describe('buildCardioRecord', () => {
  const end = Date.parse('2026-10-27T19:30:00+08:00');
  it('builds a cardio record with start derived from the end', () => {
    expect(buildCardioRecord({ activity: 'run', endTime: end, durationMin: 42, sessionRpe: 5, now: 9 })).toEqual({
      id: 9,
      type: 'cardio',
      activity: 'run',
      startTime: end - 42 * 60000,
      date: end - 42 * 60000,
      endTime: end,
      duration: 42,
      sessionRpe: 5,
    });
  });
  it('keeps a given id (editing)', () => {
    expect(buildCardioRecord({ activity: 'run', endTime: end, durationMin: 42, sessionRpe: 5, id: 3, now: 9 }).id).toBe(3);
  });
  it('yields a load of rpe x minutes', () => {
    const r = buildCardioRecord({ activity: 'bike', endTime: end, durationMin: 45, sessionRpe: 5, now: 9 });
    expect(recordLoad(r)).toBe(225);
  });
  it('lists the five activities', () => {
    expect(CARDIO_ACTIVITIES).toEqual(['run', 'bike', 'swim', 'row', 'other']);
  });
});

describe('weekSummary', () => {
  const at = (iso) => Date.parse(iso);
  const plan = {
    id: 'p1',
    days: [
      { id: 'a', name: 'Push', exercises: [{ id: 'e1' }] },
      { id: 'b', name: 'Pull', exercises: [{ id: 'e2' }] },
      { id: 'r', name: 'Rest', isRestDay: true, exercises: [] },
      { id: 'c', name: 'Legs', exercises: [{ id: 'e3' }] },
    ],
  };
  const history = [
    // Monday 08:00, this week: 7 x 58 = 406
    { id: 1, type: 'strength', startTime: at('2026-10-26T08:00:00+08:00'), date: at('2026-10-26T08:00:00+08:00'), duration: 58, sessionRpe: 7, logs: [] },
    // Sunday 23:30, same ISO week: 5 x 42 = 210
    { id: 2, type: 'cardio', startTime: at('2026-11-01T23:30:00+08:00'), date: at('2026-11-01T23:30:00+08:00'), duration: 42, sessionRpe: 5 },
    // previous Sunday: 6 x 50 = 300
    { id: 3, type: 'strength', startTime: at('2026-10-25T20:00:00+08:00'), date: at('2026-10-25T20:00:00+08:00'), duration: 50, sessionRpe: 6, logs: [] },
    // unrated strength this week: counted, no load
    { id: 4, type: 'strength', startTime: at('2026-10-27T18:00:00+08:00'), date: at('2026-10-27T18:00:00+08:00'), duration: 0, logs: [] },
  ];

  it('summarises the current and previous week', () => {
    expect(weekSummary(history, at('2026-10-28T12:00:00+08:00'), plan)).toEqual({
      weekNumber: 44,
      sessions: 3,
      strength: 2,
      cardio: 1,
      load: 616,
      lastWeekLoad: 300,
      strengthTarget: 3,
    });
  });
  it('has a null target without a plan', () => {
    expect(weekSummary([], Date.now(), null).strengthTarget).toBeNull();
  });
  it('is all zeros for an empty history', () => {
    expect(weekSummary([], at('2026-10-28T12:00:00+08:00'), plan)).toMatchObject({
      sessions: 0, strength: 0, cardio: 0, load: 0, lastWeekLoad: 0,
    });
  });
  it('treats legacy records (no type, string date) as strength', () => {
    const legacy = normalizeRecord({ id: 9, date: '2026-10-27T02:00:00.000Z', duration: 0, logs: {} });
    expect(weekSummary([legacy], at('2026-10-28T12:00:00+08:00'), null)).toMatchObject({ sessions: 1, strength: 1, cardio: 0 });
  });
  it('skips records with an unreadable time', () => {
    const bad = { id: 8, type: 'strength', date: 'garbage', logs: [] };
    expect(weekSummary([bad], at('2026-10-28T12:00:00+08:00'), null).sessions).toBe(0);
  });
});
