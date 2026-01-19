import { Router } from 'express';
import { param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import {
  getProofDetails,
  downloadProof,
  generateShareLink,
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

export default router;
