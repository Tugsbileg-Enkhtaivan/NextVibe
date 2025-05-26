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

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type SpotifyPagingObject<T> = {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: T[];
};

type SpotifyArtist = {
  id: string;
  name: string;
  href: string;
  external_urls: { spotify: string };
  uri: string;
  type: 'artist';
};

type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

type SpotifyAlbumSimplified = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  external_urls: { spotify: string };
  href: string;
  uri: string;
  type: 'album';
  album_type: 'album' | 'single' | 'compilation';
  available_markets?: string[];
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbumSimplified;
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url: string | null;
  popularity: number;
  href: string;
  uri: string;
  type: 'track';
  track_number: number;
  disc_number: number;
  explicit: boolean;
  is_local: boolean;
  available_markets?: string[];
};

// This is the complete Spotify Web API search response structure
type SpotifySearchResponse = {
  tracks?: SpotifyPagingObject<SpotifyTrack>;
  albums?: SpotifyPagingObject<SpotifyAlbumSimplified>;
  artists?: SpotifyPagingObject<SpotifyArtist>;
  playlists?: SpotifyPagingObject<any>;
};

type SpotifyRecentlyPlayedItem = {
  track: SpotifyTrack;
  played_at: string;
};

type SpotifyRecentlyPlayedResponse = {
  items: SpotifyRecentlyPlayedItem[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
};

// Router handlers remain the same...
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
    const response = await axios.post<SpotifyTokenResponse>(
      'https://accounts.spotify.com/api/token',
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
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Check if refresh_token is provided
    if (!refresh_token) {
      res.status(500).json({ error: 'No refresh token received from Spotify' });
      return;
    }

    const expires_at = new Date(Date.now() + expires_in * 1000);

    const profileResponse = await axios.get<{
      id: string;
      display_name: string;
      email: string;
      country: string;
    }>('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const { id: spotifyId, display_name, email, country } = profileResponse.data;
    

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

    const refreshRes = await axios.post<SpotifyTokenResponse>(
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
    const response = await axios.post<SpotifyTokenResponse>(
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

// Updated search functions with proper return types
export const searchTracks = async (query: string, limit: number = 20): Promise<SpotifySearchResponse> => {
  try {
    const token = await authenticateSpotify();
    
    const response = await axios.get<SpotifySearchResponse>('https://api.spotify.com/v1/search', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: query,
        type: 'track',
        limit,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error searching tracks:', error.response?.data || error.message);
    throw new Error('Failed to search tracks');
  }
};

export const searchAlbums = async (query: string, limit: number = 20): Promise<SpotifySearchResponse> => {
  try {
    const token = await authenticateSpotify();
    
    const response = await axios.get<SpotifySearchResponse>('https://api.spotify.com/v1/search', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: query,
        type: 'album',
        limit,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error searching albums:', error.response?.data || error.message);
    throw new Error('Failed to search albums');
  }
};

export const getUserRecentlyPlayed = async (userId: string, limit: number = 20): Promise<SpotifyRecentlyPlayedItem[]> => {
  try {
    const account = await prisma.spotifyAccount.findUnique({ where: { userId } });

    if (!account) {
      throw new Error('Spotify account not connected');
    }

    let accessToken = account.accessToken;

    // Check if token needs refresh
    if (Date.now() >= account.expiresAt.getTime()) {
      const refreshRes = await axios.post<SpotifyTokenResponse>(
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

      const { access_token, expires_in } = refreshRes.data;
      const newExpiresAt = new Date(Date.now() + expires_in * 1000);

      await prisma.spotifyAccount.update({
        where: { userId },
        data: { accessToken: access_token, expiresAt: newExpiresAt },
      });

      accessToken = access_token;
    }

    const response = await axios.get<SpotifyRecentlyPlayedResponse>('https://api.spotify.com/v1/me/player/recently-played', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit,
      },
    });

    return response.data.items;
  } catch (error: any) {
    console.error('Error getting recently played:', error.response?.data || error.message);
    throw new Error('Failed to get recently played tracks');
  }
};

// Export types for use in other files
export type { SpotifySearchResponse, SpotifyTrack, SpotifyAlbumSimplified as SpotifyAlbum };

export default router;