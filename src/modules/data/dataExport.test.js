import { describe, it, expect } from 'vitest';
import { fakeStorage } from '../../test/fakeStorage';
import { legacyRecord, modernStrength, cardio } from '../history/__fixtures__/legacyHistory';
import { localDateStamp, toIsoWithOffset, buildAiExport, AI_PROMPT, createBackup, restoreBackup } from './dataExport';

describe('toIsoWithOffset', () => {
  it('writes local time with the local offset', () => {
    expect(toIsoWithOffset(Date.parse('2026-10-28T18:42:00+08:00'))).toBe('2026-10-28T18:42:00+08:00');
  });

  it('returns null for an invalid timestamp', () => {
    expect(toIsoWithOffset(NaN)).toBeNull();
  });
});

describe('localDateStamp', () => {
  it('uses the local date, not UTC', () => {
    expect(localDateStamp(Date.parse('2026-10-29T00:30:00+08:00'))).toBe('2026-10-29');
  });
});

describe('buildAiExport', () => {
  const now = Date.parse('2026-10-29T00:00:00+08:00');
  const out = buildAiExport([legacyRecord, modernStrength, cardio], [], now);

  it('has the header fields', () => {
    expect(out.schemaVersion).toBe(1);
    expect(out.exportedAt).toBe('2026-10-29T00:00:00+08:00');
    expect(out.timezoneOffset).toBe('+08:00');
    expect(out.sessions).toHaveLength(3);
  });

  it('exports cardio with activity, duration and load', () => {
    expect(out.sessions.find((s) => s.type === 'cardio')).toMatchObject({
      activity: 'run',
      durationMin: 42,
      load: 210,
      start: '2026-10-28T07:00:00+08:00',
      end: '2026-10-28T07:42:00+08:00',
    });
  });

  it('exports a legacy record without crashing, with null duration, load and end', () => {
    expect(out.sessions.find((s) => s.id === legacyRecord.id)).toMatchObject({
      type: 'strength',
      plan: 'Excel Plan',
      day: 'Push',
      start: '2026-10-20T18:00:00+08:00',
      durationMin: null,
      load: null,
      end: null,
      sessionRpe: null,
    });
    const legacy = out.sessions.find((s) => s.id === legacyRecord.id);
    expect(legacy.exercises[0].name).toBe('Bench Press');
    expect(legacy.exercises[0].sets[0]).toMatchObject({ weightKg: 60, reps: 8, rpe: null, restSec: null });
  });

  it('exports strength sets with weightKg, reps, rpe and restSec', () => {
    const s = out.sessions.find((x) => x.id === modernStrength.id);
    expect(s.exercises[0].sets[0]).toHaveProperty('weightKg');
    expect(s.exercises[0].sets[0]).toEqual({ weightKg: 62.5, reps: 8, rpe: 8, restSec: 120 });
    expect(s).toMatchObject({ durationMin: 58, sessionRpe: 7, load: 406, start: '2026-10-27T18:00:00+08:00' });
  });

  it('does not put exercises on cardio sessions', () => {
    expect(out.sessions.find((s) => s.type === 'cardio')).not.toHaveProperty('exercises');
  });

  it('orders sessions by start time', () => {
    expect(out.sessions.map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it('survives an empty history', () => {
    expect(buildAiExport([], [], now).sessions).toEqual([]);
  });
});

describe('AI_PROMPT', () => {
  it('explains the time matching and legacy records', () => {
    expect(AI_PROMPT).toMatch(/Garmin/);
    expect(AI_PROMPT).toMatch(/offset/);
    expect(AI_PROMPT).toMatch(/durationMin/);
    for (const field of ['start', 'end', 'sessionRpe', 'load', 'weightKg', 'restSec', 'timezoneOffset']) {
      expect(AI_PROMPT).toContain(field);
    }
  });
});

describe('backup and restore', () => {
  it('creates a backup with the four keys and exportedAt', () => {
    const mem = fakeStorage({
      workout_history: JSON.stringify([legacyRecord]),
      workout_plans: JSON.stringify([{ id: 'p1' }]),
      default_plan_id: 'p1',
      enabled_quote_packs: JSON.stringify(['a']),
      app_style: JSON.stringify({ id: 'cyber' }),
    });
    const backup = createBackup(mem, Date.parse('2026-10-29T00:00:00+08:00'));
    expect(backup).toEqual({
      workout_history: [legacyRecord],
      workout_plans: [{ id: 'p1' }],
      default_plan_id: 'p1',
      enabled_quote_packs: ['a'],
      exportedAt: '2026-10-29T00:00:00+08:00',
    });
  });

  it('backs up empty storage as empty values', () => {
    const backup = createBackup(fakeStorage(), 0);
    expect(backup.workout_history).toEqual([]);
    expect(backup.workout_plans).toEqual([]);
    expect(backup.default_plan_id).toBeNull();
    expect(backup.enabled_quote_packs).toBeNull();
  });

  it('restores only the allowed keys and ignores theme keys', () => {
    const mem = fakeStorage();
    expect(restoreBackup({ workout_history: [], app_style: { id: 'cyber' }, app_theme: { type: 'dark' } }, mem)).toEqual(['workout_history']);
    expect(mem.getItem('app_style')).toBeNull();
    expect(mem.getItem('app_theme')).toBeNull();
    expect(mem.getItem('workout_history')).toBe('[]');
  });

  it('round-trips a backup', () => {
    const src = fakeStorage({
      workout_history: JSON.stringify([modernStrength]),
      workout_plans: JSON.stringify([{ id: 'p1' }]),
      default_plan_id: 'p1',
      enabled_quote_packs: JSON.stringify(['a']),
    });
    const dst = fakeStorage({ default_plan_id: 'stale' });
    const keys = restoreBackup(createBackup(src, 0), dst);
    expect(keys).toEqual(['workout_history', 'workout_plans', 'default_plan_id', 'enabled_quote_packs']);
    expect(JSON.parse(dst.getItem('workout_history'))).toEqual([modernStrength]);
    expect(dst.getItem('default_plan_id')).toBe('p1');
    expect(dst.getItem('enabled_quote_packs')).toBe('["a"]');
  });

  it('clears the default plan when the backup had none', () => {
    const dst = fakeStorage({ default_plan_id: 'stale' });
    restoreBackup({ default_plan_id: null }, dst);
    expect(dst.getItem('default_plan_id')).toBeNull();
  });

  it('skips values of the wrong shape and non-backup input', () => {
    const mem = fakeStorage();
    expect(restoreBackup({ workout_history: 'oops', workout_plans: {} }, mem)).toEqual([]);
    expect(restoreBackup(null, mem)).toEqual([]);
    expect(restoreBackup([1, 2], mem)).toEqual([]);
    expect(mem.getItem('workout_history')).toBeNull();
  });
});
