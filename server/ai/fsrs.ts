import type { CardStateValue, ReviewRating } from '@/server/db/schema';

export type FSRSState = {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardStateValue;
  lastReview: string | null;
};

export const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_WEIGHTS = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544,
  1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567, 0.0,
  1.1986, 0.1464, 0.1045, 0.0824, 0.0831,
] as const;

const RATING: Record<ReviewRating, number> = { 1: 1, 2: 2, 3: 3, 4: 4 };

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function forgettingCurve(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

export function nextInterval(
  s: number,
  elapsedDays: number,
  desiredRetention = 0.9
): number {
  if (s <= 0) return 1;
  return Math.max(
    1,
    Math.round((s / 9) * (Math.pow(desiredRetention, -1 / 9) - 1) - elapsedDays)
  );
}

export function nextDifficulty(d: number, rating: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return clamp(d - w(6) * (rating - 3), 1, 10);
}

export function nextRecallStability(
  d: number,
  s: number,
  r: number,
  weights: readonly number[] = DEFAULT_WEIGHTS
): number {
  const w = (i: number) => weights[i] ?? 0;
  return (
    s *
    (1 +
      Math.exp(w(8)) *
        (11 - d) *
        Math.pow(s, -w(9)) *
        (Math.exp((1 - r) * w(10)) - 1))
  );
}

export function nextForgetStability(
  d: number,
  s: number,
  r: number,
  weights: readonly number[] = DEFAULT_WEIGHTS
): number {
  const w = (i: number) => weights[i] ?? 0;
  return (
    w(11) * Math.pow(d, -w(12)) * (Math.pow(s + 1, w(13)) - 1) * Math.exp((1 - r) * w(14))
  );
}

function initStability(r: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return Math.max(w(0), (w(1) * Math.pow(r, -w(2)) * Math.exp(w(3) * 1)) || w(0));
}

function initDifficulty(r: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return clamp(w(4) - Math.exp(w(5) * 1) * (r - 1) + 1, 1, 10);
}

function shortTermStability(s: number, r: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return s * Math.exp(w(17) * (r - 3 + w(18)));
}

export function createEmptyCardState(): FSRSState {
  return {
    due: new Date().toISOString(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    lastReview: null,
  };
}

export function scheduleCard(
  prev: FSRSState,
  rating: ReviewRating,
  now: FSRSState,
  weights: readonly number[] = DEFAULT_WEIGHTS
): FSRSState {
  const elapsedDays = prev.lastReview
    ? Math.max(
        0,
        Math.round(
          (new Date(now.due).getTime() - new Date(prev.lastReview).getTime()) / DAY_MS
        )
      )
    : 0;
  const r = RATING[rating];

  if (prev.state === 0) {
    const difficulty = prev.difficulty > 0 ? prev.difficulty : initDifficulty(r, weights);
    const stability = prev.stability > 0 ? prev.stability : initStability(r, weights);

    if (rating === 1) {
      return {
        ...prev,
        difficulty,
        stability,
        state: 1,
        reps: prev.reps + 1,
        lastReview: now.due,
        due: new Date(Date.now() + 60_000).toISOString(),
        elapsedDays: 0,
        scheduledDays: 0,
      };
    }
    if (rating === 2 || rating === 3) {
      const minutes = rating === 2 ? 5 : 10;
      return {
        ...prev,
        difficulty,
        stability,
        state: 1,
        reps: prev.reps + 1,
        lastReview: now.due,
        due: new Date(Date.now() + minutes * 60_000).toISOString(),
        elapsedDays: 0,
        scheduledDays: 0,
      };
    }
    const s = shortTermStability(stability, r, weights);
    return {
      ...prev,
      difficulty,
      stability: s,
      state: 2,
      reps: prev.reps + 1,
      lastReview: now.due,
      scheduledDays: nextInterval(s, 0),
      due: new Date(Date.now() + nextInterval(s, 0) * DAY_MS).toISOString(),
      elapsedDays: 0,
    };
  }

  if (prev.state === 1 || prev.state === 3) {
    if (rating === 1) {
      return {
        ...prev,
        state: prev.state,
        reps: prev.reps + 1,
        lapses: prev.state === 3 ? prev.lapses + 1 : prev.lapses,
        lastReview: now.due,
        due: new Date(Date.now() + 60_000).toISOString(),
      };
    }
    if (rating === 2 || rating === 3) {
      const s = shortTermStability(prev.stability || 1, r, weights);
      return {
        ...prev,
        stability: s,
        state: 2,
        reps: prev.reps + 1,
        lastReview: now.due,
        scheduledDays: nextInterval(s, 0),
        due: new Date(Date.now() + nextInterval(s, 0) * DAY_MS).toISOString(),
        elapsedDays: 0,
      };
    }
    const s = shortTermStability(prev.stability || 1, r, weights) * 1.3;
    return {
      ...prev,
      stability: s,
      state: 2,
      reps: prev.reps + 1,
      lastReview: now.due,
      scheduledDays: nextInterval(s, 0),
      due: new Date(Date.now() + nextInterval(s, 0) * DAY_MS).toISOString(),
      elapsedDays: 0,
    };
  }

  const recall = forgettingCurve(elapsedDays, prev.stability || 1);
  if (rating === 1) {
    const s = nextForgetStability(prev.difficulty, prev.stability, recall, weights);
    return {
      ...prev,
      stability: s,
      state: 3,
      lapses: prev.lapses + 1,
      reps: prev.reps + 1,
      lastReview: now.due,
      due: new Date(Date.now() + 10 * 60_000).toISOString(),
      scheduledDays: 0,
      elapsedDays,
    };
  }
  const newDifficulty = nextDifficulty(prev.difficulty, r, weights);
  const newStability = nextRecallStability(newDifficulty, prev.stability, recall, weights);
  const interval = nextInterval(newStability, elapsedDays);
  return {
    ...prev,
    stability: newStability,
    difficulty: newDifficulty,
    state: 2,
    reps: prev.reps + 1,
    lastReview: now.due,
    scheduledDays: interval,
    due: new Date(Date.now() + interval * DAY_MS).toISOString(),
    elapsedDays,
  };
}

export interface ReviewRecord {
  rating: ReviewRating;
  state: CardStateValue;
  stability: number;
  difficulty: number;
  elapsedDays: number;
}

function computeRmse(weights: readonly number[], reviews: ReviewRecord[]): number {
  let sumSquaredError = 0;
  for (const review of reviews) {
    const recall = forgettingCurve(review.elapsedDays, review.stability);
    let predictedRetention: number;
    if (review.state === 0 || review.state === 1 || review.state === 3) {
      predictedRetention = review.rating >= 3 ? 0.9 : 0.3;
    } else {
      const newD = nextDifficulty(review.difficulty, review.rating, weights);
      const newS = nextRecallStability(newD, review.stability, recall, weights);
      predictedRetention = Math.min(1, newS / (review.stability || 1));
    }
    const actualRetention = review.rating >= 3 ? 1 : 0;
    sumSquaredError += Math.pow(predictedRetention - actualRetention, 2);
  }
  return Math.sqrt(sumSquaredError / reviews.length);
}

export function optimizeWeights(reviews: ReviewRecord[]): number[] {
  if (reviews.length < 5) return [...DEFAULT_WEIGHTS];

  let bestWeights = [...DEFAULT_WEIGHTS];
  let bestRmse = computeRmse(bestWeights, reviews);

  const weightIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  for (const idx of weightIndices) {
    const original = bestWeights[idx]!;
    const step = original * 0.1 || 0.01;

    for (const delta of [-step, step]) {
      const candidate = [...bestWeights];
      candidate[idx] = original + delta;
      const rmse = computeRmse(candidate, reviews);
      if (rmse < bestRmse) {
        bestRmse = rmse;
        bestWeights = candidate;
      }
    }
  }

  return bestWeights;
}
