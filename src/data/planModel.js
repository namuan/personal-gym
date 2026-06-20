/**
 * Pure helpers for normalising exercise / plan data. Lives in its own
 * module so it can be unit-tested without pulling in Dexie.
 */

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeBlankExercise() {
  return {
    id: newId(),
    name: '',
    sets: 3,
    reps: 10,
    instructions: '',
    restSeconds: 60,
  };
}

/**
 * Coerces user-entered form values into the shape stored in IndexedDB.
 * - Trims strings.
 * - Clamps sets/reps to >= 1.
 * - Clamps restSeconds to >= 0.
 */
export function normaliseExercise(input) {
  return {
    id: input.id ?? newId(),
    name: String(input.name ?? '').trim(),
    sets: Math.max(1, Number(input.sets) || 1),
    reps: Math.max(1, Number(input.reps) || 1),
    instructions: String(input.instructions ?? '').trim(),
    restSeconds: Math.max(0, Number(input.restSeconds) || 0),
    order: input.order ?? 0,
  };
}
