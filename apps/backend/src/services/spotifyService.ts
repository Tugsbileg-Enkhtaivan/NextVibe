import express from 'express';
import axios from 'axios';
import qs from 'querystring';
import { PrismaClient } from '@prisma/client';
import { requireClerkAuth } from '../middlewares/requireClerkAuth';

const prisma = new PrismaClient();
const router = express.Router();

// Global variable to store app-level Spotify token
let appAccessToken: string | null = null;
let appTokenExpiry: number = 0;

const scope = [
  'user-read-recently-played',
  'user-library-read',
  'user-library-modify',
  'playlist-modify-public',
].join(' ');

// AUTHENTICATION ROUTES
// Step 1: Redirect to Spotify Auth
router.get('/login', requireClerkAuth, (req, res) => {
  const params = qs.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Step 2: Spotify callback
router.get('/callback', requireClerkAuth, async (req, res) => {
  const code = req.query.code as string;
  const userId = req.userId;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or user ID' });
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

    const { access_token, refresh_token, expires_in } = response.data;
    const expires_at = Date.now() + expires_in * 1000;

    // Store in DB
    await prisma.spotifyAccount.upsert({
      where: { userId },
      update: { accessToken: access_token, refreshToken: refresh_token, expiresAt: expires_at },
      create: { userId, accessToken: access_token, refreshToken: refresh_token, expiresAt: expires_at },
    });

    res.redirect('/dashboard'); // Or your frontend route
  } catch (err: any) {
    console.error('Spotify callback error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Spotify authentication failed' });
  }
});

// Step 3: Get valid token (auto-refresh if expired)
router.get('/token', requireClerkAuth, async (req, res) => {
  const userId = req.userId;
  const account = await prisma.spotifyAccount.findUnique({ where: { userId } });

  if (!account) {
    return res.status(404).json({ error: 'Spotify not connected' });
  }

  if (Date.now() < Number(account.expiresAt)) {
    return res.json({ token: account.accessToken });
  }

  // Refresh the token
  try {
    const refreshRes = await axios.post('https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

    const { access_token, expires_in } = refreshRes.data;
    const newExpiresAt = Date.now() + expires_in * 1000;

    await prisma.spotifyAccount.update({
      where: { userId },
      data: { accessToken: access_token, expiresAt: newExpiresAt },
    });

    res.json({ token: access_token });
  } catch (err: any) {
    console.error('Token refresh failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// SERVICE FUNCTIONS
/**
 * Authenticate with Spotify using Client Credentials flow
 * This is used for searching tracks/albums without user authentication
 */
export const authenticateSpotify = async (): Promise<string> => {
  // Return existing token if still valid
  if (appAccessToken && Date.now() < appTokenExpiry) {
    return appAccessToken;
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    const { access_token, expires_in } = response.data;
    appAccessToken = access_token;
    appTokenExpiry = Date.now() + (expires_in - 60) * 1000; // Subtract 60s for safety

    return access_token;
  } catch (error: any) {
    console.error('Spotify authentication error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify');
  }
};

/**
 * Get user's Spotify access token from database
 */
export const getUserSpotifyToken = async (userId: string): Promise<string | null> => {
  try {
    const account = await prisma.spotifyAccount.findUnique({ 
      where: { userId } 
    });

    if (!account) {
      return null;
    }

    // Check if token is still valid
    if (Date.now() < Number(account.expiresAt)) {
      return account.accessToken;
    }

    // Token expired, try to refresh
    if (account.refreshToken) {
      try {
        const refreshResponse = await axios.post(
          'https://accounts.spotify.com/api/token',
          qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        const { access_token, expires_in } = refreshResponse.data;
        const newExpiresAt = Date.now() + expires_in * 1000;

        await prisma.spotifyAccount.update({
          where: { userId },
          data: { 
            accessToken: access_token, 
            expiresAt: newExpiresAt 
          },
        });

        return access_token;
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user Spotify token:', error);
    return null;
  }
};

/**
 * Search for tracks on Spotify
 */
export const searchTracks = async (
  query: string, 
  limit: number = 50
): Promise<SpotifyApi.SearchResponse> => {
  const token = await authenticateSpotify();
  
  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: query,
        type: 'track',
        limit,
        market: 'US', // You can make this configurable
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Spotify track search error:', error.response?.data || error.message);
    throw new Error(`Failed to search tracks: ${error.message}`);
  }
};

/**
 * Search for albums on Spotify
 */
export const searchAlbums = async (
  query: string, 
  limit: number = 50
): Promise<SpotifyApi.SearchResponse> => {
  const token = await authenticateSpotify();
  
  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: query,
        type: 'album',
        limit,
        market: 'US', // You can make this configurable
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Spotify album search error:', error.response?.data || error.message);
    throw new Error(`Failed to search albums: ${error.message}`);
  }
};

/**
 * Get user's recently played tracks
 */
export const getUserRecentlyPlayed = async (
  userId: string,
  limit: number = 50
): Promise<SpotifyApi.PlayHistoryObject[]> => {
  const userToken = await getUserSpotifyToken(userId);
  
  if (!userToken) {
    throw new Error('User Spotify token not available');
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      params: {
        limit,
      },
    });

    return response.data.items || [];
  } catch (error: any) {
    console.error('Spotify recently played error:', error.response?.data || error.message);
    throw new Error(`Failed to get recently played tracks: ${error.message}`);
  }
};

/**
 * Get a specific track by ID
 */
export const getTrackById = async (trackId: string): Promise<SpotifyApi.TrackObjectFull | null> => {
  const token = await authenticateSpotify();
  
  try {
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        market: 'US',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Spotify get track error:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Get a specific album by ID
 */
export const getAlbumById = async (albumId: string): Promise<SpotifyApi.AlbumObjectFull | null> => {
  const token = await authenticateSpotify();
  
  try {
    const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        market: 'US',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Spotify get album error:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Get recommendations from Spotify
 */
export const getSpotifyRecommendations = async (
  seedTracks?: string[],
  seedArtists?: string[],
  seedGenres?: string[],
  targetAttributes?: {
    target_valence?: number;
    target_energy?: number;
    target_danceability?: number;
    target_acousticness?: number;
  },
  limit: number = 20
): Promise<SpotifyApi.RecommendationsObject | null> => {
  const token = await authenticateSpotify();
  
  try {
    const params: any = { limit };
    
    if (seedTracks?.length) params.seed_tracks = seedTracks.slice(0, 5).join(',');
    if (seedArtists?.length) params.seed_artists = seedArtists.slice(0, 5).join(',');
    if (seedGenres?.length) params.seed_genres = seedGenres.slice(0, 5).join(',');
    
    if (targetAttributes) {
      Object.assign(params, targetAttributes);
    }

    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    return response.data;
  } catch (error: any) {
    console.error('Spotify recommendations error:', error.response?.data || error.message);
    return null;
  }
};

export default router;