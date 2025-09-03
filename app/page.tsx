// app/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import PixelBackground from './components/PixelBackground';

export default function HomePage() {
  return (
    // --- UPDATED THIS LINE WITH THE CORRECT BACKGROUND ---
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#222222] text-white font-sans">
      <PixelBackground />
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
          POΣUM
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-400">
          A gamified, community-focused yield protocol. Forage for points, stake in high-yield pools, and join the colony.
        </p>
        <Link href="/pools">
          <motion.button
            className="mt-8 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-300 text-black font-bold text-lg rounded-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Enter Posum
          </motion.button>
        </Link>
      </motion.div>
    </main>
  );
}
