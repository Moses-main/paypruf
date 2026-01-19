import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayments } from '@/hooks/usePayments';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

interface PaymentFormProps {
  onSuccess?: () => void;
}

export const PaymentForm = ({ onSuccess }: PaymentFormProps) => {
  const { address: walletAddress, isConnected } = useWallet();
  const { createPayment, isCreatingPayment } = usePayments();
  
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: '',
    memo: '',
  });
  const [error, setError] = useState('');

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

    if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
      setError('Invalid recipient address');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await createPayment({
        recipientAddress,
        amount: numAmount.toString(),
        memo: formData.memo,
      });
      
      // Reset form on success
      setFormData({
        recipientAddress: '',
        amount: '',
        memo: '',
      });
      
      toast.success('Payment sent successfully');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send payment';
      setError(errorMessage);
      toast.error('Payment failed', {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-6">
      {!isConnected && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
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
            disabled={!isConnected || isCreatingPayment}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USDT)</Label>
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
              disabled={!isConnected || isCreatingPayment}
              className="pl-3 pr-12"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">USDT</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="memo">Memo (Optional)</Label>
          <Input
            id="memo"
            name="memo"
            type="text"
            placeholder="What's this payment for?"
            value={formData.memo}
            onChange={handleChange}
            disabled={!isConnected || isCreatingPayment}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!isConnected || isCreatingPayment}
            className="w-full"
          >
            {isCreatingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
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
  );
};
