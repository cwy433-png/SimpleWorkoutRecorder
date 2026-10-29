import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const fieldInput =
    'bg-bg border border-border p-3 font-mono text-xl font-bold text-text-main focus:border-primary focus:outline-none transition-colors';

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
        <Card>
            <h3 className="text-xl font-black uppercase text-text-main mb-4 flex items-center gap-2">
                <span className="text-primary-text">1RM</span> Calculator
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col">
                    <label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-1">Weight (kg)</label>
                    <input
                        type="number"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        className={fieldInput}
                        placeholder="0"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-1">Reps</label>
                    <input
                        type="number"
                        value={reps}
                        onChange={e => setReps(e.target.value)}
                        className={fieldInput}
                        placeholder="0"
                    />
                </div>
            </div>

            <Button label="EPLEY FORMULA" onClick={calculate} className="mb-6">
                CALCULATE
            </Button>

            {result !== null && (
                <div className="bg-bg border border-border p-4 text-center">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-1">Estimated One Rep Max</div>
                    <div className="font-mono text-5xl font-black text-text-main tracking-tighter">
                        {result}<span className="text-2xl text-primary-text ml-1">KG</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                        {[90, 80, 70].map(pct => (
                            <div key={pct}>
                                <div className="font-mono text-[10px] text-text-muted">{pct}%</div>
                                <div className="font-mono font-bold text-text-main">{Math.round(result * pct / 100)}kg</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
