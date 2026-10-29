import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { isTrainingDay, lastTrainedDayIndex } from '../history/historyModel';

const startOfLocalDay = (ts) => {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

// Whole local calendar days between `ts` and now (0 = today).
const daysAgo = (ts, now = Date.now()) =>
    Math.max(0, Math.round((startOfLocalDay(now) - startOfLocalDay(ts)) / 864e5));

export const PlanDetail = ({ plan, history = [], onBack, onHome, onStartDay }) => {
    const days = plan.days || [];
    const trainingCount = days.filter(isTrainingDay).length;
    const last = lastTrainedDayIndex(history, plan);
    const lastAgo = last ? daysAgo(last.ts) : null;

    return (
        <div className="flex w-full flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-4 pt-3">
                <Button variant="link" onClick={onBack} className="!justify-start">&larr; PLANS</Button>
                {onHome && <Button variant="link" onClick={onHome}>HOME</Button>}
            </div>

            <PageHeader
                tag="PLAN"
                title={plan.title}
                sub={`${trainingCount} TRAINING ${trainingCount === 1 ? 'DAY' : 'DAYS'} · TAP A DAY TO START`}
            />

            <div className="grid gap-3 px-4 pb-28 pt-4">
                {days.map((day, index) => {
                    if (!isTrainingDay(day)) {
                        return (
                            <div
                                key={day.id || index}
                                className="flex items-center gap-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted"
                            >
                                <span className="h-px flex-1 bg-border" />
                                <span>REST</span>
                                <span className="h-px flex-1 bg-border" />
                            </div>
                        );
                    }

                    const isLast = last && last.dayIndex === index;
                    const exercises = day.exercises || [];
                    return (
                        <Card key={day.id || index} flush>
                            <button
                                type="button"
                                onClick={() => onStartDay(index)}
                                className="flex w-full cursor-pointer items-stretch text-left transition-colors hover:bg-surface-hover active:bg-surface-hover"
                            >
                                <div className="min-w-0 flex-1 px-4 pb-3 pt-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="break-words text-xl font-black uppercase leading-tight tracking-[0.02em] text-text-main">
                                            {day.name}
                                        </h3>
                                        {isLast && (
                                            <span className="border border-primary bg-primary-soft px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-primary-text">
                                                LAST · {lastAgo === 0 ? 'TODAY' : `${lastAgo}D AGO`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                                        {exercises.length} {exercises.length === 1 ? 'EXERCISE' : 'EXERCISES'}
                                    </div>
                                    <ul className="mt-3 space-y-1.5">
                                        {exercises.map((ex, i) => (
                                            <li key={ex.id || i} className="flex items-center gap-3 text-sm">
                                                <span className="min-w-0 flex-1 truncate font-medium text-text-main">{ex.name}</span>
                                                <span className="flex-shrink-0 font-mono text-xs text-text-muted">{ex.sets} × {ex.reps}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div
                                    aria-hidden
                                    className="flex w-8 flex-shrink-0 items-center justify-center border-l border-border text-primary-text"
                                >
                                    <ChevronRight size={18} strokeWidth={2.5} />
                                </div>
                            </button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
