import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const OneRepMax = () => {
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [result, setResult] = useState(null);

    // Epley Formula: 1RM = Weight * (1 + Reps/30)
    // Brzycki Formula: 1RM = Weight / (1.0278 - 0.0278 * Reps)
    // We will use Epley as it's common and simple.

    const calculate = () => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);

        if (!w || !r) return;

        const epley = Math.round(w * (1 + r / 30));
        setResult(epley);
    };

    return (
        <Card className="glass border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black italic uppercase text-white mb-4 flex items-center gap-2">
                <span className="text-[var(--color-primary)]">1RM</span> Calculator
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] mb-1">Weight (kg)</label>
                    <input
                        type="number"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg p-3 text-xl font-bold text-white focus:border-[var(--color-primary)] outline-none"
                        placeholder="0"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] mb-1">Reps</label>
                    <input
                        type="number"
                        value={reps}
                        onChange={e => setReps(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg p-3 text-xl font-bold text-white focus:border-[var(--color-primary)] outline-none"
                        placeholder="0"
                    />
                </div>
            </div>

            <Button onClick={calculate} className="w-full mb-6 font-black italic shadow-lg shadow-[var(--color-primary)]/20">
                CALCULATE STRENGTH
            </Button>

            {result !== null && (
                <div className="bg-[var(--color-surface)] border border-white/5 rounded-xl p-4 text-center animate-in zoom-in-95 duration-300">
                    <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] mb-1">Estimated One Rep Max</div>
                    <div className="text-5xl font-black italic text-white tracking-tighter drop-shadow-lg">
                        {result}<span className="text-2xl text-[var(--color-primary)] ml-1">KG</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                        <div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">90%</div>
                            <div className="font-bold">{Math.round(result * 0.9)}kg</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">80%</div>
                            <div className="font-bold">{Math.round(result * 0.8)}kg</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">70%</div>
                            <div className="font-bold">{Math.round(result * 0.7)}kg</div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
