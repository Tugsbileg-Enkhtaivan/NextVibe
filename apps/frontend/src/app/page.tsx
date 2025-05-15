'use client';

import { useState } from 'react';
import SelectableGroup from '../../_components/SelectableGroup';
import api from './lib/axios';

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

      const res = await api.get('/api/ai-song-search', {
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

  // const handleFavoriteSong = async (song) => {
  //   try {
  //     await api.post("/api/favorites/song", {
  //       ...song,
  //       userId: user.id, // Clerk userId
  //     });
  //     alert("Saved to favorites!");
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to save song");
  //   }
  // };
  

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
    </main>
  );
}
