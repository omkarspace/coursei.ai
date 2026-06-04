const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
}

export interface TTSOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

/**
 * Get available voices from ElevenLabs
 */
export async function getVoices(): Promise<Voice[]> {
  if (!process.env.ELEVENLABS_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    return [];
  }
}

/**
 * Convert text to speech using ElevenLabs
 */
export async function textToSpeech(options: TTSOptions): Promise<ArrayBuffer | null> {
  const {
    text,
    voiceId = 'Rachel', // Default voice
    modelId = 'eleven_monolingual_v1',
    stability = 0.5,
    similarityBoost = 0.75,
  } = options;

  if (!process.env.ELEVENLABS_API_KEY) {
    console.warn('ELEVENLABS_API_KEY not configured');
    return null;
  }

  try {
    // First, get the voice ID if a name was provided
    let actualVoiceId = voiceId;
    if (!voiceId.includes('_')) {
      // Looks like a name, not an ID
      const voices = await getVoices();
      const voice = voices.find((v) => v.name.toLowerCase() === voiceId.toLowerCase());
      if (voice) {
        actualVoiceId = voice.voice_id;
      }
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${actualVoiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    return response.arrayBuffer();
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
}

/**
 * Generate chapter audio and return as base64
 */
export async function generateChapterAudio(text: string, voiceId?: string): Promise<string | null> {
  const audioBuffer = await textToSpeech({ text, voiceId });

  if (!audioBuffer) {
    return null;
  }

  // Convert to base64
  const uint8Array = new Uint8Array(audioBuffer);
  const base64 = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return `data:audio/mpeg;base64,${btoa(base64)}`;
}

/**
 * Available voice options for UI
 */
export const VOICE_OPTIONS = [
  { id: 'Rachel', name: 'Rachel', description: 'Young, warm female voice' },
  { id: 'Domi', name: 'Domi', description: 'Strong, confident female voice' },
  { id: 'Bella', name: 'Bella', description: 'Soft, gentle female voice' },
  { id: 'Antoni', name: 'Antoni', description: 'Well-rounded male voice' },
  { id: 'Elli', name: 'Elli', description: 'Young female voice' },
  { id: 'Josh', name: 'Josh', description: 'Deep male voice' },
  { id: 'Arnold', name: 'Arnold', description: 'Mature male voice' },
  { id: 'Adam', name: 'Adam', description: 'Well-rounded male voice' },
  { id: 'Sam', name: 'Sam', description: 'Raspy male voice' },
];
