// app/pools/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import PixelBackground from "../components/PixelBackground";
import ActionModal from '../components/ActionModal'; 
import TxNotification, { TxStatus } from '../components/TxNotification';
import { useQueryClient } from '@tanstack/react-query';
import DegenPoolCard from '../components/DegenPoolCard';
import PositivePoolCard from '../components/PositivePoolCard';
import IgnitionPoolCard from '../components/IgnitionPoolCard';

// --- FINAL, LIVE BASE SEPOLIA TESTNET ADDRESSES ---
const POOL_FACTORY_ADDRESS = '0x90884826B09Bb7879Ad057f67F41c9DdEceda1c7'; 
const DEGEN_POOL_ADDRESS = '0x4fdFC2e66b2c2FB59E8c7b2553Ca77424BE0Ce96'; 
const POSITIVE_POOL_USDC_ADDRESS = '0xe8c925e2F6df198B509077EBF26c0552b418509e';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

// --- ABIs ---
const DEGEN_POOL_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"_posumTokenAddress","type":"address","internalType":"address"},{"name":"_uniswapRouterAddress","type":"address","internalType":"address"},{"name":"_priceFeedAddress","type":"address","internalType":"address"},{"name":"_liquidityReceiver","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"DEPOSIT_LOCK_DURATION","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"FOUNDERS_WEEK_CAP","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"FOUNDERS_WEEK_DURATION","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"claimPrincipal","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"launchTimestamp","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"liquidityReceiver","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"posumToken","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract POSUM"}],"stateMutability":"view"},{"type":"function","name":"priceFeed","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract AggregatorV3Interface"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setLiquidityReceiver","inputs":[{"name":"_newReceiver","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"uniswapRouter","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IUniswapV2Router"}],"stateMutability":"view"},{"type":"function","name":"userDeposits","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userPrincipalClaimable","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userUnlockTimestamp","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"ethAmount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"liquidityAmount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"PrincipalClaimed","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}]}]; 
const POSITIVE_POOL_VAULT_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"_assetAddress","type":"address","internalType":"address"},{"name":"_compoundMarketAddress","type":"address","internalType":"address"},{"name":"_rewardTokenAddress","type":"address","internalType":"address"},{"name":"_priceFeedAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"ASSET","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20Metadata"}],"stateMutability":"view"},{"type":"function","name":"COMPOUND_MARKET","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ICompoundV3"}],"stateMutability":"view"},{"type":"function","name":"REWARD_TOKEN","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20Metadata"}],"stateMutability":"view"},{"type":"function","name":"claimYield","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"claimableYield","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"deposit","inputs":[{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getContractValue","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getPendingRewards","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getRewardPerShare","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"lastUpdateTime","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueTokens","inputs":[{"name":"_token","type":"address","internalType":"address"},{"name":"_to","type":"address","internalType":"address"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rewards","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"userShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userSumPoints","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[{"name":"_shares","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesIssued","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokenRescued","inputs":[{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Withdrawn","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesBurned","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"YieldClaimed","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}]}];
const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

const positivePoolTokens = [
  { symbol: 'USDC', address: USDC_ADDRESS, decimals: 6 },
];

const degenPoolToken = { symbol: 'ETH', address: undefined, decimals: 18 };

export default function PoolsPage() {
  const { isConnected, address, chainId } = useAccount();
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'Deposit' | 'Withdraw' | 'Claim'>('Deposit');
  const [activePool, setActivePool] = useState<'Degen' | 'Positive' | null>(null);
  const [activePoolTokens, setActivePoolTokens] = useState<typeof positivePoolTokens | typeof degenPoolToken[] | undefined>(undefined);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>(undefined);
  const [txStatus, setTxStatus] = useState<TxStatus>(null);

  const { writeContractAsync, isPending } = useWriteContract();
  const queryClient = useQueryClient();

  const { data: usdcAllowance, refetch: refetchUsdcAllowance } = useReadContract({
    address: positivePoolTokens[0].address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, POSITIVE_POOL_USDC_ADDRESS as `0x${string}`],
    query: { enabled: isConnected && !!address },
  });

  const { isSuccess: isApproveSuccess, isError: isApproveError } = useWaitForTransactionReceipt({ 
    hash: approveHash,
    chainId,
  });

  useEffect(() => {
    if (isApproveSuccess) {
      refetchUsdcAllowance();
      setTxStatus('success');
      setApproveHash(undefined);
    }
    if (isApproveError) {
      setTxStatus('error');
      setApproveHash(undefined);
    }
  }, [isApproveSuccess, isApproveError, refetchUsdcAllowance]);


  const { isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({ 
    hash,
    chainId,
  });

  useEffect(() => {
    if (isTxSuccess) {
      queryClient.invalidateQueries();
      setTxStatus('success');
      setHash(undefined);
    }
    if (isTxError) {
      setTxStatus('error');
      setHash(undefined);
    }
  }, [isTxSuccess, isTxError, queryClient]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: degenPoolTVL } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'userDeposits', args: [address!], query: { enabled: isConnected } });
  const { data: positivePoolTVL } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'getContractValue'});
  const { data: userDegenShares } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'userPrincipalClaimable', args: [address!], query: { enabled: isConnected } });
  const { data: degenSumPoints } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'getCurrentSumPoints', args: [address!], query: { enabled: isConnected } });
  const { data: positiveSumPoints } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'getCurrentSumPoints', args: [address!], query: { enabled: isConnected } });
  const totalSumPoints = (degenSumPoints as bigint || BigInt(0)) + (positiveSumPoints as bigint || BigInt(0));
  const { data: degenYield } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'getTotalClaimable', args: [address!], query: { enabled: isConnected } });
  const { data: positiveYield } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'claimableYield', args: [address!], query: { enabled: isConnected } });
  const { data: userPositiveShares } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'userShares', args: [address!], query: { enabled: isConnected } });
  
  const { data: userPositiveDepositValue } = useReadContract({ 
    address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, 
    abi: POSITIVE_POOL_VAULT_ABI, 
    functionName: 'userShares', 
    args: [address!], 
    query: { enabled: isConnected && !!userPositiveShares } 
  });

  const handleOpenModal = (pool: 'Degen' | 'Positive', action: 'Deposit' | 'Withdraw' | 'Claim', tokens?: any) => {
    setActivePool(pool);
    setModalAction(action);
    setActivePoolTokens(tokens);
    setIsModalOpen(true);
  };
  
  const handleTransaction = async (txFunction: () => Promise<`0x${string}`>) => {
    try {
      setTxStatus('pending');
      setIsModalOpen(false);
      const txHash = await txFunction();
      setHash(txHash);
    } catch (error: any) {
      console.error("Transaction Error:", error);
      if (error.shortMessage && error.shortMessage.includes('User rejected the request')) {
        console.log("User rejected transaction");
        setTxStatus(null);
      } else {
        setTxStatus('error');
      }
      setIsModalOpen(false);
    }
  };
  
  const handleApprove = async (amount: string) => {
    try {
      setTxStatus('pending');
      const txHash = await writeContractAsync({ address: positivePoolTokens[0].address!, abi: ERC20_ABI, functionName: 'approve', args: [POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, parseUnits(amount, 6)], });
      setApproveHash(txHash);
    } catch (error: any) {
      console.error("Approve Error:", error);
      if (!error.shortMessage?.includes('User rejected the request')) {
        setTxStatus('error');
      }
    }
  };
  
  const handleModalSubmit = async (amount: string, selectedToken: { symbol: string, decimals: number, address?: `0x${string}` }) => {
    const amountBigInt = parseUnits(amount, selectedToken.decimals);
    if (activePool === 'Positive' && modalAction === 'Deposit') {
      if (selectedToken.symbol === 'USDC') {
        await handleTransaction(() => writeContractAsync({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'deposit', args: [amountBigInt] }));
      }
    } else if (activePool === 'Degen' && modalAction === 'Deposit') {
      await handleTransaction(() => writeContractAsync({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'deposit', value: parseEther(amount) }));
    }
  };
  
  const handleClaim = async (poolAddress: `0x${string}`, abi: any, functionName: 'claim' | 'claimYield' | 'claimPrincipal' = 'claim') => {
    await handleTransaction(() => writeContractAsync({ address: poolAddress, abi, functionName, args: [] }));
  };

  if (!isClient) return null;

  return (
    <>
      <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#222222] min-h-screen text-white font-sans">
        <PixelBackground />
        <div className="relative z-10">
          <AppHeader />
          <div className="container mx-auto px-4 py-8">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">POΣUM POOLS</h1>
              <p className="mt-4 text-lg text-gray-400">{isConnected ? "Manage your positions and track your rewards." : "Connect your wallet to deposit and start earning SUM."}</p>
            </motion.div>
            {isConnected && (
              <motion.div className="mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card className="bg-[#1e1e1e]/80 border border-gray-700 max-w-sm mx-auto">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-400">Your SUM Points Balance</p>
                    <p className="text-3xl font-bold font-mono text-amber-300 mt-1">{parseFloat(formatEther(totalSumPoints)).toFixed(8)} <span className="text-sm text-gray-500">SUM</span></p>
                    <p className="text-xs text-gray-500 mt-2">These points will determine your allocation for the future POSUM token launch.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DegenPoolCard
                isConnected={isConnected}
                tvl={degenPoolTVL as bigint}
                userDeposit={userDegenShares as bigint}
                claimableYield={degenYield as bigint}
                onDeposit={() => handleOpenModal('Degen', 'Deposit', [degenPoolToken])}
                onClaim={() => handleClaim(DEGEN_POOL_ADDRESS, DEGEN_POOL_ABI, 'claimPrincipal')}
              />
              <PositivePoolCard
                isConnected={isConnected}
                tvl={positivePoolTVL as bigint}
                userDeposit={userPositiveDepositValue as bigint}
                claimableYield={positiveYield as bigint}
                onDeposit={() => handleOpenModal('Positive', 'Deposit', positivePoolTokens)}
                onWithdraw={() => handleOpenModal('Positive', 'Withdraw', positivePoolTokens)}
                onClaim={() => handleClaim(POSITIVE_POOL_USDC_ADDRESS, POSITIVE_POOL_VAULT_ABI, 'claimYield')}
              />
              <IgnitionPoolCard />
            </div>
          </div>
        </div>
      </div>
      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType={modalAction}
        poolName={`${activePool} Pool`}
        tokenOptions={activePool === 'Degen' ? [degenPoolToken] : activePool === 'Positive' ? positivePoolTokens : undefined}
        onSubmit={handleModalSubmit}
        isLoading={isPending}
        allowance={usdcAllowance as bigint}
        onApprove={handleApprove}
      />
      <TxNotification 
        status={txStatus} 
        hash={hash} 
        onClose={() => setTxStatus(null)} 
      />
    </>
  );
}