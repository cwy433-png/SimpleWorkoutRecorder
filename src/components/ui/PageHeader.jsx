import React from 'react';

// Page header: `>_ TAG` line, uppercase title, mono sub line, optional right-hand slot.
export const PageHeader = ({ tag, title, sub, right }) => {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 pb-3 pt-3">
            <div className="min-w-0">
                {tag && (
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary-text">
                        {'>_ '}{tag}
                    </div>
                )}
                <h1 className="mt-0.5 break-words text-[26px] font-black uppercase leading-tight tracking-[0.02em] text-text-main">
                    {title}
                </h1>
                {sub && (
                    <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                        {sub}
                    </div>
                )}
            </div>
            {right && <div className="flex flex-shrink-0 items-center gap-3 pt-1">{right}</div>}
        </div>
    );
};
