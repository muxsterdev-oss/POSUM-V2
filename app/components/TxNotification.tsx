// app/components/TxNotification.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, LoaderCircle } from 'lucide-react';
import Link from 'next/link';

export type TxStatus = 'pending' | 'success' | 'error' | null;

interface TxNotificationProps {
  status: TxStatus;
  hash?: `0x${string}`;
  onClose: () => void;
}

const statusInfo = {
  pending: {
    icon: <LoaderCircle className="w-6 h-6 animate-spin text-blue-400" />,
    title: 'Transaction Sent',
    message: 'Your transaction is being processed by the network.',
  },
  success: {
    icon: <CheckCircle className="w-6 h-6 text-green-400" />,
    title: 'Transaction Confirmed',
    message: 'Your transaction was successful.',
  },
  error: {
    icon: <AlertCircle className="w-6 h-6 text-red-400" />,
    title: 'Transaction Failed',
    message: 'Something went wrong with your transaction.',
  },
};

export default function TxNotification({ status, hash, onClose }: TxNotificationProps) {
  if (!status) return null;

  const { icon, title, message } = statusInfo[status];

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          className="fixed bottom-5 right-5 z-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="bg-[#2a2a2a] border border-gray-700 rounded-xl shadow-lg p-4 w-80">
            <div className="flex items-start gap-4">
              <div className="mt-1">{icon}</div>
              <div className="flex-1">
                <p className="font-bold text-white">{title}</p>
                <p className="text-sm text-gray-400 mt-1">{message}</p>
                {hash && (
                  <Link
                    href={`https://sepolia.basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-400 hover:underline mt-2 block"
                  >
                    View on Block Explorer
                  </Link>
                )}
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
