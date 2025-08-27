// app/pools/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useAccount, useReadContract } from "wagmi";
import { formatEther, formatUnits, parseUnits } from "viem";
import { motion } from 'framer-motion';
import AppHeader from '@/app/components/AppHeader'; // 1. IMPORT THE NEW HEADER
import PixelBackground from "@/app/components/PixelBackground";
import ActionModal from '@/app/components/ActionModal'; 

// NOTE: We will need a V2 config file with our final deployed contract addresses.
// Using placeholders for now.
const POOL_FACTORY_ADDRESS = '0x...'; 
const POOL_FACTORY_ABI = []; 
const DEGEN_POOL_ADDRESS = '0x...'; 
const DEGEN_POOL_ABI = []; 
const POSITIVE_POOL_USDC_ADDRESS = '0x...';
const POSITIVE_POOL_VAULT_ABI = [];

const positivePoolTokens = [
  { symbol: 'ETH', address: undefined, decimals: 18 },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913' as `0x${string}`, decimals: 6 },
];

const degenPoolToken = { symbol: 'ETH', address: undefined, decimals: 18 };

export default function PoolsPage() {
  const { isConnected, address } = useAccount();
  const [isClient, setIsClient] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'Deposit' | 'Withdraw' | 'Claim'>('Deposit');
  const [activePool, setActivePool] = useState<'Degen' | 'Positive' | null>(null);
  const [activePoolTokens, setActivePoolTokens] = useState<typeof positivePoolTokens | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- All your useReadContract hooks remain the same here ---

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

  const { data: userDegenShares } = useReadContract({
    address: DEGEN_POOL_ADDRESS,
    abi: DEGEN_POOL_ABI,
    functionName: 'userShares',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const { data: userSumPoints } = useReadContract({
    address: POOL_FACTORY_ADDRESS,
    abi: POOL_FACTORY_ABI,
    functionName: 'userSumPoints',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const { data: degenYield } = useReadContract({
    address: DEGEN_POOL_ADDRESS,
    abi: DEGEN_POOL_ABI,
    functionName: 'claimableYield',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const { data: positiveYield } = useReadContract({
    address: POSITIVE_POOL_USDC_ADDRESS,
    abi: POSITIVE_POOL_VAULT_ABI,
    functionName: 'claimableYield',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const { data: userPositiveDeposit } = useReadContract({
    address: POSITIVE_POOL_USDC_ADDRESS,
    abi: POSITIVE_POOL_VAULT_ABI,
    functionName: 'userDeposits',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });


  const handleOpenModal = (
    pool: 'Degen' | 'Positive', 
    action: 'Deposit' | 'Withdraw' | 'Claim',
    tokens?: typeof positivePoolTokens
  ) => {
    setActivePool(pool);
    setModalAction(action);
    setActivePoolTokens(tokens);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (amount: string, selectedToken: { symbol: string, decimals: number }) => {
    console.log(`${modalAction} ${amount} ${selectedToken.symbol} for ${activePool} Pool`);
    const amountInWei = parseUnits(amount, selectedToken.decimals);
    console.log('Amount in wei:', amountInWei);
    setIsModalOpen(false);
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      <div className="relative bg-[#1a1a1a] min-h-screen text-white font-sans">
        <PixelBackground />
        <div className="relative z-10">
          {/* 2. USE THE NEW APPHEADER COMPONENT */}
          <AppHeader />

          <div className="container mx-auto px-4 py-8">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
                POΣUM POOLS
              </h1>
              <p className="mt-4 text-lg text-gray-400">
                {isConnected ? "Manage your positions and track your rewards." : "Connect your wallet to deposit and start earning SUM."}
              </p>
            </motion.div>

            {isConnected && (
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-[#1e1e1e]/80 border border-gray-700 max-w-sm mx-auto">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-400">Your SUM Points Balance</p>
                    <p className="text-3xl font-bold font-mono text-amber-300 mt-1">
                      {userSumPoints ? formatEther(userSumPoints as bigint) : '0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">These points will determine your allocation for the future POSUM token launch.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Degen Pool Card */}
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
                      <p className="text-3xl font-bold font-mono text-orange-400">
                        100% APY
                      </p>
                    </div>

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
                      <div className="mt-auto space-y-4">
                         <div className="border-t border-orange-500/30 pt-4">
                            <p className="text-sm text-gray-500">Your Claimable Yield</p>
                            <p className="text-xl font-bold font-mono text-orange-400">
                              {degenYield ? `${formatEther(degenYield as bigint)} ETH` : '0.00 ETH'}
                            </p>
                         </div>
                         <div className="flex gap-4">
                            <Button onClick={() => handleOpenModal('Degen', 'Deposit')} className="bg-gradient-to-r from-orange-500 to-amber-300 text-black rounded-xl w-full">
                              Deposit ETH
                            </Button>
                            <Button onClick={() => handleOpenModal('Degen', 'Claim')} variant="outline" className="bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl w-full">
                              Claim Yield
                            </Button>
                         </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Positive Pool Card */}
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
                      <p className="text-3xl font-bold font-mono text-amber-300">
                        ~ 12.3%
                      </p>
                    </div>

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
                            {userPositiveDeposit ? `$${Number(formatUnits(userPositiveDeposit as bigint, 6)).toLocaleString()}` : '$0.00'}
                          </p>
                        </div>
                      )}
                    </div>

                    {isConnected && (
                      <div className="mt-auto space-y-4">
                         <div className="border-t border-amber-500/30 pt-4">
                            <p className="text-sm text-gray-500">Your Claimable Yield</p>
                            <p className="text-xl font-bold font-mono text-amber-300">
                              {positiveYield ? `$${Number(formatUnits(positiveYield as bigint, 6)).toLocaleString()}` : '$0.00'}
                            </p>
                         </div>
                         <Button onClick={() => handleOpenModal('Positive', 'Deposit', positivePoolTokens)} className="bg-gradient-to-r from-amber-300 to-orange-400 text-black rounded-xl w-full">
                           Deposit
                         </Button>
                         <div className="flex gap-4">
                           <Button onClick={() => handleOpenModal('Positive', 'Withdraw', positivePoolTokens)} variant="outline" className="bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl w-full">
                             Withdraw
                           </Button>
                           <Button onClick={() => handleOpenModal('Positive', 'Claim', positivePoolTokens)} variant="outline" className="bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl w-full">
                             Claim Yield
                           </Button>
                         </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Ignition Pool Card */}
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

            </div>
          </div>
        </div>
      </div>
      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType={modalAction}
        poolName={`${activePool} Pool`}
        tokenOptions={activePool === 'Degen' ? [degenPoolToken] : activePoolTokens}
        onSubmit={handleModalSubmit}
        isLoading={false}
      />
    </>
  );
}
