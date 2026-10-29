import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Link2, X } from 'lucide-react';
import { createDay, createExercise, createPlan } from './PlanModel';

export const PlanEditor = ({ plan: initialPlan, onSave, onCancel, onHome }) => {
    const [plan, setPlan] = useState(initialPlan || createPlan("New Plan"));

    const updatePlanTitle = (title) => setPlan({ ...plan, title });

    const addDay = () => {
        setPlan({ ...plan, days: [...plan.days, createDay(`Day ${plan.days.length + 1}`)] });
    };

    const addRestDay = () => {
        const restDay = createDay(`Rest Day`);
        restDay.isRestDay = true;
        restDay.exercises = []; // No exercises for rest day
        setPlan({ ...plan, days: [...plan.days, restDay] });
    };

    const updateDayName = (dayIndex, name) => {
        const newDays = [...plan.days];
        newDays[dayIndex].name = name;
        setPlan({ ...plan, days: newDays });
    };

    const addExercise = (dayIndex) => {
        const newDays = [...plan.days];
        newDays[dayIndex].exercises.push(createExercise(""));
        setPlan({ ...plan, days: newDays });
    };

    const calculateSmartRest = (reps, rpe) => {
        /**
         * SPORTS SCIENCE LOGIC (Bio-Energetics & Neural Recovery):
         * 
         * 1. STRENGTH (1-5 Reps) -> Phosphagen System (ATP-PCr)
         *    - Limiting Factor: CNS Fatigue & ATP replenishment.
         *    - Recovery: 3 min (85%), 5 min (100%).
         *    - Goal: Max force production. FATIGUE IS THE ENEMY.
         *    - Rec: 3-5 mins.
         * 
         * 2. HYPERTROPHY (6-12 Reps) -> Glycolytic System & Mechanical Tension
         *    - Old School: Short rest (60s) for "Metabolic Stress".
         *    - Modern Science: "Mechanical Tension" is the primary driver.
         *    - Logic: Longer rest (2-3m) = Higher Volume Load in later sets = More Growth.
         *    - Rec: 2-3 mins for hard sets. 90s only for low RPE/Isolation.
         * 
         * 3. ENDURANCE (15+ Reps) -> Oxidative / Acid Buffering
         *    - Goal: Train lactate clearance and buffering capacity.
         *    - Logic: Incomplete recovery forces adaptation.
         *    - Rec: 30-60s (strict).
         * 
         * *Variable Update*: We assume cumulative fatigue across ~3-4 sets.
         * Values are biased towards ensuring readiness for the *final* set.
         */

        const rpeVal = Number(rpe) || 8;

        // Parse reps (handle "8-12" -> 10)
        let repVal = 10;
        if (typeof reps === 'string' && reps.includes('-')) {
            const parts = reps.split('-').map(Number);
            repVal = (parts[0] + parts[1]) / 2;
        } else {
            repVal = parseInt(reps) || 10;
        }

        // ZONE 1: STRENGTH (CNS Priority)
        if (repVal <= 5) {
            if (rpeVal >= 9) return 300; // 5 min: Neural limit / PR attempts
            if (rpeVal >= 8) return 240; // 4 min: Heavy working sets
            return 180; // 3 min: Minimum standard for ATP-PCr
        }

        // ZONE 2: HYPERTROPHY (Volume Priority)
        if (repVal <= 12) {
            if (rpeVal >= 9) return 180; // 3 min: Ensure rep matching on next set
            if (rpeVal >= 7) return 120; // 2 min: Optimal balance for compounds
            return 90; // 1.5 min: Isolation / Low RPE
        }

        // ZONE 3: ENDURANCE (Metabolic Priority)
        if (repVal > 12) {
            if (rpeVal >= 9) return 90; // Allow heart rate to settle slightly
            return 60; // Standard buffering training
        }

        return 90; // Fallback
    };

    const updateExercise = (dayIndex, exIndex, field, value) => {
        const newDays = [...plan.days];
        const exercise = newDays[dayIndex].exercises[exIndex];
        exercise[field] = value;

        // Auto-suggest rest if Reps or RPE changes (User UX: Subtle magic)
        if (field === 'reps' || field === 'rpe') {
            exercise.targetRest = calculateSmartRest(
                field === 'reps' ? value : exercise.reps,
                field === 'rpe' ? value : exercise.rpe
            );
        }

        setPlan({ ...plan, days: newDays });
    };

    const removeExercise = (dayIndex, exIndex) => {
        const newDays = [...plan.days];
        newDays[dayIndex].exercises.splice(exIndex, 1);
        setPlan({ ...plan, days: newDays });
    };

    const removeDay = (dayIndex) => {
        const newDays = [...plan.days];
        newDays.splice(dayIndex, 1);
        setPlan({ ...plan, days: newDays });
    };

    const fieldLabel = 'text-center font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted';
    const numField = 'w-full min-w-0 border border-border bg-bg px-1 py-2 text-center font-mono text-sm font-bold text-text-main outline-none transition-colors focus:border-primary';
    const removeBtn = 'flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center text-text-muted transition-colors hover:text-alert';

    // No animate-in on the root: its retained transform would trap the fixed footer.
    return (
        <div className="relative flex w-full flex-col">
            <PageHeader
                tag="PLAN"
                title="Edit Plan"
                sub={`${plan.days.length} ${plan.days.length === 1 ? 'DAY' : 'DAYS'}`}
                right={onHome && <Button variant="link" onClick={onHome}>HOME</Button>}
            />

            <div className="flex flex-col gap-4 px-4 pb-48 pt-4">
                <div>
                    <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">General Info</label>
                    <input
                        className="w-full border border-border bg-bg p-3 text-xl font-bold text-text-main transition-colors focus:border-primary focus:outline-none"
                        value={plan.title}
                        onChange={(e) => updatePlanTitle(e.target.value)}
                        placeholder="Plan Title"
                    />
                </div>

                {plan.days.map((day, dayIndex) => (
                    <Card key={day.id}>
                        <div className="mb-4 flex items-center gap-2">
                            <input
                                className="min-w-0 flex-1 border border-border bg-bg px-3 py-2 text-lg font-black uppercase text-text-main transition-colors focus:border-primary focus:outline-none"
                                value={day.name}
                                onChange={(e) => updateDayName(dayIndex, e.target.value)}
                                placeholder="DAY NAME"
                            />
                            <button onClick={() => removeDay(dayIndex)} className={removeBtn} aria-label="Remove day">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {day.exercises.map((ex, exIndex) => (
                                <div key={ex.id} className="border border-border bg-bg p-3">
                                    <div className="mb-3 flex items-center">
                                        <div className="mr-2 flex-1 border-b-2 border-dashed border-border pb-1 transition-colors focus-within:border-primary">
                                            <input
                                                className="w-full border-none bg-transparent text-lg font-black uppercase tracking-tight text-text-main caret-primary focus:outline-none placeholder:text-primary-text placeholder:opacity-70"
                                                value={ex.name}
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
                                                placeholder="NEW EXERCISE"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            {exIndex > 0 && (
                                                <button
                                                    onClick={() => updateExercise(dayIndex, exIndex, 'supersetWithPrevious', !ex.supersetWithPrevious)}
                                                    className={`flex h-9 w-9 cursor-pointer items-center justify-center border transition-colors ${ex.supersetWithPrevious ? 'border-primary bg-primary-soft text-primary-text' : 'border-transparent text-text-muted hover:text-text-main'}`}
                                                    title="Superset with previous"
                                                    aria-label="Superset with previous"
                                                    aria-pressed={!!ex.supersetWithPrevious}
                                                >
                                                    <Link2 size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => removeExercise(dayIndex, exIndex)} className={removeBtn} aria-label="Remove exercise">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <label className={fieldLabel}>Sets</label>
                                            <input
                                                className={numField}
                                                value={ex.sets}
                                                type="number"
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className={fieldLabel}>Reps</label>
                                            <input
                                                className={numField}
                                                value={ex.reps}
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'reps', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className={fieldLabel}>RPE</label>
                                            <input
                                                className={`${numField} !text-primary-text`}
                                                value={ex.rpe}
                                                type="number"
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'rpe', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className={fieldLabel}>Rest (s)</label>
                                            <input
                                                className={numField}
                                                value={ex.targetRest || 90}
                                                type="number"
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'targetRest', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!day.isRestDay && (
                                <button
                                    onClick={() => addExercise(dayIndex)}
                                    className="min-h-[48px] cursor-pointer border border-dashed border-border font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted transition-colors hover:border-primary hover:text-primary-text"
                                >
                                    + ADD EXERCISE
                                </button>
                            )}
                            {day.isRestDay && (
                                <div className="py-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
                                    Recovery day · no exercises
                                </div>
                            )}
                        </div>
                    </Card>
                ))}

                <div className="flex gap-2">
                    <button
                        onClick={addDay}
                        className="flex min-h-[48px] flex-1 cursor-pointer items-center justify-center border border-border bg-surface font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-main transition-colors hover:border-primary"
                    >
                        + WORKOUT DAY
                    </button>
                    <button
                        onClick={addRestDay}
                        className="flex min-h-[48px] cursor-pointer items-center justify-center whitespace-nowrap border border-dashed border-border px-4 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted transition-colors hover:border-primary hover:text-primary-text"
                    >
                        + REST DAY
                    </button>
                </div>
            </div>

            {/* Sits above the 80px bottom nav, which is shown on this page. */}
            <div className="fixed inset-x-0 bottom-20 z-20 border-t border-border bg-bg">
                <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
                    <Button variant="link" className="flex-shrink-0" onClick={onCancel}>CANCEL</Button>
                    <Button label="PLAN" className="flex-1" onClick={() => onSave(plan)}>SAVE</Button>
                </div>
            </div>
        </div>
    );
};
