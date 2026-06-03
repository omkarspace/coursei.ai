"use client";

import React from "react";

interface ProgressIndicatorProps {
  completedChapters: number[];
  totalChapters: number;
  className?: string;
}

export function ProgressIndicator({
  completedChapters,
  totalChapters,
  className = "",
}: ProgressIndicatorProps) {
  const completedCount = completedChapters.length;
  const percentage = totalChapters > 0 
    ? Math.round((completedCount / totalChapters) * 100) 
    : 0;

  return (
    <div className={`p-4 border-t dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {completedCount}/{totalChapters} chapters
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {percentage}% complete
      </p>
    </div>
  );
}
