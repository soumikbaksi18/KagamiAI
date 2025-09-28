import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Search, ArrowUpDown, Zap, Star, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { poolService } from '../services/poolService';

interface Pool {
  id: string;
  token0: {
    symbol: string;
    name: string;
    decimals: number;
  };
  token1: {
    symbol: string;
    name: string;
    decimals: number;
  };
  feeTier: string;
  liquidity: string;
  volume24h: string;
  volumeChange24h: string;
  priceChange24h: string;
  tvl: string;
  apr: string;
}

export const PoolsOverview: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'tvl' | 'volume' | 'apr'>('tvl');
  const [loadingMessage, setLoadingMessage] = useState('Loading pools...');
  const navigate = useNavigate();

  // This will be populated with real pool data

  // Fetch pools data (both demo and real Uniswap pools)
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        
        // First, get our demo pools with real contract data
        console.log('🔍 Fetching demo pools with real contract data...');
        setLoadingMessage('Fetching real contract data...');
        const demoPools = await poolService.getDemoPools();
        
        // Add reference pools to showcase alongside our real demo pools
        console.log('📦 Loading reference pools for context...');
        setLoadingMessage('Adding reference pools...');
        
        // Since external APIs are deprecated, we'll use curated reference pools
        // that represent popular real-world trading pairs
        const realPools: Pool[] = [
          {
            id: 'ref-usdc-eth',
            token0: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
            token1: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
            feeTier: '0.30%',
            liquidity: '$245.2M',
            volume24h: '$89.1M',
            volumeChange24h: '+12.4%',
            priceChange24h: '+2.1%',
            tvl: '$245.2M',
            apr: '8.5%'
          },
          {
            id: 'ref-usdc-usdt',
            token0: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
            token1: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
            feeTier: '0.05%',
            liquidity: '$156.8M',
            volume24h: '$42.3M',
            volumeChange24h: '+5.2%',
            priceChange24h: '+0.1%',
            tvl: '$156.8M',
            apr: '4.2%'
          },
          {
            id: 'ref-weth-dai',
            token0: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
            token1: { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
            feeTier: '0.30%',
            liquidity: '$89.4M',
            volume24h: '$28.7M',
            volumeChange24h: '+8.1%',
            priceChange24h: '+1.8%',
            tvl: '$89.4M',
            apr: '7.2%'
          },
          {
            id: 'ref-wbtc-eth',
            token0: { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
            token1: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
            feeTier: '0.30%',
            liquidity: '$67.3M',
            volume24h: '$19.5M',
            volumeChange24h: '+15.7%',
            priceChange24h: '+3.2%',
            tvl: '$67.3M',
            apr: '9.1%'
          },
          {
            id: 'ref-link-eth',
            token0: { symbol: 'LINK', name: 'ChainLink Token', decimals: 18 },
            token1: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
            feeTier: '0.30%',
            liquidity: '$34.7M',
            volume24h: '$12.8M',
            volumeChange24h: '+18.3%',
            priceChange24h: '+4.7%',
            tvl: '$34.7M',
            apr: '11.2%'
          }
        ];
        
        console.log(`✅ Added ${realPools.length} reference pools for context`);
        
        // Combine demo pools (at top) with real/fallback pools
        setPools([...demoPools, ...realPools]);
        console.log(`✅ Total loaded: ${demoPools.length} demo pools + ${realPools.length} other pools`);
        
      } catch (error) {
        console.error('❌ Error fetching pools:', error);
        // Fallback to demo pools only
        const fallbackPools = await poolService.getDemoPools();
        setPools(fallbackPools);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  const filteredPools = pools.filter(pool => 
    `${pool.token0.symbol}/${pool.token1.symbol}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPools = [...filteredPools].sort((a, b) => {
    switch (sortBy) {
      case 'tvl':
        return parseFloat(b.tvl.replace(/[$,M]/g, '')) - parseFloat(a.tvl.replace(/[$,M]/g, ''));
      case 'volume':
        return parseFloat(b.volume24h.replace(/[$,M]/g, '')) - parseFloat(a.volume24h.replace(/[$,M]/g, ''));
      case 'apr':
        return parseFloat(b.apr.replace('%', '')) - parseFloat(a.apr.replace('%', ''));
      default:
        return 0;
    }
  });

  const handlePoolClick = (pool: Pool) => {
    navigate(`/trading/${pool.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-800 rounded-lg w-64 mb-2"></div>
              <div className="h-4 bg-gray-800 rounded-lg w-96"></div>
            </div>
          </div>

          {/* Search and Filters Skeleton */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="animate-pulse flex-1">
              <div className="h-12 bg-gray-800 rounded-lg border border-gray-700"></div>
            </div>
            <div className="animate-pulse flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-16 bg-gray-800 rounded-lg border border-gray-700"></div>
              ))}
            </div>
          </div>

          {/* Loading Animation */}
          <div className="glass-card-premium p-8 neon-glow text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Loading Trading Pools
            </h2>
            <p className="text-gray-400 mb-8">{loadingMessage}</p>
            
            {/* Pool Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex -space-x-2">
                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-700 rounded w-full mt-4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Trading Pools
              </h1>
              <p className="text-gray-400 text-lg">Discover and trade on the best DeFi pools with real-time data</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="glass-card-premium px-4 py-2 neon-glow">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">{pools.length} Pools Active</span>
                </div>
              </div>
              <div className="glass-card-premium px-4 py-2 neon-glow">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="glass-card-premium p-6 neon-glow">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search pools by token pair..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-400">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Sort by:</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSortBy('tvl')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      sortBy === 'tvl' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                    }`}
                  >
                    TVL
                  </button>
                  <button
                    onClick={() => setSortBy('volume')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      sortBy === 'volume' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                    }`}
                  >
                    Volume
                  </button>
                  <button
                    onClick={() => setSortBy('apr')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      sortBy === 'apr' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                    }`}
                  >
                    APR
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{filteredPools.length}</div>
                <div className="text-sm text-gray-400">Available Pools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {filteredPools.filter(p => p.id.startsWith('real-')).length}
                </div>
                <div className="text-sm text-gray-400">Real Contracts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  ${filteredPools.reduce((sum, pool) => sum + parseFloat(pool.tvl.replace(/[$,M]/g, '')), 0).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-400">Total TVL</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {(filteredPools.reduce((sum, pool) => sum + parseFloat(pool.apr.replace('%', '')), 0) / filteredPools.length).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Avg APR</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {sortedPools.map((pool) => (
            <div 
              key={pool.id}
              className="glass-card-premium p-6 neon-glow cursor-pointer hover:scale-105 transition-all duration-300 group"
              onClick={() => handlePoolClick(pool)}
            >
              {/* Pool Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-gray-800">
                      {pool.token0.symbol[0]}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-gray-800">
                      {pool.token1.symbol[0]}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {pool.token0.symbol}/{pool.token1.symbol}
                    </div>
                    <div className="text-sm text-gray-400">
                      {pool.feeTier} Fee Tier
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                {pool.id.startsWith('real-') && (
                  <div className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-xs rounded-full border border-green-500/30 animate-pulse font-medium">
                    🔥 LIVE
                  </div>
                )}
                {pool.id.startsWith('ref-') && (
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 font-medium">
                    📊 REF
                  </div>
                )}
              </div>

              {/* Pool Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">TVL</span>
                  </div>
                  <div className="text-lg font-bold text-white">{pool.tvl}</div>
                </div>
                
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">APR</span>
                  </div>
                  <div className="text-lg font-bold text-green-400">{pool.apr}</div>
                </div>
                
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">24h Volume</span>
                  </div>
                  <div className="text-lg font-bold text-white">{pool.volume24h}</div>
                </div>
                
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      pool.volumeChange24h.startsWith('+') ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">24h Change</span>
                  </div>
                  <div className={`text-lg font-bold flex items-center ${
                    pool.volumeChange24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pool.volumeChange24h.startsWith('+') ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {pool.volumeChange24h}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 group-hover:shadow-lg">
                <BarChart3 className="w-5 h-5" />
                <span>Start Trading</span>
                <Zap className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          ))}
        </div>

        {/* Info Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card-premium p-6 neon-glow border-l-4 border-green-500">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-400 mb-2">🔥 Live Contract Data</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Pools marked as "LIVE" fetch real-time data from deployed AMM contracts on Polygon Amoy. 
                  Experience genuine on-chain trading with TUSDC/TUSDT and TUSDC/TETH pairs!
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">
                    {filteredPools.filter(p => p.id.startsWith('real-')).length} Live Contracts Active
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-card-premium p-6 neon-glow border-l-4 border-blue-500">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-400 mb-2">📊 Reference Data</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Reference pools showcase popular DeFi trading pairs with realistic market data. 
                  These demonstrate the platform's capabilities across various token combinations.
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-xs text-blue-400 font-medium">
                    {filteredPools.filter(p => p.id.startsWith('ref-')).length} Reference Pools Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 glass-card-premium p-6 neon-glow">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to Start Trading?</h3>
            <p className="text-gray-400 mb-6">Choose a pool above to begin your DeFi trading journey</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handlePoolClick(sortedPools.find(p => p.id.startsWith('real-')) || sortedPools[0])}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Try Live Trading</span>
              </button>
              <button className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-600">
                <BarChart3 className="w-5 h-5" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};