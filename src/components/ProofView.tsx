import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Shield, 
  CheckCircle2, 
  Copy, 
  QrCode,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface ProofData {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  memo?: string;
  status: string;
  transactionHash?: string;
  proofHash?: string;
  flareAnchorTxHash?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
  qrCodeUrl?: string;
  verificationUrl?: string;
}

export function ProofView() {
  const { proofId } = useParams<{ proofId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(false);

  const { data: proof, isLoading, error } = useQuery({
    queryKey: ['proof', proofId],
    queryFn: async (): Promise<ProofData> => {
      const response = await api.get(`/proofs/${proofId}`);
      return response.data;
    },
    enabled: !!proofId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/proofs/${proofId}/acknowledge`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proof', proofId] });
      toast({
        title: 'Payment Acknowledged',
        description: 'The payment has been marked as acknowledged.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge payment.',
        variant: 'destructive',
      });
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link Copied',
      description: 'Proof link copied to clipboard.',
    });
  };

  const handleDownload = async (format: 'json' | 'xml') => {
    if (!proof) return;

    try {
      const response = await api.get(`/proofs/${proofId}/download?format=${format}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { 
        type: format === 'json' ? 'application/json' : 'application/xml' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-proof-${proofId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download Started',
        description: `Proof downloaded as ${format.toUpperCase()}.`,
      });
    } catch {
      toast({
        title: 'Download Failed',
        description: 'Could not download proof bundle.',
        variant: 'destructive',
      });
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading payment proof...</p>
        </div>
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Proof Not Found</h2>
            <p className="text-muted-foreground">
              This payment proof could not be found or may have been removed.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold gradient-text">PayProof</span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-card">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Payment Proof</CardTitle>
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified on Flare
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              ID: {proofId}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Transaction Details */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Sender</p>
                  <p className="font-mono text-sm">{formatAddress(proof.senderAddress)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-mono text-sm">{formatAddress(proof.recipientAddress)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-semibold text-primary">{proof.amount} FLR</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-sm">{formatDate(proof.createdAt)}</p>
                </div>
              </div>

              {proof.memo && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Memo</p>
                  <p className="text-sm bg-secondary/50 p-3 rounded-lg">{proof.memo}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Blockchain Verification */}
            <div className="space-y-4">
              <h3 className="font-medium">Blockchain Verification</h3>
              
              {proof.transactionHash && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payment Transaction</p>
                  <a
                    href={`https://flarescan.com/tx/${proof.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-mono text-primary hover:underline"
                  >
                    {formatAddress(proof.transactionHash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {proof.flareAnchorTxHash && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Anchor Transaction</p>
                  <a
                    href={`https://flarescan.com/tx/${proof.flareAnchorTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-mono text-primary hover:underline"
                  >
                    {formatAddress(proof.flareAnchorTxHash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {proof.proofHash && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Proof Hash</p>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {proof.proofHash}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Acknowledgement */}
            <div className="space-y-4">
              <h3 className="font-medium">Recipient Acknowledgement</h3>
              {proof.acknowledged ? (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Acknowledged on {formatDate(proof.acknowledgedAt!)}</span>
                </div>
              ) : (
                <Button
                  onClick={() => acknowledgeMutation.mutate()}
                  disabled={acknowledgeMutation.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  {acknowledgeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Acknowledge Payment
                </Button>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCopyLink} variant="outline" size="sm" className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button 
                onClick={() => setShowQR(!showQR)} 
                variant="outline" 
                size="sm" 
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                {showQR ? 'Hide QR' : 'Show QR'}
              </Button>
              <Button 
                onClick={() => handleDownload('json')} 
                variant="outline" 
                size="sm" 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button 
                onClick={() => handleDownload('xml')} 
                variant="outline" 
                size="sm" 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                XML
              </Button>
            </div>

            {/* QR Code */}
            {showQR && (
              <div className="flex justify-center p-6 bg-white rounded-lg">
                <QRCodeSVG
                  value={window.location.href}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Verified by PayProof • Powered by Flare Network
        </p>
      </div>
    </div>
  );
}
