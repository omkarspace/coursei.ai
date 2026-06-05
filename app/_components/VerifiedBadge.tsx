'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface VerifiedBadgeProps {
  verified: boolean;
  sourceCount?: number;
  className?: string;
}

export function VerifiedBadge({ verified, sourceCount = 0, className }: VerifiedBadgeProps) {
  if (!verified) {
    return (
      <Badge variant="outline" className={className}>
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        Unverified
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={className}>
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      Verified ({sourceCount} sources)
    </Badge>
  );
}

interface SourceListProps {
  sources: {
    title: string;
    url: string;
    snippet: string;
    confidence: number;
  }[];
  className?: string;
}

export function SourceList({ sources, className }: SourceListProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium mb-2">Sources</h4>
      <ul className="space-y-2">
        {sources.map((source, index) => (
          <li key={index} className="text-sm">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              {source.title}
            </a>
            <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{source.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
