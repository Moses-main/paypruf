import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Shield, 
  CheckCircle, 
  Copy, 
  Check,
  QrCode,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/transactions';
import { ProofRecord } from '@/types/transaction';

interface ProofViewProps {
  getProofById?: (id: string) => ProofRecord | null;
  onAcknowledge?: (proofId: string, acknowledged: boolean) => void;
}

export const ProofView = ({ getProofById, onAcknowledge }: ProofViewProps) => {
  const { proofId } = useParams<{ proofId: string }>();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
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
    acknowledged: false,
  };

  const proof = getProofById?.(proofId || '') || mockProof;
  const shareUrl = `${window.location.origin}/proof/${proofId}`;

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-${proof.proofId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXML = () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<ProofRecord xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <ProofId>${proof.proofId}</ProofId>
  <TransactionHash>${proof.hash}</TransactionHash>
  <Amount currency="${proof.currency}">${proof.amount}</Amount>
  <Sender>${proof.sender}</Sender>
  <Recipient>${proof.recipient}</Recipient>
  <Memo>${proof.memo || ''}</Memo>
  <Timestamp>${proof.timestamp}</Timestamp>
  <Network>${proof.network}</Network>
  <GeneratedAt>${proof.generatedAt}</GeneratedAt>
  <Acknowledged>${proof.acknowledged || false}</Acknowledged>
</ProofRecord>`;
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-${proof.proofId}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcknowledge = (checked: boolean) => {
    onAcknowledge?.(proofId || '', checked);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(16,85%,60%,0.08),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-2xl mx-auto relative">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Button>
        </Link>

        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/20">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Payment Proof</h1>
                  <p className="text-sm text-muted-foreground">PayProof Verified Record</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQR(!showQR)}
                className="rounded-full"
              >
                <QrCode className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {showQR && (
            <div className="p-6 border-b border-border bg-card/50 flex flex-col items-center gap-4 animate-fade-in">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG 
                  value={shareUrl} 
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-muted-foreground">Scan to view this proof</p>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Amount & Network */}
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

            {/* Transaction Details */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">From (Sender)</span>
                <p className="font-mono text-sm break-all bg-muted/50 p-2 rounded">{proof.sender}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">To (Recipient)</span>
                <p className="font-mono text-sm break-all bg-muted/50 p-2 rounded">{proof.recipient}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all bg-muted/50 p-2 rounded flex-1">{proof.hash}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => window.open(`https://flarescan.com/tx/${proof.hash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {proof.memo && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Memo / Reference</span>
                  <p className="text-sm bg-muted/50 p-2 rounded">{proof.memo}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Transaction Date</span>
                  <p className="text-sm">{formatDate(new Date(proof.timestamp))}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Proof Generated</span>
                  <p className="text-sm">{formatDate(new Date(proof.generatedAt))}</p>
                </div>
              </div>
            </div>

            {/* Acknowledgment Toggle */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Recipient Acknowledgment</p>
                  <p className="text-xs text-muted-foreground">
                    {proof.acknowledged 
                      ? `Acknowledged${proof.acknowledgedAt ? ` on ${formatDate(new Date(proof.acknowledgedAt))}` : ''}`
                      : 'Mark this payment as acknowledged'
                    }
                  </p>
                </div>
                <Switch
                  checked={proof.acknowledged || false}
                  onCheckedChange={handleAcknowledge}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Proof ID: <span className="font-mono">{proof.proofId}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyLink} variant="outline">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button onClick={downloadJSON} variant="outline">
                  <FileText className="h-4 w-4" />
                  JSON
                </Button>
                <Button onClick={downloadXML} variant="outline">
                  <FileText className="h-4 w-4" />
                  XML
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
          Powered by PayProof on Flare Network
        </p>
      </div>
    </div>
  );
};
