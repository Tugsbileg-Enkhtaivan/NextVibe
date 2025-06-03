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
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)

    //   useEffect(() => {
    //     // Replace with your actual backend call
    //     fetch(`${BASE_URL}/`)
    //       .then(res => res.json())
    //       .then(data => setMoodData(data));
    //   }, []);


    const data = [
        { "date": "2025-04-01", "mood": "focused" },
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

    // const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date }) => {
        const handleActiveStartDateChange = ({ activeStartDate }) => {
        console.log(activeStartDate, "active")
        const month = activeStartDate.getMonth(); // 0 = January, 11 = December
        setCurrentMonth(month + 1); 
    };

    console.log(currentMonth, "month")

    const obj: Record<string, string> = {
        1: "/assets/1.webp",
        2: "/assets/2.webp",
        3: "/assets/3.webp",
        4: "/assets/4.webp",
        5: "/assets/5.webp",
        6: "/assets/6.webp",
        7: "/assets/7.webp",
        8: "/assets/8.webp",
        9: "/assets/9.webp",
        10: "/assets/10.webp",
        11: "/assets/11.webp",
        12: "/assets/12.webp",
    }
    console.log(currentMonth, typeof currentMonth)
    return (
        <div className='w-full z-10 mt-10 pt-10' style={{ background: "linear-gradient(135deg, #FFD54F 0%, #FFB300 50%, #FF6F00 100%)" }} >
            <img src={`${obj[currentMonth]}`} />
            <Calendar className="mx-auto p-2 rounded-2xl bg-black"
                onActiveStartDateChange={handleActiveStartDateChange}
                // onClickDay={(value, event) => alert(value.toDateString())}
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
