import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { RpePicker } from '../../components/ui/RpePicker';
import { useWorkoutSession } from './SessionContext';
import { buildStrengthRecord, parseMinutes, sessionSummary } from '../history/historyModel';
import { formatClock, formatMonthDay } from '../../lib/format';

// Debrief page shown after FINISH. Nothing is written until SAVE LOG / SKIP RATING:
// those build the record and hand it to `onSave`.
export const DebriefView = ({ onSave, onBack }) => {
    const { state, resumeActive } = useWorkoutSession();
    const { plan, dayIndex, startTime, endTime } = state;
    const activeDay = plan?.days?.[dayIndex];

    // Default duration comes from the recorded span; the user can correct it.
    const [time, setTime] = useState(() => String(Math.max(1, Math.round(((endTime ?? Date.now()) - startTime) / 60000))));
    const [rpe, setRpe] = useState(null);

    const minutes = parseMinutes(time);
    const { setsDone, setsPlanned, volumeKg } = sessionSummary(state);
    const dayName = activeDay?.name || 'Workout';

    const save = (sessionRpe) => {
        if (minutes === null) return;
        onSave(buildStrengthRecord(state, { durationMin: minutes, sessionRpe, now: Date.now() }));
    };

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                tag="SESSION COMPLETE"
                title={dayName}
                sub={`${plan?.title || ''} · ${formatMonthDay(startTime)} · ${formatClock(startTime)}`}
            />

            <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
                <section>
                    <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">SUMMARY</div>
                    <div className="grid grid-cols-3 gap-2">
                        <Card flush className="p-2.5">
                            <label htmlFor="debrief-time" className="block font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">TIME</label>
                            <div className="mt-1 flex items-baseline gap-1">
                                <input
                                    id="debrief-time"
                                    type="text"
                                    inputMode="numeric"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    aria-invalid={minutes === null}
                                    className={`w-full min-w-0 border-0 border-b border-dashed bg-transparent p-0 font-mono text-xl font-extrabold text-text-main outline-none focus:border-primary ${minutes === null ? 'border-alert' : 'border-primary'}`}
                                />
                                <span className="font-mono text-[11px] text-text-muted">min</span>
                            </div>
                        </Card>
                        <Card flush className="p-2.5">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">SETS</div>
                            <div className="mt-1 font-mono text-xl font-extrabold text-text-main">
                                {setsDone}<span className="text-[11px] font-medium text-text-muted">/{setsPlanned}</span>
                            </div>
                        </Card>
                        <Card flush className="p-2.5">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">VOLUME</div>
                            <div className="mt-1 font-mono text-xl font-extrabold text-text-main">
                                {(volumeKg / 1000).toFixed(1)}<span className="text-[11px] font-medium text-text-muted"> t</span>
                            </div>
                        </Card>
                    </div>
                    {minutes === null && (
                        <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-alert">ENTER MINUTES (1 OR MORE)</div>
                    )}
                </section>

                <section>
                    <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">SESSION RPE · 整场有多吃力</div>
                    <RpePicker value={rpe} onChange={setRpe} />
                    {rpe !== null && minutes !== null && (
                        <div className="mt-3 flex items-baseline justify-between border border-dashed border-border px-2.5 py-2 font-mono">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">LOAD</span>
                            <span className="text-[11px] text-text-muted">{rpe} × {minutes} min =</span>
                            <span className="text-xl font-extrabold text-text-main">{rpe * minutes}</span>
                        </div>
                    )}
                </section>

                <div className="flex flex-col items-center gap-1">
                    <Button
                        variant="primary"
                        label={`SESSION · ${String(dayName).toUpperCase()}`}
                        disabled={rpe === null || minutes === null}
                        onClick={() => save(rpe)}
                    >
                        SAVE LOG
                    </Button>
                    <Button variant="link" size="sm" disabled={minutes === null} onClick={() => save(null)}>
                        SKIP RATING · 稍后在历史里补
                    </Button>
                    <Button variant="link" size="sm" onClick={() => { resumeActive(); onBack?.(); }}>
                        &larr; BACK TO SESSION
                    </Button>
                </div>
            </div>
        </div>
    );
};
