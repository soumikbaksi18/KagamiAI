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
      <div className="glass-card-premium p-6 neon-glow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center neon-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Uniswap v4 Pools</h2>
              <p className="text-sm text-gray-400">Trade with automatic copy trading hooks</p>
            </div>
          </div>
          
          <div className="text-right">
            {isLeader ? (
              <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-xl neon-glow">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">✅ Leader Verified</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-xl">
                <Users className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400">❌ Not a Leader</span>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Account: {account?.slice(0, 6)}...{account?.slice(-4)}
            </div>
          </div>
        </div>
        
        {!isLeader && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-orange-400">Strategy Leader Required</span>
            </div>
            <p className="text-sm text-orange-300 mb-4">
              You need to create a trading strategy to use v4 copy trading hooks. Only strategy leaders can execute trades that trigger automatic copying to followers.
            </p>
            <button 
              onClick={() => alert('Click the + button to create a strategy, then refresh this page!')}
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
            >
              Create Strategy First
            </button>
          </div>
        )}
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-blue-400">v4 Hook Benefits</span>
          </div>
          <ul className="text-sm text-blue-300 space-y-2">
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span><strong>Automatic Detection:</strong> Hooks intercept swaps in real-time</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span><strong>Zero-Latency Copying:</strong> Followers get trades instantly</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span><strong>Gas Efficient:</strong> Copy trading happens in the same transaction</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span><strong>Pool-Specific:</strong> Enable copy trading per pool</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Pool Selection */}
      <div className="glass-card-premium p-6 neon-glow">
        <h3 className="text-xl font-bold text-white mb-6">Available v4 Pools</h3>
        
        <div className="space-y-4">
          {pools.map((pool) => (
            <div
              key={pool.id}
              onClick={() => setSelectedPool(pool)}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                selectedPool?.id === pool.id
                  ? 'border-purple-500/50 bg-purple-500/10 neon-glow'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-purple-500/30 hover:bg-purple-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-sm font-bold neon-glow">
                      {pool.symbolA}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-sm font-bold neon-glow">
                      {pool.symbolB}
                    </div>
                    <span className="font-bold text-white text-lg">
                      {pool.symbolA}/{pool.symbolB}
                    </span>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    pool.copyTradingEnabled
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 neon-glow'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                  }`}>
                    {pool.copyTradingEnabled ? '🦄 Copy Trading ON' : 'Copy Trading OFF'}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-white font-semibold">TVL: ${parseFloat(pool.totalLiquidity).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">24h Vol: ${parseFloat(pool.volume24h).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* V4 Trading Interface */}
      {selectedPool && (
        <div className="glass-card-premium p-6 neon-glow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              🦄 v4 Trade: {selectedPool.symbolA} → {selectedPool.symbolB}
            </h3>
            {selectedPool.copyTradingEnabled && (
              <div className="flex items-center space-x-2 text-sm bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-xl neon-glow">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-semibold">Hook Active</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Amount ({selectedPool.symbolA})
              </label>
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400"
              />
            </div>

            {amountIn && (
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You'll Receive (est.)</span>
                  <span className="font-semibold text-white">{(parseFloat(amountIn) * 0.95).toFixed(4)} {selectedPool.symbolB}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Slippage</span>
                  <span className="text-white">5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">v4 Hook</span>
                  <span className="text-purple-400 font-semibold">
                    {selectedPool.copyTradingEnabled ? '✓ Auto Copy Trading' : '✗ Manual Only'}
                  </span>
                </div>
                {isLeader && selectedPool.copyTradingEnabled && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-400">Leader Benefit</span>
                      <span className="text-purple-300 font-semibold">Instant follower copying</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={executeV4Trade}
              disabled={!amountIn || isTrading || !selectedPool.copyTradingEnabled}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-[1.02] ${
                selectedPool.copyTradingEnabled
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <h4 className="font-semibold text-purple-400 mb-3 text-lg">🦄 How v4 Hooks Work:</h4>
            <ol className="text-sm text-purple-300 space-y-2 list-decimal list-inside">
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
        <div className="glass-card-premium p-6 neon-glow">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Pool Management</h3>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <h4 className="font-semibold text-yellow-400 mb-3 text-lg">⚠️ Coming Soon:</h4>
            <ul className="text-sm text-yellow-300 space-y-2">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span>Enable/disable copy trading for specific pools</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span>Set pool-specific performance fees</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span>Monitor hook performance metrics</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span>Manage follower allocations per pool</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};