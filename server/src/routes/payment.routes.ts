import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { submitPayment, getPaymentHistory } from '../controllers/payment.controller';

const router = Router();

// Submit a new payment
router.post(
  '/submit',
  [
    body('senderAddress').isEthereumAddress().withMessage('Invalid sender address'),
    body('recipientAddress').isEthereumAddress().withMessage('Invalid recipient address'),
    body('amount')
      .isString()
      .matches(/^\d+$/)
      .withMessage('Amount must be a positive integer'),
    body('memo').optional().isString().withMessage('Memo must be a string'),
  ],
  validateRequest,
  submitPayment
);

// Get payment history for a wallet
router.get(
  '/history/:walletAddress',
  [
    // Add any authentication middleware here if needed
  ],
  getPaymentHistory
);

export default router;
