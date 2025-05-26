"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiSongController_1 = require("../controllers/aiSongController");
const requireClerkAuth_1 = require("../middlewares/requireClerkAuth");
const validateQuery_1 = __importDefault(require("../middlewares/validateQuery"));
const aiSongRouter = (0, express_1.Router)();
// Public endpoint - allows both authenticated and anonymous users
aiSongRouter.get('/recommendations', validateQuery_1.default, requireClerkAuth_1.optionalClerkAuth, aiSongController_1.getAISongSuggestions);
// Protected endpoints - require authentication
aiSongRouter.post('/favorites', requireClerkAuth_1.requireClerkAuth, aiSongController_1.addToFavorites);
aiSongRouter.delete('/favorites/:itemId', requireClerkAuth_1.requireClerkAuth, aiSongController_1.removeFromFavorites);
aiSongRouter.get('/favorites', requireClerkAuth_1.requireClerkAuth, aiSongController_1.getFavorites);
aiSongRouter.get('/history', requireClerkAuth_1.requireClerkAuth, aiSongController_1.getRecommendationHistory);
exports.default = aiSongRouter;
//# sourceMappingURL=aiSongRouter.js.map