import Image from "next/image";
import { HiOutlinePuzzlePiece } from "react-icons/hi2";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CourseShell({ course }) {
  return (
    <div className="p-6 md:p-10 border dark:border-gray-700 rounded-xl shadow-sm dark:bg-gray-900 mt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h2 className="font-bold text-2xl dark:text-white">
            {course?.courseOutput?.course?.name}
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            {course?.courseOutput?.course?.description}
          </p>
          <h2 className="font-medium mt-2 flex gap-2 items-center text-primary">
            <HiOutlinePuzzlePiece />
            {course?.category}
          </h2>
          {course?.createdAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Created {new Date(course.createdAt).toLocaleDateString()}
              {course?.updatedAt && course.updatedAt !== course.createdAt && (
                <> · Updated {new Date(course.updatedAt).toLocaleDateString()}</>
              )}
            </p>
          )}
          <Link href={"/course/" + course?.courseId + "/start"}>
            <Button className="w-full mt-5">Start</Button>
          </Link>
        </div>
        <div>
          <Image
            src={course?.courseBanner || "/placeholderr.png"}
            width={300}
            height={200}
            className="w-full rounded-xl h-[200px] md:h-[300px] object-cover"
            alt="Course banner"
          />
        </div>
      </div>
    </div>
  );
}
