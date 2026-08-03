// timers.jsx — 4 floating rest timer variants, Rhodes Protocol style.
// All count-UP. Target is a state cue, not a deadline.
// Single affordance: whole widget is tappable to "lock in" (records rest time).
//
// Lifecycle:
//   resting → counting up (the active rest period)
//   locked  → user tapped: shows "LOGGED M:SS" for ~1.4s
//             (proxy for writing restTime to the last logged set)
//   idle    → ~700ms gap with timer hidden, then a fresh resting starts
//             (proxy for the rest period being over)

function useElapsed(startTime, speed = 1, paused = false) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [paused]);
  return Math.max(0, Math.floor((now - startTime) * speed / 1000));
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// Hide the widget during idle phase: faded out + slightly offset, pointer-blocked.
function phaseStyle(phase) {
  const idle = phase === 'idle';
  return {
    opacity: idle ? 0 : 1,
    pointerEvents: idle ? 'none' : 'auto',
    transition: 'opacity 0.32s ease, transform 0.32s ease',
  };
}

// ── V1 ── REST PILL — top center, horizontal status pill ──────────────
function TimerV1_Pill({ phase, elapsed, lockedTime, target, theme, onCommit }) {
  const t = theme;
  const isLocked = phase === 'locked';
  const ready = elapsed >= target;
  const progress = isLocked ? 1 : Math.min(1, elapsed / target);
  const displayTime = isLocked ? lockedTime : elapsed;
  const accent = isLocked || ready;

  return (
    <div style={{
      position: 'absolute', top: 12, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', zIndex: 50,
      pointerEvents: 'none',
      ...phaseStyle(phase),
      transform: phase === 'idle' ? 'translateY(-6px)' : 'translateY(0)',
    }}>
      <button onClick={onCommit} style={{
        pointerEvents: 'auto',
        background: t.bg,
        border: `1px solid ${accent ? t.primary : t.border}`,
        padding: '7px 14px 9px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', position: 'relative',
        clipPath: t.chamfer,
        color: t.textMain, ...MONO,
        boxShadow: accent
          ? `0 0 0 1px ${t.primary}, ${t.shadowMd}` : t.shadowMd,
        minWidth: 230,
        animation: !isLocked && ready ? 'restPulse 1.8s ease-in-out infinite' : 'none',
      }}>
        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.22em',
          color: accent ? t.primary : t.textMuted,
        }}>{isLocked ? 'LOGGED //' : ready ? 'READY //' : 'REST::T+'}</div>

        <div style={{
          fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em',
          color: accent ? t.primary : t.textMain,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}>{fmtTime(displayTime)}</div>

        <div style={{ flex: 1 }} />

        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.22em',
          color: isLocked ? t.primary : t.textMuted,
        }}>{isLocked ? '✓ SAVED' : '// LOCK IN ▶'}</div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 1.5, background: t.border, overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`, background: t.primary,
            transition: 'width 0.25s linear',
          }} />
        </div>
      </button>
    </div>
  );
}

// ── V2 ── TACTICAL NUMBER — right side, large bare time + progress ring ──
function TimerV2_Number({ phase, elapsed, lockedTime, target, theme, onCommit }) {
  const t = theme;
  const isLocked = phase === 'locked';
  const ready = elapsed >= target;
  const progress = isLocked ? 1 : Math.min(1, elapsed / target);
  const displayTime = isLocked ? lockedTime : elapsed;
  const overshoot = isLocked ? 0 : Math.max(0, elapsed - target);
  const accent = isLocked || ready;

  const size = 96;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <button onClick={onCommit} style={{
      position: 'absolute', right: 10, top: '38%',
      background: 'transparent', border: 'none', cursor: 'pointer',
      padding: 6, display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 50, gap: 4,
      ...phaseStyle(phase),
      transform: phase === 'idle' ? 'translateX(8px)' : 'translateX(0)',
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{
          position: 'absolute', inset: stroke,
          background: t.bg, opacity: 0.92,
          borderRadius: '50%',
        }} />
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={t.border} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={t.primary} strokeWidth={stroke}
            strokeDasharray={`${progress * circ} ${circ}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dasharray 0.25s linear' }}
          />
          <line x1={size/2} y1={1} x2={size/2} y2={6}
            stroke={t.primary} strokeWidth={2} />
        </svg>

        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 1,
        }}>
          <div style={{
            fontSize: 7, ...MONO, fontWeight: 700,
            color: accent ? t.primary : t.textMuted, letterSpacing: '0.25em',
            animation: !isLocked && ready ? 'restPulse 1.8s ease-in-out infinite' : 'none',
          }}>{isLocked ? 'LOGGED' : ready ? 'READY' : 'REST'}</div>
          <div style={{
            fontSize: 22, fontWeight: 900, ...MONO, letterSpacing: '-0.04em',
            color: accent ? t.primary : t.textMain, lineHeight: 1,
          }}>{fmtTime(displayTime)}</div>
          {ready && !isLocked && overshoot > 0 && (
            <div style={{
              fontSize: 7, ...MONO, fontWeight: 700,
              color: t.textMuted, letterSpacing: '0.15em', lineHeight: 1,
            }}>+{fmtTime(overshoot)}</div>
          )}
        </div>
      </div>
      <div style={{
        fontSize: 7, ...MONO, fontWeight: 700,
        color: isLocked ? t.primary : t.textMuted, letterSpacing: '0.22em',
        background: t.bg, padding: '2px 6px', border: `1px solid ${isLocked ? t.primary : t.border}`,
      }}>{isLocked ? '✓ SAVED' : 'TAP // LOCK'}</div>
    </button>
  );
}

