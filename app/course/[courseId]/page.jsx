"use client";
import ChapterList from "@/app/create-course/[courseId]/_components/ChapterList";
import CourseBasicInfo from "@/app/create-course/[courseId]/_components/CourseBasicInfo";
import CourseDetails from "@/app/create-course/[courseId]/_components/CourseDetails";
import Header from "@/app/dashboard/_components/Header";
import { getPublishedCourseById } from "@/app/actions/course";
import React, { useEffect, useState } from "react";

function Course({ params }) {
  const [course, setCourse] = useState();

  useEffect(() => {
    params && GetCourse();
  }, [params]);

  const GetCourse = async () => {
    const result = await getPublishedCourseById(params?.courseId);
    setCourse(result);
  };

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-44 py-6 lg:py-10">
        <div className="space-y-8">
          <CourseBasicInfo course={course} edit={false} />
          <CourseDetails course={course} />
          <ChapterList course={course} />
        </div>
      </div>
    </div>
  );
}

export default Course;
