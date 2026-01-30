import React from 'react';
import { Dumbbell } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const HomeView_Cyber = ({ onStart, view, quote, onOpenTheme }) => (
    <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-500 h-full">
        {/* Header */}
        <div className="flex justify-between items-center py-4 relative z-20">
            <div className="text-xl font-black tracking-tighter" style={{ fontStyle: 'var(--font-slant)' }}>
                WORKOUT<span className="text-primary">.AI</span>
            </div>
            <button
                onClick={onOpenTheme}
                className="flex items-center gap-2 bg-[var(--color-surface)] border border-white/10 hover:border-[var(--color-primary)] pl-2 pr-3 py-1.5 rounded-[var(--radius-full)] transition-all active:scale-95 group"
            >
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] group-hover:scale-125 transition-transform"></div>
                <span className="text-[10px] font-bold text-white/50 group-hover:text-white transition-colors tracking-widest">STYLE</span>
            </button>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12 -mt-10">
            <div className="space-y-4">
                <h1 className="text-7xl font-black tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50" style={{ fontStyle: 'var(--font-slant)' }}>
                    LIFT<br />
                    <span className="text-primary drop-shadow-[0_0_30px_rgba(208,253,62,0.5)]">HEAVY</span>
                </h1>
                <div className="relative inline-block mt-4">
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm"></div>
                    <p className="relative text-[10px] font-mono uppercase tracking-[0.2em] text-primary/80 max-w-[250px] mx-auto leading-relaxed border-t border-b border-primary/20 py-3">
                        "{quote}"
                    </p>
                </div>
            </div>

            <div className="relative group">
                <button
                    onClick={onStart}
                    className="hero-btn relative z-10 w-40 h-40 rounded-[var(--radius-full)] flex flex-col items-center justify-center bg-surface border border-white/10 shadow-2xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 group-hover:border-primary/50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <Dumbbell className="hero-icon text-primary mb-2 drop-shadow-lg" size={48} />
                    <span className="hero-text text-3xl font-black text-white group-hover:text-primary transition-colors" style={{ fontStyle: 'var(--font-slant)' }}>START SESSION</span>
                </button>

                {/* Glow rings - dynamic shape */}
                <div className="hero-glow absolute inset-0 rounded-[var(--radius-full)] border border-primary/20 animate-[ping_3s_ease-out_infinite] opacity-50"></div>
                <div className="hero-glow absolute -inset-4 rounded-[var(--radius-full)] border border-primary/10 animate-[ping_4s_ease-out_infinite_0.5s] opacity-30"></div>
                <div className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            </div>

            {/* Data Warning - High Visibility */}
            <div className="mt-12 text-center text-alert/80 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF453A]">
                    ⚠ Data Stored on Device
                </p>
                <p className="text-[9px] font-mono text-white/50">
                    Backup via <span className="text-white underline decoration-white/30">LOGS</span> &gt; <span className="text-white underline decoration-white/30">TOOLS</span>
                </p>
            </div>
        </div>
    </div>
);
