import React from 'react';
import { HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi2';

function ChapterList({ course }) {
  const chapters = course?.courseOutput?.course?.chapters || [];

  return (
    <section className="mt-3" aria-labelledby="chapters-heading">
      <h2 id="chapters-heading" className="font-medium text-xl dark:text-white">
        Chapters
      </h2>
      <div className="mt-2" role="list">
        {chapters.map((chapter, index) => (
          <div
            key={index}
            className="border dark:border-gray-700 p-5 rounded-lg mb-2 flex flex-col sm:flex-row items-center justify-between dark:bg-gray-900"
            role="listitem"
          >
            <div className="flex gap-5 items-center w-full sm:w-auto">
              <span
                className="bg-primary flex-none h-10 w-10 text-white rounded-full text-center p-2 font-medium"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="font-medium text-lg dark:text-white">{chapter?.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{chapter?.about}</p>
                <p className="flex gap-2 text-primary items-center text-sm">
                  <HiOutlineClock className="h-4 w-4" aria-hidden="true" />
                  <span>{chapter?.duration}</span>
                </p>
              </div>
            </div>
            <HiOutlineCheckCircle
              className="text-4xl text-gray-300 dark:text-gray-600 flex-none mt-3 sm:mt-0"
              aria-hidden="true"
            />
          </div>
        ))}
        {chapters.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No chapters yet.</p>
        )}
      </div>
    </section>
  );
}

export default ChapterList;
