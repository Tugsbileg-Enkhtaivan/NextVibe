'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { Navigation, Pagination, A11y } from 'swiper/modules';

export default function MySwiper() {
  const slides = [
    'Slide 1 content',
    'Slide 2 content',
    'Slide 3 content',
    'Slide 4 content',
  ];

  return (
    <Swiper
      modules={[Navigation, Pagination, A11y]}
      spaceBetween={20}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      loop={true}
      className="w-full max-w-xl h-64 bg-white rounded-lg shadow-md"
    >
      {slides.map((text, i) => (
        <SwiperSlide key={i} className="flex items-center justify-center text-lg p-10">
          {text}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
