import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useDialog } from '../../components/ui/Dialog';

import { ExerciseLogger } from './ExerciseLogger';
import { useWorkoutSession } from './SessionContext';
import { usePublishHeight, BOTTOM_ABOVE_NAV_AND_BAR } from '../../lib/bottomStack';

const createAlternativeId = () => `alt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const SessionDashboard = ({ onBack, onBottomReachChange }) => {
    const dialog = useDialog();
    const {
        state,
        setExpanded,
        saveSet,
        addAdHocExercise,
        keepAdHocExercise,
        startRest,
        beginDebrief,
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
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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

    // Publish the FINISH bar height so the rest timer floats above it.
    const footerRef = useRef(null);
    usePublishHeight('--footer-h', footerRef, Boolean(activeDay));

    // Render Error if data missing (after hooks)
    if (!activeDay) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-4">
                <div className="font-black text-xl uppercase text-alert">Error: Workout Data Not Found</div>
                <div className="font-mono text-sm text-text-muted">Plan: {plan?.title || 'None'}, Day Index: {dayIndex}</div>
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
            dialog.notify('Could not find this plan in saved plans.', { tone: 'danger' });
            return { status: 'missing-plan' };
        }

        const nextPlans = [...rawPlans];
        const targetPlan = { ...nextPlans[planIndex] };
        const days = [...(targetPlan.days || [])];
        let resolvedDayIndex = -1;

        if (activeDay?.id) {
            resolvedDayIndex = days.findIndex(day => day.id === activeDay.id);
            if (resolvedDayIndex === -1) {
                dialog.notify('This workout day no longer exists in the saved plan. Please restart the workout from the updated plan.', { tone: 'danger' });
                return { status: 'missing-day' };
            }
        } else {
            const fallbackDay = days[dayIndex];
            const fallbackMatches = fallbackDay && normalizeExerciseName(fallbackDay.name) === normalizeExerciseName(activeDay?.name);
            if (!fallbackMatches) {
                dialog.notify('Could not safely match this workout day in the saved plan.', { tone: 'danger' });
                return { status: 'day-mismatch' };
            }
            resolvedDayIndex = dayIndex;
        }

        const targetDay = days[resolvedDayIndex];

        if (!targetDay) {
            dialog.notify('Could not find this workout day in the saved plan.', { tone: 'danger' });
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

    const handleKeepAdHocExercise = async (event, exercise) => {
        event.stopPropagation();
        if (!exercise?.isAdHoc || exercise.isKept) return;

        const confirmed = await dialog.confirm({
            title: 'KEEP AS ALTERNATIVE',
            message: `Add "${exercise.name}" to ${activeDay.name} alternatives?`,
            confirmLabel: 'ADD',
        });
        if (!confirmed) return;

        const normalizedName = normalizeExerciseName(exercise.name);
        const alreadyPlanned = (activeDay.exercises || []).some(ex => normalizeExerciseName(ex.name) === normalizedName);
        if (alreadyPlanned) {
            keepAdHocExercise(exercise.id, null);
            dialog.notify(`"${exercise.name}" is already a planned exercise for this day.`);
            return;
        }

        const result = persistAlternativeExercise(exercise);
        if (result.status === 'saved') {
            keepAdHocExercise(exercise.id, result.exercise);
            return;
        }

        if (result.status === 'already-planned') {
            keepAdHocExercise(exercise.id, null);
            dialog.notify(`"${exercise.name}" is already a planned exercise for this day.`);
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

    return (
        // No animate-in here: its forwards-filled transform would become the containing
        // block of the fixed footer bar and pin it to this wrapper instead of the viewport.
        <div className="flex flex-col h-full relative">
            <PageHeader
                tag={`SESSION · ${formatTime(duration)}`}
                title={activeDay.name}
                sub={`${completedCount} / ${totalExercises} EXERCISES DONE`}
                right={<Button variant="link" size="sm" onClick={onBack}>&larr; Exit</Button>}
            />

            {/* Accordion List */}
            <div ref={listRef} onScroll={handleListScroll} className="flex-1 overflow-auto flex flex-col gap-3 pb-48 px-4 pt-4 no-scrollbar">
                {sessionExercises.map((ex, index) => {
                    const logs = sessionLogs[ex.id] || [];
                    const setsDone = logs.length;
                    const targetSets = ex.sets || 3;
                    const isTargetMet = setsDone >= targetSets;
                    const isExpanded = expandedExerciseId === ex.id;
                    const isLast = index === sessionExercises.length - 1;
                    const isSuperset = ex.supersetWithPrevious;

                    return (
                        <div key={ex.id} ref={el => scrollRefs.current[ex.id] = el} className={`${isSuperset ? '-mt-4 relative z-10' : ''}`}>
                            {isSuperset && (
                                <div className="ml-4 w-0.5 h-4 bg-primary/50 mx-auto"></div>
                            )}
                            <Card
                                flush
                                active={isExpanded}
                                className={`
                                    transition-colors duration-300
                                    ${isSuperset ? 'border-t-0' : ''}
                                    ${isTargetMet && !isExpanded ? 'opacity-60' : ''}
                                `}
                            >
                                {/* Header (Always Visible) - Click to toggle */}
                                <div
                                    onClick={() => toggleExpand(ex.id)}
                                    className="flex justify-between items-center gap-3 p-3 cursor-pointer"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        {/* Status box */}
                                        <div className={`
                                            flex h-7 w-7 flex-shrink-0 items-center justify-center border-2 transition-colors
                                            ${isTargetMet
                                                ? 'border-primary bg-primary text-primary-ink'
                                                : isExpanded
                                                    ? 'border-primary text-primary-text'
                                                    : 'border-border text-text-muted'
                                            }
                                        `}>
                                            {isTargetMet && <Check size={16} strokeWidth={3} />}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className={`m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-black uppercase tracking-[0.02em] ${isTargetMet ? 'text-text-muted line-through' : 'text-text-main'}`}>
                                                <span className="break-words">{ex.name}</span>
                                                {ex.isAdHoc && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleKeepAdHocExercise(event, ex)}
                                                        className={`inline-flex min-h-7 items-center border px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.15em] no-underline transition-colors ${ex.isKept
                                                            ? 'bg-surface border-border text-text-muted'
                                                            : 'bg-primary text-primary-ink border-primary'
                                                            }`}
                                                        aria-label={ex.isKept ? `${ex.name} kept as alternative` : `Keep ${ex.name} as an alternative`}
                                                    >
                                                        {ex.isKept ? 'KEPT' : 'KEEP'}
                                                    </button>
                                                )}
                                            </h3>
                                            <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                                                {setsDone} / {targetSets} SETS
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-2">
                                        <span className={`font-mono text-xs font-bold ${setsDone > 0 ? 'text-primary-text' : 'text-text-muted'}`}>
                                            {Math.round((setsDone / targetSets) * 100)}%
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Content (Logger) */}
                                {isExpanded && (
                                    <div className="border-t border-border px-3 pb-3 pt-3">
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
                        <div className="border border-border bg-surface p-3">
                            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Kept Alternatives</div>
                            <div className="flex flex-wrap gap-2">
                                {activeDayAlternatives.map(exercise => {
                                    const alreadyAdded = isExerciseAlreadyInSession(exercise);
                                    return (
                                        <button
                                            key={exercise.id}
                                            type="button"
                                            onClick={() => addExerciseToSession(exercise)}
                                            className={`border bg-bg px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${alreadyAdded
                                                ? 'border-border text-text-muted opacity-60'
                                                : 'border-primary text-primary-text hover:bg-primary hover:text-primary-ink'
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
                        <Button variant="link" onClick={() => setIsAddingExercise(true)} className="w-full border border-dashed border-border py-3 hover:border-primary">
                            + ADD AD-HOC EXERCISE
                        </Button>
                    ) : (
                        <div className="border border-border bg-surface p-4 animate-in fade-in slide-in-from-bottom-2">
                            <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">New Exercise Name</label>
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    className="min-w-0 flex-1 border border-border bg-bg px-3 py-2 font-bold text-text-main outline-none focus:border-primary"
                                    value={newExerciseName}
                                    onChange={e => setNewExerciseName(e.target.value)}
                                    placeholder="e.g. Pushups"
                                    onKeyDown={e => e.key === 'Enter' && handleAddAdHocExercise()}
                                />
                                <div className="w-24 flex-shrink-0">
                                    <Button variant="compact" onClick={handleAddAdHocExercise}>ADD</Button>
                                </div>
                            </div>
                            <Button variant="link" size="sm" onClick={() => setIsAddingExercise(false)} className="mt-2 w-full">Cancel</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Action: sits flush above the bottom nav / session bar (heights come from CSS variables) */}
            <div
                ref={footerRef}
                style={{ bottom: BOTTOM_ABOVE_NAV_AND_BAR }}
                className="fixed left-0 right-0 z-40 border-t border-border bg-bg px-4 py-3 transition-[bottom] duration-300"
            >
                <Button
                    variant="primary"
                    label={`SESSION · ${String(activeDay.name || '').toUpperCase()}`}
                    onClick={() => beginDebrief()}
                >
                    {completedCount === totalExercises ? 'FINISH WORKOUT' : 'FINISH NOW'}
                </Button>
            </div>

        </div>
    );
};
