import { useState, useEffect, useCallback } from 'react';
import { paymentApi, PaymentResponse } from '@/lib/api';

interface UsePaymentPollingOptions {
  paymentId: string | null;
  enabled?: boolean;
  intervalMs?: number;
  onStatusChange?: (payment: PaymentResponse) => void;
  onCompleted?: (payment: PaymentResponse) => void;
  onFailed?: (payment: PaymentResponse) => void;
}

export const usePaymentPolling = ({
  paymentId,
  enabled = true,
  intervalMs = 3000,
  onStatusChange,
  onCompleted,
  onFailed,
}: UsePaymentPollingOptions) => {
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  const fetchPayment = useCallback(async () => {
    if (!paymentId) return null;
    
    try {
      const data = await paymentApi.getPaymentById(paymentId);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to fetch payment');
    }
  }, [paymentId]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    if (paymentId) {
      setIsPolling(true);
      setError(null);
    }
  }, [paymentId]);

  useEffect(() => {
    if (!enabled || !paymentId || !isPolling) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await fetchPayment();
        
        if (!isMounted || !data) return;

        setPayment(data);

        // Check for status changes
        if (previousStatus && data.status !== previousStatus) {
          onStatusChange?.(data);
        }
        setPreviousStatus(data.status);

        // Handle terminal states
        if (data.status === 'COMPLETED') {
          onCompleted?.(data);
          setIsPolling(false);
          return;
        }

        if (data.status === 'FAILED') {
          onFailed?.(data);
          setIsPolling(false);
          return;
        }

        // Continue polling for non-terminal states
        timeoutId = setTimeout(poll, intervalMs);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Polling failed'));
        // Retry on error
        timeoutId = setTimeout(poll, intervalMs * 2);
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, paymentId, isPolling, intervalMs, fetchPayment, previousStatus, onStatusChange, onCompleted, onFailed]);

  return {
    payment,
    isPolling,
    error,
    startPolling,
    stopPolling,
  };
};
