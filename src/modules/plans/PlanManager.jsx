import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { parseFile, parseRawData } from './PlanImporter';
import { createPlan } from './PlanModel';
import { PlanEditor } from './PlanEditor';
import { LLM_PROMPT_TEMPLATE } from '../../data/llmPrompt';

export const PlanManager = ({ onSelectPlan, onBack }) => {
    const [plans, setPlans] = useState([]);
    const [editingPlan, setEditingPlan] = useState(null);
    const [defaultPlanId, setDefaultPlanId] = useState(localStorage.getItem('default_plan_id'));

    // Import Modal State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importTab, setImportTab] = useState('FILE'); // 'FILE' | 'PASTE'
    const [pasteContent, setPasteContent] = useState('');

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
        if (defaultPlanId == planId) {
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
            setShowImportModal(false);
            alert(`Imported: ${newPlan.title}`);
        } catch (err) {
            alert('Failed to import: ' + err.message);
        }
    };

    const handlePasteImport = () => {
        try {
            const json = JSON.parse(pasteContent);
            const newPlan = parseRawData(json);
            savePlan(newPlan);
            setPasteContent('');
            setShowImportModal(false);
            alert(`Imported: ${newPlan.title}`);
        } catch (err) {
            alert('Failed to parse JSON. Please check the format.\nError: ' + err.message);
        }
    };

    const copyPromptToClipboard = () => {
        navigator.clipboard.writeText(LLM_PROMPT_TEMPLATE).then(() => {
            alert("AI Prompt copied to clipboard! Paste it into ChatGPT/Claude.");
        });
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
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative">
            <div className="flex justify-between items-center px-4 pt-4">
                <Button size="sm" variant="ghost" onClick={onBack}>&larr; Home</Button>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setShowImportModal(true)}>Import</Button>
                    <Button size="sm" onClick={() => setEditingPlan('NEW')}>+ Create</Button>
                </div>
            </div>

            <div className="px-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[var(--color-text-main)]">My Plans</h2>
            </div>

            <div className="grid gap-4 pb-28 px-4">
                {plans.map(plan => {
                    const isDefault = defaultPlanId == plan.id;
                    return (
                        <Card key={plan.id} className={`relative group cursor-pointer border transition-all shadow-lg active:scale-[0.99] overflow-visible ${isDefault ? 'border-[var(--color-primary)] bg-[var(--color-surface)] glow-border' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30'}`}>
                            <div className="flex justify-between items-center p-2">
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

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                            <h3 className="font-bold text-lg uppercase italic tracking-tight">Import Plan</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-[var(--color-text-muted)] hover:text-white">✕</button>
                        </div>

                        <div className="flex border-b border-[var(--color-border)]">
                            <button
                                onClick={() => setImportTab('FILE')}
                                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${importTab === 'FILE' ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
                            >
                                File
                            </button>
                            <button
                                onClick={() => setImportTab('PASTE')}
                                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${importTab === 'PASTE' ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
                            >
                                Paste Text
                            </button>
                        </div>

                        <div className="p-6">
                            {importTab === 'FILE' ? (
                                <div className="text-center py-8 border-2 border-dashed border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)] transition-colors relative">
                                    <div className="text-4xl mb-2">📄</div>
                                    <p className="text-sm font-bold text-[var(--color-text-main)]">Select File</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mb-4">JSON, YAML, Excel</p>
                                    <input type="file" onChange={handleFileUpload} accept=".json,.yaml,.yml,.xlsx" className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="relative">
                                        <textarea
                                            value={pasteContent}
                                            onChange={(e) => setPasteContent(e.target.value)}
                                            placeholder='Paste JSON here... {"title": "My Plan" ...}'
                                            className="w-full h-48 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 text-xs font-mono text-[var(--color-text-main)] resize-none focus:outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </div>
                                    <Button onClick={handlePasteImport} disabled={!pasteContent}>Load Plan</Button>

                                    <div className="pt-4 border-t border-[var(--color-border)]">
                                        <p className="text-[10px] text-[var(--color-text-muted)] mb-2 text-center">Need help converting a plan?</p>
                                        <Button size="sm" variant="secondary" className="w-full" onClick={copyPromptToClipboard}>
                                            📋 Copy AI Prompt
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
