"use client";

import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

import Image from "next/image";
import { SetStateAction, useRef, useState } from "react";
import FlipSwiperGenre from "../components/FlipSwiperGenre";
import FlipSwiperActivity from "../components/FlipSwiperActivity";

type EmotionData = {
    image: string;
    color: string;
};

const data: Record<string, EmotionData> = {
    joy: {
        image: "/assets/joy.webp",
        color: "linear-gradient(135deg, #FFEB3B 0%, #FFC107 50%, #FF8F00 100%)",
    },
    anger: {
        image: "/assets/anger.webp",
        color: "linear-gradient(135deg, #F44336 0%, #D32F2F 50%, #B71C1C 100%)",
    },
    envy: {
        image: "/assets/envy.webp",
        color: "linear-gradient(135deg, #00E5CC 0%, #00BFA5 50%, #004D40 100%)",
    },
    fear: {
        image: "/assets/fear.webp",
        color: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #4A148C 100%)",
    },
    sadness: {
        image: "/assets/sadness.webp",
        color: "linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #0D47A1 100%)",
    },
    ennui: {
        image: "/assets/ennui.webp",
        color: "linear-gradient(135deg, #5C6BC0 0%, #3F51B5 50%, #1A237E 100%)",
    },
    disgust: {
        image: "/assets/disgust.webp",
        color: "linear-gradient(135deg, #8BC34A 0%, #689F38 50%, #33691E 100%)",
    },
    shame: {
        image: "/assets/embarrassment.webp",
        color: "linear-gradient(135deg, #FF69B4 0%, #E91E63 50%, #880E4F 100%)",
    },
    anxiety: {
        image: "/assets/anxiety.webp",
        color: "linear-gradient(135deg, #FF8C42 0%, #FF6B1A 50%, #E55100 100%)",
    },
};

const topMusicGenres: Record<string, EmotionData> = {
    Pop: {
        color: "bg-red-300",
        image: "/assets/pop-sticker-icon.webp"
    },
    Rock: {
        color: "bg-orange-500",
        image: "/assets/finger-icon.webp"
    },
    HipHop: {
        color: "bg-orange-700",
        image: "/assets/orange-hat-icon.webp"
    },
    Electronic: {
        color: "bg-violet-500",
        image: "/assets/headset-icon.webp"
    },
    Soul: {
        color: "bg-amber-400",
        image: "/assets/heart-icon.webp"
    },
    Country: {
        color: "bg-amber-600",
        image: "/assets/guitar-icon.webp"
    },
    Jazz: {
        color: "bg-teal-600",
        image: "/assets/buree-icon.webp"
    },
    Classical: {
        color: "bg-red-900",
        image: "/assets/vionyl-icon.webp"
    },
    Reggae: {
        color: "bg-green-700",
        image: "/assets/reggie-icon.webp"
    },
    Blues: {
        color: "bg-sky-600",
        image: "/assets/blues-icon.webp"
    },
};

const topActivities: Record<string, EmotionData> = {
    Reading: {
        color: "bg-emerald-500",
        image: "/assets/reading-icon.webp"
    },
    Nothing: {
        color: "bg-gray-400",
        image: "/assets/chill-out-icon.webp"
    },
    Running: {
        color: "bg-orange-600",
        image: "/assets/running-icon.webp"
    },
    Cooking: {
        color: "bg-amber-500",
        image: "/assets/cooking-icon.webp"
    },
    Traveling: {
        color: "bg-blue-500",
        image: "/assets/travel-icon.webp"
    },
    Gaming: {
        color: "bg-purple-700",
        image: "/assets/gaming-icon.webp"
    },
    Drawing: {
        color: "bg-pink-400",
        image: "/assets/drawing-icon.webp"
    },
    Yoga: {
        color: "bg-teal-400",
        image: "/assets/yoga-icon.webp"
    },
    Biking: {
        color: "bg-lime-500",
        image: "/assets/biking-icon.webp"
    },
    Dancing: {
        color: "bg-rose-500",
        image: "/assets/dancing-icon.webp"
    },
    Gardening: {
        color: "bg-green-600",
        image: "/assets/gardening-icon.webp"
    },
};

const stickerGenre = Object.entries(topMusicGenres);
const stickerActivity = Object.entries(topActivities);


