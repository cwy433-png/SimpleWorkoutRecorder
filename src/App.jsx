import React, { useState, useEffect } from 'react';
import { QUOTES, QUOTE_PACKS, getEnabledQuotes } from './data/quotes';
import { Dumbbell, Calendar, ClipboardList, Trophy, Home, BrainCircuit } from 'lucide-react';
import './index.css';
import { PlanManager } from './modules/plans/PlanManager';
import { PlanDetail } from './modules/plans/PlanDetail';
import { SessionDashboard } from './modules/tracker/SessionDashboard';
import { HistoryManager } from './modules/history/HistoryManager';
import { AiManager } from './modules/ai/AiManager';
import { Button } from './components/ui/Button';
import { HomeView_Cyber } from './modules/home/HomeView_Cyber';
import { HomeView_Rhodes } from './modules/home/HomeView_Rhodes';

// Motivational Quotes Database
// Motivational Quotes moved to src/data/quotes.js

// Theme Registry V2 - Isolated Palettes per Style
// Each style has its own distinct theme collection
const THEME_REGISTRY = {
  cyber: [
    {
      name: 'Neon Lime',
      primary: '#D0FD3E',
      bg: '#000000',
      surface: '#0f0f0f',
      textMain: '#ffffff',
      textMuted: '#888888',
      border: '#333333'
    },
    {
      name: 'Cyber Blue',
      primary: '#00E5FF',
      bg: '#050A14',
      surface: '#0A1428',
      textMain: '#ffffff',
      textMuted: '#64748b',
      border: '#1e293b'
    },
    {
      name: 'Hot Pink',
      primary: '#FF0099',
      bg: '#100005',
      surface: '#1a0a0f',
      textMain: '#ffffff',
      textMuted: '#9ca3af',
      border: '#3f1d2e'
    },
    {
      name: 'Matrix Green',
      primary: '#00FF41',
      bg: '#051405',
      surface: '#0a2810',
      textMain: '#ffffff',
      textMuted: '#86efac',
      border: '#166534',
      type: 'dark'
    },
  ],
  rhodes: [
    {
      name: 'Clinical (Light)',
      primary: '#84cc16', // Vibrant Lime (Arknights Vibe)
      bg: '#ffffff',      // Pure White
      surface: '#f4f4f5', // Zinc-100
      textMain: '#09090b', // Rich Black (High Contrast)
      textMuted: '#71717a',
      border: '#e4e4e7',
      type: 'light'
    },
    {
      name: 'Rhodes OS',
      primary: '#A4C639',
      bg: '#0b0b0d',
      surface: '#121214',
      textMain: '#e4e4e7',
      textMuted: '#71717a',
      border: '#27272a',
      type: 'dark'
    },
    {
      name: 'Medical Bay',
      primary: '#38bdf8',
      bg: '#0f172a',
      surface: '#1e293b',
      textMain: '#f0f9ff',
      textMuted: '#94a3b8',
      border: '#334155',
      type: 'dark'
    },
  ]
};

const STYLES = [
  { id: 'rhodes', name: 'Rhodes Protocol' },
  { id: 'cyber', name: 'Cyber Heavy' },
];



