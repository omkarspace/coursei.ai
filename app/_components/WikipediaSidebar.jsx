'use client';
import React, { useState, useEffect, useRef } from 'react';
import { getWikipediaContent, searchWikipediaContent } from '@/app/actions/content';
import {
  HiOutlineBookOpen,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from 'react-icons/hi2';

export default function WikipediaSidebar({ chapterName, courseName }) {
  const [wikiData, setWikiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

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
      console.error('Wikipedia fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchWikipediaContent(searchQuery.trim());
        setSearchResults(results || []);
      } catch (error) {
        console.error('Wikipedia search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

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

  const hasContext = wikiData && (wikiData.summary || (wikiData.related && wikiData.related.length > 0));
  const hasSearch = searchResults && searchResults.length > 0;

  if (!hasContext && !hasSearch && !searching) {
    return null;
  }

  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 dark:bg-gray-900 space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineBookOpen className="h-5 w-5 text-gray-500" />
        <h4 className="font-medium text-sm dark:text-white">Related Wikipedia Articles</h4>
      </div>

      <div className="relative">
        <HiOutlineMagnifyingGlass
          className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Wikipedia..."
          aria-label="Search Wikipedia"
          className="w-full h-8 pl-8 pr-8 text-sm rounded-md border border-input bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasContext && (
        <div>
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            From this chapter
          </h5>
          {wikiData.summary && (
            <div className="mb-3">
              <a
                href={wikiData.summary.content_urls?.desktop?.page || '#'}
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

          {wikiData.related && wikiData.related.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {expanded ? 'Show less' : `+${wikiData.related.length} related articles`}
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
      )}

      {(hasSearch || searching) && (
        <div>
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Search results
          </h5>
          {searching && !hasSearch ? (
            <p className="text-xs text-gray-400">Searching...</p>
          ) : hasSearch ? (
            <ul className="space-y-2">
              {searchResults.map((article, i) => (
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
                  {article.snippet && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                      {article.snippet}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">No results found.</p>
          )}
        </div>
      )}
    </div>
  );
}
