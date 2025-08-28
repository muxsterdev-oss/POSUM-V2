// app/components/WalletConnectModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useConnect } from 'wagmi';
import { config } from '@/app/providers'; // We'll import the config to get the connectors

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connect } = useConnect();
  const connectors = config.connectors;

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
            <Card className="bg-[#2a2a2a] border border-gray-700 w-[350px]">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-center">Connect Wallet</h3>
                <div className="space-y-3">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      onClick={() => {
                        connect({ connector });
                        onClose();
                      }}
                      className="w-full justify-start text-lg py-6 bg-[#1e1e1e] hover:bg-gray-800"
                    >
                      {/* We can add icons later */}
                      {connector.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
