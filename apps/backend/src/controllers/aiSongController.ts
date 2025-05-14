import { Request, Response } from "express";
import { getGPTRecommendations } from "../services/gptService";
import {
  authenticateSpotify,
  searchAlbums,
  searchTracks,
} from "../services/spotifyService";
import { isAlbumSearchResponse, isTrackSearchResponse } from "../utils/spotifyUtils";

export const getAISongSuggestions = async (req: Request, res: Response) => {
  const { mood, genre } = req.query as { mood: string; genre: string };

  try {
    await authenticateSpotify();

    const prompt = `
      Suggest 5 unique songs and 5 unique albums based on:
      Mood: ${mood}
      Genre: ${genre}

      Format:
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
    `;

    const gptText = await getGPTRecommendations(prompt);
    const songsSection = gptText.match(/SONGS:([\s\S]*?)ALBUMS:/i);
    const albumsSection = gptText.match(/ALBUMS:([\s\S]*)/i);

    if (!songsSection || !albumsSection) {
      res.status(500).json({ error: "Invalid GPT response format" });
      return;
    }

    const parseList = (text: string) =>
      text
        .trim()
        .split("\n")
        .map((line) => line.replace(/^\d+[\).\s-]*/, "").trim())
        .filter(Boolean);

    const songs = parseList(songsSection[1]);
    const albums = parseList(albumsSection[1]);

    const verifiedSongs = await Promise.all(
      songs.map(async (line) => {
        const [songName, artistName] = line.split(" - ").map((s) => s.trim());
        if (!songName || !artistName) return null;
        const result = await searchTracks(`${songName} ${artistName}`);

        if (!isTrackSearchResponse(result)) {
          throw new Error("Invalid track search response from Spotify");
      }

        const track = result.tracks.items[0];
 
        if (!track) return null;
        return {
          songName: track.name,
          artistName: track.artists[0].name,
          songId: track.id,
          albumName: track.album.name,
          albumId: track.album.id,
          albumCover: track.album.images?.[0]?.url || null,
        };
      })
    );

    const verifiedAlbums = await Promise.all(
      albums.map(async (line) => {
        const [albumName, artistName] = line.split(" - ").map((s) => s.trim());
        if (!albumName || !artistName) return null;
        const result = await searchAlbums(`${albumName} ${artistName}`);

        if(!isAlbumSearchResponse(result)) {
          throw new Error("Invalid album search response from Spotify")
        }
        const album = result.albums?.items?.[0];
        if (!album) return null;
        return {
          albumName: album.name,
          artistName: album.artists[0].name,
          albumId: album.id,
          albumCover: album.images?.[0]?.url || null,
        };
      })
    );

    res.json({
      songs: verifiedSongs.filter(Boolean),
      albums: verifiedAlbums.filter(Boolean),
    });
  } catch (err: any) {
    console.error("[AI SONG SEARCH ERROR]", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
