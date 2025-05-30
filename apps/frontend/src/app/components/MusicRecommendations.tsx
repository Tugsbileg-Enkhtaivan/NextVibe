
// import React, { useEffect, useRef, useState } from "react";
// import { Heart, Play } from 'lucide-react';
// import api from "../utils/axios";

// // Mock API function (replace with your actual API)
// const mockApi = {
//   get: async (url, config) => {
//     // Simulate API delay
//     await new Promise(resolve => setTimeout(resolve, 1500));
    
//     // Mock response based on mood and genre
//     const mockSongs = [
//       {
//         songId: "1",
//         songName: "Blinding Lights",
//         artistName: "The Weeknd",
//         albumName: "After Hours",
//         albumCover: "https://i.scdn.co/image/ab67616d0000b273c2a2c6deb0ec35c7b6b5a5bd",
//         previewUrl: "https://preview.url",
//         spotifyUrl: "https://open.spotify.com/track/0VjIjW4GlUOLEiOBAFzBxh",
//         youtubeData: {
//           videoId: "4NRXx6U8ABQ",
//           title: "The Weeknd - Blinding Lights",
//           thumbnail: "https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg"
//         }
//       },
//       {
//         songId: "2",
//         songName: "Levitating",
//         artistName: "Dua Lipa",
//         albumName: "Future Nostalgia",
//         albumCover: "https://i.scdn.co/image/ab67616d0000b273d49fc2b628dcc102b0bbdcfb",
//         previewUrl: "https://preview.url",
//         spotifyUrl: "https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9",
//         youtubeData: {
//           videoId: "TUVcZfQe-Kw",
//           title: "Dua Lipa - Levitating",
//           thumbnail: "https://img.youtube.com/vi/TUVcZfQe-Kw/hqdefault.jpg"
//         }
//       }
//     ];

//     const mockAlbums = [
//       {
//         albumId: "1",
//         albumName: "After Hours",
//         artistName: "The Weeknd",
//         albumCover: "https://i.scdn.co/image/ab67616d0000b273c2a2c6deb0ec35c7b6b5a5bd",
//         spotifyUrl: "https://open.spotify.com/album/4yP0hdKOZPNshxUOjY0cZj",
//         releaseDate: "2020-03-20"
//       },
//       {
//         albumId: "2",
//         albumName: "Future Nostalgia",
//         artistName: "Dua Lipa",
//         albumCover: "https://i.scdn.co/image/ab67616d0000b273d49fc2b628dcc102b0bbdcfb",
//         spotifyUrl: "https://open.spotify.com/album/5EBGCvO6upi3GNknMVe9x9",
//         releaseDate: "2020-03-27"
//       }
//     ];

//     return {
//       data: {
//         songs: mockSongs,
//         albums: mockAlbums
//       }
//     };
//   }
// };

// // Types
// interface Song {
//   songId?: string;
//   songName?: string;
//   artistName?: string;
//   albumName?: string;
//   albumCover?: string | null;
//   previewUrl?: string;
//   spotifyUrl?: string;
//   youtubeData?: {
//     videoId: string;
//     title: string;
//     thumbnail: string;
//   };
// }

// interface Album {
//   albumId?: string;
//   albumName?: string;
//   artistName?: string;
//   albumCover?: string | null;
//   spotifyUrl?: string;
//   releaseDate?: string;
// }

// interface RecommendationsResponse {
//   songs?: Song[];
//   albums?: Album[];
// }

// type EmotionData = {
//   image: string;
//   color: string;
// };

// // Data
// const data: Record<string, EmotionData> = {
//   joy: {
//     image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0",
//     color: "linear-gradient(135deg, #FFEB3B 0%, #FFC107 50%, #FF8F00 100%)",
//   },
//   anger: {
//     image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
//     color: "linear-gradient(135deg, #F44336 0%, #D32F2F 50%, #B71C1C 100%)",
//   },
//   envy: {
//     image: "https://images.unsplash.com/photo-1520637836862-4d197d17c93a",
//     color: "linear-gradient(135deg, #00E5CC 0%, #00BFA5 50%, #004D40 100%)",
//   },
//   fear: {
//     image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
//     color: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #4A148C 100%)",
//   },
//   sadness: {
//     image: "https://images.unsplash.com/photo-1494548162494-384bba4ab999",
//     color: "linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #0D47A1 100%)",
//   },
//   ennui: {
//     image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
//     color: "linear-gradient(135deg, #5C6BC0 0%, #3F51B5 50%, #1A237E 100%)",
//   },
//   disgust: {
//     image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
//     color: "linear-gradient(135deg, #8BC34A 0%, #689F38 50%, #33691E 100%)",
//   },
//   shame: {
//     image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
//     color: "linear-gradient(135deg, #FF69B4 0%, #E91E63 50%, #880E4F 100%)",
//   },
//   anxiety: {
//     image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
//     color: "linear-gradient(135deg, #FF8C42 0%, #FF6B1A 50%, #E55100 100%)",
//   },
// };

