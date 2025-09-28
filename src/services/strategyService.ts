import { ethers } from 'ethers';

export interface StrategyData {
  id: string;
  name: string;
  description: string;
  leader: string;
  performanceFee: number;
  createdAt: number;
  isActive: boolean;
  totalVolume: string;
  totalPnl: number;
  followerCount: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  price: string;
  pnl: number;
  status: 'completed' | 'pending' | 'failed';
}

export interface Position {
  token: string;
  symbol: string;
  amount: string;
  value: string;
  pnl: number;
  pnlPercentage: number;
  avgPrice: string;
}

export class StrategyService {
  private provider: ethers.JsonRpcProvider;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
  }

  async getStrategyData(strategyId: string): Promise<StrategyData | null> {
    try {
      // For now, return mock data
      // In production, this would fetch from the StrategyNFT contract
      const mockData: StrategyData = {
        id: strategyId,
        name: `Strategy ${strategyId}`,
        description: 'Advanced trading strategy with AI-powered decision making',
        leader: '0x1234567890123456789012345678901234567890',
        performanceFee: 2.5,
        createdAt: Date.now() - 86400000 * 30, // 30 days ago
        isActive: true,
        totalVolume: '125,430',
        totalPnl: 15.67,
        followerCount: 23,
        winRate: 68.5,
        maxDrawdown: -8.2,
        sharpeRatio: 1.45
      };

      return mockData;
    } catch (error) {
      console.error('Error fetching strategy data:', error);
      return null;
    }
  }

  async getStrategyTrades(strategyId: string): Promise<Trade[]> {
    try {
      // Mock trade data
      const mockTrades: Trade[] = [
        {
          id: '1',
          timestamp: Date.now() - 3600000,
          type: 'buy',
          tokenIn: 'TUSDC',
          tokenOut: 'TETH',
          amountIn: '1000',
          amountOut: '0.45',
          price: '2222.22',
          pnl: 45.67,
          status: 'completed'
        },
        {
          id: '2',
          timestamp: Date.now() - 7200000,
          type: 'sell',
          tokenIn: 'TETH',
          tokenOut: 'TUSDC',
          amountIn: '0.2',
          amountOut: '450',
          price: '2250.00',
          pnl: -12.34,
          status: 'completed'
        },
        {
          id: '3',
          timestamp: Date.now() - 10800000,
          type: 'buy',
          tokenIn: 'TUSDC',
          tokenOut: 'TETH',
          amountIn: '500',
          amountOut: '0.22',
          price: '2272.73',
          pnl: 78.90,
          status: 'completed'
        }
      ];

      return mockTrades;
    } catch (error) {
      console.error('Error fetching strategy trades:', error);
      return [];
    }
  }

  async getStrategyPositions(strategyId: string): Promise<Position[]> {
    try {
      // Mock position data
      const mockPositions: Position[] = [
        {
          token: 'TETH',
          symbol: 'TETH',
          amount: '0.47',
          value: '1,056.78',
          pnl: 156.78,
          pnlPercentage: 17.4,
          avgPrice: '2,180.45'
        },
        {
          token: 'TUSDC',
          symbol: 'TUSDC',
          amount: '2,340.56',
          value: '2,340.56',
          pnl: 0,
          pnlPercentage: 0,
          avgPrice: '1.00'
        }
      ];

      return mockPositions;
    } catch (error) {
      console.error('Error fetching strategy positions:', error);
      return [];
    }
  }

  async getStrategyFollowers(strategyId: string): Promise<string[]> {
    try {
      // Mock followers data
      const mockFollowers = [
        '0xabc123def456789012345678901234567890abcd',
        '0x123456789012345678901234567890123456789a',
        '0x789012345678901234567890123456789012345b'
      ];

      return mockFollowers;
    } catch (error) {
      console.error('Error fetching strategy followers:', error);
      return [];
    }
  }

  async isUserFollowing(strategyId: string, userAddress: string): Promise<boolean> {
    try {
      // Mock following status
      return Math.random() > 0.5; // Random for demo
    } catch (error) {
      console.error('Error checking following status:', error);
      return false;
    }
  }

  async followStrategy(strategyId: string): Promise<boolean> {
    try {
      console.log(`Following strategy ${strategyId}`);
      // In production, this would call the CopyRelay contract
      return true;
    } catch (error) {
      console.error('Error following strategy:', error);
      return false;
    }
  }

  async unfollowStrategy(strategyId: string): Promise<boolean> {
    try {
      console.log(`Unfollowing strategy ${strategyId}`);
      // In production, this would call the CopyRelay contract
      return true;
    } catch (error) {
      console.error('Error unfollowing strategy:', error);
      return false;
    }
  }

  // Helper functions
  formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const strategyService = new StrategyService();