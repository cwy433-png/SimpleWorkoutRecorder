import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { OneRepMax } from './OneRepMax';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export const HistoryManager = ({ onBack }) => {
    const [history, setHistory] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('CALENDAR'); // CALENDAR | TOOLS

    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const saved = localStorage.getItem('workout_history');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    // Calendar Logic
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const getWorkoutsForDay = (day) => {
        return history.filter(h => {
            const d = new Date(h.date);
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
        });
    };

    // Get workouts for the currently selected date (full date object comparison)
    const selectedDayWorkouts = history.filter(h => {
        const d = new Date(h.date);
        return d.getDate() === selectedDate.getDate() &&
            d.getMonth() === selectedDate.getMonth() &&
            d.getFullYear() === selectedDate.getFullYear();
    });

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    const isFuture = (day) => {
        const d = new Date(year, month, day);
        return d > new Date();
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300 overflow-y-auto w-full pb-safe">
            <div className="flex items-center gap-2 mb-2 px-2 pt-2">
                <Button size="sm" variant="ghost" onClick={onBack}>&larr; Home</Button>
                <h2 className="text-xl font-black uppercase tracking-tighter ml-auto">Analytics</h2>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex gap-2 px-4 mb-6">
                <button
                    onClick={() => setViewMode('CALENDAR')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'CALENDAR' ? 'bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
                >
                    History
                </button>
                <button
                    onClick={() => setViewMode('TOOLS')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'TOOLS' ? 'bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                >
                    Tools (1RM)
                </button>
            </div>

            {viewMode === 'TOOLS' ? (
                <div className="px-4">
                    <OneRepMax />

                    <div className="mt-8">
                        <h4 className="text-xs font-bold uppercase text-[var(--color-text-muted)] mb-4 border-b border-[var(--color-border)] pb-2">Data Management</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={() => {
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
                                }}
                                className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-primary)]"
                            >
                                📤 Export JSON
                            </Button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        if (confirm("Importing will REPLACE your current data. Continue?")) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                try {
                                                    const data = JSON.parse(event.target.result);

                                                    // Basic Validation
                                                    if (data.workout_history) localStorage.setItem('workout_history', JSON.stringify(data.workout_history));
                                                    if (data.workout_plans) localStorage.setItem('workout_plans', JSON.stringify(data.workout_plans));
                                                    if (data.app_theme) localStorage.setItem('app_theme', JSON.stringify(data.app_theme));
                                                    if (data.app_style) localStorage.setItem('app_style', JSON.stringify(data.app_style));

                                                    alert("Data imported successfully! Reloading...");
                                                    window.location.reload();
                                                } catch (err) {
                                                    alert("Failed to parse JSON: " + err.message);
                                                }
                                            };
                                            reader.readAsText(file);
                                        }
                                        e.target.value = ''; // Reset input
                                    }}
                                />
                                <Button className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-primary)] hover:text-black">
                                    📥 Import JSON
                                </Button>
                            </div>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic text-center">
                            *This will replace your existing plans and history.
                        </p>
                    </div>

                    <div className="mt-8 text-center px-4 opacity-50">
                        <p className="text-[10px] text-[var(--color-text-muted)]">Volume Tracker • PR Logger • Bodyweight Stats</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Calendar Header - Centered with Buttons Aside */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-[var(--color-surface)] active:scale-95 transition-all text-[var(--color-text-main)]">
                                <ChevronLeft size={24} />
                            </button>
                            <div className="text-center w-32">
                                <h3 className="text-xl font-black text-[var(--color-text-main)] uppercase leading-none">{['JAN.', 'FEB.', 'MAR.', 'APR.', 'MAY', 'JUN.', 'JUL.', 'AUG.', 'SEP.', 'OCT.', 'NOV.', 'DEC.'][month]}</h3>
                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] tracking-widest">{year}</p>
                            </div>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-[var(--color-surface)] active:scale-95 transition-all text-[var(--color-text-main)]">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid Container */}
                    <div className="px-2 mb-8">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className="text-[10px] font-bold text-[var(--color-text-muted)]">{d}</div>
                            ))}
                        </div>

                        {/* Days Content */}
                        <div className="grid grid-cols-7 gap-1 place-items-stretch">
                            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="w-full aspect-square" />)}

                            {Array(daysInMonth).fill(null).map((_, i) => {
                                const day = i + 1;
                                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                                const future = isFuture(day);

                                // Check for workout
                                const daysWorkouts = history.filter(h => {
                                    const hDate = new Date(h.date);
                                    return hDate.getDate() === day && hDate.getMonth() === month && hDate.getFullYear() === year;
                                });
                                const hasWorkout = daysWorkouts.length > 0;

                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelectedDate(new Date(year, month, day))}
                                        className={`
                                            relative flex flex-col items-center justify-start pt-1 rounded-none cursor-pointer transition-all aspect-square border-2
                                            ${isSelected
                                                ? 'bg-transparent border-[var(--color-primary)] z-10'
                                                : 'border-transparent hover:bg-[var(--color-surface)]'
                                            }
                                            ${hasWorkout && !isSelected ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : ''}
                                        `}
                                    >
                                        {/* Corner Triangle for Selected */}
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-[var(--color-primary)] border-l-[10px] border-l-transparent"></div>
                                        )}
                                        <span className={`text-xs font-bold leading-none ${isSelected ? 'text-[var(--color-primary)]' : isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-main)]'}`}>
                                            {day}
                                        </span>

                                        {/* Status Indicators */}
                                        <div className="flex-1 flex items-center justify-center w-full">
                                            {hasWorkout ? (
                                                isSelected ? (
                                                    <Check size={14} className="text-[var(--color-primary)] stroke-[3]" />
                                                ) : (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_4px_var(--color-primary)]"></div>
                                                )
                                            ) : (
                                                !future && !isToday && !isSelected && (
                                                    <span className="text-[8px] font-bold text-[var(--color-text-muted)] opacity-50 uppercase scale-75">Rest</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SELECTED DAY DETAILS */}
                    <div className="px-4 pb-20">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3 border-b border-white/10 pb-2">
                            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h4>

                        {selectedDayWorkouts.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {selectedDayWorkouts.map(workout => (
                                    <Card key={workout.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-black italic text-lg text-[var(--color-text-main)]">{workout.planTitle}</h3>
                                                <p className="text-sm text-[var(--color-primary)] font-bold">{workout.dayName}</p>
                                            </div>
                                            <span className="text-xs font-mono text-[var(--color-text-muted)]">
                                                {new Date(workout.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mt-3 pt-3 border-t border-[var(--color-border)]">
                                            {(() => {
                                                // Resilient Parsing: Handle V1 (Object) and V2 (Array)
                                                const normalizeLogs = (rawLogs) => {
                                                    if (Array.isArray(rawLogs)) {
                                                        return rawLogs; // V2: Already robust array
                                                    }
                                                    if (typeof rawLogs === 'object' && rawLogs !== null) {
                                                        // V1: Legacy Object -> Convert to Array
                                                        return Object.entries(rawLogs).map(([name, sets]) => ({
                                                            exerciseName: name,
                                                            sets: sets
                                                        }));
                                                    }
                                                    return [];
                                                };

                                                const logs = normalizeLogs(workout.logs);

                                                return logs.map((log, idx) => (
                                                    <div key={log.exerciseId || log.exerciseName || idx} className="flex justify-between text-xs">
                                                        <span className="text-white/80 font-medium">{log.exerciseName || 'Unknown Exercise'}</span>
                                                        <span className="text-[var(--color-text-muted)] font-mono">
                                                            {log.sets?.length || 0} Sets • Max {Math.max(...(log.sets || []).map(s => Number(s.weight || 0)))}kg
                                                        </span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]">
                                <p className="text-[var(--color-text-muted)] italic">No workouts recorded this day.</p>
                            </div>
                        )}
                    </div>

                    {/* Stats Summary - Monthly Perf */}
                    <Card className="glass border border-[var(--color-border)] mx-2 p-6 flex flex-col gap-4 mb-8 bg-[var(--color-surface)]">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-2">Monthly Performance</h4>
                        <div className="flex justify-around items-center">
                            <div className="text-center">
                                <div className="text-4xl font-black italic text-[var(--color-text-main)]">
                                    {history.filter(h => new Date(h.date).getMonth() === month).length}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mt-1">Workouts</div>
                            </div>
                            <div className="h-8 w-px bg-[var(--color-border)]"></div>
                            <div className="text-center">
                                <div className="text-xl font-black italic text-[var(--color-primary)]">
                                    ACTIVE
                                </div>
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mt-1">Status</div>
                            </div>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};
