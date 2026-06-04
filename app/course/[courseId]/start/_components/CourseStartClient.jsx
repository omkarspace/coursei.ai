'use client';
import React, { useState, useEffect } from 'react';
import ChapterListCard from './ChapterListCard';
import ChapterContent from './ChapterContent';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import {
  markChapterComplete,
  getChapterContentAction,
  getUserProgressAction,
} from '@/app/actions/course';
import dynamic from 'next/dynamic';

const QuizGenerator = dynamic(() => import('@/app/_components/QuizGenerator'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />,
  ssr: false,
});

const Flashcards = dynamic(() => import('@/app/_components/Flashcards'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />,
  ssr: false,
});

const StudyNotes = dynamic(() => import('@/app/_components/StudyNotes'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />,
  ssr: false,
});

import AudioPlayer from '@/app/_components/AudioPlayer';
import WikipediaSidebar from '@/app/_components/WikipediaSidebar';

export default function CourseStartClient({ course, initialChapterContent }) {
  const [selectedChapter, setSelectedChapter] = useState(
    course?.courseOutput?.course?.chapters?.[0]
  );
  const [chapterContent, setChapterContent] = useState(initialChapterContent);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [completedChapters, setCompletedChapters] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  const totalChapters = course?.courseOutput?.course?.chapters?.length || 0;

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const chapters = await getUserProgressAction(course.courseId);
      setCompletedChapters(chapters);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const GetSelectedChapterContent = async (chapterId) => {
    if (!course?.courseId) return;
    setLoadingChapter(true);
    try {
      const result = await getChapterContentAction(course.courseId, chapterId);
      setChapterContent(result);
    } catch (error) {
      console.error('Failed to fetch chapter content:', error);
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleMarkComplete = async () => {
    const chapterIndex = course?.courseOutput?.course?.chapters.indexOf(selectedChapter);
    if (chapterIndex === undefined) return;

    // Optimistic update: immediately reflect completion in UI
    const previousChapters = [...completedChapters];
    if (!completedChapters.includes(chapterIndex)) {
      setCompletedChapters((prev) => [...prev, chapterIndex]);
    }
    setMarkingComplete(true);

    try {
      await markChapterComplete(course.courseId, chapterIndex);
    } catch (error) {
      // Rollback on failure
      setCompletedChapters(previousChapters);
      console.error('Failed to mark chapter as complete:', error);
    } finally {
      setMarkingComplete(false);
    }
  };

  const tabs = [
    { id: 'content', label: 'Content' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'notes', label: 'Study Notes' },
    { id: 'audio', label: 'Audio' },
  ];

  return (
    <div className="min-h-screen dark:bg-gray-950">
      {/* Hamburger Menu (Mobile only) */}
      <div className="md:hidden p-4 flex justify-between items-center z-50 relative dark:bg-gray-900 border-b dark:border-gray-800">
        <h2 className="font-medium text-lg bg-primary text-white px-3 py-1 rounded truncate max-w-[200px]">
          {course?.courseOutput?.course?.name}
        </h2>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-black dark:text-white focus:outline-none"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Overlay when mobile menu is open */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Sidebar for Desktop and mobile menu */}
      <div
        className={`fixed md:w-64 z-30 bg-white dark:bg-gray-900 h-screen border-r dark:border-gray-700 shadow-sm md:block transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="font-medium text-lg truncate dark:text-white">
            {course?.courseOutput?.course?.name}
          </h2>
        </div>
        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {course?.courseOutput?.course?.chapters.map((chapter, index) => (
            <div
              key={index}
              className={`cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 
                ${selectedChapter?.name === chapter?.name ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
              `}
              onClick={() => {
                setSelectedChapter(chapter);
                GetSelectedChapterContent(index);
                setActiveTab('content');
                setIsMenuOpen(false);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedChapter(chapter);
                  GetSelectedChapterContent(index);
                  setActiveTab('content');
                  setIsMenuOpen(false);
                }
              }}
            >
              <ChapterListCard
                chapter={chapter}
                index={index}
                isCompleted={completedChapters.includes(index)}
              />
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        {!loadingProgress && (
          <ProgressIndicator completedChapters={completedChapters} totalChapters={totalChapters} />
        )}
      </div>

      {/* Content section */}
      <div className={`md:ml-64 ${isMenuOpen ? 'ml-0' : ''} transition-all duration-300`}>
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b dark:border-gray-700 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mark Complete Button */}
          {activeTab === 'content' && selectedChapter && (
            <div className="mb-4">
              {completedChapters.includes(
                course?.courseOutput?.course?.chapters.indexOf(selectedChapter)
              ) ? (
                <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Completed
                </span>
              ) : (
                <button
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {markingComplete ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Mark as Complete
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Tab Content */}
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {loadingChapter ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activeTab === 'content' ? (
                <ChapterContent chapter={selectedChapter} content={chapterContent} />
              ) : activeTab === 'quiz' && selectedChapter ? (
                <QuizGenerator
                  courseId={course?.courseId}
                  chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
                  chapterName={selectedChapter?.name}
                  chapterContent={chapterContent}
                />
              ) : activeTab === 'flashcards' && selectedChapter ? (
                <Flashcards
                  courseId={course?.courseId}
                  chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
                  chapterName={selectedChapter?.name}
                  chapterContent={chapterContent}
                />
              ) : activeTab === 'notes' && selectedChapter ? (
                <StudyNotes
                  courseId={course?.courseId}
                  chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
                  chapterName={selectedChapter?.name}
                  chapterContent={chapterContent}
                />
              ) : activeTab === 'audio' && selectedChapter ? (
                <AudioPlayer
                  courseId={course?.courseId}
                  chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
                  chapterContent={chapterContent?.content || []}
                  chapterName={selectedChapter?.name}
                />
              ) : null}
            </div>
            <div className="hidden lg:block w-80 shrink-0">
              <WikipediaSidebar
                chapterName={selectedChapter?.name}
                courseName={course?.courseOutput?.course?.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
