import React from 'react'
import { HiOutlineBookOpen, HiOutlineChartBar, HiOutlineClock, HiOutlinePlayCircle } from 'react-icons/hi2'

function CourseDetails({ course }) {
  return (
    <div className="border dark:border-gray-700 p-6 rounded-xl shadow-sm dark:bg-gray-900 mt-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="flex gap-2">
          <HiOutlineChartBar className="text-4xl text-primary" />
          <div>
            <h2 className="text-xs text-gray-500 dark:text-gray-400">Skill Level</h2>
            <h2 className="font-medium text-lg dark:text-white">{course?.level}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <HiOutlineClock className="text-4xl text-primary" />
          <div>
            <h2 className="text-xs text-gray-500 dark:text-gray-400">Duration</h2>
            <h2 className="font-medium text-lg dark:text-white">
              {course?.courseOutput?.course?.duration}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <HiOutlineBookOpen className="text-4xl text-primary" />
          <div>
            <h2 className="text-xs text-gray-500 dark:text-gray-400">No Of Chapters</h2>
            <h2 className="font-medium text-lg dark:text-white">
              {course?.courseOutput?.course?.noOfChapters}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <HiOutlinePlayCircle className="text-4xl text-primary" />
          <div>
            <h2 className="text-xs text-gray-500 dark:text-gray-400">Video Included</h2>
            <h2 className="font-medium text-lg dark:text-white">{course?.includeVideo}</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetails
