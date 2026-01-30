import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { parseFile } from './PlanImporter';
import { createPlan } from './PlanModel';
import { PlanEditor } from './PlanEditor';

export const PlanManager = ({ onSelectPlan, onBack }) => {
    const [plans, setPlans] = useState([]);
    const [editingPlan, setEditingPlan] = useState(null);
    const [defaultPlanId, setDefaultPlanId] = useState(localStorage.getItem('default_plan_id'));

    useEffect(() => {
        const saved = localStorage.getItem('workout_plans');
        if (saved) {
            setPlans(JSON.parse(saved));
        } else {
            setPlans([]);
        }
    }, []);

    const toggleDefaultPlan = (e, planId) => {
        e.stopPropagation();
        if (defaultPlanId == planId) { // Loose equality for number/string mismatch
            localStorage.removeItem('default_plan_id');
            setDefaultPlanId(null);
        } else {
            localStorage.setItem('default_plan_id', planId);
            setDefaultPlanId(planId);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const newPlan = await parseFile(file);
            savePlan(newPlan);
            alert(`Imported: ${newPlan.title}`);
        } catch (err) {
            alert('Failed to import: ' + err.message);
        }
    };

    const savePlan = (planToSave) => {
        let updated;
        const exists = plans.find(p => p.id === planToSave.id);

        if (exists) {
            updated = plans.map(p => p.id === planToSave.id ? planToSave : p);
        } else {
            updated = [...plans, planToSave];
        }

        setPlans(updated);
        localStorage.setItem('workout_plans', JSON.stringify(updated));
        setEditingPlan(null);
    };

    const deletePlan = (id) => {
        if (!window.confirm("Delete this plan?")) return;
        const updated = plans.filter(p => p.id !== id);
        setPlans(updated);
        localStorage.setItem('workout_plans', JSON.stringify(updated));
        if (defaultPlanId == id) {
            localStorage.removeItem('default_plan_id');
            setDefaultPlanId(null);
        }
    };

    if (editingPlan) {
        return (
            <PlanEditor
                plan={editingPlan === 'NEW' ? createPlan("My New Plan") : editingPlan}
                onSave={savePlan}
                onCancel={() => setEditingPlan(null)}
                onHome={onBack}
            />
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-4 pt-4">
                <Button size="sm" variant="ghost" onClick={onBack}>&larr; Home</Button>
                <div className="flex gap-2">
                    <div className="relative overflow-hidden">
                        <Button size="sm" variant="secondary">Import</Button>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            accept=".json,.yaml,.yml,.xlsx"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    <Button size="sm" onClick={() => setEditingPlan('NEW')}>+ Create</Button>
                </div>
            </div>

            <div className="px-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">My Plans</h2>
            </div>

            <div className="grid gap-4 pb-28 px-4">
                {plans.map(plan => {
                    const isDefault = defaultPlanId == plan.id;
                    return (
                        <Card key={plan.id} className={`relative group cursor-pointer border transition-all shadow-lg active:scale-[0.99] overflow-visible ${isDefault ? 'border-[var(--color-primary)] bg-[var(--color-surface)] glow-border' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30'}`}>
                            <div className="flex justify-between items-center p-2">
                                {/* Main Click Area */}
                                <div onClick={() => onSelectPlan(plan)} className="flex-1 py-2 pr-4 pl-2">
                                    <h3 className={`font-black italic text-xl uppercase transition-colors tracking-tight truncate ${isDefault ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-main)] group-hover:text-[var(--color-primary)]'}`}>
                                        {plan.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[var(--color-bg)] rounded text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                            {plan.days?.length || 0} Days
                                        </span>
                                        {isDefault && <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[var(--color-primary)] text-black rounded animate-pulse">Default</span>}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-border)] z-10">
                                    <button
                                        onClick={(e) => toggleDefaultPlan(e, plan.id)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${isDefault ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)]' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-primary)]'}`}
                                        title={isDefault ? "Unset Default" : "Set as Default"}
                                    >
                                        ★
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-primary)] hover:text-black transition-all border border-[var(--color-border)]"
                                        title="Edit Plan"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-alert)] hover:text-white transition-all border border-[var(--color-border)]"
                                        title="Delete Plan"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {plans.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-3xl opacity-50 bg-[var(--color-surface)] mx-2">
                        <div className="text-5xl mb-4 grayscale">🏋️</div>
                        <p className="font-bold text-lg text-[var(--color-text-main)]">No Plans Yet</p>
                        <p className="text-sm text-[var(--color-text-muted)]">Import or create one above</p>
                    </div>
                )}
            </div>
        </div>
    );
};
