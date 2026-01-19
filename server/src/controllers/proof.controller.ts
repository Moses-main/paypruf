import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

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

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        transactionHash: true,
        senderAddress: includePrivateDetails || undefined,
        recipientAddress: true,
        amount: true,
        currency: true,
        memo: true,
        status: true,
        proofRailsRecordId: true,
        flareAnchorTxHash: true,
        createdAt: true,
      },
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // Generate QR code for sharing
    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(
        `${process.env.FRONTEND_URL}/proof/${payment.id}`
      );
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
      createdAt: payment.createdAt,
      proofUrl: payment.proofRailsRecordId
        ? `${process.env.API_URL}/api/proof/${payment.id}`
        : null,
      downloadUrl: payment.proofRailsRecordId
        ? `${process.env.API_URL}/api/proof/${payment.id}/download`
        : null,
      flareExplorerUrl: payment.flareAnchorTxHash
        ? `https://flare-explorer.flare.network/tx/${payment.flareAnchorTxHash}`
        : null,
      qrCode,
    };

    // Only include sender address if explicitly requested and authorized
    if (includePrivateDetails) {
      // In a real app, you would verify the user has permission to see this
      responseData.senderAddress = payment.senderAddress;
    }

    return res.status(200).json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
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

    const payment = await prisma.payment.findUnique({
      where: { id },
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
    });

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
      proofUrl: `${process.env.API_URL}/api/proof/${payment.id}`,
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
    const payment = await prisma.payment.findUnique({
      where: { id: String(id) },
      select: { id: true },
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // In a real app, you might want to:
    // 1. Generate a unique token for this share link
    // 2. Store it in the database with an expiration time
    // 3. Return the full URL with the token
    
    // For now, we'll just return the basic share URL
    const shareUrl = `${process.env.FRONTEND_URL}/proof/${id}`;
    
    return res.status(200).json({
      status: 'success',
      data: {
        shareUrl,
        expiresAt: null, // In a real app, set an expiration time
      },
    });
  } catch (error) {
    next(error);
  }
};
