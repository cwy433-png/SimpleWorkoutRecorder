import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

import { ExerciseLogger } from './ExerciseLogger';
import { useWorkoutSession } from './SessionContext';

const createAlternativeId = () => `alt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const SessionDashboard = ({ onFinishWorkout, onBack, isBottomNavVisible = false, onBottomReachChange }) => {
    const {
        state,
        setExpanded,
        saveSet,
        addAdHocExercise,
        keepAdHocExercise,
        startRest,
    } = useWorkoutSession();

    const {
        plan,
        dayIndex,
        sessionExercises,
        sessionLogs,
        expandedExerciseId,
        startTime,
    } = state;

    // Derived
    const activeDay = plan?.days?.[dayIndex];

    // Local UI-only state
    const [tickNow, setTickNow] = useState(Date.now);
    const duration = startTime ? Math.floor((tickNow - startTime) / 1000) : 0;
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const listRef = useRef(null);
    const scrollRefs = useRef({});

    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // Workout duration tick
    useEffect(() => {
        if (!startTime) return undefined;
        const timer = setInterval(() => {
            setTickNow(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    // Auto-scroll to expanded item
    useEffect(() => {
        if (expandedExerciseId && scrollRefs.current[expandedExerciseId]) {
            scrollRefs.current[expandedExerciseId].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [expandedExerciseId]);

    // History Lookup (one-time read of saved history for "Last" column)
    const [historyData] = useState(() => {
        try {
            const raw = localStorage.getItem('workout_history');
            const savedHistory = raw ? JSON.parse(raw) : [];
            if (Array.isArray(savedHistory)) {
                return savedHistory;
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
        return [];
    }, []);

    const handleListScroll = useCallback(() => {
        const list = listRef.current;
        if (!list || !onBottomReachChange) return;
        const isAtBottom = list.scrollHeight - list.scrollTop - list.clientHeight <= 12;
        onBottomReachChange(isAtBottom);
    }, [onBottomReachChange]);

    useEffect(() => {
        const frame = requestAnimationFrame(handleListScroll);
        return () => cancelAnimationFrame(frame);
    }, [handleListScroll, sessionExercises.length, expandedExerciseId, isAddingExercise]);

    // Render Error if data missing (after hooks)
    if (!activeDay) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-4">
                <div className="text-red-500 font-bold text-xl">Error: Workout Data Not Found</div>
                <div className="text-white/50 text-sm">Plan: {plan?.title || 'None'}, Day Index: {dayIndex}</div>
                <Button onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const toggleExpand = (id) => setExpanded(id);

    const handleSaveSet = (exerciseId, setData) => saveSet(exerciseId, setData);

    const normalizeExerciseName = (name) => (name || '').trim().toLowerCase();

    const activeDayAlternatives = Array.isArray(activeDay?.alternativeExercises)
        ? activeDay.alternativeExercises
        : [];

    const isExerciseAlreadyInSession = (exercise) => {
        const normalizedName = normalizeExerciseName(exercise?.name);
        if (!normalizedName) return false;
        return sessionExercises.some(ex =>
            ex.id === exercise.id || normalizeExerciseName(ex.name) === normalizedName
        );
    };

    const addExerciseToSession = (exercise) => {
        if (!exercise?.name) return;

        const existing = sessionExercises.find(ex =>
            ex.id === exercise.id || normalizeExerciseName(ex.name) === normalizeExerciseName(exercise.name)
        );
        if (existing) {
            if (expandedExerciseId !== existing.id) setExpanded(existing.id);
            return;
        }

        const sessionExercise = {
            ...exercise,
            isAdHoc: true,
            isKept: true,
            sourceAlternativeId: exercise.id,
        };
        addAdHocExercise(sessionExercise);
        setTimeout(() => setExpanded(sessionExercise.id), 100);
    };

    const persistAlternativeExercise = (exercise) => {
        const normalizedName = normalizeExerciseName(exercise.name);
        const now = new Date().toISOString();
        const rawPlans = JSON.parse(localStorage.getItem('workout_plans') || '[]');
        const planIndex = rawPlans.findIndex(p => String(p.id) === String(plan?.id));

        if (planIndex === -1) {
            window.alert('Could not find this plan in saved plans.');
            return { status: 'missing-plan' };
        }

        const nextPlans = [...rawPlans];
        const targetPlan = { ...nextPlans[planIndex] };
        const days = [...(targetPlan.days || [])];
        let resolvedDayIndex = -1;

        if (activeDay?.id) {
            resolvedDayIndex = days.findIndex(day => day.id === activeDay.id);
            if (resolvedDayIndex === -1) {
                window.alert('This workout day no longer exists in the saved plan. Please restart the workout from the updated plan.');
                return { status: 'missing-day' };
            }
        } else {
            const fallbackDay = days[dayIndex];
            const fallbackMatches = fallbackDay && normalizeExerciseName(fallbackDay.name) === normalizeExerciseName(activeDay?.name);
            if (!fallbackMatches) {
                window.alert('Could not safely match this workout day in the saved plan.');
                return { status: 'day-mismatch' };
            }
            resolvedDayIndex = dayIndex;
        }

        const targetDay = days[resolvedDayIndex];

        if (!targetDay) {
            window.alert('Could not find this workout day in the saved plan.');
            return { status: 'missing-day' };
        }

        const plannedExercises = Array.isArray(targetDay.exercises) ? targetDay.exercises : [];
        const alreadyPlanned = plannedExercises.some(ex => normalizeExerciseName(ex.name) === normalizedName);
        if (alreadyPlanned) {
            return { status: 'already-planned' };
        }

        const alternatives = Array.isArray(targetDay.alternativeExercises)
            ? targetDay.alternativeExercises
            : [];
        const existingAlternative = alternatives.find(ex => normalizeExerciseName(ex.name) === normalizedName);
        const alternativeExercise = {
            ...(existingAlternative || {}),
            id: existingAlternative?.id || createAlternativeId(),
            name: exercise.name.trim(),
            sets: exercise.sets || 3,
            reps: exercise.reps || '8-12',
            rpe: exercise.rpe || 8,
            targetRest: exercise.targetRest || 90,
            notes: exercise.notes || '',
            createdFromAdHoc: true,
            createdAt: existingAlternative?.createdAt || now,
            lastUsedAt: now,
            useCount: (existingAlternative?.useCount || 0) + 1,
        };

        days[resolvedDayIndex] = {
            ...targetDay,
            alternativeExercises: existingAlternative
                ? alternatives.map(ex => normalizeExerciseName(ex.name) === normalizedName ? alternativeExercise : ex)
                : [...alternatives, alternativeExercise],
        };
        targetPlan.days = days;
        nextPlans[planIndex] = targetPlan;
        localStorage.setItem('workout_plans', JSON.stringify(nextPlans));

        return { status: 'saved', exercise: alternativeExercise };
    };

    const handleKeepAdHocExercise = (event, exercise) => {
        event.stopPropagation();
        if (!exercise?.isAdHoc || exercise.isKept) return;

        const confirmed = window.confirm(`Add "${exercise.name}" to ${activeDay.name} alternatives?`);
        if (!confirmed) return;

        const normalizedName = normalizeExerciseName(exercise.name);
        const alreadyPlanned = (activeDay.exercises || []).some(ex => normalizeExerciseName(ex.name) === normalizedName);
        if (alreadyPlanned) {
            keepAdHocExercise(exercise.id, null);
            window.alert(`"${exercise.name}" is already a planned exercise for this day.`);
            return;
        }

        const result = persistAlternativeExercise(exercise);
        if (result.status === 'saved') {
            keepAdHocExercise(exercise.id, result.exercise);
            return;
        }

        if (result.status === 'already-planned') {
            keepAdHocExercise(exercise.id, null);
            window.alert(`"${exercise.name}" is already a planned exercise for this day.`);
        }
    };

    const findExerciseLogInRecord = (record, exerciseName, exerciseId) => {
        if (!record?.logs) return null;
        const normalizedName = normalizeExerciseName(exerciseName);

        // V2 Format: Array of logs
        if (Array.isArray(record.logs)) {
            if (exerciseId) {
                const logById = record.logs.find(l => String(l.exerciseId) === String(exerciseId));
                if (logById?.sets) return logById;
            }

            const logByName = record.logs.find(l => l.exerciseName === exerciseName);
            if (logByName?.sets) return logByName;

            if (normalizedName) {
                const logByFuzzyName = record.logs.find(l =>
                    normalizeExerciseName(l.exerciseName) === normalizedName
                );
                if (logByFuzzyName?.sets) return logByFuzzyName;
            }
        }

        // V1 Format: Object keyed by name
        if (typeof record.logs === 'object') {
            if (record.logs[exerciseName]) {
                return { exerciseName, sets: record.logs[exerciseName] };
            }

            if (normalizedName) {
                const legacyKey = Object.keys(record.logs).find(key => normalizeExerciseName(key) === normalizedName);
                if (legacyKey) {
                    return { exerciseName: legacyKey, sets: record.logs[legacyKey] };
                }
            }
        }

        return null;
    };

    const getExerciseHistoryLogs = (exerciseName, exerciseId) => {
        if (!historyData || !Array.isArray(historyData)) return [];

        const today = new Date();
        const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        return historyData
            .filter(record => record?.logs && record.date)
            .filter(record => {
                const recordDate = new Date(record.date);
                const recordDateString = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
                return recordDateString !== todayDateString;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(record => {
                const log = findExerciseLogInRecord(record, exerciseName, exerciseId);
                if (!log?.sets?.length) return null;
                return {
                    id: `${record.id || record.date}-${log.exerciseId || log.exerciseName || exerciseName}`,
                    date: record.date,
                    planTitle: record.planTitle,
                    dayName: record.dayName,
                    sets: log.sets,
                };
            })
            .filter(Boolean);
    };

    const handleNextExercise = (currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < sessionExercises.length) {
            const nextId = sessionExercises[nextIndex].id;
            // setExpanded toggles; only dispatch if not already expanded
            if (expandedExerciseId !== nextId) setExpanded(nextId);
        } else if (expandedExerciseId) {
            setExpanded(expandedExerciseId); // toggles current to closed
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
        addAdHocExercise(newEx);
        setNewExerciseName('');
        setIsAddingExercise(false);
        // Auto expand the new one
        setTimeout(() => setExpanded(newEx.id), 100);
    };

    // Progress Stats
    const totalExercises = sessionExercises.length;
    const completedWrapper = sessionExercises.filter(ex => {
        const logs = sessionLogs[ex.id];
        return logs && logs.length >= (ex.sets || 3);
    });
    const completedCount = completedWrapper.length;
    const progressPercent = totalExercises > 0
        ? Math.round((completedCount / totalExercises) * 100)
        : 0;

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
            <div ref={listRef} onScroll={handleListScroll} className="flex-1 overflow-auto flex flex-col gap-3 pb-48 px-1 no-scrollbar">
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
                                                {ex.name} {ex.isAdHoc && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleKeepAdHocExercise(event, ex)}
                                                        className={`inline-flex min-h-7 items-center border px-2.5 py-1 text-[10px] rounded-none not-italic align-middle ml-1 transition-all ${ex.isKept
                                                            ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                                                            : 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]'
                                                            }`}
                                                        aria-label={ex.isKept ? `${ex.name} kept as alternative` : `Keep ${ex.name} as an alternative`}
                                                    >
                                                        {ex.isKept ? 'KEPT' : 'KEEP'}
                                                    </button>
                                                )}
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
                                            previousSessions={getExerciseHistoryLogs(ex.name, ex.id)}
                                            onSaveSet={(data) => handleSaveSet(ex.id, data)}
                                            onNext={(action) => {
                                                if (action === 'REST_START') {
                                                    startRest(ex.id, ex.targetRest || 90);
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
                <div className="flex flex-col gap-3">
                    {activeDayAlternatives.length > 0 && (
                        <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Kept Alternatives</div>
                            <div className="flex flex-wrap gap-2">
                                {activeDayAlternatives.map(exercise => {
                                    const alreadyAdded = isExerciseAlreadyInSession(exercise);
                                    return (
                                        <button
                                            key={exercise.id}
                                            type="button"
                                            onClick={() => addExerciseToSession(exercise)}
                                            className={`px-2.5 py-1.5 border text-[10px] font-black uppercase tracking-wider transition-all ${alreadyAdded
                                                ? 'border-[var(--color-border)] text-[var(--color-text-muted)] opacity-50'
                                                : 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black'
                                                }`}
                                        >
                                            {alreadyAdded ? 'ADDED ' : '+ '}{exercise.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

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
            </div>

            {/* Footer Action */}
            <div className={`fixed left-0 right-0 p-4 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-40 transition-[bottom] duration-300 ${isBottomNavVisible ? 'bottom-24' : 'bottom-0'}`}>
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
                    {completedCount === totalExercises ? 'FINISH WORKOUT' : 'FINISH NOW (INCOMPLETE)'}
                </Button>
            </div>

        </div>
    );
};
