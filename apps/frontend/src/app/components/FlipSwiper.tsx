'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFlip, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-flip';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import React from 'react';


const FlipSwiper: React.FC = () => {
    return (
      <Swiper
        effect="flip"
        grabCursor={true}
        pagination={{ clickable: true }}
        navigation={true}
        modules={[EffectFlip, Pagination, Navigation]}
        className="mySwiper"
      >
        <SwiperSlide>
          <div className="p-10 bg-purple-500 text-white text-xl font-bold rounded-xl">Slide 1</div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="p-10 bg-pink-500 text-white text-xl font-bold rounded-xl">Slide 2</div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="p-10 bg-green-500 text-white text-xl font-bold rounded-xl">Slide 3</div>
        </SwiperSlide>
      </Swiper>
    );
  };
  
  export default FlipSwiper;
  