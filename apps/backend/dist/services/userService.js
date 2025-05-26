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
exports.getUserMoodHistory = exports.getMoodBasedRecommendations = exports.getUserFavorites = exports.removeFromUserFavorites = exports.addToUserFavorites = exports.getUserRecommendationHistory = exports.saveUserRecommendationHistory = void 0;
const client_1 = require("@prisma/client");
const spotifyService_1 = require("../services/spotifyService");
const spotifyUtils_1 = require("../utils/spotifyUtils");
const prisma = new client_1.PrismaClient();
const saveUserRecommendationHistory = (userId, recommendation) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prisma.recommendation.create({
            data: {
                userId,
                type: recommendation.type,
                mood: recommendation.mood,
                energy: recommendation.energy,
                valence: recommendation.valence,
                genres: recommendation.genres,
                seedTracks: recommendation.seedTracks || [],
                seedArtists: recommendation.seedArtists || [],
                parameters: recommendation.parameters,
                tracks: {
                    create: recommendation.tracks.map((track, index) => {
                        var _a, _b, _c, _d;
                        return ({
                            trackId: track.id || track.trackId,
                            position: index,
                            name: track.name,
                            artistNames: Array.isArray(track.artists)
                                ? track.artists.map((artist) => artist.name)
                                : [track.artist || 'Unknown'],
                            albumName: ((_a = track.album) === null || _a === void 0 ? void 0 : _a.name) || track.albumName,
                            imageUrl: ((_d = (_c = (_b = track.album) === null || _b === void 0 ? void 0 : _b.images) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url) || track.imageUrl || track.albumCover,
                            previewUrl: track.preview_url || track.previewUrl,
                            duration: track.duration_ms || track.duration,
                            popularity: track.popularity
                        });
                    })
                },
                albums: {
                    create: recommendation.albums.map((album, index) => {
                        var _a, _b;
                        return ({
                            albumId: album.id || album.albumId,
                            position: index,
                            name: album.name,
                            artistNames: Array.isArray(album.artists)
                                ? album.artists.map((artist) => artist.name)
                                : [album.artist || 'Unknown'],
                            imageUrl: ((_b = (_a = album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || album.imageUrl || album.albumCover,
                            releaseDate: album.release_date || album.releaseDate,
                            totalTracks: album.total_tracks || album.totalTracks
                        });
                    })
                }
            }
        });
    }
    catch (error) {
        console.error('Error saving recommendation history:', error);
        throw new Error('Failed to save recommendation history');
    }
});
exports.saveUserRecommendationHistory = saveUserRecommendationHistory;
const getUserRecommendationHistory = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, limit = 10) {
    try {
        return yield prisma.recommendation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                tracks: {
                    orderBy: { position: 'asc' }
                },
                albums: {
                    orderBy: { position: 'asc' }
                }
            }
        });
    }
    catch (error) {
        console.error('Error retrieving recommendation history:', error);
        throw new Error('Failed to retrieve recommendation history');
    }
});
exports.getUserRecommendationHistory = getUserRecommendationHistory;
const addToUserFavorites = (userId, itemId, itemType) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        // Convert itemType to match Prisma enum
        const favoriteType = itemType.toUpperCase();
        const existing = yield prisma.favorite.findFirst({
            where: {
                userId,
                itemId,
                type: favoriteType
            }
        });
        if (existing)
            return existing;
        let name = 'Unknown';
        let artistNames = ['Unknown'];
        let imageUrl = '';
        let metadata = {};
        if (itemType === 'track') {
            const result = yield (0, spotifyService_1.searchTracks)(`id:${itemId}`);
            if ((0, spotifyUtils_1.isTrackSearchResponse)(result) && result.tracks.items.length > 0) {
                const track = result.tracks.items[0];
                name = track.name;
                artistNames = track.artists.map(artist => artist.name);
                imageUrl = ((_b = (_a = track.album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || '';
                metadata = {
                    albumId: track.album.id,
                    albumName: track.album.name,
                    previewUrl: track.preview_url,
                    duration: track.duration_ms,
                    popularity: track.popularity,
                    spotifyUrl: ((_c = track.external_urls) === null || _c === void 0 ? void 0 : _c.spotify) || null
                };
            }
        }
        else if (itemType === 'album') {
            const result = yield (0, spotifyService_1.searchAlbums)(`id:${itemId}`);
            if ((0, spotifyUtils_1.isAlbumSearchResponse)(result) && result.albums.items.length > 0) {
                const album = result.albums.items[0];
                name = album.name;
                artistNames = album.artists.map(artist => artist.name);
                imageUrl = ((_e = (_d = album.images) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.url) || '';
                metadata = {
                    releaseDate: album.release_date,
                    totalTracks: album.total_tracks,
                    spotifyUrl: ((_f = album.external_urls) === null || _f === void 0 ? void 0 : _f.spotify) || null
                };
            }
        }
        return yield prisma.favorite.create({
            data: {
                userId,
                itemId,
                type: favoriteType,
                name,
                artistNames,
                imageUrl,
                metadata
            }
        });
    }
    catch (error) {
        console.error('Error adding to favorites:', error);
        throw new Error('Failed to add item to favorites');
    }
});
exports.addToUserFavorites = addToUserFavorites;
const removeFromUserFavorites = (userId, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prisma.favorite.deleteMany({
            where: { userId, itemId }
        });
    }
    catch (error) {
        console.error('Error removing from favorites:', error);
        throw new Error('Failed to remove item from favorites');
    }
});
exports.removeFromUserFavorites = removeFromUserFavorites;
const getUserFavorites = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const favorites = yield prisma.favorite.findMany({
            where: { userId },
            orderBy: { addedAt: 'desc' }
        });
        const tracks = favorites
            .filter(fav => fav.type === 'TRACK')
            .map(fav => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                trackId: fav.itemId,
                trackName: fav.name,
                artistName: fav.artistNames[0] || 'Unknown',
                artistNames: fav.artistNames,
                albumId: (_a = fav.metadata) === null || _a === void 0 ? void 0 : _a.albumId,
                albumName: (_b = fav.metadata) === null || _b === void 0 ? void 0 : _b.albumName,
                albumCover: fav.imageUrl,
                previewUrl: (_c = fav.metadata) === null || _c === void 0 ? void 0 : _c.previewUrl,
                duration: (_d = fav.metadata) === null || _d === void 0 ? void 0 : _d.duration,
                popularity: (_e = fav.metadata) === null || _e === void 0 ? void 0 : _e.popularity,
                spotifyUrl: (_f = fav.metadata) === null || _f === void 0 ? void 0 : _f.spotifyUrl,
                addedAt: fav.addedAt
            });
        });
        const albums = favorites
            .filter(fav => fav.type === 'ALBUM')
            .map(fav => {
            var _a, _b, _c;
            return ({
                albumId: fav.itemId,
                albumName: fav.name,
                artistName: fav.artistNames[0] || 'Unknown',
                artistNames: fav.artistNames,
                albumCover: fav.imageUrl,
                releaseDate: (_a = fav.metadata) === null || _a === void 0 ? void 0 : _a.releaseDate,
                totalTracks: (_b = fav.metadata) === null || _b === void 0 ? void 0 : _b.totalTracks,
                spotifyUrl: (_c = fav.metadata) === null || _c === void 0 ? void 0 : _c.spotifyUrl,
                addedAt: fav.addedAt
            });
        });
        const artists = favorites
            .filter(fav => fav.type === 'ARTIST')
            .map(fav => {
            var _a;
            return ({
                artistId: fav.itemId,
                artistName: fav.name,
                imageUrl: fav.imageUrl,
                spotifyUrl: (_a = fav.metadata) === null || _a === void 0 ? void 0 : _a.spotifyUrl,
                addedAt: fav.addedAt
            });
        });
        const playlists = favorites
            .filter(fav => fav.type === 'PLAYLIST')
            .map(fav => {
            var _a;
            return ({
                playlistId: fav.itemId,
                playlistName: fav.name,
                imageUrl: fav.imageUrl,
                spotifyUrl: (_a = fav.metadata) === null || _a === void 0 ? void 0 : _a.spotifyUrl,
                addedAt: fav.addedAt
            });
        });
        return { tracks, albums, artists, playlists };
    }
    catch (error) {
        console.error('Error retrieving favorites:', error);
        throw new Error('Failed to retrieve favorites');
    }
});
exports.getUserFavorites = getUserFavorites;
const getMoodBasedRecommendations = (userId_1, mood_1, energy_1, valence_1, ...args_1) => __awaiter(void 0, [userId_1, mood_1, energy_1, valence_1, ...args_1], void 0, function* (userId, mood, energy, valence, genres = [], limit = 20) {
    try {
        return yield prisma.recommendation.findMany({
            where: Object.assign(Object.assign({ userId, type: 'MOOD_BASED', mood }, (energy && { energy })), (valence && { valence })),
            include: {
                tracks: {
                    orderBy: { position: 'asc' },
                    take: limit
                },
                albums: {
                    orderBy: { position: 'asc' },
                    take: Math.floor(limit / 2)
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
    }
    catch (error) {
        console.error('Error getting mood-based recommendations:', error);
        throw new Error('Failed to get mood-based recommendations');
    }
});
exports.getMoodBasedRecommendations = getMoodBasedRecommendations;
const getUserMoodHistory = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, limit = 30) {
    try {
        return yield prisma.moodEntry.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    catch (error) {
        console.error('Error getting mood history:', error);
        throw new Error('Failed to get mood history');
    }
});
exports.getUserMoodHistory = getUserMoodHistory;
//# sourceMappingURL=userService.js.map