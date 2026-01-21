import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

export const paymentApi = {
  // Submit a new payment
  async createPayment(payment: PaymentRequest & { senderAddress: string }): Promise<PaymentResponse> {
    const response = await api.post<PaymentResponse>('/payments/submit', payment);
    return response.data;
  },

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<PaymentResponse> {
    const response = await api.get<PaymentResponse>(`/payments/${paymentId}`);
    return response.data;
  },

  // Get payment history for a wallet address
  async getPaymentHistory(walletAddress: string): Promise<{ payments: PaymentResponse[]; total: number }> {
    const response = await api.get<{ payments: PaymentResponse[]; total: number }>(`/payments/history/${walletAddress}`);
    return response.data;
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
