'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { MermaidDiagram } from '@/app/_components/MermaidDiagram';
import { CodeEditor } from '@/app/_components/CodeEditor';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-gray dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom code block renderer for Mermaid and code
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            // Mermaid diagrams
            if (language === 'mermaid') {
              return <MermaidDiagram code={codeString} />;
            }

            // Regular code blocks with syntax highlighting
            if (match) {
              return (
                <CodeEditor
                  code={codeString}
                  language={language}
                  readOnly={true}
                  showLineNumbers={codeString.split('\n').length > 3}
                />
              );
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Enhanced tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  {children}
                </table>
              </div>
            );
          },

          // Enhanced blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
                {children}
              </blockquote>
            );
          },

          // Enhanced lists
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>;
          },

          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>;
          },

          // Enhanced headings
          h1({ children }) {
            return (
              <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
                {children}
              </h1>
            );
          },

          h2({ children }) {
            return (
              <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
                {children}
              </h2>
            );
          },

          h3({ children }) {
            return (
              <h3 className="text-xl font-medium mt-4 mb-2 text-gray-900 dark:text-white">
                {children}
              </h3>
            );
          },

          // Enhanced links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            );
          },

          // Enhanced images
          img({ src, alt }) {
            return (
              <figure className="my-4">
                <img src={src} alt={alt} className="rounded-lg shadow-md max-w-full" />
                {alt && (
                  <figcaption className="text-center text-sm text-gray-500 mt-2">{alt}</figcaption>
                )}
              </figure>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
