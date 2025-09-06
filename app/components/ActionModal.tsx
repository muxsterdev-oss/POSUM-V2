// app/components/ActionModal.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
// --- REMOVED Checkbox and Label imports ---
import { parseUnits } from 'viem';
import { useBalance } from 'wagmi';
import { useAccount } from 'wagmi';

interface TokenOption {
  symbol: string;
  address?: `0x${string}`;
  decimals: number;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'Deposit' | 'Withdraw' | 'Claim';
  poolName: string;
  tokenOptions?: TokenOption[];
  // --- REMOVED isLocked from onSubmit ---
  onSubmit: (amount: string, selectedToken: TokenOption) => void;
  isLoading: boolean;
  allowance?: bigint;
  onApprove?: (amount: string) => void;
}

export default function ActionModal({
  isOpen,
  onClose,
  actionType,
  poolName,
  tokenOptions = [],
  onSubmit,
  isLoading,
  allowance,
  onApprove,
}: ActionModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState(tokenOptions[0]?.symbol || '');
  // --- REMOVED isLocked state ---
  const { address } = useAccount();

  useEffect(() => {
    if (isOpen && tokenOptions.length > 0) {
      setSelectedTokenSymbol(tokenOptions[0].symbol);
    }
  }, [isOpen, tokenOptions]);

  const selectedToken = useMemo(() => {
    return tokenOptions.find(t => t.symbol === selectedTokenSymbol) || tokenOptions[0];
  }, [selectedTokenSymbol, tokenOptions]);
  
  const { data: walletBalance } = useBalance({
    address,
    token: selectedToken?.address,
  });

  const needsApproval = useMemo(() => {
    if (actionType !== 'Deposit' || !selectedToken || selectedToken.symbol !== 'USDC' || !amount || allowance === undefined) {
      return false;
    }
    try {
      const amountBigInt = parseUnits(amount, selectedToken.decimals);
      return allowance < amountBigInt;
    } catch (e) {
      return false;
    }
  }, [amount, selectedToken, allowance, actionType]);

  const handleSubmit = () => {
    if (needsApproval && onApprove) {
      onApprove(amount);
    } else {
      // --- REMOVED isLocked from onSubmit call ---
      onSubmit(amount, selectedToken);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-[#2a2a2a] border border-gray-700 w-[400px]">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">{`${actionType} from ${poolName}`}</h3>
                
                <div className="space-y-4">
                  {tokenOptions.length > 1 && (
                    <div>
                      <label className="text-sm text-gray-400">Select Currency</label>
                      <div className="flex gap-2 mt-1">
                        {tokenOptions.map((token) => (
                          <Button
                            key={token.symbol}
                            variant={selectedTokenSymbol === token.symbol ? 'default' : 'outline'}
                            onClick={() => setSelectedTokenSymbol(token.symbol)}
                            className={
                              selectedTokenSymbol === token.symbol
                                ? 'bg-orange-500 text-black border-orange-500'
                                : 'bg-transparent border-gray-600 text-gray-400'
                            }
                          >
                            {token.symbol}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-400">Amount ({selectedToken.symbol})</label>
                      <span className="text-xs text-gray-500">
                        Balance: {parseFloat(walletBalance?.formatted || '0').toFixed(4)}
                        <Button variant="link" className="text-orange-400 h-auto p-1 ml-1" onClick={() => setAmount(walletBalance?.formatted || '0')}>Max</Button>
                      </span>
                    </div>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="bg-gray-900 border-gray-700 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* --- REMOVED THE ENTIRE CHECKBOX SECTION --- */}
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-300 text-black font-semibold rounded-xl"
                  >
                    {isLoading ? 'Processing...' : needsApproval ? `Approve ${selectedToken.symbol}` : `Confirm ${actionType}`}
                  </Button>
                </div>

                <Button variant="ghost" onClick={onClose} className="w-full mt-2 text-gray-400">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

