import { PrismaClient, MoodType, FavoriteType, RecommendationType, EnergyLevel, ValenceLevel, ActivityType } from '@prisma/client';
import { searchTracks, searchAlbums } from '../services/spotifyService';
import { isTrackSearchResponse, isAlbumSearchResponse } from '../utils/spotifyUtils';
import { clerkClient } from '@clerk/express';

const prisma = new PrismaClient();

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class SpotifyAuth {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID!;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Missing Spotify credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
    }
  }

  // Get access token using Client Credentials flow
  private async getClientCredentialsToken(): Promise<string> {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
      }

      const data: SpotifyTokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early
      
      console.log('✅ Spotify access token obtained successfully');
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ Failed to get Spotify access token:', error);
      throw error;
    }
  }

  // Get a valid access token (refreshes if needed)
  public async getAccessToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      console.log('🔄 Getting new Spotify access token...');
      await this.getClientCredentialsToken();
    }
    
    return this.accessToken!;
  }

  // Make authenticated requests to Spotify API
  public async makeSpotifyRequest(endpoint: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try refreshing
        console.log('🔄 Token expired, refreshing...');
        this.accessToken = null;
        const newToken = await this.getAccessToken();
        
        // Retry the request with new token
        const retryResponse = await fetch(`https://api.spotify.com/v1${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Spotify API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        return retryResponse.json();
      }
      
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Create a singleton instance
const spotifyAuth = new SpotifyAuth(); 

export const getSpotifyTrackById = async (trackId: string) => {
  try {
    console.log(`🔍 Fetching track details for ${trackId}`);
    const track = await spotifyAuth.makeSpotifyRequest(`/tracks/${trackId}`);
    console.log(`✅ Track details fetched: ${track.name} by ${track.artists.map((a: any) => a.name).join(', ')}`);
    return track;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch track ${trackId}:`, error);
    return null;
  }
};

export const getSpotifyAlbumById = async (albumId: string) => {
  try {
    console.log(`🔍 Fetching album details for ${albumId}`);
    const album = await spotifyAuth.makeSpotifyRequest(`/albums/${albumId}`);
    console.log(`✅ Album details fetched: ${album.name} by ${album.artists.map((a: any) => a.name).join(', ')}`);
    return album;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch album ${albumId}:`, error);
    return null;
  }
};

export const getSpotifyArtistById = async (artistId: string) => {
  try {
    console.log(`🔍 Fetching artist details for ${artistId}`);
    const artist = await spotifyAuth.makeSpotifyRequest(`/artists/${artistId}`);
    console.log(`✅ Artist details fetched: ${artist.name}`);
    return artist;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch artist ${artistId}:`, error);
    return null;
  }
};

