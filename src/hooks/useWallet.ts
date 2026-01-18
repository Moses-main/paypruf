import { useState, useCallback } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
  });

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true }));
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a mock address
    const mockAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    setState({
      isConnected: true,
      address: mockAddress,
      isConnecting: false,
    });
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      isConnecting: false,
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
};
