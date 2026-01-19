import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useCallback, useMemo } from 'react';

export const useWallet = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Get available connectors
  const injectedConnector = useMemo(
    () => connectors.find((c) => c.id === 'injected'),
    [connectors]
  );
  const walletConnectConnector = useMemo(
    () => connectors.find((c) => c.id === 'walletConnect'),
    [connectors]
  );

  const connectInjected = useCallback(() => {
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  }, [connect, injectedConnector]);

  const connectWalletConnect = useCallback(() => {
    if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  }, [connect, walletConnectConnector]);

  // Default connect - prefer injected (MetaMask), fallback to WalletConnect
  const connectDefault = useCallback(() => {
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  }, [connect, injectedConnector, walletConnectConnector]);

  return {
    isConnected,
    isConnecting: isConnecting || isReconnecting || isPending,
    address: address || null,
    connect: connectDefault,
    connectInjected,
    connectWalletConnect,
    disconnect,
    hasInjectedWallet: !!injectedConnector,
    hasWalletConnect: !!walletConnectConnector,
  };
};