function App() {
  const [view, setView] = useState('HOME');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  // Quote Packs State
  const [enabledQuotePacks, setEnabledQuotePacks] = useState(() => {
    const saved = localStorage.getItem('enabled_quote_packs');
    if (saved) return JSON.parse(saved);
    return QUOTE_PACKS.filter(p => p.enabled).map(p => p.id);
  });

  // Random Quote Logic
  const [quote, setQuote] = useState({ text: "Loading...", author: "System" });
  useEffect(() => {
    const quotes = getEnabledQuotes(enabledQuotePacks);
    if (quotes.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(randomQuote);
    }
  }, []); // Run once on mount

  // Mobile Keyboard Detection
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  useEffect(() => {
    const originalHeight = window.innerHeight;
    const handleResize = () => {
      // If height shrinks by > 20%, keyboard is likely open
      if (window.innerHeight < originalHeight * 0.8) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme State
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(THEME_REGISTRY.cyber[0]);
  const [currentStyle, setCurrentStyle] = useState(STYLES[0]);

  // Init Theme & Style
  useEffect(() => {
    // Load Style first to determine which theme registry to use
    const savedStyle = localStorage.getItem('app_style');
    let loadedStyle = STYLES[0];
    if (savedStyle) {
      try {
        const style = JSON.parse(savedStyle);
        loadedStyle = style;
        setCurrentStyle(style);
        document.documentElement.setAttribute('data-style', style.id);
      } catch (e) {
        setCurrentStyle(STYLES[0]);
      }
    }

    // Load Color based on style context
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        // Validate theme exists in current style's registry
        const themeRegistry = THEME_REGISTRY[loadedStyle.id];
        const validTheme = themeRegistry.find(t => t.name === theme.name) || themeRegistry[0];
        applyTheme(validTheme);
      } catch (e) {
        applyTheme(THEME_REGISTRY[loadedStyle.id][0]);
      }
    } else {
      applyTheme(THEME_REGISTRY[loadedStyle.id][0]);
    }
  }, []);

  const applyTheme = (theme) => {
    setCurrentTheme(theme);
    const root = document.documentElement;

    // Deep Variable Injection - Full Palette
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-bg', theme.bg);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text-main', theme.textMain);
    root.style.setProperty('--color-text-muted', theme.textMuted);
    root.style.setProperty('--color-text-muted', theme.textMuted);
    root.style.setProperty('--color-border', theme.border);

    // Force Browser Color Scheme (User Preference Override)
    // This prevents Android/iOS "Dark Mode" from forcibly darkening our Light Theme
    root.style.colorScheme = theme.type || 'dark';

    localStorage.setItem('app_theme', JSON.stringify(theme));
  };

  const applyStyle = (style) => {
    setCurrentStyle(style);
    document.documentElement.setAttribute('data-style', style.id);
    localStorage.setItem('app_style', JSON.stringify(style));

    // When switching styles, load the first theme from that style's registry
    const newThemeRegistry = THEME_REGISTRY[style.id];
    const newTheme = newThemeRegistry[0];
    applyTheme(newTheme);
  };

  // ... (existing handlers)

  // Load random quote logic...
  useEffect(() => {
    if (view === 'HOME') {
      const quotes = getEnabledQuotes(enabledQuotePacks);
      if (quotes.length > 0) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
      }
    }
  }, [view, enabledQuotePacks]);

  // Quote Pack Toggle
  const toggleQuotePack = (packId) => {
    setEnabledQuotePacks(prev => {
      const updated = prev.includes(packId)
        ? prev.filter(id => id !== packId)
        : [...prev, packId];
      localStorage.setItem('enabled_quote_packs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setView('PLAN_DETAIL');
  };

  const handleStartSession = () => {
    const savedDefaultId = localStorage.getItem('default_plan_id');
    const savedPlans = JSON.parse(localStorage.getItem('workout_plans') || '[]');

    if (savedDefaultId) {
      const defaultPlan = savedPlans.find(p => p.id == savedDefaultId);
      if (defaultPlan) {
        handleSelectPlan(defaultPlan);
        return;
      }
    }
    setView('PLANS_LIST');
  };

  const handleStartWorkout = (dayIndex) => {
    setSelectedDayIndex(dayIndex);
    setView('WORKOUT_DASHBOARD');
  };

  const finishWorkout = (sessionLogs) => {
    const activeDay = selectedPlan.days[selectedDayIndex];

    // V2: Use Array for robustness and ID preservation
    const logsArray = [];

    if (sessionLogs) {
      Object.entries(sessionLogs).forEach(([exId, sets]) => {
        const exercise = activeDay.exercises.find(e => e.id == exId);
        // Robustness: Even if exercise lookup fails (rare), we try to preserve data if possible,
        // though here we rely on the plan data. 
        if (exercise) {
          logsArray.push({
            exerciseId: exercise.id, // Primary Key (Stable)
            exerciseName: exercise.name, // Fallback Key (Readable)
            sets: sets,
            timestamp: Date.now()
          });
        }
      });
    }

    const workoutRecord = {
      id: Date.now(),
      date: Date.now(),
      planTitle: selectedPlan.title,
      dayName: activeDay.name,
      logs: logsArray, // V2 Format
      duration: 0,
      // Meta field for future extensibility (e.g. from imports)
      meta: {
        appVersion: '0.1.0',
        source: 'manual_session'
      }
    };

    const existingHistory = JSON.parse(localStorage.getItem('workout_history') || '[]');
    const newHistory = [workoutRecord, ...existingHistory];
    localStorage.setItem('workout_history', JSON.stringify(newHistory));

    setView('HOME');
    // alert("Workout Saved Successfully!"); 
  };

  const getHomeComponent = () => {
    return currentStyle.id === 'rhodes' ? HomeView_Rhodes : HomeView_Cyber;
  };

  const renderContent = () => {
    switch (view) {
      case 'HOME':
        const HomeView = getHomeComponent();
        return <HomeView
          onStart={handleStartSession}
          setView={setView}
          quote={quote}
          onOpenTheme={() => setShowThemeModal(true)}
          quotePacks={QUOTE_PACKS}
          enabledQuotePacks={enabledQuotePacks}
          toggleQuotePack={toggleQuotePack}
        />;
      case 'PLANS_LIST':
        return <PlanManager onSelectPlan={handleSelectPlan} onBack={() => setView('HOME')} />;
      case 'PLAN_DETAIL':
        return <PlanDetail plan={selectedPlan} onStartDay={handleStartWorkout} onBack={() => setView('PLANS_LIST')} onHome={() => setView('HOME')} />;
      case 'WORKOUT_DASHBOARD':
        return (
          <SessionDashboard
            plan={selectedPlan}
            dayIndex={selectedDayIndex}
            onFinishWorkout={finishWorkout}
            onBack={() => setView('PLAN_DETAIL')}
          />
        );
      case 'HISTORY':
        return <HistoryManager onBack={() => setView('HOME')} />;
      case 'AI_COACH':
        return <AiManager onBack={() => setView('HOME')} />;
      default:
        const DefaultHome = getHomeComponent();
        return <DefaultHome onStart={handleStartSession} setView={setView} quote={quote} onOpenTheme={() => setShowThemeModal(true)} />;
    }
  };

  const showNav = ['HOME', 'PLANS_LIST', 'HISTORY', 'AI_COACH'].includes(view) && !isKeyboardOpen;

  return (
    <div className="flex flex-col min-h-screen text-text-main font-sans selection:bg-primary selection:text-black transition-colors duration-500">
      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative w-full max-w-md mx-auto ${showNav && !(currentStyle.id === 'rhodes' && view === 'HOME') ? 'pb-24' : ''}`}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      {/* Bottom Navigation */}
      {showNav && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none animate-in slide-in-from-bottom-5 duration-500 ${currentStyle.id === 'rhodes' ? 'bottom-0' : 'bottom-6'}`}>
          <nav className={`pointer-events-auto transition-all duration-500 flex items-center 
            ${currentStyle.id === 'rhodes'
              ? (view === 'HOME'
                ? 'w-full justify-between px-8 py-4 bg-transparent border-t-0 rounded-none' // Rhodes Home: Transparent for gradient
                : 'w-full justify-between px-8 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-md rounded-none') // Rhodes Other: Opaque
              : 'gap-6 glass px-6 py-3 rounded-full shadow-2xl border border-white/10 bg-black/50 backdrop-blur-md max-w-[90vw]' // Cyber: Floating Pill
            }`}
          >
            <NavButton icon={Home} active={view === 'HOME'} onClick={() => setView('HOME')} styleId={currentStyle.id} label="OPS" />
            <div className={`w-px h-6 ${currentStyle.id === 'rhodes' ? 'bg-[var(--color-border)]' : 'bg-white/10'}`}></div>
            <NavButton icon={ClipboardList} active={view === 'PLANS_LIST'} onClick={() => setView('PLANS_LIST')} styleId={currentStyle.id} label="FILES" />
            <div className={`w-px h-6 ${currentStyle.id === 'rhodes' ? 'bg-[var(--color-border)]' : 'bg-white/10'}`}></div>
            <NavButton icon={Calendar} active={view === 'HISTORY'} onClick={() => setView('HISTORY')} styleId={currentStyle.id} label="LOGS" />
            <div className={`w-px h-6 ${currentStyle.id === 'rhodes' ? 'bg-[var(--color-border)]' : 'bg-white/10'}`}></div>
            <NavButton icon={BrainCircuit} active={view === 'AI_COACH'} onClick={() => setView('AI_COACH')} styleId={currentStyle.id} label="AI" />
          </nav>
        </div>
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowThemeModal(false)}>
          <div className="bg-[#09090b] border border-white/10 rounded-[var(--radius-lg)] p-6 w-full max-w-sm shadow-2xl flex flex-col gap-6" onClick={e => e.stopPropagation()}>

            {/* COLOR SECTION */}
            <div>
              <h3 className="text-sm font-black text-white/50 mb-3 tracking-widest uppercase">Color Signature</h3>
              <div className="grid grid-cols-1 gap-2">
                {THEME_REGISTRY[currentStyle.id].map(t => (
                  <button
                    key={t.name}
                    onClick={() => applyTheme(t)}
                    className={`flex items-center justify-between p-3 rounded-[var(--radius-md)] border transition-all group ${currentTheme.name === t.name ? 'bg-white/10 border-white/30' : 'border-transparent hover:bg-white/5'}`}
                  >
                    <span className={`font-bold transition-colors ${currentTheme.name === t.name ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{t.name}</span>
                    <div className="w-6 h-6 rounded-full shadow-lg border border-white/10" style={{ backgroundColor: t.primary }}></div>
                  </button>
                ))}
              </div>
            </div>

            {/* STYLE SECTION */}
            <div>
              <h3 className="text-sm font-black text-white/50 mb-3 tracking-widest uppercase">Interface Style</h3>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => applyStyle(s)}
                    className={`p-3 rounded-[var(--radius-md)] border transition-all flex flex-col items-center justify-center gap-2 group ${currentStyle.id === s.id ? 'bg-primary text-black border-primary' : 'bg-black/20 border-white/10 hover:border-white/30 text-white/60 hover:text-white'}`}
                  >
                    {/* Preview Icon based on style */}
                    <div className={`w-8 h-8 border-2 border-current ${s.id === 'rhodes' ? 'rounded-none' : 'rounded-full'}`}></div>
                    <span className="text-xs font-bold uppercase tracking-wider">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button variant="ghost" className="w-full text-white/50 hover:text-white" onClick={() => setShowThemeModal(false)}>Close Settings</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents



const NavButton = ({ icon: Icon, active, onClick, styleId, label }) => {
  const isRhodes = styleId === 'rhodes';

  if (isRhodes) {
    return (
      <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all duration-300 group relative ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
      >
        <div className={`transition-all duration-300 ${active ? 'scale-100' : 'scale-90 opacity-70'}`}>
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase transition-all ${active ? 'opacity-100' : 'opacity-0 h-0 w-0 overflow-hidden'}`}>
          {label}
        </span>
        {/* Rhodes Active Indicator - Top Bar */}
        {active && (
          <span className="absolute -top-4 left-0 right-0 h-0.5 bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]"></span>
        )}
      </button>
    );
  }

  // Default Cyber Style
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-all duration-300 relative group ${active
        ? 'text-primary scale-110'
        : 'text-text-muted hover:text-white hover:bg-white/5'
        }`}
    >
      <Icon size={24} strokeWidth={active ? 3 : 2} />
      {active && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_var(--color-primary)]"></span>
      )}
    </button>
  );
};

export default App;
