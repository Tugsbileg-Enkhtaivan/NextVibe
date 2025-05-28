'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFlip, Pagination, Navigation } from 'swiper/modules';
import { topMusicGenres } from '../cards/page';
import 'swiper/css';
import 'swiper/css/effect-flip';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import React from 'react';

interface ChildProps {
    setGenreIndex: React.Dispatch<React.SetStateAction<number>>;
}


const FlipSwiper: React.FC<ChildProps> = ({ setGenreIndex }) => {



    // Object.entries(topMusicGenres).map(([key, value]) => console.log(`[${value.color}]`))

    return (
        <Swiper
            effect="flip"
            grabCursor={true}
            // loop={true}
            pagination={{ clickable: true }}
            navigation={false}
            modules={[EffectFlip, Pagination, Navigation]}
            onSlideChange={(swiper) => {
                // console.log('Current index [genre]:', swiper.activeIndex);
                setGenreIndex(swiper.activeIndex)
            }}
        >
            {Object.entries(topMusicGenres).map(([key, value]) => {
                return (
                    <SwiperSlide key={key}>
                        <div className={`w-[80%] h-25 mx-auto text-white text-xl font-bold rounded-xl text-center flex gap-3 items-center justify-center border-4 border-white ${value.color}`}>
                            <img className='w-15' src={value.image} />
                            <h1 className='text-4xl'>{key.toUpperCase()}</h1>
                        </div>

                    </SwiperSlide>
                )
            })}
        </Swiper>
    );
};

export default FlipSwiper;