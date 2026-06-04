'use client';
import React from 'react';
import YouTube from 'react-youtube';
import ReactMarkdown from 'react-markdown';
import ContentVerification from '@/app/_components/ContentVerification';

function ChapterContent({ chapter, content }) {
  return (
    <div className="container mx-auto p-6">
      <h2 className="font-semibold text-3xl sm:text-4xl text-gray-800 dark:text-white">
        {chapter?.name}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-lg">{chapter?.about}</p>

      {/* YouTube Video Embed with Responsive Design */}
      {content?.videoId && (
        <div className="my-8">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
            <YouTube
              videoId={content.videoId}
              opts={{
                height: '100%',
                width: '100%',
                playerVars: { autoplay: 0 },
              }}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Content Block */}
      <div>
        {Array.isArray(content?.content) && content.content.length > 0 ? (
          content.content.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-800 mb-6 p-6 hover:shadow-xl transition-all"
            >
              <h3 className="font-medium text-xl text-gray-800 dark:text-white">{item?.title}</h3>
              <ReactMarkdown className="prose dark:prose-invert max-w-full text-gray-700 dark:text-gray-300">
                {item?.explanation}
              </ReactMarkdown>

              {/* Code Snippet */}
              {item.code && (
                <div className="mt-6 bg-gray-800 dark:bg-gray-950 text-white p-4 rounded-md relative overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm">{item?.code}</pre>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No content available for this chapter.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              The content may still be generating.
            </p>
          </div>
        )}
      </div>

      <ContentVerification
        chapterName={chapter?.name}
        contentSummary={
          content?.content
            ?.map((c) => c.explanation)
            .join(' ')
            .substring(0, 500) || ''
        }
      />
    </div>
  );
}

export default ChapterContent;
