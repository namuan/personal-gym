import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import PlanEditorPage from './pages/PlanEditorPage.jsx';
import WorkoutSessionPage from './pages/WorkoutSessionPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HistoryDetailPage from './pages/HistoryDetailPage.jsx';

/**
 * App is the top-level routed shell. The Layout component handles the
 * persistent header/navigation and renders the active route via <Outlet />.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="plan" element={<PlanEditorPage />} />
        <Route path="session" element={<WorkoutSessionPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="history/:sessionId" element={<HistoryDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
