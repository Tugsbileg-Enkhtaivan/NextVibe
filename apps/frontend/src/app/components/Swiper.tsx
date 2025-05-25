'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const slides = [
  '/assets/bored.png',
  '/assets/angry.png',
  '/assets/sad.png',
  '/assets/happy.png',
  '/assets/devil.png',
];

export default function CoverflowSwiper() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <Swiper
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{ clickable: true }}
        navigation
        modules={[EffectCoverflow, Pagination, Navigation]}
        className="w-full h-[500px]"
      >
        {slides.map((src, index) => (
          <SwiperSlide key={index} className="w-[300px] h-[400px]">
            <img
              src={src}
              alt={`Slide ${index}`}
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
