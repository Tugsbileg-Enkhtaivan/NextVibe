"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCoverflow,
  Pagination,
  Autoplay,
  Navigation,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react"; // optional icons

const images = [
  "/assets/image.png",
  "/assets/image.png",
  "/assets/image.png",
  "/assets/image.png",
];

export default function ThreeDCarousel() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <div className="w-full max-w-5xl mx-auto py-10 relative">
      {/* Custom Navigation Buttons */}
      <button ref={prevRef} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow">
        <ChevronLeft />
      </button>
      <button ref={nextRef} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow">
        <ChevronRight />
      </button>

      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        loop={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // Fix navigation bug
          if (swiper.params.navigation) {
            (swiper.params.navigation as any).prevEl = prevRef.current;
            (swiper.params.navigation as any).nextEl = nextRef.current;
          }
        }}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: "auto" },
        }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Pagination, Autoplay, Navigation]}
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
