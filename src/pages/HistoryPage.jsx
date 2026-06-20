import { Link } from 'react-router-dom';
import { useHistory } from '../context/HistoryContext.jsx';

/**
 * HistoryPage lists completed sessions, newest first, with a short
 * summary per row. Tapping a row navigates to the detail page.
 */
export default function HistoryPage() {
  const { sessions, loading } = useHistory();

  if (loading) {
    return <p className="text-sm text-slate-500">Loading history…</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="card text-center">
        <h1 className="text-xl font-semibold">No sessions yet</h1>
        <p className="mt-1 text-sm text-slate-600">
          Once you complete a workout, it'll be saved here for your records.
        </p>
        <Link to="/session" className="btn-primary mt-4">
          Start your first workout
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Workout history</h1>
      <ul className="space-y-2">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              to={`/history/${s.id}`}
              className="card flex items-center justify-between transition-colors hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-semibold">
                  {new Date(s.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  {s.completedSets.length} sets · {formatDuration(s.totalDuration)}
                </p>
              </div>
              <span className="text-slate-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0 min';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds}s`;
  return `${minutes} min`;
}
