import { Header } from '@/components/Header';
import { WalletConnect } from '@/components/WalletConnect';
import { PaymentForm } from '@/components/PaymentForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useWallet } from '@/hooks/useWallet';
import { Coins, Shield, Zap } from 'lucide-react';

const Index = () => {
  const wallet = useWallet();

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%)] pointer-events-none" />
      
      <Header>
        <WalletConnect
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          address={wallet.address}
          onConnect={wallet.connect}
          onConnectWalletConnect={wallet.connectWalletConnect}
          onDisconnect={wallet.disconnect}
          hasInjectedWallet={wallet.hasInjectedWallet}
        />
      </Header>

      <main className="container px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="gradient-text">PayProof</span> on Flare
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Send payments with verifiable, shareable, and ISO-compliant payment proofs anchored on Flare
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="glass-card p-4 text-center">
            <Coins className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold">Flare</div>
            <div className="text-xs text-muted-foreground">Network</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold">ISO 20022</div>
            <div className="text-xs text-muted-foreground">Compliant</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Zap className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold">&lt;3s</div>
            <div className="text-xs text-muted-foreground">Finality</div>
          </div>
        </div>

        {/* User Guide */}
        <div className="glass-card p-6 mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            How to Use PayProof
          </h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">1</span>
              <span>
                <strong className="font-medium text-foreground">Add Flare Network to your wallet</strong>
                <br />
                Visit <a href="https://coston2-explorer.flare.network/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Flare Explorer</a>, scroll down and click "Add Network" to add Flare Network to your wallet.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">2</span>
              <span>
                <strong className="font-medium text-foreground">Get Test Tokens</strong>
                <br />
                Go to <a href="https://faucet.flare.network/coston2" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Flare Faucet</a> to get C2FLR tokens for transactions on the Coston2 testnet.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">3</span>
              <span>
                <strong className="font-medium text-foreground">Connect Wallet</strong>
                <br />
                Click "Connect Wallet" at the top right and authorize the connection in your wallet.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">4</span>
              <span>
                <strong className="font-medium text-foreground">Send Payment</strong>
                <br />
                Enter the recipient's wallet address, amount, and any additional details, then click "Send Payment".
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">5</span>
              <span>
                <strong className="font-medium text-foreground">View & Share Receipt</strong>
                <br />
                After the transaction is confirmed, you can view, download, or share the payment receipt using the provided link.
              </span>
            </li>
          </ol>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <PaymentForm />
          <TransactionHistory />
        </div>
      </main>

      <footer className="container px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Built on Flare Network • ProofRails Protocol • PayProof
        </p>
      </footer>
    </div>
  );
};

export default Index;
