"use client";

import React, { useState, useEffect } from "react";
import {
  Music2,
  Heart,
  Clock,
  User,
  Sparkles,
  Play,
  Youtube,
} from "lucide-react";
import api, { createAuthenticatedApi } from "./utils/axios";
import Header from "./components/Header";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

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

const SelectableGroup = ({
  options,
  selected,
  onSelect,
  title,
  icon: Icon,
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
          className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
            selected === option
              ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
              : "border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50"
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
  type = "track",
  previewUrl,
  spotifyUrl,
  youtubeData,
  itemId,
  onFavoriteToggle,
  isFavorited,
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
  onFavoriteToggle?: (
    itemId: string,
    itemType: string,
    isFavorited: boolean
  ) => Promise<void>;
  isFavorited?: boolean;
}) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const handleFavoriteClick = async () => {
    if (!itemId || !onFavoriteToggle) return;

    setFavoriteLoading(true);
    try {
      await onFavoriteToggle(itemId, type, isFavorited || false);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const youtubeUrl = youtubeData?.videoId
    ? `https://www.youtube.com/watch?v=${youtubeData.videoId}`
    : null;

  const handleYouTubePlay = () => {
    if (youtubeUrl) {
      window.open(youtubeUrl, "_blank", "noopener,noreferrer");
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
                    {album && type === "track" && (
                        <p className="text-gray-500 text-xs truncate">{album}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
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

                    </div>
                </div>
                <div className="flex flex-col items-center justify-center sm:gap-2 sm:flex-row sm:justify-center">
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
                    {/* <div className="flex gap-2"> */}
                    {type === "track" && youtubeUrl && (
                        <button
                            onClick={handleYouTubePlay}
                            className="cursor-pointer mb-3"
                        >
                            <img src="/assets/youtube.webp" className="w-9 sm:pt-3" />
                        </button>
                    )}
                    {spotifyUrl && (
                        <a
                            href={spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img src="/assets/spotify.webp" className="w-6" />
                        </a>
                    )}
                    {/* </div> */}
                </div>
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

  const moods = [
    "Happy",
    "Sad",
    "Calm",
    "Angry",
    "Energetic",
    "Melancholic",
    "Excited",
    "Peaceful",
  ];
  const genres = [
    "Lo-fi",
    "Rock",
    "Jazz",
    "Ambient",
    "Hip Hop",
    "EDM",
    "R&B",
    "Pop",
  ];
  const activities = [
    "Workout",
    "Study",
    "Party",
    "Relax",
    "Commute",
    "Cooking",
    "Sleep",
    "Work",
  ];

  const { isSignedIn, isLoaded, getToken, userId } = useAuth();

  const getApiInstance = async () => {
    console.log("=== Getting API instance ===");
    console.log("isSignedIn:", isSignedIn);
    console.log("isLoaded:", isLoaded);
    console.log("userId:", userId);

    if (!isLoaded) {
      throw new Error("Clerk not loaded yet");
    }

    if (!isSignedIn || !userId) {
      console.log("User not signed in, using basic API");
      return api;
    }

    try {
      console.log("Getting session token...");
      const sessionToken = await getToken();
      console.log(
        "Session token:",
        sessionToken ? `${sessionToken.substring(0, 20)}...` : "null"
      );

      if (!sessionToken) {
        console.warn("No session token available");
        throw new Error("No session token available");
      }

      return createAuthenticatedApi(sessionToken);
    } catch (error: any) {
      console.error("Error getting session token:", error);
      throw error; 
    }
  };

  const loadFavoritesForCurrentItems = async () => {
    if (!isLoaded) {
      console.log("Clerk not loaded, skipping favorites");
      return;
    }

    if (!isSignedIn || !userId) {
      console.log("User not signed in, clearing favorites");
      setFavorites(new Set());
      return;
    }

    const allItemIds = [
      ...songs.map((song) => song.songId).filter(Boolean),
      ...albums.map((album) => album.albumId).filter(Boolean),
    ] as string[];

    if (allItemIds.length === 0) {
      console.log("No items to check favorites for");
      return;
    }

    try {
      console.log("=== Loading favorites ===");
      console.log("Item IDs:", allItemIds);

      const apiInstance = await getApiInstance();

      const response = await apiInstance.post<{ favorited: string[] }>(
        "/api/ai-song/favorites/check",
        {
          itemIds: allItemIds,
        }
      );

      console.log("✅ Favorites loaded:", response.data.favorited);
      setFavorites(new Set(response.data.favorited));
    } catch (error: any) {
      console.error("❌ Error loading favorites:", error);

      if (error.response?.status === 401) {
        console.warn(
          "Authentication failed - clearing favorites and continuing"
        );
        setFavorites(new Set());
      } else if (error.message === "No session token available") {
        console.warn(
          "No session token - user may need to refresh or sign in again"
        );
        setFavorites(new Set());
      } else {
        console.error("Unexpected error loading favorites:", error.message);
      }
    }
  };
  useEffect(() => {
    if (isLoaded && (songs.length > 0 || albums.length > 0)) {
      loadFavoritesForCurrentItems();
    }
  }, [songs, albums, isSignedIn, isLoaded]);

  const handleSubmit = async () => {
    if (!mood || !genre || !activity) {
      alert("Please select a mood, genre, and activity");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get<RecommendationsResponse>(
        "/api/ai-song/recommendations",
        {
          params: {
            mood,
            genre,
            activity,
          },
        }
      );

      setSongs(res.data.songs || []);
      setAlbums(res.data.albums || []);
      setFromCache(res.data.fromCache || false);
    } catch (err: any) {
      console.error("Fetch error:", err);

      if (err.response?.status === 400) {
        alert(
          "Please make sure all fields are selected (mood, genre, activity)"
        );
      } else if (err.response?.status === 401) {
        alert("Authentication required. Please sign in.");
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.");
      } else {
        alert("Failed to fetch suggestions. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Improved favorite toggle with better error handling
  const handleFavoriteToggle = async (
    itemId: string,
    itemType: string,
    isFavorited: boolean
  ): Promise<void> => {
    if (!isLoaded) {
      alert("Please wait for the page to load.");
      return;
    }

    if (!isSignedIn) {
      alert("Please sign in to manage favorites.");
      return;
    }

    try {
      console.log("=== Toggling favorite ===");
      console.log(
        `ID: ${itemId}, Type: ${itemType}, Currently Favorited: ${isFavorited}`
      );

      const apiInstance = await getApiInstance();

      if (isFavorited) {
        console.log(`Removing ${itemId} from favorites...`);
        await apiInstance.delete(`/api/ai-song/favorites/${itemId}`);
        console.log(`✅ Successfully removed ${itemId} from favorites`);

        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(itemId);
          return newFavorites;
        });
      } else {
        console.log(`Adding ${itemId} to favorites...`);
        await apiInstance.post("/api/ai-song/favorites", {
          itemId,
          itemType,
        });
        console.log(`✅ Successfully added ${itemId} to favorites`);

        setFavorites((prev) => new Set([...prev, itemId]));
      }
    } catch (error: any) {
      console.error("❌ Error toggling favorite:", error);

      let errorMessage = "Failed to update favorites. Please try again.";

      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please sign in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied. Please check your permissions.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.code === "NETWORK_ERROR" || !error.response) {
        errorMessage = "Network error. Please check your connection.";
      }

      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setMood(null);
    setGenre(null);
    setActivity(null);
    setSongs([]);
    setAlbums([]);
    setFromCache(false);
    setFavorites(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative">
      <div className="absolute">
      <Header />
      </div>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              NextVibe
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Tell us your mood, genre preference, and activity - we'll find the
            perfect music for you!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <SelectableGroup
            options={moods}
            selected={mood}
            onSelect={setMood}
            title="How are you feeling?"
            icon={Heart}
          />

          <SelectableGroup
            options={genres}
            selected={genre}
            onSelect={setGenre}
            title="What genre are you in the mood for?"
            icon={Music2}
          />

          <SelectableGroup
            options={activities}
            selected={activity}
            onSelect={setActivity}
            title="What are you doing?"
            icon={Clock}
          />

          <div className="flex gap-4 justify-center">
          <Button
  onClick={handleSubmit}
  disabled={loading || !mood || !genre || !activity}
  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md h-15 text-[17px] rounded-4xl"
>
  {loading ? "Getting Recommendations..." : "Get Recommendations"}
</Button>


            {(songs.length > 0 || albums.length > 0) && (
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md h-15 text-[17px] rounded-4xl"
                >
                Reset
              </Button>
            )}
          </div>
        </div>

        {fromCache && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Cached Results</span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              These recommendations were previously generated for this
              combination.
            </p>
          </div>
        )}

        {songs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Music2 className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                Recommended Songs
              </h2>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {songs.length} songs
              </span>
            </div>
            <div className="grid gap-4">
              {songs.map((song, index) => (
                <MusicCard
                  key={`${song.songId || song.songName}-${index}`}
                  title={song.songName || "Unknown Song"}
                  artist={song.artistName || "Unknown Artist"}
                  album={song.albumName}
                  cover={song.albumCover}
                  type="track"
                  previewUrl={song.previewUrl}
                  spotifyUrl={song.spotifyUrl}
                  youtubeData={song.youtubeData}
                  itemId={song.songId}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorited={song.songId ? favorites.has(song.songId) : false}
                />
              ))}
            </div>
          </div>
        )}

        {albums.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                Recommended Albums
              </h2>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {albums.length} albums
              </span>
            </div>
            <div className="grid gap-4">
              {albums.map((album, index) => (
                <MusicCard
                  key={`${album.albumId || album.albumName}-${index}`}
                  title={album.albumName || "Unknown Album"}
                  artist={album.artistName || "Unknown Artist"}
                  cover={album.albumCover}
                  type="album"
                  spotifyUrl={album.spotifyUrl}
                  itemId={album.albumId}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorited={
                    album.albumId ? favorites.has(album.albumId) : false
                  }
                />
              ))}
            </div>
          </div>
        )}

        {!loading &&
          songs.length === 0 &&
          albums.length === 0 &&
          (mood || genre || activity) && (
            <div className="text-center py-12">
              <Music2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No recommendations found
              </h3>
              <p className="text-gray-500">
                Try selecting different options or check your internet
                connection.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}
