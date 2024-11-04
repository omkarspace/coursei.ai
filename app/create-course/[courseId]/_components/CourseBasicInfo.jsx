import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import { HiOutlinePuzzlePiece } from "react-icons/hi2";
import EditCourseBasicInfo from "./EditCourseBasicInfo";

function CourseBasicInfo({ course }) {
  return (
    <div className="p-10 border rounded-xl shadow-sm mt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ">
        <div>
          <h2 className="font-bold text-2xl">
            {course?.courseOutput?.course?.name} <EditCourseBasicInfo course={course} />
          </h2>
          <p className="text-sm text-gray-400 mt-3">
            {course?.courseOutput?.course?.description}
          </p>
          <h2 className="font-medium mt-2 flex gap-2 items-center text-primary"><HiOutlinePuzzlePiece />{course?.category}</h2>
          <Button className="w-full mt-5">Start</Button>
        </div>
        <div>
          <Image
            src={"/placeholderr.png"}
            width={450}
            height={450}
            className="w-full rounded-xl h-[50px] object-cover"
          />
        </div>
        
      </div>
    </div>
  );
}

export default CourseBasicInfo;
