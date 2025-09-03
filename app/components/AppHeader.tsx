// app/components/AppHeader.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import { cn } from '@/lib/utils';
import { ConnectKitButton } from 'connectkit'; // 1. IMPORT THE BUTTON

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export default function AppHeader() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  
  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance } = useBalance({ 
    address, 
    token: USDC_ADDRESS 
  });

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/forage', label: 'Forage' },
    { href: '/pools', label: 'Pools' },
    { href: '/roadmap', label: 'Roadmap' },

  ];

  return (
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
      <div className="flex items-center gap-4">
        {isConnected && (
          <div className="hidden sm:flex items-center gap-2 bg-[#1e1e1e] border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono">
            <span>{ethBalance ? `${parseFloat(ethBalance.formatted).toFixed(4)} ETH` : '0.00 ETH'}</span>
            <span className="text-gray-600">|</span>
            <span>{usdcBalance ? `${parseFloat(usdcBalance.formatted).toFixed(2)} USDC` : '0.00 USDC'}</span>
          </div>
        )}
        {/* --- 2. REPLACE OUR CUSTOM BUTTON WITH THE DEFAULT --- */}
        <ConnectKitButton />
      </div>
    </header>
  );
}
