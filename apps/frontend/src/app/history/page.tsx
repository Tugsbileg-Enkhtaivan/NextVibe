"use client"

import React, { useState, useEffect } from 'react';
import { Music2, Heart, Clock, User, Play, Search, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedApi } from "../utils/axios";
import Header from '../components/Header';

type EmotionData = {
  image: string;
  color: string;
};

enum MoodType {
  HAPPY = 'HAPPY',
  JOY = "JOY",
  ANGER = "ANGER",
  ENVY = "ENVY",
  FEAR = "FEAR",
  SADNESS = "SADNESS",
  ENNUI = "ENNUI",
  DISGUST = "DISGUST",
  SHAME = "SHAME",
  ANXIETY = "ANXIETY"
}

enum ActivityType {
  CODING = "CODING",
  READING = "READING",
  NOTHING = "NOTHING",
  RUNNING = "RUNNING",
  COOKING = "COOKING",
  TRAVELING = "TRAVELING",
  GAMING = "GAMING",
  DRAWING = "DRAWING",
  YOGA = "YOGA",
  BIKING = "BIKING",
  DANCING = "DANCING",
  GARDENING = "GARDENING"
}

interface HistoryTrack {
  trackId: string;
  name: string;
  artistNames: string[];
  albumName: string;
  imageUrl?: string;
  previewUrl?: string;
  position: number;
}

interface HistoryAlbum {
  albumId: string;
  name: string;
  artistNames: string[];
  imageUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
  position: number;
}

interface RecommendationHistory {
  id: string;
  type: string;
  mood?: string;
  activity?: string;
  genres: string[];
  createdAt: string;
  tracks: HistoryTrack[];
  albums: HistoryAlbum[];
  parameters?: any;
}

/// MUSIC CARD

