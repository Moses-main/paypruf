import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { ProofRails } from '@proofrails/sdk';

// Initialize providers and contracts
const flareProvider = new ethers.providers.JsonRpcProvider(process.env.FLARE_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', flareProvider);

// USDT0 ABI (simplified)
const USDT0_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

// Initialize USDT0 contract
const usdt0Contract = new ethers.Contract(
  process.env.USDT0_CONTRACT_ADDRESS || '',
  USDT0_ABI,
  wallet
);

// Initialize ProofRails client with config
const proofRails = new ProofRails({
  apiKey: process.env.PROOFRAILS_API_KEY || '',
  // API URL will be set via environment variable if needed
});

interface ProcessPaymentParams {
  paymentId: string;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  memo?: string;
}

interface ProcessPaymentResult {
  txHash: string;
  paymentId: string;
  proofId?: string;
}

export const processPaymentWithProofRails = async ({
  paymentId,
  senderAddress,
  recipientAddress,
  amount,
  memo = '',
}: ProcessPaymentParams): Promise<ProcessPaymentResult> => {
  try {
    // 1. Check sender's balance
    const senderBalance = await usdt0Contract.balanceOf(senderAddress);
    if (senderBalance.lt(ethers.BigNumber.from(amount))) {
      throw new ApiError(400, 'Insufficient balance');
    }

    // 2. Check allowance
    const allowance = await usdt0Contract.allowance(senderAddress, wallet.address);
    if (allowance.lt(ethers.BigNumber.from(amount))) {
      throw new ApiError(400, 'Insufficient allowance. Please approve the contract first.');
    }

    // 3. Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        transactionHash: '', // Will be updated after transaction
        senderAddress,
        recipientAddress,
        amount: amount.toString(),
        currency: 'USDT0',
        memo: memo || '',
        status: 'PENDING'
      }
    });

    // 4. Transfer USDT0
    let receipt;
    try {
      const tx = await usdt0Contract.transfer(recipientAddress, amount);
      receipt = await tx.wait();
      
      // Update payment with transaction hash
      await prisma.payment.update({
        where: { id: paymentId },
        data: { transactionHash: receipt.transactionHash }
      });
    } catch (error) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' }
      });
      throw new ApiError(500, 'Transaction failed');
    }

    // 4. Update payment status to completed
    // We'll handle proof creation asynchronously to not block the payment flow
    await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status: 'COMPLETED',
        // These will be updated when the proof is created
        proofRailsRecordId: 'pending-proof',
        proofHash: 'pending-hash'
      }
    });

    // 5. Create proof asynchronously if API key is available
    if (process.env.PROOFRAILS_API_KEY) {
      (async () => {
        try {
          // In a real implementation, you would call the ProofRails API here
          // For now, we'll just log that we would create a proof
          logger.info('Would create proof for payment', { 
            paymentId,
            txHash: receipt.transactionHash 
          });
          
          // In a real implementation, you would update the payment with the actual proof ID and hash
          // await prisma.payment.update({
          //   where: { id: paymentId },
          //   data: { 
          //     proofRailsRecordId: actualProofId,
          //     proofHash: actualProofHash
          // }
          // });
        } catch (error) {
          logger.error('Error creating proof with ProofRails:', { 
            error, 
            paymentId,
            transactionHash: receipt.transactionHash
          });
        }
      })();
    }
    // Return the transaction hash and payment ID
    return { 
      txHash: receipt.transactionHash,
      paymentId
    };

  } catch (error) {
    // Update payment status to failed
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' }
    });

    logger.error('Error processing payment:', { 
      error, 
      paymentId,
      senderAddress,
      recipientAddress
    });
    
    throw new ApiError(500, 'Failed to process payment', false);
  }
};