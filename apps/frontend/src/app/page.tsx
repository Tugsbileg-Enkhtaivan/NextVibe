'use client';

import { useState } from 'react';
import SelectableGroup from '../../_components/SelectableGroup';
import api from './lib/axios';

// Define types for the API response
interface Song {
  songName?: string;
  artistName?: string;
  albumName?: string;
  albumCover?: string | null;
}

interface Album {
  albumName?: string;
  artistName?: string;
  albumCover?: string | null;
}

interface RecommendationsResponse {
  songs?: Song[];
  albums?: Album[];
}

const moods = ['Happy', 'Sad', 'Calm', 'Angry'];
const genres = ['Lo-fi', 'Rock', 'Jazz', 'Ambient', 'Hip Hop', 'EMD', 'R&B'];

export default function HomePage() {
  const [mood, setMood] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!mood) return alert('Please select a mood');

    try {
      setLoading(true);

      const res = await api.get<RecommendationsResponse>('/recommendations', {
        params: {
          mood,
          genre,
        },
      });

      setSongs(res.data.songs || []);
      setAlbums(res.data.albums || []);

    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Select your mood</h1>
      <SelectableGroup options={moods} selected={mood} onSelect={setMood} />

      <h2 className="text-xl font-semibold mt-6">Pick a genre (optional)</h2>
      <SelectableGroup options={genres} selected={genre} onSelect={setGenre} />

      <button
        onClick={handleSubmit}
        className="mt-8 bg-blue-600 text-white px-6 py-2 rounded-full"
        disabled={loading}
      >
        {loading ? 'Finding...' : 'Find My Vibe'}
      </button>

      {(songs.length > 0 || albums.length > 0) && (
        <div className="mt-10 space-y-6">
          {songs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-2">Songs</h2>
              {songs
                .filter(song => song && typeof song === 'object')
                .map((song, i) => (
                <div key={i} className="p-2 border rounded my-1 flex gap-2 items-center">
                  {song?.albumCover ? (
                    <img src={song.albumCover} alt={song?.songName || 'Song'} width={60} className="rounded" />
                  ) : (
                    <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                      No Image
                    </div>
                  )}
                  <div>
                    <p>{song?.songName || 'Unknown Song'} - {song?.artistName || 'Unknown Artist'}</p>
                    <p className="text-sm text-gray-500">{song?.albumName || 'Unknown Album'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {albums.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-2">Albums</h2>
              {albums
                .filter(album => album && typeof album === 'object')
                .map((album, i) => (
                <div key={i} className="p-2 border rounded my-1 flex gap-2 items-center">
                  {album?.albumCover ? (
                    <img src={album.albumCover} alt={album?.albumName || 'Album'} width={60} className="rounded" />
                  ) : (
                    <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                      No Image
                    </div>
                  )}
                  <p>{album?.albumName || 'Unknown Album'} - {album?.artistName || 'Unknown Artist'}</p>
                  {/* <button onClick={() => handleFavoriteSong(song)}>❤️ Save</button> */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}