"use client";

import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { Music2, Heart, Play } from "lucide-react";
import api, { createAuthenticatedApi } from "../utils/axios";
import Header from "../components/Header";
import FlipSwiperGenre from "../components/FlipSwiperGenre";
import FlipSwiperActivity from "../components/FlipSwiperActivity";
import { useAuth } from "@clerk/nextjs";

type EmotionData = {
  image: string;
  color: string;
};

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

const data: Record<string, EmotionData> = {
  joy: {
    image: "/assets/joy.webp",
    color: "linear-gradient(135deg, #FFEB3B 0%, #FFC107 50%, #FF8F00 100%)",
  },
  anger: {
    image: "/assets/anger.webp",
    color: "linear-gradient(135deg, #F44336 0%, #D32F2F 50%, #B71C1C 100%)",
  },
  envy: {
    image: "/assets/envy.webp",
    color: "linear-gradient(135deg, #00E5CC 0%, #00BFA5 50%, #004D40 100%)",
  },
  fear: {
    image: "/assets/fear.webp",
    color: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #4A148C 100%)",
  },
  sadness: {
    image: "/assets/sadness.webp",
    color: "linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #0D47A1 100%)",
  },
  ennui: {
    image: "/assets/ennui.webp",
    color: "linear-gradient(135deg, #5C6BC0 0%, #3F51B5 50%, #1A237E 100%)",
  },
  disgust: {
    image: "/assets/disgust.webp",
    color: "linear-gradient(135deg, #8BC34A 0%, #689F38 50%, #33691E 100%)",
  },
  shame: {
    image: "/assets/embarrassment.webp",
    color: "linear-gradient(135deg, #FF69B4 0%, #E91E63 50%, #880E4F 100%)",
  },
  anxiety: {
    image: "/assets/anxiety.webp",
    color: "linear-gradient(135deg, #FF8C42 0%, #FF6B1A 50%, #E55100 100%)",
  },
};

const topMusicGenres: Record<string, EmotionData> = {
  Pop: {
    color: "bg-red-300",
    image: "/assets/pop-sticker-icon.webp",
  },
  Rock: {
    color: "bg-orange-500",
    image: "/assets/finger-icon.webp",
  },
  HipHop: {
    color: "bg-orange-700",
    image: "/assets/orange-hat-icon.webp",
  },
  Electronic: {
    color: "bg-violet-500",
    image: "/assets/headset-icon.webp",
  },
  Soul: {
    color: "bg-amber-400",
    image: "/assets/heart-icon.webp",
  },
  Country: {
    color: "bg-amber-600",
    image: "/assets/guitar-icon.webp",
  },
  Jazz: {
    color: "bg-teal-600",
    image: "/assets/buree-icon.webp",
  },
  Classical: {
    color: "bg-red-900",
    image: "/assets/vionyl-icon.webp",
  },
  Reggae: {
    color: "bg-green-700",
    image: "/assets/reggie-icon.webp",
  },
  Blues: {
    color: "bg-sky-600",
    image: "/assets/blues-icon.webp",
  },
};

const topActivities: Record<string, EmotionData> = {
  Coding: {
    color: "bg-indigo-600",
    image: "/assets/activity-icon-coding.webp",
  },
  Reading: {
    color: "bg-emerald-500",
    image: "/assets/reading-icon.webp",
  },
  Nothing: {
    color: "bg-gray-400",
    image: "/assets/chill-out-icon.webp",
  },
  Running: {
    color: "bg-orange-600",
    image: "/assets/running-icon.webp",
  },
  Cooking: {
    color: "bg-amber-500",
    image: "/assets/cooking-icon.webp",
  },
  Traveling: {
    color: "bg-blue-500",
    image: "/assets/travel-icon.webp",
  },
  Gaming: {
    color: "bg-purple-700",
    image: "/assets/gaming-icon.webp",
  },
  Drawing: {
    color: "bg-pink-400",
    image: "/assets/drawing-icon.webp",
  },
  Yoga: {
    color: "bg-teal-400",
    image: "/assets/yoga-icon.webp",
  },
  Biking: {
    color: "bg-lime-500",
    image: "/assets/biking-icon.webp",
  },
  Dancing: {
    color: "bg-rose-500",
    image: "/assets/dancing-icon.webp",
  },
  Gardening: {
    color: "bg-green-600",
    image: "/assets/gardening-icon.webp",
  },
};

