import { Router } from "express";
import { getAISongSuggestions } from "../controllers/aiSongController";
import validateQuery from "../middlewares/validateQuery";

const aiSongRouter = Router();

aiSongRouter.get("/", validateQuery, getAISongSuggestions);

export default aiSongRouter;
