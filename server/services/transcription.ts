import { AssemblyAI } from "assemblyai";

let client: AssemblyAI | null = null;

function getClient(): AssemblyAI {
  if (!client) {
    if (!process.env.ASSEMBLYAI_API_KEY) {
      throw new Error("ASSEMBLYAI_API_KEY is not configured");
    }
    client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
  }
  return client;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  status: "queued" | "processing" | "completed" | "error";
  chapters?: Array<{
    start: number;
    end: number;
    headline: string;
    summary: string;
  }>;
  error?: string;
}

export interface TranscriptionOptions {
  audioUrl: string;
  autoChapters?: boolean;
  autoHighlights?: boolean;
  speakerLabels?: boolean;
}

/**
 * Transcribe audio from a URL using AssemblyAI
 */
export async function transcribeAudio(
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const { audioUrl, autoChapters = true, autoHighlights = true, speakerLabels = false } = options;

  const assembly = getClient();

  try {
    const transcript = await assembly.transcripts.transcribe({
      audio: audioUrl,
      auto_chapters: autoChapters,
      auto_highlights: autoHighlights,
      speaker_labels: speakerLabels,
    });

    return {
      id: transcript.id,
      text: transcript.text || "",
      status: transcript.status as TranscriptionResult["status"],
      chapters: transcript.chapters?.map((ch) => ({
        start: ch.start,
        end: ch.end,
        headline: ch.headline,
        summary: ch.summary,
      })),
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

/**
 * Poll for transcription status until complete
 */
export async function waitForTranscription(
  transcriptId: string,
  maxPolls = 60,
  pollIntervalMs = 2000
): Promise<TranscriptionResult> {
  const assembly = getClient();

  for (let i = 0; i < maxPolls; i++) {
    const transcript = await assembly.transcripts.get(transcriptId);

    if (transcript.status === "completed") {
      return {
        id: transcript.id,
        text: transcript.text || "",
        status: "completed",
        chapters: transcript.chapters?.map((ch) => ({
          start: ch.start,
          end: ch.end,
          headline: ch.headline,
          summary: ch.summary,
        })),
      };
    }

    if (transcript.status === "error") {
      return {
        id: transcript.id,
        text: "",
        status: "error",
        error: transcript.error || "Transcription failed",
      };
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    id: transcriptId,
    text: "",
    status: "error",
    error: "Transcription timed out",
  };
}

/**
 * Transcribe audio and wait for completion
 */
export async function transcribeAndWait(
  audioUrl: string
): Promise<TranscriptionResult> {
  const result = await transcribeAudio({ audioUrl });

  if (result.status === "completed") {
    return result;
  }

  return waitForTranscription(result.id);
}
