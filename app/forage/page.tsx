// app/forage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppHeader from '@/app/components/AppHeader';
import PixelBackground from '@/app/components/PixelBackground';
import { useAccount } from 'wagmi';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { CheckCircle, Twitter, Send, Users, BookOpen, Megaphone } from 'lucide-react';

// --- Placeholder Data for Missions ---
const sumOnlyMissions = [
  { id: 1, title: 'Follow the Scent Trail', description: 'Follow POSUM on X', points: 100, icon: <Twitter className="w-5 h-5 text-sky-400" />, completed: true },
  { id: 2, title: 'Join the Pouch', description: 'Join our Telegram channel', points: 100, icon: <Send className="w-5 h-5 text-blue-500" />, completed: true }, // Assuming this is also completed to get the badge
  { id: 3, title: 'Grow the Family', description: 'Invite a friend who connects their wallet', points: 250, icon: <Users className="w-5 h-5 text-green-400" />, completed: false },
  { id: 4, title: 'Master the Degen\'s Game', description: 'Read docs on the Degen Pool', points: 50, icon: <BookOpen className="w-5 h-5 text-gray-400" />, completed: false },
];

const badgeMissions = [
  { id: 1, title: 'First Dip', description: 'Make your first deposit into the Positive Pool', points: 750, badge: '💧', completed: false },
  { id: 2, title: 'The Scavenger', description: 'Claim your first yield from any pool', points: 250, badge: '🌾', completed: false },
  { id: 3, title: 'Degen\'s Vow', description: 'Make a deposit into the Degen Pool', points: 1000, badge: '🔥', completed: true },
  // --- RENAMED THIS MISSION ---
  { id: 4, title: 'Part of the Colony', description: 'Finish all social tasks', points: 250, badge: '📢', completed: true },
];


export default function ForagePage() {
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
              THE FORAGE
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Complete missions to forage for SUM points and grow the colony.
            </p>
          </motion.div>

          {/* --- Mission Board Layout --- */}
          <div className="max-w-4xl mx-auto">
            {/* Section for Badge Missions (Cards) */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4 text-amber-300">Trophy Hunts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {badgeMissions.map((mission) => (
                  <Card key={mission.id} className={`bg-[#1e1e1e] border ${mission.completed ? 'border-green-500/50' : 'border-gray-700'} transition-all`}>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{mission.badge}</div>
                      <h3 className="font-bold text-lg">{mission.title}</h3>
                      <p className="text-sm text-gray-400 my-2">{mission.description}</p>
                      <p className="font-mono text-amber-300">{mission.points} SUM</p>
                      <Button variant="outline" disabled={mission.completed} className={`w-full mt-4 ${mission.completed ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400'}`}>
                        {mission.completed ? 'Completed' : 'Verify'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Section for SUM-only Missions (Text List) */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-orange-400">Foraging Grounds</h2>
              <div className="space-y-3">
                {sumOnlyMissions.map((mission) => (
                  <div key={mission.id} className="bg-[#1e1e1e]/80 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {mission.icon}
                      <div>
                        <h3 className="font-semibold">{mission.title}</h3>
                        <p className="text-sm text-gray-400">{mission.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-amber-300">{mission.points} SUM</p>
                      {mission.completed ? (
                         <div className="flex items-center gap-1 text-xs text-green-500">
                           <CheckCircle className="w-3 h-3" />
                           <span>Done</span>
                         </div>
                      ) : (
                        <button className="text-xs text-rose-400 hover:underline">Verify</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
