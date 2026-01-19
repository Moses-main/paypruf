import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Send, History, Shield, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { usePayments } from '@/hooks/usePayments';
import { PaymentForm } from '@/components/PaymentForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { WalletConnect } from '@/components/WalletConnect';

// Extend the window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define types for the payment data
interface PaymentData {
  id: string;
  amount: string;
  recipientAddress: string;
  status: string;
  timestamp: string;
  memo?: string;
}

// Define types for the payment data
interface PaymentData {
  id: string;
  amount: string;
  recipientAddress: string;
  status: string;
  timestamp: string;
  memo?: string;
}

// Extend the window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define prop types for components
interface PaymentFormData {
  recipientAddress: string;
  amount: string;
  memo?: string;
}

interface PaymentFormProps {
  onSubmitPayment: (data: PaymentFormData) => Promise<void>;
  isSubmitting: boolean;
  isWalletConnected: boolean;
}

interface TransactionHistoryProps {
  payments: Array<{
    id: string;
    amount: string;
    recipientAddress: string;
    status: string;
    timestamp: string;
    memo?: string;
  }>;
  isLoading: boolean;
  onGenerateProof: (paymentId: string) => Promise<void>;
  onVerifyProof: (paymentId: string) => Promise<void>;
  onDownload: (paymentId: string, format: 'json' | 'xml') => void;
  isGeneratingProof: string | null;
  proofs: Record<string, any>;
  verificationResults: Record<string, any>;
}

type PaymentData = {
  recipientAddress: string;
  amount: string;
  memo?: string;
};

const Home = () => {
  const wallet = useWallet();
  const { 
    payments = [], 
    isLoading: isLoadingPayments, 
    createPayment, 
    isCreating: isCreatingPayment,
    getPaymentProof,
    verifyProof
  } = usePayments();
  
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // Ensure payments is always an array and has the expected shape
  const paymentList: PaymentData[] = (Array.isArray(payments) ? payments : []).map(payment => ({
    id: payment.id || '',
    amount: payment.amount || '0',
    recipientAddress: payment.recipientAddress || '',
    status: payment.status || 'pending',
    timestamp: payment.timestamp || new Date().toISOString(),
    memo: payment.memo
  }));
  
  const [activeTab, setActiveTab] = useState('send');
  const [isGeneratingProof, setIsGeneratingProof] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, any>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});

  const handleSendPayment = async (data: { recipientAddress: string; amount: string; memo?: string }) => {
    if (!wallet.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await createPayment({
        recipientAddress: data.recipientAddress,
        amount: data.amount,
        memo: data.memo
      });
      
      toast.success('Payment sent successfully');
      setActiveTab('history');
    } catch (error) {
      console.error('Error sending payment:', error);
      toast.error('Failed to send payment');
    }
  };

  const handleGenerateProof = async (paymentId: string) => {
    if (!paymentId) return;
    
    try {
      setIsGeneratingProof(paymentId);
      const proof = await getPaymentProof(paymentId);
      setProofs(prev => ({
        ...prev,
        [paymentId]: proof
      }));
      toast.success('Proof generated successfully');
    } catch (error) {
      console.error('Error generating proof:', error);
      toast.error('Failed to generate proof');
    } finally {
      setIsGeneratingProof(null);
    }
  };

  const handleVerifyProof = async (paymentId: string) => {
    if (!paymentId || !proofs[paymentId]) return;
    
    try {
      const result = await verifyProof(proofs[paymentId].id);
      setVerificationResults(prev => ({
        ...prev,
        [paymentId]: result
      }));
      
      if (result.valid) {
        toast.success('Proof verified successfully');
      } else {
        toast.warning('Proof verification failed', {
          description: result.message
        });
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
      toast.error('Failed to verify proof');
    }
  };

  const handleDownload = (paymentId: string, format: 'json' | 'xml') => {
    const proof = proofs[paymentId];
    if (!proof) return;
    
    let content: string;
    let filename: string;
    
    if (format === 'json') {
      content = JSON.stringify(proof, null, 2);
      filename = `proof-${paymentId}.json`;
    } else {
      content = `<?xml version="1.0" encoding="UTF-8"?>
<proof>
  <id>${proof.id}</id>
  <proofHash>${proof.proofHash}</proofHash>
  <verificationUrl>${proof.verificationUrl}</verificationUrl>
  <timestamp>${proof.timestamp}</timestamp>
</proof>`;
      filename = `proof-${paymentId}.xml`;
    }
    
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Proof downloaded as ${format.toUpperCase()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">PayPruf</h1>
          <p className="text-muted-foreground">
            Secure payments with cryptographic proof on Flare Network
          </p>
        </div>
        {hasMounted && (
          <div className="mt-6">
            <WalletConnect 
              isConnected={!!wallet.address}
              isConnecting={false}
              address={wallet.address || ''}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
              hasInjectedWallet={!!window.ethereum}
            />
          </div>
        )}
      </header>
      <Tabs 
        defaultValue="send" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="send" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Send Payment</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Transaction History</span>
            {paymentList.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {paymentList.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send USDT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm 
                onSuccess={() => {
                  toast.success('Payment sent successfully');
                  setActiveTab('history');
                }}
              />
            </CardContent>
          </Card>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Coins className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Multi-Chain Support</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Send and receive USDT across multiple blockchains with ease.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Immutable Proofs</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate cryptographic proof for every transaction that can be independently verified.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Secure & Private</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your transactions are secured by blockchain technology and end-to-end encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <div className="space-y-4">
            <TransactionHistory />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
