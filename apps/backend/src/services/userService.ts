import { PrismaClient } from '@prisma/client';
import { searchTracks, searchAlbums } from '../services/spotifyService';
import { isTrackSearchResponse, isAlbumSearchResponse } from '../utils/spotifyUtils';

const prisma = new PrismaClient();

interface RecommendationData {
  mood: string;
  genre: string;
  timestamp: Date;
  songs: any[];
  albums: any[];
}

export const saveUserRecommendationHistory = async (
  userId: string,
  recommendation: RecommendationData
) => {
  try {
    return await prisma.userRecommendation.create({
      data: {
        userId,
        mood: recommendation.mood,
        genre: recommendation.genre,
        timestamp: recommendation.timestamp,
        songs: recommendation.songs,
        albums: recommendation.albums
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
    return await prisma.userRecommendation.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error retrieving recommendation history:', error);
    throw new Error('Failed to retrieve recommendation history');
  }
};

export const addToUserFavorites = async (
  userId: string,
  itemId: string,
  itemType: 'song' | 'album'
) => {
  try {
    const existing = await prisma.userFavorite.findFirst({
      where: {
        userId,
        itemId,
        itemType
      }
    });

    if (existing) return existing;

    let itemDetails: any = null;

    if (itemType === 'song') {
      const result = await searchTracks(`id:${itemId}`);
      if (isTrackSearchResponse(result) && result.tracks.items.length > 0) {
        const track = result.tracks.items[0];
        itemDetails = {
          name: track.name,
          artist: track.artists[0].name,
          albumId: track.album.id,
          albumName: track.album.name,
          albumCover: track.album.images?.[0]?.url || null,
          previewUrl: track.preview_url,
          spotifyUrl: track.external_urls?.spotify || null
        };
      }
    } else if (itemType === 'album') {
      const result = await searchAlbums(`id:${itemId}`);
      if (isAlbumSearchResponse(result) && result.albums.items.length > 0) {
        const album = result.albums.items[0];
        itemDetails = {
          name: album.name,
          artist: album.artists[0].name,
          albumCover: album.images?.[0]?.url || null,
          releaseDate: album.release_date,
          spotifyUrl: album.external_urls?.spotify || null
        };
      }
    }

    return await prisma.userFavorite.create({
      data: {
        userId,
        itemId,
        itemType,
        itemDetails,
        addedAt: new Date()
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
    return await prisma.userFavorite.deleteMany({
      where: { userId, itemId }
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw new Error('Failed to remove item from favorites');
  }
};

export const getUserFavorites = async (userId: string) => {
  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' }
    });

    const songs = favorites
      .filter(fav => fav.itemType === 'song')
      .map(fav => ({
        songId: fav.itemId,
        songName: fav.itemDetails?.name || 'Unknown',
        artistName: fav.itemDetails?.artist || 'Unknown',
        albumId: fav.itemDetails?.albumId,
        albumName: fav.itemDetails?.albumName,
        albumCover: fav.itemDetails?.albumCover,
        previewUrl: fav.itemDetails?.previewUrl,
        spotifyUrl: fav.itemDetails?.spotifyUrl,
        addedAt: fav.addedAt
      }));

    const albums = favorites
      .filter(fav => fav.itemType === 'album')
      .map(fav => ({
        albumId: fav.itemId,
        albumName: fav.itemDetails?.name || 'Unknown',
        artistName: fav.itemDetails?.artist || 'Unknown',
        albumCover: fav.itemDetails?.albumCover,
        releaseDate: fav.itemDetails?.releaseDate,
        spotifyUrl: fav.itemDetails?.spotifyUrl,
        addedAt: fav.addedAt
      }));

    return { songs, albums };
  } catch (error) {
    console.error('Error retrieving favorites:', error);
    throw new Error('Failed to retrieve favorites');
  }
};
