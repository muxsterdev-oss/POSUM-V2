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

// --- FINAL, LIVE BASE SEPOLIA TESTNET ADDRESSES ---
const DEGEN_POOL_ADDRESS = '0x269c3B5F0feCFE8f78505A30bAB784e9f33E87aC'; 
const POSITIVE_POOL_USDC_ADDRESS = '0xb1F9e283721E40D4135eE69Da1F6ccdc29B4107C';
const CHAINLINK_ETH_USD_PRICE_FEED = '0x4adc67696bA383F43dd60a9E78F2C97fbfB5d211';

// --- ABIs ---
const DEGEN_POOL_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"_posumTokenAddress","type":"address","internalType":"address"},{"name":"_uniswapRouterAddress","type":"address","internalType":"address"},{"name":"_priceFeedAddress","type":"address","internalType":"address"},{"name":"_liquidityReceiver","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"DEPOSIT_LOCK_DURATION","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"FOUNDERS_WEEK_CAP","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"FOUNDERS_WEEK_DURATION","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"claimPrincipal","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"launchTimestamp","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"liquidityReceiver","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"posumToken","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract POSUM"}],"stateMutability":"view"},{"type":"function","name":"priceFeed","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract AggregatorV3Interface"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setLiquidityReceiver","inputs":[{"name":"_newReceiver","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"uniswapRouter","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IUniswapV2Router"}],"stateMutability":"view"},{"type":"function","name":"userDeposits","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userPrincipalClaimable","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userUnlockTimestamp","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"ethAmount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"liquidityAmount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"PrincipalClaimed","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}]}]; 
const POSITIVE_POOL_VAULT_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"_assetAddress","type":"address","internalType":"address"},{"name":"_compoundMarketAddress","type":"address","internalType":"address"},{"name":"_rewardTokenAddress","type":"address","internalType":"address"},{"name":"_priceFeedAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"ASSET","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20Metadata"}],"stateMutability":"view"},{"type":"function","name":"COMPOUND_MARKET","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ICompoundV3"}],"stateMutability":"view"},{"type":"function","name":"REWARD_TOKEN","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20Metadata"}],"stateMutability":"view"},{"type":"function","name":"claimYield","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"claimableYield","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"deposit","inputs":[{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getContractValue","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getPendingRewards","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getRewardPerShare","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"lastUpdateTime","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueTokens","inputs":[{"name":"_token","type":"address","internalType":"address"},{"name":"_to","type":"address","internalType":"address"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rewards","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"userShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userSumPoints","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[{"name":"_shares","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesIssued","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokenRescued","inputs":[{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Withdrawn","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesBurned","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"YieldClaimed","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}]}];
const CHAINLINK_ABI = [{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const chartData = [
  { name: 'Jan', points: 0 }, { name: 'Feb', points: 0 }, { name: 'Mar', points: 0 },
  { name: 'Apr', points: 0 }, { name: 'May', points: 0 }, { name: 'Jun', points: 0 },
];

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const { data: degenSumPoints } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'userSumPoints', args: [address!], query: { enabled: isConnected } });
  const { data: positiveSumPoints } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'getCurrentSumPoints', args: [address!], query: { enabled: isConnected } });
  const { data: userDegenDeposit } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'userDeposits', args: [address!], query: { enabled: isConnected } });
  const { data: userPositiveShares } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'userShares', args: [address!], query: { enabled: isConnected } });
  const { data: ethPriceData } = useReadContract({ address: CHAINLINK_ETH_USD_PRICE_FEED as `0x${string}`, abi: CHAINLINK_ABI, functionName: 'latestRoundData' });
  
  const totalSumPoints = (degenSumPoints as bigint || BigInt(0)) + (positiveSumPoints as bigint || BigInt(0));
  // --- CORRECTED THIS LINE ---
  const ethPrice = ethPriceData ? ((ethPriceData as any)[1] as bigint) : BigInt(0);

  const degenDepositUSD = userDegenDeposit && ethPrice ? (userDegenDeposit as bigint * ethPrice) / BigInt(1e8) : BigInt(0);
  const positiveDepositUSD = (userPositiveShares as bigint || BigInt(0)) * BigInt(10**12);
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
                      <PositionRow poolName="Degen Pool" depositAmount={`${formatEther(userDegenDeposit as bigint || BigInt(0))} ETH`} depositValue={`$${parseFloat(formatEther(degenDepositUSD)).toFixed(2)}`} sumPoints={formatEther(degenSumPoints as bigint || BigInt(0))} />
                      <PositionRow poolName="Positive Pool" depositAmount={`${formatUnits(userPositiveShares as bigint || BigInt(0), 6)} USDC`} depositValue={`$${parseFloat(formatUnits(userPositiveShares as bigint || BigInt(0), 6)).toFixed(2)}`} sumPoints={formatEther(positiveSumPoints as bigint || BigInt(0))} />
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

