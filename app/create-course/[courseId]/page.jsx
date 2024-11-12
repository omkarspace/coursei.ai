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

function CourseLayout({ params }) {
  const { user } = useUser();
  const [course, setCourse] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params && GetCourse();
  }, [params, user]);

  const GetCourse = async () => {
    const result = await db
      .select()
      .from(CourseList)
      .where(
        and(
          eq(CourseList.courseId, params?.courseId),
          eq(CourseList?.createdBy, user?.primaryEmailAddress?.emailAddress)
        )
      );

    setCourse(result[0]);

    console.log(result);
  };

  const GenerateChapterContent = async () => {
    setLoading(true);
    const chapters = course?.courseOutput?.course?.chapters || [];
  
    try {
      for (const [index, chapter] of chapters.entries()) {
        if (index >= 3) break; // Limit to the first three chapters if needed
  
        const PROMPT = `Explain the concept in Detail on Topic: ${course?.name}, Chapter: ${chapter?.name}, in JSON Format with a list of arrays including title, explanation, and code example (use <precode> format for code if applicable).`;
        
        console.log("Prompt for AI model:", PROMPT);
  
        // Send the prompt to the AI model
        const result = await GenerateChapterContent_AI.sendMessage(PROMPT);
  
        // Capture and log the raw response text for debugging
        const responseText = await result?.response?.text();
        console.log("Raw AI response:", responseText);
  
        // Parse the response text into JSON and handle errors gracefully
        let content;
        try {
          content = JSON.parse(responseText || "{}");
        } catch (error) {
          console.error("Error parsing AI response as JSON:", error);
          content = {}; // Assign an empty object if parsing fails
        }
  
        // Fetch video ID if videos are included
        let videoId = "";
        if (course.includeVideo === "Yes") {
          try {
            const videoResponse = await service.getVideos(`${course?.name}:${chapter?.name}`);
            videoId = videoResponse[0]?.id?.videoId || "";
          } catch (error) {
            console.error("Error fetching video ID:", error);
          }
        }
  
        // Insert parsed content and video ID into the database
        try {
          await db.insert(Chapters).values({
            chapterId: index,
            courseId: course?.courseId,
            content: content,
            videoId: videoId,
          });
          console.log(`Saved chapter ${index + 1} content successfully.`);
        } catch (error) {
          console.error("Error inserting chapter into database:", error);
        }
      }
      await db.update(CourseList).set({
        publish: true
      })
      // Redirect to finish page after all chapters are processed
      router.replace(`/create-course/${course?.courseId}/finish`);
    } catch (error) {
      console.error("Error generating chapter content:", error);
    } finally {
      // Ensure loading state is turned off
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 px-6 sm:px-10 md:px-20 lg:px-32 xl:px-44">
      <h2 className="font-bold text-center text-2xl sm:text-2xl lg:text-3xl">Course Layout</h2>

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
