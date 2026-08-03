// app.jsx — Floating rest timer design exploration
// Lays 4 timer variants × 2 Rhodes themes on a DesignCanvas + Tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "target": 90,
  "speed": 1,
  "showFinishBtn": true
}/*EDITMODE-END*/;

const SPEED_OPTIONS = [
  { label: '1×', value: 1 },
  { label: '4×', value: 4 },
  { label: '16×', value: 16 },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Lifecycle phases:
  //   resting → counting up
  //   locked  → user tapped: shows "LOGGED M:SS" for ~1.4s (proxy for writing
  //             restTime to the last logged set)
  //   idle    → ~700ms gap with timer hidden (proxy for the rest period
  //             being over; next rest starts when user logs the next set)
  //   then    → resting (fresh)
  const [phase, setPhase] = React.useState('resting');
  const [startTime, setStartTime] = React.useState(() => Date.now());
  const [lockedTime, setLockedTime] = React.useState(null);
  // Pause elapsed counter outside resting phase so locked time stays frozen
  const elapsed = useElapsed(startTime, t.speed, phase !== 'resting');

  const commit = React.useCallback(() => {
    setPhase((current) => {
      if (current !== 'resting') return current;
      // Capture elapsed at the click instant (don't wait for the next useElapsed
      // tick, which can lag by up to 200ms).
      const now = Date.now();
      const e = Math.max(0, Math.floor((now - startTime) * t.speed / 1000));
      setLockedTime(e);
      return 'locked';
    });
  }, [startTime, t.speed]);

  // Drive the phase transitions
  React.useEffect(() => {
    if (phase === 'resting') return;
    let next;
    if (phase === 'locked') {
      next = setTimeout(() => setPhase('idle'), 1400);
    } else if (phase === 'idle') {
      next = setTimeout(() => {
        setStartTime(Date.now());
        setLockedTime(null);
        setPhase('resting');
      }, 700);
    }
    return () => clearTimeout(next);
  }, [phase]);

  const restart = React.useCallback(() => {
    setStartTime(Date.now());
    setLockedTime(null);
    setPhase('resting');
  }, []);
  const jumpToReady = React.useCallback(() => {
    setStartTime(Date.now() - ((t.target - 3) * 1000) / t.speed);
    setLockedTime(null);
    setPhase('resting');
  }, [t.target, t.speed]);
  const jumpToOvertime = React.useCallback(() => {
    setStartTime(Date.now() - ((t.target + 20) * 1000) / t.speed);
    setLockedTime(null);
    setPhase('resting');
  }, [t.target, t.speed]);

  const variants = [
    { id: 'v1', label: 'V1 · REST PILL', Comp: TimerV1_Pill,
      blurb: 'Top-center status pill, same visual family as the existing Resume Workout pill. Slim profile, tap to lock in. Bottom hairline fills toward target.' },
    { id: 'v2', label: 'V2 · TACTICAL NUMBER', Comp: TimerV2_Number,
      blurb: 'Right-side disc with progress ring and bare mono time. Lowest chrome, most "ambient HUD". Cost: pulls a hand reach.' },
    { id: 'v3', label: 'V3 · DEPLOY BAR', Comp: TimerV3_Bar,
      blurb: 'Full-width band riding above the bottom nav. Largest tap target, clearest call-to-action. Cost: takes a permanent slice of vertical space.' },
    { id: 'v4', label: 'V4 · CORNER MARKER', Comp: TimerV4_Corner,
      blurb: 'Small square FAB above the nav, bottom-right. Discrete, doesn\'t fight the FINISH button. Cost: less obvious as an action target.' },
  ];

  const themes = [
    { id: 'light', label: 'Clinical (Light)', theme: RHODES.light },
    { id: 'dark',  label: 'Rhodes OS (Dark)', theme: RHODES.dark },
  ];

  return (
    <>
      <DesignCanvas>
        <DCSection id="intro" title="Floating Rest Timer · Design Exploration" subtitle="Rhodes Protocol · count-up · single-tap lock-in">
          <DCArtboard id="brief" label="Design Brief" width={460} height={640}>
            <DesignBrief />
          </DCArtboard>
        </DCSection>

        {variants.map(v => (
          <DCSection key={v.id} id={v.id} title={v.label} subtitle={v.blurb}>
            {themes.map(({ id, label, theme }) => (
              <DCArtboard key={id} id={`${v.id}-${id}`} label={label}
                width={360} height={740}>
                <PhoneStage theme={theme} showFinishBtn={t.showFinishBtn}>
                  <v.Comp
                    elapsed={elapsed}
                    lockedTime={lockedTime}
                    phase={phase}
                    target={t.target}
                    theme={theme}
                    onCommit={commit}
                  />
                </PhoneStage>
              </DCArtboard>
            ))}
          </DCSection>
        ))}
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Timer state">
          <TweakSlider label="Target rest" value={t.target}
            min={30} max={180} step={5} unit="s"
            onChange={(v) => setTweak('target', v)} />
          <TweakRadio label="Speed (preview)"
            options={SPEED_OPTIONS}
            value={t.speed}
            onChange={(v) => setTweak('speed', v)} />
          <TweakButton label="Restart" onClick={restart} />
          <TweakButton label="Jump to near target" secondary onClick={jumpToReady} />
          <TweakButton label="Jump to overtime" secondary onClick={jumpToOvertime} />
        </TweakSection>
        <TweakSection label="Backdrop">
          <TweakToggle label="Show FINISH button"
            value={t.showFinishBtn}
            onChange={(v) => setTweak('showFinishBtn', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// PhoneStage — iOS frame + Rhodes mock dashboard + timer overlay slot.
function PhoneStage({ theme, showFinishBtn, children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#e8e6e1', padding: 8, boxSizing: 'border-box',
    }}>
      <IOSDevice width={344} height={724} dark={theme.isDark}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <MockDashboard theme={theme} showFinishBtn={showFinishBtn} />
          {children}
        </div>
      </IOSDevice>
    </div>
  );
}

function DesignBrief() {
  return (
    <div style={{
      width: '100%', height: '100%', padding: 24, boxSizing: 'border-box',
      background: '#0b0b0d', color: '#e4e4e7',
      fontFamily: '"Inter", system-ui, sans-serif',
      overflow: 'auto', position: 'relative',
    }}>
      <div style={{
        ...MONO, fontSize: 10, letterSpacing: '0.22em',
        color: '#A4C639', marginBottom: 14,
      }}>BRIEF // T+0:00</div>
      <h1 style={{
        fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em',
        textTransform: 'uppercase', margin: 0, marginBottom: 18, lineHeight: 1.1,
      }}>Reframe the<br/>rest timer.</h1>

      <Note title="THE PROBLEM">
        Current timer assumes the user manages it (±10s / +30s / GO / cancel). The user actually doesn't touch any of those buttons — they just want to glance and know "歇够了没".
      </Note>

      <Note title="THE FIX">
        <Stat n="1" k="UP" sub="count-up, no countdown" />
        <Stat n="2" k="STATES" sub="resting → ready" />
        <Stat n="3" k="TAP" sub="whole widget = lock-in" />
        <Stat n="4" k="GONE" sub="±, GO, cancel removed" />
      </Note>

      <Note title="STATE MODEL">
        <code style={{
          display: 'block', ...MONO, fontSize: 10, color: '#A4C639',
          background: '#121214', padding: 10, border: '1px solid #27272a',
          lineHeight: 1.6,
        }}>
          restState = {'{'}<br/>
          &nbsp;&nbsp;active: bool,<br/>
          &nbsp;&nbsp;startTime: number,<br/>
          &nbsp;&nbsp;target: number, // cue only<br/>
          {'}'}
        </code>
      </Note>

      <Note title="VARIANTS →">
        4 floats spanning <em style={{ color: '#A4C639', fontStyle: 'normal' }}>ambient ↔ assertive</em>. Compare in two themes. Use Tweaks panel to advance time and feel the resting → ready transition.
      </Note>
    </div>
  );
}

function Note({ title, children }) {
  return (
    <div style={{
      marginBottom: 14, padding: '10px 12px',
      border: '1px solid #27272a', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: -1, left: -1, width: 6, height: 6,
        borderLeft: '1.5px solid #A4C639', borderTop: '1.5px solid #A4C639',
      }} />
      <div style={{
        ...MONO, fontSize: 9, letterSpacing: '0.22em',
        color: '#71717a', marginBottom: 6,
      }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#e4e4e7' }}>
        {children}
      </div>
    </div>
  );
}

function Stat({ n, k, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4,
    }}>
      <span style={{
        ...MONO, fontSize: 10, color: '#71717a', letterSpacing: '0.2em',
      }}>0{n}</span>
      <span style={{
        fontSize: 12, fontWeight: 900, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: '#A4C639',
      }}>{k}</span>
      <span style={{ fontSize: 12, color: '#a1a1aa' }}>· {sub}</span>
    </div>
  );
}

Object.assign(window, { App, PhoneStage });
