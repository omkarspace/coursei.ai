'use client';
import { forkCourse } from '@/app/actions/course';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CourseForkButton({ courseId }) {
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);

  const handleFork = async () => {
    setIsForking(true);
    try {
      await forkCourse(courseId);
      toast.success('Course forked successfully!');
      router.push(`/dashboard`);
    } catch (error) {
      console.error('Fork failed:', error);
      toast.error('Failed to fork course');
    } finally {
      setIsForking(false);
    }
  };

  return (
    <button
      onClick={handleFork}
      disabled={isForking}
      className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
        />
      </svg>
      {isForking ? 'Forking...' : 'Fork Course'}
    </button>
  );
}
