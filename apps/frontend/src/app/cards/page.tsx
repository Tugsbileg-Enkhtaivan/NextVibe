"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

import Image from "next/image";

const images = [
    "/assets/angry.png",
    "/assets/bored.png",
    "/assets/calm.png",
    "/assets/devil.png",
    "/assets/happy.png",
];

export default function CardCarousel() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="w-full max-w-sm mx-auto py-10">
                <Swiper
                    effect="cards"
                    grabCursor={true}
                    pagination={{ clickable: true }}
                    modules={[EffectCards, Pagination]}
                    className="mySwiper"
                >
                    {images.map((src, index) => (
                        <SwiperSlide key={index} className="flex items-center justify-center bg-transparent">
                            <Image
                                src={src}
                                alt={`Slide ${index + 1}`}
                                width={300}
                                height={400}
                                className="rounded-xl object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </main>
    );
}