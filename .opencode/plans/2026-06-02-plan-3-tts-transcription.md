# Plan 3: TTS Audio & Transcription Features

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add text-to-speech audio playback for chapter content and a "Generate Course from Video/Audio" feature using AssemblyAI transcription.

**Architecture:** Create a server action for TTS that returns base64 audio, add an audio player tab to the learning view. Create a transcription endpoint and a new wizard step for generating courses from uploaded audio/video URLs.

**Tech Stack:** Next.js 15, ElevenLabs TTS, AssemblyAI, React, Tailwind CSS

---

## File Structure

| Action | File                                                            | Purpose                                      |
| ------ | --------------------------------------------------------------- | -------------------------------------------- |
| Create | `app/actions/audio.ts`                                          | Server actions for TTS and transcription     |
| Create | `app/_components/AudioPlayer.jsx`                               | Audio player component for chapter TTS       |
| Create | `app/_components/TranscriptionInput.jsx`                        | Input for audio/video URL to generate course |
| Modify | `app/course/[courseId]/start/_components/CourseStartClient.jsx` | Add Audio tab                                |
| Modify | `app/create-course/page.jsx`                                    | Add "From Audio/Video" option                |
| Create | `app/api/transcribe/route.ts`                                   | API endpoint for transcription               |

---

### Task 1: Create Audio Server Actions

**Files:**

- Create: `app/actions/audio.ts`

- [ ] **Step 1: Create audio server actions**

```typescript
'use server';

import { generateChapterAudio, VOICE_OPTIONS } from '@/server/services/tts';
import { transcribeAndWait } from '@/server/services/transcription';

export async function generateChapterAudioAction(
  courseId: string,
  chapterId: number,
  chapterContent: any[],
  voiceId?: string
) {
  // Combine all content sections into a single text
  const fullText = chapterContent
    .map((section) => `${section.title}. ${section.explanation}`)
    .join('\n\n');

  // Limit to ~5000 chars to avoid TTS limits
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
```

---

### Task 2: Create Audio Player Component

**Files:**

- Create: `app/_components/AudioPlayer.jsx`

- [ ] **Step 1: Create AudioPlayer component**

```jsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { generateChapterAudioAction } from '@/app/actions/audio';
import { HiOutlineSpeakerWave, HiPlay, HiPause } from 'react-icons/hi2';

export default function AudioPlayer({ courseId, chapterId, chapterContent, chapterName }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState('Rachel');
  const audioRef = useRef(null);

  const generateAudio = async () => {
    setLoading(true);
    try {
      const result = await generateChapterAudioAction(courseId, chapterId, chapterContent, voice);
      if (result.audio) {
        setAudioUrl(result.audio);
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [playing, audioUrl]);

  const VOICES = [
    { id: 'Rachel', name: 'Rachel (Female)' },
    { id: 'Antoni', name: 'Antoni (Male)' },
    { id: 'Josh', name: 'Josh (Deep Male)' },
    { id: 'Bella', name: 'Bella (Soft Female)' },
  ];

  return (
    <div className="border dark:border-gray-700 rounded-lg p-6 mt-4 dark:bg-gray-900">
      <div className="flex items-center gap-3 mb-4">
        <HiOutlineSpeakerWave className="h-6 w-6 text-primary" />
        <h3 className="font-medium text-lg dark:text-white">Audio Narration</h3>
      </div>

      {!audioUrl ? (
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Generate an AI voice narration for this chapter.
          </p>
          <div className="flex items-center gap-3">
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              onClick={generateAudio}
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
            >
              {loading ? 'Generating...' : 'Generate Audio'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setPlaying(false)}
            className="w-full"
            controls
          />
          <div className="flex gap-2">
            <button
              onClick={() => setPlaying(!playing)}
              className="inline-flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-md text-sm"
            >
              {playing ? <HiPause className="h-4 w-4" /> : <HiPlay className="h-4 w-4" />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => {
                setAudioUrl(null);
                setPlaying(false);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 3: Add Audio Tab to Learning View

**Files:**

- Modify: `app/course/[courseId]/start/_components/CourseStartClient.jsx`

- [ ] **Step 1: Add AudioPlayer import**

```jsx
import AudioPlayer from '@/app/_components/AudioPlayer';
```

- [ ] **Step 2: Add Audio tab to tabs array**

Add to the tabs array:

```jsx
{ id: "audio", label: "Audio" },
```

- [ ] **Step 3: Add Audio tab content**

Add after the StudyNotes tab content:

```jsx
) : activeTab === "audio" && selectedChapter ? (
  <AudioPlayer
    courseId={course?.courseId}
    chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
    chapterContent={chapterContent?.content || []}
    chapterName={selectedChapter?.name}
  />
) : null}
```

---

### Task 4: Create Transcription API Endpoint

**Files:**

- Create: `app/api/transcribe/route.ts`

- [ ] **Step 1: Create transcription API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { transcribeAndWait } from '@/server/services/transcription';

export async function POST(req: NextRequest) {
  try {
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      return NextResponse.json({ error: 'audioUrl is required' }, { status: 400 });
    }

    const result = await transcribeAndWait(audioUrl);

    return NextResponse.json({
      text: result.text,
      chapters: result.chapters,
      status: result.status,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
```

