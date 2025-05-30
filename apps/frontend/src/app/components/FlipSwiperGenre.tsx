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
    generateStart: boolean;
}

type EmotionData = {
    image: string;
    color: string;
};

const topMusicGenres: Record<string, EmotionData> = {
    Pop: {
        color: "bg-red-300",
        image: "/assets/pop-sticker.png"
    },
    Rock: {
        color: "bg-orange-500",
        image: "/assets/finger.png"
    },
    HipHop: {
        color: "bg-orange-700",
        image: "/assets/orange-hat.png"
    },
    Electronic: {
        color: "bg-violet-500",
        image: "/assets/headset.png"
    },
    Soul: {
        color: "bg-amber-400",
        image: "/assets/heart.png"
    },
    Country: {
        color: "bg-amber-600",
        image: "/assets/guitar.png"
    },
    Jazz: {
        color: "bg-teal-600",
        image: "/assets/buree.png"
    },
    Classical: {
        color: "bg-red-900",
        image: "/assets/vionyl.png"
    },
    Reggae: {
        color: "bg-green-700",
        image: "/assets/reggie.png"
    },
    Blues: {
        color: "bg-sky-600",
        image: "/assets/blues.png"
    },
};


const FlipSwiperGenre: React.FC<ChildProps> = ({ setGenreIndex, generateStart }: ChildProps) => {





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
            className={`
                transition-all duration-700 ease-in-out transform
                ${generateStart ? "opacity-0 -translate-y-10 scale-95 pointer-events-none" : "opacity-100 translate-y-0 scale-100"}
              `}
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