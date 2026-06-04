'use client';
import { getUserCoursesWithProgress } from '@/app/actions/course';
import { UserCourseListContext } from '@/app/_context/UserCourseListContext';
import React, { useContext, useEffect, useState } from 'react';
import CourseCard from './CourseCard';
import Link from 'next/link';

function UserCourseList() {
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setUserCourseInput } = useContext(UserCourseListContext);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const courses = await getUserCoursesWithProgress();
      setCourseList(courses);
      setUserCourseInput(courses);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchCourses();
  };

  if (loading) {
    return (
      <div className="mt-10 px-4 md:px-6">
        <h2 className="font-medium text-xl dark:text-white">My AI Courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <LoadingSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 px-4 md:px-6">
        <h2 className="font-medium text-xl dark:text-white">My AI Courses</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="w-12 h-12 text-red-400 mb-4"
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
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchCourses}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 px-4 md:px-6">
      <h2 className="font-medium text-xl dark:text-white">My AI Courses</h2>
      {courseList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courseList.map((course, index) => (
            <CourseCard course={course} key={index} refreshData={refreshData} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg mt-4">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
            Create your first AI-powered course to start learning. It only takes a few minutes!
          </p>
          <Link
            href="/create-course"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Your First Course
          </Link>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton({ count }) {
  return Array.from({ length: count }).map((_, index) => (
    <div
      key={index}
      className="w-full mt-5 bg-slate-200 dark:bg-gray-800 animate-pulse rounded-lg h-[270px]"
    ></div>
  ));
}

export default UserCourseList;
