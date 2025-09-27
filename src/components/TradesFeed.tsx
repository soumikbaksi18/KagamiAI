import React from 'react';
import { ArrowRight, Clock, User, TrendingUp } from 'lucide-react';
import { TradeEvent } from '../types/contracts';

interface TradesFeedProps {
  trades?: TradeEvent[];
  loading?: boolean;
}

export const TradesFeed: React.FC<TradesFeedProps> = ({ trades = [], loading = false }) => {
  const formatToken = (address: string) => {
    // Simple token address mapping for display
    if (address === "0x5FbDB2315678afecb367f032d93F642f64180aa3") return "USDC";
    if (address === "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") return "ETH";
    return `${address.slice(0, 6)}...`;
  };

  const formatAmount = (amount: string, decimals: number = 6) => {
    const amt = parseFloat(amount) / Math.pow(10, decimals);
    if (amt === 0) return '0';
    if (amt < 0.01) return '<0.01';
    if (amt < 1000) return amt.toFixed(2);
    if (amt < 1000000) return `${(amt / 1000).toFixed(1)}K`;
    if (amt < 1000000000) return `${(amt / 1000000).toFixed(1)}M`;
    return `${(amt / 1000000000).toFixed(1)}B`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Live Trades</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700 h-16 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Live Trades</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">Live</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p>No trades yet. Start following strategies to see live trades!</p>
          </div>
        ) : (
          trades.map((trade) => (
            <div key={trade.tradeId} className="trade-item">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-white">
                        {formatToken(trade.tokenIn)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm text-white">
                        {formatToken(trade.tokenOut)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatAmount(trade.amountIn)} → {formatAmount(trade.amountOut)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(trade.timestamp)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {trade.leader.slice(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};