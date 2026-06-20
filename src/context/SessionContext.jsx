import { createContext, useContext, useReducer, useCallback } from 'react';

const SessionContext = createContext(null);

/**
 * Tracks the in-progress workout session. The session is held in memory
 * for the duration of the workout and only persisted to history once
 * the user explicitly finishes the session.
 */
const initialState = {
  // null when no session is active.
  session: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'start':
      return { session: action.session };
    case 'update':
      return { session: { ...state.session, ...action.patch } };
    case 'complete':
      return { session: null };
    case 'cancel':
      return { session: null };
    default:
      return state;
  }
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startSession = useCallback((plan) => {
    const session = {
      startedAt: Date.now(),
      planSnapshot: plan.exercises.map((e) => ({ ...e })),
      // completedSet keys: `${exerciseIndex}-${setNumber}` -> { repsCompleted, restTaken }
      completedSets: {},
      // pointer for the guided flow
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      status: 'in-progress', // 'in-progress' | 'resting' | 'completed'
      restEndsAt: null,
    };
    dispatch({ type: 'start', session });
    return session;
  }, []);

  const updateSession = useCallback((patch) => {
    dispatch({ type: 'update', patch });
  }, []);

  const completeSession = useCallback(() => {
    dispatch({ type: 'complete' });
  }, []);

  const cancelSession = useCallback(() => {
    dispatch({ type: 'cancel' });
  }, []);

  const value = {
    session: state.session,
    isActive: Boolean(state.session),
    startSession,
    updateSession,
    completeSession,
    cancelSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
