import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { ProofRailsService } from '../services/proofRailsService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

const paymentService = new PaymentService();

/**
 * @route   GET /api/proof/:id
 * @desc    Get proof details by payment ID
 * @access  Public (with optional authentication for private details)
 */
export const getProofDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const includePrivate = Array.isArray(req.query.includePrivate) 
      ? req.query.includePrivate[0] 
      : req.query.includePrivate || 'false';
      
    const includePrivateDetails = includePrivate === 'true';

    logger.info(`Fetching proof details for payment: ${id}`);

    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // Generate QR code for sharing
    let qrCode = '';
    try {
      const host = req.get('host') || 'localhost:3001';
      const shareUrl = `${req.protocol}://${host.replace(/:\d+$/, '')}:3000/proof/${payment.id}`;
      qrCode = await QRCode.toDataURL(shareUrl);
    } catch (error) {
      logger.error('Error generating QR code:', { error, paymentId: id });
    }

    // Prepare response data
    const responseData: any = {
      id: payment.id,
      transactionHash: payment.transactionHash,
      recipientAddress: payment.recipientAddress,
      amount: payment.amount,
      currency: payment.currency,
      memo: payment.memo,
      status: payment.status,
      proofHash: payment.proofHash,
      flareAnchorTxHash: payment.flareAnchorTxHash,
      createdAt: payment.createdAt,
      acknowledged: payment.memo?.includes('[ACKNOWLEDGED]') || false,
      acknowledgedAt: payment.memo?.includes('[ACKNOWLEDGED]') ? payment.updatedAt : null,
      proofUrl: `${req.protocol}://${req.get('host')}/api/proof/${payment.id}`,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/proof/${payment.id}/download`,
      flareExplorerUrl: payment.flareAnchorTxHash
        ? `https://flare-explorer.flare.network/tx/${payment.flareAnchorTxHash}`
        : null,
      qrCodeUrl: qrCode,
      verificationUrl: `${req.protocol}://${req.get('host')}/api/proof/${payment.id}/verify`,
    };

    // Only include sender address if explicitly requested and authorized
    if (includePrivateDetails) {
      responseData.senderAddress = payment.senderAddress;
    }

    return res.status(200).json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
    logger.error('Error in getProofDetails:', error);
    next(error);
  }
};

/**
 * @route   GET /api/proof/:id/download
 * @desc    Download proof as a file (e.g., PDF, JSON)
 * @access  Public
 */
export const downloadProof = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const format = Array.isArray(req.query.format) ? req.query.format[0] : req.query.format || 'json';

    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // Format the payment data for download
    const proofData = {
      id: payment.id,
      transactionHash: payment.transactionHash,
      senderAddress: payment.senderAddress,
      recipientAddress: payment.recipientAddress,
      amount: payment.amount,
      currency: payment.currency,
      memo: payment.memo,
      status: payment.status,
      proofRailsRecordId: payment.proofRailsRecordId,
      flareAnchorTxHash: payment.flareAnchorTxHash,
      timestamp: payment.createdAt,
      proofUrl: `${req.protocol}://${req.get('host')}/api/proof/${payment.id}`,
      flareExplorerUrl: payment.flareAnchorTxHash
        ? `https://flare-explorer.flare.network/tx/${payment.flareAnchorTxHash}`
        : null,
    };

    // Set appropriate headers based on format
    if (format === 'pdf') {
      // In a real app, you would generate a PDF here
      // For now, we'll return JSON with a different content type
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=proof_${payment.id}.pdf`);
      return res.status(200).json({
        message: 'PDF generation not implemented. Returning JSON instead.',
        ...proofData,
      });
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=proof_${payment.id}.json`);
      return res.status(200).json(proofData);
    }
  } catch (error) {
    logger.error('Error in downloadProof:', error);
    next(error);
  }
};

/**
 * @route   GET /api/proof/:id/share
 * @desc    Generate a shareable link for a proof
 * @access  Public
 */
export const generateShareLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ensure id is a string, not an array
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    if (!id) {
      throw new ApiError(400, 'Payment ID is required');
    }
    
    // Verify the payment exists
    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // In a real app, you might want to:
    // 1. Generate a unique token for this share link
    // 2. Store it in the database with an expiration time
    // 3. Return the full URL with the token
    
    // For now, we'll just return the basic share URL
    const host = req.get('host') || 'localhost:3001';
    const shareUrl = `${req.protocol}://${host.replace(/:\d+$/, '')}:3000/proof/${id}`;
    
    return res.status(200).json({
      status: 'success',
      data: {
        shareUrl,
        expiresAt: null, // In a real app, set an expiration time
      },
    });
  } catch (error) {
    logger.error('Error in generateShareLink:', error);
    next(error);
  }
};

/**
 * @route   POST /api/proof/:id/acknowledge
 * @desc    Acknowledge a payment (for recipients)
 * @access  Public
 */
export const acknowledgePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { acknowledgerAddress } = req.body;

    if (!acknowledgerAddress) {
      throw new ApiError(400, 'Acknowledger address is required');
    }

    logger.info(`Acknowledging payment ${id} by ${acknowledgerAddress}`);

    const updatedPayment = await paymentService.acknowledgePayment(id, acknowledgerAddress);

    return res.status(200).json({
      status: 'success',
      data: {
        id: updatedPayment.id,
        acknowledged: true,
        acknowledgedAt: updatedPayment.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error in acknowledgePayment:', error);
    next(error);
  }
};

/**
 * @route   GET /api/proof/:id/verify
 * @desc    Verify a payment proof
 * @access  Public
 */
export const verifyProof = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    logger.info(`Verifying proof for payment: ${id}`);

    const verification = await paymentService.verifyPaymentProof(id);

    return res.status(200).json({
      status: 'success',
      data: {
        valid: verification.valid,
        payment: verification.payment ? {
          id: verification.payment.id,
          status: verification.payment.status,
          amount: verification.payment.amount,
          currency: verification.payment.currency,
          createdAt: verification.payment.createdAt,
        } : null,
        verification: {
          anchorVerified: verification.anchorVerified,
          recordVerified: verification.recordVerified,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Error in verifyProof:', error);
    next(error);
  }
};

/**
 * @route   GET /api/proof/:id/iso-records
 * @desc    Get ISO 20022 records for a payment
 * @access  Private
 */
export const getISORecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    logger.info(`Fetching ISO records for payment: ${id}`);

    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // Generate ISO records for demonstration
    const paymentData = {
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

    return res.status(200).json({
      status: 'success',
      data: {
        paymentId: payment.id,
        records: isoRecords.map(record => ({
          type: record.recordType,
          id: record.recordId,
          hash: record.hash,
          content: record.content,
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error in getISORecords:', error);
    next(error);
  }
};