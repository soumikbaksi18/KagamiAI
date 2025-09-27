// Contract addresses from deployment (local hardhat network chain ID 31337)
// Updated with fresh deployment addresses - January 2024
export const CONTRACTS = {
  TestUSDC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",    // From minimal deployment
  TestETH: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",     // From TestETH deployment  
  StrategyNFT: "0x9A676e781A523b5d0C0e43731313A708CB607508", // Modified contract with multi-strategy support
  CopyRelay: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",   // From minimal deployment
  CopyHook: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",   // Deployed CopyHook
  CopyTradingHookV4: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", // Deployed v4 Hook
  TWAPBot: "0x0355B7B8cb128fA5692729Ab3AAa199C1753f726"     // TWAP Bot with 1inch integration
} as const;

// Network configuration
export const SUPPORTED_NETWORKS = {
  POLYGON_AMOY: {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://rpc-amoy.polygon.technology/',
    blockExplorer: 'https://amoy.polygonscan.com/'
  },
  LOCAL_HARDHAT: {
    chainId: 31337,
    name: 'Local Hardhat',
    rpcUrl: 'http://localhost:8545',
    blockExplorer: 'http://localhost:8545'
  }
} as const;

// Contract interfaces
export interface Strategy {
  leader: string;
  name: string;
  description: string;
  performanceFee: number;
  isActive: boolean;
  totalFollowers: number;
  totalVolume: string;
  createdAt: number;
}

export interface Subscription {
  follower: string;
  leader: string;
  strategyId: number;
  subscriptionFee: string;
  performanceFee: number;
  isActive: boolean;
  subscribedAt: number;
  lastTradeTime: number;
}

export interface Trade {
  leader: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  isExecuted: boolean;
}

export interface TradeEvent {
  tradeId: string;
  leader: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
}

export interface TWAPOrder {
  orderId: number;
  user: string;
  tokenIn: string;
  tokenOut: string;
  totalAmountIn: string;
  amountPerInterval: string;
  intervalSeconds: number;
  executedAmount: string;
  remainingIntervals: number;
  lastExecutionTime: number;
  minAmountOut: string;
  isActive: boolean;
  createdAt: number;
}