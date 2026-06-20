import { describe, it, expect } from 'vitest';
import {
  normaliseExercise,
  makeBlankExercise,
} from '../data/planModel.js';

describe('plan model helpers', () => {
  it('makeBlankExercise returns sensible defaults', () => {
    const ex = makeBlankExercise();
    expect(ex.name).toBe('');
    expect(ex.sets).toBeGreaterThanOrEqual(1);
    expect(ex.reps).toBeGreaterThanOrEqual(1);
    expect(ex.restSeconds).toBeGreaterThanOrEqual(0);
  });

  it('normaliseExercise coerces numeric fields and trims strings', () => {
    const ex = normaliseExercise({ name: '  Push-ups  ', sets: '3', reps: '8', restSeconds: '45' });
    expect(ex.name).toBe('Push-ups');
    expect(ex.sets).toBe(3);
    expect(ex.reps).toBe(8);
    expect(ex.restSeconds).toBe(45);
  });

  it('normaliseExercise clamps invalid numbers to safe minimums', () => {
    const ex = normaliseExercise({ name: 'Squats', sets: 0, reps: -2, restSeconds: -1 });
    expect(ex.sets).toBe(1);
    expect(ex.reps).toBe(1);
    expect(ex.restSeconds).toBe(0);
  });
});
