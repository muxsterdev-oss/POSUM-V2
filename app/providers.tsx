// app/providers.tsx
'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

const config = createConfig(
  getDefaultConfig({
    // Required
    walletConnectProjectId: "a800b40989f6b4d32575e247dcb17835", // IMPORTANT: REPLACE WITH YOUR OWN PROJECT ID

    // Required
    appName: 'POSUM Protocol',
    
    // Optional
    appDescription: 'A gamified, community-focused yield protocol.',
    appUrl: "https://github.com/muxsterdev-oss/POSUM-V2", 
    appIcon: "https://i.imgur.com/3v5L0s6.png", // You can replace this with your own logo URL

    // Required
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/2zGT7m_Rfup4CtrrZphvF`),
    },
  })
);

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};