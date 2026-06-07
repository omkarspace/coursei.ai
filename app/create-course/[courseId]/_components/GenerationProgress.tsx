'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GenerationStatus {
  status: 'draft' | 'generating_outline' | 'generating_chapters' | 'complete' | 'failed';
  progress: number;
  currentStep: string | null;
  generationError: string | null;
}

interface GenerationProgressProps {
  courseId: string;
  onComplete?: () => void;
}

export function GenerationProgress({ courseId, onComplete }: GenerationProgressProps) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [delay, setDelay] = useState(2000);
  const router = useRouter();

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/course/${courseId}/status`);
      if (!res.ok) throw new Error('Failed to fetch status');

      const data = await res.json();
      setStatus(data);

      if (data.status === 'complete') {
        onComplete?.();
        router.refresh();
        return;
      }

      if (data.status === 'failed') {
        return;
      }

      setDelay((prev) => Math.min(prev + 1000, 6000));
    } catch {
      setDelay(5000);
    }
  }, [courseId, onComplete, router]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      await checkStatus();
      timeoutId = setTimeout(poll, delay);
    };

    timeoutId = setTimeout(poll, delay);

    return () => clearTimeout(timeoutId);
  }, [delay, checkStatus]);

  if (!status || status.status === 'draft') {
    return null;
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'generating_outline':
      case 'generating_chapters':
        return 'text-blue-600 dark:text-blue-400';
      case 'complete':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'generating_outline':
      case 'generating_chapters':
        return (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'complete':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const isFailed = status.status === 'failed';

  return (
    <Card
      className={`my-6 shadow-lg border-gray-200 dark:border-gray-700 ${
        isFailed ? 'border-red-300 dark:border-red-800' : ''
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={getStatusColor()}>{getStatusIcon()}</div>
          <h3 className={`font-semibold ${getStatusColor()}`}>
            {status.status === 'generating_outline' && 'Generating Course Outline...'}
            {status.status === 'generating_chapters' && 'Generating Chapter Content...'}
            {status.status === 'complete' && 'Course Generation Complete!'}
            {status.status === 'failed' && 'Generation Failed'}
          </h3>
        </div>

        {status.currentStep && !isFailed && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{status.currentStep}</p>
        )}

        {!isFailed && <Progress value={status.progress} className="h-2" />}

        {!isFailed && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{status.progress}% complete</p>
        )}

        {isFailed && (
          <div
            role="alert"
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Something went wrong while generating this course
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {status.generationError ||
                    'An unexpected error occurred. Please try generating the course again.'}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/create-course')}
                    className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
