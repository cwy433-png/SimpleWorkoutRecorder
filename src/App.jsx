import React, { useState, useEffect, useRef } from 'react';
import { QUOTES, QUOTE_PACKS, getEnabledQuotes } from './data/quotes';
import { Calendar, ClipboardList, Home, BrainCircuit, X } from 'lucide-react';
import './index.css';
import { PlanManager } from './modules/plans/PlanManager';
import { PlanDetail } from './modules/plans/PlanDetail';
import { SessionDashboard } from './modules/tracker/SessionDashboard';
import { DebriefView } from './modules/tracker/DebriefView';
import { FloatingRestTimer } from './modules/tracker/FloatingRestTimer';
import { useWorkoutSession } from './modules/tracker/SessionContext';
import { HistoryManager } from './modules/history/HistoryManager';
import { AiManager } from './modules/ai/AiManager';
import { HomeView_Rhodes } from './modules/home/HomeView_Rhodes';
import { normalizeRecord } from './modules/history/historyModel';
import { appendRecord, HistoryCorruptError } from './modules/history/historyStore';
import { useDialog } from './components/ui/Dialog';
import { usePublishHeight } from './lib/bottomStack';

// Motivational Quotes Database
// Motivational Quotes moved to src/data/quotes.js

// Fresh read of the saved history, normalized (legacy records included).
const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('workout_history') || '[]').map(normalizeRecord);
  } catch {
    return [];
  }
};

