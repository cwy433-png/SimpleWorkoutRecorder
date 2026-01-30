import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RestTimer } from './RestTimer';

export const WorkoutSession = ({ plan, onFinish }) => {
    // If plan has days, pick the first one for MVP, or let user choose. 
    // For now, assuming plan is normalized and we just take the first day or the plan itself is flat.
    // Let's assume the user selected a "Day" to start.
    const activeDay = plan.days?.[0] || { name: 'Quick Workout', exercises: [] };

    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [logs, setLogs] = useState({}); // { exerciseId: [ {weight, reps, rpe} ] }
    const [isResting, setIsResting] = useState(false);

    // Current Exercise Data
    const exercise = activeDay.exercises[currentExerciseIndex];

    // Form State for current set
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [rpe, setRpe] = useState('');

    const handleLogSet = () => {
        if (!weight || !reps) return;

        const newLog = { weight, reps, rpe, timestamp: Date.now() };
        const exKey = exercise?.id || currentExerciseIndex; // Fallback key

        setLogs(prev => ({
            ...prev,
            [exKey]: [...(prev[exKey] || []), newLog]
        }));

        // Clear inputs mostly, keep weight for convenience
        // setWeight(weight); 
        setReps('');
        setRpe('');

        // Trigger Rest
        setIsResting(true);
    };

    const nextExercise = () => {
        if (currentExerciseIndex < activeDay.exercises.length - 1) {
            setCurrentExerciseIndex(i => i + 1);
            setLogs({}); // In a real app we might load previous logs
        } else {
            onFinish();
        }
    };

    if (!exercise) {
        return (
            <div className="text-center mt-10">
                <h2>Empty Workout?</h2>
                <Button onClick={onFinish}>Go Back</Button>
            </div>
        );
    }

    // Calculate Sets Done
    const setsDone = logs[exercise.id || currentExerciseIndex]?.length || 0;
    const targetSets = exercise.sets || 3;

    return (
        <div className="flex flex-col h-full gap-4 relative">
            {/* Header */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--color-primary)]">{exercise.name}</h2>
                    <p className="text-[var(--color-text-muted)]">
                        Set {setsDone + 1} of {targetSets} • Target: {exercise.reps} reps @ RPE {exercise.rpe}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-[var(--color-text-muted)]">Next:</span>
                    <br />
                    <span className="text-sm font-bold">
                        {activeDay.exercises[currentExerciseIndex + 1]?.name || "Finish"}
                    </span>
                </div>
            </div>

            {/* Main Input Area */}
            <Card className="flex flex-col gap-4">
                <div className="flex justify-center gap-6">
                    <div className="flex flex-col items-center">
                        <label className="text-sm text-center mb-2 font-black uppercase text-[var(--color-text-muted)] w-20">KG</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={weight}
                            onChange={e => setWeight(e.target.value)}
                            className="w-20 p-3 text-3xl text-center bg-[var(--color-surface-hover)] rounded-lg text-white border-2 border-white/20 focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="0"
                        />
                    </div>
                    <div className="flex flex-col items-center">
                        <label className="text-sm text-center mb-2 font-black uppercase text-[var(--color-text-muted)] w-20">REPS</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={reps}
                            onChange={e => setReps(e.target.value)}
                            className="w-20 p-3 text-3xl text-center bg-[var(--color-surface-hover)] rounded-lg text-white border-2 border-white/20 focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="0"
                        />
                    </div>
                    <div className="flex flex-col items-center">
                        <label className="text-sm text-center mb-2 font-black uppercase text-[var(--color-text-muted)] w-20">RPE</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={rpe}
                            onChange={e => setRpe(e.target.value)}
                            className="w-20 p-3 text-3xl text-center bg-[var(--color-surface-hover)] rounded-lg text-[var(--color-primary)] border-2 border-white/20 focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="-"
                        />
                    </div>
                </div>

                <Button size="lg" onClick={handleLogSet} className="w-full py-4 text-lg">
                    LOG SET
                </Button>
            </Card>

            {/* Current Session History */}
            <div className="flex-1 overflow-auto">
                <h4 className="text-sm font-bold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Previous Sets</h4>
                <div className="flex flex-col gap-2">
                    {(logs[exercise.id || currentExerciseIndex] || []).map((log, i) => (
                        <div key={i} className="flex justify-between items-center bg-[var(--color-surface)] p-3 rounded-lg border-l-2 border-[var(--color-text-muted)]">
                            <span className="font-mono text-[var(--color-text-muted)]">Set {i + 1}</span>
                            <div className="flex gap-4">
                                <span className="font-bold">{log.weight}<small className="text-[var(--color-text-muted)]">kg</small></span>
                                <span className="font-bold">{log.reps}<small className="text-[var(--color-text-muted)]">reps</small></span>
                                {log.rpe && <span className="text-[var(--color-primary)] font-bold">@{log.rpe}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logic to show Next Exercise if sets are done - manually for now */}
            <div className="mt-auto pt-4">
                <Button variant="secondary" className="w-full" onClick={nextExercise}>
                    Skip / Next Exercise &rarr;
                </Button>
            </div>

            {/* Rest Timer Overlay */}
            {isResting && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
                    <div className="w-full max-w-sm">
                        <h3 className="text-center mb-4 text-2xl font-bold text-white">Rest Time</h3>
                        <RestTimer onComplete={() => setIsResting(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};
