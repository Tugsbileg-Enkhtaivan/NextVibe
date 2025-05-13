import SpotifyWebApi from "spotify-web-api-node";
import { retry } from "../utils/retry";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

export const authenticateSpotify = async () => {
  const tokenData = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(tokenData.body.access_token);
};

export const searchTracks = async (query: string) =>
  retry(() => spotifyApi.searchTracks(query));

export const searchAlbums = async (query: string) =>
  retry(() => spotifyApi.searchAlbums(query));

export const addToSavedTracks = async (songId: string, accessToken: string) => {
  spotifyApi.setAccessToken(accessToken);
  await spotifyApi.addToMySavedTracks([songId]);
};
