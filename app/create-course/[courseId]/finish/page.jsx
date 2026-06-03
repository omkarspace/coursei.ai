"use client";
import { getCourseById } from "@/app/actions/course";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import CourseBasicInfo from "../_components/CourseBasicInfo";
import { HiOutlineClipboardDocumentCheck } from "react-icons/hi2";
import { toast } from "sonner";
import Link from "next/link";

function FinishScreen({ params }) {
  const { courseId } = params;
  const { user } = useUser();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    courseId && user && GetCourse();
  }, [courseId, user]);

  const GetCourse = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getCourseById(courseId);
      setCourse(result || null);
    } catch (error) {
      console.error("Error fetching course:", error);
      setError("Failed to load course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const url = `${process.env.NEXT_PUBLIC_HOST_NAME}/course/${course?.courseId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy URL");
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 my-7">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading your course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 my-7">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="w-16 h-16 text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {error || "Course not found"}
          </h3>
          <Link
            href="/dashboard"
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 my-7">
      <h2 className="text-center font-bold text-2xl sm:text-3xl lg:text-4xl my-3 text-primary">
        Congrats! Your course is Ready
      </h2>
      <CourseBasicInfo course={course} refreshData={() => {}} />
      <div className="mt-4">
        <h2 className="text-lg sm:text-xl font-medium dark:text-white">Course URL:</h2>
        <div className="flex items-center justify-center mt-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 w-full sm:w-auto">
          <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mr-3 truncate">
            {process.env.NEXT_PUBLIC_HOST_NAME}/course/{course?.courseId}
          </span>
          <button
            onClick={copyToClipboard}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Copy URL to clipboard"
          >
            <HiOutlineClipboardDocumentCheck className="h-5 w-5 cursor-pointer text-primary" />
          </button>
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-4">
        <Link
          href={`/course/${course?.courseId}`}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          View Course
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default FinishScreen;
