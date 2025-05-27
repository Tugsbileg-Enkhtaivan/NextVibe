"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

import Image from "next/image";
import FlipSwiper from "../components/FlipSwiper";

const data: Record<string, string> = {
    anger: "/assets/anger.webp",
    joy: "/assets/joy.webp",
    envy: "/assets/envy.webp",
    fear: "/assets/fear.webp",
    sadness: "/assets/sadness.webp",
    ennui: "/assets/ennui.webp",
    disgust: "/assets/disgust.webp",
    shame: "/assets/embarrassment.webp",
    anxiety: "/assets/anxiety.webp",
}

export default function CardCarousel() {

    const handleMoodClick = (index: number) => {
        console.log(index)
    }
    return (
        <div className="w-full min-h-screen mx-auto space-y-6 bg-black py-6">
            <Swiper
                effect="cards"
                loop={true}
                grabCursor={true}
                pagination={{ clickable: true }}
                modules={[EffectCards, Pagination]}
                className="w-[200px] h-[300px]"
            >
                {Object.entries(data).map(([key, value], index) => (
                    <SwiperSlide key={index}
                        onClick={() => handleMoodClick(index)} className="flex items-center justify-center w-[90%] relative">
                        <h1 className="absolute top-7 left-1/2 -translate-1/2 text-white font-bold text-3xl">{key[0].toUpperCase() + key.slice(1).toUpperCase()}</h1>
                        <Image
                            src={data[key]}
                            alt={`Slide ${index + 1}`}
                            width={350}
                            height={400}
                            className="rounded-xl object-cover mx-auto"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            <FlipSwiper />
        </div>
    );
}