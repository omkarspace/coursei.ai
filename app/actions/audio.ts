"use server";

import { generateChapterAudio, VOICE_OPTIONS } from "@/server/services/tts";
import { transcribeAndWait } from "@/server/services/transcription";
import { generateStaticAudio } from "@/server/services/audio-stream";

interface ChapterSection {
  title: string;
  explanation: string;
}

export async function generateChapterAudioAction(
  courseId: string,
  chapterId: number,
  chapterContent: ChapterSection[],
  voiceId?: string
) {
  const fullText = chapterContent
    .map((section) => `${section.title}. ${section.explanation}`)
    .join("\n\n");
  const truncatedText = fullText.substring(0, 5000);
  const audioBase64 = await generateChapterAudio(truncatedText, voiceId);
  return { audio: audioBase64 };
}

export async function getVoiceOptions() {
  return VOICE_OPTIONS;
}

export async function transcribeAudioAction(audioUrl: string) {
  const result = await transcribeAndWait(audioUrl);
  return result;
}

/**
 * Generate audio response to a question about chapter content
 */
export async function generateAudioResponseAction(
  chapterName: string,
  chapterContent: ChapterSection[],
  userQuestion: string,
  voiceId?: string
) {
  const audioBase64 = await generateStaticAudio(
    chapterName,
    chapterContent,
    userQuestion,
    voiceId || "Rachel"
  );
  return { audio: audioBase64 };
}
