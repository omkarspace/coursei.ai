"use server";

import { generateChapterAudio, VOICE_OPTIONS } from "@/server/services/tts";
import { transcribeAndWait } from "@/server/services/transcription";

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
