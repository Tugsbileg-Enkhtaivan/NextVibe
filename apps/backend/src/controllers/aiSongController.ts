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
import { MoodType, RecommendationType, ActivityType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  if (!mood || typeof mood !== 'string') {
    return MoodType.HAPPY;
  }
  
  const cleanMood = mood.trim().toUpperCase().replace(/\s+/g, '_');
  
  const moodMappings: Record<string, MoodType> = {
    'VERY_HAPPY': MoodType.VERY_HAPPY,
    'VERYHAPPY': MoodType.VERY_HAPPY,
    'SUPER_HAPPY': MoodType.VERY_HAPPY,
    'ECSTATIC': MoodType.EXCITED,
    'JOYFUL': MoodType.HAPPY,
    'CHEERFUL': MoodType.HAPPY,
    'DEPRESSED': MoodType.SAD,
    'MELANCHOLY': MoodType.MELANCHOLIC,
    'UPSET': MoodType.SAD,
    'MAD': MoodType.ANGRY,
    'FURIOUS': MoodType.ANGRY,
    'PEACEFUL': MoodType.PEACEFUL,
    'SERENE': MoodType.CALM,
    'TRANQUIL': MoodType.RELAXED,
    'CHILL': MoodType.CHILL,
    'LAID_BACK': MoodType.CHILL,
    'LAIDBACK': MoodType.CHILL,
    'CONCENTRATE': MoodType.FOCUSED,
    'CONCENTRATION': MoodType.FOCUSED,
    'STUDYING': MoodType.FOCUSED,
    'PARTYING': MoodType.PARTY,
    'CELEBRATION': MoodType.PARTY,
    'ROMANTIC': MoodType.ROMANTIC,
    'LOVE': MoodType.ROMANTIC,
    'NOSTALGIC': MoodType.NOSTALGIC,
    'REMINISCENT': MoodType.NOSTALGIC,
    'WORRIED': MoodType.ANXIETY,
    'NERVOUS': MoodType.ANXIETY,
    'ANXIOUS': MoodType.ANXIETY,
    'SCARED': MoodType.FEAR,
    'AFRAID': MoodType.FEAR,
    'JEALOUS': MoodType.ENVY,
    'ENVIOUS': MoodType.ENVY,
    'DISGUSTED': MoodType.DISGUST,
    'ASHAMED': MoodType.SHAME,
    'EMBARRASSED': MoodType.SHAME,
    'BORED': MoodType.ENNUI,
    'BORING': MoodType.ENNUI,
  };

  if (moodMappings[cleanMood]) {
    return moodMappings[cleanMood];
  }

  const moodKey = cleanMood as keyof typeof MoodType;
  if (MoodType[moodKey]) {
    return MoodType[moodKey];
  }

  return MoodType.HAPPY;
};

