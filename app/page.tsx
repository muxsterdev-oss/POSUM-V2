// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReadContract } from "wagmi";
import { formatEther, formatUnits } from "viem";
import Link from "next/link";
import { motion } from 'framer-motion';
import PixelBackground from "./components/PixelBackground";

// NOTE: Using placeholders for V2 contract addresses.
const POOL_FACTORY_ADDRESS = '0x...'; 
const POOL_FACTORY_ABI = []; 
const DEGEN_POOL_ADDRESS = '0x...';
const DEGEN_POOL_ABI = [];
const POSITIVE_POOL_USDC_ADDRESS = '0x...';
const POSITIVE_POOL_VAULT_ABI = [];

const CHAINLINK_ETH_USD_FEED_ADDRESS = '0x7104490519fF37aB4Db84B234C08ac3014B7071F';
const CHAINLINK_FEED_ABI = [{ "inputs": [], "name": "latestRoundData", "outputs": [ { "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" } ], "stateMutability": "view", "type": "function" }];


export default function LandingPage() {
  const { data: degenPoolTVL } = useReadContract({ address: DEGEN_POOL_ADDRESS, abi: DEGEN_POOL_ABI, functionName: 'totalDeposited', watch: true });
  const { data: positivePoolTVL } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'getContractValue', watch: true });
  const { data: ethPriceData } = useReadContract({ address: CHAINLINK_ETH_USD_FEED_ADDRESS, abi: CHAINLINK_FEED_ABI, functionName: 'latestRoundData', watch: true });

  const calculateTotalTVL = () => {
    let totalTVL = 0;
    if (positivePoolTVL) {
      totalTVL += Number(formatUnits(positivePoolTVL as bigint, 6));
    }
    if (degenPoolTVL && ethPriceData) {
      const ethValue = Number(formatEther(degenPoolTVL as bigint));
      const ethPrice = Number(formatUnits((ethPriceData as any[])[1], 8));
      totalTVL += ethValue * ethPrice;
    }
    return totalTVL.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: i * 0.15 } }),
  };

  return (
    <motion.div 
      className="bg-[#1a1a1a] text-white min-h-screen flex flex-col font-sans relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PixelBackground />

      <header className="relative z-10 p-6 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">POΣUM</h1>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link href="/pools">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-300 hover:from-amber-300 hover:to-orange-500 text-black font-semibold rounded-xl px-6 py-2 shadow-md">
              Enter POSUM
            </Button>
          </Link>
        </motion.div>
      </header>
      
      <main className="flex-grow flex flex-col">
        <motion.section 
          className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 py-16"
          variants={itemVariants}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent leading-snug pb-2">Building DeFi's Positive-Sum Future</h2>
          <p className="text-gray-400 max-w-xl mb-6">A gamified, multi-chain yield and liquidity protocol. No VCs. No presale. Just a fair launch game for the community.</p>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link href="/pools">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-300 text-black font-semibold rounded-2xl px-8 py-3 shadow-lg">
                Enter POSUM
              </Button>
            </Link>
          </motion.div>
        </motion.section>
        
        <motion.section 
          className="relative z-10 p-10 bg-[#2a2a2a]/90"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* CORRECTED: Moved Platform TVL to the top and removed the old title */}
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Platform Total TVL</h2>
            <p className="text-5xl font-bold font-mono text-green-300 mt-2">
              {calculateTotalTVL()}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <motion.div variants={cardVariants} custom={1} whileHover={{ scale: 1.05 }}><Card className="bg-[#1e1e1e] border border-orange-500/50 rounded-2xl shadow-lg h-full flex flex-col"><CardContent className="p-6 flex-grow flex flex-col"><h4 className="text-2xl font-bold text-orange-400 mb-2">DEGEN POOL</h4><p className="text-gray-400 mb-4 flex-grow">The high-risk game. Permanent deposits, 2x SUM points.</p><div className="border-t border-gray-700 pt-4 mt-auto"><p className="text-sm text-gray-500">Total Value Locked</p><p className="text-2xl font-bold font-mono text-white">{degenPoolTVL ? `${formatEther(degenPoolTVL as bigint)} ETH` : '0.00 ETH'}</p></div></CardContent></Card></motion.div>
            <motion.div variants={cardVariants} custom={2} whileHover={{ scale: 1.05 }}><Card className="bg-[#1e1e1e] border border-amber-400/50 rounded-2xl shadow-lg h-full flex flex-col"><CardContent className="p-6 flex-grow flex flex-col"><h4 className="text-2xl font-bold text-amber-300 mb-2">POSITIVE POOL</h4><p className="text-gray-400 mb-4 flex-grow">Sustainable real yield. Flexible & time-locked staking.</p><div className="border-t border-gray-700 pt-4 mt-auto"><p className="text-sm text-gray-500">Total Value Locked</p><p className="text-2xl font-bold font-mono text-white">{positivePoolTVL ? `$${Number(formatUnits(positivePoolTVL as bigint, 6)).toLocaleString()}` : '$0.00'}</p></div></CardContent></Card></motion.div>
            <motion.div variants={cardVariants} custom={3} whileHover={{ scale: 1.05 }}><Card className="bg-[#1e1e1e] border border-gray-600/50 rounded-2xl shadow-lg opacity-60 h-full flex flex-col"><CardContent className="p-6 flex-grow flex flex-col"><h4 className="text-2xl font-bold text-gray-400 mb-2">IGNITION POOL</h4><p className="text-gray-500 mb-4 flex-grow">Yield-as-a-Service for partner projects.</p><div className="border-t border-gray-700 pt-4 mt-auto"><p className="text-sm text-gray-500">Status</p><p className="text-2xl font-bold font-mono text-gray-400">Coming Soon</p></div></CardContent></Card></motion.div>
          </div>
          
        </motion.section>
        
        <motion.footer className="relative z-10 p-6 text-center text-gray-500 border-t border-gray-800" variants={itemVariants}>© 2025 POSUM Protocol. Built in public.</motion.footer>
      </main>
    </motion.div>
  );
}