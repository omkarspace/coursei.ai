'use client';
import React, { useState } from 'react';
import { publishCourse } from '@/app/actions/course';
import { toast } from 'sonner';
import { HiOutlineGlobeAlt, HiOutlineCheckCircle } from 'react-icons/hi2';

export default function PublishButton({ course, refreshData }) {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPublishing(true);
    try {
      await publishCourse(course.courseId);
      toast.success(course?.publish ? 'Course unpublished' : 'Course published to marketplace!');
      refreshData();
    } catch (error) {
      toast.error('Failed to publish course');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={publishing}
      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      {course?.publish ? (
        <>
          <HiOutlineCheckCircle className="h-4 w-4 text-green-500" />
          {publishing ? 'Unpublishing...' : 'Unpublish'}
        </>
      ) : (
        <>
          <HiOutlineGlobeAlt className="h-4 w-4" />
          {publishing ? 'Publishing...' : 'Publish to Marketplace'}
        </>
      )}
    </button>
  );
}
