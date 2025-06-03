"use client";

import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

import Image from "next/image";
import { useRef, useState } from "react";
import FlipSwiperGenre from "../components/FlipSwiperGenre";
import FlipSwiperActivity from "../components/FlipSwiperActivity";
import api from "../utils/axios";
import { Music2, Heart, Play } from "lucide-react";
import Header from "../components/Header";

type EmotionData = {
  image: string;
  color: string;
  bg?: string
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
    bg: "bg-amber-500"
  },
  anger: {
    image: "/assets/anger.webp",
    color: "linear-gradient(135deg, #F44336 0%, #D32F2F 50%, #B71C1C 100%)",
    bg: "bg-red-700"
  },
  envy: {
    image: "/assets/envy.webp",
    color: "linear-gradient(135deg, #00E5CC 0%, #00BFA5 50%, #004D40 100%)",
    bg: "bg-teal-600"
  },
  fear: {
    image: "/assets/fear.webp",
    color: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #4A148C 100%)",
    bg: "bg-fuchsia-800"
  },
  sadness: {
    image: "/assets/sadness.webp",
    color: "linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #0D47A1 100%)",
    bg: "bg-blue-700"
  },
  ennui: {
    image: "/assets/ennui.webp",
    color: "linear-gradient(135deg, #5C6BC0 0%, #3F51B5 50%, #1A237E 100%)",
    bg: "bg-purple-900"
  },
  disgust: {
    image: "/assets/disgust.webp",
    color: "linear-gradient(135deg, #8BC34A 0%, #689F38 50%, #33691E 100%)",
    bg: "bg-lime-700"
  },
  shame: {
    image: "/assets/embarrassment.webp",
    color: "linear-gradient(135deg, #FF69B4 0%, #E91E63 50%, #880E4F 100%)",
    bg: "bg-pink-700"
  },
  anxiety: {
    image: "/assets/anxiety.webp",
    color: "linear-gradient(135deg, #FF8C42 0%, #FF6B1A 50%, #E55100 100%)",
    bg: "bg-orange-600"
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
  type = "song",
  previewUrl,
  spotifyUrl,
}: {
  title: string;
  artist: string;
  album?: string;
  cover?: string | null;
  type?: "song" | "album";
  previewUrl?: string | null;
  spotifyUrl?: string;
}) => (
  <div className={`rounded-xl p-4 shadow-2xl hover:shadow-md transition-shadow duration-200 bg-[#F5F5F5]`}>
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

      </div>

      <div className="flex flex-col items-center">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
        </button><div className="flex gap-2 mt-2">
          {spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-green-500 text-black px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
            >
              Spotify
            </a>
          )}
          {previewUrl && (
            <button
              onClick={() => {
                const audio = new Audio(previewUrl);
                audio.play();
              }}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
            >
              Preview
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

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

  const colors = Object.entries(data);

  const handleMoodClick = (index: number) => {
    console.log(index);
  };

  const handleSubmit = async () => {
    // Get current values directly from indices instead of state
    const currentMood = Object.entries(data)[index][0];
    const currentGenre = Object.entries(topMusicGenres)[genreIndex][0];
    const currentActivity = Object.entries(topActivities)[activityIndex][0];

    console.log("Current selections:", {
      currentMood,
      currentGenre,
      currentActivity,
    });

    // Validate that all fields are selected (they should always be since we have default indices)
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

  return (
    <div
      className="max-w-[430px] w-full min-h-screen mx-auto space-y-4 bg-black py-6 bg-center bg-cover overflow-hidden pt-12 relative"
      style={{ backgroundImage: `${colors[index][1].color}` }}
    >
      <Header />
      <div className="w-full min-h-screen h-full absolute [&>*]:absolute">
        <img
          className="w-[20%] top-[-15%] left-[40%] rotate-50"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[25%] bottom-[56%] right-[-7%] rotate-20"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[28%] top-[-7%] left-[1%] rotate-[-20deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[30%] top-[-14%] right-[-5%] rotate-220"
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
          className="w-[60%] bottom-[23%] right-[-10%] rotate-130"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[25%] bottom-[15%] left-[7%] rotate-40"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] bottom-[10%] right-[10%] rotate-[35deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] bottom-[5%] left-[30%] rotate-[-45deg]"
          src={`${stickerGenre[genreIndex][1].image}`}
        ></img>

        <img
          className="w-[30%] top-[37%] left-[-10%] rotate-[-35deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[20%] bottom-[15%] right-[35%] rotate-[-30deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[15%] top-[-5%] left-[43%] rotate-[25deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[16%] top-[4%] right-[8%] rotate-[-35deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[7%] top-[23%] right-[2%] rotate-[15deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[8%] bottom-[36%] left-[2%] rotate-[-220deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
        <img
          className="w-[30%] bottom-[0%] left-[-10%] rotate-[-35deg]"
          src={`${stickerActivity[activityIndex][1].image}`}
        ></img>
      </div>
      <div
        className="space-y-4"
      >
        <h1
          className="relative text-white text-3xl text-center font-bold z-2
                transition-all duration-700 ease-in-out transform">
          SELECT YOUR MOOD
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

            // Register event listener for activeIndexChange
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

        <FlipSwiperGenre
          setGenreIndex={setGenreIndex}
        />
        <FlipSwiperActivity
          setActivityIndex={setActivityIndex}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`
    text-white border-2 border-white rounded-full py-2 px-3 font-bold text-lg bg-purple-500 relative flex justify-self-center 
    transition-all duration-700 ease-in-out transform cursor-pointer
    ${loading ? "opacity-50 cursor-not-allowed" : ""}
  `}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
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
        <div className="relative z-10 transition-all duration-700 ease-in-out transform">
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
                          type="song"
                          previewUrl={song?.previewUrl}
                          spotifyUrl={song?.spotifyUrl}
                        />
                      ))}
                  </div>
                </div>
              )}

              {albums.length > 0 && (
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/assets/recommend-icon-cd.webp" className="w-10" />
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
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
