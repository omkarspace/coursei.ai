export interface ChapterOutline {
  name: string;
  about: string;
  duration: string;
  learningObjectives: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
}

export interface CurriculumDesign {
  course: {
    name: string;
    description: string;
    noOfChapters: number;
    duration: string;
    chapters: ChapterOutline[];
    learningObjectives: string[];
  };
}

export interface FactCheckResult {
  verified: boolean;
  citations: { claim: string; source: string; reliable: boolean }[];
  flaggedIssues: string[];
  adjustedChapters: ChapterOutline[];
}

export interface PedagogicalReview {
  finalChapters: ChapterOutline[];
  quizPrompts: { chapterName: string; suggestedTopics: string[] }[];
  codeBlockPlaceholders: { chapterName: string; language: string; description: string }[];
  difficultyAdjustments: { chapterName: string; originalDifficulty: string; suggestedDifficulty: string; reason: string }[];
}
