// app/components/AppHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import WalletConnectModal from './WalletConnectModal';

// --- ADDED MOCK USDC ADDRESS ---
const USDC_TOKEN_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913';

export default function AppHeader() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 1. FETCH BALANCES ---
  const { data: ethBalance } = useBalance({
    address,
    watch: true,
  });

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_TOKEN_ADDRESS as `0x${string}`,
    watch: true,
  });

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/forage', label: 'Forage' },
    { href: '/pools', label: 'Pools' },
  ];

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <header className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 z-20 bg-[#1a1a1a]/80 backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
            POΣUM
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-lg font-medium transition-all duration-200 px-3 py-1 rounded-lg",
                  pathname === link.href 
                    ? "text-orange-400 bg-gradient-to-t from-orange-500/20 to-transparent" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              {/* --- 2. DISPLAY BALANCES --- */}
              <div className="hidden sm:flex items-center gap-4 bg-[#1e1e1e] border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono">
                <span>{parseFloat(ethBalance?.formatted || '0').toFixed(4)} ETH</span>
                <span className="text-gray-600">|</span>
                <span>{parseFloat(usdcBalance?.formatted || '0').toFixed(2)} USDC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#1e1e1e] border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono">
                  {formatAddress(address)}
                </span>
                <Button onClick={() => disconnect()} variant="outline" className="bg-transparent border-rose-400/50 text-rose-400 hover:bg-rose-400/10 hover:text-rose-400">
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-300 text-black font-semibold">
              Connect Wallet
            </Button>
          )}
        </div>
      </header>
      <WalletConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
