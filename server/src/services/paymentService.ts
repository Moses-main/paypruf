import prisma from '../lib/prisma';
import { ProofRailsService, PaymentData } from './proofRailsService';
import { FlareAnchorService } from './flareAnchorService';
import { logger } from '../utils/logger';

export interface CreatePaymentRequest {
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  currency?: string;
  memo?: string;
  transactionHash: string;
}

export interface PaymentWithProof {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  currency: string;
  memo?: string | null;
  status: string;
  transactionHash: string;
  proofRailsRecordId?: string | null;
  proofHash?: string | null;
  flareAnchorTxHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for handling payment processing and proof generation
 */
export class PaymentService {
  private flareAnchorService: FlareAnchorService | null = null;

  constructor() {
    try {
      this.flareAnchorService = new FlareAnchorService();
    } catch (error) {
      logger.warn('FlareAnchorService initialization failed - anchoring will be disabled:', error);
      this.flareAnchorService = null;
    }
  }

  /**
   * Create a new payment record
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<PaymentWithProof> {
    try {
      logger.info(`Creating payment: ${paymentData.transactionHash}`);

      // Ensure users exist
      await this.ensureUsersExist([paymentData.senderAddress, paymentData.recipientAddress]);

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          senderAddress: paymentData.senderAddress.toLowerCase(),
          recipientAddress: paymentData.recipientAddress.toLowerCase(),
          amount: paymentData.amount,
          currency: paymentData.currency || 'FLR',
          memo: paymentData.memo,
          transactionHash: paymentData.transactionHash,
          status: 'PENDING',
        },
      });

      logger.info(`Payment created with ID: ${payment.id}`);

      // Start async proof generation
      this.generateProofAsync(payment.id).catch(error => {
        logger.error(`Async proof generation failed for payment ${payment.id}:`, error);
      });

      return payment;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate proof for a payment (async)
   */
  private async generateProofAsync(paymentId: string): Promise<void> {
    try {
      logger.info(`Starting proof generation for payment: ${paymentId}`);

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update status to processing
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PROCESSING' },
      });

      // Generate ISO records using ProofRails
      const paymentData: PaymentData = {
        id: payment.id,
        senderAddress: payment.senderAddress,
        recipientAddress: payment.recipientAddress,
        amount: payment.amount,
        currency: payment.currency,
        memo: payment.memo || undefined,
        transactionHash: payment.transactionHash,
        timestamp: payment.createdAt,
      };

      const isoRecords = await ProofRailsService.generateAllRecords(paymentData);
      logger.info(`Generated ${isoRecords.length} ISO records for payment ${paymentId}`);

      // Combine all record hashes to create a master proof hash
      const combinedHashes = isoRecords.map(record => record.hash).join('');
      const crypto = require('crypto');
      const masterProofHash = crypto.createHash('sha256').update(combinedHashes).digest('hex');

      // Anchor the proof hash on Flare (if service is available)
      let flareAnchorTxHash: string | undefined;
      if (this.flareAnchorService) {
        try {
          flareAnchorTxHash = await this.flareAnchorService.anchorProofHash(masterProofHash, paymentId);
          logger.info(`Proof anchored on Flare: ${flareAnchorTxHash}`);
        } catch (anchorError) {
          logger.warn(`Failed to anchor proof on Flare: ${anchorError}`);
          // Continue without anchoring - proof is still valid
        }
      }

