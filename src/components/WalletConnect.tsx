import { Wallet, LogOut, ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/transactions';
import { useState } from 'react';

interface WalletConnectProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnect = ({
  isConnected,
  isConnecting,
  address,
  onConnect,
  onDisconnect,
}: WalletConnectProps) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <Button
        variant="gradient"
        onClick={onConnect}
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
    );
  }

  return (
    <div className="relative">
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
