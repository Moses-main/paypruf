import { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePayments } from '@/hooks/usePayments';
import { useWallet } from '@/hooks/useWallet';
import { usePaymentPolling } from '@/hooks/usePaymentPolling';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { PaymentResponse } from '@/lib/api';

interface PaymentFormProps {
  onSuccess?: () => void;
  className?: string;
}

type PaymentStep = 'idle' | 'sending' | 'confirming' | 'registering' | 'generating-proof' | 'completed' | 'failed';

const stepLabels: Record<PaymentStep, string> = {
  idle: 'Ready',
  sending: 'Sending transaction...',
  confirming: 'Confirming on Flare...',
  registering: 'Recording payment...',
  'generating-proof': 'Generating proof...',
  completed: 'Payment complete!',
  failed: 'Payment failed',
};

export const PaymentForm = ({ onSuccess, className }: PaymentFormProps) => {
  const { address: walletAddress, isConnected } = useWallet();
  const { createPayment, isCreatingPayment, refetchPayments } = usePayments();
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();
  
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: '',
    memo: '',
  });
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [currentStep, setCurrentStep] = useState<PaymentStep>('idle');
  const [completedPayment, setCompletedPayment] = useState<PaymentResponse | null>(null);
  const [pollingPaymentId, setPollingPaymentId] = useState<string | null>(null);

  // Watch for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Poll for payment status updates
  const { payment: polledPayment, isPolling } = usePaymentPolling({
    paymentId: pollingPaymentId,
    enabled: !!pollingPaymentId,
    onCompleted: (payment) => {
      setCurrentStep('completed');
      setCompletedPayment(payment);
      refetchPayments();
      toast.success('Payment confirmed with proof!', {
        description: 'Your payment proof is ready to share.',
      });
    },
    onFailed: () => {
      setCurrentStep('failed');
      toast.error('Payment processing failed');
    },
    onStatusChange: (payment) => {
      if (payment.proofHash) {
        setCurrentStep('completed');
      }
    },
  });

  // Update step based on polled payment status
  useEffect(() => {
    if (polledPayment) {
      if (polledPayment.status === 'PROCESSING' && !polledPayment.proofHash) {
        setCurrentStep('generating-proof');
      } else if (polledPayment.status === 'COMPLETED' || polledPayment.proofHash) {
        setCurrentStep('completed');
        setCompletedPayment(polledPayment);
      }
    }
  }, [polledPayment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({ recipientAddress: '', amount: '', memo: '' });
    setTxHash(undefined);
    setCurrentStep('idle');
    setCompletedPayment(null);
    setPollingPaymentId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCompletedPayment(null);

    if (!isConnected || !walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    const { recipientAddress, amount } = formData;

    if (!recipientAddress || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isAddress(recipientAddress)) {
      setError('Invalid recipient address');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      // Step 1: Send on-chain transaction
      setCurrentStep('sending');
      
      const hash = await sendTransactionAsync({
        to: recipientAddress as `0x${string}`,
        value: parseEther(amount),
      });
      
      setTxHash(hash);
      setCurrentStep('confirming');

      // Step 2: Register payment with backend
      setCurrentStep('registering');
      
      try {
        const paymentResponse = await createPayment({
          recipientAddress,
          amount: numAmount.toString(),
          memo: formData.memo,
        });
        
        // Start polling for proof generation status
        if (paymentResponse?.id) {
          setPollingPaymentId(paymentResponse.id);
          setCurrentStep('generating-proof');
        } else {
          setCurrentStep('completed');
          refetchPayments();
        }
      } catch (backendError) {
        console.warn('Backend registration issue:', backendError);
        // Transaction succeeded on-chain even if backend fails
        setCurrentStep('completed');
        refetchPayments();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setCurrentStep('failed');
      const errorMessage = err?.shortMessage || err?.message || 'Failed to send payment';
      setError(errorMessage);
      toast.error('Payment failed', {
        description: errorMessage,
      });
    }
  };

  const isSubmitting = currentStep !== 'idle' && currentStep !== 'completed' && currentStep !== 'failed';
  const showConfirmation = currentStep === 'completed' && (completedPayment || txHash);

  // Helper to check step completion
  const isStepComplete = (step: PaymentStep) => {
    const stepOrder: PaymentStep[] = ['idle', 'sending', 'confirming', 'registering', 'generating-proof', 'completed'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    return currentIndex > stepIndex;
  };

  // Progress indicator component
  const ProgressStep = ({ step, label, isActive, isComplete }: { step: number; label: string; isActive: boolean; isComplete: boolean }) => (
    <div className={`flex items-center gap-2 text-sm ${isActive ? 'text-primary font-medium' : isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
        isComplete ? 'bg-green-600 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <Loader2 className="h-3 w-3 animate-spin" /> : step}
      </div>
      <span>{label}</span>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Send Payment
          </div>
          {currentStep !== 'idle' && (
            <Badge variant={currentStep === 'completed' ? 'success' : currentStep === 'failed' ? 'destructive' : 'secondary'}>
              {stepLabels[currentStep]}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Payment Confirmation Screen */}
        {showConfirmation ? (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">Your payment has been confirmed on Flare</p>
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              {completedPayment && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{completedPayment.amount} FLR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-mono text-xs">{completedPayment.recipientAddress.slice(0, 10)}...</span>
                  </div>
                </>
              )}
              {(completedPayment?.transactionHash || txHash) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tx Hash</span>
                  <a 
                    href={`https://flare-explorer.flare.network/tx/${completedPayment?.transactionHash || txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {(completedPayment?.transactionHash || txHash)?.slice(0, 10)}...
                  </a>
                </div>
              )}
              {completedPayment?.proofHash && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proof Status</span>
                  <Badge variant="success" className="text-xs">Verified</Badge>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {completedPayment?.id && (
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/proof/${completedPayment.id}`}>
                    View Proof <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
              <Button onClick={resetForm} className="flex-1">
                New Payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Indicator */}
            {isSubmitting && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <ProgressStep step={1} label="Sending transaction" isActive={currentStep === 'sending'} isComplete={isStepComplete('sending')} />
                <ProgressStep step={2} label="Confirming on Flare" isActive={currentStep === 'confirming'} isComplete={isStepComplete('confirming')} />
                <ProgressStep step={3} label="Recording payment" isActive={currentStep === 'registering'} isComplete={isStepComplete('registering')} />
                <ProgressStep step={4} label="Generating proof" isActive={currentStep === 'generating-proof' || isPolling} isComplete={isStepComplete('generating-proof')} />
              </div>
            )}

            {!isConnected && (
              <div className="p-4 bg-accent/50 border border-accent rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-muted-foreground">
                      Please connect your wallet to send payments
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientAddress">Recipient Address</Label>
                <Input
                  id="recipientAddress"
                  name="recipientAddress"
                  type="text"
                  placeholder="0x..."
                  value={formData.recipientAddress}
                  onChange={handleChange}
                  disabled={!isConnected || isSubmitting}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (FLR)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={!isConnected || isSubmitting}
                    className="pl-3 pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground text-sm">FLR</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Native Flare tokens for demo. USDT0 support coming soon.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Memo / Reference (Optional)</Label>
                <Input
                  id="memo"
                  name="memo"
                  type="text"
                  placeholder="Invoice #123, Payment for services..."
                  value={formData.memo}
                  onChange={handleChange}
                  disabled={!isConnected || isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center">
                  <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {currentStep === 'failed' && (
                <Button variant="outline" onClick={resetForm} className="w-full">
                  Try Again
                </Button>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!isConnected || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {stepLabels[currentStep]}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Payment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
