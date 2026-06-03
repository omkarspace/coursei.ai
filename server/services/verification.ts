/**
 * Tavily verification service
 * Verifies course content against web sources
 */

const TAVILY_API_URL = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface VerificationResult {
  verified: boolean;
  sources: {
    title: string;
    url: string;
    snippet: string;
    confidence: number;
  }[];
  query: string;
}

function isTavilyEnabled(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

/**
 * Verify a claim or topic using Tavily search
 */
export async function verifyWithTavily(
  query: string,
  maxResults = 5
): Promise<VerificationResult> {
  if (!isTavilyEnabled()) {
    return {
      verified: false,
      sources: [],
      query,
    };
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    const sources = (data.results || []).map((result: TavilyResult) => ({
      title: result.title,
      url: result.url,
      snippet: result.content.slice(0, 200),
      confidence: result.score,
    }));

    return {
      verified: sources.length > 0 && sources.some((s: { confidence: number }) => s.confidence > 0.5),
      sources,
      query,
    };
  } catch (error) {
    console.error("Tavily verification error:", error);
    return {
      verified: false,
      sources: [],
      query,
    };
  }
}

/**
 * Verify multiple topics in batch (capped at 5 per course)
 */
export async function verifyCourseTopics(
  topics: string[],
  maxQueries = 5
): Promise<Map<string, VerificationResult>> {
  const results = new Map<string, VerificationResult>();

  const topicsToVerify = topics.slice(0, maxQueries);

  for (const topic of topicsToVerify) {
    const result = await verifyWithTavily(topic);
    results.set(topic, result);
  }

  return results;
}

/**
 * Check if Tavily is configured
 */
export function isTavilyConfigured(): boolean {
  return isTavilyEnabled();
}
