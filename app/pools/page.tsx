// app/pools/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { motion } from 'framer-motion';
import Link from "next/link";
import dynamic from 'next/dynamic';
import AppHeader from '@/app/components/AppHeader';
import PixelBackground from "@/app/components/PixelBackground";
import ActionModal from '@/app/components/ActionModal'; 
import TxNotification, { TxStatus } from '@/app/components/TxNotification';
import { useQueryClient } from '@tanstack/react-query';
import { foundryWithPublicRpc } from '@/app/providers';

// --- CORRECTED CONTRACT ADDRESSES ---
const POOL_FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; 
const DEGEN_POOL_ADDRESS = '0xa16E02E87b7454126E5E10d957A927A7F5B5d2be'; 
const POSITIVE_POOL_USDC_ADDRESS = '0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968';

const POOL_FACTORY_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"createDegenPool","inputs":[{"name":"_treasuryWallet","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"createPositivePool","inputs":[{"name":"_assetAddress","type":"address","internalType":"address"},{"name":"_lockDurationSeconds","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"degenPools","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getDegenPoolCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getPositivePoolCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"poolInfo","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"poolType","type":"uint8","internalType":"enum PoolFactory.PoolType"},{"name":"poolAddress","type":"address","internalType":"address"},{"name":"assetAddress","type":"address","internalType":"address"},{"name":"createdAt","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"positivePoolVaults","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"PoolCreated","inputs":[{"name":"poolType","type":"uint8","indexed":true,"internalType":"enum PoolFactory.PoolType"},{"name":"poolAddress","type":"address","indexed":true,"internalType":"address"},{"name":"assetAddress","type":"address","indexed":false,"internalType":"address"},{"name":"creator","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]}];
const DEGEN_POOL_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"initialTreasury","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"ANNUAL_PERCENTAGE_RATE_BPS","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"TREASURY_FEE_BPS","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"YIELD_PER_SECOND_PER_SHARE","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"claim","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getPendingRewards","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getRewardPerShare","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getTotalClaimable","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"lastUpdateTime","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueTokens","inputs":[{"name":"_tokenAddress","type":"address","internalType":"address"},{"name":"_to","type":"address","internalType":"address"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rewards","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"setTreasuryWallet","inputs":[{"name":"_newTreasuryWallet","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalDeposited","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"treasuryWallet","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"userShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userSumPoints","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"event","name":"Claimed","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"userAmount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"feeAmount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesIssued","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokenRescued","inputs":[{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"TreasuryWalletUpdated","inputs":[{"name":"newTreasuryWallet","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]}]; 
const POSITIVE_POOL_VAULT_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"_assetAddress","type":"address","internalType":"address"},{"name":"_flexMultiplier","type":"uint16","internalType":"uint16"},{"name":"_lockedMultiplier","type":"uint16","internalType":"uint16"},{"name":"_lockDurationSeconds","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"COMPOUND_V3_USDbC","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ICompoundV3"}],"stateMutability":"view"},{"type":"function","name":"FLEX_MULTIPLIER","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"LOCKED_MULTIPLIER","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"asset","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20"}],"stateMutability":"view"},{"type":"function","name":"convertExpiredLock","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[{"name":"_amount","type":"uint256","internalType":"uint256"},{"name":"_isLocked","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getContractValue","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"lockDuration","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"previewDeposit","inputs":[{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"shares","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"previewWithdraw","inputs":[{"name":"_shares","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueTokens","inputs":[{"name":"_tokenAddress","type":"address","internalType":"address"},{"name":"_to","type":"address","internalType":"address"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalFlexShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalLockedShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"userFlexShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userLockEndDate","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userLockedShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userSumPoints","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[{"name":"_shares","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdrawMax","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesIssued","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"isLocked","type":"bool","indexed":false,"internalType":"bool"}],"anonymous":false},{"type":"event","name":"LockConverted","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"shares","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"LockExtended","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"newEndDate","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokenRescued","inputs":[{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Withdrawn","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesBurned","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]},{"type":"error","name":"ReentrancyGuardReentrantCall","inputs":[]},{"type":"error","name":"SafeERC20FailedOperation","inputs":[{"name":"token","type":"address","internalType":"address"}]}];

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
  
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [txStatus, setTxStatus] = useState<TxStatus>(null);

  const { writeContract, isPending } = useWriteContract();
  const queryClient = useQueryClient();

  useWaitForTransactionReceipt({ 
    hash,
    confirmations: 1,
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries();
        setTxStatus('success');
      } else {
        setTxStatus('error');
      }
    },
    onError: () => {
      setTxStatus('error');
    }
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: degenPoolTVL } = useReadContract({
    address: DEGEN_POOL_ADDRESS as `0x${string}`,
    abi: DEGEN_POOL_ABI,
    functionName: 'totalDeposited',
    watch: true,
  });

  const { data: positivePoolTVL } = useReadContract({
    address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`,
    abi: POSITIVE_POOL_VAULT_ABI,
    functionName: 'getContractValue',
    watch: true,
  });

  const { data: userDegenShares } = useReadContract({
    address: DEGEN_POOL_ADDRESS as `0x${string}`,
    abi: DEGEN_POOL_ABI,
    functionName: 'userShares',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });
  
  const { data: degenSumPoints } = useReadContract({
    address: DEGEN_POOL_ADDRESS as `0x${string}`,
    abi: DEGEN_POOL_ABI,
    functionName: 'getCurrentSumPoints',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const { data: positiveSumPoints } = useReadContract({
    address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`,
    abi: POSITIVE_POOL_VAULT_ABI,
    functionName: 'getCurrentSumPoints',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const totalSumPoints = (degenSumPoints as bigint || 0n) + (positiveSumPoints as bigint || 0n);

  const { data: degenYield } = useReadContract({
    address: DEGEN_POOL_ADDRESS as `0x${string}`,
    abi: DEGEN_POOL_ABI,
    functionName: 'getTotalClaimable',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const { data: positiveYield } = useReadContract({
    address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`,
    abi: POSITIVE_POOL_VAULT_ABI,
    functionName: 'claimableYield',
    args: [address!],
    enabled: isConnected,
    watch: true,
  });

  const { data: userPositiveDeposit } = useReadContract({
    address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`,
    abi: POSITIVE_POOL_VAULT_ABI,
    functionName: 'userFlexShares',
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
    if (activePool === 'Degen' && modalAction === 'Deposit') {
      writeContract({
        address: DEGEN_POOL_ADDRESS as `0x${string}`,
        abi: DEGEN_POOL_ABI,
        functionName: 'deposit',
        value: parseEther(amount),
      }, {
        onSuccess: (txHash) => {
          setHash(txHash);
          setTxStatus('pending');
          setIsModalOpen(false);
        },
        onError: (error) => {
          console.error("Transaction Error:", error);
          setTxStatus('error');
          setIsModalOpen(false);
        },
        onRejection: () => {
          console.log("User rejected transaction");
          setIsModalOpen(false);
        }
      });
    } else {
      console.log(`${modalAction} ${amount} ${selectedToken.symbol} for ${activePool} Pool`);
      setIsModalOpen(false);
    }
  };

  const handleClaim = (poolAddress: `0x${string}`, abi: any) => {
    writeContract({
      address: poolAddress,
      abi: abi,
      functionName: 'claim',
    }, {
      onSuccess: (txHash) => {
        setHash(txHash);
        setTxStatus('pending');
      },
      onError: (error) => {
        console.error("Claim Error:", error);
        setTxStatus('error');
      },
      onRejection: () => {
        console.log("User rejected transaction");
      }
    });
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
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
                      {formatEther(totalSumPoints)} <span className="text-sm text-gray-500">SUM</span>
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
                            <Button onClick={() => handleClaim(DEGEN_POOL_ADDRESS as `0x${string}`, DEGEN_POOL_ABI)} variant="outline" className="bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl w-full">
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
        isLoading={isPending}
      />
      <TxNotification 
        status={txStatus} 
        hash={hash} 
        onClose={() => setTxStatus(null)} 
      />
    </>
  );
}
