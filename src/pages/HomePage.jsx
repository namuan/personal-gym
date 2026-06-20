import { Link } from 'react-router-dom';
import { usePlan } from '../context/PlanContext.jsx';
import { useHistory } from '../context/HistoryContext.jsx';

/**
 * HomePage is the dashboard: shows a quick start CTA, a summary of the
 * active plan (or a prompt to create one), and a snippet of recent
 * history. It's intentionally a single column on mobile.
 */
export default function HomePage() {
  const { plan, loading: planLoading, hasPlan } = usePlan();
  const { sessions, loading: historyLoading } = useHistory();

  const totalSets = hasPlan
    ? plan.exercises.reduce((sum, e) => sum + (e.sets || 0), 0)
    : 0;
  const totalExercises = hasPlan ? plan.exercises.length : 0;

  const lastSession = sessions[0];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ready for your next workout? Pick up where you left off or start something new.
        </p>
      </section>

      <section className="card">
        {planLoading ? (
          <p className="text-sm text-slate-500">Loading your plan…</p>
        ) : hasPlan ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
                Active plan
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {totalExercises} exercise{totalExercises === 1 ? '' : 's'} ·{' '}
                {totalSets} set{totalSets === 1 ? '' : 's'} total
              </h2>
            </div>
            <ul className="space-y-1 text-sm text-slate-700">
              {plan.exercises.slice(0, 3).map((ex) => (
                <li key={ex.id} className="flex justify-between">
                  <span className="truncate">{ex.name}</span>
                  <span className="text-slate-500">
                    {ex.sets} × {ex.reps}
                  </span>
                </li>
              ))}
              {plan.exercises.length > 3 && (
                <li className="text-xs text-slate-500">
                  +{plan.exercises.length - 3} more…
                </li>
              )}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/session" className="btn-primary">
                Start workout
              </Link>
              <Link to="/plan" className="btn-secondary">
                Edit plan
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Get started
              </p>
              <h2 className="mt-1 text-lg font-semibold">No workout plan yet</h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a single workout plan to get started. You can edit it any time.
              </p>
            </div>
            <Link to="/plan" className="btn-primary">
              Create your plan
            </Link>
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent activity
          </h2>
          {!historyLoading && sessions.length > 0 && (
            <Link to="/history" className="text-sm font-medium text-brand-700 hover:underline">
              See all
            </Link>
          )}
        </div>
        {historyLoading ? (
          <p className="text-sm text-slate-500">Loading history…</p>
        ) : lastSession ? (
          <Link
            to={`/history/${lastSession.id}`}
            className="card block transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {new Date(lastSession.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  {lastSession.completedSets.length} sets completed
                </p>
              </div>
              <span className="text-slate-400">›</span>
            </div>
          </Link>
        ) : (
          <div className="card text-sm text-slate-500">
            No completed sessions yet. Your first workout will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