const convertToActivityType = (activity: string): ActivityType => {
  if (!activity || typeof activity !== 'string') {
    return ActivityType.WORKOUT;
  }
  
  const cleanActivity = activity.trim().toUpperCase().replace(/\s+/g, '_');
  
  const activityMappings: Record<string, ActivityType> = {
    'EXERCISE': ActivityType.WORKOUT,
    'FITNESS': ActivityType.WORKOUT,
    'TRAINING': ActivityType.WORKOUT,
    'LIFTING': ActivityType.GYM,
    'WEIGHTLIFTING': ActivityType.GYM,
    'CARDIO': ActivityType.WORKOUT,
    'JOGGING': ActivityType.RUNNING,
    'JOG': ActivityType.RUNNING,
    'SPRINT': ActivityType.RUNNING,
    'STROLL': ActivityType.WALKING,
    'WALK': ActivityType.WALKING,
    'HIKE': ActivityType.WALKING,
    'HIKING': ActivityType.WALKING,
    'CYCLE': ActivityType.BIKING,
    'CYCLING': ActivityType.BIKING,
    'BIKE': ActivityType.BIKING,
    'STUDYING': ActivityType.STUDY,
    'HOMEWORK': ActivityType.STUDY,
    'RESEARCH': ActivityType.STUDY,
    'LEARNING': ActivityType.STUDY,
    'WORKING': ActivityType.WORK,
    'JOB': ActivityType.WORK,
    'OFFICE': ActivityType.WORK,
    'BUSINESS': ActivityType.WORK,
    'PARTYING': ActivityType.PARTY,
    'CELEBRATING': ActivityType.PARTY,
    'CELEBRATION': ActivityType.PARTY,
    'RELAXING': ActivityType.RELAX,
    'RESTING': ActivityType.RELAX,
    'LOUNGING': ActivityType.RELAX,
    'CHILLING': ActivityType.RELAX,
    'CHILL': ActivityType.RELAX,
    'COMMUTING': ActivityType.COMMUTE,
    'DRIVING': ActivityType.COMMUTE,
    'TRANSPORT': ActivityType.COMMUTE,
    'PREPARING_FOOD': ActivityType.COOKING,
    'FOOD_PREP': ActivityType.COOKING,
    'KITCHEN': ActivityType.COOKING,
    'BAKING': ActivityType.COOKING,
    'CHEF': ActivityType.COOKING,
    'TIDYING': ActivityType.CLEANING,
    'HOUSEWORK': ActivityType.CLEANING,
    'CHORES': ActivityType.CLEANING,
    'SLEEPING': ActivityType.SLEEP,
    'NAP': ActivityType.SLEEP,
    'NAPPING': ActivityType.SLEEP,
    'REST': ActivityType.SLEEP,
    'BEDTIME': ActivityType.SLEEP,
    'MINDFULNESS': ActivityType.MEDITATION,
    'MEDITATE': ActivityType.MEDITATION,
    'ZEN': ActivityType.MEDITATION,
    'BOOK': ActivityType.READING,
    'READ': ActivityType.READING,
    'NOVEL': ActivityType.READING,
    'LITERATURE': ActivityType.READING,
    'GAME': ActivityType.GAMING,
    'GAMES': ActivityType.GAMING,
    'PLAY': ActivityType.GAMING,
    'VIDEO_GAMES': ActivityType.GAMING,
    'VIDEOGAMES': ActivityType.GAMING,
    'SOCIAL': ActivityType.SOCIALIZING,
    'FRIENDS': ActivityType.SOCIALIZING,
    'HANGING_OUT': ActivityType.SOCIALIZING,
    'HANGOUT': ActivityType.SOCIALIZING,
    'TRIP': ActivityType.TRAVELING,
    'TRAVEL': ActivityType.TRAVELING,
    'VACATION': ActivityType.TRAVELING,
    'JOURNEY': ActivityType.TRAVELING,
    'SHOP': ActivityType.SHOPPING,
    'SHOPPING': ActivityType.SHOPPING,
    'MALL': ActivityType.SHOPPING,
    'STORE': ActivityType.SHOPPING,
    'DATE': ActivityType.DATING,
    'DATING': ActivityType.DATING,
    'ROMANCE': ActivityType.DATING,
    'DANCE': ActivityType.DANCING,
    'DANCING': ActivityType.DANCING,
    'CLUB': ActivityType.DANCING,
    'DISCO': ActivityType.DANCING,
    'ART': ActivityType.DRAWING,
    'DRAWING': ActivityType.DRAWING,
    'PAINTING': ActivityType.DRAWING,
    'SKETCH': ActivityType.DRAWING,
    'CREATE': ActivityType.DRAWING,
    'GARDEN': ActivityType.GARDENING,
    'GARDENING': ActivityType.GARDENING,
    'PLANTS': ActivityType.GARDENING,
    'YARD_WORK': ActivityType.GARDENING,
    'YARDWORK': ActivityType.GARDENING,
    'DO_NOTHING': ActivityType.NOTHING,
    'IDLE': ActivityType.NOTHING,
    'WAITING': ActivityType.NOTHING,
    'BORED': ActivityType.NOTHING,
  };

  if (activityMappings[cleanActivity]) {
    return activityMappings[cleanActivity];
  }

  const activityKey = cleanActivity as keyof typeof ActivityType;
  if (ActivityType[activityKey]) {
    return ActivityType[activityKey];
  }

  return ActivityType.WORKOUT;
};

export const getAISongSuggestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { mood, genre, activity } = req.query as { mood: string; genre: string; activity: string; };
  const userId = req.user?.id || "anonymous";

  console.log('🎯 getAISongSuggestions called');
  console.log('👤 User ID:', userId);
  console.log('📝 Parameters:', { mood, genre, activity });

  if (!mood || !genre || !activity) {
    res.status(400).json({ error: "Mood, genre, and activity are required parameters" });
    return;
  }

  try {
    await authenticateSpotify();

    const cacheKey = `${userId}-${mood}-${genre}-${activity}`;
    const cachedRecommendations = userRecommendationCache.get(cacheKey);

    const shouldUseCache =
      cachedRecommendations &&
      Date.now() - cachedRecommendations.timestamp < CACHE_EXPIRATION &&
      Math.random() > 0.3;

    if (shouldUseCache) {
      console.log('📦 Returning cached recommendations');
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

Suggest 5 popular SONGS and 5 notable ALBUMS that are definitely available on Spotify based on:

Mood: ${mood}
Genre: ${genre}
Activity: ${activity}

Consider the activity context:
- If "workout" or "gym": energetic, motivating tracks with strong beats
- If "study" or "work": focus-friendly, minimal lyrics, ambient sounds
- If "party": danceable, crowd-pleasers, high energy
- If "relax" or "chill": calming, soothing, low tempo
- If "commute" or "travel": engaging but not overwhelming
- If "cooking": upbeat but not distracting
- If "sleep": very calm, minimal, peaceful

Important: Match the energy and tempo to the activity. Include diverse artists and time periods.

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

    console.log('🤖 Getting GPT recommendations...');
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

    console.log('🎵 Processing songs...');
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
                url: `https://www.youtube.com/watch?v=${youtubeResults[0].id.videoId}`
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
            spotifyUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
            youtubeData,
          };
        } catch (error) {
          console.warn(`Failed to search for song ${songName}:`, error);
          return null;
        }
      })
    );

    console.log('💽 Processing albums...');
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
            spotifyUrl: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
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
          spotifyUrl: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
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
            spotifyUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
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

    console.log('📊 Final results:', {
      songsCount: finalSongs.length,
      albumsCount: finalAlbums.length,
      userId: userId,
      isAnonymous: userId === "anonymous"
    });

