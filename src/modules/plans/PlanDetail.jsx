import React from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const PlanDetail = ({ plan, onBack, onHome, onStartDay }) => {
    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-2 pt-4 mb-2">
                <Button size="sm" variant="ghost" onClick={onBack}>&larr; Plans</Button>
                {onHome && <Button size="sm" variant="ghost" onClick={onHome}>Home ⌂</Button>}
            </div>

            <div className="px-2 mb-4">
                <h2 className="text-3xl sm:text-4xl font-black italic text-[var(--color-text-main)] mb-1 uppercase tracking-tighter break-words leading-none">
                    {plan.title.split(' ')[0]} <span className="text-[var(--color-primary)]">{plan.title.split(' ').slice(1).join(' ')}</span>
                </h2>
                <p className="text-[var(--color-text-muted)] text-sm font-bold uppercase tracking-widest">
                    {plan.days.length} Training Days • Select your focus
                </p>
            </div>

            <div className="flex-1 overflow-auto flex flex-col gap-4 pb-10 no-scrollbar">
                {plan.days.map((day, index) => (
                    <Card key={day.id || index} className="bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden group hover:border-[var(--color-primary)] transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-black italic text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">{day.name}</h3>
                            <Button size="sm" onClick={() => onStartDay(index, day)} className="shadow-[0_0_15px_rgba(208,253,62,0.2)]">
                                START &rarr;
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {day.exercises.map((ex, i) => (
                                <div key={i} className="flex items-center text-sm text-[var(--color-text-muted)]">
                                    <div className="w-1 h-1 rounded-full bg-[var(--color-primary)] mr-3 opacity-50"></div>
                                    <span className="flex-1 font-medium text-[var(--color-text-main)]">{ex.name}</span>
                                    <span className="opacity-50 font-mono">{ex.sets} x {ex.reps}</span>
                                </div>
                            ))}
                            {day.exercises.length === 0 && <span className="text-xs opacity-30 italic">Rest Day / Active Recovery</span>}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
