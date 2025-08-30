// app/components/DegenPoolCard.tsx
'use client';

import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { formatEther } from "viem";
import { motion } from 'framer-motion';

interface DegenPoolCardProps {
  isConnected: boolean;
  tvl?: bigint;
  userDeposit?: bigint;
  claimableYield?: bigint;
  onDeposit: () => void;
  onClaim: () => void;
}

export default function DegenPoolCard({
  isConnected,
  tvl,
  userDeposit,
  claimableYield,
  onDeposit,
  onClaim,
}: DegenPoolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-[#1e1e1e] border border-orange-500/50 rounded-2xl shadow-lg h-full flex flex-col">
        <CardContent className="p-6 flex-grow flex flex-col">
          <h4 className="text-2xl font-bold text-orange-400 mb-2 text-center">DEGEN POOL</h4>
          <p className="text-gray-400 mb-4 flex-grow">High-risk, high-reward. Permanent deposits earn a 2x SUM multiplier.</p>
          
          <div className="my-4 text-center">
            <p className="text-sm text-gray-500">Current APY</p>
            <p className="text-3xl font-bold font-mono text-orange-400">100% APY</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div>
              <p className="text-sm text-gray-500">Global TVL</p>
              <p className="text-xl font-bold font-mono text-white">
                {tvl ? `${formatEther(tvl)} ETH` : '0.00 ETH'}
              </p>
            </div>
            {isConnected && (
              <div>
                <p className="text-sm text-gray-500">Your Deposit</p>
                <p className="text-xl font-bold font-mono text-orange-400">
                  {userDeposit ? `${formatEther(userDeposit)} ETH` : '0.00 ETH'}
                </p>
              </div>
            )}
          </div>

          {isConnected && (
            <div className="mt-auto space-y-4">
               <div className="border-t border-orange-500/30 pt-4">
                  <p className="text-sm text-gray-500">Your Claimable Yield</p>
                  <p className="text-xl font-bold font-mono text-orange-400">
                    {claimableYield ? `${formatEther(claimableYield)} ETH` : '0.00 ETH'}
                  </p>
               </div>
               <div className="flex gap-4">
                  <Button onClick={onDeposit} className="bg-gradient-to-r from-orange-500 to-amber-300 text-black rounded-xl w-full">
                    Deposit ETH
                  </Button>
                  <Button onClick={onClaim} variant="outline" className="bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl w-full">
                    Claim Yield
                  </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}