// ── V3 ── DEPLOY BAR — full-width bottom band, above nav ──────────────
function TimerV3_Bar({ phase, elapsed, lockedTime, target, theme, onCommit, navHeight = 56 }) {
  const t = theme;
  const isLocked = phase === 'locked';
  const ready = elapsed >= target;
  const progress = isLocked ? 1 : Math.min(1, elapsed / target);
  const displayTime = isLocked ? lockedTime : elapsed;
  const accent = isLocked || ready;

  return (
    <button onClick={onCommit} style={{
      position: 'absolute', left: 8, right: 8, bottom: navHeight + 8,
      background: t.bg,
      border: `1px solid ${accent ? t.primary : t.border}`,
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer', zIndex: 50,
      clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
      color: t.textMain,
      boxShadow: accent
        ? `0 0 0 1px ${t.primary}, 0 -6px 18px rgba(0,0,0,${t.isDark ? 0.5 : 0.12})`
        : `0 -6px 18px rgba(0,0,0,${t.isDark ? 0.5 : 0.12})`,
      animation: !isLocked && ready ? 'restPulse 1.8s ease-in-out infinite' : 'none',
      overflow: 'hidden',
      ...phaseStyle(phase),
      transform: phase === 'idle' ? 'translateY(8px)' : 'translateY(0)',
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: `${progress * 100}%`,
        background: t.primary, opacity: t.isDark ? 0.1 : 0.08,
        transition: 'width 0.25s linear', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
        <div style={{
          fontSize: 9, ...MONO, fontWeight: 700,
          color: accent ? t.primary : t.textMuted, letterSpacing: '0.22em',
          whiteSpace: 'nowrap',
        }}>{isLocked ? 'LOGGED //' : ready ? 'READY //' : 'REST::T+'}</div>

        <div style={{
          fontSize: 22, fontWeight: 900, ...MONO, letterSpacing: '-0.04em',
          color: accent ? t.primary : t.textMain, lineHeight: 1,
        }}>{fmtTime(displayTime)}</div>

        <div style={{ flex: 1 }} />

        <div style={{
          fontSize: 10, ...MONO, fontWeight: 800, color: isLocked ? t.primary : t.textMain,
          letterSpacing: '0.22em', display: 'flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap',
        }}>{isLocked ? '✓ SAVED' : ready ? 'NEXT SET ▶' : 'LOCK IN ▶'}</div>
      </div>

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
        background: t.border,
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${progress * 100}%`, background: t.primary,
          transition: 'width 0.25s linear',
        }} />
      </div>
    </button>
  );
}

// ── V4 ── CORNER MARKER — small square FAB, bottom-right above nav ────
function TimerV4_Corner({ phase, elapsed, lockedTime, target, theme, onCommit, navHeight = 56 }) {
  const t = theme;
  const isLocked = phase === 'locked';
  const ready = elapsed >= target;
  const progress = isLocked ? 1 : Math.min(1, elapsed / target);
  const displayTime = isLocked ? lockedTime : elapsed;
  const filled = isLocked || ready; // green background state

  // Fire a one-shot "ding" the instant elapsed crosses target (visual stand-in
  // for haptic — iOS PWA has no navigator.vibrate). React to the rising edge of
  // `ready` while in the resting phase; cleared on commit/restart.
  const [dinged, setDinged] = React.useState(false);
  const prevReady = React.useRef(false);
  React.useEffect(() => {
    if (phase !== 'resting') { prevReady.current = false; return; }
    if (ready && !prevReady.current) {
      setDinged(true);
      const id = setTimeout(() => setDinged(false), 520);
      prevReady.current = true;
      return () => clearTimeout(id);
    }
    if (!ready) prevReady.current = false;
  }, [ready, phase]);

  const size = 68;

  return (
    <button onClick={onCommit} style={{
      position: 'absolute', right: 12, bottom: navHeight + 76,
      width: size, height: size,
      background: filled ? t.primary : t.bg,
      border: `1px solid ${filled ? t.primary : t.border}`,
      cursor: 'pointer', zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 0,
      boxShadow: t.isDark
        ? '0 4px 16px rgba(0,0,0,0.6)'
        : '0 4px 16px rgba(0,0,0,0.15)',
      animation: dinged
        ? 'restDing 0.5s ease-out'
        : (!isLocked && ready ? 'restPulse 1.8s ease-in-out infinite' : 'none'),
      ...phaseStyle(phase),
      transform: phase === 'idle' ? 'translateY(8px) scale(0.92)' : 'translateY(0) scale(1)',
    }}>
      {/* Halo ring — expands & fades on ding; sits underneath the square */}
      {dinged && (
        <div style={{
          position: 'absolute', inset: -2, pointerEvents: 'none',
          border: `2px solid ${t.primary}`,
          animation: 'restHalo 0.55s ease-out forwards',
        }} />
      )}
      <TechCorners
        color={filled ? t.primaryInk : t.primary}
        size={6} inset={3} weight={1.5}
      />

      <div style={{
        fontSize: 7, ...MONO, fontWeight: 700,
        color: filled ? t.primaryInk : t.textMuted, letterSpacing: '0.25em',
        lineHeight: 1, marginBottom: 2,
      }}>{isLocked ? 'LOGGED' : ready ? 'READY' : 'REST'}</div>
      <div style={{
        fontSize: 17, fontWeight: 900, ...MONO, letterSpacing: '-0.05em',
        color: filled ? t.primaryInk : t.textMain, lineHeight: 1,
      }}>{fmtTime(displayTime)}</div>

      <div style={{
        position: 'absolute', bottom: -1, left: -1, right: -1, height: 2,
        background: filled ? 'transparent' : t.border, pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${progress * 100}%`,
          background: filled ? 'transparent' : t.primary,
          transition: 'width 0.25s linear',
        }} />
      </div>
    </button>
  );
}

Object.assign(window, {
  useElapsed, fmtTime,
  TimerV1_Pill, TimerV2_Number, TimerV3_Bar, TimerV4_Corner,
});