export default function CardCarousel() {
    const swiperRef = useRef<SwiperClass | null>(null);
    const [index, setIndex] = useState(0);
    const [genreIndex, setGenreIndex] = useState(0);
    const [activityIndex, setActivityIndex] = useState(0);
    const [selectedMood, setSelectedMood] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("");
    const [selectedActivity, setSelectedActivity] = useState("");
    const [generateStart, setGenerateStart] = useState(false);

    const colors = Object.entries(data)
    // console.log(colors[index][1].color)


    const handleMoodClick = (index: number) => {
        // console.log(index)
    };

    // useEffect(() => {
    //     setSelectedMood(Object.entries(data)[index][0])
    // }, [index]);

    // useEffect(() => {
    //     setSelectedGenre(Object.entries(topMusicGenres)[genreIndex][0])
    // }, [genreIndex]);

    function generateMusic() {
        setSelectedMood(Object.entries(data)[index][0]);
        setSelectedGenre(Object.entries(topMusicGenres)[genreIndex][0]);
        setSelectedActivity(Object.entries(topActivities)[activityIndex][0]);
        // console.log(selectedGenre, selectedMood)
        setGenerateStart(true);
    }

    return (
        <div className="max-w-[430px] w-full min-h-screen mx-auto space-y-4 bg-black py-6 bg-center bg-cover overflow-hidden pt-12 relative" style={{ backgroundImage: `${colors[index][1].color}` }}>
            <div className="w-full min-h-screen h-full absolute [&>*]:absolute">
                <img className="w-[20%] top-[-15%] left-[40%] rotate-50" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[25%] bottom-[56%] right-[-7%] rotate-20" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[28%] top-[-7%] left-[1%] rotate-[-20deg]" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[30%] top-[-14%] right-[-5%] rotate-220" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[15%] top-[20%] left-[-3%] rotate-30" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[10%] top-[10%] right-[-3%] rotate-[-20deg]" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[60%] bottom-[23%] right-[-10%] rotate-130" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[25%] bottom-[15%] left-[7%] rotate-40" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[20%] bottom-[10%] right-[10%] rotate-[35deg]" src={`${stickerGenre[genreIndex][1].image}`}></img>
                <img className="w-[20%] bottom-[5%] left-[30%] rotate-[-45deg]" src={`${stickerGenre[genreIndex][1].image}`}></img>


                <img className="w-[30%] top-[37%] left-[-10%] rotate-[-35deg]" src={`${stickerActivity[activityIndex][1].image}`}></img>
                <img className="w-[20%] bottom-[15%] right-[35%] rotate-[-30deg]" src={`${stickerActivity[activityIndex][1].image}`}></img>
                <img className="w-[15%] top-[-5%] left-[43%] rotate-[25deg]" src={`${stickerActivity[activityIndex][1].image}`}></img>
                <img className="w-[16%] top-[4%] right-[8%] rotate-[-35deg]" src={`${stickerActivity[activityIndex][1].image}`}></img>
                <img className="w-[7%] top-[23%] right-[2%] rotate-[15deg]" src={`${stickerActivity[activityIndex][1].image}`}></img>
                <img className="w-[8%] bottom-[36%] left-[2%] rotate-[-220deg]" src={`${stickerActivity[activityIndex][1].image}`}></img>
                <img className="w-[30%] bottom-[0%] left-[-10%] rotate-[-35deg]" src={`${stickerActivity[activityIndex][1].image}`}></img>
            </div>
            <div className={`space-y-4 ${generateStart ? "hidden" : "block"}`}>
                <h1 className={`relative text-white text-3xl text-center font-bold z-2
                transition-all duration-700 ease-in-out transform
                ${generateStart ? "opacity-0 -translate-y-10 scale-95 pointer-events-none" : "opacity-100 translate-y-0 scale-100"}
              `}>SELECT YOUR MOOD</h1>
                <Swiper
                    effect="cards"
                    loop={true}
                    grabCursor={true}
                    pagination={{ clickable: true }}
                    modules={[EffectCards, Pagination]}
                    className={`w-[250px] h-[350px] 
                transition-all duration-700 ease-in-out transform
                ${generateStart ? "opacity-0 -translate-y-10 scale-95 pointer-events-none" : "opacity-100 translate-y-0 scale-100"}
              `}
                    // onSlideChange={(swiper) => {
                    //     console.log('Current index:', swiper.activeIndex);
                    // }}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;

                        // ✅ Register event listener for activeIndexChange
                        swiper.on("activeIndexChange", () => {
                            // console.log("Active index changed to:", swiper.realIndex);
                            setIndex(swiper.realIndex);
                        });
                    }}
                >
                    {Object.entries(data).map(([key, value], index) => (
                        <SwiperSlide key={index}
                            onClick={() => handleMoodClick(index)} className="flex items-center justify-center w-[400px] h-[400px] rounded-3xl relative border-4 border-white">
                            <h1 className="absolute top-7 left-1/2 -translate-1/2 text-white font-bold text-3xl">{key[0].toUpperCase() + key.slice(1).toUpperCase()}</h1>
                            <Image
                                src={value.image}
                                alt={`Slide ${index + 1}`}
                                width={350}
                                height={400}
                                className="rounded-xl object-cover object-center mx-auto"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>

                <FlipSwiperGenre setGenreIndex={setGenreIndex} generateStart={generateStart} />
                <FlipSwiperActivity setActivityIndex={setActivityIndex} generateStart={generateStart} />
                <button
                    onClick={generateMusic}
                    className={`
    text-white border-2 border-white rounded-full py-2 px-3 font-bold text-lg bg-purple-500 relative justify-self-center
    transition-all duration-700 ease-in-out transform
    ${generateStart ? "opacity-0 -translate-y-10 scale-95 pointer-events-none flex" : "opacity-100 translate-y-0 scale-100 flex"}
  `}>Generate</button>
            </div>

            {/* <div className="w-30 h-10 bg-black mx-auto"></div> */}

        </div >
    );
}