'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const images = [
    '/assets/images.jpeg',
   '/assets/images.jpeg',
   '/assets/images.jpeg',
   '/assets/images.jpeg',
   '/assets/images.jpeg',
   '/assets/images.jpeg',

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
        className="w-full max-w-6xl"
      >
        {images.map((src, i) => (
          <SwiperSlide key={i} className="w-10">
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
