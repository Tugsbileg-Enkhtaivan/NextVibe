"use client";

import React, { useState, useEffect } from "react";
import { Heart, Music2, Play, Youtube, Trash2, Grid, List, ChevronDown } from 'lucide-react';
import api from '../utils/axios';
import Header from "../components/Header";

interface Song {
  songName?: string;
  artistName?: string;
  albumName?: string;
  albumCover?: string | null;
  songId?: string;
  previewUrl?: string | null;
  spotifyUrl?: string;
  youtubeData?: {
    videoId: string;
    title: string;
    thumbnail: string;
    url: string;
  } | null;
}

interface Album {
  albumName?: string;
  artistName?: string;
  albumCover?: string | null;
  albumId?: string;
  spotifyUrl?: string;
  releaseDate?: string | null;
}

interface FavoriteTrack {
  trackId: string;
  createdAt: string;
  song?: Song;
}

interface FavoriteAlbum {
  albumId: string;
  createdAt: string;
  album?: Album;
}

interface FavoritesResponse {
  tracks?: FavoriteTrack[];
  albums?: FavoriteAlbum[];
}

const MusicCard = ({
  title,
  artist,
  album,
  cover,
  type = "song",
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
  type?: "song" | "album";
  previewUrl?: string | null;
  spotifyUrl?: string;
  youtubeData?: {
    videoId: string;
    title: string;
    thumbnail: string;
  } | null;
  itemId?: string;
  onFavoriteToggle?: (itemId: string, itemType: string, isFavorited: boolean) => void;
  isFavorited?: boolean;
  createdAt?: string;
}) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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
    try {
      await onFavoriteToggle(itemId, type, isFavorited || false);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4 items-center">
        <div className="relative">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <Music2 className="w-8 h-8 text-white" />
            </div>
          )}
          {(previewUrl || youtubeUrl) && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <Play className="w-3 h-3 text-purple-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <p className="text-purple-600 text-sm truncate">{artist}</p>
          {album && type === "song" && (
            <p className="text-gray-500 text-xs truncate">{album}</p>
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
                  const audio = new Audio(previewUrl);
                  audio.play().catch(e => console.warn('Preview play failed:', e));
                }}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
              >
                Preview
              </button>
            )}
            {type === "song" && youtubeUrl && (
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
          className={`p-2 rounded-full transition-all duration-200 ${favoriteLoading
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
  const [favoritesTracks, setFavoritesTracks] = useState<FavoriteTrack[]>([]);
  const [favoritesAlbums, setFavoritesAlbums] = useState<FavoriteAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'songs' | 'albums'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get<FavoritesResponse>('/api/ai-song/favorites');

      setFavoritesTracks(response.data.tracks || []);
      setFavoritesAlbums(response.data.albums || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavoriteToggle = async (itemId: string, itemType: string, isFavorited: boolean) => {
    try {
      if (isFavorited) {
        await api.delete(`/api/ai-song/favorites/${itemId}`);

        if (itemType === 'song') {
          setFavoritesTracks(prev => prev.filter(track => track.trackId !== itemId));
        } else {
          setFavoritesAlbums(prev => prev.filter(album => album.albumId !== itemId));
        }
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites. Please try again.');
    }
  };

  const sortItems = <T extends { createdAt: string }>(items: T[], getName: (item: T) => string) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return getName(a).localeCompare(getName(b));
        default:
          return 0;
      }
    });
  };

  const getFilteredAndSortedTracks = () => {
    if (filter === 'albums') return [];
    const sorted = sortItems(favoritesTracks, (track) => track.song?.songName || '');
    return sorted;
  };

  const getFilteredAndSortedAlbums = () => {
    if (filter === 'songs') return [];
    const sorted = sortItems(favoritesAlbums, (album) => album.album?.albumName || '');
    return sorted;
  };

  const filteredTracks = getFilteredAndSortedTracks();
  const filteredAlbums = getFilteredAndSortedAlbums();
  const totalItems = filteredTracks.length + filteredAlbums.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-gradient-to-r from-red-500 to-pink-500 relative">

      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-full border-2">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              My Favorites
            </h1>
          </div>
          <p className="text-white text-lg">
            Your personal collection of loved music
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Filter buttons */}
              <div className="flex gap-2">
                {(['all', 'songs', 'albums'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === filterOption
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none px-4 py-2 rounded-lg border border-gray-200 bg-white font-medium pr-8 text-gray-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">A-Z</option>
                </select>
                <ChevronDown size={18} className="absolute top-1/2 -translate-y-1/2 left-[116px] pointer-events-none" />
              </div>

            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>

              {/* View mode toggle */}
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {totalItems === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No favorites yet
              </h3>
              <p className="text-gray-500">
                Start discovering music and add your favorites by clicking the heart icon
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Songs Section */}
            {filteredTracks.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Play className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Favorite Songs ({filteredTracks.length})
                  </h2>
                </div>
                <div className={`grid gap-4 ${viewMode === 'grid'
                  ? 'md:grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1'
                  }`}>
                  {filteredTracks.map((favoriteTrack) => (
                    <MusicCard
                      key={favoriteTrack.trackId}
                      title={favoriteTrack.song?.songName || "Unknown Song"}
                      artist={favoriteTrack.song?.artistName || "Unknown Artist"}
                      album={favoriteTrack.song?.albumName || "Unknown Album"}
                      cover={favoriteTrack.song?.albumCover}
                      type="song"
                      previewUrl={favoriteTrack.song?.previewUrl}
                      spotifyUrl={favoriteTrack.song?.spotifyUrl}
                      youtubeData={favoriteTrack.song?.youtubeData}
                      itemId={favoriteTrack.trackId}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorited={true}
                      createdAt={favoriteTrack.createdAt}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Albums Section */}
            {filteredAlbums.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Music2 className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Favorite Albums ({filteredAlbums.length})
                  </h2>
                </div>
                <div className={`grid gap-4 ${viewMode === 'grid'
                  ? 'md:grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1'
                  }`}>
                  {filteredAlbums.map((favoriteAlbum) => (
                    <MusicCard
                      key={favoriteAlbum.albumId}
                      title={favoriteAlbum.album?.albumName || "Unknown Album"}
                      artist={favoriteAlbum.album?.artistName || "Unknown Artist"}
                      cover={favoriteAlbum.album?.albumCover}
                      type="album"
                      spotifyUrl={favoriteAlbum.album?.spotifyUrl}
                      itemId={favoriteAlbum.albumId}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorited={true}
                      createdAt={favoriteAlbum.createdAt}
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