"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlbumsFromSearchResponse = exports.getTracksFromSearchResponse = exports.hasAlbumResults = exports.hasTrackResults = exports.isAlbumSearchResponse = exports.isTrackSearchResponse = void 0;
const isTrackSearchResponse = (response) => {
    return response.tracks !== undefined && response.tracks.items !== undefined;
};
exports.isTrackSearchResponse = isTrackSearchResponse;
const isAlbumSearchResponse = (response) => {
    return response.albums !== undefined && response.albums.items !== undefined;
};
exports.isAlbumSearchResponse = isAlbumSearchResponse;
// Additional helper functions for better type safety
const hasTrackResults = (response) => {
    return response.tracks !== undefined && response.tracks.items.length > 0;
};
exports.hasTrackResults = hasTrackResults;
const hasAlbumResults = (response) => {
    return response.albums !== undefined && response.albums.items.length > 0;
};
exports.hasAlbumResults = hasAlbumResults;
// Helper to safely get tracks from search response
const getTracksFromSearchResponse = (response) => {
    var _a;
    return ((_a = response.tracks) === null || _a === void 0 ? void 0 : _a.items) || [];
};
exports.getTracksFromSearchResponse = getTracksFromSearchResponse;
// Helper to safely get albums from search response
const getAlbumsFromSearchResponse = (response) => {
    var _a;
    return ((_a = response.albums) === null || _a === void 0 ? void 0 : _a.items) || [];
};
exports.getAlbumsFromSearchResponse = getAlbumsFromSearchResponse;
//# sourceMappingURL=spotifyUtils.js.map