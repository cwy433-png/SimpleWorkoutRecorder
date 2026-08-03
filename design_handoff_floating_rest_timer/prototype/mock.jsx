// mock.jsx — Rhodes Protocol styled mock workout dashboard backdrop
// Used as the under-content behind each timer variant artboard, so the
// floating widget can be evaluated in context.

const RHODES = {
  light: {
    id: 'light',
    bg: '#ffffff',
    surface: '#f4f4f5',
    surfaceAlt: '#e4e4e7',
    primary: '#84cc16',
    primaryInk: '#1a2e05',
    textMain: '#09090b',
    textMuted: '#71717a',
    border: '#e4e4e7',
    isDark: false,
    chamfer: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
    gridLine: 'rgba(0,0,0,0.035)',
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 14px rgba(0,0,0,0.08)',
  },
  dark: {
    id: 'dark',
    bg: '#0b0b0d',
    surface: '#121214',
    surfaceAlt: '#1a1a1c',
    primary: '#A4C639',
    primaryInk: '#0b0b0d',
    textMain: '#e4e4e7',
    textMuted: '#71717a',
    border: '#27272a',
    isDark: true,
    chamfer: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
    gridLine: 'rgba(255,255,255,0.04)',
    shadowSm: '0 1px 2px rgba(0,0,0,0.4)',
    shadowMd: '0 4px 14px rgba(0,0,0,0.5)',
  },
};

const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, monospace' };

function TechCorners({ color, size = 8, inset = 0, weight = 1.5 }) {
  const s = { position: 'absolute', width: size, height: size, pointerEvents: 'none' };
  return (
    <>
      <div style={{ ...s, top: inset, left: inset, borderLeft: `${weight}px solid ${color}`, borderTop: `${weight}px solid ${color}` }} />
      <div style={{ ...s, top: inset, right: inset, borderRight: `${weight}px solid ${color}`, borderTop: `${weight}px solid ${color}` }} />
      <div style={{ ...s, bottom: inset, left: inset, borderLeft: `${weight}px solid ${color}`, borderBottom: `${weight}px solid ${color}` }} />
      <div style={{ ...s, bottom: inset, right: inset, borderRight: `${weight}px solid ${color}`, borderBottom: `${weight}px solid ${color}` }} />
    </>
  );
}

function MockExerciseCard({ t, name, sets, done, expanded }) {
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${expanded ? t.primary : t.border}`,
      padding: 10,
      position: 'relative',
      opacity: done ? 0.45 : 1,
    }}>
      {expanded && <TechCorners color={t.primary} size={7} inset={0} weight={1.5} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 26, height: 26,
          border: `2px solid ${done ? t.primary : t.border}`,
          background: done ? t.primary : 'transparent',
          color: done ? t.primaryInk : t.textMuted,
          fontWeight: 900, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{done ? '✓' : ''}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 900, letterSpacing: '0.01em',
            textDecoration: done ? 'line-through' : 'none',
            textTransform: 'uppercase',
            color: done ? t.textMuted : t.textMain,
          }}>{name}</div>
          <div style={{
            fontSize: 9, ...MONO, color: t.textMuted,
            letterSpacing: '0.18em', marginTop: 3,
          }}>{sets} SETS · 8-12 REPS</div>
        </div>
        <div style={{ fontSize: 12, color: t.textMuted }}>{expanded ? '▲' : '▼'}</div>
      </div>
      {expanded && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: `1px solid ${t.border}`,
          display: 'flex', gap: 6,
        }}>
          {[['KG', '60'], ['REPS', '8'], ['RPE', '8']].map(([label, val]) => (
            <div key={label} style={{ flex: 1 }}>
              <div style={{
                fontSize: 8, ...MONO, color: t.textMuted,
                letterSpacing: '0.2em', marginBottom: 4, textAlign: 'center',
              }}>{label}</div>
              <div style={{
                background: t.bg, border: `1px solid ${t.border}`,
                padding: '8px 0', textAlign: 'center',
                fontWeight: 900, fontSize: 18, color: t.textMain,
              }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MockNav({ t }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: t.bg, borderTop: `1px solid ${t.border}`,
      display: 'flex', padding: '10px 24px 14px', justifyContent: 'space-between',
      zIndex: 2,
    }}>
      {['OPS', 'FILES', 'LOGS', 'AI'].map((label, i) => {
        const active = i === 0;
        return (
          <div key={label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: active ? t.primary : t.textMuted,
            position: 'relative',
          }}>
            {active && (
              <div style={{
                position: 'absolute', top: -10, left: 0, right: 0,
                height: 2, background: t.primary,
              }} />
            )}
            <div style={{
              width: 14, height: 14,
              border: `2px solid currentColor`,
            }} />
            <div style={{
              fontSize: 8, ...MONO, fontWeight: 700,
              letterSpacing: '0.2em',
            }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function MockDashboard({ theme, showFinishBtn = true }) {
  const t = theme;
  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, color: t.textMain,
      fontFamily: '"Inter", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Faint grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${t.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Header */}
      <div style={{
        padding: '10px 14px 12px',
        borderBottom: `1px solid ${t.border}`,
        position: 'relative', zIndex: 1, background: t.bg,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          fontSize: 9, ...MONO, color: t.textMuted, letterSpacing: '0.2em',
        }}>
          <span>← EXIT</span>
          <span style={{ opacity: 0.5 }}>//</span>
          <span style={{ color: t.primary }}>OPS::WORKOUT</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{
            fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em',
            textTransform: 'uppercase', lineHeight: 1,
          }}>PUSH DAY</div>
          <div style={{
            fontSize: 20, fontWeight: 800, ...MONO,
            color: t.primary, letterSpacing: '-0.02em',
          }}>12:34</div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 12 }}>
          <div style={{
            height: 5, background: t.surface, position: 'relative',
            border: `1px solid ${t.border}`,
          }}>
            <div style={{
              position: 'absolute', inset: 0, width: '60%', background: t.primary,
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9, ...MONO, color: t.textMuted,
            letterSpacing: '0.2em', marginTop: 4, textTransform: 'uppercase',
          }}>
            <span>3 / 5 DONE</span>
            <span style={{ color: t.primary }}>60%</span>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div style={{
        flex: 1, padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        <MockExerciseCard t={t} name="BENCH PRESS" sets="4/4" done={true} />
        <MockExerciseCard t={t} name="OVERHEAD PRESS" sets="2/3" expanded={true} />
        <MockExerciseCard t={t} name="DUMBBELL FLY" sets="0/3" />
        <MockExerciseCard t={t} name="TRICEP DIPS" sets="0/3" />
      </div>

      {/* Finish button */}
      {showFinishBtn && (
        <div style={{
          padding: '10px 14px', background: t.bg,
          borderTop: `1px solid ${t.border}`,
          position: 'relative', zIndex: 1,
          marginBottom: 64, // leave room for nav
        }}>
          <button style={{
            width: '100%', padding: '12px 0',
            fontSize: 13, fontWeight: 900,
            background: t.surface, color: t.textMuted,
            border: `1px solid ${t.border}`,
            ...MONO, letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: 'pointer', clipPath: t.chamfer,
          }}>FINISH WORKOUT</button>
        </div>
      )}

      <MockNav t={t} />
    </div>
  );
}

Object.assign(window, { RHODES, MONO, MockDashboard, TechCorners });
