"use client";
import React, { useState } from "react";
import { generateCourseBannerAction } from "@/app/actions/ai";
import { updateCourseBanner } from "@/app/actions/course";
import { toast } from "sonner";
import { HiOutlineSparkles } from "react-icons/hi2";

export default function AiBannerButton({ courseId, courseName, category, onBannerGenerated }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const bannerUrl = await generateCourseBannerAction(courseName, category);
      if (bannerUrl) {
        await updateCourseBanner(courseId, bannerUrl);
        toast.success("AI banner generated!");
        onBannerGenerated?.(bannerUrl);
      } else {
        toast.error("Failed to generate banner. Check FAL_KEY environment variable.");
      }
    } catch (error) {
      console.error("Banner generation error:", error);
      toast.error("Failed to generate banner");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
    >
      <HiOutlineSparkles className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
      {generating ? "Generating..." : "Generate AI Banner"}
    </button>
  );
}
