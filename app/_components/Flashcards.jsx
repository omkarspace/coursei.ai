'use client';
import React, { useState, useEffect } from 'react';
import { HiOutlineRectangleStack, HiArrowPath } from 'react-icons/hi2';
import { generateFlashcardsAction } from '@/app/actions/ai';
import { saveFlashcards, getFlashcards } from '@/app/actions/course';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Flashcards({ courseId, chapterId, chapterName, chapterContent }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    loadFlashcards();
  }, [courseId, chapterId]);

  const loadFlashcards = async () => {
    const existing = await getFlashcards(courseId, chapterId);
    if (existing) {
      setCards(existing.cards);
    }
  };

  const generateFlashcards = async () => {
    setLoading(true);
    try {
      const contentText =
        chapterContent?.content?.map((c) => c.explanation).join('\n') || chapterName;

      const response = await generateFlashcardsAction(chapterName, contentText.substring(0, 2000));
      setCards(response.cards);
      await saveFlashcards(courseId, chapterId, response.cards);
      toast.success('Flashcards generated successfully!');
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Failed to generate flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  if (cards.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
            <HiOutlineRectangleStack className="h-6 w-6 text-primary" />
            Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create AI-powered flashcards to help you memorize key concepts.
          </p>
          <button
            onClick={generateFlashcards}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Generating Flashcards...' : 'Generate Flashcards'}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-medium dark:text-white">
          <HiOutlineRectangleStack className="h-6 w-6 text-primary" />
          Flashcards
        </CardTitle>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          Card {currentIndex + 1} of {cards.length}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-6">
          <div
            onClick={() => setFlipped(!flipped)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFlipped(!flipped);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={flipped ? 'Flip card to front' : 'Flip card to back'}
            className="w-full max-w-md h-48 cursor-pointer perspective-1000 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                flipped ? 'rotate-y-180' : ''
              }`}
            >
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center p-6 text-white">
                <p className="text-center text-lg font-medium">{cards[currentIndex]?.front}</p>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-gray-800 border-2 border-primary rounded-xl flex items-center justify-center p-6">
                <p className="text-center text-lg text-gray-700 dark:text-gray-200">
                  {cards[currentIndex]?.back}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          Click the card to flip it
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={prevCard}
            aria-label="Previous flashcard"
            className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Previous
          </button>
          <button
            onClick={nextCard}
            aria-label="Next flashcard"
            className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Next
          </button>
          <button
            onClick={generateFlashcards}
            disabled={loading}
            aria-label="Regenerate flashcards"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            <HiArrowPath className="h-4 w-4" />
            Regenerate
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Flashcards;
