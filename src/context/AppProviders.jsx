import { PlanProvider } from './PlanContext.jsx';
import { HistoryProvider } from './HistoryContext.jsx';
import { SessionProvider } from './SessionContext.jsx';

/**
 * AppProviders wraps the entire app with all the context providers that
 * need to be available to every page. Each provider is self-contained
 * and talks to the IndexedDB data layer directly.
 */
export function AppProviders({ children }) {
  return (
    <PlanProvider>
      <HistoryProvider>
        <SessionProvider>{children}</SessionProvider>
      </HistoryProvider>
    </PlanProvider>
  );
}
