import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Search for YouTube videos matching the query
 * @param query Search query
 * @param maxResults Maximum number of results to return (default: 1)
 * @returns Array of YouTube video results
 */
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 1
): Promise<any[]> => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        maxResults,
        q: query,
        key: YOUTUBE_API_KEY,
        type: 'video',
        videoEmbeddable: true,
        videoSyndicated: true
      }
    });

    if (response.data && response.data.items) {
      return response.data.items;
    }

    return [];
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