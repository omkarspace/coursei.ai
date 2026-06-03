"use client";
import { getCourseRatingSummary } from "@/app/actions/rating";
import RatingDialog from "@/app/dashboard/_components/RatingDialog";
import { HiStar, HiOutlineStar } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function CourseRating({ courseId }) {
  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });

  useEffect(() => {
    getCourseRatingSummary(courseId).then(setRatingSummary);
  }, [courseId]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= Math.round(ratingSummary.average) ? (
            <HiStar key={star} className="w-5 h-5 text-yellow-500" />
          ) : (
            <HiOutlineStar key={star} className="w-5 h-5 text-gray-300 dark:text-gray-600" />
          )
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
          {ratingSummary.average > 0
            ? `${ratingSummary.average.toFixed(1)} (${ratingSummary.count} rating${ratingSummary.count !== 1 ? "s" : ""})`
            : "No ratings yet"}
        </span>
      </div>
      <RatingDialog courseId={courseId}>
        <Button variant="outline" size="sm">Rate this Course</Button>
      </RatingDialog>
    </div>
  );
}
