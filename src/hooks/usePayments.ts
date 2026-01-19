import { useState, useCallback } from 'react';
import { paymentApi, PaymentRequest, PaymentResponse, ProofRecord } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const usePayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all payments for the current user
  const { 
    data: payments = [], 
    isLoading: isLoadingPayments, 
    error: paymentsError 
  } = useQuery<PaymentResponse[], Error>({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getUserPayments(),
    onError: (error) => {
      toast({
        title: 'Error fetching payments',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create a new payment
  const createPaymentMutation = useMutation<PaymentResponse, Error, PaymentRequest>({
    mutationFn: (paymentData) => paymentApi.createPayment(paymentData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Payment successful',
        description: `Payment of ${data.amount} sent to ${data.recipientAddress}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get payment proof
  const getPaymentProof = useCallback(async (paymentId: string): Promise<ProofRecord> => {
    try {
      return await paymentApi.getPaymentProof(paymentId);
    } catch (error) {
      toast({
        title: 'Error fetching proof',
        description: error instanceof Error ? error.message : 'Failed to fetch payment proof',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Verify a proof
  const verifyProof = useCallback(async (proofId: string): Promise<{ valid: boolean; message: string }> => {
    try {
      return await paymentApi.verifyProof(proofId);
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Failed to verify proof',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    payments,
    isLoadingPayments,
    paymentsError,
    createPayment: createPaymentMutation.mutateAsync,
    isCreatingPayment: createPaymentMutation.isPending,
    getPaymentProof,
    verifyProof,
  };
};

export default usePayments;
