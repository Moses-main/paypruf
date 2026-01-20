import { useCallback } from 'react';
import { paymentApi, PaymentRequest, PaymentResponse, ProofRecord } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const usePayments = () => {
  const queryClient = useQueryClient();

  // Fetch all payments for the current user
  const { 
    data: payments = [], 
    isLoading: isLoadingPayments, 
    error: paymentsError,
    refetch: refetchPayments,
  } = useQuery<PaymentResponse[], Error>({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getUserPayments(),
  });

  // Create a new payment
  const createPaymentMutation = useMutation<PaymentResponse, Error, PaymentRequest>({
    mutationFn: (paymentData) => paymentApi.createPayment(paymentData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment successful', {
        description: `Payment of ${data.amount} sent to ${data.recipientAddress.slice(0, 8)}...`,
      });
    },
    onError: (error) => {
      toast.error('Payment failed', {
        description: error.message,
      });
    },
  });

  // Get payment by ID
  const getPaymentById = useCallback(async (paymentId: string): Promise<PaymentResponse> => {
    try {
      return await paymentApi.getPaymentById(paymentId);
    } catch (error) {
      toast.error('Error fetching payment', {
        description: error instanceof Error ? error.message : 'Failed to fetch payment',
      });
      throw error;
    }
  }, []);

  // Get payment proof
  const getPaymentProof = useCallback(async (paymentId: string): Promise<ProofRecord> => {
    try {
      return await paymentApi.getPaymentProof(paymentId);
    } catch (error) {
      toast.error('Error fetching proof', {
        description: error instanceof Error ? error.message : 'Failed to fetch payment proof',
      });
      throw error;
    }
  }, []);

  // Verify a proof
  const verifyProof = useCallback(async (proofId: string): Promise<{ valid: boolean; message: string }> => {
    try {
      return await paymentApi.verifyProof(proofId);
    } catch (error) {
      toast.error('Verification failed', {
        description: error instanceof Error ? error.message : 'Failed to verify proof',
      });
      throw error;
    }
  }, []);

  return {
    payments,
    isLoadingPayments,
    paymentsError,
    refetchPayments,
    createPayment: createPaymentMutation.mutateAsync,
    isCreatingPayment: createPaymentMutation.isPending,
    getPaymentById,
    getPaymentProof,
    verifyProof,
  };
};

export default usePayments;
