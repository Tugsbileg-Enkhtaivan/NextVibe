import express from 'express';
import { 
  getAISongSuggestions, 
  addToFavorites, 
  removeFromFavorites, 
  getFavorites,
  getRecommendationHistory
} from '../controllers/aiSongController';


const aiSongRouter = express.Router();

const validateQuery = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const { mood, genre } = req.query;
  if (!mood || !genre) {
    res.status(400).json({ error: "Mood and genre parameters are required" });
    return;
  }
  next();
};

aiSongRouter.get("/recommendations", validateQuery, getAISongSuggestions);

aiSongRouter.post("/favorites", addToFavorites);
aiSongRouter.delete("/favorites/:itemId", removeFromFavorites);
aiSongRouter.get("/favorites", getFavorites);
aiSongRouter.get("/history", getRecommendationHistory);

export default aiSongRouter;