function App() {
  const [view, setView] = useState('HOME');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [workoutScrolledToBottom, setWorkoutScrolledToBottom] = useState(false);

  // Global workout session (active workout state survives view switches & reloads).
  // dayIndex is owned by the session context once a workout starts.
  const session = useWorkoutSession();
  const dialog = useDialog();

  // Quote Packs State
  const [enabledQuotePacks, setEnabledQuotePacks] = useState(() => {
    const saved = localStorage.getItem('enabled_quote_packs');
    if (saved) return JSON.parse(saved);
    return QUOTE_PACKS.filter(p => p.enabled).map(p => p.id);
  });

  // Random Quote Logic
  const [quote, setQuote] = useState({ text: "Loading...", author: "System" });

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

  // Single light palette (src/theme/tokens.js). Drop keys left by the old theme picker.
  useEffect(() => {
    localStorage.removeItem('app_style');
    localStorage.removeItem('app_theme');
    document.documentElement.style.colorScheme = 'light';
  }, []);

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
    session.startSession(selectedPlan, dayIndex);
    setView('WORKOUT_DASHBOARD');
  };

  const handleSaveDebrief = (record) => {
    try {
      appendRecord(record, localStorage);
    } catch (e) {
      if (e instanceof HistoryCorruptError) {
        // Keep the session alive so nothing is lost.
        dialog.notify('HISTORY UNREADABLE — RESTORE A BACKUP', { tone: 'danger' });
        return;
      }
      throw e;
    }
    session.endSession();
    setView('HOME');
  };

  const handleResumeSession = () => {
    setView('WORKOUT_DASHBOARD');
  };

  useEffect(() => {
    if (view !== 'WORKOUT_DASHBOARD') {
      setWorkoutScrolledToBottom(false);
    }
  }, [view]);

  const handleDiscardSession = async () => {
    const message = session.isCrossDay()
      ? 'Discard this stale workout from a previous day?'
      : 'Discard the current workout? Progress will be lost.';
    const ok = await dialog.confirm({
      title: 'DISCARD WORKOUT',
      message,
      confirmLabel: 'DISCARD',
      tone: 'danger',
    });
    if (ok) {
      session.discardSession();
      if (view === 'WORKOUT_DASHBOARD') setView('HOME');
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'HOME':
        return <HomeView_Rhodes
          onStart={handleStartSession}
          setView={setView}
          quote={quote}
          quotePacks={QUOTE_PACKS}
          enabledQuotePacks={enabledQuotePacks}
          toggleQuotePack={toggleQuotePack}
        />;
      case 'PLANS_LIST':
        return <PlanManager onSelectPlan={handleSelectPlan} onBack={() => setView('HOME')} />;
      case 'PLAN_DETAIL':
        return <PlanDetail plan={selectedPlan} history={readHistory()} onStartDay={handleStartWorkout} onBack={() => setView('PLANS_LIST')} onHome={() => setView('HOME')} />;
      case 'WORKOUT_DASHBOARD':
        if (session.state.phase === 'debrief') {
          return <DebriefView onSave={handleSaveDebrief} />;
        }
        return (
          <SessionDashboard
            onBack={() => setView(selectedPlan ? 'PLAN_DETAIL' : 'HOME')}
            onBottomReachChange={setWorkoutScrolledToBottom}
          />
        );
      case 'HISTORY':
        return <HistoryManager onBack={() => setView('HOME')} />;
      case 'AI_COACH':
        return <AiManager onBack={() => setView('HOME')} />;
      default:
        return <HomeView_Rhodes onStart={handleStartSession} setView={setView} quote={quote} />;
    }
  };

  const showNav = ['HOME', 'PLANS_LIST', 'PLAN_DETAIL', 'WORKOUT_DASHBOARD', 'HISTORY', 'AI_COACH'].includes(view)
    && !isKeyboardOpen
    && (view !== 'WORKOUT_DASHBOARD' || session.state.phase === 'debrief' || workoutScrolledToBottom);
  const sessionIsCrossDay = session.isCrossDay();
  const showSessionBar = session.state.isActive && view !== 'WORKOUT_DASHBOARD';
  const onCover = view === 'HOME'; // the cover is dark: the session bar uses its neon-on-black look there

  // Publish the live bottom-stack heights (see src/lib/bottomStack.js).
  const navRef = useRef(null);
  const sessionBarRef = useRef(null);
  usePublishHeight('--nav-h', navRef, showNav);
  usePublishHeight('--session-bar-h', sessionBarRef, showSessionBar);

  return (
    <div className="flex flex-col min-h-screen text-text-main font-sans selection:bg-primary selection:text-black transition-colors duration-500">
      {/* Main Content Area */}
      <main
        className="flex-1 flex flex-col relative w-full max-w-md mx-auto"
        style={view === 'HOME' ? undefined : { paddingBottom: 'calc(var(--nav-h, 0px) + var(--session-bar-h, 0px))' }}
      >
        {renderContent()}
      </main>

      <FloatingRestTimer />

      {/* Session bar: slim, directly above the nav; every view except the dashboard */}
      {showSessionBar && (
        <div
          ref={sessionBarRef}
          style={{ bottom: 'var(--nav-h, 0px)' }}
          className={`fixed left-0 right-0 z-40 border-t transition-[bottom] duration-300 ${onCover
            ? `bg-black/80 ${sessionIsCrossDay ? 'border-amber-400/40' : 'border-neon/30'}`
            : `border-border ${sessionIsCrossDay ? 'bg-amber-50' : 'bg-primary-soft'}`}`}
        >
          <div className="relative mx-auto flex h-10 w-full max-w-md items-stretch">
            <span aria-hidden className={`absolute bottom-0 left-0 top-0 w-1 ${sessionIsCrossDay ? (onCover ? 'bg-amber-400' : 'bg-amber-500') : (onCover ? 'bg-neon' : 'bg-primary')}`} />
            <button
              type="button"
              onClick={handleResumeSession}
              className={`min-w-0 flex-1 truncate pl-4 pr-2 text-left font-mono text-[11px] font-bold uppercase tracking-[0.15em] ${sessionIsCrossDay ? (onCover ? 'text-amber-400' : 'text-amber-700') : (onCover ? 'text-neon' : 'text-primary-text')}`}
            >
              {sessionIsCrossDay ? 'STALE SESSION' : '>_ SESSION ACTIVE'}
              {' · '}
              {session.state.plan?.days?.[session.state.dayIndex]?.name || ''}
            </button>
            <button
              type="button"
              onClick={handleDiscardSession}
              aria-label="Discard workout"
              className={`flex w-11 flex-shrink-0 items-center justify-center ${onCover ? 'text-neon/70 hover:text-neon' : 'text-text-muted hover:text-text-main'}`}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation: opaque, transparent over the cover */}
      {showNav && (
        <div ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none animate-in slide-in-from-bottom-5 duration-500">
          <nav className={`pointer-events-auto flex w-full items-center justify-between rounded-none px-8 py-4 ${view === 'HOME'
            ? 'bg-transparent'
            : 'border-t border-border bg-bg'
            }`}
          >
            <NavButton icon={Home} active={view === 'HOME'} onClick={() => setView('HOME')} label="OPS" />
            <div className="w-px h-6 bg-[var(--color-border)]"></div>
            <NavButton icon={ClipboardList} active={view === 'PLANS_LIST'} onClick={() => setView('PLANS_LIST')} label="FILES" />
            <div className="w-px h-6 bg-[var(--color-border)]"></div>
            <NavButton icon={Calendar} active={view === 'HISTORY'} onClick={() => setView('HISTORY')} label="LOGS" />
            <div className="w-px h-6 bg-[var(--color-border)]"></div>
            <NavButton icon={BrainCircuit} active={view === 'AI_COACH'} onClick={() => setView('AI_COACH')} label="AI" />
          </nav>
        </div>
      )}
    </div>
  );
}

// Subcomponents



const NavButton = ({ icon: Icon, active, onClick, label }) => (
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
    {/* Active Indicator - Top Bar */}
    {active && (
      <span className="absolute -top-4 left-0 right-0 h-0.5 bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]"></span>
    )}
  </button>
);

export default App;
