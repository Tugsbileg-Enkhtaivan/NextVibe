'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFlip, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-flip';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import React from 'react';

interface ChildProps {
    setGenreIndex: React.Dispatch<React.SetStateAction<number>>;
}

type EmotionData = {
    image: string;
    color: string;
};

const topMusicGenres: Record<string, EmotionData> = {
    Pop: {
        color: "bg-red-300",
        image: "/assets/pop-sticker-icon.webp"
    },
    Rock: {
        color: "bg-orange-500",
        image: "/assets/finger-icon.webp"
    },
    HipHop: {
        color: "bg-orange-700",
        image: "/assets/orange-hat-icon.webp"
    },
    Electronic: {
        color: "bg-violet-500",
        image: "/assets/headset-icon.webp"
    },
    Soul: {
        color: "bg-amber-400",
        image: "/assets/heart-icon.webp"
    },
    Country: {
        color: "bg-amber-600",
        image: "/assets/guitar-icon.webp"
    },
    Jazz: {
        color: "bg-teal-600",
        image: "/assets/buree-icon.webp"
    },
    Classical: {
        color: "bg-red-900",
        image: "/assets/vionyl-icon.webp"
    },
    Reggae: {
        color: "bg-green-700",
        image: "/assets/reggie-icon.webp"
    },
    Blues: {
        color: "bg-sky-600",
        image: "/assets/blues-icon.webp"
    },
};

const FlipSwiperGenre: React.FC<ChildProps> = ({ setGenreIndex }: ChildProps) => {

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
                setGenreIndex(swiper.activeIndex)
            }}
            className="transition-all duration-700 ease-in-out transform"
        >
            {Object.entries(topMusicGenres).map(([key, value]) => {
                return (
                    <SwiperSlide key={key}>
                        <div className={`w-[80%] h-25 mx-auto text-white text-xl font-bold rounded-xl text-center flex gap-3 items-center justify-center border-4 border-white ${value.color}`}>
                            <img className='w-15' src={value.image} />
                            <h1 className='text-4xl'>{key.toUpperCase()}</h1>
                        </div>

                    </SwiperSlide>
                )
            })}
        </Swiper>
    );
};

export default FlipSwiperGenre;