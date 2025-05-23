import { PrismaClient, MoodType, FavoriteType, RecommendationType, EnergyLevel, ValenceLevel } from '@prisma/client';
import { searchTracks, searchAlbums } from '../services/spotifyService';
import { isTrackSearchResponse, isAlbumSearchResponse } from '../utils/spotifyUtils';

const prisma = new PrismaClient();

interface RecommendationData {
  type: RecommendationType;
  mood?: MoodType;
  energy?: EnergyLevel;
  valence?: ValenceLevel;
  genres: string[];
  seedTracks?: string[];
  seedArtists?: string[];
  parameters?: any;
  tracks: any[];
  albums: any[];
}

export const saveUserRecommendationHistory = async (
  userId: string,
  recommendation: RecommendationData
) => {
  try {
    return await prisma.recommendation.create({
      data: {
        userId,
        type: recommendation.type,
        mood: recommendation.mood,
        energy: recommendation.energy,
        valence: recommendation.valence,
        genres: recommendation.genres,
        seedTracks: recommendation.seedTracks || [],
        seedArtists: recommendation.seedArtists || [],
        parameters: recommendation.parameters,
        tracks: {
          create: recommendation.tracks.map((track, index) => ({
            trackId: track.id || track.trackId,
            position: index,
            name: track.name,
            artistNames: Array.isArray(track.artists) 
              ? track.artists.map((artist: any) => artist.name)
              : [track.artist || 'Unknown'],
            albumName: track.album?.name || track.albumName,
            imageUrl: track.album?.images?.[0]?.url || track.imageUrl || track.albumCover,
            previewUrl: track.preview_url || track.previewUrl,
            duration: track.duration_ms || track.duration,
            popularity: track.popularity
          }))
        },
        albums: {
          create: recommendation.albums.map((album, index) => ({
            albumId: album.id || album.albumId,
            position: index,
            name: album.name,
            artistNames: Array.isArray(album.artists) 
              ? album.artists.map((artist: any) => artist.name)
              : [album.artist || 'Unknown'],
            imageUrl: album.images?.[0]?.url || album.imageUrl || album.albumCover,
            releaseDate: album.release_date || album.releaseDate,
            totalTracks: album.total_tracks || album.totalTracks
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error saving recommendation history:', error);
    throw new Error('Failed to save recommendation history');
  }
};

export const getUserRecommendationHistory = async (
  userId: string,
  limit: number = 10
) => {
  try {
    return await prisma.recommendation.findMany({
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
  } catch (error) {
    console.error('Error retrieving recommendation history:', error);
    throw new Error('Failed to retrieve recommendation history');
  }
};

export const addToUserFavorites = async (
  userId: string,
  itemId: string,
  itemType: 'track' | 'album' | 'artist' | 'playlist'
) => {
  try {
    // Convert itemType to match Prisma enum
    const favoriteType: FavoriteType = itemType.toUpperCase() as FavoriteType;
    
    const existing = await prisma.favorite.findFirst({
      where: {
        userId,
        itemId,
        type: favoriteType
      }
    });

    if (existing) return existing;

    let name = 'Unknown';
    let artistNames: string[] = ['Unknown'];
    let imageUrl = '';
    let metadata: any = {};

    if (itemType === 'track') {
      const result = await searchTracks(`id:${itemId}`);
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
          spotifyUrl: track.external_urls?.spotify || null
        };
      }
    } else if (itemType === 'album') {
      const result = await searchAlbums(`id:${itemId}`);
      if (isAlbumSearchResponse(result) && result.albums.items.length > 0) {
        const album = result.albums.items[0];
        name = album.name;
        artistNames = album.artists.map(artist => artist.name);
        imageUrl = album.images?.[0]?.url || '';
        metadata = {
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          spotifyUrl: album.external_urls?.spotify || null
        };
      }
    }

    return await prisma.favorite.create({
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
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw new Error('Failed to add item to favorites');
  }
};

export const removeFromUserFavorites = async (
  userId: string,
  itemId: string
) => {
  try {
    return await prisma.favorite.deleteMany({
      where: { userId, itemId }
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw new Error('Failed to remove item from favorites');
  }
};

export const getUserFavorites = async (userId: string) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' }
    });

    const tracks = favorites
      .filter(fav => fav.type === 'TRACK')
      .map(fav => ({
        trackId: fav.itemId,
        trackName: fav.name,
        artistName: fav.artistNames[0] || 'Unknown',
        artistNames: fav.artistNames,
        albumId: (fav.metadata as any)?.albumId,
        albumName: (fav.metadata as any)?.albumName,
        albumCover: fav.imageUrl,
        previewUrl: (fav.metadata as any)?.previewUrl,
        duration: (fav.metadata as any)?.duration,
        popularity: (fav.metadata as any)?.popularity,
        spotifyUrl: (fav.metadata as any)?.spotifyUrl,
        addedAt: fav.addedAt
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
  } catch (error) {
    console.error('Error retrieving favorites:', error);
    throw new Error('Failed to retrieve favorites');
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