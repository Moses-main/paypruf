import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FileText,
  Loader2,
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayments } from '@/hooks/usePayments';
import { PaymentResponse, ProofRecord } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

export const ProofViewer = () => {
  const { proofId } = useParams<{ proofId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [proof, setProof] = useState<ProofRecord | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { getPaymentById, getPaymentProof, verifyProof } = usePayments();

  useEffect(() => {
    const loadData = async () => {
      if (!proofId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Load payment details
        const paymentData = await getPaymentById(proofId);
        setPayment(paymentData);
        
        // Try to load proof if it exists
        try {
          const proofData = await getPaymentProof(proofId);
          setProof(proofData);
        } catch (error) {
          console.log('No proof found for this payment');
        }
      } catch (error) {
        console.error('Error loading payment:', error);
        toast.error('Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [proofId, getPaymentById, getPaymentProof]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyProof = async () => {
    if (!proof?.id) return;
    
    try {
      setIsVerifying(true);
      const result = await verifyProof(proof.id);
      setVerificationResult(result);
      
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
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = (format: 'json' | 'xml') => {
    if (!proof) return;
    
    let content: string;
    let filename: string;
    
    if (format === 'json') {
      content = JSON.stringify(proof, null, 2);
      filename = `proof-${proofId}.json`;
    } else {
      content = `<?xml version="1.0" encoding="UTF-8"?>
<proof>
  <id>${proof.id}</id>
  <proofHash>${proof.proofHash}</proofHash>
  <verificationUrl>${proof.verificationUrl}</verificationUrl>
  <timestamp>${proof.timestamp}</timestamp>
</proof>`;
      filename = `proof-${proofId}.xml`;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading proof details...</span>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium">Proof not found</h3>
        <p className="text-muted-foreground mt-2">
          The requested payment proof could not be found or you don't have permission to view it.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isSender = payment.senderAddress === payment.recipientAddress; // This might need adjustment based on your auth
  const verificationUrl = proof?.verificationUrl || `${window.location.origin}/proof/${proofId}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-6 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Payment Receipt</CardTitle>
                {proof ? (
                  <Badge variant="success" className="flex items-center">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Verified with ProofRails
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    No proof generated
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">From</h4>
                  <div className="font-medium">
                    {formatAddress(payment.senderAddress)}
                  </div>
                  <p className="text-sm text-muted-foreground">Sender</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">To</h4>
                  <div className="font-medium">
                    {formatAddress(payment.recipientAddress)}
                  </div>
                  <p className="text-sm text-muted-foreground">Recipient</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Amount</h4>
                  <div className="text-2xl font-bold">
                    {parseFloat(payment.amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6
                    })} <span className="text-base font-normal text-muted-foreground">USDT</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Date</h4>
                  <div className="font-medium">
                    {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                  </p>
                </div>
                
                {payment.memo && (
                  <div className="md:col-span-2 pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Memo</h4>
                    <p className="whitespace-pre-line">{payment.memo}</p>
                  </div>
                )}
              </div>
              
              {payment.transactionHash && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Transaction</h4>
                  <div className="flex items-center">
                    <a 
                      href={`https://flare-explorer.flare.network/tx/${payment.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-primary hover:underline flex items-center"
                    >
                      {formatAddress(payment.transactionHash)}
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 ml-1"
                      onClick={() => handleCopy(payment.transactionHash || '')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {proof && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Proof Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Proof ID</h4>
                    <div className="flex items-center">
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {proof.id}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 ml-1"
                        onClick={() => handleCopy(proof.id)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Proof Hash</h4>
                    <div className="flex items-center">
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded truncate max-w-[240px] md:max-w-none">
                        {proof.proofHash}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 ml-1 flex-shrink-0"
                        onClick={() => handleCopy(proof.proofHash)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Verification URL</h4>
                    <div className="flex items-center">
                      <a 
                        href={proof.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center truncate max-w-[240px] md:max-w-none"
                      >
                        {proof.verificationUrl}
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5 flex-shrink-0" />
                      </a>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 ml-1 flex-shrink-0"
                        onClick={() => handleCopy(proof.verificationUrl)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Generated</h4>
                    <p className="text-sm">
                      {format(new Date(proof.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  
                  {verificationResult && (
                    <div className="mt-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start">
                        {verificationResult.valid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium">
                            {verificationResult.valid ? 'Proof Verified' : 'Verification Failed'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {verificationResult.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyProof}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Verify Proof
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload('json')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload('xml')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download XML
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          {proof ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-lg border mb-4">
                    <QRCodeSVG 
                      value={verificationUrl}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    Scan this QR code to verify this payment proof
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleCopy(verificationUrl)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy Verification Link'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Immutable Proof of Payment</h4>
                      <p className="text-sm text-muted-foreground">
                        Generate a cryptographic proof that this payment occurred and was verified on the blockchain.
                      </p>
                    </div>
                  </div>
                  
                  <Button className="w-full" onClick={() => {}}>
                    <Shield className="h-4 w-4 mr-2" />
                    Generate with ProofRails
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Payment Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(payment.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {proof ? (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Proof Generated</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(proof.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center mr-3 mt-0.5">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Proof Pending</p>
                      <p className="text-sm text-muted-foreground">
                        Generate a proof to verify this payment
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper function to format wallet address
const formatAddress = (address: string) => {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default ProofViewer;
