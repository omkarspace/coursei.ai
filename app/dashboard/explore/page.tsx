"use client";
import { getAllPublishedCourses, getPublishedCoursesWithFilters } from "@/app/actions/course";
import React, { useEffect, useState, useCallback } from "react";
import CourseCard from "../_components/CourseCard";
import CourseFilters from "../_components/CourseFilters";

interface Course {
  courseId: string;
  name: string;
  category: string;
  level: string;
  courseBanner: string | null;
  createdBy: string;
  userName: string | null;
  publish: boolean | null;
  score?: number;
}

function Explore() {
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSource, setSearchSource] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch courses based on search or pagination
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      GetAllCourse();
    }
  }, [pageIndex, debouncedQuery, selectedCategory, selectedLevel]);

  const GetAllCourse = async () => {
    setIsSearching(true);
    try {
      const result = await getPublishedCoursesWithFilters(pageIndex, 9, selectedCategory || undefined, selectedLevel || undefined);
      setCourseList(result || []);
      setSearchSource(null);
    } finally { setIsSearching(false); }
  };

  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=12`
      );
      const data = await response.json();
      setCourseList(data.results || []);
      setSearchSource(data.source || "unknown");
    } catch (error) {
      console.error("Search failed:", error);
      setCourseList([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPageIndex(0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setPageIndex(0);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="font-bold text-3xl">Explore More Projects</h2>
          <p className="text-muted-foreground">
            Explore projects built by AI from other users
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search courses by name, category, or topic..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          {searchSource && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {searchSource === "vector" ? "Semantic search" : "Text search"}
            </span>
          )}
        </div>
      </div>

      {!searchQuery && (
        <CourseFilters
          selectedCategory={selectedCategory}
          onCategoryChange={(val: string) => { setSelectedCategory(val); setPageIndex(0); }}
          selectedLevel={selectedLevel}
          onLevelChange={(val: string) => { setSelectedLevel(val); setPageIndex(0); }}
        />
      )}

      {isSearching ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : courseList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No courses found matching your search."
              : "No courses available yet."}
          </p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="text-primary underline-offset-4 hover:underline mt-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {courseList.map((course, index) => (
            <div key={course.courseId || index}>
              <CourseCard course={course} displayUser={true} refreshData={() => {}} />
            </div>
          ))}
        </div>
      )}

      {!searchQuery && (
        <div className="flex justify-between mt-5">
          {pageIndex !== 0 && (
            <button
              onClick={() => setPageIndex(pageIndex - 1)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              Previous Page
            </button>
          )}
          <button
            onClick={() => setPageIndex(pageIndex + 1)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Next Page
          </button>
        </div>
      )}
    </div>
  );
}

export default Explore;
