import { Request, Response } from "express";
import { getGPTRecommendations } from "../services/gptService";
import {
  authenticateSpotify,
  searchAlbums,
  searchTracks,
  getUserRecentlyPlayed,
} from "../services/spotifyService";
import {
  isAlbumSearchResponse,
  isTrackSearchResponse,
} from "../utils/spotifyUtils";
import { searchYouTubeVideos } from "../services/youtubeService";
import {
  saveUserRecommendationHistory,
  getUserRecommendationHistory,
  addToUserFavorites,
  getUserFavorites,
  removeFromUserFavorites,
} from "../services/userService";
import { MoodType, RecommendationType } from "@prisma/client";

// Type definitions
interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyAlbumFull {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  images: SpotifyImage[];
  release_date: string;
  external_urls: { spotify: string };
  total_tracks: number;
}

interface SpotifyAlbumSimplified {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  external_urls: { spotify: string };
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
  };
  preview_url: string | null;
  external_urls: { spotify: string };
}

// Type guards
function isFullAlbum(album: any): album is SpotifyAlbumFull {
  return album && 'images' in album && 'release_date' in album;
}

function hasImages(obj: any): obj is { images: SpotifyImage[] } {
  return obj && Array.isArray(obj.images);
}

const userRecommendationCache = new Map<
  string,
  {
    timestamp: number;
    songs: any[];
    albums: any[];
  }
>();

const CACHE_EXPIRATION = 6 * 60 * 60 * 1000;

const convertToMoodType = (mood: string): MoodType => {
  const moodUpper = mood.toUpperCase() as keyof typeof MoodType;
  return MoodType[moodUpper] || MoodType.HAPPY;
};

