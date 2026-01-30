import React from 'react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyle = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer disabled:opacity-50";

    const variants = {
        primary: "bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dim)]",
        secondary: "bg-[var(--color-surface-hover)] text-white hover:bg-[var(--color-border)]",
        ghost: "bg-transparent text-[var(--color-text-muted)] hover:text-white",
        danger: "bg-[var(--color-alert)] text-white"
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg"
    };

    // Note: We are using standard CSS classes that map to our variables in index.css
    // But for composition we just append the className string. 
    // Since we aren't using Tailwind fully yet, I will use inline styles for dynamic mapping or just stick to the CSS classes we defined.
    // Actually, to keep it simple with the plain CSS system we built:

    let variantClass = '';
    switch (variant) {
        case 'primary': variantClass = 'btn-primary'; break;
        case 'secondary': variantClass = 'btn-secondary'; break;
        case 'ghost': variantClass = 'btn-ghost'; break;
        case 'danger': variantClass = 'btn-danger'; break;
        default: variantClass = 'btn-primary';
    }

    return (
        <button
            className={`btn ${variantClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
