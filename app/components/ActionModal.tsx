// app/components/ActionModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

interface TokenOption {
  symbol: string;
  address?: `0x${string}`; // Address is optional (for native ETH)
  decimals: number;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'Deposit' | 'Withdraw' | 'Claim';
  poolName: string;
  tokenOptions?: TokenOption[];
  onSubmit: (amount: string, selectedToken: TokenOption) => void;
  isLoading: boolean;
}

export default function ActionModal({
  isOpen,
  onClose,
  actionType,
  poolName,
  tokenOptions,
  onSubmit,
  isLoading,
}: ActionModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenOption>(tokenOptions ? tokenOptions[0] : { symbol: 'ETH', decimals: 18 });
  const { address } = useAccount();

  const { data: balance } = useBalance({
    address,
    token: selectedToken.address,
    query: {
      enabled: isOpen, // Only fetch when the modal is open
    },
  });

  const handleSubmit = () => {
    onSubmit(amount, selectedToken);
  };

  const handleMaxClick = () => {
    if (balance) {
      setAmount(balance.formatted);
    }
  };

  if (!isOpen) {
    return null;
  }

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
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">{`${actionType} ${poolName}`}</h3>
                
                <div className="space-y-4">
                  {tokenOptions && actionType === 'Deposit' && (
                    <div>
                      <label className="text-sm text-gray-400">Select Currency</label>
                      <div className="flex gap-2 mt-1">
                        {tokenOptions.map((token) => (
                          <Button
                            key={token.symbol}
                            variant={selectedToken.symbol === token.symbol ? 'default' : 'outline'}
                            onClick={() => setSelectedToken(token)}
                            className={
                              selectedToken.symbol === token.symbol
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
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-gray-400">Amount ({selectedToken.symbol})</label>
                      <span className="text-xs text-gray-500">
                        Balance: {balance ? parseFloat(balance.formatted).toFixed(4) : '0.00'}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="bg-gray-900 border-gray-700 text-white mt-1 pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button onClick={handleMaxClick} variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-orange-400 hover:bg-gray-800">
                        Max
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-300 text-black font-semibold rounded-xl"
                  >
                    {isLoading ? 'Processing...' : `Confirm ${actionType}`}
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
