import SpotifyWebApi from "spotify-web-api-node";
import { retry } from "../utils/retry";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

export const authenticateSpotify = async () => {
  try {
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);
  } catch (error) {
    console.error("[SPOTIFY AUTH ERROR]", error);
    throw new Error("Failed to authenticate with Spotify");
  }
};

export const searchTracks = async (
  query: string
): Promise<SpotifyApi.SearchResponse> =>
  retry(() => spotifyApi.searchTracks(query).then((res) => res.body));

export const searchAlbums = async (
  query: string
): Promise<SpotifyApi.SearchResponse> =>
  retry(() => spotifyApi.searchAlbums(query).then(res => res.body));


export const addToSavedTracks = async (songId: string, accessToken: string) => {
  spotifyApi.setAccessToken(accessToken);
  await spotifyApi.addToMySavedTracks([songId]);
};
