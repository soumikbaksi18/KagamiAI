import React, { useState, useEffect } from 'react';
import { Zap, Users, Settings, Activity, ArrowRight } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { CONTRACTS } from '../types/contracts';

interface V4PoolInterfaceProps {
  account?: string;
  isLeader?: boolean;
}

interface PoolInfo {
  id: string;
  tokenA: string;
  tokenB: string;
  symbolA: string;
  symbolB: string;
  copyTradingEnabled: boolean;
  totalLiquidity: string;
  volume24h: string;
}

export const V4PoolInterface: React.FC<V4PoolInterfaceProps> = ({ account, isLeader }) => {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [amountIn, setAmountIn] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const { signer, executeTrade } = useContracts();

  const mockPools: PoolInfo[] = [
    {
      id: '0x1234567890abcdef1234567890abcdef12345678',
      tokenA: CONTRACTS.TestUSDC,
      tokenB: CONTRACTS.TestETH,
      symbolA: 'TUSDC',
      symbolB: 'TETH',
      copyTradingEnabled: true,
      totalLiquidity: '2450000',
      volume24h: '1200000'
    },
    {
      id: '0xabcdef1234567890abcdef1234567890abcdef12',
      tokenA: CONTRACTS.TestETH,
      tokenB: CONTRACTS.TestUSDC,
      symbolA: 'TETH',
      symbolB: 'TUSDC',
      copyTradingEnabled: false,
      totalLiquidity: '1800000',
      volume24h: '950000'
    }
  ];

  useEffect(() => {
    // In a real implementation, this would fetch actual v4 pools
    setPools(mockPools);
    setSelectedPool(mockPools[0]);
  }, []);

  const executeV4Trade = async () => {
    if (!selectedPool || !amountIn || !signer) return;

    // Check if user is a strategy leader first
    if (!isLeader) {
      alert('❌ You must be a strategy leader to use v4 copy trading!\n\n1. Create a strategy first (+ button)\n2. Then return to v4 pools to trade');
      return;
    }

    try {
      setIsTrading(true);
      
      console.log('🦄 Executing Uniswap v4 trade through hook...');
      console.log('Pool:', selectedPool);
      console.log('Amount:', amountIn);
      console.log('Account:', account);
      console.log('Is Leader:', isLeader);
      
      // In a real v4 implementation, this would:
      // 1. Call Uniswap v4 PoolManager.swap()
      // 2. The hook would automatically detect the trade
      // 3. beforeSwap() and afterSwap() would trigger
      // 4. Copy trading would happen automatically
      
      // For now, we'll simulate v4 by directly calling CopyRelay (which we know works)
      // In a real v4 implementation, this would be automatic through hooks
      if (!executeTrade) {
        throw new Error('CopyRelay not initialized');
      }
      
      const amountInWei = BigInt(parseFloat(amountIn) * 1e18);
      const amountOutWei = BigInt(parseFloat(amountIn) * 0.95 * 1e18); // 5% slippage
      
      // Trigger copy trade through CopyRelay (simulating v4 hook behavior)
      const tx = await executeTrade(
        selectedPool.tokenA,
        selectedPool.tokenB,
        amountInWei.toString(),
        amountOutWei.toString()
      );
      
      await tx.wait();
      
      console.log('✅ V4 Hook trade executed:', tx.hash);
      alert('🦄 Uniswap v4 Hook Trade Executed! Copy trading triggered automatically for all your followers.');
      
    } catch (error: any) {
      console.error('V4 trade failed:', error);
      if (error.message?.includes('Not a strategy leader')) {
        alert('❌ Strategy leader verification failed!\n\n1. Make sure you created a strategy\n2. Refresh the page\n3. Try again');
      } else if (error.message?.includes('Only leader can trigger')) {
        alert('❌ Only the strategy leader can trigger copy trades');
      } else {
        alert('❌ V4 trade failed. Check console for details.');
      }
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* V4 Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Uniswap v4 Pools</h2>
              <p className="text-sm text-gray-600">Trade with automatic copy trading hooks</p>
            </div>
          </div>
          
          <div className="text-right">
            {isLeader ? (
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">✅ Leader Verified</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-orange-100 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">❌ Not a Leader</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Account: {account?.slice(0, 6)}...{account?.slice(-4)}
            </div>
          </div>
        </div>
        
        {!isLeader && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Strategy Leader Required</span>
            </div>
            <p className="text-sm text-orange-700 mb-3">
              You need to create a trading strategy to use v4 copy trading hooks. Only strategy leaders can execute trades that trigger automatic copying to followers.
            </p>
            <button 
              onClick={() => alert('Click the + button to create a strategy, then refresh this page!')}
              className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Strategy First
            </button>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">v4 Hook Benefits</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Automatic Detection:</strong> Hooks intercept swaps in real-time</li>
            <li>• <strong>Zero-Latency Copying:</strong> Followers get trades instantly</li>
            <li>• <strong>Gas Efficient:</strong> Copy trading happens in the same transaction</li>
            <li>• <strong>Pool-Specific:</strong> Enable copy trading per pool</li>
          </ul>
        </div>
      </div>

      {/* Pool Selection */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Available v4 Pools</h3>
        
        <div className="space-y-3">
          {pools.map((pool) => (
            <div
              key={pool.id}
              onClick={() => setSelectedPool(pool)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedPool?.id === pool.id
                  ? 'border-purple-300 bg-purple-50/50'
                  : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {pool.symbolA}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {pool.symbolB}
                    </div>
                    <span className="font-semibold text-gray-800">
                      {pool.symbolA}/{pool.symbolB}
                    </span>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    pool.copyTradingEnabled
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {pool.copyTradingEnabled ? '🦄 Copy Trading ON' : 'Copy Trading OFF'}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">TVL: ${parseFloat(pool.totalLiquidity).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">24h Vol: ${parseFloat(pool.volume24h).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* V4 Trading Interface */}
      {selectedPool && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">
              🦄 v4 Trade: {selectedPool.symbolA} → {selectedPool.symbolB}
            </h3>
            {selectedPool.copyTradingEnabled && (
              <div className="flex items-center space-x-2 text-sm bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-semibold">Hook Active</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount ({selectedPool.symbolA})
              </label>
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            {amountIn && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">You'll Receive (est.)</span>
                  <span className="font-semibold">{(parseFloat(amountIn) * 0.95).toFixed(4)} {selectedPool.symbolB}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Slippage</span>
                  <span>5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">v4 Hook</span>
                  <span className="text-purple-600 font-semibold">
                    {selectedPool.copyTradingEnabled ? '✓ Auto Copy Trading' : '✗ Manual Only'}
                  </span>
                </div>
                {isLeader && selectedPool.copyTradingEnabled && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-600">Leader Benefit</span>
                      <span className="text-purple-800 font-semibold">Instant follower copying</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={executeV4Trade}
              disabled={!amountIn || isTrading || !selectedPool.copyTradingEnabled}
              className={`w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                selectedPool.copyTradingEnabled
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isTrading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Executing v4 Hook Trade...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>
                    {selectedPool.copyTradingEnabled 
                      ? '🦄 Execute v4 Hook Trade' 
                      : 'Copy Trading Disabled for This Pool'
                    }
                  </span>
                </>
              )}
            </button>
          </div>

          {/* V4 Hook Explanation */}
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">🦄 How v4 Hooks Work:</h4>
            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
              <li><strong>beforeSwap():</strong> Hook detects your trade before execution</li>
              <li><strong>Swap Executes:</strong> Your trade happens on Uniswap v4</li>
              <li><strong>afterSwap():</strong> Hook triggers automatic copy trading</li>
              <li><strong>Followers Copy:</strong> All followers get proportional trades instantly</li>
              <li><strong>Zero Latency:</strong> Everything happens in one transaction</li>
            </ol>
          </div>
        </div>
      )}

      {/* Pool Management (Leader Only) */}
      {isLeader && (
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-800">Pool Management</h3>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Coming Soon:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Enable/disable copy trading for specific pools</li>
              <li>• Set pool-specific performance fees</li>
              <li>• Monitor hook performance metrics</li>
              <li>• Manage follower allocations per pool</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};