import { Transaction, ProofRecord } from '@/types/transaction';

export const generateMockTransactions = (): Transaction[] => {
  return [
    {
      id: '1',
      hash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD',
      amount: '1,250.00',
      memo: 'Invoice #INV-2024-001 - Consulting Services',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'confirmed',
    },
    {
      id: '2',
      hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      recipient: '0x9876543210abcdef1234567890abcdef12345678',
      amount: '500.00',
      memo: 'Payment for Q4 deliverables',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'confirmed',
    },
    {
      id: '3',
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      recipient: '0xfedcba0987654321fedcba0987654321fedcba09',
      amount: '75.50',
      memo: 'Software license renewal',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'confirmed',
    },
  ];
};

export const generateProofRecord = (tx: Transaction, senderAddress: string): ProofRecord => {
  return {
    transactionId: tx.id,
    hash: tx.hash,
    amount: tx.amount,
    recipient: tx.recipient,
    sender: senderAddress,
    memo: tx.memo,
    timestamp: tx.timestamp.toISOString(),
    network: 'Flare Network',
    currency: 'USDT0',
    proofId: `PROOF-${Date.now()}-${tx.id}`,
    generatedAt: new Date().toISOString(),
  };
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