// const topMusicGenres: Record<string, EmotionData> = {
//   Pop: {
//     color: "bg-red-300",
//     image: "🎵"
//   },
//   Rock: {
//     color: "bg-orange-500",
//     image: "🤘"
//   },
//   HipHop: {
//     color: "bg-orange-700",
//     image: "🎤"
//   },
//   Electronic: {
//     color: "bg-violet-500",
//     image: "🎧"
//   },
//   Soul: {
//     color: "bg-amber-400",
//     image: "❤️"
//   },
//   Country: {
//     color: "bg-amber-600",
//     image: "🎸"
//   },
//   Jazz: {
//     color: "bg-teal-600",
//     image: "🎺"
//   },
//   Classical: {
//     color: "bg-red-900",
//     image: "🎼"
//   },
//   Reggae: {
//     color: "bg-green-700",
//     image: "🌴"
//   },
//   Blues: {
//     color: "bg-sky-600",
//     image: "🎷"
//   },
// };

// // Card Carousel Component
// const CardCarousel = ({ onMoodChange, onGenreChange }) => {
//   const [moodIndex, setMoodIndex] = useState(0);
//   const [genreIndex, setGenreIndex] = useState(0);

//   const colors = Object.entries(data);
//   const genres = Object.entries(topMusicGenres);

//   useEffect(() => {
//     onMoodChange(colors[moodIndex][0]);
//   }, [moodIndex, onMoodChange]);

//   useEffect(() => {
//     onGenreChange(genres[genreIndex][0]);
//   }, [genreIndex, onGenreChange]);

//   const nextMood = () => {
//     setMoodIndex((prev) => (prev + 1) % colors.length);
//   };

//   const prevMood = () => {
//     setMoodIndex((prev) => (prev - 1 + colors.length) % colors.length);
//   };

//   const nextGenre = () => {
//     setGenreIndex((prev) => (prev + 1) % genres.length);
//   };

//   const prevGenre = () => {
//     setGenreIndex((prev) => (prev - 1 + genres.length) % genres.length);
//   };

//   return (
//     <div 
//       className="max-w-[430px] w-full min-h-screen mx-auto space-y-8 py-6 pt-12 relative overflow-hidden transition-all duration-1000" 
//       style={{ background: colors[moodIndex][1].color }}
//     >
//       {/* Background decorative elements */}
//       <div className="w-full min-h-screen h-full absolute pointer-events-none">
//         {[...Array(10)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute text-4xl opacity-20 animate-pulse"
//             style={{
//               top: `${Math.random() * 80}%`,
//               left: `${Math.random() * 80}%`,
//               transform: `rotate(${Math.random() * 360}deg)`,
//               animationDelay: `${Math.random() * 2}s`
//             }}
//           >
//             {genres[genreIndex][1].image}
//           </div>
//         ))}
//       </div>

//       <h1 className="relative text-white text-3xl text-center font-bold z-10 drop-shadow-lg">
//         SELECT YOUR MOOD
//       </h1>

//       {/* Mood Card */}
//       <div className="relative z-10 flex items-center justify-center">
//         <button 
//           onClick={prevMood}
//           className="absolute left-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
//         >
//           ←
//         </button>
        
//         <div className="w-[280px] h-[350px] rounded-3xl relative border-4 border-white shadow-2xl overflow-hidden bg-white/10 backdrop-blur-sm">
//           <h2 className="absolute top-6 left-1/2 transform -translate-x-1/2 text-white font-bold text-2xl z-10 drop-shadow-lg">
//             {colors[moodIndex][0].toUpperCase()}
//           </h2>
//           <img
//             src={colors[moodIndex][1].image}
//             alt={colors[moodIndex][0]}
//             className="w-full h-full object-cover rounded-2xl"
//           />
//         </div>

//         <button 
//           onClick={nextMood}
//           className="absolute right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
//         >
//           →
//         </button>
//       </div>