export const getAISongSuggestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { mood, genre } = req.query as { mood: string; genre: string };
  const userId = req.user?.id || "anonymous";

  if (!mood || !genre) {
    res.status(400).json({ error: "Mood and genre are required parameters" });
    return;
  }

  try {
    await authenticateSpotify();

    const cacheKey = `${userId}-${mood}-${genre}`;
    const cachedRecommendations = userRecommendationCache.get(cacheKey);

    const shouldUseCache =
      cachedRecommendations &&
      Date.now() - cachedRecommendations.timestamp < CACHE_EXPIRATION &&
      Math.random() > 0.3;

    if (shouldUseCache) {
      res.json({
        songs: cachedRecommendations.songs,
        albums: cachedRecommendations.albums,
        fromCache: true,
      });
      return;
    }

    let recentlyPlayedTracks: string[] = [];
    if (userId !== "anonymous") {
      try {
        const recentlyPlayed = await getUserRecentlyPlayed(userId);
        recentlyPlayedTracks = recentlyPlayed.map((item) => item.track.id);
      } catch (error) {
        console.warn("Failed to get recently played tracks:", error);
      }
    }

    let previousRecommendations: string[] = [];
    if (userId !== "anonymous") {
      try {
        const history = await getUserRecommendationHistory(userId);
        previousRecommendations = history.flatMap((rec) => [
          ...(rec.tracks?.map((track) => track.trackId) || []),
          ...(rec.albums?.map((album) => album.albumId) || []),
        ]);
      } catch (error) {
        console.warn("Failed to get recommendation history:", error);
      }
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

    const gptText = await getGPTRecommendations(prompt);
    const songsSection = gptText.match(/SONGS:([\s\S]*?)ALBUMS:/i);
    const albumsSection = gptText.match(/ALBUMS:([\s\S]*)/i);

    if (!songsSection || !albumsSection) {
      res.status(500).json({ error: "Invalid GPT response format" });
      return;
    }

    const parseList = (text: string) => {
      return text
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
          if (!match) return null;
          return {
            name: match[1].trim(),
            artist: match[2].trim(),
          };
        })
        .filter(Boolean);
    };

    const songs = parseList(songsSection[1]);
    const albums = parseList(albumsSection[1]);

    const getBackupSuggestions = async (
      type: "tracks" | "albums",
      searchTerm: string,
      count: number,
      excludeIds: string[] = []
    ): Promise<SpotifyTrack[] | SpotifyAlbumFull[]> => {
      if (type === "tracks") {
        const result = await searchTracks(`${genre} ${mood}`);
        if (result.tracks && result.tracks.items.length > 0) {
          return result.tracks.items
            .filter((track) => !excludeIds.includes(track.id))
            .slice(0, count) as SpotifyTrack[];
        }
        return [];
      } else {
        const result = await searchAlbums(`${genre} ${mood}`);
        if (result.albums && result.albums.items.length > 0) {
          return result.albums.items
            .filter((album) => !excludeIds.includes(album.id))
            .slice(0, count) as SpotifyAlbumFull[];
        }
        return [];
      }
    };

    // Process songs
    let verifiedSongs = await Promise.all(
      songs.map(async (item) => {
        if (!item) return null;
        const { name: songName, artist: artistName } = item;

        try {
          const result = await searchTracks(
            `track:${songName} artist:${artistName}`
          );
          if (!result.tracks || result.tracks.items.length === 0) return null;

          let track = result.tracks.items
            .filter(
              (t) =>
                !recentlyPlayedTracks.includes(t.id) &&
                !previousRecommendations.includes(t.id)
            )
            .find(
              (t) =>
                t.artists.some((a) =>
                  a.name.toLowerCase().includes(artistName.toLowerCase())
                ) && t.name.toLowerCase().includes(songName.toLowerCase())
            );

          if (!track && result.tracks.items.length > 0) {
            track = result.tracks.items[0];
          }

          if (!track) return null;

          let youtubeData = null;
          try {
            const youtubeResults = await searchYouTubeVideos(
              `${track.name} ${track.artists[0].name} official audio`
            );
            if (youtubeResults && youtubeResults.length > 0) {
              youtubeData = {
                videoId: youtubeResults[0].id.videoId,
                title: youtubeResults[0].snippet.title,
                thumbnail: youtubeResults[0].snippet.thumbnails.high.url,
              };
            }
          } catch (error) {
            console.warn(`YouTube search failed for ${track.name}:`, error);
          }

          return {
            songName: track.name,
            artistName: track.artists[0].name,
            songId: track.id,
            albumName: track.album.name,
            albumId: track.album.id,
            albumCover: track.album.images?.[0]?.url || null,
            previewUrl: track.preview_url,
            spotifyUrl: track.external_urls?.spotify || null,
            youtubeData,
          };
        } catch (error) {
          console.warn(`Failed to search for song ${songName}:`, error);
          return null;
        }
      })
    );

    // Process albums
    let verifiedAlbums = await Promise.all(
      albums.map(async (item) => {
        if (!item) return null;
        const { name: albumName, artist: artistName } = item;
    
        try {
          const result = await searchAlbums(
            `album:${albumName} artist:${artistName}`
          );
          if (!result.albums || result.albums.items.length === 0) return null;
    
          let album = result.albums.items
            .filter((a) => !previousRecommendations.includes(a.id))
            .find(
              (a) =>
                a.artists.some((artist) =>
                  artist.name.toLowerCase().includes(artistName.toLowerCase())
                ) && a.name.toLowerCase().includes(albumName.toLowerCase())
            );
    
          if (!album && result.albums.items.length > 0) {
            album = result.albums.items[0];
          }
    
          if (!album) return null;
    
          // Safe property access with type checking
          const albumCover = hasImages(album) && album.images.length > 0 
            ? album.images[0].url 
            : null;
          
          const releaseDate = isFullAlbum(album) 
            ? album.release_date 
            : null;
    
          return {
            albumName: album.name,
            artistName: album.artists[0].name,
            albumId: album.id,
            albumCover,
            spotifyUrl: album.external_urls?.spotify || null,
            releaseDate,
          };
        } catch (error) {
          console.warn(`Failed to search for album ${albumName}:`, error);
          return null;
        }
      })
    );

    const validVerifiedAlbums = verifiedAlbums.filter((album): album is NonNullable<typeof album> => album !== null);

    let finalAlbums;
    
    if (validVerifiedAlbums.length < 5) {
      const backupAlbums = await getBackupSuggestions(
        "albums",
        `${genre} ${mood}`,
        5 - validVerifiedAlbums.length,
        previousRecommendations
      );
    
      const processedBackupAlbums = (backupAlbums as SpotifyAlbumFull[]).map((album) => {
        const albumCover = hasImages(album) && album.images.length > 0 
          ? album.images[0].url 
          : null;
        
        const releaseDate = isFullAlbum(album) 
          ? album.release_date 
          : null;
      
        return {
          albumName: album.name,
          artistName: album.artists[0].name,
          albumId: album.id,
          albumCover,
          spotifyUrl: album.external_urls?.spotify || null,
          releaseDate,
        };
      });
    
      finalAlbums = [
        ...validVerifiedAlbums,
        ...processedBackupAlbums,
      ].slice(0, 5);
    } else {
      finalAlbums = validVerifiedAlbums.slice(0, 5);
    }

    const validVerifiedSongs = verifiedSongs.filter((song): song is NonNullable<typeof song> => song !== null);
    
    let finalSongs;
    if (validVerifiedSongs.length < 5) {
      const backupSongs = await getBackupSuggestions(
        "tracks",
        `${genre} ${mood}`,
        5 - validVerifiedSongs.length,
        [...recentlyPlayedTracks, ...previousRecommendations]
      );

      const processedBackupSongs = await Promise.all(
        (backupSongs as SpotifyTrack[]).map(async (track) => {
          let youtubeData = null;
          try {
            const youtubeResults = await searchYouTubeVideos(
              `${track.name} ${track.artists[0].name} official audio`
            );
            if (youtubeResults && youtubeResults.length > 0) {
              youtubeData = {
                videoId: youtubeResults[0].id.videoId,
                title: youtubeResults[0].snippet.title,
                thumbnail: youtubeResults[0].snippet.thumbnails.high.url,
              };
            }
          } catch (error) {
            console.warn(`YouTube search failed for ${track.name}:`, error);
          }

          return {
            songName: track.name,
            artistName: track.artists[0].name,
            songId: track.id,
            albumName: track.album.name,
            albumId: track.album.id,
            albumCover: track.album.images?.[0]?.url || null,
            previewUrl: track.preview_url,
            spotifyUrl: track.external_urls?.spotify || null,
            youtubeData,
          };
        })
      );

      finalSongs = [
        ...validVerifiedSongs,
        ...processedBackupSongs,
      ].slice(0, 5);
    } else {
      finalSongs = validVerifiedSongs.slice(0, 5);
    }

    // Cache the results
    userRecommendationCache.set(cacheKey, {
      timestamp: Date.now(),
      songs: finalSongs,
      albums: finalAlbums,
    });

    // Only save to database if user is authenticated and not anonymous
    if (userId !== "anonymous") {
      try {
        await saveUserRecommendationHistory(userId, {
          type: RecommendationType.MOOD_BASED,
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
            popularity: null,
          })),
          albums: finalAlbums.map((album, index) => ({
            albumId: album.albumId,
            position: index,
            name: album.albumName,
            artistNames: [album.artistName],
            imageUrl: album.albumCover,
            releaseDate: album.releaseDate,
            totalTracks: null,
          })),
        });
      } catch (error) {
        console.warn("Failed to save recommendation history:", error);
        // Continue without saving to database
      }
    }

    res.json({
      songs: finalSongs,
      albums: finalAlbums,
      fromCache: false,
    });
  } catch (err: any) {
    console.error("[AI SONG SEARCH ERROR]", err.message || err);
    res.status(500).json({ error: "Failed to retrieve music recommendations" });
  }
};

