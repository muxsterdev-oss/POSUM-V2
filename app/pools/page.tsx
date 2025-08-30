// app/pools/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther, parseUnits } from "viem";
import { motion } from 'framer-motion';
import AppHeader from '@/app/components/AppHeader';
import PixelBackground from "@/app/components/PixelBackground";
import ActionModal from '@/app/components/ActionModal'; 
import TxNotification, { TxStatus } from '@/app/components/TxNotification';
import { useQueryClient } from '@tanstack/react-query';
import { foundryWithPublicRpc } from '@/app/providers';
import DegenPoolCard from '@/app/components/DegenPoolCard';
import PositivePoolCard from '@/app/components/PositivePoolCard';
import IgnitionPoolCard from '@/app/components/IgnitionPoolCard';

// --- CONTRACT ADDRESSES & ABIs ---
const POOL_FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; 
const DEGEN_POOL_ADDRESS = '0xa16E02E87b7454126E5E10d957A927A7F5B5d2be'; 
const POSITIVE_POOL_USDC_ADDRESS = '0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968';

// --- ABIs ---
const POOL_FACTORY_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"createDegenPool","inputs":[{"name":"_treasuryWallet","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"createPositivePool","inputs":[{"name":"_assetAddress","type":"address","internalType":"address"},{"name":"_lockDurationSeconds","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"degenPools","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getDegenPoolCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getPositivePoolCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"poolInfo","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"poolType","type":"uint8","internalType":"enum PoolFactory.PoolType"},{"name":"poolAddress","type":"address","internalType":"address"},{"name":"assetAddress","type":"address","internalType":"address"},{"name":"createdAt","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"positivePoolVaults","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"PoolCreated","inputs":[{"name":"poolType","type":"uint8","indexed":true,"internalType":"enum PoolFactory.PoolType"},{"name":"poolAddress","type":"address","indexed":true,"internalType":"address"},{"name":"assetAddress","type":"address","indexed":false,"internalType":"address"},{"name":"creator","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]}];
const DEGEN_POOL_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"initialTreasury","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"ANNUAL_PERCENTAGE_RATE_BPS","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"TREASURY_FEE_BPS","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"YIELD_PER_SECOND_PER_SHARE","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"claim","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getPendingRewards","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getRewardPerShare","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getTotalClaimable","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"lastUpdateTime","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueTokens","inputs":[{"name":"_tokenAddress","type":"address","internalType":"address"},{"name":"_to","type":"address","internalType":"address"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rewards","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"setTreasuryWallet","inputs":[{"name":"_newTreasuryWallet","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalDeposited","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"treasuryWallet","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"userShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userSumPoints","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"event","name":"Claimed","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"userAmount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"feeAmount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesIssued","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokenRescued","inputs":[{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"TreasuryWalletUpdated","inputs":[{"name":"newTreasuryWallet","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]}]; 
const POSITIVE_POOL_VAULT_ABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"},{"name":"_assetAddress","type":"address","internalType":"address"},{"name":"_flexMultiplier","type":"uint16","internalType":"uint16"},{"name":"_lockedMultiplier","type":"uint16","internalType":"uint16"},{"name":"_lockDurationSeconds","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"COMPOUND_V3_USDbC","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ICompoundV3"}],"stateMutability":"view"},{"type":"function","name":"FLEX_MULTIPLIER","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"LOCKED_MULTIPLIER","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"asset","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20"}],"stateMutability":"view"},{"type":"function","name":"convertExpiredLock","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[{"name":"_amount","type":"uint256","internalType":"uint256"},{"name":"_isLocked","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getContractValue","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getCurrentSumPoints","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"lockDuration","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"previewDeposit","inputs":[{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"shares","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"previewWithdraw","inputs":[{"name":"_shares","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueTokens","inputs":[{"name":"_tokenAddress","type":"address","internalType":"address"},{"name":"_to","type":"address","internalType":"address"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalFlexShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalLockedShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"userFlexShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userLockEndDate","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userLockedShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"userSumPoints","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[{"name":"_shares","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdrawMax","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesIssued","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"isLocked","type":"bool","indexed":false,"internalType":"bool"}],"anonymous":false},{"type":"event","name":"LockConverted","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"shares","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"LockExtended","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"newEndDate","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokenRescued","inputs":[{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Withdrawn","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"sharesBurned","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]},{"type":"error","name":"ReentrancyGuardReentrantCall","inputs":[]},{"type":"error","name":"SafeERC20FailedOperation","inputs":[{"name":"token","type":"address","internalType":"address"}]}];
const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

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
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>(undefined);
  const [txStatus, setTxStatus] = useState<TxStatus>(null);

  const { writeContract, isPending } = useWriteContract();
  const queryClient = useQueryClient();

  const { data: usdcAllowance, refetch: refetchUsdcAllowance } = useReadContract({ address: positivePoolTokens[1].address, abi: ERC20_ABI, functionName: 'allowance', args: [address!, POSITIVE_POOL_USDC_ADDRESS as `0x${string}`], enabled: isConnected && !!address });

  useWaitForTransactionReceipt({ hash: approveHash, confirmations: 1, onSuccess: (data) => { if (data.status === 'success') { refetchUsdcAllowance(); setTxStatus('success'); } else { setTxStatus('error'); } } });
  useWaitForTransactionReceipt({ hash, confirmations: 1, onSuccess: (data) => { if (data.status === 'success') { queryClient.invalidateQueries(); setTxStatus('success'); } else { setTxStatus('error'); } }, onError: () => setTxStatus('error') });

  useEffect(() => { setIsClient(true); }, []);

  const { data: degenPoolTVL } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'totalDeposited', watch: true });
  const { data: positivePoolTVL } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'getContractValue', watch: true });
  const { data: userDegenShares } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'userShares', args: [address!], enabled: isConnected, watch: true });
  const { data: degenSumPoints } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'getCurrentSumPoints', args: [address!], enabled: isConnected, watch: true });
  const { data: positiveSumPoints } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'getCurrentSumPoints', args: [address!], enabled: isConnected, watch: true });
  const totalSumPoints = (degenSumPoints as bigint || 0n) + (positiveSumPoints as bigint || 0n);
  const { data: degenYield } = useReadContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'getTotalClaimable', args: [address!], enabled: isConnected, watch: true });
  const { data: positiveYield } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'claimableYield', args: [address!], enabled: isConnected, watch: true });
  const { data: userPositiveShares } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'userFlexShares', args: [address!], enabled: isConnected, watch: true });
  const { data: userPositiveDepositValue } = useReadContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'previewWithdraw', args: [userPositiveShares as bigint], enabled: isConnected && !!userPositiveShares, watch: true });

  const handleOpenModal = (pool: 'Degen' | 'Positive', action: 'Deposit' | 'Withdraw' | 'Claim', tokens?: typeof positivePoolTokens) => {
    setActivePool(pool);
    setModalAction(action);
    setActivePoolTokens(tokens);
    setIsModalOpen(true);
  };

  const onSuccess = (txHash: `0x${string}`) => { setHash(txHash); setTxStatus('pending'); setIsModalOpen(false); };
  const onError = (error: Error) => { console.error("Transaction Error:", error); setTxStatus('error'); setIsModalOpen(false); };
  const onRejection = () => { console.log("User rejected transaction"); setIsModalOpen(false); };

  const handleApprove = (amount: string) => {
    writeContract({ address: positivePoolTokens[1].address!, abi: ERC20_ABI, functionName: 'approve', args: [POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, parseUnits(amount, 6)], }, { onSuccess: (txHash) => { setApproveHash(txHash); setTxStatus('pending'); }, onError: (error) => { console.error("Approve Error:", error); setTxStatus('error'); }, onRejection: () => console.log("User rejected approval") });
  };

  const handleModalSubmit = (amount: string, selectedToken: { symbol: string, decimals: number, address?: `0x${string}` }, isLocked?: boolean) => {
    const amountBigInt = parseUnits(amount, selectedToken.decimals);
    if (activePool === 'Positive' && modalAction === 'Deposit') {
      if (selectedToken.symbol === 'USDC') {
        writeContract({ address: POSITIVE_POOL_USDC_ADDRESS as `0x${string}`, abi: POSITIVE_POOL_VAULT_ABI, functionName: 'deposit', args: [amountBigInt, isLocked || false], }, { onSuccess, onError, onRejection });
      } else {
        console.error("ETH deposits to Positive Pool are not supported by this contract yet.");
        setIsModalOpen(false);
      }
    } else if (activePool === 'Degen' && modalAction === 'Deposit') {
      writeContract({ address: DEGEN_POOL_ADDRESS as `0x${string}`, abi: DEGEN_POOL_ABI, functionName: 'deposit', value: parseEther(amount), }, { onSuccess, onError, onRejection });
    } else {
      console.log(`${modalAction} ${amount} ${selectedToken.symbol} for ${activePool} Pool`);
      setIsModalOpen(false);
    }
  };

  const handleClaim = (poolAddress: `0x${string}`, abi: any) => {
    writeContract({ address: poolAddress, abi, functionName: 'claim' }, { onSuccess: (txHash) => { setHash(txHash); setTxStatus('pending'); }, onError, onRejection: () => console.log("User rejected claim") });
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
                    <p className="text-3xl font-bold font-mono text-amber-300 mt-1">{formatEther(totalSumPoints)} <span className="text-sm text-gray-500">SUM</span></p>
                    <p className="text-xs text-gray-500 mt-2">These points will determine your allocation for the future POSUM token launch.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <DegenPoolCard
                isConnected={isConnected}
                tvl={degenPoolTVL as bigint}
                userDeposit={userDegenShares as bigint}
                claimableYield={degenYield as bigint}
                onDeposit={() => handleOpenModal('Degen', 'Deposit')}
                onClaim={() => handleClaim(DEGEN_POOL_ADDRESS, DEGEN_POOL_ABI)}
              />
              <PositivePoolCard
                isConnected={isConnected}
                tvl={positivePoolTVL as bigint}
                userDeposit={userPositiveDepositValue as bigint}
                claimableYield={positiveYield as bigint}
                onDeposit={() => handleOpenModal('Positive', 'Deposit', positivePoolTokens)}
                onWithdraw={() => handleOpenModal('Positive', 'Withdraw', positivePoolTokens)}
                onClaim={() => handleClaim(POSITIVE_POOL_USDC_ADDRESS, POSITIVE_POOL_VAULT_ABI)}
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