if (userId !== "anonymous") {
  console.log('💾 Attempting to save recommendation history...');
  
  try {
    const historyData = {
      type: RecommendationType.MOOD_BASED,
      mood: convertToMoodType(mood),
      activity: convertToActivityType(activity),
      genres: [genre], // Array of strings
      seedTracks: [], // Empty array for mood-based recommendations
      seedArtists: [], // Empty array for mood-based recommendations
      parameters: { mood, genre, activity }, // Object with search parameters
      
      // FIXED: Proper track data structure
      tracks: finalSongs.map((song, index) => ({
        trackId: song.songId,
        position: index,
        name: song.songName,
        artistNames: [song.artistName], // Array of strings
        albumName: song.albumName,
        imageUrl: song.albumCover,
        previewUrl: song.previewUrl,
        duration: null, // You might want to get this from Spotify API
        popularity: null, // You might want to get this from Spotify API
      })),
      
      // FIXED: Proper album data structure
      albums: finalAlbums.map((album, index) => ({
        albumId: album.albumId,
        position: index,
        name: album.albumName,
        artistNames: [album.artistName], // Array of strings
        imageUrl: album.albumCover,
        releaseDate: album.releaseDate,
        totalTracks: null, // You might want to get this from Spotify API
      })),
    };

    console.log('📋 Prepared history data:', {
      userId,
      type: historyData.type,
      mood: historyData.mood,
      activity: historyData.activity,
      tracksCount: historyData.tracks.length,
      albumsCount: historyData.albums.length,
      sampleTrack: historyData.tracks[0] || null,
      sampleAlbum: historyData.albums[0] || null,
    });

    const savedRecommendation = await saveUserRecommendationHistory(userId, historyData);
    
    console.log('✅ Successfully saved recommendation history!');
    console.log('📋 Saved recommendation ID:', savedRecommendation.id);

    const verificationHistory = await getUserRecommendationHistory(userId, 1);
    console.log('📊 Verification - Latest recommendation:', {
      found: verificationHistory.length > 0,
      latestId: verificationHistory[0]?.id || 'none',
      tracksCount: verificationHistory[0]?.tracks?.length || 0,
      albumsCount: verificationHistory[0]?.albums?.length || 0,
    });
    
  } catch (saveError: any) {
    console.error("❌ FAILED TO SAVE RECOMMENDATION HISTORY");
    console.error("❌ Error type:", saveError.constructor.name);
    console.error("❌ Error message:", saveError.message);
    console.error("❌ Error code:", saveError.code);
    console.error("❌ Error meta:", saveError.meta);
    console.error("❌ Error stack:", saveError.stack);
    
    // FIXED: More detailed error analysis
    if (saveError.code === 'P2002') {
      console.error("❌ Unique constraint violation - possible duplicate data");
    } else if (saveError.code === 'P2003') {
      console.error("❌ Foreign key constraint violation - user might not exist");
    } else if (saveError.code === 'P2025') {
      console.error("❌ Record not found - related data missing");
    }
    
    // Don't let save errors break the API response
    // But log them prominently for debugging
  }
} else {
  console.log('🚫 Skipping history save - anonymous user');
}

    console.log('📤 Sending response to client...');
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

export const addToFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { itemId, itemType, itemData } = req.body;
    
    if (!itemId || !itemType) {
      res.status(400).json({ 
        error: 'Missing required fields: itemId and itemType' 
      });
      return;
    }

    // Validate item type
    if (!['track', 'album', 'artist', 'playlist'].includes(itemType)) {
      res.status(400).json({ 
        error: 'Invalid itemType. Must be: track, album, artist, or playlist' 
      });
      return;
    }

    console.log(`Adding to favorites - User: ${userId}, Item: ${itemId}, Type: ${itemType}`);

    const favorite = await addToUserFavorites(userId, itemId, itemType);
    
    res.status(201).json({
      success: true,
      message: 'Added to favorites successfully',
      favorite
    });
  } catch (error: any) {
    console.error('Error in addToFavorites controller:', error);
    
    if (error.message.includes('already exists')) {
      res.status(409).json({ 
        error: 'Item already in favorites',
        message: error.message 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to add to favorites',
      message: error.message 
    });
  }
};

