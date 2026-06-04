# Plan 4: Wikipedia Integration & Content Verification

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich course content with Wikipedia supplementary articles and add Tavily-powered content verification with trust indicators.

**Architecture:** Create server actions that fetch Wikipedia summaries and related articles, display them alongside chapter content. Add a verification endpoint that checks claims against web sources, display results with the existing VerifiedBadge component.

**Tech Stack:** Next.js 15, Wikipedia REST API, Tavily API, React, Tailwind CSS

---

## File Structure

| Action | File                                                            | Purpose                                     |
| ------ | --------------------------------------------------------------- | ------------------------------------------- |
| Create | `app/actions/content.ts`                                        | Server actions for Wikipedia + verification |
| Create | `app/_components/WikipediaSidebar.jsx`                          | Wikipedia related articles sidebar          |
| Create | `app/_components/ContentVerification.jsx`                       | Verification status component               |
| Modify | `app/course/[courseId]/start/_components/CourseStartClient.jsx` | Add Wikipedia sidebar                       |
| Modify | `app/course/[courseId]/start/_components/ChapterContent.jsx`    | Add verification badge                      |
| Create | `app/api/verify/route.ts`                                       | API endpoint for content verification       |

---

### Task 1: Create Content Server Actions

**Files:**

- Create: `app/actions/content.ts`

- [ ] **Step 1: Create content server actions**

```typescript
'use server';

import {
  getWikipediaSummary,
  getRelatedArticles,
  searchWikipedia,
} from '@/server/services/wikipedia';
import { verifyWithTavily, isTavilyConfigured } from '@/server/services/verification';

export async function getWikipediaContent(topic: string) {
  const [summary, related] = await Promise.all([
    getWikipediaSummary(topic),
    getRelatedArticles(topic, 3),
  ]);
  return { summary, related };
}

export async function searchWikipediaContent(query: string) {
  return searchWikipedia(query, 5);
}

export async function verifyContent(query: string) {
  if (!isTavilyConfigured()) {
    return { verified: false, sources: [], query, configured: false };
  }
  const result = await verifyWithTavily(query);
  return { ...result, configured: true };
}
```

---

### Task 2: Create Wikipedia Sidebar Component

**Files:**

- Create: `app/_components/WikipediaSidebar.jsx`

- [ ] **Step 1: Create WikipediaSidebar component**

```jsx
'use client';
import React, { useState, useEffect } from 'react';
import { getWikipediaContent } from '@/app/actions/content';
import { HiOutlineBookOpen, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';

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
      console.error('Wikipedia fetch error:', error);
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

      {wikiData.related.length > 0 && (
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
  );
}
```

---

### Task 3: Create Content Verification Component

**Files:**

- Create: `app/_components/ContentVerification.jsx`

- [ ] **Step 1: Create ContentVerification component**

```jsx
'use client';
import React, { useState, useEffect } from 'react';
import { verifyContent } from '@/app/actions/content';
import { VerifiedBadge, SourceList } from '@/components/ui/VerifiedBadge';
import { HiOutlineShieldCheck } from 'react-icons/hi2';

export default function ContentVerification({ chapterName, contentSummary }) {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await verifyContent(`${chapterName} ${contentSummary}`);
      setVerification(result);
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineShieldCheck className="h-5 w-5 text-gray-500" />
          <h4 className="font-medium text-sm dark:text-white">Content Verification</h4>
        </div>
        <button
          onClick={handleVerify}
          disabled={loading}
          className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : verification ? 'Re-verify' : 'Verify Content'}
        </button>
      </div>

      {verification && (
        <div className="mt-3">
          {!verification.configured ? (
            <p className="text-xs text-gray-400">
              Tavily API not configured. Add TAVILY_API_KEY to enable verification.
            </p>
          ) : (
            <>
              <VerifiedBadge
                verified={verification.verified}
                sourceCount={verification.sources.length}
              />
              {verification.sources.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {expanded ? 'Hide sources' : `View ${verification.sources.length} sources`}
                  </button>
                  {expanded && <SourceList sources={verification.sources} className="mt-2" />}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Task 4: Add Wikipedia Sidebar to Learning View

**Files:**

- Modify: `app/course/[courseId]/start/_components/CourseStartClient.jsx`

- [ ] **Step 1: Import WikipediaSidebar**

```jsx
import WikipediaSidebar from '@/app/_components/WikipediaSidebar';
```

- [ ] **Step 2: Add sidebar below the content**

After the main content area (after the tab content section), add a collapsible sidebar on desktop:

```jsx
{
  /* Wikipedia Sidebar - Desktop */
}
<div className="hidden lg:block w-80 shrink-0">
  <WikipediaSidebar
    chapterName={selectedChapter?.name}
    courseName={course?.courseOutput?.course?.name}
  />
</div>;
```

Wrap the content area and sidebar in a flex container:

```jsx
<div className="flex gap-6">
  <div className="flex-1 min-w-0">
    {/* existing content area */}
  </div>
  <div className="hidden lg:block w-80 shrink-0">
    <WikipediaSidebar ... />
  </div>
</div>
```

---

### Task 5: Add Verification to Chapter Content

**Files:**

- Modify: `app/course/[courseId]/start/_components/ChapterContent.jsx`

- [ ] **Step 1: Import and add ContentVerification**

Add import:

```jsx
import ContentVerification from '@/app/_components/ContentVerification';
```

Add at the bottom of the component, after the content rendering:

```jsx
<ContentVerification
  chapterName={chapter?.name}
  contentSummary={
    content?.content
      ?.map((c) => c.explanation)
      .join(' ')
      .substring(0, 500) || ''
  }
/>
```

---

### Task 6: Create Verify API Endpoint

**Files:**

- Create: `app/api/verify/route.ts`

- [ ] **Step 1: Create verify API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyWithTavily, isTavilyConfigured } from '@/server/services/verification';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    if (!isTavilyConfigured()) {
      return NextResponse.json({ verified: false, sources: [], configured: false });
    }

    const result = await verifyWithTavily(query);
    return NextResponse.json({ ...result, configured: true });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
```

---

### Task 7: Verify and Commit

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 2: Lint check**

Run: `npm run lint 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Wikipedia sidebar and content verification"
```

---

## Summary

After this plan:

1. Each chapter shows **related Wikipedia articles** in a sidebar
2. Wikipedia summary and links displayed for topic enrichment
3. Users can **verify content accuracy** via Tavily web search
4. **VerifiedBadge** shows verification status with source count
5. Source list with links to web sources
6. Graceful degradation when APIs not configured
