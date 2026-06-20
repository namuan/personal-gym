import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import * as historyRepo from '../data/historyRepository.js';

const HistoryContext = createContext(null);

const initialState = {
  sessions: [],
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'load':
      return { ...state, sessions: action.sessions, loading: false, error: null };
    case 'error':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

/**
 * Holds the list of completed workout sessions, sorted newest first.
 */
export function HistoryProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(async () => {
    try {
      const sessions = await historyRepo.listSessions();
      dispatch({ type: 'load', sessions });
    } catch (err) {
      dispatch({ type: 'error', error: err.message });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSession = useCallback(
    async (session) => {
      await historyRepo.addSession(session);
      await refresh();
    },
    [refresh],
  );

  const getSession = useCallback((id) => historyRepo.getSession(id), []);

  const value = {
    sessions: state.sessions,
    loading: state.loading,
    error: state.error,
    addSession,
    getSession,
    refresh,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within a HistoryProvider');
  return ctx;
}
