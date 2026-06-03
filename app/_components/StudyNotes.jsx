"use client";
import React, { useState, useEffect } from "react";
import { HiOutlineDocumentText, HiArrowPath } from "react-icons/hi2";
import { GenerateStudyNotes_AI } from "@/configs/AiModel";
import { saveStudyNotes, getStudyNotes } from "@/app/actions/course";
import { toast } from "sonner";

function StudyNotes({ courseId, chapterId, chapterName, chapterContent }) {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudyNotes();
  }, [courseId, chapterId]);

  const loadStudyNotes = async () => {
    const existing = await getStudyNotes(courseId, chapterId);
    if (existing) {
      setNotes(existing.notes);
    }
  };

  const generateStudyNotes = async () => {
    setLoading(true);
    try {
      const contentText = chapterContent?.content
        ?.map((c) => c.explanation)
        .join("\n") || chapterName;

      const PROMPT = `Generate concise study notes for the following chapter. Return in JSON format with fields: summary (2-3 paragraph overview), keyPoints (array of 5-7 main takeaways), and importantTerms (array of objects with term and definition). Chapter: ${chapterName}, Content: ${contentText.substring(0, 2000)}`;

      const result = await GenerateStudyNotes_AI.sendMessage(PROMPT);
      const response = JSON.parse(result.response.text());
      setNotes(response);
      await saveStudyNotes(courseId, chapterId, response);
      toast.success("Study notes generated successfully!");
    } catch (error) {
      console.error("Error generating study notes:", error);
      toast.error("Failed to generate study notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!notes) {
    return (
      <div className="border dark:border-gray-700 rounded-lg p-6 mt-4 dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <HiOutlineDocumentText className="h-6 w-6 text-primary" />
          <h3 className="font-medium text-lg dark:text-white">Study Notes</h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Generate AI-powered study notes with summaries, key points, and important terms.
        </p>
        <button
          onClick={generateStudyNotes}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Generating Notes..." : "Generate Study Notes"}
        </button>
      </div>
    );
  }

  return (
    <div className="border dark:border-gray-700 rounded-lg p-6 mt-4 dark:bg-gray-900">
      <div className="flex items-center gap-3 mb-6">
        <HiOutlineDocumentText className="h-6 w-6 text-primary" />
        <h3 className="font-medium text-lg dark:text-white">Study Notes</h3>
        <button
          onClick={generateStudyNotes}
          disabled={loading}
          aria-label="Regenerate study notes"
          className="ml-auto px-3 py-1 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          <HiArrowPath className="h-3 w-3" />
          Regenerate
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">Summary</h4>
          <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300">
            {notes.summary}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">Key Points</h4>
          <ul className="space-y-2">
            {notes.keyPoints?.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-medium mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-600 dark:text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">Important Terms</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {notes.importantTerms?.map((item, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <dt className="font-medium text-primary">{item.term}</dt>
                <dd className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.definition}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyNotes;
