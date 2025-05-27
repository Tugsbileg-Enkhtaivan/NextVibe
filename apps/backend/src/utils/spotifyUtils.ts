import type { SpotifySearchResponse } from '../services/spotifyService';

export const isTrackSearchResponse = (response: SpotifySearchResponse): response is SpotifySearchResponse & { tracks: NonNullable<SpotifySearchResponse['tracks']> } => {
  return response.tracks !== undefined && response.tracks.items !== undefined;
};

export const isAlbumSearchResponse = (response: SpotifySearchResponse): response is SpotifySearchResponse & { albums: NonNullable<SpotifySearchResponse['albums']> } => {
  return response.albums !== undefined && response.albums.items !== undefined;
};

export const hasTrackResults = (response: SpotifySearchResponse): response is SpotifySearchResponse & { tracks: NonNullable<SpotifySearchResponse['tracks']> } => {
  return response.tracks !== undefined && response.tracks.items.length > 0;
};

export const hasAlbumResults = (response: SpotifySearchResponse): response is SpotifySearchResponse & { albums: NonNullable<SpotifySearchResponse['albums']> } => {
  return response.albums !== undefined && response.albums.items.length > 0;
};

export const getTracksFromSearchResponse = (response: SpotifySearchResponse) => {
  return response.tracks?.items || [];
};

export const getAlbumsFromSearchResponse = (response: SpotifySearchResponse) => {
  return response.albums?.items || [];
};