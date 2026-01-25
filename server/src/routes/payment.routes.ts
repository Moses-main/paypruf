import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { submitPayment, getPaymentHistory, getPaymentStats } from '../controllers/payment.controller';

const router = Router();

// Submit a new payment
router.post(
  '/submit',
  [
    body('senderAddress').isEthereumAddress().withMessage('Invalid sender address'),
    body('recipientAddress').isEthereumAddress().withMessage('Invalid recipient address'),
    body('amount')
      .isString()
      .matches(/^\d+(\.\d+)?$/)
      .withMessage('Amount must be a valid number'),
    body('currency').optional().isString().withMessage('Currency must be a string'),
    body('memo').optional().isString().withMessage('Memo must be a string'),
    body('transactionHash').isString().withMessage('Transaction hash is required'),
  ],
  validateRequest,
  submitPayment
);

// Get payment history for a wallet
router.get(
  '/history/:walletAddress',
  getPaymentHistory
);

// Get payment statistics
router.get(
  '/stats/:walletAddress?',
  getPaymentStats
);

export default router;
