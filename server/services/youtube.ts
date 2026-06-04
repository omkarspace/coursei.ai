import axios from 'axios';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { default: { url: string } };
  };
}

export async function getVideos(query: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const params = {
    part: 'snippet',
    q: query,
    maxResults: 1,
    type: 'video',
    key: apiKey,
  };

  try {
    const resp = await axios.get(`${YOUTUBE_BASE_URL}/search`, { params });
    return resp.data.items || [];
  } catch (error) {
    console.error('YouTube API error:', error);
    return [];
  }
}
