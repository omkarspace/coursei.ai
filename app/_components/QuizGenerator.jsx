'use client';
import React, { useState, useEffect } from 'react';
import { HiOutlineAcademicCap, HiCheckCircle, HiXCircle } from 'react-icons/hi2';
import { generateQuizAction } from '@/app/actions/ai';
import { saveQuiz, getQuiz } from '@/app/actions/course';
import { saveQuizAttemptAction } from '@/app/actions/fsrs';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function QuizGenerator({ courseId, chapterId, chapterName, chapterContent }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    loadQuiz();
  }, [courseId, chapterId]);

  const loadQuiz = async () => {
    const existing = await getQuiz(courseId, chapterId);
    if (existing) {
      setQuiz(existing.questions);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const contentText =
        chapterContent?.content?.map((c) => c.explanation).join('\n') || chapterName;

      const response = await generateQuizAction(chapterName, contentText.substring(0, 2000));
      setQuiz(response.questions);
      await saveQuiz(courseId, chapterId, response.questions);
      toast.success('Quiz generated successfully!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    if (answerIndex === quiz[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    setAnswers((prev) => [
      ...prev,
      {
        questionIndex: currentQuestion,
        selectedAnswer: answerIndex,
        isCorrect: answerIndex === quiz[currentQuestion].correctAnswer,
      },
    ]);
  };

  const nextQuestion = async () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
      try {
        const currentScore = answers.filter((a) => a.isCorrect).length + (selectedAnswer === quiz[currentQuestion].correctAnswer ? 1 : 0);
        await saveQuizAttemptAction(courseId, chapterId, currentScore, quiz.length, [
          ...answers,
          {
            questionIndex: currentQuestion,
            selectedAnswer,
            isCorrect: selectedAnswer === quiz[currentQuestion].correctAnswer,
          },
        ]);
      } catch (error) {
        console.error('Failed to save quiz attempt:', error);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCompleted(false);
    setAnswers([]);
  };

  if (!quiz) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
            <HiOutlineAcademicCap className="h-6 w-6 text-primary" />
            Quiz Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Test your knowledge with AI-generated questions for this chapter.
          </p>
          <button
            onClick={generateQuiz}
            disabled={loading}
            aria-label="Generate quiz"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {loading ? 'Generating Quiz...' : 'Generate Quiz'}
          </button>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
            <HiOutlineAcademicCap className="h-6 w-6 text-primary" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-primary mb-2">
              {score}/{quiz.length}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {score === quiz.length
                ? 'Perfect score! Excellent work!'
                : score >= quiz.length * 0.7
                  ? 'Great job! Keep practicing!'
                  : 'Keep studying and try again!'}
            </p>
            <button
              onClick={resetQuiz}
              aria-label="Retake quiz"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Retake Quiz
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = quiz[currentQuestion];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
          <HiOutlineAcademicCap className="h-6 w-6 text-primary" />
          Quiz
        </CardTitle>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          Question {currentQuestion + 1} of {quiz.length}
        </span>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
            />
          </div>
          <p className="font-medium text-lg dark:text-white">{question.question}</p>
        </div>

        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-lg border transition-all ${
                showResult
                  ? index === question.correctAnswer
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                    : index === selectedAnswer
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                      : 'bg-gray-50 dark:bg-gray-800'
                  : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium dark:text-white">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="dark:text-gray-200">{option}</span>
                {showResult && index === question.correctAnswer && (
                  <HiCheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                )}
                {showResult && index === selectedAnswer && index !== question.correctAnswer && (
                  <HiXCircle className="h-5 w-5 text-red-500 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>

        {showResult && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <strong>Explanation:</strong> {question.explanation}
            </p>
          </div>
        )}

        {showResult && (
          <button
            onClick={nextQuestion}
            aria-label={currentQuestion < quiz.length - 1 ? 'Next question' : 'See results'}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {currentQuestion < quiz.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default QuizGenerator;
