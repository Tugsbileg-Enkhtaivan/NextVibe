import { Router } from 'express';
import {
  getAISongSuggestions,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getRecommendationHistory
} from '../controllers/aiSongController';
import { requireClerkAuth, optionalClerkAuth } from '../middlewares/requireClerkAuth';
import validateQuery from '../middlewares/validateQuery';

const aiSongRouter = Router();

// Public endpoint - allows both authenticated and anonymous users
aiSongRouter.get('/recommendations',validateQuery ,optionalClerkAuth, getAISongSuggestions);

// Protected endpoints - require authentication
aiSongRouter.post('/favorites', requireClerkAuth, addToFavorites);
aiSongRouter.delete('/favorites/:itemId', requireClerkAuth, removeFromFavorites);
aiSongRouter.get('/favorites', requireClerkAuth, getFavorites);
aiSongRouter.get('/history', requireClerkAuth, getRecommendationHistory);

export default aiSongRouter;