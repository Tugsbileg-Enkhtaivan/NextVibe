// components/ImageCarousel.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const images = ['/images/img1.jpg', '/images/img2.jpg', '/images/img3.jpg', '/images/img4.jpg'];

export default function ImageCarousel() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((prev) => (prev - 1 + images.length) % images.length);
  const next = () => setIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="relative flex items-center justify-center w-full h-[300px]">
      <button onClick={prev} className="absolute left-2 z-10 bg-white/70 px-3 py-1 rounded-full shadow">‹</button>
      <div className="flex gap-4 items-center">
        {images.map((img, i) => {
          const isActive = i === index;
          const isPrev = i === (index - 1 + images.length) % images.length;
          const isNext = i === (index + 1) % images.length;

          let scale = 0.6;
          let opacity = 0.4;

          if (isActive) {
            scale = 1;
            opacity = 1;
          } else if (isPrev || isNext) {
            scale = 0.75;
            opacity = 0.7;
          }

          return (
            <motion.div
              key={i}
              animate={{ scale, opacity }}
              transition={{ duration: 0.5 }}
              className="relative w-[200px] h-[150px]"
            >
              <Image
                src={img}
                alt={`carousel-img-${i}`}
                fill
                className="object-cover rounded-xl shadow-md"
              />
            </motion.div>
          );
        })}
      </div>
      <button onClick={next} className="absolute right-2 z-10 bg-white/70 px-3 py-1 rounded-full shadow">›</button>
    </div>
  );
}
