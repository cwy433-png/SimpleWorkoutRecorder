import { describe, it, expect } from 'vitest';
import { readHistory, writeHistory, appendRecord, replaceRecord, HistoryCorruptError } from './historyStore';
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
    it('appendRecord throws HistoryCorruptError and leaves storage untouched', () => {
      const mem = fakeStorage({ workout_history: bad });
      expect(() => appendRecord(modernStrength, mem)).toThrow(HistoryCorruptError);
      expect(mem.getItem('workout_history')).toBe(bad);
    });
    it('replaceRecord throws HistoryCorruptError and leaves storage untouched', () => {
      const mem = fakeStorage({ workout_history: bad });
      expect(() => replaceRecord(modernStrength, mem)).toThrow(HistoryCorruptError);
      expect(mem.getItem('workout_history')).toBe(bad);
    });
  });

  it('a missing or empty key still counts as an empty history for writes', () => {
    const mem = fakeStorage({ workout_history: '' });
    appendRecord(cardio, mem);
    expect(readHistory(mem).map((r) => r.id)).toEqual([cardio.id]);
  });
});
