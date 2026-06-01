
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const formatHistoryDate = (value) => {
    if (!value) return 'Previous';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Previous';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const ExerciseLogger = ({ exercise, history = [], previousSessions = [], lastSessionLogs, onSaveSet, onNext, isLastExercise }) => {
    const [unit, setUnit] = useState('KG'); // 'KG' or 'LB'
    const [rpeMode, setRpeMode] = useState('RPE'); // 'RPE' or 'RIR'
    const [comparisonIndex, setComparisonIndex] = useState(0);
    const swipeStartX = useRef(null);

    const comparisonSessions = previousSessions.length > 0
        ? previousSessions
        : lastSessionLogs?.length
            ? [{ id: 'last-session', date: null, sets: lastSessionLogs }]
            : [];

    const comparisonCount = comparisonSessions.length;
    const activeComparisonIndex = comparisonCount > 0
        ? Math.min(comparisonIndex, comparisonCount - 1)
        : 0;
    const activeComparison = comparisonSessions[activeComparisonIndex] || null;
    const comparisonLogs = activeComparison?.sets || [];
    const canShowNewerHistory = activeComparisonIndex > 0;
    const canShowOlderHistory = activeComparisonIndex < comparisonCount - 1;

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
        if (comparisonLogs.length > 0) return comparisonLogs[comparisonLogs.length - 1];
        return { weight: '', reps: '' };
    };

    const initialValues = getLastValues();
    const [weight, setWeight] = useState(toDisplay(initialValues.weight));
    const [reps, setReps] = useState(initialValues.reps);
    const [rpeInput, setRpeInput] = useState(''); // Raw input for RPE or RIR

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

        // Trigger Rest via parent
        if (onNext) onNext('REST_START');

        setReps('');
        setRpeInput('');
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

    const showNewerHistory = () => {
        setComparisonIndex(prev => Math.max(0, prev - 1));
    };

    const showOlderHistory = () => {
        setComparisonIndex(prev => Math.min(comparisonCount - 1, prev + 1));
    };

    const handleHistoryTouchStart = (event) => {
        swipeStartX.current = event.touches?.[0]?.clientX ?? null;
    };

    const handleHistoryTouchEnd = (event) => {
        if (swipeStartX.current === null) return;

        const endX = event.changedTouches?.[0]?.clientX;
        if (typeof endX !== 'number') return;

        const deltaX = endX - swipeStartX.current;
        swipeStartX.current = null;

        if (Math.abs(deltaX) < 36) return;
        if (deltaX > 0 && canShowOlderHistory) showOlderHistory();
        if (deltaX < 0 && canShowNewerHistory) showNewerHistory();
    };

    const setsDone = history.length;
    const targetSets = exercise.sets || 3;
    const isTargetMet = setsDone >= targetSets;

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* HISTORY TABLE */}
            <div
                className="bg-[var(--color-surface)] border border-[var(--color-primary)]/20 rounded-xl p-3 mb-4 touch-pan-y"
                onTouchStart={handleHistoryTouchStart}
                onTouchEnd={handleHistoryTouchEnd}
            >
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
                    <button
                        type="button"
                        onClick={showOlderHistory}
                        disabled={!canShowOlderHistory}
                        aria-label="Show older history"
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border transition-colors ${canShowOlderHistory
                            ? 'border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                            : 'border-transparent text-[var(--color-text-muted)] opacity-25'
                            }`}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="min-w-0 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">
                            {activeComparison ? formatHistoryDate(activeComparison.date) : 'No History'}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] truncate max-w-[190px]">
                            {activeComparison
                                ? `${activeComparison.dayName || activeComparison.planTitle || 'Previous'} · ${activeComparisonIndex + 1}/${comparisonCount}`
                                : 'Previous sets unavailable'}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={showNewerHistory}
                        disabled={!canShowNewerHistory}
                        aria-label="Show newer history"
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border transition-colors ${canShowNewerHistory
                            ? 'border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                            : 'border-transparent text-[var(--color-text-muted)] opacity-25'
                            }`}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '12px' }} className="mb-2 pb-2 border-b border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] self-center">#</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] text-right pr-2">Last</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white text-right pr-2">Now</div>
                </div>

                <div className="space-y-2">
                    {Array.from({ length: Math.max(comparisonLogs.length, history.length, 3) }).map((_, i) => {
                        const lastLog = comparisonLogs[i];
                        const currentLog = history[i];

                        const formatLog = (log, colorClass) => {
                            if (!log) return <span className="opacity-10 font-bold">-</span>;
                            const displayW = toDisplay(log.weight);
                            return (
                                <div className={`grid grid-cols-[1.2fr_15px_0.8fr_15px_0.8fr] gap-0.5 items-center font-bold tracking-tighter text-[10px] ${colorClass}`}>
                                    <span className="text-right">{displayW}</span>
                                    <span className="text-[9px] opacity-40 text-center">×</span>
                                    <span className="text-center">{log.reps}</span>
                                    <span className="text-[9px] opacity-40 text-center">@</span>
                                    <span className="text-left">{log.rpe || '-'}</span>
                                </div>
                            );
                        };

                        return (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '12px' }} className="items-center py-1">
                                <div className="text-[var(--color-text-muted)] font-bold text-xs">{i + 1}</div>
                                <div className="flex justify-end">{formatLog(lastLog, 'text-[var(--color-primary)] font-medium')}</div>
                                <div className="flex justify-end">{formatLog(currentLog, 'text-[var(--color-text-main)] font-medium')}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-3 pt-2 border-t border-black/5 text-[9px] font-mono text-[var(--color-text-muted)] text-center opacity-60">
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
                        className={`w-full min-w-[80px] p-3 text-center bg-white rounded-lg text-black font-black border-2 border-white/20 focus:border-[var(--color-primary)] focus:outline-none transition-all ${getFontSize(weight)}`}
                        placeholder="-"
                    />
                </div>

                {/* Reps Input */}
                <div className="flex flex-col items-center flex-1">
                    <label className="text-[10px] text-center mb-2 font-black uppercase text-[var(--color-text-muted)]">REPS</label>
                    <input
                        type="number" inputMode="numeric"
                        value={reps} onChange={e => setReps(e.target.value)}
                        className={`w-full min-w-[60px] p-3 text-center bg-white rounded-lg text-black font-black border-2 border-white/20 focus:border-[var(--color-primary)] focus:outline-none transition-all ${getFontSize(reps)}`}
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
                        className={`w-full min-w-[60px] p-3 text-center bg-white rounded-lg text-black font-black border-2 border-white/20 focus:border-[var(--color-primary)] focus:outline-none transition-all ${getFontSize(rpeInput)}`}
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

            {isTargetMet && !isLastExercise && (
                <div className="mt-2 text-center">
                    <div className="text-xs text-[var(--color-primary)] font-bold uppercase animate-pulse mb-2">Target Complete</div>
                </div>
            )}
        </div>
    );
};
