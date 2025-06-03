"use client"

import React, { useState, useEffect } from 'react';
import { Music2, Heart, Clock, User, Sparkles, Play, Calendar, Filter, Search, Trash2, Star, AlertCircle } from 'lucide-react';
import api from "../utils/axios"
import { useQuery } from '@tanstack/react-query';

enum MoodType {
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  CALM = 'CALM',
  ENERGETIC = 'ENERGETIC',
  ANGRY = 'ANGRY',
  RELAXED = 'RELAXED',
  ROMANTIC = 'ROMANTIC',
  NOSTALGIC = 'NOSTALGIC',
  MELANCHOLIC = 'MELANCHOLIC',
  UPBEAT = 'UPBEAT'
}

enum ActivityType {
  WORKOUT = 'WORKOUT',
  STUDY = 'STUDY',
  RELAX = 'RELAX',
  PARTY = 'PARTY',
  COMMUTE = 'COMMUTE',
  WORK = 'WORK',
  SLEEP = 'SLEEP',
  COOKING = 'COOKING',
  CLEANING = 'CLEANING',
  TRAVEL = 'TRAVEL'
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

const MusicCard = ({
  title,
  artist,
  album,
  cover,
  type = "song",
  previewUrl,
  onPlay,
  onFavorite,
  isFavorite = false
}: {
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  type?: "song" | "album";
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
        {album && type === "song" && (
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

  const getMoodColor = (mood?: string) => {
    const colors: Record<string, string> = {
      HAPPY: 'bg-yellow-100 text-yellow-800',
      SAD: 'bg-blue-100 text-blue-800',
      CALM: 'bg-green-100 text-green-800',
      ENERGETIC: 'bg-red-100 text-red-800',
      ANGRY: 'bg-red-100 text-red-800',
      RELAXED: 'bg-purple-100 text-purple-800',
      ROMANTIC: 'bg-pink-100 text-pink-800',
      NOSTALGIC: 'bg-amber-100 text-amber-800',
      MELANCHOLIC: 'bg-indigo-100 text-indigo-800',
      UPBEAT: 'bg-orange-100 text-orange-800'
    };
    return colors[mood || ''] || 'bg-gray-100 text-gray-800';
  };

  const getActivityColor = (activity?: string) => {
    const colors: Record<string, string> = {
      WORKOUT: 'bg-orange-100 text-orange-800',
      STUDY: 'bg-indigo-100 text-indigo-800',
      RELAX: 'bg-green-100 text-green-800',
      PARTY: 'bg-pink-100 text-pink-800',
      COMMUTE: 'bg-blue-100 text-blue-800',
      WORK: 'bg-gray-100 text-gray-800',
      SLEEP: 'bg-purple-100 text-purple-800',
      COOKING: 'bg-yellow-100 text-yellow-800',
      CLEANING: 'bg-teal-100 text-teal-800',
      TRAVEL: 'bg-cyan-100 text-cyan-800'
    };
    return colors[activity || ''] || 'bg-gray-100 text-gray-800';
  };

  const handlePlay = (previewUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    const audio = new Audio(previewUrl);
    setCurrentAudio(audio);
    audio.play().catch(console.error);
  };

  const handleFavorite = (itemId: string, itemType: 'song' | 'album') => {
    // Implement favorite functionality
    console.log(`Adding ${itemType} ${itemId} to favorites`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-2">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Music Recommendations</h3>
              <p className="text-sm text-gray-500">{formatDate(recommendation.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={() => onDelete(recommendation.id)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {recommendation.mood && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(recommendation.mood)}`}>
              {recommendation.mood.toLowerCase()}
            </span>
          )}
          {recommendation.activity && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActivityColor(recommendation.activity)}`}>
              {recommendation.activity.toLowerCase()}
            </span>
          )}
          {recommendation.genres.map((genre, index) => (
            <span key={index} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {genre}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
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
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
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
                    type="song"
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

export default function HistoryPage() {
  const [history, setHistory] = useState<RecommendationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<string>('all');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(false);
      
      // Add a small delay to ensure Clerk auth is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await api.get<RecommendationHistory[]>("/api/ai-song/history");
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
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/ai-song/history/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch(error: any) {
      console.error('Failed to delete history item:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
        setError('Authentication required');
      } else {
        setError('Failed to delete item');
      }
    }
  };

  const clearAllHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        await api.delete('/api/ai-song/history');
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-3">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recommendation History</h1>
            <p className="text-gray-600">Your past music discoveries</p>
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
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search songs, artists, albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Moods</option>
                  {moodOptions.map(mood => (
                    <option key={mood} value={mood}>
                      {formatEnumValue(mood)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Activities</option>
                  {activityOptions.map(activity => (
                    <option key={activity} value={activity}>
                      {formatEnumValue(activity)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <Music2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{history.length}</p>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {history.reduce((acc, item) => acc + item.tracks.length, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Songs Discovered</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {history.reduce((acc, item) => acc + item.albums.length, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Albums Explored</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear History Button */}
            {history.length > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={clearAllHistory}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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