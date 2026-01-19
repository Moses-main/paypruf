import { Wallet, LogOut, ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/transactions';
import { useState, useRef, useEffect } from 'react';

interface WalletConnectProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  onConnect: () => void;
  onConnectWalletConnect?: () => void;
  onDisconnect: () => void;
  hasInjectedWallet?: boolean;
}

export const WalletConnect = ({
  isConnected,
  isConnecting,
  address,
  onConnect,
  onConnectWalletConnect,
  onDisconnect,
  hasInjectedWallet = true,
}: WalletConnectProps) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowConnectOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isConnected) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="gradient"
          onClick={() => {
            if (onConnectWalletConnect && !hasInjectedWallet) {
              // No MetaMask, show options or direct WalletConnect
              setShowConnectOptions(true);
            } else {
              onConnect();
            }
          }}
          disabled={isConnecting}
          className="gap-2"
        >
          {isConnecting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>

        {showConnectOptions && !isConnecting && (
          <div className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-50 animate-fade-in">
            <button
              onClick={() => {
                onConnect();
                setShowConnectOptions(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-secondary transition-colors"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="MetaMask"
                className="h-5 w-5"
              />
              MetaMask
            </button>
            {onConnectWalletConnect && (
              <button
                onClick={() => {
                  onConnectWalletConnect();
                  setShowConnectOptions(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-secondary transition-colors"
              >
                <img
                  src="https://registry.walletconnect.org/v2/logo/sm/c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96?projectId=3fcc6bba6f1de962d911bb5b5c3dba68"
                  alt="WalletConnect"
                  className="h-5 w-5 rounded"
                />
                WalletConnect
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="gap-2 font-mono"
      >
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        {formatAddress(address || '')}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 glass-card p-2 z-50 animate-fade-in">
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
            Copy Address
          </button>
          <button
            onClick={() => {
              onDisconnect();
              setShowDropdown(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
