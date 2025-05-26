'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFlip, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-flip';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import React from 'react';


const FlipSwiper: React.FC = () => {

    const topMusicGenres = {
        Pop: "a",
        Rock: "2",
        HipHop: "3",
        Electronic: "4",
        Soul: "5",
        Country: "6",
        Jazz: "7",
        Classical: "8",
        Reggae: "9",
        Blues: "10"
    };


    return (
        <Swiper
            effect="flip"
            grabCursor={true}
            loop={true}
            pagination={{ clickable: true }}
            navigation={true}
            modules={[EffectFlip, Pagination, Navigation]}
            className="mySwiper"
        >
            {topMusicGenres.map((genre) => {
                return (
                    <SwiperSlide>
                        <div className="p-10 bg-purple-500 text-white text-xl font-bold rounded-xl text-center">{genre}</div>
                    </SwiperSlide>
                )
            })}
        </Swiper>
    );
};

export default FlipSwiper;