const MusicCard = ({
  title,
  artist,
  album,
  cover,
  type = "track",
  previewUrl,
  onPlay,
  onFavorite,
  isFavorite = false
}: {
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  type?: "track" | "album";
  previewUrl?: string;
  onPlay?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
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
        {previewUrl && (
          <button
            onClick={onPlay}
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-shadow"
          >
            <Play className="w-3 h-3 text-purple-600" />
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        <p className="text-purple-600 text-sm truncate">{artist}</p>
        {album && type === "track" && (
          <p className="text-gray-500 text-xs truncate">{album}</p>
        )}
      </div>
      <button
        onClick={onFavorite}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'} hover:text-red-500`} />
      </button>
    </div>
  </div>
);

// HISTORY CARD

const HistoryCard = ({
  recommendation,
  onDelete
}: {
  recommendation: RecommendationHistory;
  onDelete: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /// MOOD COLOR

  const getMoodColor = (mood?: string) => {
    const colors: Record<string, string> = {
      HAPPY: 'linear-gradient(135deg, #FFEB3B 0%, #FFC107 50%, #FF8F00 100%)',
      JOY: 'linear-gradient(135deg, #FFEB3B 0%, #FFC107 50%, #FF8F00 100%)',
      ANGER: "linear-gradient(135deg, #F44336 0%, #D32F2F 50%, #B71C1C 100%)",
      ENVY: "linear-gradient(135deg, #00E5CC 0%, #00BFA5 50%, #004D40 100%)",
      FEAR: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #4A148C 100%)",
      SADNESS: "linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #0D47A1 100%)",
      ENNUI: "linear-gradient(135deg, #5C6BC0 0%, #3F51B5 50%, #1A237E 100%)",
      DISGUST: "linear-gradient(135deg, #8BC34A 0%, #689F38 50%, #33691E 100%)",
      SHAME: "linear-gradient(135deg, #FF69B4 0%, #E91E63 50%, #880E4F 100%)",
      ANXIETY: "linear-gradient(135deg, #FF8C42 0%, #FF6B1A 50%, #E55100 100%)",
    };
    return colors[mood || ''] || 'bg-gray-100 text-gray-800';
  };

  const getGenreImage = (genre?: string) => {
    const images: Record<string, string> = {
      POP: "/assets/pop-sticker-icon.webp",
      ROCK: "/assets/finger-icon.webp",
      HIPHOP: "/assets/orange-hat-icon.webp",
      ELECTRONIC: "/assets/headset-icon.webp",
      SOUL: "/assets/heart-icon.webp",
      COUNTRY: "/assets/guitar-icon.webp",
      JAZZ: "/assets/buree-icon.webp",
      CLASSICAL: "/assets/vionyl-icon.webp",
      REGGAE: "/assets/reggie-icon.webp",
      BLUES: "/assets/blues-icon.webp",
    };
    return images[genre?.toUpperCase() || ''] || 'bg-gray-100 text-gray-800';
  };

  /// ACTIVITY COLOR

  const getActivityColor = (activity?: string) => {
    const colors: Record<string, string> = {
      CODING: "/assets/activity-icon-coding.webp",
      READING: "/assets/activity-icon-reading.webp",
      NOTHING: "/assets/chill-out-icon.webp",
      RUNNING: "/assets/running-icon.webp",
      COOKING: "/assets/cooking-icon.webp",
      TRAVELING: "/assets/travel-icon.webp",
      GAMING: "/assets/gaming-icon.webp",
      DRAWING: "/assets/drawing-icon.webp",
      YOGA: "/assets/yoga-icon.webp",
      BIKING: "/assets/biking-icon.webp",
      DANCING: "/assets/dancing-icon.webp",
      GARDENING: "/assets/gardening-icon.webp",
    };
    return colors[activity || ''] || '/assets/hamster.webp';
  };

  /// HANDLE PLAY

  const handlePlay = (previewUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(previewUrl);
    setCurrentAudio(audio);
    audio.play().catch(console.error);
  };

  /// HANDLE FAVORITE

  const handleFavorite = (itemId: string, itemType: 'song' | 'album') => {
    console.log(`Adding ${itemType} ${itemId} to favorites`);
  };

  return (
    <div className={`rounded-xl shadow-sm border-6 border-gray-100 relative`} style={{ background: `${getMoodColor(recommendation.mood)}` }}>
      <img src={getGenreImage(recommendation.genres[0])} className='w-14 absolute top-[-20px] right-[-15px] rotate-20' />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 border border-white to-pink-500 w-12 rounded-full p-2">
              {recommendation.activity && (
                <img src={getActivityColor(recommendation.activity)} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">Music Recommendations</h3>
              <p className="text-sm text-white">{formatDate(recommendation.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={() => onDelete(recommendation.id)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-white hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {recommendation.mood && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white">
              {recommendation.mood[0].toUpperCase() + recommendation.mood.slice(1).toLowerCase()}
            </span>
          )}
          {recommendation.activity && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white">
              {recommendation.activity[0].toUpperCase() + recommendation.activity.slice(1).toLowerCase()}
            </span>
          )}
          {recommendation.genres.map((genre, index) => (
            <span key={index} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {genre}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-white">
            <span className="flex items-center gap-1">
              <Music2 className="w-4 h-4" />
              {recommendation.tracks.length} songs
            </span>
            {recommendation.albums.length > 0 && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {recommendation.albums.length} albums
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-black hover:bg-white rounded-2xl py-1 px-2 text-sm font-medium"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          {recommendation.tracks.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Recommended Songs
              </h4>
              <div className="space-y-3">
                {recommendation.tracks.map((track) => (
                  <MusicCard
                    key={track.trackId}
                    title={track.name}
                    artist={track.artistNames.join(', ')}
                    album={track.albumName}
                    cover={track.imageUrl}
                    type="track"
                    previewUrl={track.previewUrl}
                    onPlay={() => track.previewUrl && handlePlay(track.previewUrl)}
                    onFavorite={() => handleFavorite(track.trackId, 'song')}
                  />
                ))}
              </div>
            </div>
          )}

          {recommendation.albums.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Music2 className="w-4 h-4" />
                Recommended Albums
              </h4>
              <div className="space-y-3">
                {recommendation.albums.map((album) => (
                  <MusicCard
                    key={album.albumId}
                    title={album.name}
                    artist={album.artistNames.join(', ')}
                    cover={album.imageUrl}
                    type="album"
                    onFavorite={() => handleFavorite(album.albumId, 'album')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Error component for auth issues
const AuthError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="text-center py-12">
    <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-4">
      <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
    <p className="text-gray-600 mb-6">
      Please sign in to view your recommendation history
    </p>
    <button
      onClick={onRetry}
      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
    >
      Retry
    </button>
  </div>
);

/// HISTORY PAGE

export default function HistoryPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [history, setHistory] = useState<RecommendationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<string>('all');

  const fetchHistory = async () => {
    if (!isLoaded || !isSignedIn) {
      setAuthError(true);
      setError('Please sign in to view your history');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAuthError(false);

      // Get the session token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('No session token available');
      }

      // Create authenticated API instance with token
      const authenticatedApi = createAuthenticatedApi(token);
      
      const response = await authenticatedApi.get<RecommendationHistory[]>("/api/ai-song/history");
      setHistory(response.data);
    } catch (error: any) {
      console.error('Failed to fetch history:', error);

      if (error.response?.status === 401) {
        setAuthError(true);
        setError('Authentication required. Please sign in to view your history.');
      } else {
        setError('Failed to load recommendation history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchHistory();
    }
  }, [isLoaded, isSignedIn]);

  const handleDelete = async (id: string) => {
    if (!isSignedIn) {
      setAuthError(true);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No session token available');
      }

      const authenticatedApi = createAuthenticatedApi(token);
      await authenticatedApi.delete(`/api/ai-song/history/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      console.error('Failed to delete history item:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
        setError('Authentication required');
      } else {
        setError('Failed to delete item');
      }
    }
  };

  /// CLEAR HISTORY

  const clearAllHistory = async () => {
    if (!isSignedIn) {
      setAuthError(true);
      return;
    }

    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No session token available');
        }

        const authenticatedApi = createAuthenticatedApi(token);
        await authenticatedApi.delete('/api/ai-song/history');
        setHistory([]);
      } catch (error: any) {
        console.error('Failed to clear history:', error);
        if (error.response?.status === 401) {
          setAuthError(true);
          setError('Authentication required');
        } else {
          setError('Failed to clear history');
        }
      }
    }
  };

  /// FILTERED HISTORY

  const filteredHistory = history.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.tracks.some(track =>
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artistNames.some(artist => artist.toLowerCase().includes(searchQuery.toLowerCase()))
      ) ||
      item.albums.some(album =>
        album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.artistNames.some(artist => artist.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesMood = selectedMood === 'all' || item.mood === selectedMood;
    const matchesActivity = selectedActivity === 'all' || item.activity === selectedActivity;

    return matchesSearch && matchesMood && matchesActivity;
  });

  // Convert enums to arrays for dropdown options
  const moodOptions = Object.values(MoodType);
  const activityOptions = Object.values(ActivityType);

  // Helper function to format enum values for display
  const formatEnumValue = (value: string) => {
    return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Show auth error if not signed in
  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen relative" style={{
        background: "linear-gradient(135deg, #00F260 0%, #0575E6 100%)"
      }}>
        <Header />
        <div className="mt-10">
          <AuthError onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen relative" style={{
      background: "linear-gradient(135deg, #00F260 0%, #0575E6 100%)"
    }}>
      <Header />

      <div className="mb-8 mt-10">
        <div className="flex items-center justify-self-center gap-3 mb-6">
          <img src="/assets/history-icon.webp" className='w-10' />
          <div className='border-l border-white pl-4'>
            <h1 className="text-3xl font-bold text-white">Recommendation History</h1>
            <p className="text-white">Your past music discoveries</p>
          </div>
        </div>

        {/* Show auth error */}
        {authError && <AuthError onRetry={fetchHistory} />}

        {/* Show general error */}
        {error && !authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={fetchHistory}
              className="mt-2 text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {!authError && !loading && (
          <>
            {/* Search and Filters */}
            <div className="bg-sky-700 rounded-xl p-4 shadow-sm border-6 border-white mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search songs, artists, albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-white"
                  />
                </div>

                <div className='flex gap-[30px] sm:gap-4'>
                  <div className='relative'>
                    <select
                      value={selectedMood}
                      onChange={(e) => setSelectedMood(e.target.value)}
                      className="appearance-none px-4 py-2 bg-white border border-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-white pr-7"
                    >
                      <option value="all">All Moods</option>
                      {moodOptions.map(mood => (
                        <option key={mood} value={mood}>
                          {formatEnumValue(mood)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className='absolute top-1/2 left-[95px] -translate-y-1/2 pointer-events-none' />
                  </div>

                  <div className='relative'>
                    <select
                      value={selectedActivity}
                      onChange={(e) => setSelectedActivity(e.target.value)}
                      className="appearance-none px-4 py-2 border bg-white border-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-white pr-7"
                    >
                      <option value="all">All Activities</option>
                      {activityOptions.map(activity => (
                        <option key={activity} value={activity}>
                          {formatEnumValue(activity)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className='absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none' />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-600 rounded-xl p-4 shadow-sm border-6 border-white text-white flex items-center" >
                <div className="flex items-center gap-3">
                  <img src="/assets/music.png" className='w-12 border-2 border-white rounded-full' />
                  <div>
                    <p className="text-2xl font-bold">{history.length}</p>
                    <p className="text-sm">Total Sessions</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-600 rounded-xl p-4 shadow-sm border-6 border-white text-white flex items-center" >
                <div className="flex items-center gap-3">
                  <img src="/assets/song.webp" className="w-12 border-2 border-white rounded-full" />
                  <div>
                    <p className="text-2xl font-bold">
                      {history.reduce((acc, item) => acc + item.tracks.length, 0)}
                    </p>
                    <p className="text-sm">Songs Discovered</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-600 rounded-xl p-4 shadow-sm border-6 border-white text-white flex items-center" >
                <div className="flex items-center gap-3">
                  <img src="/assets/music-album.png" className="w-12 border-2 border-white rounded-full" />
                  <div>
                    <p className="text-2xl font-bold">
                      {history.reduce((acc, item) => acc + item.albums.length, 0)}
                    </p>
                    <p className="text-sm ">Albums Explored</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear History Button */}
            {history.length > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={clearAllHistory}
                  className="flex items-center gap-2 px-4 py-2 text-white font-semibold hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All History
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : !authError && filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4">
            <Clock className="w-12 h-12 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || selectedMood !== 'all' || selectedActivity !== 'all'
              ? 'No matching recommendations found'
              : 'No recommendations yet'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedMood !== 'all' || selectedActivity !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start discovering music to see your recommendation history here'
            }
          </p>
        </div>
      ) : !authError && (
        <div className="space-y-6">
          {filteredHistory.map((recommendation) => (
            <HistoryCard
              key={recommendation.id}
              recommendation={recommendation}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}