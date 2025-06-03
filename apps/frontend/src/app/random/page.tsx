"use client";

import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/axios';

type Result = {
    mood: string,
    genre: string
}

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

export default function SlotMachine() {
    // Define our reels
    const moods = [
        "Happy", "Sad", "Energetic", "Calm", 'Angry', 'Romantic', 'Focused', 'Chill', 'Melancholic', 'Very happy'
    ];

    const genres = [
        "Rock",
        "Hip Hop / Rap",
        "Jazz",
        "Classical",
        "Pop",
        "Electronic / EDM",
        "Country",
        "Reggae",
        "Blues",
        "R&B / Soul"
    ]


    // State variables
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [moodIndex, setMoodIndex] = useState(0);
    const [genreIndex, setGenreIndex] = useState(0);
    const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const spinCountRef = useRef(0);
    const [mood, setMood] = useState<string | null>(null);
    const [genre, setGenre] = useState<string | null>(null);
    const [songs, setSongs] = useState<any[]>([]);
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Function to animate the spinning reels
    const animateSpin = () => {
        // Randomly change indices during animation
        setMoodIndex(prevIndex => (prevIndex + 1) % moods.length);
        setGenreIndex(prevIndex => (prevIndex + 1) % genres.length);

        spinCountRef.current += 1;

        // Gradually slow down and eventually stop
        const nextDelay = Math.min(200, 50 + spinCountRef.current * 3);

        if (nextDelay < 200) {
            spinTimerRef.current = setTimeout(animateSpin, nextDelay);
        } else {
            // Stop spinning and set final result
            setSpinning(false);
            const finalMood = moods[moodIndex];
            const finalGenre = genres[genreIndex];
            setResult({ mood: finalMood, genre: finalGenre });
        }
    };

    // Function to start spinning
    const spin = () => {
        if (spinning) return;

        // Reset and start spinning
        setSpinning(true);
        setResult(null);
        spinCountRef.current = 0;

        // Clear any existing timer
        if (spinTimerRef.current) {
            clearTimeout(spinTimerRef.current);
        }

        // Start animation
        spinTimerRef.current = setTimeout(animateSpin, 50);
    };

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (spinTimerRef.current) {
                clearTimeout(spinTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setGenre(result?.genre as string);
        setMood(result?.mood as string)
    }, [result]);

    const getData = async () => {
        try {
            // setLoading(true);

            const res = await api.get<RecommendationsResponse>('/recommendations', {
                params: {
                    mood,
                    genre,
                },
            });

            setSongs(res.data.songs || []);
            setAlbums(res.data.albums || []);
            console.log(res.data.songs, "jklajsd")

        } catch (err) {
            console.error('Fetch error:', err);
            // alert('Failed to fetch suggestions');
        }
        // finally {
        //     setLoading(false);
        // }
    };
    useEffect(() => {
        getData()
    }, [mood])


    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-yellow-300">Mood & Genre Slot Machine</h1>

            {/* Slot machine display */}
            <div className="flex justify-center mb-6 w-full">
                <div className="w-1/2 px-2 flex flex-col items-center">
                    <div className="bg-gray-700 p-1 rounded-t-lg w-full">
                        <h2 className="text-center font-bold text-yellow-300">MOOD</h2>
                    </div>
                    <div className="h-24 w-full bg-white border-4 border-gray-600 flex items-center justify-center overflow-hidden rounded-b-lg">
                        <div className="text-2xl font-bold text-purple-700">{moods[moodIndex]}</div>
                    </div>
                </div>

                <div className="w-1/2 px-2 flex flex-col items-center">
                    <div className="bg-gray-700 p-1 rounded-t-lg w-full">
                        <h2 className="text-center font-bold text-yellow-300">GENRE</h2>
                    </div>
                    <div className="h-24 w-full bg-white border-4 border-gray-600 flex items-center justify-center overflow-hidden rounded-b-lg">
                        <div className="text-2xl font-bold text-purple-700">{genres[genreIndex]}</div>
                    </div>
                </div>
            </div>

            {/* Spin button and lever */}
            <div className="w-full flex justify-center items-center mb-6">
                <div className="relative">
                    <button
                        onClick={spin}
                        disabled={spinning}
                        className={`
              bg-gradient-to-b from-red-500 to-red-700 
              hover:from-red-400 hover:to-red-600
              text-white font-bold py-3 px-8 rounded-full 
              shadow-lg transform transition-transform 
              ${spinning ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}
            `}
                    >
                        {spinning ? 'SPINNING...' : 'SPIN!'}
                    </button>
                </div>
            </div>

            {/* Result message */}
            {/* {result && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg text-center">
                    <p className="text-lg text-yellow-300 font-semibold mb-2">Your combination is:</p>
                    <p className="text-2xl text-white font-bold">
                        {result.mood} {result.genre}
                    </p>
                    <p className="mt-4 text-gray-300 italic">
                        What will you create with this combination?
                    </p>
                </div>
            )} */}

            {result && (
                <div className="mt-10 space-y-6 text-white">
                    {songs.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-2">Songs</h2>
                            {songs.map((song, i) => (
                                <div key={i} className="p-2 border rounded my-1 flex gap-2 items-center">
                                    <img src={song.albumCover} alt={song.songName} width={60} />
                                    <div>
                                        <p>{song.songName} - {song.artistName}</p>
                                        <p className="text-sm text-gray-500">{song.albumName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {albums.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-2">Albums</h2>
                            {albums.map((album, i) => (
                                <div key={i} className="p-2 border rounded my-1 flex gap-2 items-center">
                                    <img src={album.albumCover} alt={album.albumName} width={60} />
                                    <p>{album.albumName} - {album.artistName}</p>
                                    {/* <button onClick={() => handleFavoriteSong(song)}>❤️ Save</button> */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}