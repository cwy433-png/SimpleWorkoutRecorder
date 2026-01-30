import React from 'react';

export const Input = ({ label, error, ...props }) => {
    return (
        <div className="flex flex-col gap-2 mb-4">
            {label && (
                <label className="text-sm font-medium text-[var(--color-text-muted)]">
                    {label}
                </label>
            )}
            <input
                className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                {...props}
            />
            {error && (
                <span className="text-xs text-[var(--color-alert)]">{error}</span>
            )}
        </div>
    );
};