//       {/* Genre Selection */}
//       <div className="relative z-10 px-8">
//         <h2 className="text-white text-xl text-center font-bold mb-4 drop-shadow-lg">
//           PICK A GENRE
//         </h2>
        
//         <div className="flex items-center justify-center">
//           <button 
//             onClick={prevGenre}
//             className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-all mr-4"
//           >
//             ←
//           </button>
          
//           <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-white/30 min-w-[150px] text-center">
//             <span className="text-white font-bold text-lg">
//               {genres[genreIndex][1].image} {genres[genreIndex][0]}
//             </span>
//           </div>

//           <button 
//             onClick={nextGenre}
//             className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-all ml-4"
//           >
//             →
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Song Card Component
// const SongCard = ({ song, onFavoriteToggle, isFavorite = false }) => {
//   const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);

//   const handleSpotifyClick = () => {
//     if (song.spotifyUrl) {
//       window.open(song.spotifyUrl, '_blank');
//     }
//   };

//   const handleFavoriteClick = () => {
//     onFavoriteToggle(song.songId, 'song');
//   };

//   return (
//     <div className="p-4 border rounded-lg my-2 flex gap-3 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
//       {song?.albumCover ? (
//         <img
//           src={song.albumCover}
//           alt={song?.songName || "Song"}
//           width={60}
//           height={60}
//           className="rounded-md object-cover"
//         />
//       ) : (
//         <div className="w-15 h-15 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
//           No Image
//         </div>
//       )}
      
//       <div className="flex-1">
//         <p className="font-semibold text-gray-900">
//           {song?.songName || "Unknown Song"}
//         </p>
//         <p className="text-sm text-gray-600">
//           {song?.artistName || "Unknown Artist"}
//         </p>
//         <p className="text-xs text-gray-500">
//           {song?.albumName || "Unknown Album"}
//         </p>
        
//         {showYouTubePlayer && song.youtubeData && (
//           <div className="mt-3">
//             <iframe
//               width="100%"
//               height="200"
//               src={`https://www.youtube.com/embed/${song.youtubeData.videoId}`}
//               title={song.youtubeData.title}
//               frameBorder="0"
//               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//               allowFullScreen
//               className="rounded-md"
//             />
//           </div>
//         )}
//       </div>
      
//       <div className="flex gap-2 items-center">
//         <button
//           onClick={handleFavoriteClick}
//           className={`p-2 rounded-full ${
//             isFavorite 
//               ? 'text-red-500 bg-red-50' 
//               : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
//           } transition-all`}
//           title="Add to favorites"
//         >
//           <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
//         </button>

//         <button
//           onClick={handleSpotifyClick}
//           className="p-2 rounded-full text-green-500 hover:text-green-600 hover:bg-green-50 transition-all"
//           title="Open in Spotify"
//         >
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//             <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
//           </svg>
//         </button>

//         {song.youtubeData && (
//           <button
//             onClick={() => setShowYouTubePlayer(!showYouTubePlayer)}
//             className="p-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
//             title={showYouTubePlayer ? 'Hide YouTube Player' : 'Show YouTube Player'}
//           >
//             <Play size={18} />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// // Album Card Component
// const AlbumCard = ({ album, onFavoriteToggle, isFavorite = false }) => {
//   const handleSpotifyClick = () => {
//     if (album.spotifyUrl) {
//       window.open(album.spotifyUrl, '_blank');
//     }
//   };

//   const handleFavoriteClick = () => {
//     onFavoriteToggle(album.albumId, 'album');
//   };

//   return (
//     <div className="p-4 border rounded-lg my-2 flex gap-3 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
//       {album?.albumCover ? (
//         <img
//           src={album.albumCover}
//           alt={album?.albumName || "Album"}
//           width={60}
//           height={60}
//           className="rounded-md object-cover"
//         />
//       ) : (
//         <div className="w-15 h-15 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
//           No Image
//         </div>
//       )}
      
//       <div className="flex-1">
//         <p className="font-semibold text-gray-900">
//           {album?.albumName || "Unknown Album"}
//         </p>
//         <p className="text-sm text-gray-600">
//           {album?.artistName || "Unknown Artist"}
//         </p>
//         {album?.releaseDate && (
//           <p className="text-xs text-gray-500">
//             {new Date(album.releaseDate).getFullYear()}
//           </p>
//         )}
//       </div>
      
//       <div className="flex gap-2 items-center">
//         <button
//           onClick={handleFavoriteClick}
//           className={`p-2 rounded-full ${
//             isFavorite 
//               ? 'text-red-500 bg-red-50' 
//               : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
//           } transition-all`}
//           title="Add to favorites"
//         >
//           <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
//         </button>

