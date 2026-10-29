import React, { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { RpePicker } from '../../components/ui/RpePicker';
import { durationMinutes, parseMinutes, withRating } from './historyModel';

const labelClass = 'mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted';

const RatingForm = ({ record, onSave }) => {
    const [rpe, setRpe] = useState(typeof record.sessionRpe === 'number' ? record.sessionRpe : null);
    const [time, setTime] = useState(() => {
        const known = durationMinutes(record);
        return known === null ? '' : String(known);
    });

    const minutes = parseMinutes(time);
    const canSave = rpe !== null && minutes !== null;

    const save = () => {
        if (!canSave) return;
        onSave(withRating(record, { sessionRpe: rpe, durationMin: minutes }));
    };

    return (
        <div className="flex flex-col gap-4">
            <section>
                <label htmlFor="rating-minutes" className={labelClass}>MINUTES</label>
                <div className="relative">
                    <input
                        id="rating-minutes"
                        type="text"
                        inputMode="numeric"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        aria-invalid={time !== '' && minutes === null}
                        className={`h-11 w-full min-w-0 border bg-bg px-2.5 pr-10 font-mono text-sm font-bold text-text-main outline-none focus:border-primary ${time !== '' && minutes === null ? 'border-alert' : 'border-border'}`}
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold tracking-[0.15em] text-text-muted">MIN</span>
                </div>
            </section>

            <section>
                <div className={labelClass}>SESSION RPE · 整场有多吃力</div>
                <RpePicker value={rpe} onChange={setRpe} />
                {rpe !== null && minutes !== null && (
                    <div className="mt-3 flex items-baseline justify-between border border-dashed border-border px-2.5 py-2 font-mono">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">LOAD</span>
                        <span className="text-[11px] text-text-muted">{rpe} × {minutes} min =</span>
                        <span className="text-xl font-extrabold text-text-main">{rpe * minutes}</span>
                    </div>
                )}
            </section>

            <Button variant="primary" label="RATING" disabled={!canSave} onClick={save}>
                SAVE
            </Button>
        </div>
    );
};

// Fill in or change RPE and minutes of a strength record. Saves through `withRating`.
export const RatingSheet = ({ open, record, onSave, onClose }) => (
    <Sheet open={open && !!record} onClose={onClose} tag="RATE SESSION" title={record?.dayName || 'Workout'}>
        {record && <RatingForm record={record} onSave={onSave} />}
    </Sheet>
);
