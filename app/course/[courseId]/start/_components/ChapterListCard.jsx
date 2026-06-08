import React from 'react';
import { HiOutlineClock, HiCheck } from 'react-icons/hi2';

function ChapterListCard({ chapter, index, isCompleted = false }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 p-4 items-center border-b">
      <div className="flex justify-center sm:justify-start">
        {isCompleted ? (
          <h2 className="p-1 bg-green-500 w-8 h-8 text-white text-center rounded-full flex items-center justify-center">
            <HiCheck className="w-5 h-5" />
          </h2>
        ) : (
          <h2 className="p-1 bg-primary w-8 h-8 text-white text-center rounded-full">
            {index + 1}
          </h2>
        )}
      </div>
      <div className="col-span-4 sm:col-span-4">
        <h2
          className={`font-medium text-sm sm:text-base ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}`}
        >
          {chapter?.name}
        </h2>
        <h2 className="flex items-center gap-2 text-xs sm:text-sm text-primary">
          <HiOutlineClock />
          {chapter?.duration}
          {chapter.difficulty && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
              chapter.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              chapter.difficulty === 'Hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
              {chapter.difficulty}
            </span>
          )}
        </h2>
      </div>
    </div>
  );
}

export default ChapterListCard;
