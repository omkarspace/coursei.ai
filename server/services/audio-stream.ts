import { generateChapterAudio } from "./tts";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export interface StreamChunk {
  type: "audio" | "text" | "done" | "error";
  data: string;
}

/**
 * Generate audio for a question about chapter content using streaming TTS.
 * Returns an async generator that yields audio chunks.
 */
export async function* streamAudioResponse(
  chapterName: string,
  chapterContent: { title: string; explanation: string }[],
  userQuestion: string,
  voiceId: string = "Rachel"
): AsyncGenerator<StreamChunk> {
  // Generate a contextual response based on the chapter content
  const contentSummary = chapterContent
    .map((s) => `${s.title}: ${s.explanation.substring(0, 300)}`)
    .join("\n");

  // Use ElevenLabs streaming TTS
  if (!process.env.ELEVENLABS_API_KEY) {
    yield { type: "error", data: "ElevenLabs API key not configured" };
    return;
  }

  try {
    // Get actual voice ID if name was provided
    let actualVoiceId = voiceId;
    if (!voiceId.includes("_")) {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      });
      if (response.ok) {
        const data = await response.json();
        const voice = data.voices?.find(
          (v: { name: string }) => v.name.toLowerCase() === voiceId.toLowerCase()
        );
        if (voice) actualVoiceId = voice.voice_id;
      }
    }

    // Generate the spoken response text
    const responseText = generateSpokenResponse(chapterName, contentSummary, userQuestion);

    // Stream TTS via ElevenLabs WebSocket
    const ws = new WebSocket(
      `wss://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}/stream-input?model_id=eleven_monolingual_v1`
    );

    const audioChunks: ArrayBuffer[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => {
        // Send the text to synthesize
        ws.send(
          JSON.stringify({
            text: responseText,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          })
        );
        // Signal end of input
        ws.send(JSON.stringify({ text: "" }));
      };

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          const msg = JSON.parse(event.data);
          if (msg.isFinal) {
            ws.close();
            resolve();
          } else if (msg.error) {
            reject(new Error(msg.error));
          }
        } else {
          audioChunks.push(event.data);
        }
      };

      ws.onerror = (error) => reject(error);
      ws.onclose = () => resolve();

      // Timeout after 30 seconds
      setTimeout(() => {
        ws.close();
        resolve();
      }, 30000);
    });

    // Yield audio chunks
    for (const chunk of audioChunks) {
      const base64 = Buffer.from(chunk).toString("base64");
      yield { type: "audio", data: base64 };
    }

    yield { type: "done", data: "" };
  } catch (error) {
    console.error("Audio streaming error:", error);
    // Fallback: generate static audio
    try {
      const fallbackAudio = await generateChapterAudio(
        generateSpokenResponse(chapterName, contentSummary, userQuestion),
        voiceId
      );
      if (fallbackAudio) {
        const base64Data = fallbackAudio.split(",")[1] || "";
        yield { type: "audio", data: base64Data };
      }
      yield { type: "done", data: "" };
    } catch (fallbackError) {
      yield { type: "error", data: "Failed to generate audio" };
    }
  }
}

/**
 * Generate a spoken response based on chapter content and user question
 */
function generateSpokenResponse(
  chapterName: string,
  contentSummary: string,
  userQuestion: string
): string {
  // Simple contextual response generation
  // In production, use Gemini for more intelligent responses
  const questionLower = userQuestion.toLowerCase();

  if (questionLower.includes("what is") || questionLower.includes("define")) {
    return `Great question! In the chapter "${chapterName}", this concept is explained in detail. ${contentSummary.substring(0, 500)}. Would you like me to explain any specific part in more detail?`;
  }

  if (questionLower.includes("how") || questionLower.includes("explain")) {
    return `Let me explain that for you. Based on the chapter "${chapterName}": ${contentSummary.substring(0, 500)}. The key takeaway is to understand the fundamentals before moving to advanced concepts.`;
  }

  if (questionLower.includes("example") || questionLower.includes("code")) {
    return `For practical examples in "${chapterName}", the chapter covers several implementations. ${contentSummary.substring(0, 500)}. I recommend trying the code examples yourself for the best understanding.`;
  }

  return `In the chapter "${chapterName}", we cover: ${contentSummary.substring(0, 500)}. Is there a specific aspect you'd like me to elaborate on?`;
}

/**
 * Generate static audio (non-streaming fallback)
 */
export async function generateStaticAudio(
  chapterName: string,
  chapterContent: { title: string; explanation: string }[],
  userQuestion: string,
  voiceId: string = "Rachel"
): Promise<string | null> {
  const contentSummary = chapterContent
    .map((s) => `${s.title}: ${s.explanation.substring(0, 300)}`)
    .join("\n");

  const responseText = generateSpokenResponse(chapterName, contentSummary, userQuestion);
  const { generateChapterAudio } = await import("./tts");
  return generateChapterAudio(responseText, voiceId);
}
