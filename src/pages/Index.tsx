import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { WalletConnect } from '@/components/WalletConnect';
import { PaymentForm } from '@/components/PaymentForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useWallet } from '@/hooks/useWallet';
import { Transaction, ProofRecord } from '@/types/transaction';
import { generateMockTransactions, generateProofRecord } from '@/lib/transactions';
import { Coins, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const wallet = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>(generateMockTransactions());
  const [proofCache, setProofCache] = useState<Map<string, ProofRecord>>(new Map());

  const handleSendPayment = useCallback(async (data: Omit<Transaction, 'id' | 'hash' | 'timestamp' | 'status'>) => {
    // Simulate transaction processing with confirmation
    toast.loading('Processing payment...', { id: 'payment' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTx: Transaction = {
      id: Date.now().toString(),
      hash: '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      recipient: data.recipient,
      amount: parseFloat(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      memo: data.memo,
      timestamp: new Date(),
      status: 'confirmed',
      acknowledged: false,
    };
    
    setTransactions(prev => [newTx, ...prev]);
    toast.success('Payment confirmed!', { id: 'payment' });
  }, []);

  const handleGenerateProof = useCallback((tx: Transaction): ProofRecord => {
    // Check cache first
    const cached = proofCache.get(tx.id);
    if (cached) return cached;
    
    const proof = generateProofRecord(tx, wallet.address || '0x0000000000000000000000000000000000000000');
    setProofCache(prev => new Map(prev).set(tx.id, proof));
    return proof;
  }, [wallet.address, proofCache]);

  const handleDownload = useCallback((proof: ProofRecord, format: 'json' | 'xml') => {
    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'json') {
      content = JSON.stringify(proof, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      content = `<?xml version="1.0" encoding="UTF-8"?>
<ProofRecord xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <ProofId>${proof.proofId}</ProofId>
  <TransactionHash>${proof.hash}</TransactionHash>
  <Amount currency="${proof.currency}">${proof.amount}</Amount>
  <Sender>${proof.sender}</Sender>
  <Recipient>${proof.recipient}</Recipient>
  <Memo>${proof.memo}</Memo>
  <Timestamp>${proof.timestamp}</Timestamp>
  <Network>${proof.network}</Network>
  <GeneratedAt>${proof.generatedAt}</GeneratedAt>
  <Acknowledged>${proof.acknowledged || false}</Acknowledged>
</ProofRecord>`;
      mimeType = 'application/xml';
      extension = 'xml';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-${proof.proofId}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${format.toUpperCase()} proof`);
  }, []);

  const handleShare = useCallback((tx: Transaction): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/proof/${tx.id}`;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(16,85%,60%,0.08),transparent_50%)] pointer-events-none" />
      
      <Header>
        <WalletConnect
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          address={wallet.address}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
      </Header>

      <main className="container px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="gradient-text">PayProof</span> on Flare
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Send USDT0 payments with verifiable, shareable, and ISO-compliant payment proofs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="glass-card p-4 text-center">
            <Coins className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold">{transactions.length}</div>
            <div className="text-xs text-muted-foreground">Transactions</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold">100%</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Zap className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold">&lt;3s</div>
            <div className="text-xs text-muted-foreground">Finality</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <PaymentForm
            isWalletConnected={wallet.isConnected}
            onSubmit={handleSendPayment}
          />
          <TransactionHistory
            transactions={transactions}
            onGenerateProof={handleGenerateProof}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </div>
      </main>

      <footer className="container px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Built on Flare Network • USDT0 Stablecoin • PayProof Protocol
        </p>
      </footer>
    </div>
  );
};

export default Index;
