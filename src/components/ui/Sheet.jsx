import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Bottom sheet over a dimmed backdrop. Closes on backdrop tap, X or Escape.
// Rendered in a portal so it stacks above the bottom nav regardless of the caller's stacking context.
export const Sheet = ({ open, onClose, title, tag, children }) => {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-text-main/35" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[90vh] w-full max-w-md flex-col border-t-2 border-primary bg-bg"
            >
                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
                    <div className="min-w-0">
                        {tag && (
                            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary-text">
                                {'>_ '}{tag}
                            </div>
                        )}
                        {title && (
                            <h2 className="mt-0.5 break-words text-xl font-black uppercase leading-tight tracking-[0.02em] text-text-main">
                                {title}
                            </h2>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-text-muted transition-colors hover:text-text-main cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="overflow-y-auto px-4 pb-6">{children}</div>
            </div>
        </div>,
        document.body
    );
};
