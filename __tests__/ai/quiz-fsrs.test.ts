import { describe, it, expect } from 'vitest';
import {
  createEmptyCardState,
  scheduleCard,
  DAY_MS,
  type FSRSState,
} from '@/server/ai/fsrs';

describe('Quiz FSRS - question as FSRS card', () => {
  it('new quiz question starts in state 0', () => {
    const card = createEmptyCardState();
    expect(card.state).toBe(0);
    expect(card.reps).toBe(0);
  });

  it('correct answer (rating Good) on new question moves to learning', () => {
    const card = createEmptyCardState();
    const next = scheduleCard(card, 3, card);
    expect(next.state).toBeGreaterThanOrEqual(1);
    expect(next.reps).toBe(1);
  });

  it('incorrect answer (rating Again) on new question stays in learning', () => {
    const card = createEmptyCardState();
    const next = scheduleCard(card, 1, card);
    expect(next.state).toBe(1);
    expect(next.reps).toBe(1);
  });

  it('correct answer on review card increases stability', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * DAY_MS).toISOString();
    const card: FSRSState = {
      ...createEmptyCardState(),
      state: 2,
      reps: 3,
      stability: 5,
      difficulty: 5,
      scheduledDays: 5,
      elapsedDays: 5,
      lastReview: fiveDaysAgo,
    };
    const now: FSRSState = {
      ...createEmptyCardState(),
      due: new Date().toISOString(),
    };
    const next = scheduleCard(card, 3, now);
    expect(next.stability).toBeGreaterThan(card.stability);
  });

  it('incorrect answer on review card creates lapse', () => {
    const card: FSRSState = {
      ...createEmptyCardState(),
      state: 2,
      reps: 5,
      stability: 10,
      difficulty: 5,
      scheduledDays: 10,
      elapsedDays: 10,
    };
    const next = scheduleCard(card, 1, card);
    expect(next.lapses).toBe(1);
    expect(next.state).toBe(3);
  });

  it('Easy rating produces longer interval than Good', () => {
    const card: FSRSState = {
      ...createEmptyCardState(),
      state: 2,
      reps: 3,
      stability: 5,
      difficulty: 5,
      scheduledDays: 5,
      elapsedDays: 5,
    };
    const easy = scheduleCard(card, 4, card);
    const good = scheduleCard(card, 3, card);
    expect(easy.scheduledDays).toBeGreaterThanOrEqual(good.scheduledDays);
  });
});
