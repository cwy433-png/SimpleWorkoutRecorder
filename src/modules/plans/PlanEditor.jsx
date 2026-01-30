import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { createDay, createExercise, createPlan } from './PlanModel';

export const PlanEditor = ({ plan: initialPlan, onSave, onCancel, onHome }) => {
    const [plan, setPlan] = useState(initialPlan || createPlan("New Plan"));

    const updatePlanTitle = (title) => setPlan({ ...plan, title });

    const addDay = () => {
        setPlan({ ...plan, days: [...plan.days, createDay(`Day ${plan.days.length + 1}`)] });
    };

    const updateDayName = (dayIndex, name) => {
        const newDays = [...plan.days];
        newDays[dayIndex].name = name;
        setPlan({ ...plan, days: newDays });
    };

    const addExercise = (dayIndex) => {
        const newDays = [...plan.days];
        newDays[dayIndex].exercises.push(createExercise("New Exercise"));
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

    return (
        <div className="flex flex-col gap-6 pb-32 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-4 pt-4">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                    Edit <span className="text-[var(--color-primary)]">Plan</span>
                </h2>
                {onHome && <Button size="sm" variant="ghost" onClick={onHome}>Home ⌂</Button>}
            </div>

            <div className="px-2">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">General Info</label>
                <input
                    className="w-full bg-[var(--color-surface)] border-2 border-white/5 rounded-2xl p-4 text-xl font-bold text-white focus:border-[var(--color-primary)] focus:outline-none transition-all glass"
                    value={plan.title}
                    onChange={(e) => updatePlanTitle(e.target.value)}
                    placeholder="Plan Title"
                />
            </div>

            <div className="flex flex-col gap-6">
                {plan.days.map((day, dayIndex) => (
                    <Card key={day.id} className="relative glass border border-white/5 p-4 rounded-3xl overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <div className="bg-[var(--color-bg)] px-4 py-2 rounded-xl border border-white/5">
                                <input
                                    className="bg-transparent text-lg font-black italic text-white border-none focus:outline-none w-full uppercase"
                                    value={day.name}
                                    onChange={(e) => updateDayName(dayIndex, e.target.value)}
                                    placeholder="DAY NAME"
                                />
                            </div>
                            <button onClick={() => removeDay(dayIndex)} className="text-[var(--color-text-muted)] hover:text-[var(--color-alert)] transition-colors p-2">✕</button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {day.exercises.map((ex, exIndex) => (
                                <div key={ex.id} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="flex justify-between mb-4">
                                        <input
                                            className="bg-transparent font-black italic text-white border-none focus:outline-none flex-1 uppercase tracking-tight text-lg"
                                            value={ex.name}
                                            onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
                                            placeholder="EXERCISE NAME"
                                        />
                                        <button onClick={() => removeExercise(dayIndex, exIndex)} className="text-[var(--color-text-muted)] hover:text-[var(--color-alert)] transition-colors text-xs font-bold uppercase">Remove</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase text-center">Sets</label>
                                            <input
                                                className="bg-[var(--color-bg)] rounded-xl px-2 py-2 text-sm text-center text-white font-bold border border-white/5 focus:border-[var(--color-primary)] outline-none"
                                                value={ex.sets}
                                                type="number"
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase text-center">Reps</label>
                                            <input
                                                className="bg-[var(--color-bg)] rounded-xl px-2 py-2 text-sm text-center text-white font-bold border border-white/5 focus:border-[var(--color-primary)] outline-none"
                                                value={ex.reps}
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'reps', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase text-center">RPE</label>
                                            <input
                                                className="bg-[var(--color-bg)] rounded-xl px-2 py-2 text-sm text-center text-[var(--color-primary)] font-bold border border-white/5 focus:border-[var(--color-primary)] outline-none"
                                                value={ex.rpe}
                                                type="number"
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'rpe', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase text-center">Rest (s)</label>
                                            <input
                                                className="bg-[var(--color-bg)] rounded-xl px-2 py-2 text-sm text-center text-white font-bold border border-white/5 focus:border-[var(--color-primary)] outline-none"
                                                value={ex.targetRest || 90}
                                                type="number"
                                                onChange={(e) => updateExercise(dayIndex, exIndex, 'targetRest', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button size="sm" variant="ghost" onClick={() => addExercise(dayIndex)} className="border-dashed border-white/10 py-4">+ ADD EXERCISE</Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Button variant="secondary" onClick={addDay} className="mx-2 py-4 border-2 border-white/5">+ ADD WORKOUT DAY</Button>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-surface)] border-t border-white/10 flex gap-4 glass z-20">
                <Button variant="ghost" className="flex-1 font-bold" onClick={onCancel}>CANCEL</Button>
                <Button className="flex-1 font-bold shadow-[0_0_20px_rgba(208,253,62,0.3)]" onClick={() => onSave(plan)}>SAVE CHANGES</Button>
            </div>
        </div>
    );
};
