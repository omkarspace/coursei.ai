import { describe, it, expect } from 'vitest';
import { createEmptyCardState, scheduleCard, type FSRSState } from '@/server/ai/fsrs';

describe('FSRS algorithm', () => {
  it('creates an empty card with due=now, state=new, reps=0', () => {
    const card = createEmptyCardState();
    expect(card.state).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.lastReview).toBeNull();
    expect(new Date(card.due).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('rating Again on a new card leaves state=learning with short interval', () => {
    const before = createEmptyCardState();
    const after = scheduleCard(before, 1, before);
    expect(after.state).toBe(1);
    expect(after.reps).toBe(1);
    expect(after.lapses).toBe(0);
  });

  it('rating Good on a new card promotes to state=learning', () => {
    const before = createEmptyCardState();
    const after = scheduleCard(before, 3, before);
    expect(after.state).toBeGreaterThanOrEqual(1);
    expect(after.reps).toBe(1);
  });

  it('rating Good twice in a row on a new card promotes to state=review', () => {
    let card = createEmptyCardState();
    card = scheduleCard(card, 3, card);
    card = scheduleCard(card, 3, card);
    expect(card.state).toBe(2);
    expect(card.reps).toBe(2);
    expect(card.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it('rating Again on a review card creates a lapse and goes to relearning', () => {
    const card: FSRSState = {
      ...createEmptyCardState(),
      state: 2,
      reps: 5,
      stability: 10,
      difficulty: 5,
      scheduledDays: 10,
      elapsedDays: 10,
    };
    const after = scheduleCard(card, 1, card);
    expect(after.lapses).toBe(1);
    expect(after.state).toBe(3);
  });

  it('rating Easy increases stability more than rating Good', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
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
    const easy = scheduleCard(card, 4, card);
    const good = scheduleCard(card, 3, card);
    expect(easy.stability).toBeGreaterThan(good.stability);
  });
});
