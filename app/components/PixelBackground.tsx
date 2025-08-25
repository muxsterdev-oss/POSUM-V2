// app/components/PixelBackground.tsx
'use client';

import { useState, useEffect } from 'react';

export default function PixelBackground() {
  const [pixels, setPixels] = useState<any[]>([]);

  useEffect(() => {
    const generatePixels = () => {
      return [...Array(30)].map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        transform: `rotate(${Math.random() * 360}deg)`,
      }));
    };
    setPixels(generatePixels());
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          className="absolute text-gray-800/50 text-xl font-bold"
          style={{ top: pixel.top, left: pixel.left, transform: pixel.transform }}
        >
          +
        </div>
      ))}
    </div>
  );
};