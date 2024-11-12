import React from "react";
import { HiOutlineClock } from "react-icons/hi2";

function ChapterListCard({ chapter, index }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 p-4 items-center border-b">
      <div className="flex justify-center sm:justify-start">
        <h2 className="p-1 bg-primary w-8 h-8 text-white text-center rounded-full">
          {index + 1}
        </h2>
      </div>
      <div className="col-span-4 sm:col-span-4">
        <h2 className="font-medium text-sm sm:text-base">{chapter?.name}</h2>
        <h2 className="flex items-center gap-2 text-xs sm:text-sm text-primary">
          <HiOutlineClock />
          {chapter?.duration}
        </h2>
      </div>
    </div>
  );
}

export default ChapterListCard;
