import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

const STORAGE_KEY = 'active_session';
const PERSIST_DEBOUNCE_MS = 300;
const DEFAULT_REST_SECONDS = 90;
const inactiveRestState = { isActive: false, startTime: null, target: DEFAULT_REST_SECONDS, exerciseId: null };

const initialState = {
    isActive: false,
    plan: null,
    dayIndex: null,
    sessionExercises: [],
    sessionLogs: {},
    expandedExerciseId: null,
    startTime: null,
    restState: inactiveRestState,
};

function normalizeRestState(restState) {
    if (!restState) return inactiveRestState;
    const target = restState.target || DEFAULT_REST_SECONDS;
    const startTime = restState.startTime
        || (restState.endTime ? restState.endTime - target * 1000 : null);

    return {
        isActive: Boolean(restState.isActive && startTime),
        startTime,
        target,
        exerciseId: restState.exerciseId || null,
    };
}

function reducer(state, action) {
    switch (action.type) {
        case 'START_SESSION': {
            const { plan, dayIndex } = action;
            const day = plan?.days?.[dayIndex];
            const exercises = day?.exercises?.filter(Boolean) || [];
            return {
                isActive: true,
                plan,
                dayIndex,
                sessionExercises: exercises,
                sessionLogs: {},
                expandedExerciseId: null,
                startTime: Date.now(),
                restState: inactiveRestState,
            };
        }
        case 'END_SESSION':
        case 'DISCARD_SESSION':
            return initialState;
        case 'RESTORE_SESSION':
            return {
                ...initialState,
                ...action.payload,
                isActive: true,
                restState: normalizeRestState(action.payload.restState),
            };
        case 'SET_EXPANDED':
            return {
                ...state,
                expandedExerciseId: state.expandedExerciseId === action.id ? null : action.id,
            };
        case 'SAVE_SET': {
            const { exerciseId, setData } = action;
            const existing = state.sessionLogs[exerciseId] || [];
            if (setData.isRestUpdate) {
                if (existing.length === 0) return state;
                const lastLog = { ...existing[existing.length - 1], restTime: setData.restTime };
                return {
                    ...state,
                    sessionLogs: {
                        ...state.sessionLogs,
                        [exerciseId]: [...existing.slice(0, -1), lastLog],
                    },
                };
            }
            const setWithTime = { ...setData, timestamp: Date.now() };
            return {
                ...state,
                sessionLogs: {
                    ...state.sessionLogs,
                    [exerciseId]: [...existing, setWithTime],
                },
            };
        }
        case 'ADD_AD_HOC_EXERCISE':
            return {
                ...state,
                sessionExercises: [...state.sessionExercises, action.exercise],
            };
        case 'START_REST':
            return {
                ...state,
                restState: {
                    isActive: true,
                    startTime: Date.now(),
                    target: action.target || DEFAULT_REST_SECONDS,
                    exerciseId: action.exerciseId,
                },
            };
        case 'COMMIT_REST': {
            const exerciseId = action.exerciseId || state.restState.exerciseId;
            const elapsed = Math.max(0, Math.floor(action.elapsed || 0));
            const existing = exerciseId ? state.sessionLogs[exerciseId] || [] : [];
            if (!exerciseId || existing.length === 0) {
                return {
                    ...state,
                    restState: inactiveRestState,
                };
            }
            const lastLog = { ...existing[existing.length - 1], restTime: elapsed };
            return {
                ...state,
                sessionLogs: {
                    ...state.sessionLogs,
                    [exerciseId]: [...existing.slice(0, -1), lastLog],
                },
                restState: inactiveRestState,
            };
        }
        case 'STOP_REST':
            return {
                ...state,
                restState: inactiveRestState,
            };
        default:
            return state;
    }
}

function loadInitialState() {
    if (typeof window === 'undefined') return initialState;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return initialState;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.isActive) return initialState;
        return {
            ...initialState,
            ...parsed,
            isActive: true,
            restState: normalizeRestState(parsed.restState),
        };
    } catch (e) {
        console.error('Failed to restore active_session', e);
        return initialState;
    }
}

function isSameLocalDay(tsA, tsB) {
    const a = new Date(tsA);
    const b = new Date(tsB);
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

const WorkoutSessionContext = createContext(null);

export function WorkoutSessionProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

    // Debounced persistence: writes inactive => removeItem, active => setItem
    const persistTimer = useRef(null);
    useEffect(() => {
        if (persistTimer.current) clearTimeout(persistTimer.current);
        persistTimer.current = setTimeout(() => {
            try {
                if (state.isActive) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                console.error('Failed to persist active_session', e);
            }
        }, PERSIST_DEBOUNCE_MS);
        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
    }, [state]);

    const value = useMemo(() => {
        // isCrossDay is exposed as a callable (not a value) so the wall-clock
        // read happens at the call site, not during this useMemo's evaluation.
        const isCrossDay = () =>
            state.isActive && state.startTime
                ? !isSameLocalDay(state.startTime, Date.now())
                : false;

        return {
            state,
            isCrossDay,
            startSession: (plan, dayIndex) => dispatch({ type: 'START_SESSION', plan, dayIndex }),
            endSession: () => dispatch({ type: 'END_SESSION' }),
            discardSession: () => dispatch({ type: 'DISCARD_SESSION' }),
            setExpanded: (id) => dispatch({ type: 'SET_EXPANDED', id }),
            saveSet: (exerciseId, setData) => dispatch({ type: 'SAVE_SET', exerciseId, setData }),
            addAdHocExercise: (exercise) => dispatch({ type: 'ADD_AD_HOC_EXERCISE', exercise }),
            startRest: (exerciseId, target = DEFAULT_REST_SECONDS) => dispatch({ type: 'START_REST', exerciseId, target }),
            commitRest: (elapsed) => dispatch({ type: 'COMMIT_REST', elapsed }),
            stopRest: () => dispatch({ type: 'STOP_REST' }),
        };
    }, [state]);

    return (
        <WorkoutSessionContext.Provider value={value}>
            {children}
        </WorkoutSessionContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating the consumer hook with the provider is intentional for this small surface
export function useWorkoutSession() {
    const ctx = useContext(WorkoutSessionContext);
    if (!ctx) {
        throw new Error('useWorkoutSession must be used inside <WorkoutSessionProvider>');
    }
    return ctx;
}
