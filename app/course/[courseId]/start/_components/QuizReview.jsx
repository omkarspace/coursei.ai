'use client';
import React, { useState, useEffect } from 'react';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { getDueQuizQuestionsAction, submitQuizReviewAction } from '@/app/actions/fsrs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RATING_LABELS = {
  1: { label: 'Again', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200' },
  2: { label: 'Hard', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200' },
  3: { label: 'Good', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200' },
  4: { label: 'Easy', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200' },
};

export default function QuizReview({ courseId, chapterId }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDueQuestions();
  }, [courseId, chapterId]);

  const loadDueQuestions = async () => {
    setLoading(true);
    try {
      const due = await getDueQuizQuestionsAction(courseId, chapterId);
      setQuestions(due);
    } catch (error) {
      console.error('Failed to load due quiz questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitQuizReviewAction(courseId, chapterId, questions[currentIndex].questionIndex, rating);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        setCurrentIndex(-1);
      }
    } catch (error) {
      console.error('Failed to submit quiz review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
          Loading due questions...
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
            <HiOutlineAcademicCap className="h-6 w-6 text-primary" />
            Quiz Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No quiz questions due for review. Great job!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (currentIndex === -1) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
            <HiOutlineAcademicCap className="h-6 w-6 text-primary" />
            Review Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            You&apos;ve reviewed all due quiz questions. Come back later for more!
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              loadDueQuestions();
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Review Again
          </button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentIndex];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
          <HiOutlineAcademicCap className="h-6 w-6 text-primary" />
          Quiz Review
        </CardTitle>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          {currentIndex + 1} of {questions.length}
        </span>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="font-medium text-lg dark:text-white">{question.question}</p>
        </div>

        {showAnswer ? (
          <>
            <div className="space-y-2 mb-4">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                >
                  <span className="dark:text-gray-200">{option}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
              <strong>Explanation:</strong> {question.explanation}
            </p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRate(r)}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${RATING_LABELS[r].color} disabled:opacity-50`}
                >
                  {RATING_LABELS[r].label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowAnswer(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Show Answer
          </button>
        )}
      </CardContent>
    </Card>
  );
}