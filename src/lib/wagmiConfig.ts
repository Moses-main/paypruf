import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

// Define Flare Mainnet chain
export const flare = defineChain({
  id: 14,
  name: 'Flare',
  nativeCurrency: {
    name: 'Flare',
    symbol: 'FLR',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://flare-api.flare.network/ext/C/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flare Explorer',
      url: 'https://flare-explorer.flare.network',
    },
  },
});

// Define Flare Coston2 Testnet
export const coston2 = defineChain({
  id: 114,
  name: 'Coston2',
  nativeCurrency: {
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://coston2-api.flare.network/ext/C/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Coston2 Explorer',
      url: 'https://coston2-explorer.flare.network',
    },
  },
  testnet: true,
});

// WalletConnect project ID - users should replace with their own
const WALLETCONNECT_PROJECT_ID = '3fcc6bba6f1de962d911bb5b5c3dba68';

export const wagmiConfig = createConfig({
  chains: [flare, coston2],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'PayProof',
        description: 'Proof-of-Payment on Flare Network',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['https://paypruf.lovable.app/favicon.ico'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [flare.id]: http(),
    [coston2.id]: http(),
  },
});
