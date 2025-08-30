// app/components/IgnitionPoolCard.tsx
'use client';

import { Card, CardContent } from "@/app/components/ui/card";
import { motion } from 'framer-motion';

export default function IgnitionPoolCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="bg-[#1e1e1e] border border-gray-600/50 rounded-2xl shadow-lg h-full flex flex-col opacity-60">
        <CardContent className="p-6 flex-grow flex flex-col">
          <h4 className="text-2xl font-bold text-gray-400 mb-2 text-center">IGNITION POOL</h4>
          <p className="text-gray-500 mb-4 flex-grow">Yield-as-a-Service for partner projects.</p>
          <div className="border-t border-gray-700 pt-4 mt-auto">
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-2xl font-bold font-mono text-gray-400">
              Coming Soon
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}