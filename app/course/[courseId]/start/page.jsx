"use client";
import { db } from "@/configs/db";
import { Chapters, CourseList } from "@/configs/schema";
import { and, eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import ChapterListCard from "./_components/ChapterListCard";
import ChapterContent from "./_components/ChapterContent";
import dynamic from "next/dynamic";

const QuizGenerator = dynamic(() => import("@/app/_components/QuizGenerator"), {
  loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />,
  ssr: false,
});

const Flashcards = dynamic(() => import("@/app/_components/Flashcards"), {
  loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />,
  ssr: false,
});

const StudyNotes = dynamic(() => import("@/app/_components/StudyNotes"), {
  loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />,
  ssr: false,
});

function CourseStart({ params }) {
  const [course, setCourse] = useState();
  const [selectedChapter, setSelectedChapter] = useState();
  const [chapterContent, setChapterContent] = useState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    GetCourse();
  }, []);

  const GetCourse = async () => {
    const result = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList?.courseId, params?.courseId));

    setCourse(result[0]);
    GetSelectedChapterContent(0);
  };

  const GetSelectedChapterContent = async (chapterId) => {
    if (!course?.courseId) return;
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

  const tabs = [
    { id: "content", label: "Content" },
    { id: "quiz", label: "Quiz" },
    { id: "flashcards", label: "Flashcards" },
    { id: "notes", label: "Study Notes" },
  ];

  return (
    <div className="min-h-screen dark:bg-gray-950">
      {/* Hamburger Menu (Mobile only) */}
      <div className="md:hidden p-4 flex justify-between items-center z-50 relative dark:bg-gray-900">
        <h2 className="font-medium text-lg bg-primary text-white px-3 py-1 rounded">
          {course?.courseOutput?.course?.name}
        </h2>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-black dark:text-white focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Overlay when mobile menu is open */}
      {isMenuOpen ? (
        <div
          className="fixed inset-0 bg-black opacity-50 z-20"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      {/* Sidebar for Desktop and mobile menu */}
      <div
        className={`fixed md:w-64 z-30 bg-white dark:bg-gray-900 h-screen border-r dark:border-gray-700 shadow-sm md:block transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="font-medium text-lg truncate dark:text-white">
            {course?.courseOutput?.course?.name}
          </h2>
        </div>
        <div className="overflow-y-auto">
          {course?.courseOutput?.course?.chapters.map((chapter, index) => (
            <div
              key={index}
              className={`cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 
                ${selectedChapter?.name === chapter?.name ? "bg-purple-100 dark:bg-purple-900/30" : ""}
              `}
              onClick={() => {
                setSelectedChapter(chapter);
                GetSelectedChapterContent(index);
                setActiveTab("content");
                setIsMenuOpen(false);
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
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b dark:border-gray-700 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "content" ? (
            <ChapterContent chapter={selectedChapter} content={chapterContent} />
          ) : activeTab === "quiz" && selectedChapter ? (
            <QuizGenerator
              courseId={course?.courseId}
              chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
              chapterName={selectedChapter?.name}
              chapterContent={chapterContent}
            />
          ) : activeTab === "flashcards" && selectedChapter ? (
            <Flashcards
              courseId={course?.courseId}
              chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
              chapterName={selectedChapter?.name}
              chapterContent={chapterContent}
            />
          ) : activeTab === "notes" && selectedChapter ? (
            <StudyNotes
              courseId={course?.courseId}
              chapterId={course?.courseOutput?.course?.chapters.indexOf(selectedChapter)}
              chapterName={selectedChapter?.name}
              chapterContent={chapterContent}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default CourseStart;
