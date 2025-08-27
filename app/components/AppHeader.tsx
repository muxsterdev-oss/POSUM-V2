// app/components/AppHeader.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const Wallet = dynamic(() => import('@coinbase/onchainkit/wallet').then(mod => mod.Wallet), { ssr: false });

export default function AppHeader() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/forage', label: 'Forage' },
    { href: '/pools', label: 'Pools' },
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
                // --- CHANGED THIS LINE ---
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
      <Wallet />
    </header>
  );
}
