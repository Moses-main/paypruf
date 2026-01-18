export interface Transaction {
  id: string;
  hash: string;
  recipient: string;
  amount: string;
  memo: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  acknowledged?: boolean;
  acknowledgedAt?: string;
}

export interface ProofRecord {
  transactionId: string;
  hash: string;
  amount: string;
  recipient: string;
  sender: string;
  memo: string;
  timestamp: string;
  network: string;
  currency: string;
  proofId: string;
  generatedAt: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
}
