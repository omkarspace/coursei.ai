"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { HiOutlineVideoCamera } from "react-icons/hi2";

export default function TranscriptionInput({ onTranscriptionComplete }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState(null);

  const handleTranscribe = async () => {
    if (!url.trim()) {
      toast.error("Please enter an audio or video URL");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setTranscription(data);
      toast.success("Transcription complete!");
      onTranscriptionComplete?.(data);
    } catch (error) {
      console.error("Transcription failed:", error);
      toast.error("Transcription failed. Please check the URL and try again.");
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
        Paste a YouTube or audio file URL. The content will be transcribed and used to generate a course outline.
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
          {loading ? "Transcribing..." : "Transcribe"}
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
