import { useState } from 'react';
import { 
  History, 
  Search, 
  ExternalLink, 
  FileText, 
  Copy,
  Check,
  Eye,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePayments } from '@/hooks/usePayments';
import { useWallet } from '@/hooks/useWallet';
import { formatDistanceToNow } from 'date-fns';
import { PaymentResponse, ProofRecord } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Helper function to format wallet address
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to format amount
export const formatAmount = (amount: string) => {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
};

interface TransactionHistoryProps {
  className?: string;
}

export const TransactionHistory = ({ className }: TransactionHistoryProps) => {
  const { address: walletAddress } = useWallet();
  const { 
    payments, 
    isLoadingPayments, 
    getPaymentProof,
    verifyProof 
  } = usePayments();
  
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState<Record<string, boolean>>({});
  const [proofs, setProofs] = useState<Record<string, ProofRecord>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, { valid: boolean; message: string }>>({});

  // Ensure payments is an array
  const paymentsArray = Array.isArray(payments) ? payments : [];

  const filteredTransactions = paymentsArray.filter((tx: PaymentResponse) => 
    tx.id.toLowerCase().includes(search.toLowerCase()) ||
    tx.recipientAddress.toLowerCase().includes(search.toLowerCase()) ||
    tx.senderAddress.toLowerCase().includes(search.toLowerCase()) ||
    (tx.memo && tx.memo.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCopyLink = async (paymentId: string) => {
    const url = `${window.location.origin}/proof/${paymentId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(paymentId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleGenerateProof = async (paymentId: string) => {
    if (!paymentId) return;
    
    setLoadingProof(prev => ({ ...prev, [paymentId]: true }));
    
    try {
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
      setLoadingProof(prev => ({ ...prev, [paymentId]: false }));
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success', label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pending' },
      COMPLETED: { variant: 'success', label: 'Completed' },
      FAILED: { variant: 'destructive', label: 'Failed' },
      PROCESSING: { variant: 'default', label: 'Processing' },
    };
    
    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoadingPayments) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  if (paymentsArray.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-2 text-sm font-medium">No transactions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">Your payment history will appear here</p>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Transaction History
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y">
          {filteredTransactions.map((tx: PaymentResponse) => {
            const isSender = tx.senderAddress.toLowerCase() === walletAddress?.toLowerCase();
            const proof = proofs[tx.id];
            const verificationResult = verificationResults[tx.id];
            const isLoading = loadingProof[tx.id];
            const isExpanded = expandedId === tx.id;
            
            return (
              <div key={tx.id} className="p-4 hover:bg-muted/50">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {isSender ? 'Sent to' : 'Received from'} {formatAddress(isSender ? tx.recipientAddress : tx.senderAddress)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${isSender ? 'text-destructive' : 'text-green-600'}`}>
                      {isSender ? '-' : '+'} {formatAmount(tx.amount)} USDT
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Payment ID
                        </div>
                        <div className="font-mono text-sm flex items-center">
                          {tx.id.slice(0, 8)}...{tx.id.slice(-4)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(tx.id);
                              toast.success('Copied to clipboard');
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      {tx.transactionHash && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Transaction Hash
                          </div>
                          <div className="font-mono text-sm flex items-center">
                            <a 
                              href={`https://flare-explorer.flare.network/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {formatAddress(tx.transactionHash)}
                              <ExternalLink className="h-3.5 w-3.5 ml-1" />
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {tx.memo && (
                        <div className="col-span-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Memo
                          </div>
                          <div className="text-sm">
                            {tx.memo}
                          </div>
                        </div>
                      )}
                      
                      {proof && (
                        <div className="col-span-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Payment Proof
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="font-mono text-sm">
                                {proof.id ? `Proof ID: ${proof.id}` : 'Proof ID: N/A'}
                              </div>
                              {verificationResult && (
                                <Badge 
                                  variant={verificationResult.valid ? 'success' : 'destructive'}
                                  className="text-xs"
                                >
                                  {verificationResult.valid ? 'Verified' : 'Verification Failed'}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyProof(tx.id);
                                }}
                                disabled={!proof.id}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(tx.id, 'json');
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                JSON
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(tx.id, 'xml');
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                XML
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleCopyLink(tx.id);
                        }}
                      >
                        {copiedId === tx.id ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link 
                          to={`/proof/${tx.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Proof
                        </Link>
                      </Button>
                      
                      {!proof && tx.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleGenerateProof(tx.id);
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Generate Proof
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
