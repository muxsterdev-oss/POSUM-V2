// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppHeader from '@/app/components/AppHeader';
import PixelBackground from '@/app/components/PixelBackground';
import { useAccount } from 'wagmi';

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Prevent hydration errors
  }

  return (
    <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#222222] min-h-screen text-white font-sans">
      <PixelBackground />
      <div className="relative z-10">
        <AppHeader />

        <div className="container mx-auto px-4 py-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
              DASHBOARD
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Your personal POSUM protocol overview.
            </p>
          </motion.div>

          {/* Dashboard content will go here */}
          <div className="text-center py-20">
            <p className="text-gray-500">Dashboard coming soon...</p>
          </div>

        </div>
      </div>
    </div>
  );
}