---

### Task 5: Create Transcription Input Component

**Files:**

- Create: `app/_components/TranscriptionInput.jsx`

- [ ] **Step 1: Create TranscriptionInput component**

```jsx
'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { HiOutlineVideoCamera, HiOutlineMusicalNote } from 'react-icons/hi2';

export default function TranscriptionInput({ onTranscriptionComplete }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState(null);

  const handleTranscribe = async () => {
    if (!url.trim()) {
      toast.error('Please enter an audio or video URL');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setTranscription(data);
      toast.success('Transcription complete!');
      onTranscriptionComplete?.(data);
    } catch (error) {
      console.error('Transcription failed:', error);
      toast.error('Transcription failed. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg p-6 dark:bg-gray-900">
      <div className="flex items-center gap-3 mb-4">
        <HiOutlineVideoCamera className="h-6 w-6 text-primary" />
        <h3 className="font-medium text-lg dark:text-white">Generate Course from Audio/Video</h3>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
        Paste a YouTube or audio file URL. The content will be transcribed and used to generate a
        course outline.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or audio URL"
          className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        />
        <button
          onClick={handleTranscribe}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm whitespace-nowrap"
        >
          {loading ? 'Transcribing...' : 'Transcribe'}
        </button>
      </div>
      {transcription && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-medium mb-2">Transcription Preview:</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-h-40 overflow-y-auto">
            {transcription.text?.substring(0, 500)}...
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### Task 6: Add "From Audio/Video" Option to Create Course Wizard

**Files:**

- Modify: `app/create-course/page.jsx`

- [ ] **Step 1: Add TranscriptionInput import**

```jsx
import TranscriptionInput from '@/app/_components/TranscriptionInput';
```

- [ ] **Step 2: Add creation mode state**

```jsx
const [creationMode, setCreationMode] = useState('manual'); // "manual" or "transcription"
```

- [ ] **Step 3: Add mode selector UI**

Before the category selection, add:

```jsx
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setCreationMode('manual')}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      creationMode === 'manual'
        ? 'bg-primary text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`}
  >
    Manual Creation
  </button>
  <button
    onClick={() => setCreationMode('transcription')}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      creationMode === 'transcription'
        ? 'bg-primary text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`}
  >
    From Audio/Video
  </button>
</div>
```

- [ ] **Step 4: Conditionally show transcription or manual form**

Wrap existing form in:

```jsx
{creationMode === "manual" && (
  // existing form
)}
```

Add after:

```jsx
{
  creationMode === 'transcription' && (
    <TranscriptionInput
      onTranscriptionComplete={(data) => {
        // Pre-fill topic from transcription
        setUserCourseInput((prev) => ({
          ...prev,
          topic: data.chapters?.[0]?.headline || 'Transcribed Course',
        }));
      }}
    />
  );
}
```

---

### Task 7: Verify and Commit

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 2: Lint check**

Run: `npm run lint 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add TTS audio player and transcription-based course creation"
```

---

## Summary

After this plan:

1. Users can **listen to chapter content** via AI-generated audio (ElevenLabs TTS)
2. Voice selection (Rachel, Antoni, Josh, Bella)
3. Users can **generate courses from YouTube/audio URLs** via AssemblyAI transcription
4. Transcription preview before course generation
5. New "Audio" tab in the learning view
