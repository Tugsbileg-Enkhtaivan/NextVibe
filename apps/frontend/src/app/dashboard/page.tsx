"use client"

import React, { useState, useEffect } from "react";
import { Music2, Heart, Clock, User, Sparkles, Play, Youtube } from 'lucide-react';
import api from "../utils/axios";

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

interface RecommendationsResponse {
  songs?: Song[];
  albums?: Album[];
  fromCache?: boolean;
}

interface FavoritesResponse {
  tracks?: Array<{
    trackId: string;
  }>;
  albums?: Array<{
    albumId: string;
  }>;
}

const SelectableGroup = ({
  options,
  selected,
  onSelect,
  title,
  icon: Icon
}: {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  title: string;
  icon: any;
}) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-purple-600" />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${selected === option
            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
            : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50'
            }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

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
  isFavorited
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
            : 'hover:bg-gray-100'
            }`}
        >
          {favoriteLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Heart
              className={`w-5 h-5 transition-colors ${isFavorited
                ? 'text-red-500 fill-red-500'
                : 'text-gray-400 hover:text-red-500'
                }`}
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [mood, setMood] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const moods = ["Happy", "Sad", "Calm", "Angry", "Energetic", "Melancholic", "Excited", "Peaceful"];
  const genres = ["Lo-fi", "Rock", "Jazz", "Ambient", "Hip Hop", "EDM", "R&B", "Pop"];
  const activities = ["Workout", "Study", "Party", "Relax", "Commute", "Cooking", "Sleep", "Work"];

  const loadUserFavorites = async () => {
    try {
      const response = await api.get<FavoritesResponse>('/api/ai-song/favorites');
      const userFavorites = new Set<string>();

      response.data.tracks?.forEach((track) => {
        userFavorites.add(track.trackId);
      });

      response.data.albums?.forEach((album) => {
        userFavorites.add(album.albumId);
      });

      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  useEffect(() => {
    loadUserFavorites();
  }, []);

  const handleSubmit = async () => {
    if (!mood || !genre || !activity) {
      alert("Please select a mood, genre, and activity");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get<RecommendationsResponse>("/api/ai-song/recommendations", {
        params: {
          mood,
          genre,
          activity,
        },
      });

      setSongs(res.data.songs || []);
      setAlbums(res.data.albums || []);
      setFromCache(res.data.fromCache || false);
    } catch (err: any) {
      console.error("Fetch error:", err);

      if (err.response?.status === 400) {
        alert("Please make sure all fields are selected (mood, genre, activity)");
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.");
      } else {
        alert("Failed to fetch suggestions. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (itemId: string, itemType: string, isFavorited: boolean) => {
    try {
      if (isFavorited) {
        // Remove from favorites
        await api.delete(`/api/ai-song/favorites/${itemId}`);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(itemId);
          return newFavorites;
        });
      } else {
        // Add to favorites
        await api.post("/api/ai-song/favorites", {
          itemId,
          itemType
        });
        setFavorites(prev => new Set([...prev, itemId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites. Please try again.');
    }
  };

  const isFormValid = mood && genre && activity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Music Discovery
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Tell us your vibe and we'll find the perfect soundtrack
          </p>
        </div>

        {/* Selection Form */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
          <SelectableGroup
            options={moods}
            selected={mood}
            onSelect={setMood}
            title="How are you feeling?"
            icon={User}
          />

          <SelectableGroup
            options={genres}
            selected={genre}
            onSelect={setGenre}
            title="What's your sound?"
            icon={Music2}
          />

          <SelectableGroup
            options={activities}
            selected={activity}
            onSelect={setActivity}
            title="What are you doing?"
            icon={Clock}
          />

          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 ${isFormValid && !loading
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Finding Your Vibe...
                </div>
              ) : (
                'Discover My Music ✨'
              )}
            </button>
          </div>

          {fromCache && (
            <div className="mt-4 text-center">
              <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                ⚡ Results from cache
              </span>
            </div>
          )}
        </div>

        {/* Results */}
        {(songs.length > 0 || albums.length > 0) && (
          <div className="space-y-8">
            {songs.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Play className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Recommended Songs</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                  {songs
                    .filter((song) => song && typeof song === "object")
                    .map((song, i) => (
                      <MusicCard
                        key={song?.songId || i}
                        title={song?.songName || "Unknown Song"}
                        artist={song?.artistName || "Unknown Artist"}
                        album={song?.albumName || "Unknown Album"}
                        cover={song?.albumCover}
                        type="song"
                        previewUrl={song?.previewUrl}
                        spotifyUrl={song?.spotifyUrl}
                        youtubeData={song?.youtubeData}
                        itemId={song?.songId}
                        onFavoriteToggle={handleFavoriteToggle}
                        isFavorited={favorites.has(song?.songId || '')}
                      />
                    ))}
                </div>
              </div>
            )}

            {albums.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Music2 className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Recommended Albums</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                  {albums
                    .filter((album) => album && typeof album === "object")
                    .map((album, i) => (
                      <MusicCard
                        key={album?.albumId || i}
                        title={album?.albumName || "Unknown Album"}
                        artist={album?.artistName || "Unknown Artist"}
                        cover={album?.albumCover}
                        type="album"
                        spotifyUrl={album?.spotifyUrl}
                        itemId={album?.albumId}
                        onFavoriteToggle={handleFavoriteToggle}
                        isFavorited={favorites.has(album?.albumId || '')}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && songs.length === 0 && albums.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
              <Music2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Ready to discover amazing music?
              </h3>
              <p className="text-gray-500">
                Select your mood, genre, and activity to get personalized recommendations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}