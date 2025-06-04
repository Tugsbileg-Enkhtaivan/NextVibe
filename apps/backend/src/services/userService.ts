import { PrismaClient, MoodType, FavoriteType, RecommendationType, EnergyLevel, ValenceLevel, ActivityType } from '@prisma/client';
import { searchTracks, searchAlbums } from '../services/spotifyService';
import { isTrackSearchResponse, isAlbumSearchResponse } from '../utils/spotifyUtils';

const prisma = new PrismaClient();

interface RecommendationData {
  type: RecommendationType;
  mood?: MoodType;
  energy?: EnergyLevel;
  valence?: ValenceLevel;
  activity?: ActivityType;
  genres: string[];
  seedTracks?: string[];
  seedArtists?: string[];
  parameters?: any;
  tracks: any[];
  albums: any[];
}

export const ensureUserExistsInService = async (userId: string) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      console.log(`🔄 Creating user ${userId} in service...`);
      
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@temp.com`,
          username: `user_${userId.substring(0, 8)}`,
          profile: {
            create: {}
          }
        },
        include: {
          profile: true
        }
      });
      
      console.log(`✅ User created in service: ${userId}`);
    }

    return user;
  } catch (error: any) {
    if (error.code === 'P2002') {
      // User already exists (race condition)
      return await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
    }
    throw error;
  }
};

export const saveUserRecommendationHistory = async (
  userId: string,
  recommendation: RecommendationData
) => {
  try {
    await ensureUserExistsInService(userId);

    const savedRecommendation = await prisma.recommendation.create({
      data: {
        userId,
        type: recommendation.type,
        mood: recommendation.mood,
        energy: recommendation.energy,
        valence: recommendation.valence,
        genres: recommendation.genres,
        activity: recommendation.activity,
        seedTracks: recommendation.seedTracks || [],
        seedArtists: recommendation.seedArtists || [],
        parameters: recommendation.parameters,
        tracks: {
          create: recommendation.tracks.map((track, index) => ({
            trackId: track.id || track.trackId || track.songId,
            position: index,
            name: track.name || track.songName,
            artistNames: Array.isArray(track.artists) 
              ? track.artists.map((artist: any) => artist.name)
              : Array.isArray(track.artistNames) 
                ? track.artistNames
                : [track.artist || track.artistName || 'Unknown'],
            albumName: track.album?.name || track.albumName || 'Unknown',
            imageUrl: track.album?.images?.[0]?.url || track.imageUrl || track.albumCover || null,
            previewUrl: track.preview_url || track.previewUrl || null,
            duration: track.duration_ms || track.duration || null,
            popularity: track.popularity || null
          }))
        },
        albums: {
          create: recommendation.albums.map((album, index) => ({
            albumId: album.id || album.albumId,
            position: index,
            name: album.name || album.albumName,
            artistNames: Array.isArray(album.artists) 
              ? album.artists.map((artist: any) => artist.name)
              : Array.isArray(album.artistNames)
                ? album.artistNames
                : [album.artist || album.artistName || 'Unknown'],
            imageUrl: album.images?.[0]?.url || album.imageUrl || album.albumCover || null,
            releaseDate: album.release_date || album.releaseDate || null,
            totalTracks: album.total_tracks || album.totalTracks || null
          }))
        }
      },
      include: {
        tracks: true,
        albums: true
      }
    });

    console.log(`✅ Recommendation saved for user ${userId}`);
    return savedRecommendation;
  } catch (error: any) {
    console.error('❌ Error saving recommendation history:', error);
    throw new Error(`Failed to save recommendation history: ${error.message}`);
  }
};

export const getUserRecommendationHistory = async (
  userId: string,
  limit: number = 10
) => {
  try {
    await ensureUserExistsInService(userId);

    const recommendations = await prisma.recommendation.findMany({
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

    console.log(`✅ Retrieved ${recommendations.length} recommendations for user ${userId}`);
    return recommendations;
  } catch (error) {
    console.error('❌ Error retrieving recommendation history:', error);
    return [];
  }
};

export const saveMoodEntry = async (
  userId: string,
  moodData: {
    mood: MoodType;
    energy: EnergyLevel;
    valence: ValenceLevel;
    genres: string[];
    description?: string;
  }
) => {
  try {
    await ensureUserExistsInService(userId);

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId,
        mood: moodData.mood,
        energy: moodData.energy,
        valence: moodData.valence,
        genres: moodData.genres,
        description: moodData.description
      }
    });

    console.log(`✅ Mood entry saved for user ${userId}`);
    return moodEntry;
  } catch (error) {
    console.error('Error saving mood entry:', error);
    throw new Error('Failed to save mood entry');
  }
};

export const addToUserFavorites = async (
  userId: string,
  itemId: string,
  itemType: 'track' | 'album' | 'artist' | 'playlist'
) => {
  try {
    console.log(`🔄 Adding to favorites - User: ${userId}, Item: ${itemId}, Type: ${itemType}`);

    await ensureUserExistsInService(userId);

    const favoriteType: FavoriteType = itemType.toUpperCase() as FavoriteType;
    
    const existing = await prisma.favorite.findFirst({
      where: {
        userId,
        itemId,
        type: favoriteType
      }
    });

    if (existing) {
      console.log(`⚠️ Item ${itemId} already in favorites for user ${userId}`);
      throw new Error('Item already exists in favorites');
    }

    let name = 'Unknown';
    let artistNames: string[] = ['Unknown'];
    let imageUrl = '';
    let metadata: any = {};

    if (itemType === 'track') {
      try {
        console.log(`🔍 Fetching track details for ${itemId}`);
        const result = await searchTracks(`track:${itemId}`, 1);
        
        if (isTrackSearchResponse(result) && result.tracks.items.length > 0) {
          const track = result.tracks.items[0];
          name = track.name;
          artistNames = track.artists.map(artist => artist.name);
          imageUrl = track.album.images?.[0]?.url || '';
          metadata = {
            albumId: track.album.id,
            albumName: track.album.name,
            previewUrl: track.preview_url,
            duration: track.duration_ms,
            popularity: track.popularity,
            spotifyUrl: track.external_urls?.spotify || null,
            explicit: track.explicit || false
          };
          console.log(`✅ Track details fetched: ${name} by ${artistNames.join(', ')}`);
        } else {
          console.warn(`⚠️ No track found for ID: ${itemId}`);
          const directResult = await searchTracks(`id:${itemId}`, 1);
          if (isTrackSearchResponse(directResult) && directResult.tracks.items.length > 0) {
            const track = directResult.tracks.items[0];
            name = track.name;
            artistNames = track.artists.map(artist => artist.name);
            imageUrl = track.album.images?.[0]?.url || '';
            metadata = {
              albumId: track.album.id,
              albumName: track.album.name,
              previewUrl: track.preview_url,
              duration: track.duration_ms,
              popularity: track.popularity,
              spotifyUrl: track.external_urls?.spotify || null,
              explicit: track.explicit || false
            };
          }
        }
      } catch (searchError) {
        console.warn(`⚠️ Failed to fetch track details for ${itemId}:`, searchError);
      }
    } else if (itemType === 'album') {
      try {
        console.log(`🔍 Fetching album details for ${itemId}`);
        const result = await searchAlbums(`album:${itemId}`, 1);
        
        if (isAlbumSearchResponse(result) && result.albums.items.length > 0) {
          const album = result.albums.items[0];
          name = album.name;
          artistNames = album.artists.map(artist => artist.name);
          imageUrl = album.images?.[0]?.url || '';
          metadata = {
            releaseDate: album.release_date,
            totalTracks: album.total_tracks,
            spotifyUrl: album.external_urls?.spotify || null,
            albumType: album.album_type
          };
          console.log(`✅ Album details fetched: ${name} by ${artistNames.join(', ')}`);
        } else {
          console.warn(`⚠️ No album found for ID: ${itemId}`);
          const directResult = await searchAlbums(`id:${itemId}`, 1);
          if (isAlbumSearchResponse(directResult) && directResult.albums.items.length > 0) {
            const album = directResult.albums.items[0];
            name = album.name;
            artistNames = album.artists.map(artist => artist.name);
            imageUrl = album.images?.[0]?.url || '';
            metadata = {
              releaseDate: album.release_date,
              totalTracks: album.total_tracks,
              spotifyUrl: album.external_urls?.spotify || null,
              albumType: album.album_type
            };
          }
        }
      } catch (searchError) {
        console.warn(`⚠️ Failed to fetch album details for ${itemId}:`, searchError);
      }
    }

    const favorite = await prisma.favorite.create({
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

    console.log(`✅ Successfully added ${name} to favorites for user ${userId}`);
    return favorite;
    
  } catch (error: any) {
    console.error('Error adding to favorites:', error);
    
    if (error.code === 'P2003') {
      throw new Error('User not found. Please ensure user is properly authenticated.');
    }
    
    if (error.code === 'P2002') {
      throw new Error('Item already exists in favorites');
    }
    
    if (error.message.includes('already exists')) {
      throw error; // Re-throw our custom error
    }
    
    throw new Error(`Failed to add item to favorites: ${error.message}`);
  }
};

export const removeFromUserFavorites = async (
  userId: string,
  itemId: string
) => {
  try {
    console.log(`🔄 Removing from favorites - User: ${userId}, Item: ${itemId}`);
    
    const result = await prisma.favorite.deleteMany({
      where: { 
        userId, 
        itemId 
      }
    });
    
    console.log(`✅ Removed ${result.count} favorite(s) for user ${userId}`);
    return result;
    
  } catch (error: any) {
    console.error('❌ Error removing from favorites:', error);
    throw new Error(`Failed to remove item from favorites: ${error.message}`);
  }
};

export const getUserFavorites = async (userId: string) => {
  try {
    console.log(`🔄 Getting favorites for user: ${userId}`);
    
    await ensureUserExistsInService(userId);

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' }
    });

    console.log(`✅ Found ${favorites.length} favorites for user ${userId}`);

    const tracks = favorites
      .filter(fav => fav.type === 'TRACK')
      .map(fav => ({
        trackId: fav.itemId,
        trackName: fav.name,
        artistName: fav.artistNames[0] || 'Unknown',
        artistNames: fav.artistNames,
        albumId: (fav.metadata as any)?.albumId,
        albumName: (fav.metadata as any)?.albumName || 'Unknown Album',
        albumCover: fav.imageUrl,
        previewUrl: (fav.metadata as any)?.previewUrl,
        duration: (fav.metadata as any)?.duration,
        popularity: (fav.metadata as any)?.popularity,
        spotifyUrl: (fav.metadata as any)?.spotifyUrl,
        addedAt: fav.addedAt,
        explicit: (fav.metadata as any)?.explicit || false
      }));

    const albums = favorites
      .filter(fav => fav.type === 'ALBUM')
      .map(fav => ({
        albumId: fav.itemId,
        albumName: fav.name,
        artistName: fav.artistNames[0] || 'Unknown',
        artistNames: fav.artistNames,
        albumCover: fav.imageUrl,
        releaseDate: (fav.metadata as any)?.releaseDate,
        totalTracks: (fav.metadata as any)?.totalTracks,
        spotifyUrl: (fav.metadata as any)?.spotifyUrl,
        albumType: (fav.metadata as any)?.albumType,
        addedAt: fav.addedAt
      }));

    const artists = favorites
      .filter(fav => fav.type === 'ARTIST')
      .map(fav => ({
        artistId: fav.itemId,
        artistName: fav.name,
        imageUrl: fav.imageUrl,
        spotifyUrl: (fav.metadata as any)?.spotifyUrl,
        addedAt: fav.addedAt
      }));

    const playlists = favorites
      .filter(fav => fav.type === 'PLAYLIST')
      .map(fav => ({
        playlistId: fav.itemId,
        playlistName: fav.name,
        imageUrl: fav.imageUrl,
        spotifyUrl: (fav.metadata as any)?.spotifyUrl,
        addedAt: fav.addedAt
      }));

    return { tracks, albums, artists, playlists };
    
  } catch (error: any) {
    console.error('❌ Error retrieving favorites:', error);
    
    if (error.message.includes('User') && error.message.includes('not found')) {
      console.warn(`User ${userId} not found, returning empty favorites`);
      return { tracks: [], albums: [], artists: [], playlists: [] };
    }
    
    throw new Error(`Failed to retrieve favorites: ${error.message}`);
  }
};

export const getMoodBasedRecommendations = async (
  userId: string,
  mood: MoodType,
  energy?: EnergyLevel,
  valence?: ValenceLevel,
  genres: string[] = [],
  limit: number = 20
) => {
  try {
    return await prisma.recommendation.findMany({
      where: {
        userId,
        type: 'MOOD_BASED',
        mood,
        ...(energy && { energy }),
        ...(valence && { valence })
      },
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
  } catch (error) {
    console.error('Error getting mood-based recommendations:', error);
    throw new Error('Failed to get mood-based recommendations');
  }
};

export const getUserMoodHistory = async (userId: string, limit: number = 30) => {
  try {
    return await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error getting mood history:', error);
    throw new Error('Failed to get mood history');
  }
};