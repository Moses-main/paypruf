export class WalletError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WalletError);
    }
  }
}

export const WalletErrorCodes = {
  // Connection errors
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  NO_WALLET_DETECTED: 'NO_WALLET_DETECTED',
  NO_CONNECTOR: 'NO_CONNECTOR',
  NO_INJECTED_WALLET: 'NO_INJECTED_WALLET',
  WALLETCONNECT_ERROR: 'WALLETCONNECT_ERROR',
  NO_CONNECTORS: 'NO_CONNECTORS',
  
  // Network errors
  SWITCH_NETWORK_ERROR: 'SWITCH_NETWORK_ERROR',
  UNSUPPORTED_CHAIN: 'UNSUPPORTED_CHAIN',
  
  // Transaction errors
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type WalletErrorCode = typeof WalletErrorCodes[keyof typeof WalletErrorCodes];
