/**
 * Wikipedia API integration
 * Fetches supplementary content for courses
 */

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/api/rest_v1";

interface WikipediaSummary {
  title: string;
  extract: string;
  description: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
}

interface WikipediaSearchResult {
  title: string;
  pageid: number;
  snippet: string;
}

/**
 * Get a summary for a Wikipedia article
 */
export async function getWikipediaSummary(
  topic: string
): Promise<WikipediaSummary | null> {
  try {
    const encodedTopic = encodeURIComponent(topic);
    const response = await fetch(
      `${WIKIPEDIA_API_URL}/page/summary/${encodedTopic}`,
      {
        headers: {
          "User-Agent": "CourseiAI/1.0 (https://coursei.ai; coursei@example.com)",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Wikipedia summary error:", error);
    return null;
  }
}

/**
 * Search Wikipedia for articles matching a query
 */
export async function searchWikipedia(
  query: string,
  limit = 5
): Promise<WikipediaSearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&srlimit=${limit}&format=json&origin=*`,
      {
        headers: {
          "User-Agent": "CourseiAI/1.0 (https://coursei.ai; coursei@example.com)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Wikipedia search error: ${response.status}`);
    }

    const data = await response.json();
    return data.query?.search || [];
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return [];
  }
}

/**
 * Get related Wikipedia articles for a course topic
 */
export async function getRelatedArticles(
  topic: string,
  limit = 3
): Promise<{ title: string; url: string; snippet: string }[]> {
  const searchResults = await searchWikipedia(topic, limit);

  return searchResults.map((result) => ({
    title: result.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
    snippet: result.snippet.replace(/<\/?span[^>]*>/g, ""),
  }));
}
