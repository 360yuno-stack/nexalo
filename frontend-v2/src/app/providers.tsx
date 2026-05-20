'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, WagmiProvider, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { useState, type ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// 1. Get projectId
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1234567890abcdef1234567890abcdef';

// 2. Set up Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [bscTestnet, bsc]
});

// 3. Create config
export const config = wagmiAdapter.wagmiConfig;

// 4. Create AppKit
if (typeof window !== 'undefined') {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [bscTestnet, bsc],
    projectId,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-font-family': 'var(--font-inter)',
      '--w3m-accent': 'var(--color-primary)',
      '--w3m-border-radius-master': '1px'
    },
    features: {
      analytics: true
    }
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
