import React, { useState, useEffect } from 'react';
import { QUOTES, QUOTE_PACKS, getEnabledQuotes } from './data/quotes';
import { Dumbbell, Calendar, ClipboardList, Trophy, Home, BrainCircuit } from 'lucide-react';
import './index.css';
import { PlanManager } from './modules/plans/PlanManager';
import { PlanDetail } from './modules/plans/PlanDetail';
import { SessionDashboard } from './modules/tracker/SessionDashboard';
import { FloatingRestTimer } from './modules/tracker/FloatingRestTimer';
import { useWorkoutSession } from './modules/tracker/SessionContext';
import { HistoryManager } from './modules/history/HistoryManager';
import { AiManager } from './modules/ai/AiManager';
import { HomeView_Rhodes } from './modules/home/HomeView_Rhodes';
import { normalizeRecord } from './modules/history/historyModel';

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

  const finishWorkout = (sessionLogs, targetExercises) => {
    // Read plan/dayIndex from session state — it's the source of truth and
    // survives reloads, unlike the App-level selectedPlan which is null on restore.
    const sessionPlan = session.state.plan;
    const sessionDayIndex = session.state.dayIndex;
    const activeDay = sessionPlan?.days?.[sessionDayIndex];

    if (!activeDay) {
      // Defensive: nothing to write, just clear and bail
      session.endSession();
      setView('HOME');
      return;
    }

    // V2: Use Array for robustness and ID preservation
    const logsArray = [];

    if (sessionLogs) {
      Object.entries(sessionLogs).forEach(([exId, sets]) => {
        // Priority: Look in the exercises passed from the session (includes Ad-Hoc)
        // Fallback: Look in the active day (standard plan exercises)
        let exercise = targetExercises?.find(e => e.id == exId);
        if (!exercise) {
          exercise = activeDay.exercises.find(e => e.id == exId);
        }

        if (exercise) {
          logsArray.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: sets,
            timestamp: Date.now()
          });
        }
      });
    }

    const workoutRecord = {
      id: Date.now(),
      date: Date.now(),
      planTitle: sessionPlan.title,
      dayName: activeDay.name,
      logs: logsArray,
      duration: 0,
      meta: {
        appVersion: '0.1.0',
        source: 'manual_session'
      }
    };

    const existingHistory = JSON.parse(localStorage.getItem('workout_history') || '[]');
    const newHistory = [workoutRecord, ...existingHistory];
    localStorage.setItem('workout_history', JSON.stringify(newHistory));

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

  const handleDiscardSession = () => {
    const msg = session.isCrossDay()
      ? 'Discard this stale workout from a previous day?'
      : 'Discard the current workout? Progress will be lost.';
    if (window.confirm(msg)) {
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
        return (
          <SessionDashboard
            onFinishWorkout={finishWorkout}
            onBack={() => setView(selectedPlan ? 'PLAN_DETAIL' : 'HOME')}
            isBottomNavVisible={showNav}
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
    && (view !== 'WORKOUT_DASHBOARD' || workoutScrolledToBottom);
  const sessionIsCrossDay = session.isCrossDay();

  return (
    <div className="flex flex-col min-h-screen text-text-main font-sans selection:bg-primary selection:text-black transition-colors duration-500">
      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative w-full max-w-md mx-auto ${showNav && view !== 'HOME' ? 'pb-24' : ''}`}>
        {renderContent()}
      </main>

      <FloatingRestTimer
        showFinishBar={view === 'WORKOUT_DASHBOARD'}
        isBottomNavVisible={showNav}
      />

      {/* Resume Workout Pill — visible on any view except the dashboard itself */}
      {session.state.isActive && view !== 'WORKOUT_DASHBOARD' && (
        <div className="fixed top-3 left-0 right-0 z-40 flex justify-center pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300 px-4">
          <div className={`pointer-events-auto flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full backdrop-blur-md shadow-2xl border ${sessionIsCrossDay
            ? 'bg-amber-500/15 border-amber-400/50'
            : 'bg-black/80 border-[var(--color-primary)]/40'
            }`}>
            <button
              onClick={handleResumeSession}
              className="flex items-center gap-2 pr-2"
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${sessionIsCrossDay ? 'bg-amber-400' : 'bg-[var(--color-primary)]'
                }`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {sessionIsCrossDay ? 'Stale Workout' : 'Resume Workout'}
              </span>
              <span className="text-[10px] font-bold text-white/60 truncate max-w-[100px] uppercase tracking-tight">
                {session.state.plan?.days?.[session.state.dayIndex]?.name || ''}
              </span>
            </button>
            <button
              onClick={handleDiscardSession}
              aria-label="Discard workout"
              className="text-white/50 hover:text-white text-base w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation: opaque, transparent over the cover */}
      {showNav && (
        <div className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none animate-in slide-in-from-bottom-5 duration-500 bottom-0">
          <nav className={`pointer-events-auto transition-all duration-500 flex items-center w-full justify-between px-8 py-4 rounded-none ${view === 'HOME'
            ? 'bg-transparent border-t-0'
            : 'border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-md'
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
