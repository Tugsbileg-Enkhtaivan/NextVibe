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

    const variation = Math.random() > 0.5 ? "Include some lesser-known or international picks." : "Try to mix decades and avoid repeat suggestions.";

    const prompt = `
You are a music recommendation engine.

Suggest 5 unique SONGS and 5 unique  ALBUMS based on the following:

Mood: ${mood}
Genre: ${genre}

${variation}

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
        .map((line) => line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/))
        .filter(Boolean)
        .map(([, name, artist]) => ({
          name: name.trim(),
          artist: artist.trim(),
        }));

    const songs = parseList(songsSection[1]);
    const albums = parseList(albumsSection[1]);

    const verifiedSongs = await Promise.all(
      songs.map(async ({ name: songName, artist: artistName }) => {
        const result = await searchTracks(`${songName} ${artistName}`);
        if (!isTrackSearchResponse(result)) return null;
    
        const track = result.tracks.items.find(
          (t) =>
            t.artists.some((a) =>
              a.name.toLowerCase().includes(artistName.toLowerCase())
            ) &&
            t.name.toLowerCase().includes(songName.toLowerCase())
        );
    
        if (!track) {
          console.warn(`Song not found: ${songName} by ${artistName}`);
          return null;
        }
    
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
      albums.map(async ({ name: albumName, artist: artistName }) => {
        const result = await searchAlbums(`${albumName} ${artistName}`);
        if (!isAlbumSearchResponse(result)) return null;
    
        const album = result.albums.items.find(
          (a) =>
            a.artists.some((artist) =>
              artist.name.toLowerCase().includes(artistName.toLowerCase())
            ) &&
            a.name.toLowerCase().includes(albumName.toLowerCase())
        );
    
        if (!album) {
          console.warn(`Album not found: ${albumName} by ${artistName}`);
          return null;
        }
    
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
