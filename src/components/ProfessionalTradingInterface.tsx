import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, Settings, BarChart3, Users } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';

interface ProfessionalTradingInterfaceProps {
  account?: string;
  isLeader?: boolean;
}

export const ProfessionalTradingInterface: React.FC<ProfessionalTradingInterfaceProps> = ({ account, isLeader }) => {
  const [selectedPair, setSelectedPair] = useState('TUSDC/TETH');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { executeTrade } = useContracts();

  const tradingPairs = [
    { symbol: 'TUSDC/TETH', price: '0.0005', change: '+2.5%', volume: '1.2M' },
    { symbol: 'TETH/TUSDC', price: '2000', change: '-1.2%', volume: '800K' },
  ];

  const orderBook = {
    asks: [
      { price: '0.00052', amount: '1000', total: '520' },
      { price: '0.00051', amount: '2000', total: '1020' },
      { price: '0.00050', amount: '1500', total: '750' },
    ],
    bids: [
      { price: '0.00049', amount: '1200', total: '588' },
      { price: '0.00048', amount: '1800', total: '864' },
      { price: '0.00047', amount: '2200', total: '1034' },
    ]
  };

  const recentTrades = [
    { price: '0.00050', amount: '500', time: '12:34:56', side: 'buy' },
    { price: '0.00049', amount: '750', time: '12:34:52', side: 'sell' },
    { price: '0.00051', amount: '300', time: '12:34:48', side: 'buy' },
  ];

  const handleTrade = async () => {
    if (!executeTrade || !amount) return;

    setIsSubmitting(true);
    try {
      // Mock trade execution
      const tokenA = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // TestUSDC
      const tokenB = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'; // TestETH
      const amountIn = BigInt(parseFloat(amount) * 1e18);
      const amountOut = BigInt(parseFloat(amount) * 0.95 * 1e18);

      await executeTrade(
        side === 'buy' ? tokenA : tokenB,
        side === 'buy' ? tokenB : tokenA,
        amountIn.toString(),
        amountOut.toString()
      );
    } catch (error) {
      console.error('Trade failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Left Panel - Trading Pairs & Order Book */}
      <div className="lg:col-span-1 space-y-4">
        {/* Trading Pairs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-white">Trading Pairs</h3>
          </div>
          <div className="p-2">
            {tradingPairs.map((pair, index) => (
              <div
                key={index}
                onClick={() => setSelectedPair(pair.symbol)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedPair === pair.symbol
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{pair.symbol}</span>
                  <div className="text-right">
                    <div className="text-sm text-white">{pair.price}</div>
                    <div className={`text-xs ${pair.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {pair.change}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Vol: {pair.volume}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Book */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-white">Order Book</h3>
          </div>
          <div className="p-2">
            {/* Asks */}
            <div className="space-y-1 mb-4">
              <div className="text-xs text-gray-400 px-2">Asks</div>
              {orderBook.asks.map((ask, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-red-400">{ask.price}</span>
                  <span className="text-white">{ask.amount}</span>
                  <span className="text-gray-400">{ask.total}</span>
                </div>
              ))}
            </div>

            {/* Spread */}
            <div className="text-center py-2 border-t border-gray-700">
              <div className="text-xs text-gray-400">Spread</div>
              <div className="text-sm text-white">0.00001 (2.0%)</div>
            </div>

            {/* Bids */}
            <div className="space-y-1 mt-4">
              <div className="text-xs text-gray-400 px-2">Bids</div>
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-green-400">{bid.price}</span>
                  <span className="text-white">{bid.amount}</span>
                  <span className="text-gray-400">{bid.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel - Chart & Trading Form */}
      <div className="lg:col-span-2 space-y-4">
        {/* Chart Placeholder */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">Trading Chart</p>
            <p className="text-sm text-gray-500">Real-time price data would be displayed here</p>
          </div>
        </div>

        {/* Trading Form */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Place Order</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOrderType('market')}
                className={`px-3 py-1 rounded text-sm ${
                  orderType === 'market'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType('limit')}
                className={`px-3 py-1 rounded text-sm ${
                  orderType === 'limit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="flex mb-4">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-2 px-4 rounded-l-md text-sm font-medium ${
                side === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-2 px-4 rounded-r-md text-sm font-medium ${
                side === 'sell'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {orderType === 'limit' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="bg-gray-700 rounded-md p-3">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Total</span>
                <span>≈ {amount ? (parseFloat(amount) * 0.0005).toFixed(6) : '0.000000'} TETH</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Fee</span>
                <span>0.1%</span>
              </div>
            </div>

            <button
              onClick={handleTrade}
              disabled={!amount || isSubmitting}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                side === 'buy'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${(!amount || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${selectedPair}`}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Recent Trades & Leader Info */}
      <div className="lg:col-span-1 space-y-4">
        {/* Recent Trades */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-white">Recent Trades</h3>
          </div>
          <div className="p-2">
            {recentTrades.map((trade, index) => (
              <div key={index} className="flex justify-between items-center py-2 text-xs">
                <div className={`flex items-center space-x-2 ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendingUp className={`w-3 h-3 ${trade.side === 'sell' ? 'rotate-180' : ''}`} />
                  <span>{trade.price}</span>
                </div>
                <span className="text-white">{trade.amount}</span>
                <span className="text-gray-400">{trade.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leader Status */}
        {isLeader && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Leader Mode</span>
            </div>
            <p className="text-xs text-gray-300">
              Your trades will be automatically copied to your followers
            </p>
          </div>
        )}

        {/* Market Stats */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3">Market Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">24h High</span>
              <span className="text-white">0.00052</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">24h Low</span>
              <span className="text-white">0.00048</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">24h Volume</span>
              <span className="text-white">1.2M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Change</span>
              <span className="text-green-400">+2.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};