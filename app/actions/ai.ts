"use server";

import { generateQuiz, generateFlashcards, generateStudyNotes, generateCourseLayout } from "@/server/ai/generate";
import { generateCourseBanner } from "@/server/services/fal";

export async function generateQuizAction(chapterName: string, contentSummary: string) {
  return generateQuiz(chapterName, contentSummary);
}

export async function generateFlashcardsAction(chapterName: string, contentSummary: string) {
  return generateFlashcards(chapterName, contentSummary);
}

export async function generateStudyNotesAction(chapterName: string, contentSummary: string) {
  return generateStudyNotes(chapterName, contentSummary);
}

export async function generateCourseLayoutAction(
  category: string, topic: string, level: string, duration: string, numChapters: number
) {
  return generateCourseLayout(category, topic, level, duration, numChapters);
}

export async function generateCourseBannerAction(courseName: string, category: string) {
  return generateCourseBanner({ courseName, category, style: "modern" });
}
