// app/components/PositivePoolCard.tsx
'use client';

import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { formatUnits } from "viem";
import { motion } from 'framer-motion';

interface PositivePoolCardProps {
  isConnected: boolean;
  tvl?: bigint;
  userDeposit?: bigint;
  claimableYield?: bigint;
  onDeposit: () => void;
  onWithdraw: () => void;
  onClaim: () => void;
}

export default function PositivePoolCard({
  isConnected,
  tvl,
  userDeposit,
  claimableYield,
  onDeposit,
  onWithdraw,
  onClaim,
}: PositivePoolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-[#1e1e1e] border border-amber-400/50 rounded-2xl shadow-lg h-full flex flex-col">
        <CardContent className="p-6 flex-grow flex flex-col">
          <h4 className="text-2xl font-bold text-amber-300 mb-2 text-center">POSITIVE POOL</h4>
          <p className="text-gray-400 mb-4 flex-grow">Sustainable real yield. Flexible & time-locked staking (1x-1.5x SUM).</p>
          
          <div className="my-4 text-center">
            <p className="text-sm text-gray-500">Current APY</p>
            <p className="text-3xl font-bold font-mono text-amber-300">~ 12.3%</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div>
              <p className="text-sm text-gray-500">Global TVL</p>
              <p className="text-xl font-bold font-mono text-white">
                {tvl ? `$${Number(formatUnits(tvl, 6)).toLocaleString()}` : '$0.00'}
              </p>
            </div>
            {isConnected && (
              <div>
                <p className="text-sm text-gray-500">Your Deposit</p>
                <p className="text-xl font-bold font-mono text-amber-300">
                  {userDeposit ? `$${Number(formatUnits(userDeposit, 6)).toLocaleString()}` : '$0.00'}
                </p>
              </div>
            )}
          </div>

          {isConnected && (
            <div className="mt-auto space-y-4">
              <div className="border-t border-amber-500/30 pt-4">
                <p className="text-sm text-gray-500">Your Claimable Yield</p>
                <p className="text-xl font-bold font-mono text-amber-300">
                  {claimableYield ? `$${Number(formatUnits(claimableYield, 6)).toLocaleString()}` : '$0.00'}
                </p>
              </div>
              <Button onClick={onDeposit} className="bg-gradient-to-r from-amber-300 to-orange-400 text-black rounded-xl w-full">
                Deposit
              </Button>
              <div className="flex gap-4">
                <Button onClick={onWithdraw} variant="outline" className="bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl w-full">
                  Withdraw
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