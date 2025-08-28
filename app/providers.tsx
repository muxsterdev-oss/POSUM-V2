// app/providers.tsx
'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, base, foundry } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const queryClient = new QueryClient();

// --- 1. PASTE YOUR PROJECT ID DIRECTLY HERE ---
// This bypasses the .env.local file to fix the error.
const projectId = "fcdda7d4094cedb43445a47d909e5953";

const anvilRpcUrl = 'https://bookish-happiness-77696vvww9c4g6-8545.app.github.dev/'; 

export const foundryWithPublicRpc = {
  ...foundry,
  rpcUrls: {
    default: {
      http: [anvilRpcUrl],
    },
    public: {
      http: [anvilRpcUrl],
    },
  },
};

export const config = createConfig({
  chains: [mainnet, base, foundryWithPublicRpc],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
    coinbaseWallet({
      appName: 'POSUM Protocol',
      preference: 'smartWallet',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [foundryWithPublicRpc.id]: http(),
  },
});

// Create a provider component
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
