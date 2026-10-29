import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { parseFile, parseRawData } from './PlanImporter';
import { createPlan } from './PlanModel';
import { PlanEditor } from './PlanEditor';
import { LLM_PROMPT_TEMPLATE } from '../../data/llmPrompt';
import { PageHeader } from '../../components/ui/PageHeader';
import { Sheet } from '../../components/ui/Sheet';
import { useDialog } from '../../components/ui/Dialog';
import { Package, Star, Pencil, Trash2, FileUp, Clipboard } from 'lucide-react';

export const PlanManager = ({ onSelectPlan, onBack }) => {
    const dialog = useDialog();
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
            dialog.notify(`Imported: ${newPlan.title}`);
        } catch (err) {
            dialog.notify('Failed to import: ' + err.message, { tone: 'danger' });
        }
    };

    const handlePasteImport = () => {
        try {
            const json = JSON.parse(pasteContent);
            const newPlan = parseRawData(json);
            savePlan(newPlan);
            setPasteContent('');
            setShowImportModal(false);
            dialog.notify(`Imported: ${newPlan.title}`);
        } catch (err) {
            dialog.notify('Failed to parse JSON. Please check the format. ' + err.message, { tone: 'danger' });
        }
    };

    const copyPromptToClipboard = () => {
        navigator.clipboard.writeText(LLM_PROMPT_TEMPLATE).then(
            () => dialog.notify('AI prompt copied. Paste it into ChatGPT/Claude.'),
            () => dialog.notify('Could not copy to clipboard.', { tone: 'danger' })
        );
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

    const deletePlan = async (plan) => {
        const id = plan.id;
        const ok = await dialog.confirm({
            title: 'DELETE PLAN',
            message: `Delete "${plan.title}"? This cannot be undone.`,
            confirmLabel: 'DELETE',
            tone: 'danger',
        });
        if (!ok) return;
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

    const iconBtn = 'flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center border transition-colors';

    return (
        <div className="relative box-border flex w-full max-w-full flex-col animate-in fade-in duration-300">
            <div className="px-4 pt-3">
                <Button variant="link" onClick={onBack} className="!justify-start">&larr; HOME</Button>
            </div>

            <PageHeader
                tag="FILES"
                title="My Plans"
                sub={`${plans.length} ${plans.length === 1 ? 'PLAN' : 'PLANS'}`}
                right={
                    <>
                        <Button variant="link" className="!text-primary-text" onClick={() => setShowImportModal(true)}>+ IMPORT</Button>
                        <Button variant="link" className="!text-primary-text" onClick={() => setEditingPlan('NEW')}>+ CREATE</Button>
                    </>
                }
            />

            <div className="grid gap-3 px-4 pb-28 pt-4">
                {plans.map(plan => {
                    const isDefault = defaultPlanId == plan.id;
                    return (
                        <Card key={plan.id} active={isDefault} flush>
                            <div onClick={() => onSelectPlan(plan)} className="cursor-pointer px-4 pb-3 pt-4">
                                <h3 className="break-words text-xl font-black uppercase leading-tight tracking-[0.02em] text-text-main">
                                    {plan.title}
                                </h3>
                                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                                    <span className="text-text-muted">{plan.days?.length || 0} TRAINING DAYS</span>
                                    {isDefault && <span className="border border-primary px-1.5 py-0.5 text-primary-text">DEFAULT</span>}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
                                <button
                                    onClick={(e) => toggleDefaultPlan(e, plan.id)}
                                    className={`${iconBtn} ${isDefault ? 'border-primary bg-primary-soft text-primary-text' : 'border-border bg-bg text-text-muted hover:border-primary hover:text-primary-text'}`}
                                    title={isDefault ? 'Unset Default' : 'Set as Default'}
                                    aria-label={isDefault ? 'Unset default plan' : 'Set as default plan'}
                                >
                                    <Star size={16} fill={isDefault ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); }}
                                    className={`${iconBtn} border-border bg-bg text-text-main hover:border-primary hover:text-primary-text`}
                                    title="Edit Plan"
                                    aria-label="Edit plan"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deletePlan(plan); }}
                                    className={`${iconBtn} border-border bg-bg text-text-muted hover:border-alert hover:text-alert`}
                                    title="Delete Plan"
                                    aria-label="Delete plan"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </Card>
                    );
                })}

                {plans.length === 0 && (
                    <div className="border border-dashed border-border bg-surface px-4 py-14 text-center">
                        <div className="mb-3 flex justify-center">
                            <Package size={40} className="text-text-muted" strokeWidth={1.5} />
                        </div>
                        <p className="font-mono text-sm font-bold uppercase tracking-[0.15em] text-text-main">NO PLANS FOUND</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">TAP + CREATE OR + IMPORT ABOVE</p>
                    </div>
                )}
            </div>

            <Sheet open={showImportModal} onClose={() => setShowImportModal(false)} tag="IMPORT" title="Import Plan">
                <div className="mb-4 flex gap-1 font-mono">
                    {[['FILE', 'FILE'], ['PASTE', 'PASTE TEXT']].map(([key, text]) => (
                        <button
                            key={key}
                            onClick={() => setImportTab(key)}
                            className={`flex-1 cursor-pointer border py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${importTab === key ? 'border-primary bg-primary-soft text-primary-ink' : 'border-border text-text-muted'}`}
                        >
                            {text}
                        </button>
                    ))}
                </div>

                {importTab === 'FILE' ? (
                    <div className="relative border border-dashed border-border py-10 text-center transition-colors hover:border-primary">
                        <div className="mb-2 flex justify-center">
                            <FileUp size={32} className="text-text-muted" strokeWidth={1.5} />
                        </div>
                        <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-text-main">SELECT FILE</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">JSON, YAML, EXCEL</p>
                        <input type="file" onChange={handleFileUpload} accept=".json,.yaml,.yml,.xlsx" className="absolute inset-0 cursor-pointer opacity-0" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <textarea
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                            placeholder='Paste JSON here... {"title": "My Plan" ...}'
                            className="h-48 w-full resize-none border border-border bg-bg p-3 font-mono text-xs text-text-main focus:border-primary focus:outline-none"
                        />
                        <Button variant="primary" label="PASTE · JSON" onClick={handlePasteImport} disabled={!pasteContent}>LOAD PLAN</Button>

                        <div className="border-t border-border pt-4 text-center">
                            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">NEED HELP CONVERTING A PLAN?</p>
                            <Button variant="link" className="!text-primary-text" onClick={copyPromptToClipboard}>
                                <Clipboard size={14} /> COPY AI PROMPT
                            </Button>
                        </div>
                    </div>
                )}
            </Sheet>
        </div>
    );
};
