// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useAccount, useReadContract } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { motion } from 'framer-motion';
import AppHeader from '@/app/components/AppHeader';
import PixelBackground from "@/app/components/PixelBackground";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- CONTRACT ADDRESSES & ABIs ---
const DEGEN_POOL_ADDRESS = '0x269c3B5F0feCFE8f78505A30bAB784e9f33E87aC'; 
const POSITIVE_POOL_USDC_ADDRESS = '0xb1F9e283721E40D4135eE69Da1F6ccdc29B4107C';
const CHAINLINK_ETH_USD_PRICE_FEED = '0x4aDC67696bA383F43DD60A9e78F2C97FbfB5D211';

const DEGEN_POOL_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"initialTreasury","type":"address","internalType":"address"},{"name":"_priceFeedAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"}]; 
const POSITIVE_POOL_VAULT_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"_assetAddress","type":"address","internalType":"address"},{"name":"_flexMultiplier","type":"uint16","internalType":"uint16"},{"name":"_lockedMultiplier","type":"uint16","internalType":"uint16"},{"name":"_lockDurationSeconds","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"previewWithdraw","inputs":[{"name":"_shares","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userFlexShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userLockedShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"}];
const CHAINLINK_ABI = [{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const chartData = [
  { name: 'Jan', points: 0 }, { name: 'Feb', points: 0 }, { name: 'Mar', points: 0 },
  { name: 'Apr', points: 0 }, { name: 'May', points: 0 }, { name: 'Jun', points: 0 },
];

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const { data: degenSumPoints } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'getCurrentSumPoints', args: [address!], query: { enabled: isConnected } });
  const { data: positiveSumPoints } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'getCurrentSumPoints', args: [address!], query: { enabled: isConnected } });
  const { data: userDegenShares } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'userShares', args: [address!], query: { enabled: isConnected } });
  const { data: userPositiveFlexShares } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'userFlexShares', args: [address!], query: { enabled: isConnected } });
  const { data: userPositiveLockedShares } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'userLockedShares', args: [address!], query: { enabled: isConnected } });
  const { data: ethPriceData } = useReadContract({ address: CHAINLINK_ETH_USD_PRICE_FEED as `0x${string}`, abi: CHAINLINK_ABI, functionName: 'latestRoundData' });
  
  const totalSumPoints = (degenSumPoints as bigint || BigInt(0)) + (positiveSumPoints as bigint || BigInt(0));
  const ethPrice = ethPriceData ? ((ethPriceData as any)[1] as bigint) : BigInt(0);

  const degenDepositUSD = userDegenShares && ethPrice ? (userDegenShares as bigint * ethPrice) / BigInt(1e8) : BigInt(0);
  const totalPositiveShares = (userPositiveFlexShares as bigint || BigInt(0)) + (userPositiveLockedShares as bigint || BigInt(0));
  
  const positiveDepositUSD = totalPositiveShares * BigInt(10**12); 
  const totalDepositedUSD = degenDepositUSD + positiveDepositUSD;

  if (!isClient) return null;

  return (
    <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#222222] min-h-screen text-white font-sans">
      <PixelBackground />
      <div className="relative z-10">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
              YOUR POΣUM DASHBOARD
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              {isConnected ? "Track your total earnings and positions." : "Connect your wallet to view your dashboard."}
            </p>
          </motion.div>

          {isConnected ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total SUM Points" value={parseFloat(formatEther(totalSumPoints)).toFixed(4)} unit="SUM" />
                <StatCard title="Total Deposited Value" value={`$${parseFloat(formatEther(totalDepositedUSD)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} unit="USD" />
                <StatCard title="Current Blended APY" value="~ 42.8%" unit="APY" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-[#1e1e1e]/80 border border-gray-700">
                  <CardHeader><CardTitle>Your Positions</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <PositionRow poolName="Degen Pool" depositAmount={`${formatEther(userDegenShares as bigint || BigInt(0))} ETH`} depositValue={`$${parseFloat(formatEther(degenDepositUSD)).toFixed(2)}`} sumPoints={formatEther(degenSumPoints as bigint || BigInt(0))} />
                      <PositionRow poolName="Positive Pool" depositAmount={`${formatUnits(totalPositiveShares, 6)} USDC`} depositValue={`$${parseFloat(formatUnits(totalPositiveShares, 6)).toFixed(2)}`} sumPoints={formatEther(positiveSumPoints as bigint || BigInt(0))} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1e1e1e]/80 border border-gray-700">
                  <CardHeader><CardTitle>SUM Point History</CardTitle></CardHeader>
                  <CardContent className="h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="text-lg">Historical Chart Coming Soon</p>
                      <p className="text-sm">This feature will be available in V2.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">Please connect your wallet to see your dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, unit }: { title: string; value: string; unit: string }) => (
  <Card className="bg-[#1e1e1e]/80 border border-gray-700">
    <CardContent className="p-6">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold font-mono text-amber-300 mt-1">
        {value} <span className="text-lg text-gray-500">{unit}</span>
      </p>
    </CardContent>
  </Card>
);

const PositionRow = ({ poolName, depositAmount, depositValue, sumPoints }: { poolName: string; depositAmount: string; depositValue: string; sumPoints: string; }) => (
  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
    <div>
      <p className="font-semibold text-white">{poolName}</p>
      <p className="text-sm text-gray-400">{depositAmount}</p>
    </div>
    <div className="text-right">
      <p className="font-mono text-white">{depositValue}</p>
      <p className="text-sm text-amber-400">{parseFloat(sumPoints).toFixed(4)} SUM</p>
    </div>
  </div>
);

