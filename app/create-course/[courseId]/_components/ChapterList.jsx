import { index } from "drizzle-orm/mysql-core";
import React from "react";
import { HiOutlineCheckCircle, HiOutlineClock } from "react-icons/hi2";
import EditChapters from "./EditChapters";

function ChapterList({ course }) {
  return (
    <div className="mt-3">
      <h2 className="font-medium text-xl">Chapters</h2>
      <div className="mt-2">
        {course?.courseOutput?.course?.chapters.map((chapter, index) => (
          <div className="border p-5 rounded-lg mb-2 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex gap-5 items-center w-full sm:w-auto">
              <h2 className="bg-primary flex-none h-10 w-10 text-blue-500 rounded-full text-center p-2">
                {index + 1}
              </h2>
              <div className="flex-1">
                <h2 className="font-medium text-lg">{chapter?.name}<EditChapters /></h2>
                <p className="text-sm text-gray-500">{chapter?.about}</p>
                <p className="flex gap-2 text-primary items-center">
                  <HiOutlineClock />
                  {chapter?.duration}
                </p>
              </div>
            </div>
            <HiOutlineCheckCircle className="text-4xl text-gray-300 flex-none mt-3 sm:mt-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChapterList;