export const addToFavorites = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const { itemId, itemType } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!itemId || !itemType || !["song", "album"].includes(itemType)) {
    res
      .status(400)
      .json({
        error: "Invalid request. Required: itemId and itemType (song or album)",
      });
    return;
  }

  try {
    await addToUserFavorites(userId, itemId, itemType);
    res.json({ success: true });
  } catch (error) {
    console.error("[ADD TO FAVORITES ERROR]", error);
    res.status(500).json({ error: "Failed to add item to favorites" });
  }
};

export const removeFromFavorites = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const { itemId } = req.params;

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    await removeFromUserFavorites(userId, itemId);
    res.json({ success: true });
  } catch (error) {
    console.error("[REMOVE FROM FAVORITES ERROR]", error);
    res.status(500).json({ error: "Failed to remove item from favorites" });
  }
};

export const getFavorites = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const favorites = await getUserFavorites(userId);
    res.json(favorites);
  } catch (error) {
    console.error("[GET FAVORITES ERROR]", error);
    res.status(500).json({ error: "Failed to retrieve favorites" });
  }
};

export const getRecommendationHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const history = await getUserRecommendationHistory(userId);
    res.json(history);
  } catch (error) {
    console.error("[GET HISTORY ERROR]", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve recommendation history" });
  }
};