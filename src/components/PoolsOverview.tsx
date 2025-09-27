import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Search } from 'lucide-react';
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
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Loading Trading Pools</h2>
            <p className="text-gray-400 mb-8">{loadingMessage}</p>
            <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 h-16 rounded-lg border border-gray-700"></div>
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
          <h1 className="text-3xl font-bold text-white mb-2">Trading Pools</h1>
          <p className="text-gray-400">Discover and trade on the best DeFi pools</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('tvl')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                sortBy === 'tvl' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              TVL
            </button>
            <button
              onClick={() => setSortBy('volume')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                sortBy === 'volume' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setSortBy('apr')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                sortBy === 'apr' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              APR
            </button>
          </div>
        </div>

        {/* Pools Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Pool</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Fee</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">TVL</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">24h Volume</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">24h Change</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">APR</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedPools.map((pool, index) => (
                  <tr 
                    key={pool.id}
                    className="hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => handlePoolClick(pool)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {pool.token0.symbol[0]}
                          </div>
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {pool.token1.symbol[0]}
                          </div>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {pool.token0.symbol}/{pool.token1.symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            {pool.token0.name}/{pool.token1.name}
                          </div>
                        </div>
                        {pool.id.startsWith('real-') && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 animate-pulse">
                            REAL CONTRACT
                          </span>
                        )}
                        {pool.id.startsWith('ref-') && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                            REFERENCE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{pool.feeTier}</td>
                    <td className="px-6 py-4 text-sm text-white">{pool.tvl}</td>
                    <td className="px-6 py-4 text-sm text-white">{pool.volume24h}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`flex items-center ${
                        pool.volumeChange24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pool.volumeChange24h.startsWith('+') ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {pool.volumeChange24h}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-green-400">{pool.apr}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>Trade</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-green-400">🚀 Real Contract Data Available!</p>
                <p className="text-sm text-green-300 mt-1">
                  Pools with "REAL CONTRACT" badges fetch live data from deployed AMM contracts. 
                  Click TUSDC/TUSDT or TUSDC/TETH to experience real on-chain trading!
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-semibold text-blue-400">📊 Reference Pools</p>
                <p className="text-sm text-blue-300 mt-1">
                  Other pools show reference data representing popular real-world DeFi trading pairs.
                  External APIs have been deprecated, so we focus on our deployed contract functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};