const stickerGenre = Object.entries(topMusicGenres);
const stickerActivity = Object.entries(topActivities);

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
                  audio
                    .play()
                    .catch((e) => console.warn("Preview play failed:", e));
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
            className={`p-2 rounded-full transition-all duration-200 ${
              favoriteLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            {favoriteLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorited
                    ? "text-red-500 fill-red-500"
                    : "text-gray-400 hover:text-red-500"
                }`}
              />
            )}
          </button>
          {/* <div className="flex gap-2"> */}
          {type === "track" && youtubeUrl && (
            <button onClick={handleYouTubePlay} className="cursor-pointer mb-3">
              <img src="/assets/youtube.webp" className="w-9 sm:pt-3" />
            </button>
          )}
          {spotifyUrl && (
            <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
              <img src="/assets/spotify.webp" className="w-6" />
            </a>
          )}
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default function CardCarousel() {
  const swiperRef = useRef<SwiperClass | null>(null);
  const [index, setIndex] = useState(0);
  const [genreIndex, setGenreIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [generateStart, setGenerateStart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [lastActivity, setLastActivity] = useState<string>("");

  const colors = Object.entries(data);

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

  const handleMoodClick = (index: number) => {
    // console.log(index);
  };

  const handleSubmit = async () => {
    const currentMood = Object.entries(data)[index][0];
    const currentGenre = Object.entries(topMusicGenres)[genreIndex][0];
    const currentActivity = Object.entries(topActivities)[activityIndex][0];
    setLastActivity(currentActivity); /// SPECIAL FOR CODERS

    console.log("Current selections:", {
      currentMood,
      currentGenre,
      currentActivity,
    });

    if (!currentMood || !currentGenre || !currentActivity) {
      alert("Please select a mood, genre, and activity");
      return;
    }

    try {
      setLoading(true);
      setGenerateStart(true);

      const res = await api.get<RecommendationsResponse>(
        "/api/ai-song/recommendations",
        {
          params: {
            mood: currentMood,
            genre: currentGenre,
            activity: currentActivity,
          },
        }
      );

      setSongs(res.data.songs || []);
      setAlbums(res.data.albums || []);
      setFromCache(res.data.fromCache || false);
    } catch (err: any) {
      console.error("Fetch error:", err);

      // More detailed error handling
      if (err.response?.status === 400) {
        alert(
          "Please make sure all fields are selected (mood, genre, activity)"
        );
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.");
      } else {
        alert("Failed to fetch suggestions. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

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

  //   const resetForm = () => {
  //     setMood(null);
  //     setGenre(null);
  //     lastActivity(null);
  //     setSongs([]);
  //     setAlbums([]);
  //     setFromCache(false);
  //     setFavorites(new Set());
  //   };

  return (
    <div
      className="max-w-4xl w-full min-h-screen mx-auto space-y-4 bg-black py-6 bg-center bg-cover overflow-hidden pt-14 relative"
      style={{ backgroundImage: `${colors[index][1].color}` }}
    >
      <div className="w-full h-full bg-black absolute top-0 z-1 opacity-10"></div>
      <Header />
      <div className="w-full h-screen absolute [&>*]:absolute">
        <img
          className="w-[20%] top-[-15%] left-[40%] rotate-50 sm:left-[20%] sm:w-[10%] sm:top-[20%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[25%] bottom-[56%] right-[-7%] rotate-20"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[28%] top-[-7%] left-[1%] rotate-[-20deg] sm:w-[15%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[30%] top-[-14%] right-[-5%] rotate-220 sm:w-[15%] sm:top-[-10%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[15%] top-[20%] left-[-3%] rotate-30"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[10%] top-[10%] right-[-3%] rotate-[-20deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[35%] bottom-[23%] right-[-5%] rotate-130 sm:w-[15%] sm:rotate-0 sm:right-[7%] sm:top-[50%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] bottom-[14%] right-[-4%] rotate-[35deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[8%] bottom-[5%] left-[32%] rotate-[-20deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[100%] right-[-5%] rotate-[-25deg] sm:w-[15%] sm:right-[3%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[112%] left-[-5%] rotate-[45deg] sm:w-[14%] sm:top-[115%] sm:left-[4%] sm:rotate-[-30deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[125%] right-[-5%] rotate-[-45deg] sm:w-[18%] sm:rotate-[-20deg] sm:top-[122%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[135%] left-[-2%] rotate-[-15deg] sm:top-[143%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[152%] right-[-5%] rotate-[25deg] sm:w-[15%] sm:top-[159%] sm:right-[3%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[175%] left-[-4%] rotate-[-30deg] sm:w-[17%] sm:left-[3%] sm:rotate-20"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[198%] right-[-3%] rotate-[45deg] sm:rotate-[-35deg] sm:top-[193%] sm:w-[17] sm:right-[1%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[15%] bottom-[27%] left-[7%] rotate-40"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[11%] top-[200%] left-[0%] rotate-[20deg] sm:w-[14%] sm:rotate-[-30deg] sm:left-[5%]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[11%] top-[125%] left-[37%] rotate-[-20deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[17%] top-[166%] left-[62%] rotate-[180deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[8%] top-[189%] left-[57%] rotate-[20deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[15%] top-[-10%] left-[63%] rotate-[30deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[9%] top-[66%] left-[58%] rotate-[-20deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[8%] top-[86%] left-[13%] rotate-[30deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>

        <img
          className="w-[30%] top-[37%] left-[-10%] rotate-[-35deg] sm:w-[20%] sm:left-[-2%] sm:top-[40%]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] top-[138%] right-[1%] rotate-[30deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[15%] top-[-5%] left-[43%] rotate-[25deg] sm:top-[7%] sm:left-[10%]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[16%] top-[4%] right-[8%] rotate-[-35deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[7%] top-[23%] right-[2%] rotate-[15deg] sm:w-[10%] sm:right-[17%]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[8%] bottom-[36%] left-[2%] rotate-[-220deg] sm:left-[18%] sm:top-[34%]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[7%] top-[178%] left-[30%] rotate-[25deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[19%] top-[198%] left-[30%] rotate-[-85deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[15%] top-[90%] right-[-3%] rotate-[235deg] sm:w-[10%]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[18%] top-[100%] left-[-2%] rotate-[-35deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[10%] top-[114%] right-[0%] rotate-[415deg sm:w-[7%] sm:right-[8%] sm:rotate-[30deg] sm:top-[117%]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[14%] top-[125%] left-[-4%] rotate-[-35deg] sm:w-[10%] sm:left-[-2%] sm:rotate-35 sm:top-[128%]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[12%] top-[165%] left-[-1%] rotate-[-25deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[19%] top-[176%] right-[-6%] rotate-[-35deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[26%] top-[209%] left-[-10%] rotate-[25deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[11%] top-[190%] left-[1%] rotate-[-35deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[15%] top-[214%] right-[1%] rotate-[0deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[11%] top-[102%] right-[30%] rotate-[20deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[11%] top-[-5%] right-[65%] rotate-[-30deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[7%] top-[43%] right-[15%] rotate-[-30deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[6%] top-[62%] right-[3%] rotate-[30deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[10%] top-[67%] right-[21%] rotate-[-30deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[10%] top-[75%] left-[0%] rotate-[80deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[11%] top-[80%] right-[30%] rotate-[42deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="hidden sm:block w-[7%] top-[66%] right-[65%] rotate-[40deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
      </div>

      <div className="space-y-4">
        <h1
          className="relative text-white text-center font-bold z-2
                transition-all duration-700 ease-in-out transform font-fredoka text-3xl"
        >
          JUST SWIPE
        </h1>
        <Swiper
          effect="cards"
          loop={true}
          grabCursor={true}
          pagination={{ clickable: true }}
          modules={[EffectCards, Pagination]}
          className="w-[250px] h-[350px] 
                transition-all duration-700 ease-in-out transform"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;

            swiper.on("activeIndexChange", () => {
              setIndex(swiper.realIndex);
            });
          }}
        >
          {Object.entries(data).map(([key, value], index) => (
            <SwiperSlide
              key={index}
              onClick={() => handleMoodClick(index)}
              className="flex items-center justify-center w-[400px] h-[400px] rounded-3xl relative border-4 border-white"
            >
              <h1 className="absolute top-7 left-1/2 -translate-1/2 text-white font-bold text-3xl">
                {key[0].toUpperCase() + key.slice(1).toUpperCase()}
              </h1>
              <Image
                src={value.image}
                alt={`Slide ${index + 1}`}
                width={350}
                height={400}
                className="rounded-xl object-cover object-center mx-auto"
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <FlipSwiperGenre setGenreIndex={setGenreIndex} />
        <FlipSwiperActivity setActivityIndex={setActivityIndex} />
        <div className="w-full flex items-center justify-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`cursor-pointer
    text-white border-2 border-white rounded-full py-2 px-3 font-bold text-lg bg-purple-500 relative 
    transition-all duration-700 ease-in-out transform z-10 
    ${loading ? "opacity-50 cursor-not-allowed" : ""}
  `}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      <div className="relative z-19">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {fromCache && (
          <div className="mt-4 text-center">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
              ⚡ Results from cache
            </span>
          </div>
        )}

        {/* Results */}
        <div className="max-w-xl mx-auto relative z-10 transition-all duration-700 ease-in-out transform">
          {(songs.length > 0 || albums.length > 0) && (
            <div className="space-y-8">
              {songs.length > 0 && (
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6 text-white">
                    <img src="/assets/recommend-icon-1.webp" className="w-10" />
                    <h2 className="text-3xl font-bold border-l pl-3 font-fredoka">
                      Recommended Songs
                    </h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    {songs
                      .filter((song) => song && typeof song === "object")
                      .map((song, i) => (
                        <MusicCard
                          key={i}
                          title={song?.songName || "Unknown Song"}
                          artist={song?.artistName || "Unknown Artist"}
                          album={song?.albumName || "Unknown Album"}
                          cover={song?.albumCover}
                          type="track"
                          previewUrl={song?.previewUrl}
                          spotifyUrl={song?.spotifyUrl}
                          youtubeData={song?.youtubeData}
                          itemId={song?.songId}
                          onFavoriteToggle={handleFavoriteToggle}
                          isFavorited={favorites.has(song?.songId || "")}
                        />
                      ))}
                  </div>
                </div>
              )}

              {albums.length > 0 && (
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <img
                      src="/assets/recommend-icon-cd.webp"
                      className="w-10"
                    />
                    <h2 className="text-3xl font-bold border-l pl-3 text-white">
                      Recommended Albums
                    </h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    {albums
                      .filter((album) => album && typeof album === "object")
                      .map((album, i) => (
                        <MusicCard
                          key={i}
                          title={album?.albumName || "Unknown Album"}
                          artist={album?.artistName || "Unknown Artist"}
                          cover={album?.albumCover}
                          type="album"
                          spotifyUrl={album?.spotifyUrl}
                          itemId={album?.albumId}
                          onFavoriteToggle={handleFavoriteToggle}
                          isFavorited={favorites.has(album?.albumId || "")}
                        />
                      ))}
                  </div>
                </div>
              )}
              {lastActivity === "Coding" && (
                <div className="flex flex-col justify-center items-center gap-5 px-10">
                  <div className="flex items-center gap-2">
                    <img src="/assets/lol.webp" className="w-8" />
                    <h2 className="text-2xl text-white font-bold">
                      Special for coders
                    </h2>
                    <img src="/assets/lol.webp" className="w-8" />
                  </div>
                  <img
                    src="/assets/special-tap.webp"
                    className="w-10 rotate-180"
                  />
                  <a
                    target="blank"
                    href="https://www.youtube.com/watch?v=WaNPyFrHje4"
                  >
                    <img src="/assets/special.webp" className="w-20" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
