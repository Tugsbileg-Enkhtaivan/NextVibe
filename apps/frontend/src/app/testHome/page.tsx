// import ImageCarousel from "../components/ImageCarousel";


// export default function Home() {
//     return (
//         <main className="flex items-center justify-center min-h-screen bg-gray-100">
//             <ImageCarousel />
//         </main>
//     );
// }


"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const SwiperCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState(0);
    const [currentTranslate, setCurrentTranslate] = useState(0);
    const [prevTranslate, setPrevTranslate] = useState(0);
    const [animationId, setAnimationId] = useState(null);

    const sliderRef = useRef(null);
    const containerRef = useRef(null);

    // Sample data - replace with your actual content
    const slides = [
        {
            id: 1,
            title: "Mountain Adventure",
            description: "Explore breathtaking mountain landscapes",
            image: "/api/placeholder/400/300",
            color: "bg-gradient-to-br from-blue-500 to-purple-600"
        },
        {
            id: 2,
            title: "Ocean Sunset",
            description: "Witness stunning ocean sunsets",
            image: "/api/placeholder/400/300",
            color: "bg-gradient-to-br from-orange-500 to-red-600"
        },
        {
            id: 3,
            title: "Forest Serenity",
            description: "Find peace in lush green forests",
            image: "/api/placeholder/400/300",
            color: "bg-gradient-to-br from-green-500 to-teal-600"
        },
        {
            id: 4,
            title: "City Lights",
            description: "Experience vibrant urban nightlife",
            image: "/api/placeholder/400/300",
            color: "bg-gradient-to-br from-purple-500 to-pink-600"
        },
        {
            id: 5,
            title: "Desert Dreams",
            description: "Journey through mystical desert landscapes",
            image: "/api/placeholder/400/300",
            color: "bg-gradient-to-br from-yellow-500 to-orange-600"
        }
    ];

    // Animation function
    const animation = useCallback(() => {
        if (sliderRef.current) {
            sliderRef.current.style.transform = `translateX(${currentTranslate}px)`;
        }
        if (isDragging) {
            const id = requestAnimationFrame(animation);
            setAnimationId(id);
        }
    }, [currentTranslate, isDragging]);

    // Set slider position
    const setSliderPosition = useCallback(() => {
        if (sliderRef.current) {
            const containerWidth = containerRef.current?.offsetWidth || 0;
            sliderRef.current.style.transform = `translateX(-${currentIndex * containerWidth}px)`;
        }
    }, [currentIndex]);

    // Touch/Mouse start
    const handleStart = useCallback((clientX) => {
        setIsDragging(true);
        setStartPos(clientX);
        setIsAutoPlaying(false);

        if (sliderRef.current) {
            const transform = sliderRef.current.style.transform;
            const translateX = transform ? parseInt(transform.split('(')[1]) : 0;
            setPrevTranslate(translateX);
            setCurrentTranslate(translateX);
        }

        const id = requestAnimationFrame(animation);
        setAnimationId(id);
    }, [animation]);

    // Touch/Mouse move
    const handleMove = useCallback((clientX) => {
        if (!isDragging) return;

        const currentPosition = clientX;
        const diff = currentPosition - startPos;
        setCurrentTranslate(prevTranslate + diff);
    }, [isDragging, startPos, prevTranslate]);

    // Touch/Mouse end
    const handleEnd = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        const containerWidth = containerRef.current?.offsetWidth || 0;
        const movedBy = currentTranslate - prevTranslate;
        const threshold = containerWidth * 0.2; // 20% threshold

        if (Math.abs(movedBy) > threshold) {
            if (movedBy > 0 && currentIndex > 0) {
                // Swipe right - go to previous
                setCurrentIndex(prev => prev - 1);
            } else if (movedBy < 0 && currentIndex < slides.length - 1) {
                // Swipe left - go to next
                setCurrentIndex(prev => prev + 1);
            }
        }

        setTimeout(() => setIsAutoPlaying(true), 100);
    }, [isDragging, animationId, currentTranslate, prevTranslate, currentIndex, slides.length]);

    // Mouse events
    const handleMouseDown = (e) => {
        e.preventDefault();
        handleStart(e.clientX);
    };

    const handleMouseMove = (e) => {
        handleMove(e.clientX);
    };

    const handleMouseUp = () => {
        handleEnd();
    };

    // Touch events
    const handleTouchStart = (e) => {
        handleStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        handleMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        handleEnd();
    };

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying || isDragging) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === slides.length - 1 ? 0 : prevIndex + 1
            );
        }, 4000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, isDragging, slides.length]);

    // Update slider position when index changes
    useEffect(() => {
        if (!isDragging) {
            setSliderPosition();
        }
    }, [currentIndex, setSliderPosition, isDragging]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setSliderPosition();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSliderPosition]);

    // Navigation functions
    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
    };

    const goToNext = () => {
        setCurrentIndex(currentIndex === slides.length - 1 ? 0 : currentIndex + 1);
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                Swiper Carousel
            </h2>

            <div
                ref={containerRef}
                className="relative w-full h-96 overflow-hidden rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Main slider container */}
                <div
                    ref={sliderRef}
                    className={`flex h-full ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
                    style={{
                        transform: isDragging ? `translateX(${currentTranslate}px)` : undefined,
                        width: `${slides.length * 100}%`
                    }}
                >
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={`w-full h-full flex-shrink-0 relative ${slide.color} flex items-center justify-center`}
                            style={{ width: `${100 / slides.length}%` }}
                        >
                            {/* Content overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="text-center text-white p-8 pointer-events-none">
                                    <div className="mb-4">
                                        <ImageIcon size={64} className="mx-auto mb-4 opacity-80" />
                                    </div>
                                    <h3 className="text-4xl font-bold mb-4">{slide.title}</h3>
                                    <p className="text-xl opacity-90">{slide.description}</p>
                                </div>
                            </div>

                            {/* Slide number indicator */}
                            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm pointer-events-none">
                                {index + 1} / {slides.length}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation arrows */}
                <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-200 hover:scale-110 z-10"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={24} className="text-white" />
                </button>

                <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-200 hover:scale-110 z-10"
                    aria-label="Next slide"
                >
                    <ChevronRight size={24} className="text-white" />
                </button>

                {/* Slide indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentIndex
                                    ? 'bg-white scale-125'
                                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Progress bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white bg-opacity-20 z-10">
                    <div
                        className={`h-full bg-white ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
                        style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                    />
                </div>

                {/* Swipe hint */}
                {!isDragging && (
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-60 pointer-events-none">
                        ← Swipe to navigate →
                    </div>
                )}
            </div>

            {/* Thumbnail navigation */}
            <div className="flex justify-center mt-6 space-x-2 overflow-x-auto pb-2">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        onClick={() => goToSlide(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg transition-all duration-200 ${index === currentIndex
                                ? 'ring-2 ring-blue-500 scale-110'
                                : 'opacity-60 hover:opacity-90'
                            } ${slide.color}`}
                    >
                        <div className="w-full h-full rounded-lg bg-black bg-opacity-30 flex items-center justify-center">
                            <ImageIcon size={20} className="text-white" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center mt-6 space-x-4">
                <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isAutoPlaying
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                >
                    {isAutoPlaying ? 'Pause' : 'Play'}
                </button>

                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
                    Slide {currentIndex + 1} of {slides.length}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 text-center text-gray-600 text-sm">
                <p>💡 <strong>Desktop:</strong> Click and drag to swipe • <strong>Mobile:</strong> Touch and swipe</p>
            </div>
        </div>
    );
};

export default SwiperCarousel;