//         <button
//           onClick={handleSpotifyClick}
//           className="p-2 rounded-full text-green-500 hover:text-green-600 hover:bg-green-50 transition-all"
//           title="Open in Spotify"
//         >
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//             <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
//           </svg>
//         </button>
//       </div>
//     </div>
//   );
// };

// // Main Component
// export default function CombinedMusicApp() {
//   const [selectedMood, setSelectedMood] = useState("");
//   const [selectedGenre, setSelectedGenre] = useState("");
//   const [songs, setSongs] = useState<Song[]>([]);
//   const [albums, setAlbums] = useState<Album[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [showResults, setShowResults] = useState(false);
//   const [favorites, setFavorites] = useState(new Set());

//   const handleSubmit = async () => {
//     if (!selectedMood) {
//       alert("Please select a mood");
//       return;
//     }

//     try {
//       setLoading(true);
//       setShowResults(false);

//       const res = await mockApi.get("/recommendations", {
//         params: {
//           mood: selectedMood,
//           genre: selectedGenre,
//         },
//       });

//       setSongs(res.data.songs || []);
//       setAlbums(res.data.albums || []);
//       setShowResults(true);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       alert("Failed to fetch suggestions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFavoriteToggle = (itemId, itemType) => {
//     const newFavorites = new Set(favorites);
//     if (newFavorites.has(itemId)) {
//       newFavorites.delete(itemId);
//     } else {
//       newFavorites.add(itemId);
//     }
//     setFavorites(newFavorites);
//     console.log(`${itemType} ${itemId} ${newFavorites.has(itemId) ? 'added to' : 'removed from'} favorites`);
//   };

//   const handleBackToSelection = () => {
//     setShowResults(false);
//     setSongs([]);
//     setAlbums([]);
//   };

//   if (showResults) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="max-w-2xl mx-auto p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h1 className="text-3xl font-bold text-gray-900">Your Music Recommendations</h1>
//             <button
//               onClick={handleBackToSelection}
//               className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
//             >
//               ← Back
//             </button>
//           </div>
          
//           <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
//             <p className="text-gray-600">
//               <span className="font-semibold">Mood:</span> {selectedMood} | 
//               <span className="font-semibold"> Genre:</span> {selectedGenre || 'Any'}
//             </p>
//           </div>

//           {(songs.length > 0 || albums.length > 0) && (
//             <div className="space-y-8">
//               {songs.length > 0 && (
//                 <div>
//                   <h2 className="text-2xl font-bold mb-4 text-gray-900">Songs</h2>
//                   <div className="space-y-2">
//                     {songs
//                       .filter((song) => song && typeof song === "object")
//                       .map((song, i) => (
//                         <SongCard
//                           key={song.songId || i}
//                           song={song}
//                           onFavoriteToggle={handleFavoriteToggle}
//                           isFavorite={favorites.has(song.songId)}
//                         />
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {albums.length > 0 && (
//                 <div>
//                   <h2 className="text-2xl font-bold mb-4 text-gray-900">Albums</h2>
//                   <div className="space-y-2">
//                     {albums
//                       .filter((album) => album && typeof album === "object")
//                       .map((album, i) => (
//                         <AlbumCard
//                           key={album.albumId || i}
//                           album={album}
//                           onFavoriteToggle={handleFavoriteToggle}
//                           isFavorite={favorites.has(album.albumId)}
//                         />
//                       ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {songs.length === 0 && albums.length === 0 && (
//             <div className="text-center py-12">
//               <p className="text-gray-500 text-lg">No recommendations found. Try a different mood or genre!</p>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <CardCarousel 
//         onMoodChange={setSelectedMood}
//         onGenreChange={setSelectedGenre}
//       />
      
//       <div className="max-w-[430px] mx-auto px-6 pb-8 relative z-10">
//         <button
//           onClick={handleSubmit}
//           disabled={loading || !selectedMood}
//           className={`w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-300 ${
//             loading || !selectedMood
//               ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
//               : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
//           }`}
//         >
//           {loading ? (
//             <span className="flex items-center justify-center gap-2">
//               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//               Generating...
//             </span>
//           ) : (
//             'Generate Music'
//           )}
//         </button>
        
//         {selectedMood && (
//           <p className="text-center text-gray-600 mt-4">
//             Selected: <span className="font-semibold">{selectedMood}</span>
//             {selectedGenre && <span> • {selectedGenre}</span>}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }