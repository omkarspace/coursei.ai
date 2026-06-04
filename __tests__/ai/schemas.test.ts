import { describe, it, expect } from 'vitest';
import {
  CourseLayoutSchema,
  ChapterContentSchema,
  QuizSchema,
  FlashcardsSchema,
  StudyNotesSchema,
} from '@/server/ai/schemas';

describe('CourseLayoutSchema', () => {
  it('validates a complete course layout', () => {
    const valid = {
      course: {
        name: 'Python Basics',
        description: 'Learn Python from scratch',
        noOfChapters: 5,
        duration: '4 weeks',
        chapters: [
          {
            name: 'Intro',
            about: 'Getting started',
            duration: '1 hour',
          },
        ],
      },
    };
    expect(CourseLayoutSchema.parse(valid)).toEqual(valid);
  });

  it('rejects missing required fields', () => {
    const invalid = { course: { name: 'Test' } };
    expect(() => CourseLayoutSchema.parse(invalid)).toThrow();
  });
});

describe('QuizSchema', () => {
  it('validates a quiz with questions', () => {
    const valid = {
      questions: [
        {
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          explanation: 'Basic math',
        },
      ],
    };
    expect(QuizSchema.parse(valid)).toEqual(valid);
  });

  it('rejects correctAnswer outside 0-3 range', () => {
    const invalid = {
      questions: [
        {
          question: 'Test?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 5,
          explanation: 'Test',
        },
      ],
    };
    expect(() => QuizSchema.parse(invalid)).toThrow();
  });

  it('rejects options array not length 4', () => {
    const invalid = {
      questions: [
        {
          question: 'Test?',
          options: ['A', 'B'],
          correctAnswer: 0,
          explanation: 'Test',
        },
      ],
    };
    expect(() => QuizSchema.parse(invalid)).toThrow();
  });
});

describe('FlashcardsSchema', () => {
  it('validates flashcards', () => {
    const valid = {
      cards: [{ front: 'What is JS?', back: 'A programming language' }],
    };
    expect(FlashcardsSchema.parse(valid)).toEqual(valid);
  });

  it('rejects flashcard missing back field', () => {
    const invalid = {
      cards: [{ front: 'What is JS?' }],
    };
    expect(() => FlashcardsSchema.parse(invalid)).toThrow();
  });
});

describe('StudyNotesSchema', () => {
  it('validates study notes', () => {
    const valid = {
      summary: 'Overview text',
      keyPoints: ['Point 1', 'Point 2'],
      importantTerms: [{ term: 'Variable', definition: 'A named storage' }],
    };
    expect(StudyNotesSchema.parse(valid)).toEqual(valid);
  });

  it('rejects empty keyPoints', () => {
    const invalid = {
      summary: 'Text',
      keyPoints: [],
      importantTerms: [],
    };
    expect(() => StudyNotesSchema.parse(invalid)).toThrow();
  });
});

describe('ChapterContentSchema', () => {
  it('validates chapter content array', () => {
    const valid = [
      {
        title: 'Section 1',
        explanation: 'Content here',
        code: '',
      },
    ];
    expect(ChapterContentSchema.parse(valid)).toEqual(valid);
  });

  it('defaults code to empty string', () => {
    const input = [{ title: 'S1', explanation: 'Text' }];
    const result = ChapterContentSchema.parse(input);
    const first = result[0];
    expect(first).toBeDefined();
    expect(first!.code).toBe('');
  });
});
