// Single source of truth for the "Rhodes Clinical" palette.
// tailwind.config.js reads this for theme.extend.colors and also writes every
// token as a --color-* CSS variable on :root, so utility classes
// (bg-primary) and var() references (var(--color-primary)) never drift apart.
export const colors = {
    primary: '#84cc16',
    'primary-ink': '#1a2e05',
    'primary-text': '#65a30d',
    'primary-soft': '#f7fee7',
    'primary-dim': '#65a30d',
    bg: '#ffffff',
    surface: '#f4f4f5',
    'surface-hover': '#e4e4e7',
    'text-main': '#09090b',
    'text-muted': '#71717a',
    border: '#e4e4e7',
    alert: '#FF453A',
    // Cover-only accent. Do not use on inner pages.
    neon: '#D0FD3E',
};