export const getSpotifyPlaylistById = async (playlistId: string) => {
  try {
    console.log(`🔍 Fetching playlist details for ${playlistId}`);
    const playlist = await spotifyAuth.makeSpotifyRequest(`/playlists/${playlistId}`);
    console.log(`✅ Playlist details fetched: ${playlist.name}`);
    return playlist;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch playlist ${playlistId}:`, error);
    return null;
  }
};

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
  if (!userId) {
    console.error('❌ No userId provided to ensureUserExistsInService');
    throw new Error('User ID is required');
  }

  try {
    console.log(`🔍 Checking if user ${userId} exists in database...`);
    
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      console.log(`🔄 User ${userId} not found in database, creating...`);
      
      // Get user details from Clerk first
      let clerkUser;
      try {
        clerkUser = await clerkClient.users.getUser(userId);
        console.log(`✅ Found user in Clerk: ${clerkUser.emailAddresses[0]?.emailAddress || 'No email'}`);
      } catch (clerkError: any) {
        console.warn(`⚠️ Could not fetch user from Clerk: ${clerkError.message}`);
        // Continue with basic user creation
      }
      
      // Create user with Clerk data
      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || `${userId}@temp.com`,
          username: clerkUser?.username || `user_${userId.substring(0, 8)}`,
          profile: {
            create: {
              avatar: clerkUser?.imageUrl || null,
              bio: null,
              mbti: null,
              astrology: null
            }
          }
        },
        include: {
          profile: true
        }
      });
      
      console.log(`✅ User created in database: ${userId}`);
    } else {
      console.log(`✅ User ${userId} already exists in database`);
    }

    return user;
  } catch (error: any) {
    console.error(`❌ Error in ensureUserExistsInService for ${userId}:`, error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      console.log(`🔄 Unique constraint violation, trying to find existing user...`);
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
      
      if (existingUser) {
        console.log(`✅ Found existing user after constraint violation`);
        return existingUser;
      }
    }
    
    throw new Error(`Failed to ensure user exists: ${error.message}`);
  }
};


export const saveUserRecommendationHistory = async (
  userId: string,
  recommendation: RecommendationData
) => {
  try {
    await ensureUserExistsInService(userId);

    console.log('💾 Saving recommendation history for user:', userId);
    console.log('📊 Recommendation data:', {
      type: recommendation.type,
      mood: recommendation.mood,
      activity: recommendation.activity,
      tracksCount: recommendation.tracks?.length || 0,
      albumsCount: recommendation.albums?.length || 0
    });

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
          create: recommendation.tracks?.map((track, index) => {
            // Fix: Use the correct property names from your controller
            const trackData = {
              trackId: track.trackId || track.songId || track.id,
              position: index,
              name: track.name || track.songName,
              artistNames: Array.isArray(track.artistNames) 
                ? track.artistNames
                : [track.artistName || track.artist || 'Unknown'],
              albumName: track.albumName || track.album?.name || 'Unknown',
              imageUrl: track.imageUrl || track.albumCover || track.album?.images?.[0]?.url || null,
              previewUrl: track.previewUrl || track.preview_url || null,
              duration: track.duration || track.duration_ms || null,
              popularity: track.popularity || null
            };
            
            console.log(`🎵 Creating track record:`, {
              trackId: trackData.trackId,
              name: trackData.name,
              artistNames: trackData.artistNames
            });
            
            return trackData;
          }) || []
        },
        albums: {
          create: recommendation.albums?.map((album, index) => {
            // Fix: Use the correct property names from your controller
            const albumData = {
              albumId: album.albumId || album.id,
              position: index,
              name: album.name || album.albumName,
              artistNames: Array.isArray(album.artistNames)
                ? album.artistNames
                : [album.artistName || album.artist || 'Unknown'],
              imageUrl: album.imageUrl || album.albumCover || album.images?.[0]?.url || null,
              releaseDate: album.releaseDate || album.release_date || null,
              totalTracks: album.totalTracks || album.total_tracks || null
            };
            
            console.log(`💽 Creating album record:`, {
              albumId: albumData.albumId,
              name: albumData.name,
              artistNames: albumData.artistNames
            });
            
            return albumData;
          }) || []
        }
      },
      include: {
        tracks: true,
        albums: true
      }
    });

    console.log(`✅ Recommendation saved successfully for user ${userId}, ID: ${savedRecommendation.id}`);
    return savedRecommendation;
  } catch (error: any) {
    console.error('❌ Error saving recommendation history:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    throw new Error(`Failed to save recommendation history: ${error.message}`);
  }
};

export const getUserRecommendationHistory = async (userId: string) => {
  try {
    console.log('🔍 Getting recommendation history for user:', userId);
    
    // First, check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    console.log('👤 User exists:', !!userExists);
    
    // Check total recommendations count in database
    const totalRecommendations = await prisma.recommendation.count({
      where: { userId }
    });
    
    console.log('📊 Total recommendations in DB for user:', totalRecommendations);
    
    // If no recommendations, return early with detailed info
    if (totalRecommendations === 0) {
      console.log('⚠️ No recommendations found for user:', userId);
      
      // Check if there are ANY recommendations in the database at all
      const anyRecommendations = await prisma.recommendation.count();
      console.log('📈 Total recommendations in entire database:', anyRecommendations);
      
      return [];
    }
    
    // Get recommendations with full details
    const recommendations = await prisma.recommendation.findMany({
      where: { userId },
      include: {
        tracks: {
          orderBy: { position: 'asc' }
        },
        albums: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 recommendations
    });

    console.log('✅ Retrieved recommendations:', {
      count: recommendations.length,
      firstRecommendation: recommendations[0] ? {
        id: recommendations[0].id,
        type: recommendations[0].type,
        createdAt: recommendations[0].createdAt,
        tracksCount: recommendations[0].tracks?.length || 0,
        albumsCount: recommendations[0].albums?.length || 0
      } : null
    });

    return recommendations;
  } catch (error: any) {
    console.error('❌ Error getting recommendation history:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    throw new Error(`Failed to get recommendation history: ${error.message}`);
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

    // Fetch item details from Spotify API
    let spotifyItem = null;

    switch (itemType) {
      case 'track':
        spotifyItem = await getSpotifyTrackById(itemId);
        if (spotifyItem) {
          name = spotifyItem.name;
          artistNames = spotifyItem.artists.map((artist: any) => artist.name);
          imageUrl = spotifyItem.album.images?.[0]?.url || '';
          metadata = {
            albumId: spotifyItem.album.id,
            albumName: spotifyItem.album.name,
            previewUrl: spotifyItem.preview_url,
            duration: spotifyItem.duration_ms,
            popularity: spotifyItem.popularity,
            spotifyUrl: spotifyItem.external_urls?.spotify || null,
            explicit: spotifyItem.explicit || false
          };
        }
        break;

      case 'album':
        spotifyItem = await getSpotifyAlbumById(itemId);
        if (spotifyItem) {
          name = spotifyItem.name;
          artistNames = spotifyItem.artists.map((artist: any) => artist.name);
          imageUrl = spotifyItem.images?.[0]?.url || '';
          metadata = {
            releaseDate: spotifyItem.release_date,
            totalTracks: spotifyItem.total_tracks,
            spotifyUrl: spotifyItem.external_urls?.spotify || null,
            albumType: spotifyItem.album_type
          };
        }
        break;

      case 'artist':
        spotifyItem = await getSpotifyArtistById(itemId);
        if (spotifyItem) {
          name = spotifyItem.name;
          artistNames = [spotifyItem.name];
          imageUrl = spotifyItem.images?.[0]?.url || '';
          metadata = {
            genres: spotifyItem.genres,
            popularity: spotifyItem.popularity,
            followers: spotifyItem.followers?.total,
            spotifyUrl: spotifyItem.external_urls?.spotify || null
          };
        }
        break;

      case 'playlist':
        spotifyItem = await getSpotifyPlaylistById(itemId);
        if (spotifyItem) {
          name = spotifyItem.name;
          artistNames = [spotifyItem.owner?.display_name || 'Unknown'];
          imageUrl = spotifyItem.images?.[0]?.url || '';
          metadata = {
            description: spotifyItem.description,
            totalTracks: spotifyItem.tracks?.total,
            spotifyUrl: spotifyItem.external_urls?.spotify || null,
            isPublic: spotifyItem.public,
            ownerName: spotifyItem.owner?.display_name
          };
        }
        break;
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
      throw error;
    }
    
    throw new Error(`Failed to add item to favorites: ${error.message}`);
  }
};

// Alternative approach if you prefer to use your existing search functions
// You'll need to modify your search functions to accept direct ID lookups
export const addToUserFavoritesWithSearch = async (
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
        // Create a more specific search query or use direct API call
        const result = await searchTracks(itemId, 50); // Search by track ID directly
        
        if (isTrackSearchResponse(result) && result.tracks.items.length > 0) {
          // Find the exact match by ID
          const track = result.tracks.items.find(t => t.id === itemId) || result.tracks.items[0];
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
        }
      } catch (searchError) {
        console.warn(`⚠️ Failed to fetch track details for ${itemId}:`, searchError);
      }
    } else if (itemType === 'album') {
      try {
        console.log(`🔍 Fetching album details for ${itemId}`);
        const result = await searchAlbums(itemId, 50); // Search by album ID directly
        
        if (isAlbumSearchResponse(result) && result.albums.items.length > 0) {
          // Find the exact match by ID
          const album = result.albums.items.find(a => a.id === itemId) || result.albums.items[0];
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
    
    console.log(`Removed ${result.count} favorite(s) for user ${userId}`);
    return result;
    
  } catch (error: any) {
    console.error('Error removing from favorites:', error);
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
        genres: (fav.metadata as any)?.genres,
        popularity: (fav.metadata as any)?.popularity,
        followers: (fav.metadata as any)?.followers,
        spotifyUrl: (fav.metadata as any)?.spotifyUrl,
        addedAt: fav.addedAt
      }));

    const playlists = favorites
      .filter(fav => fav.type === 'PLAYLIST')
      .map(fav => ({
        playlistId: fav.itemId,
        playlistName: fav.name,
        imageUrl: fav.imageUrl,
        description: (fav.metadata as any)?.description,
        totalTracks: (fav.metadata as any)?.totalTracks,
        ownerName: (fav.metadata as any)?.ownerName,
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

export { spotifyAuth };

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

export const createUserFromClerkWebhook = async (clerkUserId: string, clerkUserData: any) => {
  try {
    console.log(`🔄 Creating user from Clerk webhook: ${clerkUserId}`);
    
    const user = await prisma.user.create({
      data: {
        id: clerkUserId,
        email: clerkUserData.email_addresses?.[0]?.email_address || `${clerkUserId}@temp.com`,
        username: clerkUserData.username || `user_${clerkUserId.substring(0, 8)}`,
        profile: {
          create: {
            avatar: clerkUserData.image_url || null,
            bio: null,
            mbti: null,
            astrology: null
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    console.log(`✅ User created from webhook: ${clerkUserId}`);
    return user;
  } catch (error: any) {
    console.error(`❌ Error creating user from webhook:`, error);
    throw error;
  }
};

// Function to update user from Clerk data
export const updateUserFromClerk = async (userId: string) => {
  try {
    console.log(`🔄 Updating user ${userId} from Clerk data...`);
    
    const clerkUser = await clerkClient.users.getUser(userId);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: clerkUser.emailAddresses[0]?.emailAddress || undefined,
        username: clerkUser.username || undefined,
        profile: {
          update: {
            avatar: clerkUser.imageUrl || undefined
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    console.log(`✅ User updated from Clerk: ${userId}`);
    return updatedUser;
  } catch (error: any) {
    console.error(`❌ Error updating user from Clerk:`, error);
    throw error;
  }
};

// Function to sync user data with Clerk
export const syncUserWithClerk = async (userId: string) => {
  try {
    console.log(`🔄 Syncing user ${userId} with Clerk...`);
    
    // First check if user exists in database
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@temp.com`,
          username: clerkUser.username || `user_${userId.substring(0, 8)}`,
          profile: {
            create: {
              avatar: clerkUser.imageUrl || null,
              bio: null,
              mbti: null,
              astrology: null
            }
          }
        },
        include: {
          profile: true
        }
      });
      console.log(`✅ User created and synced: ${userId}`);
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || user.email,
          username: clerkUser.username || user.username,
          profile: {
            update: {
              avatar: clerkUser.imageUrl || user.profile?.avatar
            }
          }
        },
        include: {
          profile: true
        }
      });
      console.log(`✅ User updated and synced: ${userId}`);
    }
    
    return user;
  } catch (error: any) {
    console.error(`❌ Error syncing user with Clerk:`, error);
    throw error;
  }
};

