import { createConfig, http, fallback } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

// Helper to get environment variables with fallback
const getEnv = (key: string, fallback: string) => 
  import.meta.env[key] || fallback;

// Primary RPC endpoints
const FLARE_RPC = getEnv('VITE_FLARE_RPC_URL', 'https://flare-api.flare.network/ext/C/rpc');
const COSTON2_RPC = getEnv('VITE_COSTON2_RPC_URL', 'https://coston2-api.flare.network/ext/C/rpc');

// Define Flare Mainnet chain with optimized configuration
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
  batch: {
    multicall: {
      batchSize: 1024 * 200,
    },
  },
  pollingInterval: 12_000,
});

// Only include testnet in development
const testnetChains = import.meta.env.DEV ? [
  defineChain({
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
    testnet: true,
  })
] : [];

// Active chains (mainnet + testnet if in development)
export const supportedChains = [flare, ...testnetChains] as const;

// WalletConnect configuration
const WALLETCONNECT_PROJECT_ID = getEnv('VITE_WALLETCONNECT_PROJECT_ID', '3fcc6bba6f1de962d911bb5b5c3dba68');

// Transport configuration with retry and timeout
const createTransport = (url: string) => 
  http(url, {
    retryCount: 2,
    retryDelay: 1_000,
    timeout: 10_000,
  });

// Create transports for all chains with proper typing
const transports = supportedChains.reduce<Record<number, ReturnType<typeof fallback>>>(
  (acc, chain) => {
    acc[chain.id] = fallback([
      createTransport(chain.rpcUrls.default.http[0]),
      // Add fallback RPCs here if available
    ]);
    return acc;
  },
  {} as Record<number, ReturnType<typeof fallback>>
);

// Lazy load WalletConnect connector to improve initial load time
const createWalletConnectConnector = () => 
  walletConnect({
    projectId: WALLETCONNECT_PROJECT_ID,
    showQrModal: true,
    qrModalOptions: {
      themeMode: 'light',
      themeVariables: {
        '--wcm-z-index': '9999',
      },
    },
    metadata: {
      name: 'PayProof',
      description: 'Proof-of-Payment on Flare Network',
      url: typeof window !== 'undefined' ? window.location.origin : '',
      icons: ['https://paypruf.lovable.app/favicon.ico'],
    },
  });

// Create a type-safe config
export const wagmiConfig = createConfig({
  chains: [...supportedChains],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    createWalletConnectConnector(),
  ],
  transports,
  // Batch RPC calls for better performance
  batch: {
    multicall: {
      wait: 16, // Wait up to 16ms for batching
      batchSize: 1024 * 200,
    },
  },
  // Cache frequently used data
  cacheTime: 60_000, // 1 minute
  // Auto-connect to previously used connector
  ssr: true,
  // Disable automatic reconnects to prevent UI flickering
  reconnectOnMount: false,
});
