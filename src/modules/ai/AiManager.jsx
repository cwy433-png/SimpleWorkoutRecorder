import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { UserProfile } from './UserProfile';

export const AiManager = ({ onBack }) => {
    const [view, setView] = useState('PROFILE'); // PROFILE | CHAT

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300 overflow-y-auto pb-safe relative">
            <div className="flex items-center gap-2 mb-4 px-2 pt-2">
                <Button size="sm" variant="ghost" onClick={onBack}>&larr; Home</Button>
                <h2 className="text-xl font-black italic uppercase tracking-tighter ml-auto text-[var(--color-text-main)]">
                    <span className="text-[var(--color-primary)]">AI</span> Coach
                </h2>
            </div>

            {/* Under Development Overlay */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <div className="w-20 h-20 border-4 border-dashed border-[var(--color-primary)] rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-3xl">🔧</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--color-text-main)] mb-2">
                    开发中
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
                    AI Coach 功能正在开发中，敬请期待！
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-4 opacity-50">
                    Coming Soon: Plan Generation, Form Check, Daily Tips
                </p>
            </div>
        </div>
    );
};
