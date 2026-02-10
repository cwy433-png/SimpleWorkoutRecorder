import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

import { ExerciseLogger } from './ExerciseLogger';
import { RestTimer } from './RestTimer';

export const SessionDashboard = ({ plan, dayIndex, onFinishWorkout, onBack }) => {
    // 1. Safe Data derivation (Hooks must run first)
    const activeDay = plan?.days?.[dayIndex];
    const initialExercises = activeDay?.exercises?.filter(e => !!e) || [];

    // 2. Hooks
    const [sessionLogs, setSessionLogs] = useState({});
    const [expandedExerciseId, setExpandedExerciseId] = useState(null);
    const [startTime] = useState(Date.now());
    const [duration, setDuration] = useState(0);

    // Local state for exercises
    const [sessionExercises, setSessionExercises] = useState(initialExercises);
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');

    // Refs and Helpers
    const scrollRefs = useRef({});

    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    useEffect(() => {
        // Reset/Sync if props change violently (rare in this app flow)
        if (activeDay) {
            setSessionExercises(activeDay.exercises?.filter(e => !!e) || []);
        }
    }, [activeDay]);

    // Auto-scroll to expanded item
    useEffect(() => {
        if (expandedExerciseId && scrollRefs.current[expandedExerciseId]) {
            scrollRefs.current[expandedExerciseId].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [expandedExerciseId]);

    // 3. Render Error if data missing (AFTER hooks)
    if (!activeDay) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-4">
                <div className="text-red-500 font-bold text-xl">Error: Workout Data Not Found</div>
                <div className="text-white/50 text-sm">Plan: {plan?.title || 'None'}, Day Index: {dayIndex}</div>
                <Button onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const toggleExpand = (id) => {
        setExpandedExerciseId(prev => prev === id ? null : id);
    };

    const handleSaveSet = (exerciseId, setData) => {
        if (setData.isRestUpdate) {
            // Update the last log for this exercise
            setSessionLogs(prev => {
                const existing = prev[exerciseId] || [];
                if (existing.length === 0) return prev; // Should not happen

                const lastLog = { ...existing[existing.length - 1], restTime: setData.restTime };
                const newLogs = [...existing.slice(0, -1), lastLog];
                return { ...prev, [exerciseId]: newLogs };
            });
            return;
        }

        const setWithTime = { ...setData, timestamp: Date.now() };
        setSessionLogs(prev => {
            const existing = prev[exerciseId] || [];
            return { ...prev, [exerciseId]: [...existing, setWithTime] };
        });
    };

    // History Lookup
    const [historyData, setHistoryData] = useState([]);
    useEffect(() => {
        try {
            const raw = localStorage.getItem('workout_history');
            const savedHistory = raw ? JSON.parse(raw) : [];
            // Ensure it's an array
            if (Array.isArray(savedHistory)) {
                setHistoryData(savedHistory);
            } else {
                setHistoryData([]);
            }
        } catch (e) {
            console.error("Failed to load history", e);
            setHistoryData([]);
        }
    }, []);

    const getLastLog = (exerciseName, exerciseId) => {
        if (!historyData || !Array.isArray(historyData)) return null;

        // Get today's date (for comparison)
        const today = new Date();
        const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Iterate through history (Newest -> Oldest)
        for (const record of historyData) {
            if (!record || !record.logs) continue;

            // Skip workouts from today (we want to show PREVIOUS session, not earlier today)
            const recordDate = new Date(record.date);
            const recordDateString = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
            if (recordDateString === todayDateString) {
                continue; // Skip today's workouts
            }

            // V2 Format: Array of logs
            if (Array.isArray(record.logs)) {
                // Priority 1: Match by ID (Stable across renames)
                if (exerciseId) {
                    const logById = record.logs.find(l => l.exerciseId === exerciseId);
                    if (logById && logById.sets) return logById.sets;
                }

                // Priority 2: Match by Name (Exact)
                const logByName = record.logs.find(l => l.exerciseName === exerciseName);
                if (logByName && logByName.sets) return logByName.sets;

                // Priority 3: Match by Name (Fuzzy - trimming/case)
                if (exerciseName) {
                    const normalizedName = exerciseName.trim().toLowerCase();
                    const logByFuzzyName = record.logs.find(l =>
                        l.exerciseName && l.exerciseName.trim().toLowerCase() === normalizedName
                    );
                    if (logByFuzzyName && logByFuzzyName.sets) return logByFuzzyName.sets;
                }
            }
            // V1 Format: Object keyed by name
            else if (typeof record.logs === 'object') {
                if (record.logs[exerciseName]) {
                    return record.logs[exerciseName];
                }
            }
        }
        return null;
    };

    const handleNextExercise = (currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < sessionExercises.length) {
            setExpandedExerciseId(sessionExercises[nextIndex].id);
        } else {
            setExpandedExerciseId(null);
        }
    };

    const handleAddAdHocExercise = () => {
        if (!newExerciseName.trim()) return;
        const newEx = {
            id: `adhoc-${Date.now()}`,
            name: newExerciseName,
            sets: 3,
            reps: '8-12',
            rpe: 8,
            isAdHoc: true
        };
        setSessionExercises([...sessionExercises, newEx]);
        setNewExerciseName('');
        setIsAddingExercise(false);
        // Auto expand the new one
        setTimeout(() => setExpandedExerciseId(newEx.id), 100);
    };

    // Progress Stats
    const totalExercises = sessionExercises.length;
    const completedWrapper = sessionExercises.filter(ex => {
        const logs = sessionLogs[ex.id];
        return logs && logs.length >= (ex.sets || 3);
    });
    const completedCount = completedWrapper.length;
    const progressPercent = Math.round((completedCount / totalExercises) * 100);

    // Rest Timer State (Global)
    const [restState, setRestState] = useState({ isActive: false, endTime: null, totalDuration: 0, target: 90 });

    const handleStartRest = (targetSeconds = 90) => {
        setRestState({
            isActive: true,
            endTime: Date.now() + targetSeconds * 1000,
            target: targetSeconds,
            totalDuration: 0
        });
    };

    const handleStopRest = () => {
        setRestState(prev => ({ ...prev, isActive: false }));
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300 relative">
            {/* Top Bar (Fixed) */}
            <div className="flex justify-between items-end mb-4 px-2 pt-2">
                <div>
                    <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 text-[var(--color-text-muted)] pl-0 hover:text-[var(--color-text-main)]">&larr; Exit</Button>
                    <h2 className="text-3xl font-black italic text-[var(--color-text-main)] uppercase tracking-tighter leading-none">
                        {activeDay.name}
                    </h2>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <div className="font-mono text-xl font-black text-[var(--color-primary)] tracking-tight">{formatTime(duration)}</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-2 mb-6">
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundColor: '#D0FD3E',
                            boxShadow: '0 0 15px rgba(208,253,62,0.8)'
                        }}
                    ></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8E8E93' }}>
                    <span>{completedCount} / {totalExercises} Done</span>
                    <span style={{ color: '#D0FD3E' }}>{progressPercent}%</span>
                </div>
            </div>

            {/* Accordion List */}
            <div className="flex-1 overflow-auto flex flex-col gap-3 pb-32 px-1 no-scrollbar">
                {sessionExercises.map((ex, index) => {
                    const logs = sessionLogs[ex.id] || [];
                    const setsDone = logs.length;
                    const isTargetMet = setsDone >= (ex.sets || 3);
                    const isExpanded = expandedExerciseId === ex.id;
                    const isLast = index === sessionExercises.length - 1;
                    const isSuperset = ex.supersetWithPrevious;

                    return (
                        <div key={ex.id} ref={el => scrollRefs.current[ex.id] = el} className={`${isSuperset ? '-mt-4 relative z-10' : ''}`}>
                            {isSuperset && (
                                <div className="ml-4 w-0.5 h-4 bg-[var(--color-primary)]/50 mx-auto"></div>
                            )}
                            <Card
                                className={`
                                    transition-all duration-300 overflow-hidden
                                    ${isSuperset ? 'rounded-t-none border-t-0' : ''}
                                    ${isExpanded
                                        ? 'border-2 border-[var(--color-primary)] glow-border bg-[var(--color-surface)] shadow-[0_0_20px_rgba(208,253,62,0.1)]'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30'
                                    }
                                    ${isTargetMet && !isExpanded ? 'opacity-60 grayscale-[0.5]' : ''}
                                `}
                            >
                                {/* Header (Always Visible) - Click to toggle */}
                                <div
                                    onClick={() => toggleExpand(ex.id)}
                                    className="flex justify-between items-center p-1 cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Circle */}
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all border-2
                                            ${isTargetMet
                                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black'
                                                : isExpanded
                                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] animate-pulse'
                                                    : 'border-white/20 text-[var(--color-text-muted)]'
                                            }
                                        `}>
                                            {isTargetMet ? '✓' : ''}
                                        </div>

                                        <div>
                                            <h3 className={`font-black italic text-lg uppercase tracking-tight ${isTargetMet ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text-main)]'}`}>
                                                {ex.name} {ex.isAdHoc && <span className="text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] px-1 rounded text-[var(--color-text-muted)] not-italic font-normal align-middle ml-1">TEMP</span>}
                                            </h3>
                                            <div className="flex flex-col gap-2 mt-2 w-full">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8E8E93' }}>
                                                        {setsDone} / {ex.sets || 3} Done
                                                    </span>
                                                    <span className="text-[10px] font-bold" style={{ color: '#D0FD3E' }}>
                                                        {Math.round((setsDone / (ex.sets || 3)) * 100)}%
                                                    </span>
                                                </div>
                                                {/* Mini Progress Bar */}
                                                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div
                                                        className="h-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(100, (setsDone / (ex.sets || 3)) * 100)}%`,
                                                            backgroundColor: '#D0FD3E',
                                                            boxShadow: '0 0 10px rgba(208,253,62,0.6)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`transform transition-transform duration-300 text-[var(--color-text-muted)] ${isExpanded ? 'rotate-180' : ''}`}>
                                        ▼
                                    </div>
                                </div>

                                {/* Expanded Content (Logger) */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                        <ExerciseLogger
                                            exercise={ex}
                                            history={logs}
                                            lastSessionLogs={getLastLog(ex.name, ex.id)}
                                            onSaveSet={(data) => handleSaveSet(ex.id, data)}
                                            onNext={(action) => {
                                                if (action === 'REST_START') {
                                                    // Start Rest (Default 90s or exercise specific)
                                                    handleStartRest(ex.rest || 90);
                                                } else {
                                                    handleNextExercise(index);
                                                }
                                            }}
                                            isLastExercise={isLast}
                                        />
                                    </div>
                                )}
                            </Card>
                        </div>
                    );
                })}

                {/* ADD EXERCISE BUTTON */}
                {!isAddingExercise ? (
                    <Button variant="ghost" onClick={() => setIsAddingExercise(true)} className="border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:border-[var(--color-primary)] py-4">
                        + ADD AD-HOC EXERCISE
                    </Button>
                ) : (
                    <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] animate-in fade-in slide-in-from-bottom-2">
                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2 block">New Exercise Name</label>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-[var(--color-text-main)] font-bold focus:border-[var(--color-primary)] outline-none"
                                value={newExerciseName}
                                onChange={e => setNewExerciseName(e.target.value)}
                                placeholder="e.g. Pushups"
                                onKeyDown={e => e.key === 'Enter' && handleAddAdHocExercise()}
                            />
                            <Button onClick={handleAddAdHocExercise} variant="primary" className="font-black italic">ADD</Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsAddingExercise(false)} className="mt-2 text-xs text-[var(--color-text-muted)] w-full">Cancel</Button>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-20">
                <Button
                    className={`w-full py-4 text-xl font-black italic tracking-tight shadow-xl ${completedCount === totalExercises ? '' : 'text-[var(--color-text-muted)] opacity-80'}`}
                    variant={completedCount === totalExercises ? 'primary' : 'secondary'}
                    onClick={() => {
                        if (completedCount < totalExercises) {
                            if (window.confirm("You have incomplete exercises. Finish anyway?")) {
                                onFinishWorkout(sessionLogs, sessionExercises);
                            }
                        } else {
                            onFinishWorkout(sessionLogs, sessionExercises);
                        }
                    }}
                >
                    {completedCount === totalExercises ? 'FINISH WORKOUT 🏆' : 'FINISH NOW (INCOMPLETE)'}
                </Button>
            </div>
            {/* Global Floating Rest Timer */}
            {/* Global Floating Rest Timer */}
            {restState.isActive && (
                <div className="fixed top-24 left-0 right-0 z-50 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none flex justify-center">
                    <div className="pointer-events-auto bg-black border border-[var(--color-primary)]/30 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)] scale-90 backdrop-blur-md">
                        <span className="text-[9px] font-black uppercase text-[var(--color-primary)] tracking-widest whitespace-nowrap">Rest</span>
                        <div className="min-w-[50px] flex justify-center">
                            <RestTimer
                                initialSeconds={restState.target}
                                onStop={() => { }}
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleStopRest}
                            className="h-6 w-10 rounded-full bg-[var(--color-primary)] text-black font-black text-[10px] hover:scale-105 transition-transform p-0"
                        >
                            GO
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
