"use client"; // if using Next.js App Router

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

import Image from "next/image";

const images = [
  "/assets/image.png",
  "/assets/image.png",
  "/assets/image.png",
  "/assets/image.png",
];

export default function ThreeDCarousel() {
  return (
    <div className="w-full max-w-xl mx-auto py-10">
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={true}
        modules={[EffectCoverflow, Pagination]}
        className="mySwiper"
      >
        {images.map((src, index) => (
          <SwiperSlide key={index} className="w-[300px] h-[300px]">
            <Image
              src={src}
              alt={`Slide ${index + 1}`}
              width={300}
              height={300}
              className="rounded-xl object-cover mx-auto"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
