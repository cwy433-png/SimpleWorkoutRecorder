import React, { useEffect, useRef, useState } from 'react';
import { useWorkoutSession } from './SessionContext';

const LOCKED_MS = 1400;
const UNMOUNT_DELAY_MS = 700;

function formatTime(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
}

function TechCorners({ color }) {
    const base = {
        position: 'absolute',
        width: 6,
        height: 6,
        pointerEvents: 'none',
    };

    return (
        <>
            <span style={{ ...base, top: 3, left: 3, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} />
            <span style={{ ...base, top: 3, right: 3, borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
            <span style={{ ...base, bottom: 3, left: 3, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} />
            <span style={{ ...base, bottom: 3, right: 3, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
        </>
    );
}

export function FloatingRestTimer({ showFinishBar = false, isBottomNavVisible = false, primaryInk = '#0b0b0d' }) {
    const { state, commitRest } = useWorkoutSession();
    const { restState } = state;

    if (!restState.isActive || !restState.startTime) return null;

    return (
        <ActiveFloatingRestTimer
            key={restState.startTime}
            restState={restState}
            commitRest={commitRest}
            showFinishBar={showFinishBar}
            isBottomNavVisible={isBottomNavVisible}
            primaryInk={primaryInk}
        />
    );
}

function ActiveFloatingRestTimer({ restState, commitRest, showFinishBar, isBottomNavVisible, primaryInk }) {
    const [now, setNow] = useState(() => Date.now());
    const initialElapsed = Math.max(0, Math.floor((now - restState.startTime) / 1000));
    const [phase, setPhase] = useState('resting');
    const [lockedTime, setLockedTime] = useState(null);
    const [dinged, setDinged] = useState(false);
    const prevReady = useRef(initialElapsed >= restState.target);
    const dingTimeout = useRef(null);

    useEffect(() => {
        if (phase !== 'resting') return undefined;
        const interval = setInterval(() => {
            const nextNow = Date.now();
            const nextElapsed = Math.max(0, Math.floor((nextNow - restState.startTime) / 1000));
            const nextReady = nextElapsed >= restState.target;
            if (nextReady && !prevReady.current) {
                setDinged(true);
                if (dingTimeout.current) clearTimeout(dingTimeout.current);
                dingTimeout.current = setTimeout(() => setDinged(false), 520);
                prevReady.current = true;
            }
            if (!nextReady) prevReady.current = false;
            setNow(nextNow);
        }, 200);
        return () => {
            clearInterval(interval);
            if (dingTimeout.current) clearTimeout(dingTimeout.current);
        };
    }, [phase, restState.startTime, restState.target]);

    const elapsed = phase === 'resting'
        ? Math.max(0, Math.floor((now - restState.startTime) / 1000))
        : initialElapsed;
    const ready = phase === 'resting' && elapsed >= restState.target;

    useEffect(() => {
        if (phase === 'resting') return undefined;
        if (phase === 'locked') {
            const timeout = setTimeout(() => setPhase('idle'), LOCKED_MS);
            return () => clearTimeout(timeout);
        }
        if (phase === 'idle') {
            const timeout = setTimeout(() => {
                commitRest(lockedTime ?? 0);
            }, UNMOUNT_DELAY_MS);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [commitRest, lockedTime, phase]);

    const isLocked = phase === 'locked';
    const isIdle = phase === 'idle';
    const filled = isLocked || ready;
    const displayTime = isLocked || isIdle ? lockedTime : elapsed;
    const progress = isLocked ? 1 : Math.min(1, elapsed / Math.max(1, restState.target));
    const label = isLocked || isIdle ? 'LOGGED' : ready ? 'READY' : 'REST';
    const textColor = filled ? primaryInk : 'var(--color-text-main)';
    const mutedColor = filled ? primaryInk : 'var(--color-text-muted)';
    const cornerColor = filled ? primaryInk : 'var(--color-primary)';
    const bottomClass = showFinishBar
        ? isBottomNavVisible ? 'bottom-48' : 'bottom-24'
        : 'bottom-20';

    const handleCommit = () => {
        if (phase !== 'resting') return;
        const snapshot = Math.max(0, Math.floor((Date.now() - restState.startTime) / 1000));
        setLockedTime(snapshot);
        setPhase('locked');
        setDinged(false);
    };

    return (
        <button
            type="button"
            onClick={handleCommit}
            className={`fixed right-3 ${bottomClass} z-50 h-[68px] w-[68px] border p-0 font-mono shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-[opacity,transform,bottom] duration-300 ${filled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-bg)]'} ${dinged ? 'rest-ding' : ready ? 'rest-pulse' : ''} ${isIdle ? 'translate-y-2 scale-[0.92] opacity-0 pointer-events-none' : 'translate-y-0 scale-100 opacity-100'}`}
            aria-label={`Rest timer ${label.toLowerCase()} ${formatTime(displayTime ?? 0)}`}
        >
            {dinged && <span className="rest-halo absolute -inset-0.5 border-2 border-[var(--color-primary)] pointer-events-none" />}
            <TechCorners color={cornerColor} />
            <span
                className="block text-[7px] font-bold leading-none tracking-[0.25em]"
                style={{ color: mutedColor }}
            >
                {label}
            </span>
            <span
                className="mt-0.5 block text-[17px] font-black leading-none tracking-[-0.05em] tabular-nums"
                style={{ color: textColor }}
            >
                {formatTime(displayTime ?? 0)}
            </span>
            <span className={`absolute -bottom-px -left-px -right-px h-0.5 ${filled ? 'bg-transparent' : 'bg-[var(--color-border)]'}`}>
                <span
                    className={`absolute bottom-0 left-0 top-0 transition-[width] duration-200 ${filled ? 'bg-transparent' : 'bg-[var(--color-primary)]'}`}
                    style={{ width: `${progress * 100}%` }}
                />
            </span>
        </button>
    );
}
