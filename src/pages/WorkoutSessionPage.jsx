import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext.jsx';
import { useSession } from '../context/SessionContext.jsx';
import { useHistory } from '../context/HistoryContext.jsx';

/**
 * WorkoutSessionPage is the M4 deliverable: a guided set-by-set flow
 * with a countdown rest timer. Three views:
 *   - "ready"      : no active session; show a start CTA
 *   - "in-progress": the main set-by-set flow
 *   - "resting"    : full-screen countdown with skip button
 *   - "summary"    : shown briefly after completion before redirect
 */
export default function WorkoutSessionPage() {
  const { plan, hasPlan, loading } = usePlan();
  const {
    session,
    isActive,
    startSession,
    updateSession,
    completeSession,
    cancelSession,
  } = useSession();
  const { addSession } = useHistory();
  const navigate = useNavigate();

  const [view, setView] = useState('ready'); // 'ready' | 'in-progress' | 'resting' | 'summary'
  const [summary, setSummary] = useState(null);
  const sessionStartRef = useRef(null);

  // Re-enter the in-progress view if a session is still active on mount.
  useEffect(() => {
    if (isActive && session) {
      setView(session.status === 'resting' ? 'resting' : 'in-progress');
      sessionStartRef.current = session.startedAt;
    }
  }, [isActive, session]);

  const currentExercise = useMemo(() => {
    if (!session) return null;
    return session.planSnapshot[session.currentExerciseIndex] ?? null;
  }, [session]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (!hasPlan) {
    return (
      <div className="card text-center">
        <h1 className="text-xl font-semibold">No plan to start</h1>
        <p className="mt-1 text-sm text-slate-600">
          You need a workout plan before you can start a session.
        </p>
        <button
          type="button"
          onClick={() => navigate('/plan')}
          className="btn-primary mt-4"
        >
          Create a plan
        </button>
      </div>
    );
  }

  function handleStart() {
    const s = startSession(plan);
    sessionStartRef.current = s.startedAt;
    setView('in-progress');
  }

  function handleCancel() {
    if (!window.confirm('End this workout? Progress will not be saved.')) return;
    cancelSession();
    setView('ready');
  }

  function handleCompleteSet(repsCompleted) {
    if (!session || !currentExercise) return;
    const key = `${session.currentExerciseIndex}-${session.currentSetNumber}`;
    const completedSet = {
      exerciseIndex: session.currentExerciseIndex,
      exerciseName: currentExercise.name,
      setNumber: session.currentSetNumber,
      repsCompleted,
      restTaken: 0,
    };
    const completedSets = { ...(session.completedSets ?? {}), [key]: completedSet };

    // Decide: another set in the same exercise, or move to the next exercise?
    const isLastSetOfExercise =
      session.currentSetNumber >= currentExercise.sets;
    const isLastExercise =
      session.currentExerciseIndex >= session.planSnapshot.length - 1;

    if (isLastSetOfExercise && isLastExercise) {
      // Workout done — persist and show summary.
      const totalDuration = Math.round((Date.now() - session.startedAt) / 1000);
      const completed = Object.values(completedSets);
      const record = {
        id: undefined, // repository will assign
        date: Date.now(),
        planSnapshot: session.planSnapshot,
        completedSets: completed,
        totalDuration,
      };
      addSession(record).then(() => {
        setSummary({ completed, totalDuration, plan });
        completeSession();
        setView('summary');
      });
      return;
    }

    if (isLastSetOfExercise) {
      // Move to next exercise, no rest between exercises.
      updateSession({
        completedSets,
        currentExerciseIndex: session.currentExerciseIndex + 1,
        currentSetNumber: 1,
        status: 'in-progress',
        restEndsAt: null,
      });
      setView('in-progress');
      return;
    }

    // Same exercise, more sets — start the rest timer.
    const restMs = Math.max(0, currentExercise.restSeconds) * 1000;
    updateSession({
      completedSets,
      currentSetNumber: session.currentSetNumber + 1,
      status: 'resting',
      restStartedAt: Date.now(),
      restEndsAt: Date.now() + restMs,
    });
    setView('resting');
  }

  function handleSkipRest() {
    updateSession({ status: 'in-progress', restEndsAt: null });
    setView('in-progress');
  }

  if (view === 'summary' && summary) {
    return (
      <SessionSummary
        summary={summary}
        onDone={() => {
          setSummary(null);
          setView('ready');
          navigate('/history');
        }}
      />
    );
  }

  if (view === 'ready' || !isActive) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Ready to work out?</h1>
        <div className="card space-y-3">
          <p className="text-sm text-slate-600">
            You'll go through each exercise set by set, with a rest timer between sets.
          </p>
          <ul className="space-y-1 text-sm text-slate-700">
            {plan.exercises.map((ex, i) => (
              <li key={ex.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate">
                  <span className="mr-1 text-slate-400">{i + 1}.</span>
                  {ex.name}
                </span>
                <span className="shrink-0 text-slate-500">
                  {ex.sets} × {ex.reps}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={handleStart} className="btn-primary w-full">
          Start workout
        </button>
      </div>
    );
  }

  if (view === 'resting') {
    return <RestTimer exercise={currentExercise} onSkip={handleSkipRest} />;
  }

  // in-progress
  return (
    <SetStep
      session={session}
      exercise={currentExercise}
      onComplete={handleCompleteSet}
      onCancel={handleCancel}
    />
  );
}

function SetStep({ session, exercise, onComplete, onCancel }) {
  const [reps, setReps] = useState(exercise.reps);

  useEffect(() => {
    setReps(exercise.reps);
  }, [exercise.id, exercise.reps, session.currentSetNumber]);

  const totalExercises = session.planSnapshot.length;
  const totalSets = session.planSnapshot.reduce((sum, e) => sum + e.sets, 0);
  const completedSetCount = Object.keys(session.completedSets ?? {}).length;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
          <span>
            Exercise {session.currentExerciseIndex + 1} of {totalExercises}
          </span>
          <span>
            Set {session.currentSetNumber} of {exercise.sets}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{
              width: `${(completedSetCount / totalSets) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="card text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Up next
        </p>
        <h2 className="mt-1 text-2xl font-bold">{exercise.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Target: {exercise.reps} rep{exercise.reps === 1 ? '' : 's'}
        </p>
      </div>

      {exercise.instructions && (
        <div className="card whitespace-pre-wrap text-sm text-slate-700">
          {exercise.instructions}
        </div>
      )}

      <div>
        <label className="label" htmlFor="reps-completed">
          Reps completed
        </label>
        <input
          id="reps-completed"
          type="number"
          min={0}
          inputMode="numeric"
          className="input text-center text-2xl font-semibold"
          value={reps}
          onChange={(e) => setReps(Math.max(0, Number(e.target.value) || 0))}
        />
        <div className="mt-2 flex justify-center gap-2">
          {[exercise.reps - 2, exercise.reps - 1, exercise.reps, exercise.reps + 1]
            .filter((v) => v >= 0)
            .map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setReps(v)}
                className="btn-secondary"
              >
                {v}
              </button>
            ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onComplete(reps)}
        className="btn-primary w-full py-3 text-base"
      >
        Mark set complete
      </button>

      <button type="button" onClick={onCancel} className="btn-ghost w-full">
        End workout
      </button>
    </div>
  );
}

function RestTimer({ exercise, onSkip }) {
  // The timer view always starts a fresh rest, so we capture "now" on mount
  // and count down from the exercise's restSeconds. Driving from Date.now()
  // (rather than incrementing a counter) keeps the countdown robust to
  // background tab throttling and clock drift.
  const [now, setNow] = useState(() => Date.now());
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const totalMs = Math.max(0, (exercise.restSeconds ?? 0) * 1000);
  const remainingMs = Math.max(0, totalMs - (now - startedAt));
  const seconds = Math.ceil(remainingMs / 1000);
  const done = remainingMs <= 0;

  useEffect(() => {
    if (done) onSkip();
  }, [done, onSkip]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Rest
      </p>
      <div
        className="text-7xl font-bold tabular-nums tracking-tight text-slate-900"
        aria-live="polite"
      >
        {seconds}s
      </div>
      <p className="text-sm text-slate-500">
        Take a breath. The next set will start when the timer ends.
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="btn-primary px-8 py-3 text-base"
      >
        Skip rest
      </button>
    </div>
  );
}

function SessionSummary({ summary, onDone }) {
  const { completed, totalDuration } = summary;
  const totalReps = completed.reduce((s, c) => s + (c.repsCompleted || 0), 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  return (
    <div className="space-y-5 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
          Workout complete
        </p>
        <h1 className="mt-1 text-3xl font-bold">Nice work</h1>
      </div>
      <div className="card grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold tabular-nums">{completed.length}</div>
          <div className="text-xs uppercase text-slate-500">Sets</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums">{totalReps}</div>
          <div className="text-xs uppercase text-slate-500">Reps</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums">
            {minutes}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-xs uppercase text-slate-500">Duration</div>
        </div>
      </div>
      <button type="button" onClick={onDone} className="btn-primary w-full py-3 text-base">
        View history
      </button>
    </div>
  );
}
