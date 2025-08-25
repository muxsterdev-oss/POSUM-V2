// app/pools/page.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { motion } from 'framer-motion';
import Link from "next/link";

// NOTE: We will need a V2 config file with our final deployed contract addresses.
// Using placeholders for now.
const DEGEN_POOL_ADDRESS = '0x...'; 
const DEGEN_POOL_ABI = []; // Add Degen Pool ABI here
const POSITIVE_POOL_USDC_ADDRESS = '0x...';
const POSITIVE_POOL_VAULT_ABI = []; // Add Positive Pool Vault ABI here

export default function PoolsPage() {
  const { isConnected, address } = useAccount();

  // Fetch global pool data
  const { data: degenPoolTVL } = useReadContract({
    address: DEGEN_POOL_ADDRESS,
    abi: DEGEN_POOL_ABI,
    functionName: 'totalDeposited',
    watch: true,
  });

  const { data: positivePoolTVL } = useReadContract({
    address: POSITIVE_POOL_USDC_ADDRESS,
    abi: POSITIVE_POOL_VAULT_ABI,
    functionName: 'getContractValue',
    watch: true,
  });

  // Fetch user-specific data (will only run if isConnected is true)
  const { data: userDegenShares } = useReadContract({
    address: DEGEN_POOL_ADDRESS,
    abi: DEGEN_POOL_ABI,
    functionName: 'userShares',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">The Pools</h1>
        <p className="mt-4 text-lg text-gray-400">
          {isConnected ? "Manage your positions and track your rewards." : "Connect your wallet to deposit and start earning SUM."}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Degen Pool Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-[#1e1e1e] border border-orange-500/50 rounded-2xl shadow-lg h-full flex flex-col">
            <CardContent className="p-6 flex-grow flex flex-col">
              <h4 className="text-2xl font-bold text-orange-400 mb-2">DEGEN POOL</h4>
              <p className="text-gray-400 mb-4 flex-grow">High-risk, high-reward. Permanent deposits earn a 2x SUM multiplier.</p>
              
              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <p className="text-sm text-gray-500">Global TVL</p>
                  <p className="text-xl font-bold font-mono text-white">
                    {degenPoolTVL ? `${formatEther(degenPoolTVL as bigint)} ETH` : '0.00 ETH'}
                  </p>
                </div>
                {isConnected && (
                  <div>
                    <p className="text-sm text-gray-500">Your Deposit</p>
                    <p className="text-xl font-bold font-mono text-orange-400">
                      {userDegenShares ? `${formatEther(userDegenShares as bigint)} ETH` : '0.00 ETH'}
                    </p>
                  </div>
                )}
              </div>

              {isConnected && (
                <Button className="mt-auto bg-gradient-to-r from-orange-500 to-amber-300 text-black rounded-xl w-full">
                  Deposit ETH
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Positive Pool Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-[#1e1e1e] border border-amber-400/50 rounded-2xl shadow-lg h-full flex flex-col">
            <CardContent className="p-6 flex-grow flex flex-col">
              <h4 className="text-2xl font-bold text-amber-300 mb-2">POSITIVE POOL</h4>
              <p className="text-gray-400 mb-4 flex-grow">Sustainable real yield. Flexible & time-locked staking (1x-1.5x SUM).</p>
              
               <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <p className="text-sm text-gray-500">Global TVL</p>
                  <p className="text-xl font-bold font-mono text-white">
                    {positivePoolTVL ? `$${Number(formatUnits(positivePoolTVL as bigint, 6)).toLocaleString()}` : '$0.00'}
                  </p>
                </div>
                {isConnected && (
                  <div>
                    <p className="text-sm text-gray-500">Your Deposit</p>
                    <p className="text-xl font-bold font-mono text-amber-300">
                      $0.00
                    </p>
                  </div>
                )}
              </div>

              {isConnected && (
                <div className="flex gap-4 mt-auto">
                  <Button className="bg-gradient-to-r from-amber-300 to-orange-400 text-black rounded-xl w-full">
                    Deposit
                  </Button>
                  <Button variant="outline" className="border-amber-300/50 text-amber-300 hover:bg-amber-400/10 hover:text-amber-300 rounded-xl w-full">
                    Withdraw
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!isConnected && (
        <div className="text-center mt-12">
          <p className="text-xl font-semibold text-gray-500">Please connect your wallet to begin.</p>
        </div>
      )}
    </div>
  );
}