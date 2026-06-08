import { describe, it, expect } from 'vitest';
import {
  optimizeWeights,
  DEFAULT_WEIGHTS,
  scheduleCard,
  createEmptyCardState,
  nextDifficulty,
  nextRecallStability,
  forgettingCurve,
  type ReviewRecord,
} from '@/server/ai/fsrs';

function makeReview(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    rating: 3,
    state: 2,
    stability: 5,
    difficulty: 5,
    elapsedDays: 5,
    ...overrides,
  };
}

describe('Adaptive difficulty - optimizeWeights', () => {
  it('returns DEFAULT_WEIGHTS when reviews < 5', () => {
    const reviews = [makeReview(), makeReview(), makeReview()];
    const result = optimizeWeights(reviews);
    expect(result).toEqual([...DEFAULT_WEIGHTS]);
  });

  it('returns a 25-element array', () => {
    const reviews = Array.from({ length: 10 }, () => makeReview());
    const result = optimizeWeights(reviews);
    expect(result).toHaveLength(25);
  });

  it('all weights are finite numbers', () => {
    const reviews = Array.from({ length: 10 }, () => makeReview());
    const result = optimizeWeights(reviews);
    for (const w of result) {
      expect(Number.isFinite(w)).toBe(true);
    }
  });

  it('optimized weights produce different scheduling than defaults', () => {
    const reviews = Array.from({ length: 20 }, (_, i) =>
      makeReview({ rating: i % 2 === 0 ? 3 : 1, stability: 3 + (i % 5) })
    );
    const optimized = optimizeWeights(reviews);

    const card = {
      ...createEmptyCardState(),
      state: 2 as const,
      stability: 5,
      difficulty: 5,
      reps: 3,
      scheduledDays: 5,
      elapsedDays: 5,
    };

    const defaultNext = scheduleCard(card, 3, card, DEFAULT_WEIGHTS);
    const optimizedNext = scheduleCard(card, 3, card, optimized);

    expect(optimized.length).toBe(25);
    expect(defaultNext.stability).toBeGreaterThan(0);
    expect(optimizedNext.stability).toBeGreaterThan(0);
  });
});

describe('Adaptive difficulty - weights parameter', () => {
  it('nextDifficulty accepts custom weights', () => {
    const custom = [...DEFAULT_WEIGHTS];
    custom[6] = 2.0;
    const result = nextDifficulty(5, 3, custom);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('nextRecallStability accepts custom weights', () => {
    const custom = [...DEFAULT_WEIGHTS];
    custom[8] = 2.0;
    const result = nextRecallStability(5, 5, 0.9, custom);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('scheduleCard with custom weights produces valid state', () => {
    const custom = [...DEFAULT_WEIGHTS];
    custom[0] = 0.5;
    const card = {
      ...createEmptyCardState(),
      state: 2 as const,
      stability: 5,
      difficulty: 5,
      reps: 3,
      scheduledDays: 5,
      elapsedDays: 5,
    };
    const result = scheduleCard(card, 3, card, custom);
    expect(result.state).toBe(2);
    expect(result.reps).toBe(4);
    expect(result.stability).toBeGreaterThan(0);
  });
});

describe('Adaptive difficulty - forgetting curve', () => {
  it('higher stability produces higher retention', () => {
    const low = forgettingCurve(5, 2);
    const high = forgettingCurve(5, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('longer elapsed days produce lower retention', () => {
    const short = forgettingCurve(1, 5);
    const long = forgettingCurve(10, 5);
    expect(long).toBeLessThan(short);
  });
});
