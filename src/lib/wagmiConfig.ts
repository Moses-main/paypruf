import { createConfig, http, fallback } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

// Helper to get environment variables with fallback
const getEnv = (key: string, defaultValue: string) => 
  import.meta.env[key] || defaultValue;

// Primary RPC endpoints
const FLARE_RPC = getEnv('VITE_FLARE_RPC_URL', 'https://flare-api.flare.network/ext/C/rpc');
const COSTON2_RPC = getEnv('VITE_COSTON2_RPC_URL', 'https://coston2-api.flare.network/ext/C/rpc');

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
    default: { http: [FLARE_RPC] },
  },
  blockExplorers: {
    default: { 
      name: 'Flare Explorer', 
      url: 'https://flare-explorer.flare.network' 
    },
  },
});

// Define Coston2 Testnet
export const coston2 = defineChain({
  id: 114,
  name: 'Coston2',
  nativeCurrency: {
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [COSTON2_RPC] },
  },
  blockExplorers: {
    default: { 
      name: 'Coston2 Explorer', 
      url: 'https://coston2-explorer.flare.network' 
    },
  },
  testnet: true,
});

// Active chains (mainnet + testnet in dev)
export const supportedChains = import.meta.env.DEV 
  ? [flare, coston2] as const
  : [flare] as const;

// WalletConnect configuration
const WALLETCONNECT_PROJECT_ID = getEnv('VITE_WALLETCONNECT_PROJECT_ID', '3fcc6bba6f1de962d911bb5b5c3dba68');

// Transport configuration with retry and timeout
const createTransport = (url: string) => 
  http(url, {
    retryCount: 2,
    retryDelay: 1_000,
    timeout: 10_000,
  });

// Create a type-safe config
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: 'PayProof',
        description: 'Proof-of-Payment on Flare Network',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['https://paypruf.lovable.app/favicon.ico'],
      },
    }),
  ],
  transports: {
    [flare.id]: fallback([createTransport(FLARE_RPC)]),
    [coston2.id]: fallback([createTransport(COSTON2_RPC)]),
  },
});
