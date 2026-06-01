"use client";
import { db } from "@/configs/db";
import { Chapters, CourseList } from "@/configs/schema";
import { useUser } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import CourseBasicInfo from "./_components/CourseBasicInfo";
import CourseDetails from "./_components/CourseDetails";
import ChapterList from "./_components/ChapterList";
import { Button } from "@/components/ui/button";
import { GenerateChapterContent_AI } from "@/configs/AiModel";
import LoadingDialog from "../_components/LoadingDialog";
import service from "@/configs/service";
import { useRouter } from "next/navigation";
import {
  getCourseById,
  publishCourse,
  createChapter,
  getCourseChapters,
} from "@/app/actions/course";

function CourseLayout({ params }) {
  const { user } = useUser();
  const [course, setCourse] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params && GetCourse();
  }, [params, user]);

  const GetCourse = async () => {
    const result = await getCourseById(params?.courseId);
    setCourse(result);
  };

  const GenerateChapterContent = async () => {
    setLoading(true);
    const chapters = course?.courseOutput?.course?.chapters || [];

    try {
      for (const [index, chapter] of chapters.entries()) {
        if (index >= 3) break;

        const PROMPT = `Explain the concept in Detail on Topic: ${course?.name}, Chapter: ${chapter?.name}, in JSON Format with a list of arrays including title, explanation, and code example (use <precode> format for code if applicable).`;

        const result = await GenerateChapterContent_AI.sendMessage(PROMPT);
        const responseText = await result?.response?.text();

        let content;
        try {
          content = JSON.parse(responseText || "{}");
        } catch (error) {
          content = {};
        }

        let videoId = "";
        if (course.includeVideo === "Yes") {
          try {
            const videoResponse = await service.getVideos(
              `${course?.name}:${chapter?.name}`
            );
            videoId = videoResponse[0]?.id?.videoId || "";
          } catch (error) {
            console.error("Error fetching video ID:", error);
          }
        }

        await createChapter({
          chapterId: index,
          courseId: course?.courseId,
          content: content,
          videoId: videoId,
        });
      }

      await publishCourse(course?.courseId);
      router.replace(`/create-course/${course?.courseId}/finish`);
    } catch (error) {
      console.error("Error generating chapter content:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 px-6 sm:px-10 md:px-20 lg:px-32 xl:px-44">
      <h2 className="font-bold text-center text-2xl sm:text-2xl lg:text-3xl">
        Course Layout
      </h2>

      <LoadingDialog loading={loading} />
      <CourseBasicInfo course={course} refreshData={() => GetCourse()} />
      <CourseDetails course={course} />
      <ChapterList course={course} refreshData={() => GetCourse()} />

      <Button
        onClick={GenerateChapterContent}
        className="my-6 sm:my-8 lg:my-10 w-full sm:w-auto"
      >
        Generate Course Content
      </Button>
    </div>
  );
}

export default CourseLayout;
