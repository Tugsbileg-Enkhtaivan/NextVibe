"use client";

import React, { useState, useEffect } from "react";
import { Heart, Music2, Play, Youtube, Trash2, Filter, Grid, List, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedApi } from '../utils/axios';

interface Song {
  trackId?: string;
  trackName?: string;
  songName?: string;
  artistName?: string;
  artistNames?: string[];
  albumId?: string;
  albumName?: string;
  albumCover?: string | null;
  previewUrl?: string | null;
  spotifyUrl?: string;
  duration?: number;
  popularity?: number;
  explicit?: boolean;
  addedAt?: string;
  youtubeData?: {
    videoId: string;
    title: string;
    thumbnail: string;
    url: string;  
  } | null;
}

interface Album {
  albumId?: string;
  albumName?: string;
  artistName?: string;
  artistNames?: string[];
  albumCover?: string | null;
  spotifyUrl?: string;
  releaseDate?: string | null;
  totalTracks?: number;
  albumType?: string;
  addedAt?: string;
}

interface FavoritesResponse {
  tracks: Song[];
  albums: Album[];
  artists?: any[];
  playlists?: any[];
}

const MusicCard = ({ 
  title, 
  artist, 
  album, 
  cover, 
  type = "track",
  previewUrl,
  spotifyUrl,
  youtubeData,
  itemId,
  onFavoriteToggle,
  isFavorited,
  createdAt
}: {
  title: string;
  artist: string;
  album?: string;
  cover?: string | null;
  type?: "track" | "album";
  previewUrl?: string | null;
  spotifyUrl?: string;
  youtubeData?: {
    videoId: string;
    title: string;
    thumbnail: string;
  } | null;
  itemId?: string;
  onFavoriteToggle?: (itemId: string, itemType: string, isFavorited: boolean) => Promise<void>;
  isFavorited?: boolean;
  createdAt?: string;
}) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const youtubeUrl = youtubeData?.videoId 
    ? `https://www.youtube.com/watch?v=${youtubeData.videoId}`
    : null;

  const handleYouTubePlay = () => {
    if (youtubeUrl) {
      window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFavoriteClick = async () => {
    if (!itemId || !onFavoriteToggle) return;
    
    setFavoriteLoading(true);
    setError(null);
    
    try {
      await onFavoriteToggle(itemId, type, isFavorited || false);
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      setError(error.message || 'Failed to remove from favorites. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      <div className="flex gap-4 items-center">
        <div className="relative">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center"
            style={{ display: cover ? 'none' : 'flex' }}
          >
            <Music2 className="w-8 h-8 text-white" />
          </div>
          {(previewUrl || youtubeUrl) && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <Play className="w-3 h-3 text-purple-600" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate" title={title}>{title}</h3>
          <p className="text-purple-600 text-sm truncate" title={artist}>{artist}</p>
          {album && type === "track" && (
            <p className="text-gray-500 text-xs truncate" title={album}>{album}</p>
          )}
          {createdAt && (
            <p className="text-gray-400 text-xs mt-1">
              Added {formatDate(createdAt)}
            </p>
          )}
          
          <div className="flex gap-2 mt-2 flex-wrap">
            {spotifyUrl && (
              <a 
                href={spotifyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
              >
                Spotify
              </a>
            )}
            {previewUrl && (
              <button 
                onClick={() => {
                  try {
                    const audio = new Audio(previewUrl);
                    audio.play().catch(e => console.warn('Preview play failed:', e));
                  } catch (e) {
                    console.warn('Audio creation failed:', e);
                  }
                }}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
              >
                Preview
              </button>
            )}
            {type === "track" && youtubeUrl && (
              <button 
                onClick={handleYouTubePlay}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1"
              >
                <Youtube className="w-3 h-3" />
                YouTube
              </button>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className={`p-2 rounded-full transition-all duration-200 ${
            favoriteLoading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-red-50'
          }`}
          title="Remove from favorites"
        >
          {favoriteLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5 text-red-500 hover:text-red-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default function FavoritesPage() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const [favoritesTracks, setFavoritesTracks] = useState<Song[]>([]);
  const [favoritesAlbums, setFavoritesAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'songs' | 'albums'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const loadFavorites = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is signed in
      if (!isSignedIn) {
        setError('Please log in to view your favorites.');
        return;
      }

      // Ensure we have userId
      if (!userId) {
        setError('User ID not available. Please try refreshing the page.');
        return;
      }

      console.log('Loading favorites for user:', userId);
      
      // Get the session token with retry logic
      let token;
      try {
        token = await getToken();
      } catch (tokenError) {
        console.error('Token retrieval failed:', tokenError);
        if (retryCount < 2) {
          console.log(`Retrying token retrieval (attempt ${retryCount + 1})`);
          setTimeout(() => loadFavorites(retryCount + 1), 1000);
          return;
        }
        throw new Error('Failed to get authentication token. Please try signing in again.');
      }

      if (!token) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      console.log('Token obtained, making API request...');

      // Create authenticated API instance
      const authenticatedApi = createAuthenticatedApi(token);
      
      // Make the API request
      const response = await authenticatedApi.get<FavoritesResponse>('/api/ai-song/favorites');
      console.log('Favorites API response:', response.data);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure we always have arrays, even if the response doesn't include them
      const tracks = Array.isArray(response.data.tracks) ? response.data.tracks : [];
      const albums = Array.isArray(response.data.albums) ? response.data.albums : [];
      
      // Log track data for debugging
      console.log('Track data sample:', tracks.length > 0 ? tracks[0] : 'No tracks');
      console.log('Album data sample:', albums.length > 0 ? albums[0] : 'No albums');
      
      setFavoritesTracks(tracks);
      setFavoritesAlbums(albums);
      
      console.log(`Successfully loaded ${tracks.length} favorite tracks and ${albums.length} favorite albums`);
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      
      let errorMessage = 'Failed to load favorites. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.response?.status === 404) {
        // 404 might mean no favorites exist, which is normal
        console.log('No favorites found (404) - this is normal for new users');
        setFavoritesTracks([]);
        setFavoritesAlbums([]);
        return; // Don't set error for 404
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for Clerk to load and have user info
    if (isLoaded && isSignedIn && userId) {
      console.log('Clerk loaded, user signed in, loading favorites...');
      loadFavorites();
    } else if (isLoaded && !isSignedIn) {
      console.log('Clerk loaded, user not signed in');
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, userId]);

  const handleFavoriteToggle = async (itemId: string, itemType: string, isFavorited: boolean): Promise<void> => {
    try {
      console.log(`Removing favorite - ID: ${itemId}, Type: ${itemType}`);
      
      // Get the session token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication failed. Please log in again.');
      }

      // Create authenticated API instance
      const authenticatedApi = createAuthenticatedApi(token);
      
      await authenticatedApi.delete(`/api/ai-song/favorites/${itemId}`);
      console.log(`Successfully removed ${itemId} from favorites`);
      
      // Remove from local state
      if (itemType === 'song') {
        setFavoritesTracks(prev => prev.filter(track => 
          track.trackId !== itemId
        ));
      } else if (itemType === 'album') {
        setFavoritesAlbums(prev => prev.filter(album => album.albumId !== itemId));
      }
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      
      let errorMessage = 'Failed to remove from favorites. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to manage favorites.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Item not found in favorites.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const sortItems = <T extends { addedAt?: string; trackName?: string; songName?: string; albumName?: string; artistName?: string }>(items: T[]) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedAt || '').getTime() - new Date(a.addedAt || '').getTime();
        case 'oldest':
          return new Date(a.addedAt || '').getTime() - new Date(b.addedAt || '').getTime();
        case 'alphabetical':
          const aTitle = (a.trackName || a.songName || a.albumName || '').toLowerCase();
          const bTitle = (b.trackName || b.songName || b.albumName || '').toLowerCase();
          return aTitle.localeCompare(bTitle);
        default:
          return 0;
      }
    });
  };

  const getFilteredItems = () => {
    const sortedTracks = sortItems(favoritesTracks);
    const sortedAlbums = sortItems(favoritesAlbums);

    switch (filter) {
      case 'songs':
        return { tracks: sortedTracks, albums: [] };
      case 'albums':
        return { tracks: [], albums: sortedAlbums };
      default:
        return { tracks: sortedTracks, albums: sortedAlbums };
    }
  };

  const { tracks: filteredTracks, albums: filteredAlbums } = getFilteredItems();
  const totalItems = filteredTracks.length + filteredAlbums.length;

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show sign in message if not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Sign in required
              </h3>
              <p className="text-gray-500 mb-6">
                Please sign in to view your favorites
              </p>
              <button
                onClick={() => window.location.href = '/sign-in'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-shadow"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your favorites...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Favorites
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Your personal collection of amazing music
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error loading favorites</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => loadFavorites()}
              className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Controls */}
        {!error && totalItems > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'all' | 'songs' | 'albums')}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All ({favoritesTracks.length + favoritesAlbums.length})</option>
                    <option value="songs">Songs ({favoritesTracks.length})</option>
                    <option value="albums">Albums ({favoritesAlbums.length})</option>
                  </select>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'alphabetical')}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">A-Z</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!error && totalItems === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No favorites yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start adding songs and albums to your favorites to see them here
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-shadow"
              >
                Discover Music
              </button>
            </div>
          </div>
        )}

        {/* Favorites List */}
        {!error && totalItems > 0 && (
          <div className="space-y-6">
            {/* Songs */}
            {filteredTracks.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Play className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Favorite Songs ({filteredTracks.length})
                  </h2>
                </div>
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'md:grid-cols-2 lg:grid-cols-2' 
                    : 'grid-cols-1'
                }`}>
                  {filteredTracks.map((track, i) => (
  <MusicCard
    key={track?.trackId || i}
    title={track?.trackName || "Unknown Song"}  // Backend sends trackName
    artist={track?.artistName || "Unknown Artist"}  // Backend sends artistName (single string)
    album={track?.albumName || "Unknown Album"}  // Backend sends albumName
    cover={track?.albumCover}
    type="track"
    previewUrl={track?.previewUrl}
    spotifyUrl={track?.spotifyUrl}
    youtubeData={track?.youtubeData}
    itemId={track?.trackId}
    onFavoriteToggle={handleFavoriteToggle}
    isFavorited={true}
    createdAt={track?.addedAt}
  />
))}
                </div>
              </div>
            )}

            {/* Albums */}
            {filteredAlbums.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Music2 className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Favorite Albums ({filteredAlbums.length})
                  </h2>
                </div>
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'md:grid-cols-2 lg:grid-cols-2' 
                    : 'grid-cols-1'
                }`}>
                  {filteredAlbums.map((album, i) => (
  <MusicCard
    key={album?.albumId || i}
    title={album?.albumName || "Unknown Album"}  // Backend sends albumName
    artist={album?.artistName || "Unknown Artist"}  // Backend sends artistName (single string)
    cover={album?.albumCover}
    type="album"
    spotifyUrl={album?.spotifyUrl}
    itemId={album?.albumId}
    onFavoriteToggle={handleFavoriteToggle}
    isFavorited={true}
    createdAt={album?.addedAt}
  />
))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}