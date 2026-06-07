'use client';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HiPaperAirplane } from 'react-icons/hi2';
import { useEffect, useRef } from 'react';

export default function CourseChat({ courseId, courseName }) {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: `/api/course/${courseId}/chat`,
  });

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-2">
        {messages.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Ask anything about <span className="font-medium">{courseName}</span>. Try "Explain
              chapter 2 in simpler terms" or "Quiz me on what I've learned so far".
            </CardContent>
          </Card>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {m.parts
                ?.filter((p) => p.type === 'text')
                .map((p, i) => (
                  <span key={i} className="whitespace-pre-wrap">
                    {p.text}
                  </span>
                ))}
            </div>
          </div>
        ))}
        {status === 'submitted' && (
          <div className="text-xs text-muted-foreground px-2">Thinking…</div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 p-2">
            Failed to get a response. Please try again.
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about this course…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={status !== 'ready'}
        />
        <Button type="submit" disabled={status !== 'ready' || !input?.trim()}>
          <HiPaperAirplane className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
