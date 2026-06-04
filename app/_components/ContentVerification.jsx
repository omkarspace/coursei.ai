'use client';
import React, { useState } from 'react';
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
