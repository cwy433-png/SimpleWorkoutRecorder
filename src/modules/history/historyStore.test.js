import { describe, it, expect } from 'vitest';
import { readHistory, writeHistory, appendRecord, replaceRecord, saveStrengthRecord, readUnreadableCopies, setAsideUnreadableHistory } from './historyStore';
import { fakeStorage } from '../../test/fakeStorage';
import { legacyRecord, modernStrength, cardio } from './__fixtures__/legacyHistory';

describe('historyStore', () => {
  it('reads an empty history', () => {
    expect(readHistory(fakeStorage())).toEqual([]);
  });

  it('tolerates corrupt or non-array JSON', () => {
    expect(readHistory(fakeStorage({ workout_history: '{oops' }))).toEqual([]);
    expect(readHistory(fakeStorage({ workout_history: '{"a":1}' }))).toEqual([]);
  });

  it('normalizes legacy records on read', () => {
    const mem = fakeStorage();
    writeHistory([legacyRecord], mem);
    const [rec] = readHistory(mem);
    expect(rec.type).toBe('strength');
    expect(rec.logs).toEqual([{ exerciseName: 'Bench Press', sets: [{ weight: 60, reps: 8 }] }]);
  });

  it('appendRecord prepends', () => {
    const mem = fakeStorage();
    appendRecord(modernStrength, mem);
    appendRecord(cardio, mem);
    expect(readHistory(mem).map((r) => r.id)).toEqual([cardio.id, modernStrength.id]);
  });

  it('replaceRecord replaces by id and keeps order; unknown ids are ignored', () => {
    const mem = fakeStorage();
    writeHistory([cardio, modernStrength], mem);
    replaceRecord({ ...modernStrength, sessionRpe: 5 }, mem);
    const out = readHistory(mem);
    expect(out.map((r) => r.id)).toEqual([cardio.id, modernStrength.id]);
    expect(out[1].sessionRpe).toBe(5);
    replaceRecord({ id: 999, type: 'cardio' }, mem);
    expect(readHistory(mem)).toHaveLength(2);
  });

  describe.each(['not json', '{"a":1}'])('with unreadable stored value %j', (bad) => {
    it('readHistory still returns []', () => {
      expect(readHistory(fakeStorage({ workout_history: bad }))).toEqual([]);
    });
    it('appendRecord sets the old value aside verbatim and starts a fresh history', () => {
      const mem = fakeStorage({ workout_history: bad });
      appendRecord(cardio, mem);
      expect(readHistory(mem).map((r) => r.id)).toEqual([cardio.id]);
      expect(readUnreadableCopies(mem).map((c) => c.raw)).toEqual([bad]);
    });
    it('replaceRecord sets the old value aside and leaves an empty history', () => {
      const mem = fakeStorage({ workout_history: bad });
      replaceRecord(modernStrength, mem);
      expect(readHistory(mem)).toEqual([]);
      expect(readUnreadableCopies(mem).map((c) => c.raw)).toEqual([bad]);
    });
  });

  it('setAsideUnreadableHistory keeps every earlier copy and does nothing on readable history', () => {
    const mem = fakeStorage({ workout_history: 'first' });
    expect(setAsideUnreadableHistory(mem, 1)).toBe(true);
    expect(setAsideUnreadableHistory(mem, 2)).toBe(false); // now empty, which is readable
    mem.setItem('workout_history', 'second');
    expect(setAsideUnreadableHistory(mem, 3)).toBe(true);
    expect(readUnreadableCopies(mem)).toEqual([{ setAsideAt: 1, raw: 'first' }, { setAsideAt: 3, raw: 'second' }]);
  });

  it('a missing or empty key still counts as an empty history for writes', () => {
    const mem = fakeStorage({ workout_history: '' });
    appendRecord(cardio, mem);
    expect(readHistory(mem).map((r) => r.id)).toEqual([cardio.id]);
  });

  describe('saveStrengthRecord', () => {
    it('saving the same session twice leaves exactly one record, keeping the first id', () => {
      const mem = fakeStorage();
      const first = { ...modernStrength, id: 1000, dayId: 'd1', startTime: 5000 };
      const second = { ...first, id: 2000, sessionRpe: 9 };
      saveStrengthRecord(first, mem);
      saveStrengthRecord(second, mem);
      const out = readHistory(mem);
      expect(out).toHaveLength(1);
      expect(out[0].id).toBe(1000);
      expect(out[0].sessionRpe).toBe(9);
    });

    it('appends when startTime or dayId differ, and never matches cardio', () => {
      const mem = fakeStorage();
      saveStrengthRecord({ ...modernStrength, id: 1, dayId: 'd1', startTime: 5000 }, mem);
      saveStrengthRecord({ ...modernStrength, id: 2, dayId: 'd2', startTime: 5000 }, mem);
      saveStrengthRecord({ ...modernStrength, id: 3, dayId: 'd1', startTime: 6000 }, mem);
      appendRecord({ ...cardio, id: 4, startTime: 7000 }, mem);
      saveStrengthRecord({ ...modernStrength, id: 5, dayId: 'd1', startTime: 7000 }, mem);
      expect(readHistory(mem).map((r) => r.id)).toEqual([5, 4, 3, 2, 1]);
    });

    it('saves into a fresh history when the stored one is unreadable', () => {
      const mem = fakeStorage({ workout_history: 'not json' });
      saveStrengthRecord(modernStrength, mem);
      expect(readHistory(mem).map((r) => r.id)).toEqual([modernStrength.id]);
      expect(readUnreadableCopies(mem).map((c) => c.raw)).toEqual(['not json']);
    });
  });
});
