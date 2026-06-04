import { CourseStatus } from '@/server/db/schema';

// Course types
export interface CourseData {
  courseId: string;
  name: string;
  category: string;
  level: string;
  includeVideo: string;
  courseOutput: CourseOutput;
  createdBy: string;
  userName: string | null;
  userProfileImage: string | null;
  courseBanner: string | null;
  publish: boolean | null;
  status: CourseStatus;
  progress: number;
  currentStep: string | null;
  generationError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseOutput {
  course: {
    name: string;
    description: string;
    noOfChapters: number;
    duration: string;
    chapters: Chapter[];
  };
}

export interface Chapter {
  name: string;
  about: string;
  duration: string;
}

export interface ChapterContent {
  title: string;
  explanation: string;
  code: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudyNotes {
  summary: string;
  keyPoints: string[];
  importantTerms: { term: string; definition: string }[];
}

// API Response types
export interface SearchResult {
  courseId: string;
  name: string;
  category: string;
  level: string;
  courseBanner: string | null;
  createdBy: string;
  userName: string | null;
  publish: boolean | null;
  score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  source: 'vector' | 'text' | 'unknown';
}

export interface CourseStatusResponse {
  status: CourseStatus;
  progress: number;
  currentStep: string | null;
  generationError: string | null;
}

// Component prop types
export interface CourseCardProps {
  course: CourseData;
  refreshData?: () => void;
  displayUser?: boolean;
}

export interface ProgressIndicatorProps {
  completedChapters: number[];
  totalChapters: number;
  className?: string;
}

export interface VerifiedBadgeProps {
  verified: boolean;
  sourceCount?: number;
  className?: string;
}
