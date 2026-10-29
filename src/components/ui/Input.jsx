import React from 'react';

export const Input = ({ label, error, ...props }) => {
    return (
        <div className="flex flex-col gap-2 mb-4">
            {label && (
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    {label}
                </label>
            )}
            <input
                className="w-full bg-bg border border-border p-3 font-mono text-text-main focus:outline-none focus:border-primary transition-colors"
                {...props}
            />
            {error && (
                <span className="font-mono text-xs text-alert">{error}</span>
            )}
        </div>
    );
};
