import React, { useState } from 'react';
import { X, Clock, DollarSign, Zap, Info, Calculator } from 'lucide-react';
import { CONTRACTS } from '../types/contracts';

interface TWAPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (twapData: {
    tokenIn: string;
    tokenOut: string;
    totalAmount: string;
    intervals: number;
    intervalHours: number;
    minAmountOut: string;
  }) => void;
}

export const TWAPModal: React.FC<TWAPModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [tokenIn, setTokenIn] = useState(CONTRACTS.TestUSDC);
  const [tokenOut, setTokenOut] = useState(CONTRACTS.TestETH);
  const [totalAmount, setTotalAmount] = useState('');
  const [intervals, setIntervals] = useState(10);
  const [intervalHours, setIntervalHours] = useState(1);
  const [minAmountOut, setMinAmountOut] = useState('');

  // Token options
  const tokens = [
    { address: CONTRACTS.TestUSDC, symbol: 'TUSDC', name: 'Test USDC' },
    { address: CONTRACTS.TestETH, symbol: 'TETH', name: 'Test ETH' }
  ];

  // Calculate derived values
  const amountPerInterval = totalAmount ? (parseFloat(totalAmount) / intervals).toFixed(6) : '0';
  const totalDuration = intervals * intervalHours;
  const executionFee = (intervals * 0.001).toFixed(3); // 0.001 ETH per interval

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalAmount || !minAmountOut) return;

    onSubmit({
      tokenIn,
      tokenOut,
      totalAmount,
      intervals,
      intervalHours,
      minAmountOut
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card-premium p-8 max-w-2xl w-full neon-glow relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center neon-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Create TWAP Bot
              </h2>
              <p className="text-sm text-gray-400">Time-Weighted Average Price trading with 1inch</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-300 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Token to Sell
              </label>
              <select
                value={tokenIn}
                onChange={(e) => setTokenIn(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {tokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Token to Buy
              </label>
              <select
                value={tokenOut}
                onChange={(e) => setTokenOut(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {tokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Total Amount
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="1000"
                step="0.000001"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Number of Intervals
              </label>
              <input
                type="number"
                value={intervals}
                onChange={(e) => setIntervals(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Timing Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Interval Duration (hours)
              </label>
              <select
                value={intervalHours}
                onChange={(e) => setIntervalHours(parseFloat(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={0.25}>15 minutes</option>
                <option value={0.5}>30 minutes</option>
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Min Amount Out (per interval)
              </label>
              <input
                type="number"
                value={minAmountOut}
                onChange={(e) => setMinAmountOut(e.target.value)}
                placeholder="0.4"
                step="0.000001"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">TWAP Summary</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Amount per Interval</div>
                <div className="text-white font-semibold">{amountPerInterval}</div>
              </div>
              <div>
                <div className="text-gray-400">Total Duration</div>
                <div className="text-white font-semibold">{totalDuration}h</div>
              </div>
              <div>
                <div className="text-gray-400">Execution Fee</div>
                <div className="text-white font-semibold">{executionFee} ETH</div>
              </div>
              <div>
                <div className="text-gray-400">First Execution</div>
                <div className="text-white font-semibold">Immediate</div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">TWAP Benefits</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Reduced Price Impact</div>
                  <div className="text-gray-400 text-sm">Split large orders to minimize market impact</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Dollar Cost Averaging</div>
                  <div className="text-gray-400 text-sm">Average entry price over time</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">1inch Integration</div>
                  <div className="text-gray-400 text-sm">Best prices across all DEXs</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Gasless Execution</div>
                  <div className="text-gray-400 text-sm">Automated execution by keepers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!totalAmount || !minAmountOut}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create TWAP Bot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};