import React, { useState } from 'react';
import { ArrowRight, Zap, Users, TrendingUp } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { CONTRACTS } from '../types/contracts';

interface TradeInterfaceProps {
  account?: string;
  isLeader?: boolean;
}

export const TradeInterface: React.FC<TradeInterfaceProps> = ({ account, isLeader }) => {
  const [tokenIn, setTokenIn] = useState(CONTRACTS.TestUSDC);
  const [tokenOut, setTokenOut] = useState(CONTRACTS.TestETH);
  const [amountIn, setAmountIn] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const { copyRelay, testUSDC, testETH } = useContracts();

  const tokens = [
    { address: CONTRACTS.TestUSDC, symbol: 'TUSDC', name: 'Test USDC' },
    { address: CONTRACTS.TestETH, symbol: 'TETH', name: 'Test ETH' }
  ];

  const getTokenInfo = (address: string) => {
    return tokens.find(t => t.address.toLowerCase() === address.toLowerCase()) || 
           { symbol: 'UNKNOWN', name: 'Unknown Token' };
  };

  const handleTrade = async () => {
    if (!copyRelay || !amountIn || !account) return;

    try {
      setIsTrading(true);
      
      // Simulate a trade - in real implementation, this would be a DEX swap
      // For testing, we'll just trigger the copy trading mechanism
      const amountInWei = BigInt(parseFloat(amountIn) * 1e18); // Convert to wei
      const amountOutWei = BigInt(parseFloat(amountIn) * 0.95 * 1e18); // 5% slippage simulation
      
      console.log('Executing trade:', {
        tokenIn,
        tokenOut,
        amountIn: amountInWei.toString(),
        amountOut: amountOutWei.toString()
      });

      // Call the copy trading hook to simulate trade detection
      const tx = await copyRelay.executeTrade(
        tokenIn,
        tokenOut,
        amountInWei,
        amountOutWei
      );
      
      await tx.wait();
      
      alert(`Trade executed successfully! ${isLeader ? 'Your followers will receive automatic copy trades.' : ''}`);
      setAmountIn('');
      
    } catch (error) {
      console.error('Trade failed:', error);
      alert('Trade failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          {isLeader ? '⚡ Leader Trading' : '💱 Token Swap'}
        </h3>
        {isLeader && (
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Users className="w-4 h-4" />
            <span>Copy Trading Enabled</span>
          </div>
        )}
      </div>

      {isLeader && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Leader Mode Active</span>
          </div>
          <p className="text-sm text-purple-700">
            Your trades will be automatically copied to your followers based on their subscription amounts.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Token In */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">From</label>
          <div className="flex space-x-3">
            <select
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 text-right"
            />
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center">
          <button
            onClick={switchTokens}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-purple-600 transform rotate-90" />
          </button>
        </div>

        {/* Token Out */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">To</label>
          <div className="flex space-x-3">
            <select
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            <div className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-right text-gray-600">
              {amountIn ? (parseFloat(amountIn) * 0.95).toFixed(4) : '0.0'}
            </div>
          </div>
        </div>

        {/* Trade Info */}
        {amountIn && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exchange Rate</span>
              <span>1 {getTokenInfo(tokenIn).symbol} = 0.95 {getTokenInfo(tokenOut).symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Slippage</span>
              <span>5%</span>
            </div>
            {isLeader && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Copy Trading</span>
                <span className="text-purple-600 font-semibold">✓ Enabled</span>
              </div>
            )}
          </div>
        )}

        {/* Trade Button */}
        <button
          onClick={handleTrade}
          disabled={!amountIn || !copyRelay || isTrading || tokenIn === tokenOut}
          className={`w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
            isLeader 
              ? 'btn-primary bg-gradient-to-r from-purple-500 to-pink-500' 
              : 'btn-primary'
          }`}
        >
          {isTrading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Trading...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              <span>{isLeader ? 'Execute Leader Trade' : 'Swap Tokens'}</span>
            </>
          )}
        </button>
      </div>

      {/* Test Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Testing Instructions:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Make sure you have test tokens (use the faucet)</li>
          <li>• {isLeader ? 'As a leader, your trades trigger copy trading for followers' : 'Create a strategy first to become a leader'}</li>
          <li>• Check the console for transaction details</li>
          <li>• Trades are simulated with 5% slippage</li>
        </ul>
      </div>
    </div>
  );
};