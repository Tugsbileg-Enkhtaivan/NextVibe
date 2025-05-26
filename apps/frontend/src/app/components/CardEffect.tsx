"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

import Image from "next/image";

const data: Record<string, string> = {
    angry: "/assets/treee.jpg",
    chill: "/assets/treee.jpg",
    happy: "/assets/treee.jpg",
    neutral: "/assets/treee.jpg"
}

export default function CardCarousel() {
    return (
        <div className="w-full mx-auto">
            <Swiper
                effect="cards"
                grabCursor={true}
                pagination={{ clickable: true }}
                modules={[EffectCards, Pagination]}
                className="w-[200px] h-[300px]"
            >
                {Object.entries(data).map(([key, value], index) => (
                    <SwiperSlide key={index} className="flex items-center justify-center w-[90%] border-dashed border-2">
                        <h1>{key}</h1>
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
        </div>
    );
}
