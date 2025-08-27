// app/components/PixelBackground.tsx
'use client';

import { useEffect, useRef } from 'react';

const PixelBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let pixels: { x: number; y: number; speed: number }[] = [];
    const pixelCount = 90; // You can adjust this number

    const createPixels = () => {
      pixels = [];
      for (let i = 0; i < pixelCount; i++) {
        pixels.push({
          x: Math.random() * width,
          y: Math.random() * height,
          speed: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // --- CHANGED SECTION ---
      // Set the style for our '+' symbols
      ctx.fillStyle = 'rgba(255, 165, 0, 0.2)'; // Faint orange color
      ctx.font = '20px monospace'; // Set the font size and family
      ctx.textAlign = 'center';

      pixels.forEach(pixel => {
        pixel.y -= pixel.speed;
        if (pixel.y < 0) {
          pixel.y = height;
          pixel.x = Math.random() * width;
        }
        // Draw a '+' character instead of a rectangle
        ctx.fillText('+', pixel.x, pixel.y);
      });
      // --- END CHANGED SECTION ---

      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createPixels();
    };

    window.addEventListener('resize', handleResize);
    createPixels();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    // We can remove the opacity class here since it's controlled in the fillStyle
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0"
    />
  );
};

export default PixelBackground;
