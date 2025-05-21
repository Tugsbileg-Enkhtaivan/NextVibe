import express from 'express';
import axios from 'axios';
import qs from 'querystring';
import { PrismaClient } from '@prisma/client';
import { requireClerkAuth } from '../middlewares/requireClerkAuth';

const prisma = new PrismaClient();


const router = express.Router();

const scope = [
  'user-read-recently-played',
  'user-library-read',
  'user-library-modify',
  'playlist-modify-public',
].join(' ');

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

export default router;
