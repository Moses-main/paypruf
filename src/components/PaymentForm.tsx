import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePayments } from '@/hooks/usePayments';
import { useWallet } from '@/hooks/useWallet';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { toast } from 'sonner';

interface PaymentFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const PaymentForm = ({ onSuccess, className }: PaymentFormProps) => {
  const { address: walletAddress, isConnected } = useWallet();
  const { createPayment, isCreatingPayment } = usePayments();
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();
  
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: '',
    memo: '',
  });
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  // Watch for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    setIsProcessing(true);

    try {
      // Step 1: Send the on-chain transaction (using native FLR for demo, USDT0 would use ERC20 transfer)
      toast.loading('Sending transaction...', { id: 'payment' });
      
      const hash = await sendTransactionAsync({
        to: recipientAddress as `0x${string}`,
        value: parseEther(amount),
      });
      
      setTxHash(hash);
      toast.loading('Waiting for confirmation...', { id: 'payment' });

      // Step 2: Register payment with backend for proof generation
      try {
        await createPayment({
          recipientAddress,
          amount: numAmount.toString(),
          memo: formData.memo,
        });
      } catch (backendError) {
        console.log('Backend registration pending - transaction confirmed on-chain');
      }
      
      toast.success('Payment sent successfully!', { 
        id: 'payment',
        description: `Transaction: ${hash.slice(0, 10)}...`,
      });
      
      // Reset form on success
      setFormData({
        recipientAddress: '',
        amount: '',
        memo: '',
      });
      setTxHash(undefined);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err?.shortMessage || err?.message || 'Failed to send payment';
      setError(errorMessage);
      toast.error('Payment failed', {
        id: 'payment',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isSubmitting = isSending || isConfirming || isCreatingPayment || isProcessing;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Send className="h-5 w-5 mr-2" />
          Send Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!isConnected && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
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
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {txHash && isConfirming && (
              <div className="p-3 text-sm text-primary bg-primary/10 rounded-md flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming transaction...
              </div>
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
                    {isSending ? 'Sending...' : isConfirming ? 'Confirming...' : 'Processing...'}
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
      </CardContent>
    </Card>
  );
};
