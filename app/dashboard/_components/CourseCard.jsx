import Image from "next/image";
import React from "react";
import { HiMiniEllipsisVertical, HiOutlineBookOpen } from "react-icons/hi2";
import DropDownOption from "./DropDownOption";
import { db } from "@/configs/db";
import { CourseList } from "@/configs/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

function CourseCard({ course, refreshData, displayUser = false }) {
  const handleOnDelete = async () => {
    const resp = await db
      .delete(CourseList)
      .where(eq(CourseList.id, course?.id))
      .returning({ id: CourseList?.id });

    if (resp) {
      refreshData();
    }
  };

  return (
    <div
      className="shadow-sm rounded-lg border p-4 cursor-pointer mt-4 bg-gray-50 hover:border-gray-400 transition-all duration-200"
    >
      <Link href={"/course/" + course?.courseId}>
        <Image
          src={course?.courseBanner}
          width={500} // Increase width for desktop
          height={300} // Adjust height for desktop
          className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] object-cover rounded-lg" // Responsive height adjustments for mobile to desktop
          alt="course image"
        />
      </Link>
      <div className="p-2">
        <h2 className="font-medium text-lg flex justify-between items-center">
          {course?.courseOutput?.course?.name}

          {!displayUser && (
            <DropDownOption handleOnDelete={() => handleOnDelete()}>
              <HiMiniEllipsisVertical />
            </DropDownOption>
          )}
        </h2>
        <p className="text-sm text-gray-400 my-1">{course?.category}</p>
        <div className="flex items-center justify-between">
          <h2 className="flex gap-2 items-center p-1 bg-purple-50 text-primary text-xs sm:text-sm md:text-base rounded-sm">
            <HiOutlineBookOpen />
            {course?.courseOutput?.course?.noOfChapters} Chapters
          </h2>
          <h2 className="text-xs sm:text-sm md:text-base bg-purple-50 text-primary p-1 rounded-sm">
            {course?.level}
          </h2>
        </div>

        {displayUser && (
          <div className="flex gap-2 items-center mt-2">
            <Image
              src={course?.userProfileImage}
              width={35}
              height={35}
              className="rounded-full"
              alt="profile image"
            />
            <h2 className="text-sm">{course?.userName}</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseCard;
