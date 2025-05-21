import { Request, Response } from "express";
import { getGPTRecommendations } from "../services/gptService";
import {
  authenticateSpotify,
  searchAlbums,
  searchTracks,
  getUserRecentlyPlayed,
} from "../services/spotifyService";
import { isAlbumSearchResponse, isTrackSearchResponse } from "../utils/spotifyUtils";
import { searchYouTubeVideos } from "../services/youtubeService";
import { 
  saveUserRecommendationHistory, 
  getUserRecommendationHistory,
  addToUserFavorites,
  getUserFavorites,
  removeFromUserFavorites
} from "../services/userService";

// Cache to store previously recommended songs to avoid repetition
const userRecommendationCache = new Map<string, {
  timestamp: number,
  songs: any[],
  albums: any[]
}>();

// Cache expiration time (6 hours in milliseconds)
const CACHE_EXPIRATION = 6 * 60 * 60 * 1000;

export const getAISongSuggestions = async (req: Request, res: Response): Promise<void> => {
  const { mood, genre } = req.query as { mood: string; genre: string };
  const userId = req.user?.id || 'anonymous'; // Assuming you have user auth middleware

  if (!mood || !genre) {
    res.status(400).json({ error: "Mood and genre are required parameters" });
    return;
  }

  try {
    await authenticateSpotify();
    
    // Check if we have recent recommendations for this user with same mood/genre
    const cacheKey = `${userId}-${mood}-${genre}`;
    const cachedRecommendations = userRecommendationCache.get(cacheKey);
    
    // Use cached recommendations if they exist and are less than 6 hours old
    // Add randomization to sometimes generate new recommendations even if cache exists
    const shouldUseCache = cachedRecommendations && 
                          (Date.now() - cachedRecommendations.timestamp < CACHE_EXPIRATION) &&
                          (Math.random() > 0.3); // 70% chance to use cache, 30% to generate new
    
    if (shouldUseCache) {
      res.json({
        songs: cachedRecommendations.songs,
        albums: cachedRecommendations.albums,
        fromCache: true
      });
      return;
    }
    
    // Get user's recently played tracks to avoid recommending them again
    let recentlyPlayedTracks: string[] = [];
    try {
      if (userId !== 'anonymous') {
        const recentlyPlayed = await getUserRecentlyPlayed(userId);
        recentlyPlayedTracks = recentlyPlayed.map(track => track.id);
      }
    } catch (error) {
      console.warn("Failed to get recently played tracks:", error);
    }
    
    // Get previous recommendations to avoid repeating them
    let previousRecommendations: string[] = [];
    try {
      if (userId !== 'anonymous') {
        const history = await getUserRecommendationHistory(userId);
        previousRecommendations = history.flatMap(rec => 
          [...(rec.songs?.map(s => s.songId) || []), ...(rec.albums?.map(a => a.albumId) || [])]
        );
      }
    } catch (error) {
      console.warn("Failed to get recommendation history:", error);
    }

    // Create a more specific prompt with history avoidance
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

    // Improved parsing with better error handling
    const parseList = (text: string) => {
      return text
        .trim()
        .split("\n")
        .filter(line => line.trim() !== '')
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

    // Improved backup recommendations mechanism
    const getBackupSuggestions = async (type: 'tracks' | 'albums', searchTerm: string, count: number, excludeIds: string[] = []) => {
      if (type === 'tracks') {
        const result = await searchTracks(`${genre} ${mood}`);
        if (isTrackSearchResponse(result) && result.tracks.items.length > 0) {
          // Filter out recently played or previously recommended tracks
          return result.tracks.items
            .filter(track => !excludeIds.includes(track.id))
            .slice(0, count);
        }
      } else {
        const result = await searchAlbums(`${genre} ${mood}`);
        if (isAlbumSearchResponse(result) && result.albums.items.length > 0) {
          // Filter out previously recommended albums
          return result.albums.items
            .filter(album => !excludeIds.includes(album.id))
            .slice(0, count);
        }
      }
      return [];
    };

    // Process songs with YouTube integration
    let verifiedSongs = await Promise.all(
      songs.map(async (item) => {
        if (!item) return null;
        const { name: songName, artist: artistName } = item;
        
        const result = await searchTracks(`track:${songName} artist:${artistName}`);
        if (!isTrackSearchResponse(result)) return null;
    
        // Find the best match while avoiding recently played tracks
        let track = result.tracks.items
          .filter(t => !recentlyPlayedTracks.includes(t.id) && !previousRecommendations.includes(t.id))
          .find(t =>
            t.artists.some(a => a.name.toLowerCase().includes(artistName.toLowerCase())) &&
            t.name.toLowerCase().includes(songName.toLowerCase())
          );
    
        // If no filtered matches found, try unfiltered
        if (!track && result.tracks.items.length > 0) {
          track = result.tracks.items[0];
        }
        
        if (!track) return null;
        
        // Find YouTube video for the track
        let youtubeData = null;
        try {
          const youtubeResults = await searchYouTubeVideos(`${track.name} ${track.artists[0].name} official audio`);
          if (youtubeResults && youtubeResults.length > 0) {
            youtubeData = {
              videoId: youtubeResults[0].id.videoId,
              title: youtubeResults[0].snippet.title,
              thumbnail: youtubeResults[0].snippet.thumbnails.high.url
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
          youtubeData
        };
      })
    );
    
    // Add backup songs if needed
    if (verifiedSongs.filter(Boolean).length < 5) {
      const backupTracks = await getBackupSuggestions(
        'tracks', 
        `${genre} ${mood}`, 
        5 - verifiedSongs.filter(Boolean).length,
        [...recentlyPlayedTracks, ...previousRecommendations]
      );
      
      const backupSongsWithYoutube = await Promise.all(backupTracks.map(async track => {
        // Find YouTube video for backup tracks too
        let youtubeData = null;
        try {
          const youtubeResults = await searchYouTubeVideos(`${track.name} ${track.artists[0].name} official audio`);
          if (youtubeResults && youtubeResults.length > 0) {
            youtubeData = {
              videoId: youtubeResults[0].id.videoId,
              title: youtubeResults[0].snippet.title,
              thumbnail: youtubeResults[0].snippet.thumbnails.high.url
            };
          }
        } catch (error) {
          console.warn(`YouTube search failed for backup track ${track.name}:`, error);
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
          youtubeData
        };
      }));
      
      verifiedSongs = [...verifiedSongs.filter(Boolean), ...backupSongsWithYoutube];
    }

    // Process albums while avoiding previously recommended ones
    let verifiedAlbums = await Promise.all(
      albums.map(async (item) => {
        if (!item) return null;
        const { name: albumName, artist: artistName } = item;
        
        const result = await searchAlbums(`album:${albumName} artist:${artistName}`);
        if (!isAlbumSearchResponse(result)) return null;
    
        // Find best match while avoiding previous recommendations
        let album = result.albums.items
          .filter(a => !previousRecommendations.includes(a.id))
          .find(a =>
            a.artists.some(artist => artist.name.toLowerCase().includes(artistName.toLowerCase())) &&
            a.name.toLowerCase().includes(albumName.toLowerCase())
          );
    
        // If no filtered matches found, try unfiltered
        if (!album && result.albums.items.length > 0) {
          album = result.albums.items[0];
        }
        
        if (!album) return null;
    
        return {
          albumName: album.name,
          artistName: album.artists[0].name,
          albumId: album.id,
          albumCover: album.images?.[0]?.url || null,
          spotifyUrl: album.external_urls?.spotify || null,
          releaseDate: album.release_date || null,
        };
      })
    );
    
    // Add backup albums if needed
    if (verifiedAlbums.filter(Boolean).length < 5) {
      const backupAlbums = await getBackupSuggestions(
        'albums', 
        `${genre} ${mood}`, 
        5 - verifiedAlbums.filter(Boolean).length,
        previousRecommendations
      );
      
      const processedBackupAlbums = backupAlbums.map(album => ({
        albumName: album.name,
        artistName: album.artists[0].name,
        albumId: album.id,
        albumCover: album.images?.[0]?.url || null,
        spotifyUrl: album.external_urls?.spotify || null,
        releaseDate: album.release_date || null,
      }));
      
      verifiedAlbums = [...verifiedAlbums.filter(Boolean), ...processedBackupAlbums];
    }
    
    // Limit to exactly 5 songs and 5 albums
    const finalSongs = verifiedSongs.slice(0, 5);
    const finalAlbums = verifiedAlbums.slice(0, 5);
    
    // Save recommendations to cache
    userRecommendationCache.set(cacheKey, {
      timestamp: Date.now(),
      songs: finalSongs,
      albums: finalAlbums
    });
    
    // Save to user history if authenticated
    if (userId !== 'anonymous') {
      try {
        await saveUserRecommendationHistory(userId, {
          mood,
          genre,
          timestamp: new Date(),
          songs: finalSongs,
          albums: finalAlbums
        });
      } catch (error) {
        console.warn("Failed to save recommendation history:", error);
      }
    }

    res.json({
      songs: finalSongs,
      albums: finalAlbums,
      fromCache: false
    });
  } catch (err: any) {
    console.error("[AI SONG SEARCH ERROR]", err.message || err);
    res.status(500).json({ error: "Failed to retrieve music recommendations" });
  }
};

// Save a track or album to user favorites
export const addToFavorites = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
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
    await addToUserFavorites(userId, itemId, itemType);
    res.json({ success: true });
  } catch (error) {
    console.error("[ADD TO FAVORITES ERROR]", error);
    res.status(500).json({ error: "Failed to add item to favorites" });
  }
};

// Remove a track or album from user favorites
export const removeFromFavorites = async (req: Request, res: Response): Promise<void> => {
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

// Get user favorites
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
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

// Get user recommendation history
export const getRecommendationHistory = async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ error: "Failed to retrieve recommendation history" });
  }
};