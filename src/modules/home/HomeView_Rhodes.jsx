import React from 'react';
import { Terminal, Activity, ChevronRight, Zap } from 'lucide-react';

export const HomeView_Rhodes = ({ onStart, view, quote, onOpenTheme }) => (
    <div className="flex-1 flex flex-col p-0 h-full bg-[var(--color-bg)] text-[var(--color-text-main)] overflow-hidden relative">
        {/* Background Grid - faint overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}></div>

        {/* Top Status Bar */}
        <div className="flex justify-between items-start p-4 border-b border-[var(--color-border)] relative z-10 bg-[var(--color-bg)]/80 backdrop-blur-sm">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 text-primary font-mono text-xs tracking-widest opacity-80">
                    <Terminal size={12} />
                    <span>PRTS::TERMINAL_V3</span>
                </div>
                <div className="text-2xl font-black tracking-tighter mt-1 font-mono">
                    RHODES<span className="text-primary/50">_NET</span>
                </div>
            </div>

            {/* Style Toggle - Technical Switch */}
            <button
                onClick={onOpenTheme}
                className="flex items-center gap-2 border border-primary/30 px-3 py-1 bg-primary/5 hover:bg-primary/20 transition-all clip-path-slant"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
                <span className="w-2 h-2 bg-primary animate-pulse"></span>
                <span className="text-[10px] font-mono text-primary font-bold">MODE_SELECT</span>
            </button>
        </div>

        {/* Main Content Area - Asymmetric Grid */}
        <div className="flex-1 flex flex-col relative z-10">

            {/* Left Side Info Panel (Briefing) */}
            <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="border-l-2 border-primary/50 pl-4 py-2 relative">
                    <div className="absolute -left-[5px] -top-[5px] w-2 h-2 border-l border-t border-primary"></div>
                    <div className="absolute -left-[5px] -bottom-[5px] w-2 h-2 border-l border-b border-primary"></div>

                    <h3 className="text-xs font-mono text-[var(--color-text-muted)] mb-2 tracking-[0.2em] uppercase">Daily Advice</h3>
                    <p className="font-mono text-sm leading-relaxed text-[var(--color-text-main)] max-w-sm">
                        "{quote.text}"
                    </p>
                    <p className="font-mono text-xs text-primary mt-2 text-right opacity-80">
                        — {quote.author}
                    </p>
                </div>

                {/* Decorative Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8 max-w-xs">
                    <div className="bg-[var(--color-surface)] p-2 border border-[var(--color-border)]">
                        <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Sys Status</div>
                        <div className="text-primary font-mono">NORMAL</div>
                    </div>
                    <div className="bg-[var(--color-surface)] p-2 border border-[var(--color-border)]">
                        <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Sync</div>
                        <div className="text-primary font-mono">98.2%</div>
                    </div>
                </div>
            </div>

            {/* Bottom Deployment Deck */}
            <div className="mt-auto p-4 pb-8 bg-gradient-to-t from-black to-transparent">
                {/* Deployment Button */}
                {/* Deployment Button - Wireframe Style */}
                <button
                    onClick={onStart}
                    className="w-full h-24 relative group overflow-hidden transition-all active:scale-[0.98]"
                >
                    {/* Outlined Container */}
                    <div className="absolute inset-0 border border-primary/50 bg-black/50 clip-path-deploy"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 95% 100%, 0 100%)' }}>

                        {/* Inner Tech Grid */}
                        <div className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, var(--color-primary) 25%, var(--color-primary) 26%, transparent 27%, transparent 74%, var(--color-primary) 75%, var(--color-primary) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, var(--color-primary) 25%, var(--color-primary) 26%, transparent 27%, transparent 74%, var(--color-primary) 75%, var(--color-primary) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}>
                        </div>

                        {/* Scanning Line Animation */}
                        <div className="absolute inset-0 bg-primary/10 w-full h-1 animate-[ping_2s_linear_infinite] top-0 opacity-50"></div>
                    </div>

                    {/* Text Content */}
                    <div className="absolute inset-0 flex items-center justify-between px-8 text-primary group-hover:text-white transition-colors">
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-80">Operation</span>
                            <span className="text-3xl font-black tracking-tighter font-mono group-hover:tracking-widest transition-all duration-300">START MISSION</span>
                        </div>
                        <ChevronRight size={32} className="opacity-80 group-hover:translate-x-2 transition-transform" />
                    </div>

                    {/* Active Hover Fill */}
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </button>

                <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[8px] font-mono text-[var(--color-text-muted)] text-xs">ID: 8092-212</span>
                    <div className="h-1 flex-1 mx-4 bg-[var(--color-surface)] overflow-hidden">
                        <div className="h-full bg-primary w-2/3"></div>
                    </div>
                    <span className="text-[8px] font-mono text-primary">READY</span>
                </div>

                {/* Data Persistence Warning - High Visibility */}
                <div className="mt-6 mb-2 mx-4 p-2 border border-amber-500/50 bg-amber-500/10 text-center animate-pulse">
                    <p className="text-[10px] font-mono text-amber-500 font-bold">
                        ⚠ DATA LOCAL ONLY
                    </p>
                    <p className="text-[9px] font-mono text-amber-500/80 mt-1">
                        TO BACKUP: GO TO <span className="text-white border-b border-white/20">LOGS</span> &gt; <span className="text-white border-b border-white/20">TOOLS</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
);
