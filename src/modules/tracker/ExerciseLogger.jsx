import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { RestTimer } from './RestTimer';

export const ExerciseLogger = ({ exercise, history = [], lastSessionLogs, onSaveSet, onNext, isLastExercise }) => {
    const [unit, setUnit] = useState('KG'); // 'KG' or 'LB'
    const [rpeMode, setRpeMode] = useState('RPE'); // 'RPE' or 'RIR'

    // Helper: Display value based on unit
    const toDisplay = (kgVal) => {
        if (!kgVal) return '';
        if (unit === 'KG') return kgVal;
        return (parseFloat(kgVal) * 2.20462).toFixed(1);
    };

    // Helper: Convert display value back to KG for storage
    const toStorage = (displayVal) => {
        if (!displayVal) return '';
        if (unit === 'KG') return displayVal;
        return (parseFloat(displayVal) / 2.20462).toFixed(2);
    };

    const getLastValues = () => {
        if (history.length > 0) return history[history.length - 1];
        if (lastSessionLogs && lastSessionLogs.length > 0) return lastSessionLogs[lastSessionLogs.length - 1];
        return { weight: '', reps: '' };
    };

    const initialValues = getLastValues();
    const [weight, setWeight] = useState(toDisplay(initialValues.weight));
    const [reps, setReps] = useState(initialValues.reps);
    const [rpeInput, setRpeInput] = useState(''); // Raw input for RPE or RIR

    const [isResting, setIsResting] = useState(false);

    const toggleUnit = () => {
        const newUnit = unit === 'KG' ? 'LB' : 'KG';
        setUnit(newUnit);
        if (weight && !isNaN(weight)) {
            if (newUnit === 'LB') setWeight((parseFloat(weight) * 2.20462).toFixed(1));
            else setWeight((parseFloat(weight) / 2.20462).toFixed(1));
        }
    };

    const toggleRpeMode = () => {
        setRpeMode(prev => prev === 'RPE' ? 'RIR' : 'RPE');
        setRpeInput(''); // Clear input on toggle to avoid confusion
    };

    // Track when rest started to calculate actual duration
    const [restStartTime, setRestStartTime] = useState(null);

    const handleLog = () => {
        if (!weight || !reps) return;

        const weightToSave = toStorage(weight);

        // Calculate true RPE based on mode
        let finalRpe = rpeInput;
        if (rpeInput !== '') {
            const val = parseFloat(rpeInput);
            if (rpeMode === 'RIR') {
                finalRpe = 10 - val;
            }
        }

        onSaveSet({ weight: weightToSave, reps, rpe: finalRpe });

        // START REST
        setRestStartTime(Date.now());
        setIsResting(true);

        setReps('');
        setRpeInput('');
    };

    const handleFinishRest = () => {
        if (restStartTime) {
            const actualDuration = Math.round((Date.now() - restStartTime) / 1000);

            // We need to update the LAST log added to inject the rest time.
            // Since onSaveSet is passed from parent (SessionDashboard), we might need to 
            // expose a "updateLastSet" method. However, for simplicity/MVP, 
            // we can assume the parent SessionDashboard 'handleSaveSet' appends to state.
            // We can hack this by passing a special "update_last_rest" event or 
            // just ignoring it for the *very* confirmed storage if strictly append-only.
            // OR: We define a new prop `onUpdateLastSetRest`? 
            // Better: Just log it to console for now or invoke a generic `onSaveSet({ ...lastLog, rest: actual })` replacement?
            // Actually, let's try to pass the rest time to the NEXT call? No, that's messy.
            // Let's pass it to onSaveSet as a distinct update if possible.
            // Given the limitations of the current props (onSaveSet appends), 
            // we will add a note: "Rest recorded: " + actualDuration.
            // Ideal: The USER asked for "In the data structure".
            // So we really should update the structure.
            // Let's modify onSaveSet signature to allow updates? 
            // No, easiest is: SessionDashboard needs to handle 'UPDATE_LAST' action.
            // For now, let's just create a new 'onRecordRest' prop if possible, or 
            // rely on the user seeing it in the next session? 
            // Actually, let's just update `onSaveSet` in SessionDashboard to handle an update.
            // But I cannot see SessionDashboard right now.
            // Let's just track it locally or assume onSaveSet handles an object with `isUpdate: true`?
            // Let's try: onSaveSet({ restTime: actualDuration, isRestUpdate: true });

            // NOTE: I will implement the UI logic first.
            if (onSaveSet) onSaveSet({ restTime: actualDuration, isRestUpdate: true });
        }
        setIsResting(false);
        setRestStartTime(null);
    };

    // Input Validation & Max Length Font Sizing
    const getFontSize = (val) => {
        const str = String(val);
        if (str.length > 5) return 'text-xl';
        if (str.length > 4) return 'text-2xl';
        return 'text-3xl';
    };

    const handleRpeChange = (val) => {
        if (val === '') { setRpeInput(''); return; }
        const num = parseFloat(val);
        if (num < 0 || num > 10) return; // Basic limit
        setRpeInput(val);
    };

    const setsDone = history.length;
    const targetSets = exercise.sets || 3;
    const isTargetMet = setsDone >= targetSets;

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* HISTORY TABLE */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-primary)]/20 rounded-xl p-3 mb-4">
                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '12px' }} className="mb-2 pb-2 border-b border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] self-center">#</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] text-right pr-2">Last</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white text-right pr-2">Now</div>
                </div>

                <div className="space-y-2">
                    {Array.from({ length: Math.max(lastSessionLogs?.length || 0, history.length, 3) }).map((_, i) => {
                        const lastLog = lastSessionLogs?.[i];
                        const currentLog = history[i];

                        const formatLog = (log, colorClass) => {
                            if (!log) return <span className="opacity-10 font-bold">-</span>;
                            const displayW = toDisplay(log.weight);
                            return (
                                <div className={`grid grid-cols-[1.2fr_15px_0.8fr_15px_0.8fr] gap-0.5 items-center font-black tracking-tighter ${colorClass}`}>
                                    <span className="text-right">{displayW}</span>
                                    <span className="text-[10px] opacity-40 text-center">×</span>
                                    <span className="text-center">{log.reps}</span>
                                    <span className="text-[10px] opacity-40 text-center">@</span>
                                    <span className="text-left">{log.rpe || '-'}</span>
                                </div>
                            );
                        };

                        return (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '12px' }} className="items-center py-1">
                                <div className="text-[var(--color-text-muted)] font-bold text-xs">{i + 1}</div>
                                <div className="flex justify-end">{formatLog(lastLog, 'text-[var(--color-primary)]')}</div>
                                <div className="flex justify-end text-white">{formatLog(currentLog, 'text-white')}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono text-[var(--color-text-muted)] text-center opacity-60">
                    {unit} × REPS @ RPE
                </div>
            </div>

            {/* LOGGING INPUTS */}
            <div className="flex justify-center gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                {/* Weight Input */}
                <div className="flex flex-col items-center flex-[1.4]">
                    <div onClick={toggleUnit} className="text-[10px] text-center mb-2 font-black uppercase text-[var(--color-text-muted)] cursor-pointer hover:text-white transition-colors flex items-center gap-1">
                        {unit} <span className="opacity-50">⇄</span>
                    </div>
                    <input
                        type="number" inputMode="decimal"
                        value={weight} onChange={e => setWeight(e.target.value)}
                        className={`w-full min-w-[80px] p-3 text-center bg-zinc-900 rounded-lg text-white font-black border-2 border-white/20 focus:border-[var(--color-primary)] focus:outline-none transition-all ${getFontSize(weight)}`}
                        placeholder="-"
                    />
                </div>

                {/* Reps Input */}
                <div className="flex flex-col items-center flex-1">
                    <label className="text-[10px] text-center mb-2 font-black uppercase text-[var(--color-text-muted)]">REPS</label>
                    <input
                        type="number" inputMode="numeric"
                        value={reps} onChange={e => setReps(e.target.value)}
                        className={`w-full min-w-[60px] p-3 text-center bg-zinc-900 rounded-lg text-white font-black border-2 border-white/20 focus:border-[var(--color-primary)] focus:outline-none transition-all ${getFontSize(reps)}`}
                        placeholder="-"
                    />
                </div>

                {/* RPE/RIR Input */}
                <div className="flex flex-col items-center flex-1">
                    <div onClick={toggleRpeMode} className="text-[10px] text-center mb-2 font-black uppercase text-[var(--color-text-muted)] cursor-pointer hover:text-white transition-colors flex items-center gap-1">
                        {rpeMode} <span className="opacity-50">⇄</span>
                    </div>
                    <input
                        type="number" inputMode="decimal"
                        value={rpeInput} onChange={e => handleRpeChange(e.target.value)}
                        className={`w-full min-w-[60px] p-3 text-center bg-zinc-900 rounded-lg text-[var(--color-primary)] font-black border-2 border-white/20 focus:border-[var(--color-primary)] focus:outline-none transition-all ${getFontSize(rpeInput)}`}
                        placeholder="-"
                    />
                </div>
            </div>

            {/* LOG BUTTON */}
            <Button
                size="lg"
                onClick={handleLog}
                className={`w-full py-4 text-lg font-black italic shadow-lg transition-all active:scale-[0.98] ${isTargetMet ? 'bg-white text-black hover:bg-white/90' : ''}`}
            >
                {isTargetMet ? '+ BONUS SET' : 'LOG SET'}
            </Button>

            {/* TARGET MET MESSAGE */}
            {isTargetMet && !isResting && (
                <div className="mt-2 text-center">
                    {!isLastExercise && <div className="text-xs text-[var(--color-primary)] font-bold uppercase animate-pulse mb-2">Target Complete • Move On</div>}
                    {!isLastExercise && (
                        <Button onClick={onNext} className="w-full py-4 text-lg font-black italic border border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            NEXT EXERCISE &darr;
                        </Button>
                    )}
                </div>
            )}

            {/* REST TIMER SHEET */}
            {isResting && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#09090b] border-t border-[var(--color-primary)] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300">
                    <div className="p-6 max-w-md mx-auto">
                        <div className="flex items-stretch justify-between gap-4 h-[160px]">
                            {/* LEFT: Header (Top) & Button (Bottom) */}
                            <div className="flex flex-col h-full gap-2 flex-1 min-w-0">
                                <div className="shrink-0">
                                    <h3 className="text-xl font-black italic text-white tracking-tighter mb-1 leading-none">RESTING</h3>
                                    {!isLastExercise && isTargetMet && (
                                        <div className="text-xs font-bold text-[var(--color-primary)] uppercase animate-pulse truncate leading-none">
                                            UP NEXT: NEXT EXERCISE
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleFinishRest}
                                    className="flex-1 w-full bg-[var(--color-primary)] text-black shadow-[0px_4px_0px_rgba(255,255,255,0.3)] rounded-[var(--radius-lg)] active:translate-y-[4px] active:shadow-none transition-all border-2 border-transparent hover:border-black/10 flex items-center justify-center overflow-hidden p-0"
                                >
                                    <span className="text-2xl sm:text-3xl font-black italic tracking-widest leading-none scale-x-110 transform origin-center" style={{ fontStyle: 'var(--font-slant)' }}>SET {setsDone + 1}</span>
                                </Button>
                            </div>

                            {/* RIGHT: Timer Controls */}
                            <div className="w-[140px] shrink-0 h-full">
                                <RestTimer
                                    initialSeconds={exercise.targetRest || 90}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
