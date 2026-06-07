'use client';
import { getUserCoursesWithProgress } from '@/app/actions/course';
import { UserCourseListContext } from '@/app/_context/UserCourseListContext';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import CourseCard from './CourseCard';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { HiOutlineClock, HiOutlineAcademicCap } from 'react-icons/hi2';

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

  const { inProgress, rest } = useMemo(() => {
    const inProgress = courseList
      .filter(
        (c) =>
          c.lastAccessedAt &&
          c.learningProgress !== undefined &&
          c.learningProgress > 0 &&
          c.learningProgress < 100
      )
      .sort(
        (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
      );
    const rest = courseList.filter((c) => !inProgress.includes(c));
    return { inProgress, rest };
  }, [courseList]);

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
      {inProgress.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineAcademicCap className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-medium text-xl dark:text-white">Continue learning</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inProgress.map((course) => (
              <ContinueLearningCard
                key={course.courseId}
                course={course}
                refreshData={refreshData}
              />
            ))}
          </div>
        </section>
      )}

      <h2 className="font-medium text-xl dark:text-white">My AI Courses</h2>
      {rest.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((course, index) => (
            <CourseCard course={course} key={course.courseId || index} refreshData={refreshData} />
          ))}
        </div>
      ) : (
        courseList.length === 0 && (
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
        )
      )}
    </div>
  );
}

function ContinueLearningCard({ course, refreshData }) {
  return (
    <Link href={'/course/' + course?.courseId + '/start'}>
      <div className="mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-primary dark:hover:border-primary transition-all duration-200 hover:shadow-md">
        <div className="relative">
          {course?.courseBanner ? (
            <img
              src={course.courseBanner}
              alt={`Banner for ${course?.courseOutput?.course?.name || 'course'}`}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="p-4">
          <h3 className="font-medium text-base dark:text-white truncate">
            {course?.courseOutput?.course?.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {course?.category} · {course?.level}
          </p>

          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {course.completedChapters}/{course.totalChapters} chapters
              </span>
              <span className="font-medium text-primary">{course.learningProgress}%</span>
            </div>
            <Progress value={course.learningProgress} className="h-1.5" />
          </div>

          {course?.lastAccessedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-2">
              <HiOutlineClock className="h-3 w-3" aria-hidden="true" />
              <span>Last accessed {formatRelativeTime(new Date(course.lastAccessedAt))}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString();
}

function LoadingSkeleton({ count }) {
  return Array.from({ length: count }).map((_, index) => (
    <Skeleton key={index} className="w-full mt-5 h-[270px]" />
  ));
}

export default UserCourseList;
