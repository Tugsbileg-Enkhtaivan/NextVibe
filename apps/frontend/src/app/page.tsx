'use client';

import { useState } from 'react';
import SelectableGroup from '../../_components/SelectableGroup';
import api from './lib/axios';
import ThemeToggle from '../../_components/ThemeToggle';

const moods = ['Happy', 'Sad', 'Calm', 'Angry'];
const genres = ['Lo-fi', 'Rock', 'Jazz', 'Ambient', 'Hip Hop', 'EMD', 'R&B'];

export default function HomePage() {
  const [mood, setMood] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!mood) return alert('Please select a mood');
    try {
      setLoading(true);
      const res = await api.get('/api/ai-song-search', { params: { mood, genre } });
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
    <main className="relative max-w-3xl mx-auto px-6 py-12 min-h-screen flex flex-col gap-10">

      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Select your mood</h1>
        <SelectableGroup options={moods} selected={mood} onSelect={setMood} />

        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Pick a genre (optional)</h2>
        <SelectableGroup options={genres} selected={genre} onSelect={setGenre} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition"
      >
        {loading ? 'Finding...' : 'Find My Vibe'}
      </button>

      {(songs.length > 0 || albums.length > 0) && (
        <div className="mt-10 space-y-10">
          {songs.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Songs</h2>
              <div className="flex flex-col gap-4">
                {songs.map((song, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800"
                  >
                    <img
                      src={song.albumCover}
                      alt={song.songName}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {song.songName} - {song.artistName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{song.albumName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {albums.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Albums</h2>
              <div className="flex flex-col gap-4">
                {albums.map((album, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800"
                  >
                    <img
                      src={album.albumCover}
                      alt={album.albumName}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                      {album.albumName} - {album.artistName}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
