import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';

const DialogContext = createContext(null);

const TOAST_MS = 2500;

// In-app replacement for window.alert / window.confirm.
//   const dialog = useDialog();
//   const ok = await dialog.confirm({ title, message, confirmLabel = 'CONFIRM', tone });
//   dialog.notify('Saved', { tone: 'danger' });
export const DialogProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState(null);
    const [toasts, setToasts] = useState([]);
    const resolverRef = useRef(null);
    const timersRef = useRef(new Set());
    const nextId = useRef(1);

    const settle = useCallback((result) => {
        const resolve = resolverRef.current;
        resolverRef.current = null;
        setConfirmState(null);
        if (resolve) resolve(result);
    }, []);

    const confirm = useCallback(({ title, message, confirmLabel = 'CONFIRM', tone } = {}) => {
        // A new confirm supersedes an open one (counts as cancelled).
        if (resolverRef.current) resolverRef.current(false);
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setConfirmState({ title, message, confirmLabel, tone });
        });
    }, []);

    const notify = useCallback((message, { tone } = {}) => {
        const id = nextId.current++;
        setToasts((list) => [...list, { id, message, tone }]);
        const timer = setTimeout(() => {
            timersRef.current.delete(timer);
            setToasts((list) => list.filter((t) => t.id !== id));
        }, TOAST_MS);
        timersRef.current.add(timer);
    }, []);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach(clearTimeout);
            timers.clear();
        };
    }, []);

    useEffect(() => {
        if (!confirmState) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') settle(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [confirmState, settle]);

    const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);
    const danger = confirmState?.tone === 'danger';

    return (
        <DialogContext.Provider value={value}>
            {children}

            {confirmState && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-text-main/35" onClick={() => settle(false)} />
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-label={confirmState.title}
                        className={`relative w-full max-w-xs border-2 bg-bg p-4 ${danger ? 'border-alert' : 'border-primary'}`}
                    >
                        {confirmState.title && (
                            <div className={`font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${danger ? 'text-alert' : 'text-primary-text'}`}>
                                {'>_ '}{confirmState.title}
                            </div>
                        )}
                        {confirmState.message && (
                            <p className="mt-2 text-sm leading-relaxed text-text-main break-words">{confirmState.message}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <Button variant="link" onClick={() => settle(false)}>CANCEL</Button>
                            {danger ? (
                                <button
                                    type="button"
                                    onClick={() => settle(true)}
                                    style={{ clipPath: 'polygon(0 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%)' }}
                                    className="h-[38px] cursor-pointer border-2 border-alert bg-bg px-5 font-mono text-xs font-extrabold uppercase tracking-[0.22em] text-alert transition-colors hover:bg-alert/10"
                                >
                                    {confirmState.confirmLabel}
                                </button>
                            ) : (
                                <Button variant="compact" className="!w-auto px-5" onClick={() => settle(true)}>
                                    {confirmState.confirmLabel}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="pointer-events-none fixed left-0 right-0 top-3 z-[400] flex flex-col items-center gap-2 px-4">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`relative max-w-sm border bg-bg py-2 pl-4 pr-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-text-main ${t.tone === 'danger' ? 'border-alert' : 'border-primary'}`}
                    >
                        <span aria-hidden className={`absolute bottom-0 left-0 top-0 w-1 ${t.tone === 'danger' ? 'bg-alert' : 'bg-primary'}`} />
                        {t.message}
                    </div>
                ))}
            </div>
        </DialogContext.Provider>
    );
};

export const useDialog = () => {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
    return ctx;
};
