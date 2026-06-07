'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  generateChapterAudioAction,
  generateAudioResponseAction,
  getVoiceOptions,
} from '@/app/actions/audio';
import {
  HiOutlineSpeakerWave,
  HiPlay,
  HiPause,
  HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AudioPlayer({ courseId, chapterId, chapterContent, chapterName }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState('Rachel');
  const [voices, setVoices] = useState([]);
  const [mode, setMode] = useState('listen'); // "listen" | "chat"
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    getVoiceOptions()
      .then((list) => {
        if (mounted) setVoices(list || []);
      })
      .catch((err) => {
        console.error('Failed to load voice options:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const question = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', content: question }]);
    setChatLoading(true);

    try {
      const result = await generateAudioResponseAction(
        chapterName,
        chapterContent,
        question,
        voice
      );

      if (result.audio) {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: 'Audio response generated', audio: result.audio },
        ]);
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't generate a response." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const VOICES = voices.length > 0 ? voices : null;

  const renderVoiceOptions = () => {
    if (!VOICES) {
      return <option value="Rachel">Rachel</option>;
    }
    return VOICES.map((v) => (
      <option key={v.id} value={v.id} title={v.description}>
        {v.name}
      </option>
    ));
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
          <HiOutlineSpeakerWave className="h-6 w-6 text-primary" />
          {mode === 'listen' ? 'Audio Narration' : 'Voice Tutor'}
        </CardTitle>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ml-auto">
          <button
            onClick={() => setMode('listen')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === 'listen'
                ? 'bg-white dark:bg-gray-700 shadow text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Listen
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
              mode === 'chat'
                ? 'bg-white dark:bg-gray-700 shadow text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
            Chat
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'listen' ? (
          !audioUrl ? (
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
                  {renderVoiceOptions()}
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
          )
        ) : (
          <div className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {chatHistory.length === 0 && (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center mt-8">
                  Ask a question about "{chapterName}"
                </p>
              )}
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <p>{msg.content}</p>
                    {msg.audio && <audio src={msg.audio} controls className="mt-2 w-full" />}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this chapter..."
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                {chatLoading ? '...' : 'Ask'}
              </button>
            </form>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Voice:</span>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="h-7 rounded border border-input bg-transparent px-2 text-xs"
              >
                {renderVoiceOptions()}
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
