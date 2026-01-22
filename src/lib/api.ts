import axios, { AxiosInstance } from 'axios';

// Production backend on Render
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://paypruf.onrender.com/api';

// Coston2 Testnet block explorer
export const BLOCK_EXPLORER_URL = 'https://coston2-explorer.flare.network';

// Check if backend is available
let backendAvailable: boolean | null = null;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Disabled for cross-origin requests
  timeout: 15000, // 15 second timeout for Render cold starts
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
    // Health endpoint is at root, not under /api
    await axios.get('https://paypruf.onrender.com/health', { timeout: 5000 });
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
        const response = await api.post<{ status: string; data: PaymentResponse }>('/payment/submit', payment);
        return response.data.data;
      } catch (error) {
        console.warn('Backend unavailable, using local storage', error);
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
    
    const response = await api.get<{ status: string; data: PaymentResponse }>(`/proof/${paymentId}`);
    return response.data.data;
  },

  // Get payment history for a wallet address
  async getPaymentHistory(walletAddress: string): Promise<{ payments: PaymentResponse[]; total: number }> {
    const isOnline = await checkBackendAvailable();
    
    if (isOnline) {
      try {
        const response = await api.get<{ status: string; data: { payments: PaymentResponse[]; pagination: { total: number } } }>(`/payment/history/${walletAddress}`);
        return { 
          payments: response.data.data.payments, 
          total: response.data.data.pagination.total 
        };
      } catch (error) {
        console.warn('Backend unavailable, using local storage', error);
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
    const response = await api.get<{ status: string; data: ProofRecord }>(`/proof/${paymentId}`);
    return response.data.data;
  },

  // Download proof as file
  async downloadProof(paymentId: string, format: 'json' | 'pdf' = 'json'): Promise<Blob> {
    const response = await api.get(`/proof/${paymentId}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get shareable link for proof
  async getShareLink(paymentId: string): Promise<{ shareUrl: string; expiresAt?: string }> {
    const response = await api.get<{ status: string; data: { shareUrl: string; expiresAt?: string } }>(`/proof/${paymentId}/share`);
    return response.data.data;
  },

  // Verify a proof
  async verifyProof(proofId: string): Promise<{ valid: boolean; message: string }> {
    const response = await api.get<{ valid: boolean; message: string }>(`/proof/${proofId}?includePrivate=false`);
    return { valid: true, message: 'Proof verified successfully' };
  }
};

export default api;
