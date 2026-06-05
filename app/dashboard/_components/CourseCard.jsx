'use client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { HiMiniEllipsisVertical, HiOutlineBookOpen } from 'react-icons/hi2';
import DropDownOption from './DropDownOption';
import { deleteCourse } from '@/app/actions/course';
import { getCourseRatingSummary } from '@/app/actions/rating';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function CourseCard({ course, refreshData, displayUser = false }) {
  const handleOnDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteCourse(course?.courseId);
      toast.success('Course deleted successfully');
      refreshData();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });

  useEffect(() => {
    if (course?.courseId) {
      getCourseRatingSummary(course.courseId).then(setRatingSummary);
    }
  }, [course?.courseId]);

  const getStatusBadge = () => {
    if (!course?.status || course.status === 'complete') {
      return course?.publish ? (
        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
          Published
        </span>
      ) : (
        <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full">
          Draft
        </span>
      );
    }

    const statusMap = {
      draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      },
      generating_outline: {
        label: 'Generating...',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      generating_chapters: {
        label: 'Generating...',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      },
      failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      },
    };

    const status = statusMap[course.status] || statusMap.draft;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
    );
  };

  return (
    <Link href={'/course/' + course?.courseId}>
      <Card className="shadow-sm cursor-pointer mt-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Image
              src={course?.courseBanner || '/placeholderr.png'}
              width={500}
              height={300}
              className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] object-cover rounded-lg"
              alt={`Banner for ${course?.courseOutput?.course?.name || 'course'}`}
            />
            <div className="absolute top-2 right-2">{getStatusBadge()}</div>
          </div>
          <div className="p-2">
            <h2 className="font-medium text-lg flex justify-between items-center dark:text-white">
              <span className="truncate mr-2">{course?.courseOutput?.course?.name}</span>
              {!displayUser && (
                <DropDownOption
                  handleOnDelete={handleOnDelete}
                  course={course}
                  refreshData={refreshData}
                >
                  <HiMiniEllipsisVertical aria-hidden="true" />
                </DropDownOption>
              )}
            </h2>
            <p className="text-sm text-gray-400 my-1 truncate">{course?.category}</p>
            <div className="flex items-center justify-between">
              <h2 className="flex gap-2 items-center p-1 bg-purple-50 dark:bg-purple-900/30 text-primary text-xs sm:text-sm md:text-base rounded-sm">
                <HiOutlineBookOpen aria-hidden="true" />
                {course?.courseOutput?.course?.chapters?.length || 0} Chapters
              </h2>
              <h2 className="text-xs sm:text-sm md:text-base bg-purple-50 dark:bg-purple-900/30 text-primary p-1 rounded-sm">
                {course?.level}
              </h2>
            </div>

            {ratingSummary.count > 0 && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span>{ratingSummary.average.toFixed(1)}</span>
                <span className="text-gray-400">({ratingSummary.count})</span>
              </div>
            )}

            {/* Learning Progress - only show for complete courses with progress */}
            {course?.status === 'complete' && course?.learningProgress !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Learning Progress</span>
                  <span>{course.completedChapters}/{course.totalChapters} chapters ({course.learningProgress}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${course.learningProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Last Accessed - show if available */}
            {course?.lastAccessedAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Last accessed {new Date(course.lastAccessedAt).toLocaleDateString()}
              </p>
            )}

            {(course?.status === 'generating_outline' ||
              course?.status === 'generating_chapters') && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{course?.currentStep || 'Generating...'}</span>
                  <span>{course?.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${course?.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {course?.createdAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Created {new Date(course.createdAt).toLocaleDateString()}
              </p>
            )}

            {displayUser && course?.userName && (
              <div className="flex gap-2 items-center mt-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={course?.userProfileImage || '/avatar.png'}
                    alt={`${course?.userName}'s profile`}
                  />
                  <AvatarFallback>
                    {course.userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-sm dark:text-gray-300">{course?.userName}</h2>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default CourseCard;
