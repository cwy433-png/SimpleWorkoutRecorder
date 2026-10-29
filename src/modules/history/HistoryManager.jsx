import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useDialog } from '../../components/ui/Dialog';
import { OneRepMax } from './OneRepMax';
import { normalizeRecord, sessionTime } from './historyModel';
import { formatDayLabel, formatClock } from '../../lib/format';
import { ChevronLeft, ChevronRight, Download, Upload, X } from 'lucide-react';

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
    // Load history from localStorage (legacy records are normalized in memory only)
    const [history, setHistory] = useState(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem('workout_history') || '[]');
            return Array.isArray(parsed) ? parsed.map(normalizeRecord) : [];
        } catch {
            return [];
        }
    });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('CALENDAR'); // CALENDAR | TOOLS

    const [selectedDate, setSelectedDate] = useState(new Date());

    // EDITING STATE
    const [editingWorkout, setEditingWorkout] = useState(null); // The full workout object being edited

    // Records grouped by the local day they belong to
    const byDay = useMemo(() => {
        const map = new Map();
        for (const h of history) {
            const k = dayKey(sessionTime(h));
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(h);
        }
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

    const handleSaveEdit = () => {
        if (!editingWorkout) return;

        const newHistory = history.map(h => h.id === editingWorkout.id ? editingWorkout : h);
        setHistory(newHistory);
        localStorage.setItem('workout_history', JSON.stringify(newHistory));
        setEditingWorkout(null);
    };

    const startEditing = (workout) => {
        // Deep copy to avoid mutating state directly during edit (logs are already an array)
        setEditingWorkout({ ...workout, logs: JSON.parse(JSON.stringify(workout.logs)) });
    };

    const exportBackup = () => {
        const data = {
            workout_history: JSON.parse(localStorage.getItem('workout_history') || '[]'),
            workout_plans: JSON.parse(localStorage.getItem('workout_plans') || '[]'),
            app_theme: JSON.parse(localStorage.getItem('app_theme') || 'null'),
            app_style: JSON.parse(localStorage.getItem('app_style') || 'null'),
            export_date: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `antigravity_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importBackup = async (e) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;

        const ok = await dialog.confirm({
            title: 'Replace data?',
            message: 'Importing will REPLACE your current plans and history.',
            confirmLabel: 'IMPORT',
            tone: 'danger',
        });
        input.value = ''; // Reset input
        if (!ok) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                // Basic Validation
                if (data.workout_history) localStorage.setItem('workout_history', JSON.stringify(data.workout_history));
                if (data.workout_plans) localStorage.setItem('workout_plans', JSON.stringify(data.workout_plans));
                if (data.app_theme) localStorage.setItem('app_theme', JSON.stringify(data.app_theme));
                if (data.app_style) localStorage.setItem('app_style', JSON.stringify(data.app_style));

                dialog.notify('Data imported successfully. Reloading...');
                setTimeout(() => window.location.reload(), 900);
            } catch (err) {
                dialog.notify('Failed to parse JSON: ' + err.message, { tone: 'danger' });
            }
        };
        reader.readAsText(file);
    };

    const today = new Date();

    return (
        <div className="flex flex-col h-full overflow-y-auto w-full pb-safe">
            <PageHeader tag="LOGS" title="History" />

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
                    <div className="mt-8">
                        <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-4 border-b border-border pb-2">Data Management</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={exportBackup}
                                className="flex items-center justify-center gap-2 border border-border bg-surface py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-main transition-colors hover:border-primary"
                            >
                                <Download size={16} /> Export JSON
                            </button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={importBackup}
                                />
                                <div className="flex h-full items-center justify-center gap-2 border border-border bg-surface py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-main">
                                    <Upload size={16} /> Import JSON
                                </div>
                            </div>
                        </div>
                        <p className="font-mono text-[10px] text-text-muted mt-2 text-center">
                            This will replace your existing plans and history.
                        </p>
                    </div>

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
                                const hasWorkout = byDay.has(dayKey(cellDate));

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
                                            {hasWorkout && <i className="block h-1 w-1 bg-primary" />}
                                        </span>
                                        {isToday && (
                                            <span aria-hidden className="absolute top-1 right-2 h-[3px] w-[3px] bg-primary-text" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* SELECTED DAY DETAILS */}
                    <div className="px-4 pt-3 pb-6 border-t border-border">
                        <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3">
                            {formatDayLabel(selectedDate.getTime())}
                        </h4>

                        {selectedDayWorkouts.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {selectedDayWorkouts.map(workout => {
                                    const isEditing = editingWorkout?.id === workout.id;
                                    const logs = isEditing ? editingWorkout.logs : workout.logs;

                                    return (
                                        <Card key={workout.id} active={isEditing}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-black uppercase text-lg leading-tight text-text-main">{workout.planTitle}</h3>
                                                    <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary-text">{workout.dayName}</p>
                                                </div>

                                                <div className="flex gap-3 items-center flex-shrink-0">
                                                    {!editingWorkout && (
                                                        <span className="font-mono text-xs text-text-muted">
                                                            {formatClock(sessionTime(workout))}
                                                        </span>
                                                    )}

                                                    {isEditing ? (
                                                        <>
                                                            <Button variant="link" tone="danger" size="sm" onClick={() => setEditingWorkout(null)}>Cancel</Button>
                                                            <Button variant="link" size="sm" className="!text-primary-text" onClick={handleSaveEdit}>Save</Button>
                                                        </>
                                                    ) : (
                                                        <Button variant="link" size="sm" onClick={() => startEditing(workout)}>Edit</Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-3 pt-3 border-t border-border">
                                                {logs.map((log, exIdx) => (
                                                    <div key={exIdx} className="flex flex-col gap-1 text-xs mb-2">
                                                        <div className="flex justify-between items-center bg-bg border border-border px-2 py-1">
                                                            <span className="text-text-main font-medium">{log.exerciseName || 'Unknown'}</span>
                                                            {!isEditing && (
                                                                <span className="text-text-muted font-mono">
                                                                    {log.sets?.length || 0} Sets
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
        </div>
    );
};
