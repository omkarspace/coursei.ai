"use client";
import { getCourseById } from "@/app/actions/course";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import CourseBasicInfo from "../_components/CourseBasicInfo";
import { HiOutlineClipboardDocumentCheck } from "react-icons/hi2";

function FinishScreen({ params }) {
  const { courseId } = params;
  const { user } = useUser();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    courseId && user && GetCourse();
  }, [courseId, user]);

  const GetCourse = async () => {
    if (!courseId) return;
    try {
      const result = await getCourseById(courseId);
      setCourse(result || null);
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 my-7">
      <h2 className="text-center font-bold text-2xl sm:text-3xl lg:text-4xl my-3 text-primary">
        Congrats! Your course is Ready
      </h2>
      <CourseBasicInfo course={course} refreshData={() => {}} />
      <div className="mt-4">
        <h2 className="text-lg sm:text-xl font-medium">Course URL:</h2>
        <div className="flex items-center justify-center mt-2 p-2 rounded-lg bg-gray-100 border border-gray-300 w-full sm:w-auto">
          <span className="text-sm sm:text-base text-gray-600 mr-3 truncate">
            {process.env.NEXT_PUBLIC_HOST_NAME}/course/{course?.courseId}
          </span>
          <HiOutlineClipboardDocumentCheck
            className="h-5 w-5 cursor-pointer text-primary"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${process.env.NEXT_PUBLIC_HOST_NAME}/course/${course?.courseId}`
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default FinishScreen;
