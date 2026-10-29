// Fixture records covering the shapes found in localStorage `workout_history`.
const startTime = Date.parse('2026-10-27T18:00:00+08:00');
const endTime = Date.parse('2026-10-27T18:58:00+08:00');

// Oldest shape: no `type`, no `duration`, `logs` keyed by exercise name.
export const legacyRecord = {
  id: 1,
  date: '2026-10-20T10:00:00.000Z',
  planTitle: 'Excel Plan',
  dayName: 'Push',
  duration: 0,
  logs: { 'Bench Press': [{ weight: 60, reps: 8 }] },
};

export const modernStrength = {
  id: 2,
  type: 'strength',
  planId: 'p1',
  planTitle: 'Excel Plan',
  dayId: 'd2',
  dayName: 'Push',
  startTime,
  date: startTime,
  endTime,
  duration: 58,
  sessionRpe: 7,
  logs: [
    {
      exerciseId: 'e1',
      exerciseName: 'Bench Press',
      sets: [{ weight: 62.5, reps: 8, rpe: 8, restTime: 120 }],
    },
  ],
};

export const cardio = {
  id: 3,
  type: 'cardio',
  activity: 'run',
  startTime: Date.parse('2026-10-28T07:00:00+08:00'),
  date: Date.parse('2026-10-28T07:00:00+08:00'),
  endTime: Date.parse('2026-10-28T07:42:00+08:00'),
  duration: 42,
  sessionRpe: 5,
};
