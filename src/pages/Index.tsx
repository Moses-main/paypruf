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
