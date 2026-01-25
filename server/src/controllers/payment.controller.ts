import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { PaymentService } from '../services/paymentService';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';

interface PaymentRequest {
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  currency?: string;
  memo?: string;
  transactionHash: string;
}

const paymentService = new PaymentService();

/**
 * @route   POST /api/payment/submit
 * @desc    Submit a new payment
 * @access  Private
 */
export const submitPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { senderAddress, recipientAddress, amount, currency, memo, transactionHash }: PaymentRequest = req.body;

    // Validate input
    if (!ethers.utils.isAddress(senderAddress) || !ethers.utils.isAddress(recipientAddress)) {
      throw new ApiError(400, 'Invalid sender or recipient address');
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new ApiError(400, 'Invalid amount');
    }

    if (!transactionHash) {
      throw new ApiError(400, 'Transaction hash is required');
    }

    logger.info(`Processing payment submission: ${transactionHash}`);

    // Create payment using the service
    const payment = await paymentService.createPayment({
      senderAddress,
      recipientAddress,
      amount,
      currency: currency || 'FLR',
      memo,
      transactionHash,
    });

    return res.status(201).json({
      status: 'success',
      data: payment,
    });
  } catch (error) {
    logger.error('Error in submitPayment:', error);
    next(error);
  }
};

/**
 * @route   GET /api/payment/history/:walletAddress
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
    const offset = (pageNum - 1) * limitNum;

    logger.info(`Fetching payment history for wallet: ${walletAddress}`);

    const { payments, total } = await paymentService.getPaymentHistory(
      walletAddress,
      limitNum,
      offset
    );

    return res.status(200).json({
      status: 'success',
      data: {
        payments: payments.map((payment) => ({
          ...payment,
          // Add URLs for frontend
          proofUrl: `${req.protocol}://${req.get('host')}/api/proof/${payment.id}`,
          downloadUrl: `${req.protocol}://${req.get('host')}/api/proof/${payment.id}/download`,
          flareExplorerUrl: payment.flareAnchorTxHash
            ? `https://coston2-api.flare.network/tx/${payment.flareAnchorTxHash}`
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
    logger.error('Error in getPaymentHistory:', error);
    next(error);
  }
};

/**
 * @route   GET /api/payment/stats/:walletAddress?
 * @desc    Get payment statistics
 * @access  Private
 */
export const getPaymentStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletAddress = Array.isArray(req.params.walletAddress) 
      ? req.params.walletAddress[0] 
      : req.params.walletAddress;

    if (walletAddress && !ethers.utils.isAddress(walletAddress)) {
      throw new ApiError(400, 'Invalid wallet address');
    }

    const stats = await paymentService.getPaymentStats(walletAddress);

    return res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    logger.error('Error in getPaymentStats:', error);
    next(error);
  }
};
