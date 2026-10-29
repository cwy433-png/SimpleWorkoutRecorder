import React, { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { RpePicker } from '../../components/ui/RpePicker';
import { CARDIO_ACTIVITIES, buildCardioRecord, parseMinutes, sessionTime } from './historyModel';

const pad2 = (n) => String(n).padStart(2, '0');

/** Local `YYYY-MM-DDTHH:mm`, the value format of <input type="datetime-local">. */
const toLocalInput = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const labelClass = 'mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted';
const fieldClass =
    'h-11 w-full min-w-0 border bg-bg px-2.5 font-mono text-sm font-bold text-text-main outline-none focus:border-primary';

// Prefill for an existing record: endTime, or start + duration when endTime is missing.
const initialEnd = (initial) => {
    if (!initial) return Date.now();
    return initial.endTime ?? sessionTime(initial) + (initial.duration ?? 0) * 60000;
};

const CardioForm = ({ initial, onSave }) => {
    const [activity, setActivity] = useState(initial?.activity ?? null);
    const [ended, setEnded] = useState(() => toLocalInput(initialEnd(initial)));
    const [time, setTime] = useState(() => (initial?.duration > 0 ? String(initial.duration) : ''));
    const [rpe, setRpe] = useState(initial?.sessionRpe ?? null);

    const minutes = parseMinutes(time);
    const endMs = ended ? new Date(ended).getTime() : NaN;
    const endValid = Number.isFinite(endMs);
    const canSave = activity !== null && minutes !== null && rpe !== null && endValid;

    const save = () => {
        if (!canSave) return;
        onSave(
            buildCardioRecord({
                activity,
                endTime: endMs,
                durationMin: minutes,
                sessionRpe: rpe,
                id: initial?.id,
                now: Date.now(),
            })
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <section>
                <div className={labelClass}>TYPE</div>
                <div role="radiogroup" aria-label="Cardio type" className="grid grid-cols-5 gap-1.5">
                    {CARDIO_ACTIVITIES.map((a) => {
                        const on = activity === a;
                        return (
                            <button
                                key={a}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => setActivity(a)}
                                className={`h-11 border font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition-colors cursor-pointer ${on
                                    ? 'border-primary bg-primary-soft text-primary-ink'
                                    : 'border-border bg-bg text-text-main hover:border-primary'
                                    }`}
                            >
                                {a}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="grid grid-cols-[3fr_2fr] gap-2">
                <div className="min-w-0">
                    <label htmlFor="cardio-ended" className={labelClass}>ENDED</label>
                    <input
                        id="cardio-ended"
                        type="datetime-local"
                        value={ended}
                        onChange={(e) => setEnded(e.target.value)}
                        aria-invalid={!endValid}
                        className={`${fieldClass} ${endValid ? 'border-border' : 'border-alert'}`}
                    />
                </div>
                <div className="min-w-0">
                    <label htmlFor="cardio-minutes" className={labelClass}>MINUTES</label>
                    <div className="relative">
                        <input
                            id="cardio-minutes"
                            type="text"
                            inputMode="numeric"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            aria-invalid={time !== '' && minutes === null}
                            className={`${fieldClass} pr-10 ${time !== '' && minutes === null ? 'border-alert' : 'border-border'}`}
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold tracking-[0.15em] text-text-muted">MIN</span>
                    </div>
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

            <Button
                variant="primary"
                label={activity ? `CARDIO · ${activity.toUpperCase()}` : 'CARDIO'}
                disabled={!canSave}
                onClick={save}
            >
                SAVE
            </Button>
        </div>
    );
};

// Create (no `initial`) or edit (`initial` given, same id kept) a cardio entry.
// The form is mounted only while open, so every open starts from fresh state.
export const CardioSheet = ({ open, initial, onSave, onClose }) => (
    <Sheet open={open} onClose={onClose} tag={initial ? 'EDIT CARDIO' : 'LOG CARDIO'} title="有氧记录">
        <CardioForm initial={initial} onSave={onSave} />
    </Sheet>
);
