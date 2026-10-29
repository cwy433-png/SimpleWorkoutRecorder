
import React, { useRef, useState } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatMonthDay } from '../../lib/format';

const formatHistoryDate = (value) => {
    if (!value) return 'Previous';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Previous';
    return formatMonthDay(date.getTime());
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
        if (str.length > 5) return 'text-base';
        if (str.length > 4) return 'text-lg';
        return 'text-xl';
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

    const inputClass = 'w-full h-11 min-w-0 border border-border bg-bg px-1 text-center font-mono font-extrabold text-text-main transition-colors focus:border-primary focus:outline-none';
    const labelClass = 'mb-1 flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted';
    const navBtnClass = (enabled) => `flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${enabled
        ? 'border-border text-text-main hover:border-primary hover:text-primary-text'
        : 'border-transparent text-text-muted opacity-25'
        }`;

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* HISTORY TABLE */}
            <div
                className="touch-pan-y"
                onTouchStart={handleHistoryTouchStart}
                onTouchEnd={handleHistoryTouchEnd}
            >
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
                    <button
                        type="button"
                        onClick={showOlderHistory}
                        disabled={!canShowOlderHistory}
                        aria-label="Show older history"
                        className={navBtnClass(canShowOlderHistory)}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="min-w-0 text-center">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-text">
                            {activeComparison ? formatHistoryDate(activeComparison.date) : 'No History'}
                        </div>
                        <div className="max-w-[190px] truncate font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted">
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
                        className={navBtnClass(canShowNewerHistory)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '12px' }} className="border-b border-border pb-2">
                    <div className="self-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">#</div>
                    <div className="pr-2 text-right font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Last</div>
                    <div className="pr-2 text-right font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-main">Now</div>
                </div>

                <div>
                    {Array.from({ length: Math.max(comparisonLogs.length, history.length, 3) }).map((_, i) => {
                        const lastLog = comparisonLogs[i];
                        const currentLog = history[i];

                        const formatLog = (log, colorClass) => {
                            if (!log) return <span className="font-mono text-xs text-text-muted opacity-40">-</span>;
                            const displayW = toDisplay(log.weight);
                            return (
                                <div className={`grid grid-cols-[1.2fr_15px_0.8fr_15px_0.8fr] items-center gap-0.5 font-mono text-xs tracking-tighter ${colorClass}`}>
                                    <span className="text-right">{displayW}</span>
                                    <span className="text-center text-[9px] opacity-40">×</span>
                                    <span className="text-center">{log.reps}</span>
                                    <span className="text-center text-[9px] opacity-40">@</span>
                                    <span className="text-left">{log.rpe || '-'}</span>
                                </div>
                            );
                        };

                        return (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '12px' }} className="items-center border-b border-surface py-1.5">
                                <div className="font-mono text-xs font-bold text-text-muted">{i + 1}</div>
                                <div className="flex justify-end pr-2">{formatLog(lastLog, 'text-text-muted')}</div>
                                <div className="flex justify-end pr-2">{formatLog(currentLog, 'text-text-main font-bold')}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted">
                    {unit} × REPS @ RPE
                </div>
            </div>

            {/* LOGGING INPUTS */}
            <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2">
                {/* Weight Input */}
                <div className="flex min-w-0 flex-col">
                    <button type="button" onClick={toggleUnit} className={`${labelClass} cursor-pointer hover:text-text-main`}>
                        {unit} <ArrowLeftRight size={10} className="opacity-60" />
                    </button>
                    <input
                        type="number" inputMode="decimal"
                        value={weight} onChange={e => setWeight(e.target.value)}
                        className={`${inputClass} ${getFontSize(weight)}`}
                        placeholder="-"
                    />
                </div>

                {/* Reps Input */}
                <div className="flex min-w-0 flex-col">
                    <label className={labelClass}>REPS</label>
                    <input
                        type="number" inputMode="numeric"
                        value={reps} onChange={e => setReps(e.target.value)}
                        className={`${inputClass} ${getFontSize(reps)}`}
                        placeholder="-"
                    />
                </div>

                {/* RPE/RIR Input */}
                <div className="flex min-w-0 flex-col">
                    <button type="button" onClick={toggleRpeMode} className={`${labelClass} cursor-pointer hover:text-text-main`}>
                        {rpeMode} <ArrowLeftRight size={10} className="opacity-60" />
                    </button>
                    <input
                        type="number" inputMode="decimal"
                        value={rpeInput} onChange={e => handleRpeChange(e.target.value)}
                        className={`${inputClass} ${getFontSize(rpeInput)}`}
                        placeholder="-"
                    />
                </div>
            </div>

            {/* LOG BUTTON */}
            <Button variant="compact" onClick={handleLog}>
                {isTargetMet ? '+ BONUS SET' : 'LOG SET'}
            </Button>

            {isTargetMet && !isLastExercise && (
                <div className="text-center font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary-text">
                    Target Complete
                </div>
            )}
        </div>
    );
};