export const removeFromFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { itemId } = req.params;
    
    if (!itemId) {
      res.status(400).json({ error: 'Missing itemId parameter' });
      return;
    }

    console.log(`Removing from favorites - User: ${userId}, Item: ${itemId}`);

    const result = await removeFromUserFavorites(userId, itemId);
    
    if (result.count === 0) {
      res.status(404).json({ 
        error: 'Item not found in favorites' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Removed from favorites successfully',
      removedCount: result.count
    });
  } catch (error: any) {
    console.error('Error in removeFromFavorites controller:', error);
    res.status(500).json({ 
      error: 'Failed to remove from favorites',
      message: error.message 
    });
  }
};

export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    console.log(`Getting favorites for user: ${userId}`);

    const favorites = await getUserFavorites(userId);
    
    const transformedFavorites = {
      tracks: favorites.tracks.map(track => ({
        trackId: track.trackId,
        trackName: track.trackName,
        artistName: track.artistName,
        albumName: track.albumName,
        albumCover: track.albumCover,
        previewUrl: track.previewUrl,
        spotifyUrl: track.spotifyUrl,
        addedAt: track.addedAt, // Use addedAt instead of createdAt
        youtubeData: null // You can add YouTube search here if needed
      })),
      albums: favorites.albums.map(album => ({
        albumId: album.albumId,
        albumName: album.albumName,
        artistName: album.artistName,
        albumCover: album.albumCover,
        spotifyUrl: album.spotifyUrl,
        releaseDate: album.releaseDate,
        addedAt: album.addedAt // Use addedAt instead of createdAt
      }))
    };

    res.status(200).json(transformedFavorites);
  } catch (error: any) {
    console.error('Error in getFavorites controller:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve favorites',
      message: error.message 
    });
  }
};

export const getRecommendationHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  console.log('🎯 getRecommendationHistory called');
  console.log('👤 User ID from request:', userId);
  console.log('🔐 Full user object:', req.user);

  if (!userId) {
    console.log('❌ No user ID found - authentication required');
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    console.log('⏳ Calling getUserRecommendationHistory...');
    const history = await getUserRecommendationHistory(userId);
    
    console.log('📋 History result:', {
      count: history.length,
      type: typeof history,
      isArray: Array.isArray(history)
    });

    // Log first few recommendations for debugging
    if (history.length > 0) {
      console.log('🎵 First recommendation details:', {
        id: history[0].id,
        type: history[0].type,
        mood: history[0].mood,
        activity: history[0].activity,
        createdAt: history[0].createdAt,
        tracksCount: history[0].tracks?.length || 0,
        albumsCount: history[0].albums?.length || 0
      });
    }

    // Return the array directly (not wrapped in an object)
    // This matches what your frontend expects
// Convert genres from string to array if needed
const normalizedHistory = history.map(entry => ({
  ...entry,
  genres: Array.isArray(entry.genres)
    ? entry.genres
    : typeof entry.genres === 'string'
      ? [entry.genres]
      : []
}));

res.json(normalizedHistory);
    
  } catch (error: any) {
    console.error("[GET HISTORY ERROR]", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({ 
      error: "Failed to retrieve recommendation history",
      details: error.message 
    });
  }
};

export const checkFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { itemIds } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds)) {
      res.status(400).json({ 
        error: 'Missing or invalid itemIds. Expected an array of item IDs.' 
      });
      return;
    }

    if (itemIds.length === 0) {
      // Frontend expects 'favorited' not 'favoritedItems'
      res.status(200).json({ favorited: [] });
      return;
    }

    console.log(`Checking favorites for user: ${userId}, items: ${itemIds.join(', ')}`);

    const favorites = await getUserFavorites(userId);
    
    const favoritedItemIds = new Set([
      ...favorites.tracks.map(track => track.trackId),
      ...favorites.albums.map(album => album.albumId)
    ]);

    const favoritedItems = itemIds.filter(itemId => favoritedItemIds.has(itemId));

    // Match frontend expectations
    res.status(200).json({
      success: true,
      favorited: favoritedItems,  // Changed from 'favoritedItems'
      totalChecked: itemIds.length,
      totalFavorited: favoritedItems.length
    });
  } catch (error: any) {
    console.error('Error in checkFavorites controller:', error);
    res.status(500).json({ 
      error: 'Failed to check favorites',
      message: error.message 
    });
  }
};
