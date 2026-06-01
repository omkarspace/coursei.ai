"use client";
import { getUserCourses } from "@/app/actions/course";
import { UserCourseListContext } from "@/app/_context/UserCourseListContext";
import React, { useContext, useEffect, useState } from "react";
import CourseCard from "./CourseCard";

function UserCourseList() {
  const [courseList, setCourseList] = useState([]);
  const { setUserCourseInput } = useContext(UserCourseListContext);

  useEffect(() => {
    getUserCourses().then((courses) => {
      setCourseList(courses);
      setUserCourseInput(courses);
    });
  }, []);

  const refreshData = async () => {
    const courses = await getUserCourses();
    setCourseList(courses);
    setUserCourseInput(courses);
  };

  return (
    <div className="mt-10 px-4 md:px-6">
      <h2 className="font-medium text-xl dark:text-white">My AI Courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courseList.length > 0 ? (
          courseList.map((course, index) => (
            <CourseCard
              course={course}
              key={index}
              refreshData={refreshData}
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
      className="w-full mt-5 bg-slate-200 dark:bg-gray-800 animate-pulse rounded-lg h-[270px]"
    ></div>
  ));
}

export default UserCourseList;
