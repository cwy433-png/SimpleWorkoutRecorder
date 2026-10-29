import React from 'react';

// Session RPE picker: 1-10 in two rows of five, with the anchors underneath.
// `value` is a number 1-10 or null; `onChange(n)` fires on tap.
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const RpePicker = ({ value, onChange }) => {
    return (
        <div>
            <div role="radiogroup" aria-label="Session RPE" className="grid grid-cols-5 gap-1.5">
                {VALUES.map((n) => {
                    const on = value === n;
                    return (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => onChange(n)}
                            className={`h-11 border font-mono text-base font-bold transition-colors ${on
                                ? 'border-primary bg-primary text-primary-ink'
                                : 'border-border bg-bg text-text-main hover:border-primary'
                                }`}
                        >
                            {n}
                        </button>
                    );
                })}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] tracking-[0.08em] text-text-muted">
                <span>1 很轻松</span>
                <span>5 吃力</span>
                <span>10 极限</span>
            </div>
        </div>
    );
};
