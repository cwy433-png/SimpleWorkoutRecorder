import React from 'react';
import { ChevronRight } from 'lucide-react';

// Rhodes Clinical buttons.
//   primary  - style C: soft-green fill, green border, left bar, mono label row, chevron
//   compact  - one centered mono line (used for LOG SET)
//   link     - muted mono uppercase text link; tone="danger" colours it with `alert`
// Legacy variants map onto `link`: secondary/ghost -> link, danger -> link + tone="danger".
// `size` is still accepted; it only scales link text.

const PRIMARY_CLIP = 'polygon(0 0,100% 0,100% 70%,95% 100%,0 100%)';
const COMPACT_CLIP = 'polygon(0 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%)';

const LINK_SIZES = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
};

export const Button = ({
    children,
    variant = 'primary',
    tone,
    size = 'md',
    label,
    className = '',
    type = 'button',
    ...props
}) => {
    let kind = variant;
    let linkTone = tone;
    if (variant === 'secondary' || variant === 'ghost') kind = 'link';
    if (variant === 'danger') {
        kind = 'link';
        linkTone = 'danger';
    }
    if (kind !== 'primary' && kind !== 'compact' && kind !== 'link') kind = 'primary';

    if (kind === 'link') {
        const color = linkTone === 'danger'
            ? 'text-alert hover:text-alert'
            : 'text-text-muted hover:text-text-main';
        return (
            <button
                type={type}
                className={`inline-flex items-center justify-center gap-1.5 font-mono font-bold uppercase tracking-[0.15em] ${LINK_SIZES[size] || LINK_SIZES.md} ${color} min-h-[32px] cursor-pointer transition-colors disabled:opacity-40 disabled:pointer-events-none ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }

    if (kind === 'compact') {
        return (
            <button
                type={type}
                style={{ clipPath: COMPACT_CLIP }}
                className={`relative block w-full h-[38px] border-2 border-primary bg-primary-soft pl-1 font-mono text-xs font-extrabold uppercase tracking-[0.22em] text-text-main cursor-pointer transition-colors hover:bg-primary/20 active:bg-primary/30 disabled:opacity-40 disabled:pointer-events-none ${className}`}
                {...props}
            >
                <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                {children}
            </button>
        );
    }

    return (
        <button
            type={type}
            style={{ clipPath: PRIMARY_CLIP }}
            className={`relative block w-full h-[60px] border-2 border-primary bg-primary-soft pl-[18px] pr-4 text-left text-text-main cursor-pointer transition-colors hover:bg-primary/20 active:bg-primary/30 disabled:opacity-40 disabled:pointer-events-none ${className}`}
            {...props}
        >
            <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <span className="flex h-full items-center justify-between gap-3">
                <span className="min-w-0">
                    {label && (
                        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-primary-text truncate">
                            {label}
                        </span>
                    )}
                    <span className="block text-xl font-black uppercase tracking-[0.02em] leading-tight truncate">
                        {children}
                    </span>
                </span>
                <ChevronRight size={22} strokeWidth={2.5} className="flex-shrink-0 text-primary-text" />
            </span>
        </button>
    );
};
