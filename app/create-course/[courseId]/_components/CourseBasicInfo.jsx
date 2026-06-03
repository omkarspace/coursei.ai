"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { HiOutlinePuzzlePiece } from "react-icons/hi2";
import EditCourseBasicInfo from "./EditCourseBasicInfo";
import { updateCourseBanner } from "@/app/actions/course";
import Link from "next/link";
import { toast } from "sonner";

function CourseBasicInfo({ course, refreshData, edit = true }) {
  const [selectedFile, setSelectedFile] = useState();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (course) {
      setSelectedFile(course?.courseBanner);
    }
  }, [course]);

  const onFileSelected = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) {
        await updateCourseBanner(course?.courseId, data.secure_url);
        toast.success("Banner updated successfully!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 border dark:border-gray-700 rounded-xl shadow-sm dark:bg-gray-900 mt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h2 className="font-bold text-2xl dark:text-white">
            {course?.courseOutput?.course?.name}{" "}
            {edit && (
              <EditCourseBasicInfo
                course={course}
                refreshData={() => refreshData(true)}
              />
            )}
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            {course?.courseOutput?.course?.description}
          </p>
          <h2 className="font-medium mt-2 flex gap-2 items-center text-primary">
            <HiOutlinePuzzlePiece />
            {course?.category}
          </h2>
          {!edit && (
            <Link href={"/course/" + course?.courseId + "/start"}>
              <Button className="w-full mt-5">Start</Button>
            </Link>
          )}
        </div>
        <div>
          <label htmlFor="upload-image" className="cursor-pointer block">
            <Image
              src={selectedFile ? selectedFile : "/placeholderr.png"}
              width={300}
              height={200}
              className="w-full rounded-xl h-[200px] md:h-[300px] object-cover"
              alt="Course banner"
            />
            {uploading && (
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                <p className="text-sm text-gray-400">Uploading...</p>
              </div>
            )}
          </label>
          <input
            type="file"
            id="upload-image"
            className="opacity-0"
            accept="image/*"
            onChange={onFileSelected}
            aria-label="Upload course banner"
          />
        </div>
      </div>
    </div>
  );
}

export default CourseBasicInfo;
