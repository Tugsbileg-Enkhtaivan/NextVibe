import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  channelTitle: string;
  publishedAt: string;
}

interface YouTubeVideoItem {
  id: { videoId: string };
  snippet: YouTubeVideoSnippet;
}

interface YouTubeSearchResponse {
  items: YouTubeVideoItem[];
}

/**
 * Search for YouTube videos
 * @param query Search query
 * @param maxResults Maximum number of results to return (default: 1)
 * @returns Array of YouTube video results
 */
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 1
): Promise<YouTubeVideoItem[]> => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const response = await axios.get<YouTubeSearchResponse>(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        maxResults,
        q: query,
        key: YOUTUBE_API_KEY,
        type: 'video',
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      }
    });

    return response.data.items;
  } catch (error: any) {
    console.error('YouTube API error:', error.response?.data || error.message);
    throw new Error(`YouTube search failed: ${error.message}`);
  }
};

/**
 * Get embed URL for a YouTube video
 * @param videoId YouTube video ID
 * @returns Embed URL for the video
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const searchYouTubeViaSerpAPI = async (query: string) => {
  const url = `https://serpapi.com/search`;
  const response = await axios.get(url, {
    params: {
      engine: 'youtube',
      q: query,
      api_key: SERPAPI_KEY,
    }
  });

  const video = response.data.video_results?.[0];
  if (!video) throw new Error('No video found');

  return {
    videoId: video.video_id,
    title: video.title,
    url: video.link,
    thumbnail: video.thumbnail,
  };
};
