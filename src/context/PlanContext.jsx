import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import * as planRepo from '../data/planRepository.js';

const PlanContext = createContext(null);

const initialState = {
  plan: null, // null = no plan saved yet
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'load':
      return { ...state, plan: action.plan, loading: false, error: null };
    case 'error':
      return { ...state, loading: false, error: action.error };
    case 'saving':
      return { ...state, error: null };
    default:
      return state;
  }
}

/**
 * Holds the single active workout plan. M2 will wire the repository;
 * the shape is in place so the layout shell can use it.
 */
export function PlanProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load the active plan once on mount.
  useEffect(() => {
    let cancelled = false;
    planRepo
      .getActivePlan()
      .then((plan) => {
        if (!cancelled) dispatch({ type: 'load', plan });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: 'error', error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const savePlan = useCallback(async (plan) => {
    dispatch({ type: 'saving' });
    const saved = await planRepo.savePlan(plan);
    dispatch({ type: 'load', plan: saved });
    return saved;
  }, []);

  const clearPlan = useCallback(async () => {
    await planRepo.clearPlan();
    dispatch({ type: 'load', plan: null });
  }, []);

  const value = {
    plan: state.plan,
    loading: state.loading,
    error: state.error,
    hasPlan: Boolean(state.plan),
    savePlan,
    clearPlan,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
}
