import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transaction } from '@/types/transaction';

interface PaymentFormProps {
  isWalletConnected: boolean;
  onSubmit: (tx: Omit<Transaction, 'id' | 'hash' | 'timestamp' | 'status'>) => Promise<void>;
}

export const PaymentForm = ({ isWalletConnected, onSubmit }: PaymentFormProps) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recipient || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      setError('Invalid recipient address');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Invalid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ recipient, amount, memo });
      setRecipient('');
      setAmount('');
      setMemo('');
    } catch (err) {
      setError('Transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Send className="h-5 w-5 text-primary" />
        Send USDT0
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Recipient Address *
          </label>
          <Input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="font-mono"
            disabled={!isWalletConnected}
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Amount (USDT0) *
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            disabled={!isWalletConnected}
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Memo / Reference
          </label>
          <Input
            type="text"
            placeholder="Invoice #, description, etc."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={!isWalletConnected}
          />
        </div>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={!isWalletConnected || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !isWalletConnected ? (
            'Connect wallet to send'
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Payment
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
