"use client";
import React, { useState, useRef, useEffect } from "react";
import { generateChapterAudioAction } from "@/app/actions/audio";
import { HiOutlineSpeakerWave, HiPlay, HiPause } from "react-icons/hi2";

export default function AudioPlayer({ courseId, chapterId, chapterContent, chapterName }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState("Rachel");
  const audioRef = useRef(null);

  const generateAudio = async () => {
    setLoading(true);
    try {
      const result = await generateChapterAudioAction(courseId, chapterId, chapterContent, voice);
      if (result.audio) {
        setAudioUrl(result.audio);
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
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
    { id: "Rachel", name: "Rachel (Female)" },
    { id: "Antoni", name: "Antoni (Male)" },
    { id: "Josh", name: "Josh (Deep Male)" },
    { id: "Bella", name: "Bella (Soft Female)" },
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
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button
              onClick={generateAudio}
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
            >
              {loading ? "Generating..." : "Generate Audio"}
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
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => { setAudioUrl(null); setPlaying(false); }}
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
