"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYouTubeEmbedUrl = exports.searchYouTubeVideos = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
/**
 * Search for YouTube videos
 * @param query Search query
 * @param maxResults Maximum number of results to return (default: 1)
 * @returns Array of YouTube video results
 */
const searchYouTubeVideos = (query_1, ...args_1) => __awaiter(void 0, [query_1, ...args_1], void 0, function* (query, maxResults = 1) {
    var _a;
    if (!YOUTUBE_API_KEY) {
        throw new Error('YouTube API key is not configured');
    }
    try {
        const response = yield axios_1.default.get(YOUTUBE_API_URL, {
            params: {
                part: 'snippet',
                maxResults,
                q: query,
                key: YOUTUBE_API_KEY,
                type: 'video',
                videoEmbeddable: 'true',
                videoSyndicated: 'true'
            }
        });
        return response.data.items;
    }
    catch (error) {
        console.error('YouTube API error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(`YouTube search failed: ${error.message}`);
    }
});
exports.searchYouTubeVideos = searchYouTubeVideos;
/**
 * Get embed URL for a YouTube video
 * @param videoId YouTube video ID
 * @returns Embed URL for the video
 */
const getYouTubeEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}`;
};
exports.getYouTubeEmbedUrl = getYouTubeEmbedUrl;
//# sourceMappingURL=youtubeService.js.map