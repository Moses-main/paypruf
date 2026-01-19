import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { WalletError } from '../types/errors';
import { supportedChains } from '../lib/wagmiConfig';
import { Chain } from 'viem';

interface UseWalletReturn {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId?: number;
  chain?: { id: number; name: string; };
  error: Error | null;
  connect: () => Promise<void>;
  connectInjected: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
  hasInjectedWallet: boolean;
  hasWalletConnect: boolean;
  supportedChains: Array<{ id: number; name: string }>;
}

export const useWallet = (): UseWalletReturn => {
  const [error, setError] = useState<Error | null>(null);
  const [isExplicitlyConnecting, setIsExplicitlyConnecting] = useState(false);
  
  const { address, isConnected, isConnecting: isWagmiConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  // Get the current chain from the account
  const { chain } = useAccount();
  
  // Mock switchNetworkAsync for now since it's not available in the current wagmi version
  const switchNetworkAsync = useCallback(async (chainId: number) => {
    try {
      // In a real implementation, this would use the wallet's provider to switch networks
      console.log(`Switching to chain ${chainId}`);
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }, []);

  // Get available connectors with memoization
  const { injectedConnector, walletConnectConnector } = useMemo(() => {
    const injected = connectors.find((c) => c.id === 'injected' && c.name.toLowerCase() !== 'walletconnect');
    const walletConnect = connectors.find((c) => c.id === 'walletConnect');
    return { injectedConnector: injected, walletConnectConnector: walletConnect };
  }, [connectors]);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      setError(new WalletError(
        connectError.message,
        'CONNECTION_ERROR'
      ));
      setIsExplicitlyConnecting(false);
    }
  }, [connectError]);

  // Reset error when connected
  useEffect(() => {
    if (isConnected) {
      setError(null);
      setIsExplicitlyConnecting(false);
    }
  }, [isConnected]);

  // Connection handlers with loading states
  const connectWithErrorHandling = useCallback(async (connector: any) => {
    if (!connector) {
      setError(new WalletError('No wallet connector available', 'NO_CONNECTOR'));
      return;
    }

    try {
      setError(null);
      setIsExplicitlyConnecting(true);
      await connect({ connector });
    } catch (err) {
      const error = err as Error;
      setError(new WalletError(
        error.message || 'Failed to connect wallet',
        'CONNECTION_ERROR'
      ));
      throw error;
    } finally {
      setIsExplicitlyConnecting(false);
    }
  }, [connect]);

  const connectInjected = useCallback(async () => {
    if (!injectedConnector) {
      setError(new WalletError('No injected wallet found', 'NO_INJECTED_WALLET'));
      return;
    }
    return connectWithErrorHandling(injectedConnector);
  }, [connectWithErrorHandling, injectedConnector]);

  const connectWalletConnect = useCallback(async () => {
    if (!walletConnectConnector) {
      setError(new WalletError('WalletConnect not available', 'WALLETCONNECT_ERROR'));
      return;
    }
    return connectWithErrorHandling(walletConnectConnector);
  }, [connectWithErrorHandling, walletConnectConnector]);

  // Default connect - prefer injected (MetaMask), fallback to WalletConnect
  const connectDefault = useCallback(async () => {
    try {
      if (injectedConnector) {
        await connectInjected();
      } else if (walletConnectConnector) {
        await connectWalletConnect();
      } else {
        throw new WalletError('No wallet connectors available', 'NO_CONNECTORS');
      }
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }, [connectInjected, connectWalletConnect, injectedConnector, walletConnectConnector]);

  // Network switching
  const switchNetwork = useCallback(async (chainId: number) => {
    if (!switchNetworkAsync) {
      setError(new WalletError('Cannot switch networks', 'SWITCH_NETWORK_ERROR'));
      return false;
    }

    try {
      await switchNetworkAsync(chainId);
      return true;
    } catch (error) {
      const err = error as Error;
      setError(new WalletError(
        `Failed to switch network: ${err.message}`,
        'SWITCH_NETWORK_ERROR'
      ));
      return false;
    }
  }, [switchNetworkAsync]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    isConnected: isConnected && !!address,
    isConnecting: isWagmiConnecting || isReconnecting || isPending || isExplicitlyConnecting,
    address: address || null,
    chainId: chain?.id,
    chain: chain ? { id: chain.id, name: chain.name } : undefined,
    error,
    connect: connectDefault,
    connectInjected,
    connectWalletConnect,
    disconnect: () => {
      setError(null);
      disconnect();
    },
    switchNetwork,
    hasInjectedWallet: !!injectedConnector,
    hasWalletConnect: !!walletConnectConnector,
    supportedChains: supportedChains.map(chain => ({
      id: chain.id,
      name: chain.name,
    })),
  }), [
    isConnected,
    isWagmiConnecting,
    isReconnecting,
    isPending,
    isExplicitlyConnecting,
    address,
    chain,
    error,
    connectDefault,
    connectInjected,
    connectWalletConnect,
    disconnect,
    switchNetwork,
    injectedConnector,
    walletConnectConnector,
  ]);
};
