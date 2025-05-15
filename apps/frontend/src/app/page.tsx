"use client";

import { useState } from "react";

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");

  const moods = [
    { id: "happy", label: "Happy" },
    { id: "sad", label: "Sad" },
    { id: "angry", label: "Angry" },
    { id: "hungry", label: "Hungry" },
    { id: "excited", label: "Excited" },
    { id: "tired", label: "Tired" },
    { id: "scared", label: "Scared" },
    { id: "confused", label: "Confused" },
    { id: "nervous", label: "Nervous" },
    { id: "lonely", label: "Lonely" },
  ];

  const genres = [
    "Pop", "Rock", "Hip-hop", "Rap", "R&B", "Jazz", "Blues", "Classical", "EDM", "House",
    "Techno", "Reggae", "Country", "Metal", "Punk", "Folk", "Soul", "Funk", "K-pop", "Latin"
  ];

  const toggleSelectMoods = (moodId: string) => {
    if (selectedMood.includes(moodId)) {
      setSelectedMood(selectedMood.filter(id => id !== moodId));
    } else {
      setSelectedMood([...selectedMood, moodId]);
    }
  };

  const handleGenreClick = (genreText: string) => {
    setSelectedGenre(genreText === selectedGenre ? "" : genreText);
  };

  return (
    <section className="w-full min-h-screen py-10">
      <div className="w-2/3 mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Та mood-ээ сонгоно уу...</h1>
        <p className="mb-4">Сонгосон mood-н тоо: {selectedMood.length}</p>

        <div className="grid grid-cols-5 gap-2">
          {moods.map((mood) => {
            const isSelected = selectedMood.includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => toggleSelectMoods(mood.id)}
                className={`
                  py-2 px-4 rounded font-medium transition-colors duration-200
                  ${isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                `}
              >
                {mood.label}
              </button>
            );
          })}
        </div>

        {selectedMood.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Сонгосон mood:</h2>
            <div className="flex flex-wrap gap-2">
              {selectedMood
                .slice()
                .sort()
                .map((id) => {
                  const mood = moods.find((m) => m.id === id);
                  return (
                    <span key={id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {mood?.label || id}
                    </span>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <div className="w-2/3 mx-auto mt-10">
        <h6 className="text-center font-semibold text-2xl">Та genre-aa сонгоно уу...</h6>

        <div className="grid grid-cols-5 gap-2 mt-5 [&>*]:py-2 [&>*]:px-4 [&>*]:cursor-pointer [&>*]:rounded [&>*]:font-medium [&>*]:transition-colors [&>*]:duration-200">
          {genres.map((genre) => (
            <div
              key={genre}
              onClick={() => handleGenreClick(genre.toLowerCase())}
              className={`${selectedGenre === genre.toLowerCase()
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
            >
              {genre}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}