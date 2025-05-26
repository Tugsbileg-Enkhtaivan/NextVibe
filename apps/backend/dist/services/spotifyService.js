"use strict";
// Complete updated types for spotifyService.ts
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
exports.getUserRecentlyPlayed = exports.searchAlbums = exports.searchTracks = exports.authenticateSpotify = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const querystring_1 = __importDefault(require("querystring"));
const client_1 = require("@prisma/client");
const requireClerkAuth_1 = require("../middlewares/requireClerkAuth");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
let appAccessToken = null;
let appTokenExpiry = 0;
const scope = [
    'user-read-recently-played',
    'user-library-read',
    'user-library-modify',
    'playlist-modify-public',
].join(' ');
// Router handlers remain the same...
router.get('/login', requireClerkAuth_1.requireClerkAuth, (req, res) => {
    const params = querystring_1.default.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    });
    res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});
router.get('/callback', requireClerkAuth_1.requireClerkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const code = req.query.code;
    const userId = req.userId;
    if (!code || !userId) {
        res.status(400).json({ error: 'Missing code or user ID' });
        return;
    }
    try {
        const response = yield axios_1.default.post('https://accounts.spotify.com/api/token', querystring_1.default.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const { access_token, refresh_token, expires_in } = response.data;
        const expires_at = new Date(Date.now() + expires_in * 1000);
        const profileResponse = yield axios_1.default.get('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const { id: spotifyId, display_name, email, country } = profileResponse.data;
        const existingAccount = yield prisma.spotifyAccount.findUnique({
            where: { userId }
        });
        if (existingAccount) {
            yield prisma.spotifyAccount.update({
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
        }
        else {
            yield prisma.spotifyAccount.create({
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
    }
    catch (err) {
        console.error('Spotify callback error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        res.status(500).json({ error: 'Spotify authentication failed' });
    }
}));
router.get('/token', requireClerkAuth_1.requireClerkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.userId;
    try {
        const account = yield prisma.spotifyAccount.findUnique({ where: { userId } });
        if (!account) {
            res.status(404).json({ error: 'Spotify not connected' });
            return;
        }
        if (Date.now() < account.expiresAt.getTime()) {
            res.json({ token: account.accessToken });
            return;
        }
        const refreshRes = yield axios_1.default.post('https://accounts.spotify.com/api/token', querystring_1.default.stringify({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const { access_token, expires_in } = refreshRes.data;
        const newExpiresAt = new Date(Date.now() + expires_in * 1000);
        yield prisma.spotifyAccount.update({
            where: { userId },
            data: { accessToken: access_token, expiresAt: newExpiresAt },
        });
        res.json({ token: access_token });
    }
    catch (err) {
        console.error('Token refresh failed:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
}));
const authenticateSpotify = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (appAccessToken && Date.now() < appTokenExpiry) {
        return appAccessToken;
    }
    try {
        const response = yield axios_1.default.post('https://accounts.spotify.com/api/token', querystring_1.default.stringify({
            grant_type: 'client_credentials',
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            },
        });
        const { access_token, expires_in } = response.data;
        appAccessToken = access_token;
        appTokenExpiry = Date.now() + (expires_in - 60) * 1000;
        return access_token;
    }
    catch (error) {
        console.error('Spotify authentication error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error('Failed to authenticate with Spotify');
    }
});
exports.authenticateSpotify = authenticateSpotify;
// Updated search functions with proper return types
const searchTracks = (query_1, ...args_1) => __awaiter(void 0, [query_1, ...args_1], void 0, function* (query, limit = 20) {
    var _a;
    try {
        const token = yield (0, exports.authenticateSpotify)();
        const response = yield axios_1.default.get('https://api.spotify.com/v1/search', {
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
    }
    catch (error) {
        console.error('Error searching tracks:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error('Failed to search tracks');
    }
});
exports.searchTracks = searchTracks;
const searchAlbums = (query_1, ...args_1) => __awaiter(void 0, [query_1, ...args_1], void 0, function* (query, limit = 20) {
    var _a;
    try {
        const token = yield (0, exports.authenticateSpotify)();
        const response = yield axios_1.default.get('https://api.spotify.com/v1/search', {
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
    }
    catch (error) {
        console.error('Error searching albums:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error('Failed to search albums');
    }
});
exports.searchAlbums = searchAlbums;
const getUserRecentlyPlayed = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, limit = 20) {
    var _a;
    try {
        const account = yield prisma.spotifyAccount.findUnique({ where: { userId } });
        if (!account) {
            throw new Error('Spotify account not connected');
        }
        let accessToken = account.accessToken;
        // Check if token needs refresh
        if (Date.now() >= account.expiresAt.getTime()) {
            const refreshRes = yield axios_1.default.post('https://accounts.spotify.com/api/token', querystring_1.default.stringify({
                grant_type: 'refresh_token',
                refresh_token: account.refreshToken,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const { access_token, expires_in } = refreshRes.data;
            const newExpiresAt = new Date(Date.now() + expires_in * 1000);
            yield prisma.spotifyAccount.update({
                where: { userId },
                data: { accessToken: access_token, expiresAt: newExpiresAt },
            });
            accessToken = access_token;
        }
        const response = yield axios_1.default.get('https://api.spotify.com/v1/me/player/recently-played', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                limit,
            },
        });
        return response.data.items;
    }
    catch (error) {
        console.error('Error getting recently played:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error('Failed to get recently played tracks');
    }
});
exports.getUserRecentlyPlayed = getUserRecentlyPlayed;
exports.default = router;
//# sourceMappingURL=spotifyService.js.map