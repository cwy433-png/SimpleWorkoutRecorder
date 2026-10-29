import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useDialog } from '../../components/ui/Dialog';
import { OneRepMax } from './OneRepMax';
import { CardioSheet } from './CardioSheet';
import { RatingSheet } from './RatingSheet';
import { durationMinutes, recordLoad, sessionTime } from './historyModel';
import { appendRecord, readHistory, replaceRecord, setAsideUnreadableHistory } from './historyStore';
import { formatDayLabel, formatClock } from '../../lib/format';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const dayKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const tabClass = (active) =>
    `flex-1 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
        active
            ? 'border-2 border-primary bg-primary-soft text-primary-ink'
            : 'border border-border bg-bg text-text-muted hover:text-text-main'
    }`;

const editInput =
    'bg-bg border border-border text-center font-mono text-text-main p-1 focus:outline-none focus:border-primary';

export const HistoryManager = () => {
    const dialog = useDialog();
    // Load history from localStorage (tolerant read; legacy records are normalized)
    const [history, setHistory] = useState(() => readHistory(localStorage));
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('CALENDAR'); // CALENDAR | TOOLS

    const [selectedDate, setSelectedDate] = useState(new Date());

    // EDITING STATE
    const [editingWorkout, setEditingWorkout] = useState(null); // The full workout object being edited

    // CARDIO SHEET (create / edit) and RATING SHEET state
    const [cardioSheet, setCardioSheet] = useState({ open: false, initial: null });
    const [ratingRecord, setRatingRecord] = useState(null);

    // Records grouped by the local day they belong to
    const byDay = useMemo(() => {
        const map = new Map();
        for (const h of history) {
            const k = dayKey(sessionTime(h));
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(h);
        }
        // Within a day, earliest first (a run logged afterwards still sits in time order)
        for (const list of map.values()) list.sort((a, b) => sessionTime(a) - sessionTime(b));
        return map;
    }, [history]);

    // Calendar Logic (weeks start on Monday)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

    const selectedDayWorkouts = byDay.get(dayKey(selectedDate)) || [];

    const monthCount = history.filter(h => {
        const d = new Date(sessionTime(h));
        return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    // Run a write through the history store, then reload the list. Returns true on success.
    // Unreadable old history is moved aside (kept for backup) and a fresh history started.
    // On a failed write the caller keeps its editor open.
    const persist = (write) => {
        try {
            if (setAsideUnreadableHistory(localStorage)) {
                dialog.notify('OLD HISTORY UNREADABLE — SET ASIDE, KEPT IN BACKUP', { tone: 'danger' });
            }
            write();
        } catch (err) {
            dialog.notify('Could not save: ' + (err?.message || 'unknown error'), { tone: 'danger' });
            return false;
        }
        setHistory(readHistory(localStorage));
        return true;
    };

    const handleSaveEdit = () => {
        if (!editingWorkout) return;
        if (persist(() => replaceRecord(editingWorkout, localStorage))) setEditingWorkout(null);
    };

    const handleSaveCardio = (record) => {
        const editing = cardioSheet.initial !== null;
        const write = () => (editing ? replaceRecord(record, localStorage) : appendRecord(record, localStorage));
        if (!persist(write)) return;
        setCardioSheet({ open: false, initial: null });
        setSelectedDate(new Date(record.date));
        setCurrentDate(new Date(record.date));
    };

    const handleSaveRating = (record) => {
        if (persist(() => replaceRecord(record, localStorage))) setRatingRecord(null);
    };

    const startEditing = (workout) => {
        // Deep copy to avoid mutating state directly during edit (logs are already an array)
        setEditingWorkout({ ...workout, logs: JSON.parse(JSON.stringify(workout.logs)) });
    };

    const today = new Date();

    return (
        <div className="flex flex-col h-full overflow-y-auto w-full pb-safe">
            <PageHeader
                tag="LOGS"
                title="History"
                right={
                    <button
                        type="button"
                        onClick={() => setCardioSheet({ open: true, initial: null })}
                        className="inline-flex h-8 items-center gap-1 border border-primary bg-primary-soft px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary-ink cursor-pointer transition-colors hover:bg-primary/20"
                    >
                        <Plus size={12} strokeWidth={3} /> CARDIO
                    </button>
                }
            />

            {/* View Switcher Tabs */}
            <div className="flex gap-1.5 px-4 pt-3 mb-4">
                <button onClick={() => setViewMode('CALENDAR')} className={tabClass(viewMode === 'CALENDAR')}>
                    History
                </button>
                <button onClick={() => setViewMode('TOOLS')} className={tabClass(viewMode === 'TOOLS')}>
                    Tools (1RM)
                </button>
            </div>

            {viewMode === 'TOOLS' ? (
                <div className="px-4 pb-8">
                    <OneRepMax />
                    <div className="mt-8 text-center px-4 opacity-50">
                        <p className="font-mono text-[10px] text-text-muted">Volume Tracker • PR Logger • Bodyweight Stats</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Month switcher */}
                    <div className="flex items-center justify-between px-4 pt-2 pb-1">
                        <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="p-2 text-text-muted hover:text-text-main active:text-primary-text transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <b className="font-mono text-base font-black tracking-[0.05em] text-text-main">{MONTHS[month]} {year}</b>
                        <button onClick={() => changeMonth(1)} aria-label="Next month" className="p-2 text-text-muted hover:text-text-main active:text-primary-text transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Calendar grid */}
                    <div className="px-3 mb-4">
                        <div className="grid grid-cols-7 text-center mb-1">
                            {WEEKDAYS.map((d, i) => (
                                <div key={i} className="py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-text-muted">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-0.5">
                            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="h-11" />)}

                            {Array(daysInMonth).fill(null).map((_, i) => {
                                const day = i + 1;
                                const cellDate = new Date(year, month, day);
                                const isSelected = dayKey(selectedDate) === dayKey(cellDate);
                                const isToday = dayKey(today) === dayKey(cellDate);
                                const dayRecords = byDay.get(dayKey(cellDate)) || [];
                                const hasStrength = dayRecords.some(r => r.type !== 'cardio');
                                const hasCardio = dayRecords.some(r => r.type === 'cardio');

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => setSelectedDate(cellDate)}
                                        className={`relative flex h-11 flex-col items-center justify-center font-mono text-sm font-bold transition-colors ${
                                            isSelected
                                                ? 'outline outline-2 -outline-offset-2 outline-primary bg-primary-soft'
                                                : 'hover:bg-surface'
                                        } ${isToday ? 'text-primary-text' : 'text-text-main'}`}
                                    >
                                        {day}
                                        <span className="mt-0.5 flex h-1 gap-0.5">
                                            {hasStrength && <i className="block h-1 w-1 bg-primary" />}
                                            {hasCardio && <i className="block h-1 w-1 rounded-full bg-cardio" />}
                                        </span>
                                        {isToday && (
                                            <span aria-hidden className="absolute top-1 right-2 h-[3px] w-[3px] bg-primary-text" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Marker legend */}
                    <div className="flex justify-center gap-4 pb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                        <span className="inline-flex items-center gap-1.5"><i className="block h-1.5 w-1.5 bg-primary" />STRENGTH</span>
                        <span className="inline-flex items-center gap-1.5"><i className="block h-1.5 w-1.5 rounded-full bg-cardio" />CARDIO</span>
                    </div>

                    {/* SELECTED DAY DETAILS */}
                    <div className="px-4 pt-3 pb-6 border-t border-border">
                        <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3">
                            {formatDayLabel(selectedDate.getTime())}
                        </h4>

                        {selectedDayWorkouts.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {selectedDayWorkouts.map(workout => {
                                    const isCardio = workout.type === 'cardio';
                                    const isEditing = !isCardio && editingWorkout?.id === workout.id;
                                    const logs = isCardio ? [] : (isEditing ? editingWorkout.logs : workout.logs);
                                    const minutes = durationMinutes(workout);
                                    const load = recordLoad(workout);
                                    const hasRpe = typeof workout.sessionRpe === 'number';
                                    const needsRating = !isCardio && (!hasRpe || minutes === null);

                                    return (
                                        <Card key={workout.id} active={isEditing}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <h3 className="font-black uppercase text-lg leading-tight text-text-main">
                                                            {isCardio ? (workout.activity || 'Cardio') : workout.planTitle}
                                                        </h3>
                                                        <span className={`border px-1 py-px font-mono text-[9px] font-bold uppercase tracking-[0.15em] ${isCardio ? 'border-cardio text-cardio-text' : 'border-border text-text-muted'}`}>
                                                            {isCardio ? 'CARDIO' : 'STRENGTH'}
                                                        </span>
                                                    </div>
                                                    {!isCardio && (
                                                        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary-text">{workout.dayName}</p>
                                                    )}
                                                </div>

                                                <div className="flex gap-3 items-center flex-shrink-0">
                                                    {!editingWorkout && (
                                                        <span className="font-mono text-xs text-text-muted">
                                                            {formatClock(sessionTime(workout))}
                                                        </span>
                                                    )}

                                                    {isCardio ? (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="!text-primary-text"
                                                            onClick={() => setCardioSheet({ open: true, initial: workout })}
                                                        >
                                                            Edit
                                                        </Button>
                                                    ) : isEditing ? (
                                                        <>
                                                            <Button variant="link" tone="danger" size="sm" onClick={() => setEditingWorkout(null)}>Cancel</Button>
                                                            <Button variant="link" size="sm" className="!text-primary-text" onClick={handleSaveEdit}>Save</Button>
                                                        </>
                                                    ) : (
                                                        <Button variant="link" size="sm" onClick={() => startEditing(workout)}>Edit</Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* TIME / RPE / LOAD (unknown values show a dash) */}
                                            <div className="flex items-center gap-4 font-mono text-xs">
                                                <span><span className="text-[10px] font-bold tracking-[0.18em] text-text-muted">TIME </span><b className="font-extrabold">{minutes ?? '—'}</b>{minutes !== null && 'm'}</span>
                                                <span><span className="text-[10px] font-bold tracking-[0.18em] text-text-muted">RPE </span><b className="font-extrabold">{hasRpe ? workout.sessionRpe : '—'}</b></span>
                                                <span><span className="text-[10px] font-bold tracking-[0.18em] text-text-muted">LOAD </span><b className="font-extrabold">{load ?? '—'}</b></span>
                                                {!isCardio && !isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setRatingRecord(workout)}
                                                        className={`ml-auto min-h-[28px] px-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer transition-colors ${needsRating
                                                            ? 'border border-dashed border-primary bg-primary-soft text-primary-ink hover:bg-primary/20'
                                                            : 'text-text-muted hover:text-text-main'}`}
                                                    >
                                                        {needsRating ? 'RATE' : 'Re-rate'}
                                                    </button>
                                                )}
                                            </div>

                                            {!isCardio && (
                                            <div className="space-y-2 mt-3 pt-3 border-t border-border">
                                                {logs.map((log, exIdx) => (
                                                    <div key={exIdx} className="flex flex-col gap-1 text-xs mb-2">
                                                        <div className="flex justify-between items-center bg-bg border border-border px-2 py-1">
                                                            <span className="text-text-main font-medium">{log.exerciseName || 'Unknown'}</span>
                                                            {!isEditing && (
                                                                <span className="text-text-muted font-mono">
                                                                    {log.sets?.length || 0} {log.sets?.length === 1 ? 'SET' : 'SETS'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {isEditing && (
                                                            <div className="pl-2 border-l border-border ml-1 space-y-2 py-2">
                                                                {(log.sets || []).map((s, sIdx) => (
                                                                    <div key={sIdx} className="flex gap-1 items-center font-mono text-[10px]">
                                                                        <span className="w-4 text-text-muted opacity-60">#{sIdx + 1}</span>
                                                                        <input
                                                                            type="number"
                                                                            className={`w-12 ${editInput}`}
                                                                            value={s.weight}
                                                                            onChange={(e) => {
                                                                                const newLogs = [...editingWorkout.logs];
                                                                                newLogs[exIdx].sets[sIdx].weight = e.target.value;
                                                                                setEditingWorkout({ ...editingWorkout, logs: newLogs });
                                                                            }}
                                                                        />
                                                                        <span className="text-text-muted">kg ×</span>
                                                                        <input
                                                                            type="number"
                                                                            className={`w-10 ${editInput}`}
                                                                            value={s.reps}
                                                                            onChange={(e) => {
                                                                                const newLogs = [...editingWorkout.logs];
                                                                                newLogs[exIdx].sets[sIdx].reps = e.target.value;
                                                                                setEditingWorkout({ ...editingWorkout, logs: newLogs });
                                                                            }}
                                                                        />
                                                                        <span className="text-text-muted">@</span>
                                                                        <input
                                                                            type="number"
                                                                            className={`w-10 ${editInput} text-primary-text`}
                                                                            value={s.rpe || ''}
                                                                            placeholder="RPE"
                                                                            onChange={(e) => {
                                                                                const newLogs = [...editingWorkout.logs];
                                                                                newLogs[exIdx].sets[sIdx].rpe = e.target.value;
                                                                                setEditingWorkout({ ...editingWorkout, logs: newLogs });
                                                                            }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            aria-label="Remove set"
                                                                            onClick={() => {
                                                                                const newLogs = [...editingWorkout.logs];
                                                                                newLogs[exIdx].sets.splice(sIdx, 1);
                                                                                setEditingWorkout({ ...editingWorkout, logs: newLogs });
                                                                            }}
                                                                            className="ml-auto p-1 text-alert hover:bg-surface-hover"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <Button
                                                                    size="sm"
                                                                    variant="link"
                                                                    onClick={() => {
                                                                        const newLogs = [...editingWorkout.logs];
                                                                        // Add a copy of the last set or a default set
                                                                        const lastSet = newLogs[exIdx].sets[newLogs[exIdx].sets.length - 1] || { weight: 0, reps: 0, rpe: 8 };
                                                                        newLogs[exIdx].sets.push({ ...lastSet });
                                                                        setEditingWorkout({ ...editingWorkout, logs: newLogs });
                                                                    }}
                                                                    className="w-full border border-dashed border-border mt-2"
                                                                >
                                                                    + Add Set
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center border border-dashed border-border bg-surface">
                                <p className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">No workouts recorded this day.</p>
                            </div>
                        )}
                    </div>

                    {/* Stats Summary - Monthly Perf */}
                    <div className="px-4 pb-24">
                        <Card className="flex flex-col gap-4">
                            <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted border-b border-border pb-2">Monthly Performance</h4>
                            <div className="flex justify-around items-center">
                                <div className="text-center">
                                    <div className="font-mono text-4xl font-black text-text-main">{monthCount}</div>
                                    <div className="font-mono text-[10px] uppercase font-bold tracking-[0.15em] text-text-muted mt-1">Workouts</div>
                                </div>
                                <div className="h-8 w-px bg-border"></div>
                                <div className="text-center">
                                    <div className="font-mono text-xl font-black uppercase text-primary-text">ACTIVE</div>
                                    <div className="font-mono text-[10px] uppercase font-bold tracking-[0.15em] text-text-muted mt-1">Status</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}

            <CardioSheet
                open={cardioSheet.open}
                initial={cardioSheet.initial}
                onSave={handleSaveCardio}
                onClose={() => setCardioSheet({ open: false, initial: null })}
            />
            <RatingSheet
                open={ratingRecord !== null}
                record={ratingRecord}
                onSave={handleSaveRating}
                onClose={() => setRatingRecord(null)}
            />
        </div>
    );
};
