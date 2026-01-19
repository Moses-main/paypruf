import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';
import { processPaymentWithProofRails } from '../services/payment.service';

interface PaymentRequest {
  senderAddress: string;
  recipientAddress: string;
  amount: string; // In wei or smallest unit of USDT0
  memo?: string;
}

/**
 * @route   POST /api/payment/submit
 * @desc    Submit a new payment
 * @access  Private
 */
export const submitPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { senderAddress, recipientAddress, amount, memo = '' }: PaymentRequest = req.body;

    // Validate input
    if (!ethers.utils.isAddress(senderAddress) || !ethers.utils.isAddress(recipientAddress)) {
      throw new ApiError(400, 'Invalid sender or recipient address');
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new ApiError(400, 'Invalid amount');
    }

    // Create payment record in database with PENDING status
    // Using a temporary transaction hash that will be updated later
    const tempTxHash = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const payment = await prisma.payment.create({
      data: {
        senderAddress: senderAddress.toLowerCase(),
        recipientAddress: recipientAddress.toLowerCase(),
        amount: amount.toString(),
        memo,
        status: 'PENDING',
        transactionHash: tempTxHash, // Temporary hash that will be updated
      },
    });

    try {
      // Process payment and get transaction hash
      const { txHash, proofId } = await processPaymentWithProofRails({
        paymentId: payment.id,
        senderAddress,
        recipientAddress,
        amount,
        memo,
      });

      // Update payment record with transaction hash and proof ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionHash: txHash,
          proofRailsRecordId: proofId,
          status: 'COMPLETED',
        },
      });

      return res.status(201).json({
        status: 'success',
        data: {
          payment: {
            id: payment.id,
            transactionHash: txHash,
            status: 'COMPLETED',
          },
        },
      });
    } catch (error) {
      // Update payment status to FAILED if there's an error
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      throw error; // Let the error handler handle it
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payment/history
 * @desc    Get payment history for a wallet
 * @access  Private
 */
export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletAddress = Array.isArray(req.params.walletAddress) 
    ? req.params.walletAddress[0] 
    : req.params.walletAddress;
    const { page = 1, limit = 10 } = req.query;

    if (!ethers.utils.isAddress(walletAddress)) {
      throw new ApiError(400, 'Invalid wallet address');
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          OR: [
            { senderAddress: walletAddress?.toLowerCase() },
            { recipientAddress: walletAddress?.toLowerCase() },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          transactionHash: true,
          senderAddress: true,
          recipientAddress: true,
          amount: true,
          currency: true,
          memo: true,
          status: true,
          proofRailsRecordId: true,
          flareAnchorTxHash: true,
          createdAt: true,
        },
      }),
      prisma.payment.count({
        where: {
          OR: [
            { senderAddress: walletAddress?.toLowerCase() },
            { recipientAddress: walletAddress?.toLowerCase() },
          ],
        },
      }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        payments: payments.map((payment) => ({
          ...payment,
          // Add URLs for frontend
          proofUrl: payment.proofRailsRecordId
            ? `${process.env.API_URL}/api/proof/${payment.id}`
            : null,
          downloadUrl: payment.proofRailsRecordId
            ? `${process.env.API_URL}/api/proof/${payment.id}/download`
            : null,
          flareExplorerUrl: payment.flareAnchorTxHash
            ? `https://flare-explorer.flare.network/tx/${payment.flareAnchorTxHash}`
            : null,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
