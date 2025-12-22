import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base } from 'wagmi/chains';
import { reconnect } from '@wagmi/core';

// WalletConnect Project ID
const projectId = '8b68fe8730c4f8ac97065fb052022217';

// Metadata for WalletConnect
const metadata = {
  name: '$ongChainn',
  description: 'Music streaming on Base blockchain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://songchainn.app',
  icons: ['/favicon.png']
};

// Configure chains - Base mainnet only
const chains = [base] as const;

// Create wagmi config
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});

// Create Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#8B5CF6',
    '--w3m-border-radius-master': '12px',
  }
});

// Attempt to reconnect on load
reconnect(wagmiConfig);

export { projectId };
