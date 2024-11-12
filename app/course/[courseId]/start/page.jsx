"use client";
import { db } from "@/configs/db";
import { Chapters, CourseList } from "@/configs/schema";
import { and, eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import ChapterListCard from "./_components/ChapterListCard";
import ChapterContent from "./_components/ChapterContent";

function CourseStart({ params }) {
  const [course, setCourse] = useState();
  const [selectedChapter, setSelectedChapter] = useState();
  const [chapterContent, setChapterContent] = useState();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to track menu visibility

  useEffect(() => {
    GetCourse();
  }, []);

  /**
   * Used to get Course Info by Course Id
   */
  const GetCourse = async () => {
    const result = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList?.courseId, params?.courseId));

    setCourse(result[0]);
    GetSelectedChapterContent(0);
  };

  const GetSelectedChapterContent = async (chapterId) => {
    const result = await db
      .select()
      .from(Chapters)
      .where(
        and(
          eq(Chapters.chapterId, chapterId),
          eq(Chapters.courseId, course?.courseId)
        )
      );
    setChapterContent(result[0]);
  };

  return (
    <div>
      {/* Hamburger Menu (Mobile only) */}
      <div className="md:hidden p-4 flex justify-between items-center z-50 relative">
        <h2 className="font-medium text-lg bg-primary text-white">
          {course?.courseOutput?.course?.name}
        </h2>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-black focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Overlay when mobile menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-20"
          onClick={() => setIsMenuOpen(false)} // Close the menu when clicking on overlay
        ></div>
      )}

      {/* Sidebar for Desktop and mobile menu */}
      <div
        className={`fixed md:w-64 z-30 bg-white h-screen border-r shadow-sm md:block transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          {course?.courseOutput?.course?.chapters.map((chapter, index) => (
            <div
              key={index}
              className={`cursor-pointer hover:bg-purple-50 
                ${selectedChapter?.name === chapter?.name && "bg-purple-100"}
              `}
              onClick={() => {
                setSelectedChapter(chapter);
                GetSelectedChapterContent(index);
              }}
            >
              <ChapterListCard chapter={chapter} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* Content section */}
      <div
        className={`md:ml-64 ${
          isMenuOpen ? "ml-0" : ""
        } transition-all duration-300`}
      >
        <ChapterContent chapter={selectedChapter} content={chapterContent} />
      </div>
    </div>
  );
}

export default CourseStart;
