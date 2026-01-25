import { ethers } from 'ethers';
import { logger } from '../utils/logger';

/**
 * Service for anchoring proof hashes on the Flare blockchain
 */
export class FlareAnchorService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    const rpcUrl = process.env.FLARE_RPC_URL || 'https://flare-api.flare.network/ext/bc/C/rpc';
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required for anchoring');
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    logger.info(`Flare anchor service initialized with wallet: ${this.wallet.address}`);
  }

  /**
   * Anchor a proof hash on Flare blockchain using a simple transaction with data
   */
  async anchorProofHash(proofHash: string, paymentId: string): Promise<string> {
    try {
      logger.info(`Anchoring proof hash for payment ${paymentId}: ${proofHash}`);

      // Create a transaction with the proof hash in the data field
      const anchorData = this.encodeAnchorData(proofHash, paymentId);
      
      const transaction = {
        to: this.wallet.address, // Send to self
        value: ethers.utils.parseEther('0'), // No value transfer
        data: anchorData,
        gasLimit: 21000 + (anchorData.length * 16), // Base gas + data gas
      };

      // Send the transaction
      const tx = await this.wallet.sendTransaction(transaction);
      logger.info(`Anchor transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(1);
      logger.info(`Anchor transaction confirmed: ${receipt.transactionHash}`);

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Error anchoring proof hash:', error);
      throw new Error(`Failed to anchor proof hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Anchor multiple proof hashes in a single transaction
   */
  async anchorMultipleHashes(proofHashes: { hash: string; paymentId: string }[]): Promise<string> {
    try {
      logger.info(`Anchoring ${proofHashes.length} proof hashes`);

      // Encode multiple hashes
      const anchorData = this.encodeMultipleAnchorData(proofHashes);
      
      const transaction = {
        to: this.wallet.address,
        value: ethers.utils.parseEther('0'),
        data: anchorData,
        gasLimit: 21000 + (anchorData.length * 16),
      };

      const tx = await this.wallet.sendTransaction(transaction);
      logger.info(`Multi-anchor transaction sent: ${tx.hash}`);

      const receipt = await tx.wait(1);
      logger.info(`Multi-anchor transaction confirmed: ${receipt.transactionHash}`);

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Error anchoring multiple proof hashes:', error);
      throw new Error(`Failed to anchor proof hashes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify that a proof hash is anchored on Flare
   */
  async verifyAnchor(transactionHash: string, expectedProofHash: string): Promise<boolean> {
    try {
      const tx = await this.provider.getTransaction(transactionHash);
      if (!tx) {
        logger.warn(`Transaction not found: ${transactionHash}`);
        return false;
      }

      // Decode the anchor data
      const decodedData = this.decodeAnchorData(tx.data);
      
      // Check if the expected proof hash is in the anchored data
      return decodedData.proofHashes.includes(expectedProofHash);
    } catch (error) {
      logger.error('Error verifying anchor:', error);
      return false;
    }
  }

  /**
   * Get anchor information from a transaction
   */
  async getAnchorInfo(transactionHash: string): Promise<{
    proofHashes: string[];
    paymentIds: string[];
    timestamp: number;
    blockNumber: number;
  } | null> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(transactionHash),
        this.provider.getTransactionReceipt(transactionHash),
      ]);

      if (!tx || !receipt) {
        return null;
      }

      const block = await this.provider.getBlock(receipt.blockNumber);
      const decodedData = this.decodeAnchorData(tx.data);

      return {
        proofHashes: decodedData.proofHashes,
        paymentIds: decodedData.paymentIds,
        timestamp: block.timestamp,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Error getting anchor info:', error);
      return null;
    }
  }

  /**
   * Encode proof hash and payment ID for blockchain storage
   */
  private encodeAnchorData(proofHash: string, paymentId: string): string {
    // Create a simple encoding: PAYPROOF + version + hash + paymentId
    const version = '01'; // Version 1
    const prefix = ethers.utils.formatBytes32String('PAYPROOF').slice(0, 18); // 8 bytes
    const hashBytes = proofHash.startsWith('0x') ? proofHash : `0x${proofHash}`;
    const paymentIdBytes = ethers.utils.formatBytes32String(paymentId);
    
    return prefix + version + hashBytes.slice(2) + paymentIdBytes.slice(2);
  }

  /**
   * Encode multiple proof hashes for batch anchoring
   */
  private encodeMultipleAnchorData(proofHashes: { hash: string; paymentId: string }[]): string {
    const version = '02'; // Version 2 for multiple hashes
    const prefix = ethers.utils.formatBytes32String('PAYPROOF').slice(0, 18);
    const count = proofHashes.length.toString(16).padStart(2, '0');
    
    let data = prefix + version + count;
    
    for (const { hash, paymentId } of proofHashes) {
      const hashBytes = hash.startsWith('0x') ? hash : `0x${hash}`;
      const paymentIdBytes = ethers.utils.formatBytes32String(paymentId);
      data += hashBytes.slice(2) + paymentIdBytes.slice(2);
    }
    
    return data;
  }

  /**
   * Decode anchor data from transaction
   */
  private decodeAnchorData(data: string): { proofHashes: string[]; paymentIds: string[] } {
    if (!data || data.length < 20) {
      return { proofHashes: [], paymentIds: [] };
    }

    try {
      const version = data.slice(18, 20);
      
      if (version === '01') {
        // Single hash format
        const proofHash = '0x' + data.slice(20, 84);
        const paymentIdBytes = '0x' + data.slice(84, 148);
        const paymentId = ethers.utils.parseBytes32String(paymentIdBytes);
        
        return {
          proofHashes: [proofHash],
          paymentIds: [paymentId],
        };
      } else if (version === '02') {
        // Multiple hashes format
        const count = parseInt(data.slice(20, 22), 16);
        const proofHashes: string[] = [];
        const paymentIds: string[] = [];
        
        let offset = 22;
        for (let i = 0; i < count; i++) {
          const proofHash = '0x' + data.slice(offset, offset + 64);
          const paymentIdBytes = '0x' + data.slice(offset + 64, offset + 128);
          const paymentId = ethers.utils.parseBytes32String(paymentIdBytes);
          
          proofHashes.push(proofHash);
          paymentIds.push(paymentId);
          offset += 128;
        }
        
        return { proofHashes, paymentIds };
      }
    } catch (error) {
      logger.error('Error decoding anchor data:', error);
    }
    
    return { proofHashes: [], paymentIds: [] };
  }

  /**
   * Get wallet balance for anchoring operations
   */
  async getWalletBalance(): Promise<string> {
    try {
      const balance = await this.wallet.getBalance();
      return ethers.utils.formatEther(balance);
    } catch (error) {
      logger.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Estimate gas cost for anchoring
   */
  async estimateAnchorCost(proofHash: string, paymentId: string): Promise<{
    gasLimit: number;
    gasPrice: string;
    estimatedCost: string;
  }> {
    try {
      const anchorData = this.encodeAnchorData(proofHash, paymentId);
      const gasLimit = 21000 + (anchorData.length * 16);
      const gasPrice = await this.provider.getGasPrice();
      const estimatedCost = ethers.utils.formatEther(gasPrice.mul(gasLimit));

      return {
        gasLimit,
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        estimatedCost,
      };
    } catch (error) {
      logger.error('Error estimating anchor cost:', error);
      throw error;
    }
  }
}

export default FlareAnchorService;