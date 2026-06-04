"use client";

import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-css";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/themes/prism-tomorrow.css";

interface CodeEditorProps {
  code: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  className?: string;
  showLineNumbers?: boolean;
}

export function CodeEditor({
  code,
  language = "javascript",
  readOnly = true,
  onChange,
  className = "",
  showLineNumbers = true,
}: CodeEditorProps) {
  const [highlightedCode, setHighlightedCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      try {
        const grammar = Prism.languages[language] ?? Prism.languages.javascript ?? {};
        const highlighted = Prism.highlight(code, grammar as Prism.Grammar, language);
        setHighlightedCode(highlighted);
      } catch {
        setHighlightedCode(code);
      }
    }
  }, [code, language, isEditing]);

  const handleEdit = () => {
    if (!readOnly) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    if (textareaRef.current && onChange) {
      onChange(textareaRef.current.value);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleCancel();
    }
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    // Handle tab key
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      textarea.value = value.substring(0, start) + "  " + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
  };

  const lineCount = (isEditing ? code : code).split("\n").length;

  return (
    <div className={`relative group ${className}`}>
      {/* Language badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className="px-2 py-1 text-xs font-mono bg-gray-700 text-gray-300 rounded">
          {language}
        </span>
      </div>

      {/* Edit button */}
      {!readOnly && !isEditing && (
        <button
          onClick={handleEdit}
          className="absolute top-2 right-16 z-10 px-2 py-1 text-xs bg-blue-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Edit
        </button>
      )}

      {/* Save/Cancel buttons */}
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded"
          >
            Save (Ctrl+S)
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Code display */}
      <div className="relative">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            defaultValue={code}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[200px] p-4 font-mono text-sm bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            spellCheck={false}
          />
        ) : (
          <div className="flex">
            {/* Line numbers */}
            {showLineNumbers && (
              <div className="flex-shrink-0 p-4 text-right select-none bg-gray-900 border-r border-gray-700">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="text-xs text-gray-500 leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>
            )}

            {/* Code content */}
            <pre className="flex-1 p-4 overflow-x-auto bg-gray-900 rounded-r-lg">
              <code
                className={`language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