      // Update payment with proof information
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          proofRailsRecordId: isoRecords[0].recordId, // Store the first record ID as reference
          proofHash: masterProofHash,
          flareAnchorTxHash,
          status: 'COMPLETED',
        },
      });

      logger.info(`Proof generation completed for payment: ${paymentId}`);
    } catch (error) {
      logger.error(`Error generating proof for payment ${paymentId}:`, error);
      
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      }).catch(updateError => {
        logger.error(`Failed to update payment status: ${updateError}`);
      });
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentWithProof | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      return payment;
    } catch (error) {
      logger.error('Error fetching payment:', error);
      throw new Error('Failed to fetch payment');
    }
  }

  /**
   * Get payment history for a wallet address
   */
  async getPaymentHistory(
    walletAddress: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ payments: PaymentWithProof[]; total: number }> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: {
            OR: [
              { senderAddress: normalizedAddress },
              { recipientAddress: normalizedAddress },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.payment.count({
          where: {
            OR: [
              { senderAddress: normalizedAddress },
              { recipientAddress: normalizedAddress },
            ],
          },
        }),
      ]);

      return { payments, total };
    } catch (error) {
      logger.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Verify a payment proof
   */
  async verifyPaymentProof(paymentId: string): Promise<{
    valid: boolean;
    payment?: PaymentWithProof;
    anchorVerified?: boolean;
    recordVerified?: boolean;
  }> {
    try {
      const payment = await this.getPaymentById(paymentId);
      
      if (!payment) {
        return { valid: false };
      }

      let anchorVerified = false;
      let recordVerified = false;

      // Verify Flare anchor if available
      if (payment.flareAnchorTxHash && payment.proofHash && this.flareAnchorService) {
        try {
          anchorVerified = await this.flareAnchorService.verifyAnchor(
            payment.flareAnchorTxHash,
            payment.proofHash
          );
        } catch (error) {
          logger.warn('Anchor verification failed:', error);
        }
      }

      // Verify ProofRails record if available
      if (payment.proofRailsRecordId && payment.proofHash) {
        try {
          recordVerified = await ProofRailsService.verifyRecord(
            payment.proofRailsRecordId,
            payment.proofHash
          );
        } catch (error) {
          logger.warn('Record verification failed:', error);
        }
      }

      const valid = payment.status === 'COMPLETED' && (anchorVerified || recordVerified || !payment.proofHash);

      return {
        valid,
        payment,
        anchorVerified,
        recordVerified,
      };
    } catch (error) {
      logger.error('Error verifying payment proof:', error);
      return { valid: false };
    }
  }

  /**
   * Acknowledge a payment (for counterparty acknowledgement)
   */
  async acknowledgePayment(paymentId: string, acknowledgerAddress: string): Promise<PaymentWithProof> {
    try {
      const payment = await this.getPaymentById(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify that the acknowledger is the recipient
      if (payment.recipientAddress.toLowerCase() !== acknowledgerAddress.toLowerCase()) {
        throw new Error('Only the payment recipient can acknowledge the payment');
      }

      // For now, we'll store acknowledgement in the memo field or create a separate table
      // In a full implementation, you'd want a separate acknowledgements table
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          // We could add an acknowledged field to the schema
          memo: payment.memo ? `${payment.memo} [ACKNOWLEDGED]` : '[ACKNOWLEDGED]',
          updatedAt: new Date(),
        },
      });

      logger.info(`Payment ${paymentId} acknowledged by ${acknowledgerAddress}`);
      return updatedPayment;
    } catch (error) {
      logger.error('Error acknowledging payment:', error);
      throw new Error(`Failed to acknowledge payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure users exist in the database
   */
  private async ensureUsersExist(addresses: string[]): Promise<void> {
    for (const address of addresses) {
      const normalizedAddress = address.toLowerCase();
      
      await prisma.user.upsert({
        where: { walletAddress: normalizedAddress },
        update: {},
        create: { walletAddress: normalizedAddress },
      });
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(walletAddress?: string): Promise<{
    totalPayments: number;
    totalAmount: string;
    completedPayments: number;
    pendingPayments: number;
  }> {
    try {
      const whereClause = walletAddress ? {
        OR: [
          { senderAddress: walletAddress.toLowerCase() },
          { recipientAddress: walletAddress.toLowerCase() },
        ],
      } : {};

      const [totalPayments, completedPayments, pendingPayments, payments] = await Promise.all([
        prisma.payment.count({ where: whereClause }),
        prisma.payment.count({ where: { ...whereClause, status: 'COMPLETED' } }),
        prisma.payment.count({ where: { ...whereClause, status: { in: ['PENDING', 'PROCESSING'] } } }),
        prisma.payment.findMany({ where: whereClause, select: { amount: true } }),
      ]);

      const totalAmount = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.amount);
      }, 0).toString();

      return {
        totalPayments,
        totalAmount,
        completedPayments,
        pendingPayments,
      };
    } catch (error) {
      logger.error('Error fetching payment stats:', error);
      throw new Error('Failed to fetch payment statistics');
    }
  }
}

export default PaymentService;