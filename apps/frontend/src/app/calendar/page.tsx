"use client"

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type Mood = 'happy' | 'sad' | 'energetic' | 'calm' | 'angry' | 'romantic' | 'focused' | 'melancholic' | 'very_happy' | 'devil' | 'bored';

interface MoodData {
    date: string; // ISO format, e.g. "2022-05-20"
    mood: Mood;
}

const moodFaces: Record<Mood, string> = {
    happy: '/assets/happy-calendar.webp',
    angry: '/assets/angry-calendar.webp',
    melancholic: '/assets/crying-calendar.webp',
    very_happy: '/assets/gold-star-calendar.webp',
    energetic: '/assets/energetic-calendar.webp',
    calm: '/assets/calm-calendar.webp',
    romantic: '/assets/romantic-calendar.webp',
    focused: '/assets/focused-calendar.webp',
    sad: '/assets/sad-calendar.webp',
    devil: '/assets/devil-calendar.webp',
    bored: '/assets/bored-calendar.webp'
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

    // const [currentMonth, setCurrentMonth] = useState(null);

    // const handleActiveStartDateChange = ({ activeStartDate }) => {
    //   const month = activeStartDate.getMonth(); // 0 = January, 11 = December
    //   setCurrentMonth({ month: month + 1,}); // +1 to make it human-readable
    // };
  
    // console.log(currentMonth, "month")


    return (
        <div className='w-full z-10 mt-10 pt-10'  style={{background: "linear-gradient(135deg, #FFD54F 0%, #FFB300 50%, #FF6F00 100%)"}} >
            <Calendar className="mx-auto p-2 rounded-2xl bg-black"
            // onActiveStartDateChange={handleActiveStartDateChange}
                onClickDay={(value, event) => alert(value.toDateString())}
                // onActiveStartDateChange={}
                // navigationLabel={({ date, label, locale, view }) => alert(`Current view: ${view}, date: ${date.toLocaleDateString(locale)}`)}
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
