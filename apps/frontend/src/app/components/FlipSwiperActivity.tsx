'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFlip, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-flip';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import React from 'react';

interface ChildProps {
    setActivityIndex: React.Dispatch<React.SetStateAction<number>>;
}

type EmotionData = {
    image: string;
    color: string;
};

const topActivities: Record<string, EmotionData> = {
    Coding: {
        color: "bg-indigo-600",
        image: "/assets/activity-icon-coding.webp",
    },
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

const FlipSwiperActivity: React.FC<ChildProps> = ({ setActivityIndex }: ChildProps) => {

    // Object.entries(topMusicGenres).map(([key, value]) => console.log(`[${value.color}]`))

    return (
        <Swiper
            effect="flip"
            grabCursor={true}
            // loop={true}
            pagination={{ clickable: true }}
            navigation={false}
            modules={[EffectFlip, Pagination, Navigation]}
            onSlideChange={(swiper) => {
                // console.log('Current index [genre]:', swiper.activeIndex);
                setActivityIndex(swiper.activeIndex)
            }}
            className="transition-all duration-700 ease-in-out transform">
            {Object.entries(topActivities).map(([key, value]) => {
                return (
                    <SwiperSlide key={key}>
                        <div className={`max-w-sm w-[80%] h-25 mx-auto text-white text-xl font-bold rounded-xl text-center flex gap-3 items-center justify-center border-4 border-white ${value.color}`}>
                            <h1 className='text-4xl'>{key.toUpperCase()}</h1>
                            <img className='w-15' src={value.image} />
                        </div>

                    </SwiperSlide>
                )
            })}
        </Swiper>
    );
};

export default FlipSwiperActivity;