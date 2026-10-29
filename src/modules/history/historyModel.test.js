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
