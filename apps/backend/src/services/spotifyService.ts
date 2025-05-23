import express from 'express';
import axios from 'axios';
import qs from 'querystring';
import { PrismaClient } from '@prisma/client';
import { requireClerkAuth } from '../middlewares/requireClerkAuth';

const prisma = new PrismaClient();
const router = express.Router();

let appAccessToken: string | null = null;
let appTokenExpiry: number = 0;

const scope = [
  'user-read-recently-played',
  'user-library-read',
  'user-library-modify',
  'playlist-modify-public',
].join(' ');

router.get('/login', requireClerkAuth, (req, res) => {
  const params = qs.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

router.get('/callback', requireClerkAuth, async (req, res) => {
  const code = req.query.code as string;
  const userId = req.userId;

  if (!code || !userId) {
    res.status(400).json({ error: 'Missing code or user ID' });
    return;
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
    const expires_at = new Date(Date.now() + expires_in * 1000);

    // Get user profile from Spotify to get the spotifyId
    const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { id: spotifyId, display_name, email, country } = profileResponse.data;

    // Check if account exists first
    const existingAccount = await prisma.spotifyAccount.findUnique({
      where: { userId }
    });

    if (existingAccount) {
      await prisma.spotifyAccount.update({
        where: { userId },
        data: {
          spotifyId,
          displayName: display_name,
          email,
          country,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expires_at
        }
      });
    } else {
      await prisma.spotifyAccount.create({
        data: {
          userId,
          spotifyId,
          displayName: display_name,
          email,
          country,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expires_at
        }
      });
    }

    res.redirect('/dashboard'); 
  } catch (err: any) {
    console.error('Spotify callback error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Spotify authentication failed' });
  }
});

router.get('/token', requireClerkAuth, async (req, res) => {
  const userId = req.userId;
  
  try {
    const account = await prisma.spotifyAccount.findUnique({ where: { userId } });

    if (!account) {
      res.status(404).json({ error: 'Spotify not connected' });
      return;
    }

    if (Date.now() < account.expiresAt.getTime()) {
      res.json({ token: account.accessToken });
      return;
    }

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
    const newExpiresAt = new Date(Date.now() + expires_in * 1000);

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

export const authenticateSpotify = async (): Promise<string> => {
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
    appTokenExpiry = Date.now() + (expires_in - 60) * 1000; 

    return access_token;
  } catch (error: any) {
    console.error('Spotify authentication error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify');
  }
};

export const getUserSpotifyToken = async (userId: string): Promise<string | null> => {
  try {
    const account = await prisma.spotifyAccount.findUnique({ 
      where: { userId } 
    });

    if (!account) {
      return null;
    }

    if (Date.now() < account.expiresAt.getTime()) {
      return account.accessToken;
    }

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
        const newExpiresAt = new Date(Date.now() + expires_in * 1000);

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
        market: 'US', 
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Spotify track search error:', error.response?.data || error.message);
    throw new Error(`Failed to search tracks: ${error.message}`);
  }
};

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
        market: 'US', 
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Spotify album search error:', error.response?.data || error.message);
    throw new Error(`Failed to search albums: ${error.message}`);
  }
};

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