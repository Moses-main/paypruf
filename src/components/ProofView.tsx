import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAddress, formatDate } from '@/lib/transactions';
import { ProofRecord } from '@/types/transaction';

interface ProofViewProps {
  getProofById?: (id: string) => ProofRecord | null;
}

export const ProofView = ({ getProofById }: ProofViewProps) => {
  const { proofId } = useParams<{ proofId: string }>();
  
  // Mock proof for demo - in real app, fetch from URL param
  const mockProof: ProofRecord = {
    transactionId: '1',
    hash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    amount: '1,250.00',
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD',
    sender: '0x9876543210abcdef1234567890abcdef12345678',
    memo: 'Invoice #INV-2024-001 - Consulting Services',
    timestamp: new Date().toISOString(),
    network: 'Flare Network',
    currency: 'USDT0',
    proofId: proofId || 'PROOF-1234567890',
    generatedAt: new Date().toISOString(),
  };

  const proof = getProofById?.(proofId || '') || mockProof;

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-${proof.proofId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Button>
        </Link>

        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-success/20">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Payment Proof</h1>
                <p className="text-sm text-muted-foreground">ProofRails Verified Record</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Amount</span>
                <p className="text-2xl font-semibold text-primary">{proof.amount} {proof.currency}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Network</span>
                <p className="text-lg">{proof.network}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">From</span>
                <p className="font-mono text-sm break-all">{proof.sender}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">To</span>
                <p className="font-mono text-sm break-all">{proof.recipient}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Transaction Hash</span>
                <p className="font-mono text-sm break-all">{proof.hash}</p>
              </div>
              {proof.memo && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Memo</span>
                  <p className="text-sm">{proof.memo}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Timestamp</span>
                <p className="text-sm">{formatDate(new Date(proof.timestamp))}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Proof ID: <span className="font-mono">{proof.proofId}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadJSON} variant="outline">
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://flarescan.com/tx/${proof.hash}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Verify on Explorer
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by ProofRails on Flare Network
        </p>
      </div>
    </div>
  );
};