// Enhanced middleware-friendly user creation
export const createUserIfNotExists = async (userId: string) => {
  try {
    // Quick check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (existingUser) {
      return existingUser;
    }
    
    // User doesn't exist, create them
    return await ensureUserExistsInService(userId);
    
  } catch (error: any) {
    console.error(`❌ Error in createUserIfNotExists:`, error);
    throw error;
  }
};

// Function to get user with profile
export const getUserWithProfile = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        favorites: {
          take: 10,
          orderBy: { addedAt: 'desc' }
        },
        recommendations: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    return user;
  } catch (error: any) {
    console.error(`❌ Error getting user with profile:`, error);
    throw error;
  }
};

// Add this function to your userService.ts for debugging
export const debugDatabaseState = async (userId: string) => {
  try {
    console.log('🔍 === DATABASE DEBUG CHECK ===');
    console.log('Target User ID:', userId);
    
    // 1. Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection: OK');
    } catch (error) {
      console.log('❌ Database connection: FAILED', error);
      return;
    }
    
    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log('👤 User exists:', !!user);
    if (user) {
      console.log('👤 User details:', {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      });
    }
    
    // 3. Check total users in database
    const totalUsers = await prisma.user.count();
    console.log('👥 Total users in database:', totalUsers);
    
    // 4. Check recommendations for this user
    const userRecommendations = await prisma.recommendation.count({
      where: { userId }
    });
    console.log('📊 Recommendations for this user:', userRecommendations);
    
    // 5. Check total recommendations in database
    const totalRecommendations = await prisma.recommendation.count();
    console.log('📈 Total recommendations in database:', totalRecommendations);
    
    // 6. Get sample of recent recommendations
    const recentRecommendations = await prisma.recommendation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        type: true,
        createdAt: true,
        _count: {
          select: {
            tracks: true,
            albums: true
          }
        }
      }
    });
    
    console.log('🕒 Recent recommendations (any user):', recentRecommendations.map(r => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      createdAt: r.createdAt,
      tracksCount: r._count.tracks,
      albumsCount: r._count.albums
    })));
    
    // 7. Check if there are any recommendations for this specific user
    if (userRecommendations > 0) {
      const userRecs = await prisma.recommendation.findMany({
        where: { userId },
        take: 2,
        orderBy: { createdAt: 'desc' },
        include: {
          tracks: true,
          albums: true
        }
      });
      
      console.log('🎵 User specific recommendations:', userRecs.map(r => ({
        id: r.id,
        type: r.type,
        createdAt: r.createdAt,
        tracksCount: r.tracks.length,
        albumsCount: r.albums.length
      })));
    }
    
    console.log('🔍 === END DEBUG CHECK ===');
    
  } catch (error) {
    console.error('❌ Debug check failed:', error);
  }
};

// Call this function in your getRecommendationHistory controller for debugging
// Add this line right after getting the userId:
// await debugDatabaseState(userId);