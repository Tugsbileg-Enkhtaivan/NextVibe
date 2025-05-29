import express from 'express';
import { 
  initiateSpotifyAuth, 
  handleSpotifyCallback, 
  getCurrentUser, 
  logoutUser, 
  refreshUserToken,
  authenticateSpotifyUser 
} from '../controllers/enhancedSpotifyAuthController';

const router = express.Router();

router.get('/auth', initiateSpotifyAuth);
router.get('/callback', handleSpotifyCallback);
router.get('/user/me', authenticateSpotifyUser, getCurrentUser);
router.post('/user/refresh-token', authenticateSpotifyUser, refreshUserToken);
router.post('/user/logout', authenticateSpotifyUser, logoutUser);

export default router;