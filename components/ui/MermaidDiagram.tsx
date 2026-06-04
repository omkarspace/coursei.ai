'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  code: string;
  id?: string;
}

export function MermaidDiagram({ code, id }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        const diagramId = id || `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(diagramId, code);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvg('');
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">Failed to render diagram: {error}</p>
        <pre className="mt-2 text-xs text-red-500 overflow-x-auto">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div ref={ref} className="mermaid-container my-4" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
