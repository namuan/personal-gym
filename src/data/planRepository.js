import { db } from './db.js';
import { normaliseExercise, makeBlankExercise, newId } from './planModel.js';

const ACTIVE_PLAN_ID = 'active';

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} name
 * @property {number} sets
 * @property {number} reps
 * @property {string} instructions
 * @property {number} restSeconds
 * @property {number} order
 */

/**
 * @typedef {Object} WorkoutPlan
 * @property {'active'} id
 * @property {Exercise[]} exercises
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * Returns the single active plan, or null if none has been saved yet.
 */
export async function getActivePlan() {
  const plan = await db.plans.get(ACTIVE_PLAN_ID);
  if (!plan) return null;
  return { ...plan, exercises: plan.exercises ?? [] };
}

/**
 * Saves the plan. If no plan exists, creates one; otherwise updates.
 * Normalises exercises with ids and a stable order.
 */
export async function savePlan(planInput) {
  const now = Date.now();
  const existing = await db.plans.get(ACTIVE_PLAN_ID);

  const exercises = (planInput.exercises ?? []).map((e, i) => ({
    ...normaliseExercise(e),
    order: i,
  }));

  const plan = {
    id: ACTIVE_PLAN_ID,
    exercises,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.plans.put(plan);
  return plan;
}

/**
 * Removes the active plan. The plan editor will start from a blank slate
 * after this; history of completed sessions is untouched.
 */
export async function clearPlan() {
  await db.plans.delete(ACTIVE_PLAN_ID);
}

export { newId, makeBlankExercise };
