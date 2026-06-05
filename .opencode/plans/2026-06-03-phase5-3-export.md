# Phase 5.3: Export to PDF/Markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PDF and Markdown export buttons to the course viewer, allowing users to download chapter content.

**Architecture:** Create client-side export utilities using `html2pdf.js` for PDF and native browser APIs for Markdown. Add export buttons to CourseStartClient.

**Tech Stack:** html2pdf.js (PDF), React, Tailwind CSS

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Modify | `package.json` | Add html2pdf.js dependency |
| Create | `lib/export.ts` | Export utility functions |
| Modify | `app/course/[courseId]/start/_components/CourseStartClient.jsx` | Add export buttons |

---

## Current State

**Chapter content structure:**
```typescript
{
  videoId: string;
  content: Array<{
    title: string;
    explanation: string;  // Markdown
    code: string;
  }>;
}
```

**UI location:** CourseStartClient has tabs (Content, Quiz, Flashcards, Notes, Audio). Export buttons should be added near the tabs or in the content area.

---

## Task 1: Install html2pdf.js Dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

Run: `npm install html2pdf.js`
Expected: Package added to dependencies

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add html2pdf.js for PDF export"
```

---

## Task 2: Create Export Utility Functions

**Files:**
- Create: `lib/export.ts`

- [ ] **Step 1: Create the export utilities**

```typescript
// lib/export.ts

interface ContentBlock {
  title: string;
  explanation: string;
  code?: string;
}

interface ExportData {
  courseName: string;
  chapterName: string;
  chapterAbout: string;
  content: ContentBlock[];
}

/**
 * Generate Markdown content from chapter data
 */
export function generateMarkdown(data: ExportData): string {
  const lines: string[] = [];
  
  lines.push(`# ${data.courseName}`);
  lines.push('');
  lines.push(`## ${data.chapterName}`);
  lines.push('');
  lines.push(data.chapterAbout);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  for (const block of data.content) {
    lines.push(`### ${block.title}`);
    lines.push('');
    lines.push(block.explanation);
    lines.push('');
    
    if (block.code) {
      lines.push('```');
      lines.push(block.code);
      lines.push('```');
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Download content as a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export chapter as Markdown file
 */
export function exportAsMarkdown(data: ExportData) {
  const markdown = generateMarkdown(data);
  const filename = `${data.chapterName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Export chapter as PDF file
 */
export async function exportAsPdf(data: ExportData) {
  // Dynamic import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;
  
  // Generate HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; }
        h2 { color: #2d2d2d; margin-top: 30px; }
        h3 { color: #404040; margin-top: 25px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
        p { margin: 10px 0; }
        hr { border: none; border-top: 1px solid #e5e5e5; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>${data.courseName}</h1>
      <h2>${data.chapterName}</h2>
      <p><em>${data.chapterAbout}</em></p>
      <hr>
      ${data.content.map(block => `
        <h3>${block.title}</h3>
        <div>${block.explanation.replace(/\n/g, '<br>')}</div>
        ${block.code ? `<pre><code>${block.code}</code></pre>` : ''}
      `).join('')}
    </body>
    </html>
  `;
  
  const filename = `${data.chapterName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
  
  await html2pdf()
    .set({
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(html)
    .save();
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/export.ts
git commit -m "feat: add export utility functions for PDF and Markdown"
```

---

## Task 3: Add Export Buttons to CourseStartClient

**Files:**
- Modify: `app/course/[courseId]/start/_components/CourseStartClient.jsx`

- [ ] **Step 1: Add import and export buttons**

Add import at the top:
```javascript
import { exportAsMarkdown, exportAsPdf } from '@/lib/export';
```

Add state for export loading:
```javascript
const [exporting, setExporting] = useState(null);
```

Add export handler functions:
```javascript
const handleExportMarkdown = async () => {
  if (!chapterContent || !selectedChapter) return;
  setExporting('markdown');
  try {
    exportAsMarkdown({
      courseName: course?.courseOutput?.course?.name || 'Course',
      chapterName: selectedChapter.name,
      chapterAbout: selectedChapter.about,
      content: chapterContent.content || [],
    });
  } finally {
    setExporting(null);
  }
};

const handleExportPdf = async () => {
  if (!chapterContent || !selectedChapter) return;
  setExporting('pdf');
  try {
    await exportAsPdf({
      courseName: course?.courseOutput?.course?.name || 'Course',
      chapterName: selectedChapter.name,
      chapterAbout: selectedChapter.about,
      content: chapterContent.content || [],
    });
  } finally {
    setExporting(null);
  }
};
```

Add export buttons in the UI (after the tabs, near the Mark Complete button):
```jsx
{/* Export Buttons */}
{activeTab === 'content' && chapterContent?.content?.length > 0 && (
  <div className="flex gap-2 mb-4">
    <button
      onClick={handleExportMarkdown}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {exporting === 'markdown' ? 'Exporting...' : 'Export Markdown'}
    </button>
    <button
      onClick={handleExportPdf}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
    </button>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/course/[courseId]/start/_components/CourseStartClient.jsx
git commit -m "feat: add PDF and Markdown export buttons to course viewer"
```

---

## Task 4: Add Tests for Export Utilities

**Files:**
- Create: `__tests__/lib/export.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// __tests__/lib/export.test.ts
import { describe, it, expect } from 'vitest';
import { generateMarkdown } from '@/lib/export';

describe('Export Utilities', () => {
  describe('generateMarkdown', () => {
    it('should generate markdown from chapter data', () => {
      const data = {
        courseName: 'Test Course',
        chapterName: 'Chapter 1',
        chapterAbout: 'About this chapter',
        content: [
          {
            title: 'Section 1',
            explanation: 'Explanation text',
            code: 'console.log("hello")',
          },
        ],
      };

      const markdown = generateMarkdown(data);

      expect(markdown).toContain('# Test Course');
      expect(markdown).toContain('## Chapter 1');
      expect(markdown).toContain('About this chapter');
      expect(markdown).toContain('### Section 1');
      expect(markdown).toContain('Explanation text');
      expect(markdown).toContain('```');
      expect(markdown).toContain('console.log("hello")');
    });

    it('should handle empty content', () => {
      const data = {
        courseName: 'Test Course',
        chapterName: 'Chapter 1',
        chapterAbout: 'About',
        content: [],
      };

      const markdown = generateMarkdown(data);

      expect(markdown).toContain('# Test Course');
      expect(markdown).toContain('## Chapter 1');
    });

    it('should handle content without code', () => {
      const data = {
        courseName: 'Test Course',
        chapterName: 'Chapter 1',
        chapterAbout: 'About',
        content: [
          {
            title: 'Section 1',
            explanation: 'Text only',
          },
        ],
      };

      const markdown = generateMarkdown(data);

      expect(markdown).toContain('### Section 1');
      expect(markdown).toContain('Text only');
      expect(markdown).not.toContain('```');
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm run test __tests__/lib/export.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/export.test.ts
git commit -m "test: add export utility tests"
```

---

## Verification Checklist

After completing all tasks:

- [ ] Run `npm run build` - should succeed
- [ ] Run `npm run test` - all tests pass
- [ ] Run `npx tsc --noEmit` - no type errors
- [ ] Manual test: Export Markdown downloads a .md file
- [ ] Manual test: Export PDF downloads a .pdf file
- [ ] Export buttons only show when content is available

---

## Notes

- `html2pdf.js` is client-side only (uses html2canvas + jsPDF)
- Dynamic import used to avoid SSR issues
- Markdown export uses native browser APIs (no dependency)
- Export buttons appear only on Content tab when content exists
- Filenames are sanitized (special characters removed)
