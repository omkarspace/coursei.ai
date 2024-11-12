"use client";
import { db } from "@/configs/db";
import { CourseList } from "@/configs/schema";
import { useUser } from "@clerk/nextjs";
import { eq, and } from "drizzle-orm";

import React, { useEffect, useState } from "react";
import CourseBasicInfo from "../_components/CourseBasicInfo";
import { useRouter } from "next/navigation";
import { HiOutlineClipboardDocumentCheck } from "react-icons/hi2";

function FinishScreen({ params }) {
  const { courseId } = params; // Extract courseId from params
  const { user } = useUser();
  const [course, setCourse] = useState(null);
  const router = useRouter();

  useEffect(() => {
    courseId && user && GetCourse(); // Ensure courseId and user are available
  }, [courseId, user]);

  const GetCourse = async () => {
    if (!courseId || !user?.primaryEmailAddress?.emailAddress) return;

    try {
      const result = await db
        .select()
        .from(CourseList)
        .where(
          and(
            eq(CourseList.courseId, courseId),
            eq(CourseList.createdBy, user.primaryEmailAddress.emailAddress)
          )
        );

      setCourse(result[0] || null); // Set course or null if not found
      console.log(result);
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 my-7">
      <h2 className="text-center font-bold text-2xl sm:text-3xl lg:text-4xl my-3 text-primary">
        Congrats! Your course is Ready
      </h2>
      <CourseBasicInfo course={course} refreshData={() => console.log()} />
      <div className="mt-4">
        <h2 className="text-lg sm:text-xl font-medium">Course URL:</h2>
        <div className="flex items-center justify-center mt-2 p-2 rounded-lg bg-gray-100 border border-gray-300 w-full sm:w-auto">
          <span className="text-sm sm:text-base text-gray-600 mr-3 truncate">
            {process.env.NEXT_PUBLIC_HOST_NAME}/course/view/{course?.courseId}
          </span>
          <HiOutlineClipboardDocumentCheck
            className="h-5 w-5 cursor-pointer text-primary"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${process.env.NEXT_PUBLIC_HOST_NAME}/course/view/${course?.courseId}`
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default FinishScreen;
