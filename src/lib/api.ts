import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Check if backend is available
let backendAvailable: boolean | null = null;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 5000, // 5 second timeout
});

// Request interceptor for adding auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface PaymentRequest {
  recipientAddress: string;
  amount: string;
  memo?: string;
  transactionHash?: string;
}

export interface PaymentResponse {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  memo?: string;
  status: string;
  transactionHash?: string;
  proofRailsRecordId?: string;
  proofHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProofRecord {
  id: string;
  proofHash: string;
  qrCodeUrl: string;
  verificationUrl: string;
  timestamp: string;
}

// Local storage fallback for when backend is unavailable
const LOCAL_STORAGE_KEY = 'payproof_payments';

const getLocalPayments = (): PaymentResponse[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveLocalPayment = (payment: PaymentResponse): void => {
  const payments = getLocalPayments();
  payments.unshift(payment);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payments.slice(0, 50))); // Keep last 50
};

const checkBackendAvailable = async (): Promise<boolean> => {
  if (backendAvailable !== null) return backendAvailable;
  try {
    await api.get('/health', { timeout: 2000 });
    backendAvailable = true;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
};

export const paymentApi = {
  // Submit a new payment
  async createPayment(payment: PaymentRequest & { senderAddress: string }): Promise<PaymentResponse> {
    const isOnline = await checkBackendAvailable();
    
    if (isOnline) {
      try {
        const response = await api.post<PaymentResponse>('/payments/submit', payment);
        return response.data;
      } catch (error) {
        console.warn('Backend unavailable, using local storage');
      }
    }
    
    // Fallback: Create local payment record
    const localPayment: PaymentResponse = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderAddress: payment.senderAddress,
      recipientAddress: payment.recipientAddress,
      amount: payment.amount,
      memo: payment.memo,
      status: 'COMPLETED',
      transactionHash: payment.transactionHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    saveLocalPayment(localPayment);
    return localPayment;
  },

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<PaymentResponse> {
    // Check local first
    const localPayments = getLocalPayments();
    const localPayment = localPayments.find(p => p.id === paymentId);
    if (localPayment) return localPayment;
    
    const response = await api.get<PaymentResponse>(`/payments/${paymentId}`);
    return response.data;
  },

  // Get payment history for a wallet address
  async getPaymentHistory(walletAddress: string): Promise<{ payments: PaymentResponse[]; total: number }> {
    const isOnline = await checkBackendAvailable();
    
    if (isOnline) {
      try {
        const response = await api.get<{ payments: PaymentResponse[]; total: number }>(`/payments/history/${walletAddress}`);
        return response.data;
      } catch (error) {
        console.warn('Backend unavailable, using local storage');
      }
    }
    
    // Fallback: Return local payments filtered by wallet address
    const localPayments = getLocalPayments().filter(
      p => p.senderAddress.toLowerCase() === walletAddress.toLowerCase() ||
           p.recipientAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    
    return { payments: localPayments, total: localPayments.length };
  },

  // Get payment proof
  async getPaymentProof(paymentId: string): Promise<ProofRecord> {
    const response = await api.get<ProofRecord>(`/payments/${paymentId}/proof`);
    return response.data;
  },

  // Verify a proof
  async verifyProof(proofId: string): Promise<{ valid: boolean; message: string }> {
    const response = await api.get(`/proofs/verify/${proofId}`);
    return response.data;
  }
};

export default api;
