import { useLayoutEffect } from 'react';

// Fixed bottom elements (nav, session bar, page footers, rest timer) stack on
// top of each other. Each publishes its live height as a CSS variable on <html>
// (0px while hidden) and positions itself from the variables below it, so the
// stack never overlaps no matter which pieces are shown.
//
//   --nav-h          bottom nav (App)
//   --session-bar-h  resume/discard bar, directly above the nav (App)
//   --footer-h       page footer: FINISH bar or plan editor SAVE bar
//
// Rest timer floats above all of them.
export const BOTTOM_ABOVE_NAV_AND_BAR = 'calc(var(--nav-h, 0px) + var(--session-bar-h, 0px))';
export const BOTTOM_ABOVE_FOOTER = 'calc(var(--nav-h, 0px) + var(--session-bar-h, 0px) + var(--footer-h, 0px))';

// Publish ref's height as `name` on <html> while `active`; reset to 0px otherwise.
export function usePublishHeight(name, ref, active = true) {
    useLayoutEffect(() => {
        const root = document.documentElement;
        const el = ref.current;
        if (!active || !el) {
            root.style.setProperty(name, '0px');
            return undefined;
        }
        const publish = () => root.style.setProperty(name, `${el.offsetHeight}px`);
        publish();
        let observer;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(publish);
            observer.observe(el);
        }
        return () => {
            observer?.disconnect();
            root.style.setProperty(name, '0px');
        };
    }, [name, ref, active]);
}
