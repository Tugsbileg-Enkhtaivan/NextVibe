"use client"

import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type Mood = 'happy' | 'sad' | 'energetic' | 'calm' | 'angry' | 'romantic' | 'focused' | 'chill' | 'melancholic' | 'neutral' | 'very_happy' | 'devil' | 'bored';

interface MoodData {
    date: string; // ISO format, e.g. "2022-05-20"
    mood: Mood;
}

const moodFaces: Record<Mood, string> = {
    happy: '/assets/happy.png',
    angry: '/assets/angry.png',
    melancholic: '/assets/crying.png',
    very_happy: '/assets/gold-star.png',
    energetic: '/assets/energetic.png',
    calm: '/assets/calm.png',
    romantic: '/assets/romantic.png',
    focused: '/assets/focused.png',
    chill: '/assets/chill.png',
    sad: '/assets/sad.png',
    neutral: '/assets/neutral.png',
    devil: '/assets/devil.png',
    bored: '/assets/bored.png'
};

const MoodCalendar: React.FC = () => {
    const [moodData, setMoodData] = useState<MoodData[]>([]);

    //   useEffect(() => {
    //     // Replace with your actual backend call
    //     fetch(`${BASE_URL}/`)
    //       .then(res => res.json())
    //       .then(data => setMoodData(data));
    //   }, []);


    const data = [
        { "date": "2025-04-01", "mood": "neutral" },
        { "date": "2025-04-02", "mood": "happy" },
        { "date": "2025-04-20", "mood": "very_happy" },
        { "date": "2025-04-30", "mood": "sad" }
    ]

    useEffect(() => {
        setMoodData(data as MoodData[])
    }, [])

    const getMoodForDate = (date: Date): MoodData | undefined => {
        const iso = date.toISOString().split('T')[0];
        return moodData.find(m => m.date === iso);
    };


    return (
        <div className='w-full'>
            <Calendar className="mx-auto p-2 rounded-2xl bg-black"
                onClickDay={(value, event) => alert(value.toDateString())}
                tileClassName=""
                tileContent={({ date, view }) => {
                    if (view !== 'month') return null;
                    const moodEntry = getMoodForDate(date);
                    return (<div className="flex justify-center">
                        {
                            moodEntry && <div className="w-8 h-8 text-center mt-2"><img src={`${moodFaces[moodEntry.mood]}`} /></div>
                        }
                        {
                            !moodEntry && <div className="w-8 h-8 mt-2 border border-dashed rounded-full"></div>
                        }
                    </div>)
                }}
            />
        </div>
    );
};

export default MoodCalendar;
