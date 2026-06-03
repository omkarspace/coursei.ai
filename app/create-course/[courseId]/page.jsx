"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import CourseBasicInfo from "./_components/CourseBasicInfo";
import CourseDetails from "./_components/CourseDetails";
import ChapterList from "./_components/ChapterList";
import { Button } from "@/components/ui/button";
import { GenerationProgress } from "./_components/GenerationProgress";
import { useRouter } from "next/navigation";
import {
  getCourseById,
  updateCourseStatus,
} from "@/app/actions/course";

function CourseLayout({ params }) {
  const { user } = useUser();
  const [course, setCourse] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params && GetCourse();
  }, [params, user]);

  const GetCourse = async () => {
    const result = await getCourseById(params?.courseId);
    setCourse(result);
  };

  const GenerateCourseContent = async () => {
    setIsGenerating(true);

    try {
      // Update status to generating
      await updateCourseStatus(
        course.courseId,
        "generating_outline",
        0,
        "Starting course generation..."
      );

      // Send event to Inngest for background processing
      await fetch("/api/inngest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "course.generate",
          data: {
            courseId: course.courseId,
          },
        }),
      });

      // Refresh course data
      await GetCourse();
    } catch (error) {
      console.error("Error starting course generation:", error);
      await updateCourseStatus(
        course.courseId,
        "failed",
        0,
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleGenerationComplete = () => {
    setIsGenerating(false);
    router.replace(`/create-course/${course?.courseId}/finish`);
  };

  const isGeneratingStatus =
    course?.status === "generating_outline" ||
    course?.status === "generating_chapters";

  return (
    <div className="mt-10 px-6 sm:px-10 md:px-20 lg:px-32 xl:px-44">
      <h2 className="font-bold text-center text-2xl sm:text-2xl lg:text-3xl">
        Course Layout
      </h2>

      <CourseBasicInfo course={course} refreshData={() => GetCourse()} />
      <CourseDetails course={course} />
      <ChapterList course={course} refreshData={() => GetCourse()} />

      {/* Generation Progress */}
      {(isGenerating || isGeneratingStatus) && (
        <GenerationProgress
          courseId={course?.courseId}
          onComplete={handleGenerationComplete}
        />
      )}

      {/* Generate Button - only show when not generating and course is in draft */}
      {!isGenerating && !isGeneratingStatus && course?.status !== "complete" && (
        <Button
          onClick={GenerateCourseContent}
          className="my-6 sm:my-8 lg:my-10 w-full sm:w-auto"
        >
          Generate Course Content
        </Button>
      )}

      {/* View Course Button - show when complete */}
      {course?.status === "complete" && (
        <Button
          onClick={() => router.replace(`/create-course/${course?.courseId}/finish`)}
          className="my-6 sm:my-8 lg:my-10 w-full sm:w-auto"
        >
          View Course
        </Button>
      )}
    </div>
  );
}

export default CourseLayout;
