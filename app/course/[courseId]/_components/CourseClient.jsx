'use client';
import ChapterList from '@/app/create-course/[courseId]/_components/ChapterList';
import CourseBasicInfo from '@/app/create-course/[courseId]/_components/CourseBasicInfo';
import CourseDetails from '@/app/create-course/[courseId]/_components/CourseDetails';
import Header from '@/app/dashboard/_components/Header';
import { forkCourse } from '@/app/actions/course';
import { getCourseRatingSummary } from '@/app/actions/rating';
import RatingDialog from '@/app/dashboard/_components/RatingDialog';
import { HiStar, HiOutlineStar } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CourseClient({ course }) {
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);
  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });

  useEffect(() => {
    getCourseRatingSummary(course.courseId).then(setRatingSummary);
  }, [course.courseId]);

  const handleFork = async () => {
    setIsForking(true);
    try {
      const result = await forkCourse(course.courseId);
      toast.success('Course forked successfully!');
      router.push(`/dashboard`);
    } catch (error) {
      console.error('Fork failed:', error);
      toast.error('Failed to fork course');
    } finally {
      setIsForking(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-44 py-6 lg:py-10">
        <div className="space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CourseBasicInfo course={course} edit={false} />
            </div>
            <button
              onClick={handleFork}
              disabled={isForking}
              className="ml-4 inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                />
              </svg>
              {isForking ? 'Forking...' : 'Fork Course'}
            </button>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) =>
                  star <= Math.round(ratingSummary.average) ? (
                    <HiStar key={star} className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <HiOutlineStar
                      key={star}
                      className="w-5 h-5 text-gray-300 dark:text-gray-600"
                    />
                  )
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {ratingSummary.average > 0
                    ? `${ratingSummary.average.toFixed(1)} (${ratingSummary.count} rating${ratingSummary.count !== 1 ? 's' : ''})`
                    : 'No ratings yet'}
                </span>
              </div>
              <RatingDialog courseId={course.courseId}>
                <Button variant="outline" size="sm">
                  Rate this Course
                </Button>
              </RatingDialog>
            </div>
          </div>
          <CourseDetails course={course} />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {course?.createdAt && (
              <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
            )}
            {course?.updatedAt && course.updatedAt !== course.createdAt && (
              <span> · Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
          <ChapterList course={course} />
        </div>
      </div>
    </div>
  );
}
