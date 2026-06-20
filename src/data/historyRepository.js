import { db } from './db.js';
import { newId } from './planRepository.js';

/**
 * @typedef {Object} CompletedSet
 * @property {number} exerciseIndex
 * @property {string} exerciseName
 * @property {number} setNumber
 * @property {number} repsCompleted
 * @property {number} restTaken
 */

/**
 * @typedef {Object} WorkoutSession
 * @property {string} id
 * @property {number} date
 * @property {Array} planSnapshot
 * @property {CompletedSet[]} completedSets
 * @property {number} totalDuration - in seconds
 */

/**
 * Persists a completed workout session. Returns the saved record.
 */
export async function addSession(sessionInput) {
  const record = {
    id: sessionInput.id ?? newId(),
    date: sessionInput.date ?? Date.now(),
    planSnapshot: sessionInput.planSnapshot ?? [],
    completedSets: sessionInput.completedSets ?? [],
    totalDuration: Math.max(0, Number(sessionInput.totalDuration) || 0),
  };
  await db.sessions.put(record);
  return record;
}

/**
 * Returns all completed sessions, sorted newest first.
 */
export async function listSessions() {
  const all = await db.sessions.toArray();
  return all.sort((a, b) => b.date - a.date);
}

/**
 * Returns a single session by id, or undefined.
 */
export async function getSession(id) {
  return db.sessions.get(id);
}

/**
 * Deletes a single session by id. Used by the history "delete" affordance.
 */
export async function deleteSession(id) {
  await db.sessions.delete(id);
}
