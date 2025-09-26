// Re-export all types for easier importing
export * from './contracts';

// Additional common types
export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  loading: boolean;
}