// app/roadmap/page.tsx
'use client';

import { motion } from 'framer-motion';
import AppHeader from '@/app/components/AppHeader';
import PixelBackground from '@/app/components/PixelBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShieldCheck, Users, Orbit } from 'lucide-react';
import React from 'react';

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6 }}
    className="relative pl-12 pb-12 border-l-2 border-gray-700"
  >
    <div className="absolute -left-[26px] top-0 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 ring-8 ring-[#1a1a1a]">
      <div className="text-amber-400">{icon}</div>
    </div>
    <h2 className="text-3xl font-bold text-amber-300 mb-6">{title}</h2>
    <div className="space-y-6">{children}</div>
  </motion.div>
);

const PhaseItem = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all">
    <CardHeader>
      <CardTitle className="text-xl text-white">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-400">{children}</p>
    </CardContent>
  </Card>
);

export default function RoadmapPage() {
  return (
    <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#222222] min-h-screen text-white font-sans">
      <PixelBackground />
      <div className="relative z-10">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
              THE POSUM ROADMAP
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Our journey is just beginning. Here's a look at what's next for the colony.
            </p>
          </motion.div>

          <div>
            <Section title="Phase 1: Genesis Launch (You Are Here)" icon={<ShieldCheck size={28} />}>
              <PhaseItem title="Fort Knox Security">
                Our number one priority. Before mainnet, our smart contracts will undergo a full, professional security audit by a reputable third-party firm. The final report will be made public for full transparency.
              </PhaseItem>
              <PhaseItem title="Community-Owned Treasury">
                The protocol's treasury will be controlled by a Gnosis Safe Multisig wallet, requiring signatures from multiple core team members to move any funds. This ensures no single person has control and protects the community's assets.
              </PhaseItem>
              <PhaseItem title="The Forage Goes Live">
                The gamified mission system will be fully launched, allowing new users to complete tasks, earn their first `SUM` points, and become part of the POSUM colony from day one.
              </PhaseItem>
            </Section>

            <Section title="Phase 2: Colony Expansion" icon={<Users size={28} />}>
              <PhaseItem title="More Ways to Earn (WETH Vault)">
                We will launch a new Positive Pool vault for Wrapped Ether (WETH), allowing users to earn sustainable, real yield on their ETH with the same flexible and locked staking options.
              </PhaseItem>
              <PhaseItem title="Advanced Analytics Dashboard">
                Your dashboard will get a major upgrade with a historical chart to track your `SUM` point accumulation over time, along with more detailed breakdowns of your positions and earnings.
              </PhaseItem>
              <PhaseItem title="The Alpha's Challenge">
                New, high-tier missions will be added to "The Forage" for our most dedicated users, offering unique rewards and badges for top depositors and community leaders.
              </PhaseItem>
            </Section>

            <Section title="Phase 3: The POSUM Ecosystem" icon={<Orbit size={28} />}>
              <PhaseItem title="Effortless Deposits (Zap-In)">
                We will build a "Zap-In" feature, allowing you to deposit into our pools with a wider variety of tokens. The contract will automatically swap them into the correct asset for you, making depositing seamless.
              </PhaseItem>
              <PhaseItem title="Ignition Pools Launch">
                Our "Yield-as-a-Service" offering for partner projects will go live, creating a new revenue stream for the treasury and expanding the POSUM ecosystem.
              </PhaseItem>
              <PhaseItem title="Governance & The $POSUM Token">
                The final step in our journey to decentralization. The `SUM` points you've earned will determine your allocation of the official `$POSUM` governance token, giving you a direct voice in the future of the protocol.
              </PhaseItem>
            </Section>
          </div>

        </div>
      </div>
    </div>
  );
}

