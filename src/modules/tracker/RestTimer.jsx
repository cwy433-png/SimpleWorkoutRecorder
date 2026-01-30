import React, { useState, useEffect, useRef } from 'react';

export const RestTimer = ({ initialSeconds = 90, onComplete, onStop }) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const endTimeRef = useRef(Date.now() + initialSeconds * 1000);
    const totalDurationRef = useRef(0); // Track total time spent in component
    const mountTimeRef = useRef(Date.now());

    // Timer Logic
    useEffect(() => {
        // Reset
        endTimeRef.current = Date.now() + initialSeconds * 1000;
        mountTimeRef.current = Date.now();
        setTimeLeft(initialSeconds);

        const interval = setInterval(() => {
            const now = Date.now();
            // Calculate remaining time (can be negative)
            const remaining = Math.ceil((endTimeRef.current - now) / 1000);
            setTimeLeft(remaining);

            // Track total elapsed for reporting
            totalDurationRef.current = Math.floor((now - mountTimeRef.current) / 1000);
        }, 100);

        return () => clearInterval(interval);
    }, [initialSeconds]);

    // Format: "1:30" or "-0:15"
    const formatTime = (s) => {
        const absS = Math.abs(s);
        const m = Math.floor(absS / 60);
        const sec = absS % 60;
        const sign = s < 0 ? '+' : ''; // Show + for overtime to indicate "extra" rest
        return `${sign}${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const modifyTime = (seconds) => {
        endTimeRef.current += seconds * 1000;
        // Force update immediately for better UX
        const now = Date.now();
        setTimeLeft(Math.ceil((endTimeRef.current - now) / 1000));
    };

    const handleStop = () => {
        // Return total actual rest time
        if (onStop) onStop(totalDurationRef.current);
    };

    const isOvertime = timeLeft < 0;
    const timeString = formatTime(timeLeft);
    const fontSize = timeString.length > 4 ? 'text-4xl' : 'text-5xl'; // Auto-scale for "10:00"

    return (
        <div className={`flex flex-col items-center justify-center p-3 bg-black/80 backdrop-blur rounded-[var(--radius-lg)] border transition-colors h-full ${isOvertime ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-[var(--color-primary)]/30 shadow-[0_0_20px_rgba(208,253,62,0.1)]'}`}>
            <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isOvertime ? 'text-red-500 animate-pulse' : 'text-[var(--color-text-muted)]'}`}>
                {isOvertime ? 'OVERTIME' : 'REST TIMER'}
            </div>
            <div
                className={`${fontSize} font-black tracking-tighter tabular-nums leading-none drop-shadow-lg text-center w-full ${isOvertime ? 'text-red-500' : 'text-[var(--color-primary)]'}`}
                style={{ fontStyle: 'var(--font-slant)' }}
            >
                {timeString}
            </div>
            <div className="flex gap-2 mt-2 w-full">
                <button onClick={() => modifyTime(-10)} className="flex-1 py-2 bg-white/5 rounded-[var(--radius-sm)] text-xs font-bold text-white hover:bg-white/10 hover:text-[var(--color-primary)] transition-all active:scale-95">
                    -10s
                </button>
                <button onClick={() => modifyTime(30)} className="flex-1 py-2 bg-white/5 rounded-[var(--radius-sm)] text-xs font-bold text-white hover:bg-white/10 hover:text-[var(--color-primary)] transition-all active:scale-95">
                    +30s
                </button>
            </div>
            {/* Invisible trigger for parent to call handleStop if needed, 
                but practically parent handles the button. 
                We expose current duration via ref or callback if needed dynamically, 
                but easiest is parent passes a wrapper to get the time.
                Actually, simpler: Parent renders the "Next Set" button and we assume 
                "Rest End" = "Now - Start". Parent knows Start.
                We largely rely on parent for the 'Stop' action logic.
            */}
        </div>
    );
};
