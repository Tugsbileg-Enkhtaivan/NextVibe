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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendationHistory = exports.getFavorites = exports.removeFromFavorites = exports.addToFavorites = exports.getAISongSuggestions = void 0;
const gptService_1 = require("../services/gptService");
const spotifyService_1 = require("../services/spotifyService");
const youtubeService_1 = require("../services/youtubeService");
const userService_1 = require("../services/userService");
const client_1 = require("@prisma/client");
const userRecommendationCache = new Map();
const CACHE_EXPIRATION = 6 * 60 * 60 * 1000;
const convertToMoodType = (mood) => {
    const moodUpper = mood.toUpperCase();
    return client_1.MoodType[moodUpper] || client_1.MoodType.HAPPY;
};
const getAISongSuggestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { mood, genre } = req.query;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous';
    if (!mood || !genre) {
        res.status(400).json({ error: "Mood and genre are required parameters" });
        return;
    }
    try {
        yield (0, spotifyService_1.authenticateSpotify)();
        const cacheKey = `${userId}-${mood}-${genre}`;
        const cachedRecommendations = userRecommendationCache.get(cacheKey);
        const shouldUseCache = cachedRecommendations &&
            (Date.now() - cachedRecommendations.timestamp < CACHE_EXPIRATION) &&
            (Math.random() > 0.3);
        if (shouldUseCache) {
            res.json({
                songs: cachedRecommendations.songs,
                albums: cachedRecommendations.albums,
                fromCache: true
            });
            return;
        }
        let recentlyPlayedTracks = [];
        try {
            if (userId !== 'anonymous') {
                const recentlyPlayed = yield (0, spotifyService_1.getUserRecentlyPlayed)(userId);
                recentlyPlayedTracks = recentlyPlayed.map(item => item.track.id);
            }
        }
        catch (error) {
            console.warn("Failed to get recently played tracks:", error);
        }
        let previousRecommendations = [];
        try {
            if (userId !== 'anonymous') {
                const history = yield (0, userService_1.getUserRecommendationHistory)(userId);
                previousRecommendations = history.flatMap(rec => {
                    var _a, _b;
                    return [
                        ...(((_a = rec.tracks) === null || _a === void 0 ? void 0 : _a.map(track => track.trackId)) || []),
                        ...(((_b = rec.albums) === null || _b === void 0 ? void 0 : _b.map(album => album.albumId)) || [])
                    ];
                });
            }
        }
        catch (error) {
            console.warn("Failed to get recommendation history:", error);
        }
        const prompt = `
You are a music recommendation engine for Spotify.

Suggest 5 popular SONGS and 5 notable ALBUMS that are definitely available on Spotify based on the following:

Mood: ${mood}
Genre: ${genre}

Important: Suggest a diverse mix of artists and time periods. Include some lesser-known gems alongside popular choices.

Only output in the following format — no extra comments or explanations:

SONGS:
1. Song Name - Artist
2. Song Name - Artist
3. Song Name - Artist
4. Song Name - Artist
5. Song Name - Artist

ALBUMS:
1. Album Name - Artist
2. Album Name - Artist
3. Album Name - Artist
4. Album Name - Artist
5. Album Name - Artist

Do NOT include song lists inside the ALBUM section. Keep output minimal and in correct format.
`;
        const gptText = yield (0, gptService_1.getGPTRecommendations)(prompt);
        const songsSection = gptText.match(/SONGS:([\s\S]*?)ALBUMS:/i);
        const albumsSection = gptText.match(/ALBUMS:([\s\S]*)/i);
        if (!songsSection || !albumsSection) {
            res.status(500).json({ error: "Invalid GPT response format" });
            return;
        }
        const parseList = (text) => {
            return text
                .trim()
                .split("\n")
                .filter(line => line.trim() !== '')
                .map((line) => {
                const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
                if (!match)
                    return null;
                return {
                    name: match[1].trim(),
                    artist: match[2].trim(),
                };
            })
                .filter(Boolean);
        };
        const songs = parseList(songsSection[1]);
        const albums = parseList(albumsSection[1]);
        const getBackupSuggestions = (type_1, searchTerm_1, count_1, ...args_1) => __awaiter(void 0, [type_1, searchTerm_1, count_1, ...args_1], void 0, function* (type, searchTerm, count, excludeIds = []) {
            if (type === 'tracks') {
                const result = yield (0, spotifyService_1.searchTracks)(`${genre} ${mood}`);
                if (result.tracks && result.tracks.items.length > 0) {
                    return result.tracks.items
                        .filter(track => !excludeIds.includes(track.id))
                        .slice(0, count);
                }
            }
            else {
                const result = yield (0, spotifyService_1.searchAlbums)(`${genre} ${mood}`);
                if (result.albums && result.albums.items.length > 0) {
                    return result.albums.items
                        .filter(album => !excludeIds.includes(album.id))
                        .slice(0, count);
                }
            }
            return [];
        });
        let verifiedSongs = yield Promise.all(songs.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!item)
                return null;
            const { name: songName, artist: artistName } = item;
            const result = yield (0, spotifyService_1.searchTracks)(`track:${songName} artist:${artistName}`);
            if (!result.tracks || result.tracks.items.length === 0)
                return null;
            let track = result.tracks.items
                .filter(t => !recentlyPlayedTracks.includes(t.id) && !previousRecommendations.includes(t.id))
                .find(t => t.artists.some(a => a.name.toLowerCase().includes(artistName.toLowerCase())) &&
                t.name.toLowerCase().includes(songName.toLowerCase()));
            if (!track && result.tracks.items.length > 0) {
                track = result.tracks.items[0];
            }
            if (!track)
                return null;
            let youtubeData = null;
            try {
                const youtubeResults = yield (0, youtubeService_1.searchYouTubeVideos)(`${track.name} ${track.artists[0].name} official audio`);
                if (youtubeResults && youtubeResults.length > 0) {
                    youtubeData = {
                        videoId: youtubeResults[0].id.videoId,
                        title: youtubeResults[0].snippet.title,
                        thumbnail: youtubeResults[0].snippet.thumbnails.high.url
                    };
                }
            }
            catch (error) {
                console.warn(`YouTube search failed for ${track.name}:`, error);
            }
            return {
                songName: track.name,
                artistName: track.artists[0].name,
                songId: track.id,
                albumName: track.album.name,
                albumId: track.album.id,
                albumCover: ((_b = (_a = track.album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null,
                previewUrl: track.preview_url,
                spotifyUrl: ((_c = track.external_urls) === null || _c === void 0 ? void 0 : _c.spotify) || null,
                youtubeData
            };
        })));
        let verifiedAlbums = yield Promise.all(albums.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!item)
                return null;
            const { name: albumName, artist: artistName } = item;
            const result = yield (0, spotifyService_1.searchAlbums)(`album:${albumName} artist:${artistName}`);
            if (!result.albums || result.albums.items.length === 0)
                return null;
            let album = result.albums.items
                .filter(a => !previousRecommendations.includes(a.id))
                .find(a => a.artists.some(artist => artist.name.toLowerCase().includes(artistName.toLowerCase())) &&
                a.name.toLowerCase().includes(albumName.toLowerCase()));
            if (!album && result.albums.items.length > 0) {
                album = result.albums.items[0];
            }
            if (!album)
                return null;
            return {
                albumName: album.name,
                artistName: album.artists[0].name,
                albumId: album.id,
                albumCover: ((_b = (_a = album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null,
                spotifyUrl: ((_c = album.external_urls) === null || _c === void 0 ? void 0 : _c.spotify) || null,
                releaseDate: album.release_date || null,
            };
        })));
        if (verifiedAlbums.filter(Boolean).length < 5) {
            const backupAlbums = yield getBackupSuggestions('albums', `${genre} ${mood}`, 5 - verifiedAlbums.filter(Boolean).length, previousRecommendations);
            const processedBackupAlbums = backupAlbums.map(album => {
                var _a, _b, _c;
                return ({
                    albumName: album.name,
                    artistName: album.artists[0].name,
                    albumId: album.id,
                    albumCover: ((_b = (_a = album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null,
                    spotifyUrl: ((_c = album.external_urls) === null || _c === void 0 ? void 0 : _c.spotify) || null,
                    releaseDate: album.release_date || null,
                });
            });
            verifiedAlbums = [...verifiedAlbums.filter(Boolean), ...processedBackupAlbums];
        }
        const finalSongs = verifiedSongs.slice(0, 5);
        const finalAlbums = verifiedAlbums.slice(0, 5);
        userRecommendationCache.set(cacheKey, {
            timestamp: Date.now(),
            songs: finalSongs,
            albums: finalAlbums
        });
        if (userId !== 'anonymous') {
            try {
                yield (0, userService_1.saveUserRecommendationHistory)(userId, {
                    type: client_1.RecommendationType.MOOD_BASED,
                    mood: convertToMoodType(mood),
                    genres: [genre],
                    seedTracks: [],
                    seedArtists: [],
                    parameters: { mood, genre },
                    tracks: finalSongs.map((song, index) => ({
                        trackId: song.songId,
                        position: index,
                        name: song.songName,
                        artistNames: [song.artistName],
                        albumName: song.albumName,
                        imageUrl: song.albumCover,
                        previewUrl: song.previewUrl,
                        duration: null,
                        popularity: null
                    })),
                    albums: finalAlbums.map((album, index) => ({
                        albumId: album.albumId,
                        position: index,
                        name: album.albumName,
                        artistNames: [album.artistName],
                        imageUrl: album.albumCover,
                        releaseDate: album.releaseDate,
                        totalTracks: null
                    }))
                });
            }
            catch (error) {
                console.warn("Failed to save recommendation history:", error);
            }
        }
        res.json({
            songs: finalSongs,
            albums: finalAlbums,
            fromCache: false
        });
    }
    catch (err) {
        console.error("[AI SONG SEARCH ERROR]", err.message || err);
        res.status(500).json({ error: "Failed to retrieve music recommendations" });
    }
});
exports.getAISongSuggestions = getAISongSuggestions;
const addToFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { itemId, itemType } = req.body;
    if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    if (!itemId || !itemType || !['song', 'album'].includes(itemType)) {
        res.status(400).json({ error: "Invalid request. Required: itemId and itemType (song or album)" });
        return;
    }
    try {
        yield (0, userService_1.addToUserFavorites)(userId, itemId, itemType);
        res.json({ success: true });
    }
    catch (error) {
        console.error("[ADD TO FAVORITES ERROR]", error);
        res.status(500).json({ error: "Failed to add item to favorites" });
    }
});
exports.addToFavorites = addToFavorites;
const removeFromFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { itemId } = req.params;
    if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        yield (0, userService_1.removeFromUserFavorites)(userId, itemId);
        res.json({ success: true });
    }
    catch (error) {
        console.error("[REMOVE FROM FAVORITES ERROR]", error);
        res.status(500).json({ error: "Failed to remove item from favorites" });
    }
});
exports.removeFromFavorites = removeFromFavorites;
const getFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const favorites = yield (0, userService_1.getUserFavorites)(userId);
        res.json(favorites);
    }
    catch (error) {
        console.error("[GET FAVORITES ERROR]", error);
        res.status(500).json({ error: "Failed to retrieve favorites" });
    }
});
exports.getFavorites = getFavorites;
const getRecommendationHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const history = yield (0, userService_1.getUserRecommendationHistory)(userId);
        res.json(history);
    }
    catch (error) {
        console.error("[GET HISTORY ERROR]", error);
        res.status(500).json({ error: "Failed to retrieve recommendation history" });
    }
});
exports.getRecommendationHistory = getRecommendationHistory;
//# sourceMappingURL=aiSongController.js.map