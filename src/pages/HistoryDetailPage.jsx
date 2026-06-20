import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useHistory } from '../context/HistoryContext.jsx';
import * as historyRepo from '../data/historyRepository.js';

/**
 * HistoryDetailPage shows the full breakdown of a single completed
 * session: exercise, set number, reps completed, plus the totals.
 * Includes a delete affordance to remove the session.
 */
export default function HistoryDetailPage() {
  const { sessionId } = useParams();
  const { getSession } = useHistory();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSession(sessionId)
      .then((s) => {
        if (!cancelled) {
          setSession(s ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, getSession]);

  async function handleDelete() {
    if (!session) return;
    if (!window.confirm('Delete this session from your history?')) return;
    await historyRepo.deleteSession(session.id);
    navigate('/history');
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading session…</p>;
  }

  if (!session) {
    return (
      <div className="card text-center">
        <h1 className="text-xl font-semibold">Session not found</h1>
        <Link to="/history" className="btn-primary mt-4">
          Back to history
        </Link>
      </div>
    );
  }

  // Group completed sets by exercise, preserving the order in the plan.
  const exerciseMap = new Map();
  for (const set of session.completedSets) {
    if (!exerciseMap.has(set.exerciseIndex)) {
      const ex = session.planSnapshot[set.exerciseIndex];
      exerciseMap.set(set.exerciseIndex, {
        name: ex?.name ?? set.exerciseName ?? `Exercise ${set.exerciseIndex + 1}`,
        sets: [],
      });
    }
    exerciseMap.get(set.exerciseIndex).sets.push(set);
  }
  const exercises = Array.from(exerciseMap.entries()).sort(
    ([a], [b]) => a - b,
  );

  const totalReps = session.completedSets.reduce(
    (s, c) => s + (c.repsCompleted || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Session
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {new Date(session.date).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h1>
        </div>
        <Link to="/history" className="btn-ghost">
          ‹ Back
        </Link>
      </div>

      <div className="card grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold tabular-nums">
            {session.completedSets.length}
          </div>
          <div className="text-xs uppercase text-slate-500">Sets</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums">{totalReps}</div>
          <div className="text-xs uppercase text-slate-500">Reps</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums">
            {formatDuration(session.totalDuration)}
          </div>
          <div className="text-xs uppercase text-slate-500">Duration</div>
        </div>
      </div>

      <div className="space-y-3">
        {exercises.map(([idx, ex]) => (
          <div key={idx} className="card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{ex.name}</h2>
              <span className="text-xs text-slate-500">
                {ex.sets.length} set{ex.sets.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {ex.sets
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((s) => (
                  <li
                    key={s.setNumber}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-slate-600">Set {s.setNumber}</span>
                    <span className="font-medium tabular-nums">
                      {s.repsCompleted} reps
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="btn-ghost w-full text-red-600"
      >
        Delete session
      </button>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
