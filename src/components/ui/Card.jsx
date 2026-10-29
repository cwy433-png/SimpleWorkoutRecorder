import React from 'react';

// Square card with a primary-colour corner bracket (top-left).
// `active` swaps the grey surface for a white background and a primary border.
// `flush` drops the default padding for cards that lay out their own rows.
export const Card = ({ children, className = '', title, action, active = false, flush = false }) => {
    const surface = active ? 'bg-bg border-primary' : 'bg-surface border-border';
    return (
        <div className={`relative border ${surface} ${flush ? '' : 'p-4'} ${className}`}>
            <span
                aria-hidden
                className="pointer-events-none absolute -top-px -left-px h-2 w-2 border-t-[1.5px] border-l-[1.5px] border-primary"
            />
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between">
                    {title && <h3 className="m-0 text-xl font-black uppercase tracking-[0.02em]">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};
