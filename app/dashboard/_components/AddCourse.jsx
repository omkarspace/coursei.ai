'use client';
import { UserCourseListContext } from '@/app/_context/UserCourseListContext';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import React, { useContext } from 'react';

function AddCourse() {
  const { user } = useUser();
  const { UserCourseList } = useContext(UserCourseListContext);

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 space-y-4 md:space-y-0">
      <div className="flex flex-col">
        <h2 className="text-2xl md:text-3xl text-primary dark:text-purple-400">
          Hello,
          <span className="font-bold"> {user?.fullName || 'there'} </span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create a new AI-powered course and share it with friends.
        </p>
      </div>
      <div className="self-stretch md:self-auto">
        <Link href="/create-course">
          <Button className="w-full md:w-auto">
            + Create AI Course
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default AddCourse;
