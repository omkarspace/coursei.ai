"use client";
import React, { useState, useEffect } from "react";
import { getWikipediaContent } from "@/app/actions/content";
import { HiOutlineBookOpen, HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";

export default function WikipediaSidebar({ chapterName, courseName }) {
  const [wikiData, setWikiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (chapterName) {
      fetchWikipedia();
    }
  }, [chapterName]);

  const fetchWikipedia = async () => {
    setLoading(true);
    try {
      const data = await getWikipediaContent(chapterName);
      setWikiData(data);
    } catch (error) {
      console.error("Wikipedia fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border dark:border-gray-700 rounded-lg p-4 dark:bg-gray-900">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!wikiData || (!wikiData.summary && wikiData.related.length === 0)) {
    return null;
  }

  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <HiOutlineBookOpen className="h-5 w-5 text-gray-500" />
        <h4 className="font-medium text-sm dark:text-white">Related Wikipedia Articles</h4>
      </div>

      {wikiData.summary && (
        <div className="mb-3">
          <a
            href={wikiData.summary.content_urls?.desktop?.page || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            {wikiData.summary.title}
            <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
          </a>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3">
            {wikiData.summary.extract}
          </p>
        </div>
      )}

      {wikiData.related.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {expanded ? "Show less" : `+${wikiData.related.length} related articles`}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-2">
              {wikiData.related.map((article, i) => (
                <li key={i}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {article.title}
                    <HiOutlineArrowTopRightOnSquare className="h-2.5 w-2.5" />
                  </a>
                  <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                    {article.snippet}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
