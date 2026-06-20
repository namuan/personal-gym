import Dexie from 'dexie';

/**
 * Single Dexie database for the app. Two object stores:
 *   - plans: holds the single active workout plan (id = 'active')
 *   - sessions: completed workout sessions, keyed by id, indexed by date
 */
export const db = new Dexie('personal-gym');

db.version(1).stores({
  plans: '&id, updatedAt',
  sessions: '&id, date',
});
