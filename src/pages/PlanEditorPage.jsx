import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext.jsx';
import { makeBlankExercise } from '../data/planRepository.js';
import { encodePlanToPayload } from '../data/shareCodec.js';
import ShareModal from '../components/ShareModal.jsx';

const blankExercise = makeBlankExercise;

/**
 * PlanEditorPage is the M3 deliverable: a single flat list editor for
 * the active workout plan. Exercises can be added, edited, reordered
 * (up/down), and removed. Saving persists the plan to IndexedDB.
 */
export default function PlanEditorPage() {
  const { plan, loading, savePlan, clearPlan } = usePlan();
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [shareMeta, setShareMeta] = useState({ count: 0, bytes: 0 });

  // Hydrate the editor from the saved plan once it loads.
  useEffect(() => {
    if (loading) return;
    if (!dirty) {
      setExercises(
        plan?.exercises?.length
          ? plan.exercises.map((e) => ({ ...e }))
          : [blankExercise()],
      );
    }
  }, [loading, plan, dirty]);

  function updateExercise(id, patch) {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
    setDirty(true);
  }

  function addExercise() {
    setExercises((prev) => [...prev, blankExercise()]);
    setDirty(true);
  }

  function removeExercise(id) {
    setExercises((prev) => (prev.length <= 1 ? prev : prev.filter((e) => e.id !== id)));
    setDirty(true);
  }

  function move(id, direction) {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
    setDirty(true);
  }

  async function handleSave() {
    setError(null);
    const cleaned = exercises.map((e) => ({
      ...e,
      name: (e.name || '').trim(),
      instructions: (e.instructions || '').trim(),
    }));
    if (cleaned.some((e) => !e.name)) {
      setError('Every exercise needs a name. Please fill in any blank names.');
      return;
    }
    setSaving(true);
    try {
      await savePlan({ exercises: cleaned });
      setDirty(false);
    } catch (err) {
      setError(err.message ?? 'Could not save plan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!plan) return;
    const ok = window.confirm(
      'Delete the active workout plan? This will not affect your past workout history.',
    );
    if (!ok) return;
    await clearPlan();
    setExercises([blankExercise()]);
    setDirty(false);
  }

  // The Share button works on the *last saved* plan (the one in context),
  // not on unsaved edits — that way the recipient always gets exactly
  // what the sender has persisted.
  async function handleShare() {
    if (!plan) return;
    setShareError(null);
    setSharePayload(null);
    try {
      const namedExercises = plan.exercises.filter(
        (e) => typeof e.name === 'string' && e.name.trim().length > 0,
      );
      const payload = await encodePlanToPayload({ exercises: namedExercises });
      setSharePayload(payload);
      setShareMeta({ count: namedExercises.length, bytes: payload.length });
      setShareOpen(true);
    } catch (err) {
      setShareError(
        err?.message ?? 'Could not generate a share link for this plan.',
      );
      setShareOpen(true);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading your plan…</p>;
  }

  const savedNamedCount = (plan?.exercises ?? []).filter(
    (e) => typeof e.name === 'string' && e.name.trim().length > 0,
  ).length;
  const canShare = Boolean(plan) && savedNamedCount > 0 && !dirty;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your workout plan</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add the exercises you'll do each session. You only have one plan — keep it simple.
          </p>
        </div>
        {plan && (
          <button type="button" onClick={handleClear} className="btn-ghost text-red-600">
            Delete plan
          </button>
        )}
      </div>

      <div className="space-y-3">
        {exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.id}
            index={i}
            total={exercises.length}
            exercise={ex}
            onChange={(patch) => updateExercise(ex.id, patch)}
            onRemove={() => removeExercise(ex.id)}
            onMoveUp={() => move(ex.id, -1)}
            onMoveDown={() => move(ex.id, +1)}
          />
        ))}
      </div>

      <button type="button" onClick={addExercise} className="btn-secondary w-full">
        + Add exercise
      </button>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="sticky bottom-20 -mx-4 border-t border-slate-200 bg-slate-50/95 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 sm:flex-none"
          >
            {saving ? 'Saving…' : dirty ? 'Save plan' : 'Saved'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={!canShare}
            title={
              canShare
                ? 'Generate a shareable link for the saved plan'
                : dirty
                ? 'Save the plan first to share it'
                : 'Add at least one named exercise to share'
            }
            className="btn-secondary"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        payload={sharePayload}
        exerciseCount={shareMeta.count}
        encodedBytes={shareMeta.bytes}
        error={shareError}
      />
    </div>
  );
}

function ExerciseCard({
  index,
  total,
  exercise,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Exercise {index + 1}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move up"
            className="btn-ghost h-8 w-8 px-0"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move down"
            className="btn-ghost h-8 w-8 px-0"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            aria-label="Remove exercise"
            className="btn-ghost h-8 w-8 px-0 text-red-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`name-${exercise.id}`}>
          Name
        </label>
        <input
          id={`name-${exercise.id}`}
          type="text"
          className="input"
          placeholder="e.g. Push-ups"
          value={exercise.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor={`sets-${exercise.id}`}>
            Sets
          </label>
          <input
            id={`sets-${exercise.id}`}
            type="number"
            min={1}
            inputMode="numeric"
            className="input"
            value={exercise.sets}
            onChange={(e) => onChange({ sets: Math.max(1, Number(e.target.value) || 1) })}
          />
        </div>
        <div>
          <label className="label" htmlFor={`reps-${exercise.id}`}>
            Reps
          </label>
          <input
            id={`reps-${exercise.id}`}
            type="number"
            min={1}
            inputMode="numeric"
            className="input"
            value={exercise.reps}
            onChange={(e) => onChange({ reps: Math.max(1, Number(e.target.value) || 1) })}
          />
        </div>
        <div>
          <label className="label" htmlFor={`rest-${exercise.id}`}>
            Rest (s)
          </label>
          <input
            id={`rest-${exercise.id}`}
            type="number"
            min={0}
            inputMode="numeric"
            className="input"
            value={exercise.restSeconds}
            onChange={(e) =>
              onChange({ restSeconds: Math.max(0, Number(e.target.value) || 0) })
            }
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`instr-${exercise.id}`}>
          Instructions
        </label>
        <textarea
          id={`instr-${exercise.id}`}
          className="textarea"
          placeholder="Cues, form notes, tempo…"
          value={exercise.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
        />
      </div>
    </div>
  );
}
