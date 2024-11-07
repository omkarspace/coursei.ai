"use client";
import { db } from "@/configs/db";
import { CourseList } from "@/configs/schema";
import { useUser } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import React, { useContext, useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import { UserCourseListContext } from "@/app/_context/UserCourseListContext";

function UserCourseList() {
  const [courseList, setCourseList] = useState([]);
  const { setUserCourseInput } = useContext(UserCourseListContext);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      getUserCourses();
    }
  }, [user]);

  const getUserCourses = async () => {
    try {
      const result = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList?.createdBy, user?.primaryEmailAddress?.emailAddress));

      setCourseList(result);
      setUserCourseInput(result);
    } catch (error) {
      console.error("Error fetching user courses:", error);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="font-medium text-xl">My AI Courses</h2>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courseList.length > 0 ? (
          courseList.map((course, index) => (
            <CourseCard
              course={course}
              key={index}
              refreshData={getUserCourses}
            />
          ))
        ) : (
          <LoadingSkeleton count={5} />
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton({ count }) {
  return Array.from({ length: count }).map((_, index) => (
    <div
      key={index}
      className="w-full mt-5 bg-slate-200 animate-pulse rounded-lg h-[270px]"
    ></div>
  ));
}

export default UserCourseList;
