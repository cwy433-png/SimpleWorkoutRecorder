import { describe, it, expect } from 'vitest';
import { reducer, initialState } from './SessionContext';

const plan = {
  id: 'p1',
  title: 'Excel Plan',
  days: [{ id: 'd1', name: 'Push', exercises: [{ id: 'e1', name: 'Bench Press', sets: 4 }] }],
};

describe('session phases', () => {
  it('starts active with no endTime', () => {
    const s = reducer(initialState, { type: 'START_SESSION', plan, dayIndex: 0 });
    expect(s.phase).toBe('active');
    expect(s.endTime).toBeNull();
    expect(initialState).toMatchObject({ phase: 'active', endTime: null });
  });

  it('BEGIN_DEBRIEF sets phase and endTime; RESUME_ACTIVE reverts', () => {
    const started = reducer(initialState, { type: 'START_SESSION', plan, dayIndex: 0 });
    const s1 = reducer(started, { type: 'BEGIN_DEBRIEF', endTime: 1000 });
    expect(s1.phase).toBe('debrief');
    expect(s1.endTime).toBe(1000);
    expect(s1.isActive).toBe(true);
    expect(reducer(s1, { type: 'RESUME_ACTIVE' })).toMatchObject({ phase: 'active', endTime: null });
  });

  it('RESTORE_SESSION keeps debrief and defaults missing phase to active', () => {
    const started = reducer(initialState, { type: 'START_SESSION', plan, dayIndex: 0 });
    const s1 = reducer(started, { type: 'BEGIN_DEBRIEF', endTime: 1000 });
    const restored = reducer(initialState, { type: 'RESTORE_SESSION', payload: { ...s1 } });
    expect(restored.phase).toBe('debrief');
    expect(restored.endTime).toBe(1000);
    const legacy = reducer(initialState, { type: 'RESTORE_SESSION', payload: { plan, dayIndex: 0 } });
    expect(legacy.phase).toBe('active');
    expect(legacy.endTime).toBeNull();
  });

  it('END_SESSION and DISCARD_SESSION return to the active, empty state', () => {
    const started = reducer(initialState, { type: 'START_SESSION', plan, dayIndex: 0 });
    const debrief = reducer(started, { type: 'BEGIN_DEBRIEF', endTime: 5 });
    expect(reducer(debrief, { type: 'END_SESSION' })).toBe(initialState);
    expect(reducer(debrief, { type: 'DISCARD_SESSION' })).toBe(initialState);
  });
});
