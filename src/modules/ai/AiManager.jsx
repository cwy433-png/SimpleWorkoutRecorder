import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { UserProfile } from './UserProfile';

export const AiManager = ({ onBack }) => {
    const [view, setView] = useState('PROFILE'); // PROFILE | CHAT

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300 overflow-y-auto pb-safe">
            <div className="flex items-center gap-2 mb-4 px-2 pt-2">
                <Button size="sm" variant="ghost" onClick={onBack}>&larr; Home</Button>
                <h2 className="text-xl font-black italic uppercase tracking-tighter ml-auto text-[var(--color-text-main)]">
                    <span className="text-[var(--color-primary)]">AI</span> Coach
                </h2>
            </div>

            <div className="px-4">
                {/* Intro / Context */}
                <div className="mb-6 text-center">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest">Powered by DeepSeek-V3</p>
                </div>

                <UserProfile />

                <div className="mt-8 text-center px-8 opacity-50">
                    <p className="text-[10px] text-[var(--color-text-muted)] italic">
                        More AI features coming soon: Plan Generation, Form Check, and Daily Tips.
                    </p>
                </div>
            </div>
        </div>
    );
};
