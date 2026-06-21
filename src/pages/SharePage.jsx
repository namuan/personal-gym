import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext.jsx';
import { decodePayloadToPlan, extractPayloadFromHash } from '../data/shareCodec.js';

/**
 * SharePage renders the recipient experience for a share URL.
 *
 * The URL is of the form <base>share#data=<payload>. We:
 *   1. Read the hash on mount and after hashchange events.
 *   2. Decode + normalise the payload.
 *   3. Show a preview with an explicit Import / Cancel choice.
 *   4. On import, replace the active plan and route to /plan.
 */
export default function SharePage() {
  const navigate = useNavigate();
  const { savePlan } = usePlan();

  const [state, setState] = useState({ status: 'loading' });

  // Read & decode the hash, react to changes.
  useEffect(() => {
    let cancelled = false;
    async function readHash() {
      const payload = extractPayloadFromHash(window.location.hash);
      if (!payload) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'This share link is invalid or corrupted.',
          });
        }
        return;
      }
      try {
        const decoded = await decodePayloadToPlan(payload);
        if (!cancelled) {
          setState({ status: 'ready', payload, decoded });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err?.message ?? 'This share link is invalid or corrupted.',
          });
        }
      }
    }
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', readHash);
    };
  }, []);

  // The recipient can press Escape to bail out (matches the modal behaviour).
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && state.status === 'ready') {
        cancel();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  function clearHash() {
    // Replace, not push, so back button doesn't return to the share URL.
    const url = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', url);
  }

  function cancel() {
    clearHash();
    navigate('/', { replace: true });
  }

  async function importPlan() {
    if (state.status !== 'ready') return;
    setState((s) => ({ ...s, importing: true, importError: null }));
    try {
      await savePlan({ exercises: state.decoded.exercises });
      clearHash();
      navigate('/plan', { replace: true });
    } catch (err) {
      setState((s) => ({
        ...s,
        importing: false,
        importError: err?.message ?? 'Could not import this plan.',
      }));
    }
  }

  if (state.status === 'loading') {
    return <p className="text-sm text-slate-500">Reading share link…</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Shared plan</h1>
        <div className="card space-y-3" role="alert">
          <p className="text-sm text-slate-700">{state.message}</p>
          <button type="button" onClick={cancel} className="btn-primary">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const { decoded, importing, importError } = state;
  const named = decoded.exercises.filter(
    (e) => typeof e.name === 'string' && e.name.trim().length > 0,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shared plan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Someone shared a workout plan with you. Review it below, then
          import it to replace your current plan.
        </p>
      </div>

      <div className="card divide-y divide-slate-200">
        {named.map((ex, i) => (
          <SharedExerciseRow key={ex.id ?? i} index={i} exercise={ex} />
        ))}
      </div>

      {importError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {importError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={importPlan}
          disabled={importing || named.length === 0}
          className="btn-primary flex-1 sm:flex-none"
        >
          {importing ? 'Importing…' : 'Import this plan'}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={importing}
          className="btn-ghost"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SharedExerciseRow({ index, exercise }) {
  const [expanded, setExpanded] = useState(false);
  const hasInstructions =
    typeof exercise.instructions === 'string' && exercise.instructions.length > 0;
  return (
    <div className="space-y-1 py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Exercise {index + 1}
          </div>
          <div className="text-sm font-medium text-slate-900">
            {exercise.name}
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          {exercise.sets} × {exercise.reps} · {exercise.restSeconds}s rest
        </div>
      </div>
      {hasInstructions && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-brand-700 hover:underline"
        >
          {expanded ? 'Hide instructions' : 'Show instructions'}
        </button>
      )}
      {hasInstructions && expanded && (
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {exercise.instructions}
        </p>
      )}
    </div>
  );
}
