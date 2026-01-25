import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import {
  getProofDetails,
  downloadProof,
  generateShareLink,
  acknowledgePayment,
  verifyProof,
  getISORecords,
} from '../controllers/proof.controller';

const router = Router();

// Get proof details by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid payment ID'),
    query('includePrivate')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('includePrivate must be true or false'),
  ],
  validateRequest,
  getProofDetails
);

// Download proof as a file
router.get(
  '/:id/download',
  [
    param('id').isUUID().withMessage('Invalid payment ID'),
    query('format')
      .optional()
      .isIn(['json', 'pdf'])
      .withMessage('Format must be json or pdf'),
  ],
  validateRequest,
  downloadProof
);

// Generate a shareable link for a proof
router.get(
  '/:id/share',
  [param('id').isUUID().withMessage('Invalid payment ID')],
  validateRequest,
  generateShareLink
);

// Acknowledge a payment
router.post(
  '/:id/acknowledge',
  [
    param('id').isUUID().withMessage('Invalid payment ID'),
    body('acknowledgerAddress').isEthereumAddress().withMessage('Invalid acknowledger address'),
  ],
  validateRequest,
  acknowledgePayment
);

// Verify a payment proof
router.get(
  '/:id/verify',
  [param('id').isUUID().withMessage('Invalid payment ID')],
  validateRequest,
  verifyProof
);

// Get ISO 20022 records for a payment
router.get(
  '/:id/iso-records',
  [param('id').isUUID().withMessage('Invalid payment ID')],
  validateRequest,
  getISORecords
);

export default router;