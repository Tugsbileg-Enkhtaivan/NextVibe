"use client";

import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

import Image from "next/image";
import FlipSwiper from "../components/FlipSwiper";
import { url } from "inspector";
import { useEffect, useRef, useState } from "react";

type EmotionData = {
    image: string;
    color: string;
};

const data: Record<string, EmotionData> = {
    anger: {
        image: "/assets/anger.webp",
        color: "linear-gradient(135deg, #F44336 0%, #D32F2F 50%, #B71C1C 100%)",
    },
    joy: {
        image: "/assets/joy.webp",
        color: "linear-gradient(135deg, #FFEB3B 0%, #FFC107 50%, #FF8F00 100%)",
    },
    envy: {
        image: "/assets/envy.webp",
        color: "linear-gradient(135deg, #00E5CC 0%, #00BFA5 50%, #004D40 100%)",
    },
    fear: {
        image: "/assets/fear.webp",
        color: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #4A148C 100%)",
    },
    sadness: {
        image: "/assets/sadness.webp",
        color: "linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #0D47A1 100%)",
    },
    ennui: {
        image: "/assets/ennui.webp",
        color: "linear-gradient(135deg, #5C6BC0 0%, #3F51B5 50%, #1A237E 100%)",
    },
    disgust: {
        image: "/assets/disgust.webp",
        color: "linear-gradient(135deg, #8BC34A 0%, #689F38 50%, #33691E 100%)",
    },
    shame: {
        image: "/assets/embarrassment.webp",
        color: "linear-gradient(135deg, #FF69B4 0%, #E91E63 50%, #880E4F 100%)",
    },
    anxiety: {
        image: "/assets/anxiety.webp",
        color: "linear-gradient(135deg, #FF8C42 0%, #FF6B1A 50%, #E55100 100%)",
    },
};


export default function CardCarousel() {
    const swiperRef = useRef<SwiperClass | null>(null);
    const [index, setIndex] = useState(0);


    const colors = Object.entries(data)
    // console.log(colors[index][1].color)


    const handleMoodClick = (index: number) => {
        // console.log(index)
    };
    return (
        <div className="max-w-[430px] w-full min-h-screen mx-auto space-y-6 bg-black py-6 bg-center bg-cover" style={{ backgroundImage: `${colors[index][1].color}` }}>
            <Swiper
                effect="cards"
                loop={true}
                grabCursor={true}
                pagination={{ clickable: true }}
                modules={[EffectCards, Pagination]}
                className="w-[250px] h-[350px]"
                // onSlideChange={(swiper) => {
                //     console.log('Current index:', swiper.activeIndex);
                // }}
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;

                    // ✅ Register event listener for activeIndexChange
                    swiper.on("activeIndexChange", () => {
                        // console.log("Active index changed to:", swiper.realIndex);
                        setIndex(swiper.realIndex);
                    });
                }}
            >
                {Object.entries(data).map(([key, value], index) => (
                    <SwiperSlide key={index}
                        onClick={() => handleMoodClick(index)} className="flex items-center justify-center w-[400px] h-[400px] rounded-3xl relative border-4 border-white">
                        <h1 className="absolute top-7 left-1/2 -translate-1/2 text-white font-bold text-3xl">{key[0].toUpperCase() + key.slice(1).toUpperCase()}</h1>
                        <Image
                            src={value.image}
                            alt={`Slide ${index + 1}`}
                            width={350}
                            height={400}
                            className="rounded-xl object-cover object-center mx-auto"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            <FlipSwiper />
        </div>
    );
}