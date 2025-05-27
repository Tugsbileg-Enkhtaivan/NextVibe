import { Router } from 'express';
import {
  initiateSpotifyAuth,
  handleSpotifyCallback,
  getCurrentUser,
  logoutUser,
  refreshUserToken,
  authenticateSpotifyUser
} from '../controllers/spotifyAuthController';

const router = Router();

router.get('/auth/spotify', initiateSpotifyAuth);
router.get('/auth/spotify/callback', handleSpotifyCallback);

router.get('/user/me', authenticateSpotifyUser, getCurrentUser);
router.post('/user/logout', authenticateSpotifyUser, logoutUser);
router.post('/user/refresh-token', authenticateSpotifyUser, refreshUserToken);

export default router;