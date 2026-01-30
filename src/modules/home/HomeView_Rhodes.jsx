import React, { useState, useRef } from 'react';
import { Terminal, Activity, ChevronRight, Zap, Check } from 'lucide-react';

export const HomeView_Rhodes = ({ onStart, view, quote, onOpenTheme, quotePacks = [], enabledQuotePacks = [], toggleQuotePack }) => {
    const [showQuotePackModal, setShowQuotePackModal] = useState(false);
    const longPressTimer = useRef(null);

    const handleQuoteTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setShowQuotePackModal(true);
        }, 1000); // 1s long press for easter egg
    };

    const handleQuoteTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-0 h-full bg-[var(--color-bg)] text-[var(--color-text-main)] overflow-hidden relative">
            {/* Background Grid - faint overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}></div>

            {/* Top Status Bar */}
            <div className="flex justify-between items-start p-4 border-b border-[var(--color-border)] relative z-10 bg-[var(--color-bg)]/80 backdrop-blur-sm">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-primary font-mono text-xs tracking-widest opacity-80" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.25)' }}>
                        <Terminal size={12} />
                        <span>PRTS::TERMINAL_V3</span>
                    </div>
                    <div className="text-2xl font-black tracking-tighter mt-1 font-mono">
                        RHODES<span className="text-primary/50" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.15)' }}>_NET</span>
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
                    {/* Quote Area - Hidden Easter Egg Interaction */}
                    <div
                        className="border-l-2 border-primary/50 pl-4 py-2 relative cursor-pointer select-none active:bg-primary/5 transition-colors"
                        onTouchStart={handleQuoteTouchStart}
                        onTouchEnd={handleQuoteTouchEnd}
                        onMouseDown={handleQuoteTouchStart}
                        onMouseUp={handleQuoteTouchEnd}
                        onMouseLeave={handleQuoteTouchEnd}
                        title="" // No tooltip to keep it hidden
                    >
                        <div className="absolute -left-[5px] -top-[5px] w-2 h-2 border-l border-t border-primary"></div>
                        <div className="absolute -left-[5px] -bottom-[5px] w-2 h-2 border-l border-b border-primary"></div>

                        <p className="font-mono text-sm leading-relaxed text-[var(--color-text-main)] max-w-sm italic">
                            "{quote.text}"
                        </p>
                        <p className="font-mono text-xs text-primary mt-2 text-right" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.25)' }}>
                            — {quote.author}
                        </p>
                        {/* Hidden hint removed for easter egg feel */}
                    </div>

                    {/* Decorative Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-8 max-w-xs">
                        <div className="bg-[var(--color-surface)] p-2 border border-[var(--color-border)]">
                            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Sys Status</div>
                            <div className="text-primary font-mono" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.25)' }}>NORMAL</div>
                        </div>
                        <div className="bg-[var(--color-surface)] p-2 border border-[var(--color-border)]">
                            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Sync</div>
                            <div className="text-primary font-mono" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.25)' }}>98.2%</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Deployment Deck */}
                <div className="mt-auto p-4 pb-28 bg-gradient-to-t from-black via-black/40 to-transparent z-10 relative">
                    {/* Deployment Button - Clean Industrial Style */}
                    <button
                        onClick={onStart}
                        className="w-full h-20 relative group overflow-hidden transition-all active:scale-[0.98]"
                    >
                        {/* Clean Bordered Container */}
                        <div className="absolute inset-0 border-2 border-primary/70 bg-black/60 backdrop-blur-sm"
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 95% 100%, 0 100%)' }}>

                            {/* Subtle Inner Glow Line */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                        </div>

                        {/* Text Content */}
                        <div className="absolute inset-0 flex items-center justify-between px-6 text-primary group-hover:text-white transition-colors">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-70">Operation</span>
                                <span className="text-2xl font-black tracking-tight font-mono uppercase">Deploy</span>
                            </div>
                            <ChevronRight size={28} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Hover Fill */}
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </button>

                    <div className="flex justify-between items-center mt-2 px-1">
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">OPERATOR: ACTIVE</span>
                        <div className="h-1 flex-1 mx-4 bg-[var(--color-surface)] overflow-hidden">
                            <div className="h-full bg-primary w-2/3"></div>
                        </div>
                        <span className="text-[10px] font-mono text-primary">READY</span>
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

            {/* Quote Pack Selection Modal */}
            {showQuotePackModal && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
                    onClick={() => setShowQuotePackModal(false)}
                >
                    <div
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black uppercase tracking-tight text-[var(--color-text-main)] mb-4 border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
                            <span>ACCESS GRANTED</span>
                            <span className="text-[10px] bg-primary text-black px-1 font-mono">ADMIN</span>
                        </h3>
                        <div className="flex flex-col gap-2">
                            {quotePacks.map(pack => {
                                const isEnabled = enabledQuotePacks.includes(pack.id);
                                return (
                                    <button
                                        key={pack.id}
                                        onClick={() => toggleQuotePack && toggleQuotePack(pack.id)}
                                        className={`flex items-center justify-between p-3 border transition-all ${isEnabled
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                                            }`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className={`font-bold uppercase ${isEnabled ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-main)]'}`}>
                                                {pack.name}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                {pack.quotes.length} quotes
                                            </span>
                                        </div>
                                        <div className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${isEnabled
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                                : 'border-[var(--color-border)]'
                                            }`}>
                                            {isEnabled && <Check size={14} className="text-black" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-4 text-center font-mono">
                            Database Parameter Updated...
                        </p>
                        <button
                            onClick={() => setShowQuotePackModal(false)}
                            className="w-full mt-4 py-2 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-bold uppercase text-sm transition-all"
                        >
                            CLOSE TERMINAL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
