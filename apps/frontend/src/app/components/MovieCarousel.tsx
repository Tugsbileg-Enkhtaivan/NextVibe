'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const images = [
    '/assets/bored.png',
    '/assets/angry.png',
    '/assets/sad.png',
    '/assets/happy.png',
    '/assets/devil.png',
];

export default function MovieCarousel() {
  return (
    <div className="w-full flex justify-center py-10 bg-[#f8f9fc] rounded-2xl shadow-lg">
      <Swiper
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Pagination]}
        className="w-full max-w-5xl"
      >
        {images.map((src, i) => (
          <SwiperSlide key={i} className="w-[100px]">
            <img
              src={src}
              alt={`Slide ${i}`}
              className="w-full h-auto rounded-xl shadow-xl"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
