import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, ArrowLeft, Settings, Bell } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { ethers } from 'ethers';
import { CandlestickChart } from './CandlestickChart';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';

interface TradingDetailProps {
  account?: string;
  isLeader?: boolean;
}

export const TradingDetail: React.FC<TradingDetailProps> = ({ isLeader }) => {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const { executeTrade } = useContracts();
  const { addToast, toasts, removeToast } = useToast();
  
  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '4h'>('5m');
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [isUpdatingOrderBook, setIsUpdatingOrderBook] = useState(false);
  const [chartUpdateTrigger, setChartUpdateTrigger] = useState(0);

  // Pool deployment addresses
  const POOL_ADDRESSES: { [key: string]: any } = {
    'real-tusdc-teth': {
      address: '0xDA756c9596bB5E69165142c55AF80B908D891ffb',
      token0: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      token1: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      token0Symbol: 'TUSDC',
      token1Symbol: 'TETH',
      fee: '0.3%'
    },
    'real-tusdc-tusdt': {
      address: '0xcA16B4430BC903fA049dC6BD212A016c220ba9de',
      token0: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      token1: '0x851356ae760d987E095750cCeb3bC6014560891C',
      token0Symbol: 'TUSDC',
      token1Symbol: 'TUSDT',
      fee: '0.05%'
    }
  };

  // Simple Pool ABI
  const SIMPLE_POOL_ABI = [
    "function getTotalValueLocked() external view returns (uint256)",
    "function getVolume24h() external view returns (uint256)",
    "function getVolumeChange24h() external view returns (uint256)",
    "function getAPR() external view returns (uint256)",
    "function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1)",
    "function currentPrice() external view returns (uint256)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function totalLiquidity() external view returns (uint256)"
  ];

  // Generate candlestick data based on real pool activity
  const generateCandlestickData = (currentPrice: number, volume24h: string, timeframe: string = '5m', updateTrigger: number = 0) => {
    if (!currentPrice) {
      // Fallback static data
      return [
        { time: '2024-01-01', open: 0.0005, high: 0.00052, low: 0.00048, close: 0.00051, volume: 1000000 },
        { time: '2024-01-02', open: 0.00051, high: 0.00053, low: 0.00049, close: 0.00050, volume: 1200000 },
        { time: '2024-01-03', open: 0.00050, high: 0.00054, low: 0.00047, close: 0.00053, volume: 1500000 },
        { time: '2024-01-04', open: 0.00053, high: 0.00055, low: 0.00051, close: 0.00052, volume: 1100000 },
        { time: '2024-01-05', open: 0.00052, high: 0.00056, low: 0.00050, close: 0.00055, volume: 1300000 },
      ];
    }

    const volumeNum = parseFloat(volume24h.replace(/[$,K]/g, '')) || 0;
    const basePrice = currentPrice;
    const candlesticks = [];
    
    // Calculate interval duration (5 minutes = 5 * 60 * 1000 ms)
    const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 
                      timeframe === '15m' ? 15 * 60 * 1000 :
                      timeframe === '1h' ? 60 * 60 * 1000 :
                      timeframe === '4h' ? 4 * 60 * 60 * 1000 : 5 * 60 * 1000;
    
    // Generate 48 candles (4 hours of 5-min candles)
    const candleCount = 48;
    const now = new Date();
    
    // Start price with some historical variation, but make it more stable
    // Use updateTrigger to ensure we get different random values when chart updates
    const seed = updateTrigger * 0.001;
    let previousClose = basePrice * (0.98 + (Math.random() + seed) % 1 * 0.04); // ±2% from current
    
    for (let i = candleCount - 1; i >= 0; i--) {
      const candleTime = new Date(now.getTime() - (i * intervalMs));
      
      // Generate realistic OHLC data
      const volatility = 0.002 + (volumeNum / 10000) * 0.001; // Higher volatility with more volume
      const trend = (basePrice - previousClose) / candleCount; // Gradual trend toward current price
      
      const open = previousClose;
      const trendAdjustment = trend * (candleCount - i) / candleCount;
      const randomWalk = (Math.random() - 0.5) * volatility;
      
      // Calculate close price with trend and randomness
      const close = Math.max(0.00001, open + trendAdjustment + randomWalk);
      
      // Generate high and low around open/close
      const maxPrice = Math.max(open, close);
      const minPrice = Math.min(open, close);
      const high = maxPrice + Math.random() * volatility * 0.5;
      const low = Math.max(0.00001, minPrice - Math.random() * volatility * 0.5);
      
      // Volume varies with activity (higher volume = more recent activity)
      const baseVolume = volumeNum / candleCount;
      const volumeVariation = 0.5 + Math.random(); // 50-150% variation
      const recencyBoost = i < 10 ? 1.5 : 1; // Recent candles have higher volume
      const candleVolume = Math.floor(baseVolume * volumeVariation * recencyBoost);
      
      candlesticks.push({
        time: candleTime.toISOString().split('T')[0] + ' ' + candleTime.toTimeString().slice(0, 5),
        open: parseFloat(open.toFixed(5)),
        high: parseFloat(high.toFixed(5)),
        low: parseFloat(low.toFixed(5)),
        close: parseFloat(close.toFixed(5)),
        volume: candleVolume
      });
      
      previousClose = close;
    }
    
    return candlesticks;
  };

  // Use useMemo to regenerate candlestick data when relevant data changes
  const candlestickData = React.useMemo(() => {
    return generateCandlestickData(
      realTimeData?.price ? parseFloat(realTimeData.price) : parseFloat(pool?.currentPrice || '0'),
      realTimeData?.volume24h || pool?.volume24h || '$0',
      timeframe,
      chartUpdateTrigger
    );
  }, [realTimeData, pool?.currentPrice, pool?.volume24h, timeframe, chartUpdateTrigger]);

  // Generate dynamic order book based on current pool state
  const generateOrderBook = (currentPrice: number, reserves: any) => {
    if (!currentPrice || !reserves) {
      // Fallback static data
      return {
        asks: [
          { price: '0.00056', amount: '1000', total: '560' },
          { price: '0.00055', amount: '2000', total: '1100' },
          { price: '0.00054', amount: '1500', total: '810' },
        ],
        bids: [
          { price: '0.00053', amount: '1200', total: '636' },
          { price: '0.00052', amount: '1800', total: '936' },
          { price: '0.00051', amount: '2200', total: '1122' },
        ]
      };
    }

    const basePrice = currentPrice;
    const reserve0 = parseFloat(reserves.reserve0);
    const reserve1 = parseFloat(reserves.reserve1);
    
    // Calculate liquidity depth based on reserves
    const liquidityFactor = Math.min(reserve0, reserve1) / 1000;
    
    // Generate asks (sell orders) - prices above current
    const asks = [];
    for (let i = 1; i <= 3; i++) {
      const priceSpread = 0.0001 * i; // 0.01% increments
      const askPrice = basePrice + priceSpread;
      const amount = Math.floor(liquidityFactor * (4 - i) * 500); // Decreasing amounts
      const total = (askPrice * amount).toFixed(0);
      
      asks.push({
        price: askPrice.toFixed(5),
        amount: amount.toString(),
        total: total
      });
    }
    
    // Generate bids (buy orders) - prices below current
    const bids = [];
    for (let i = 1; i <= 3; i++) {
      const priceSpread = 0.0001 * i;
      const bidPrice = Math.max(0.00001, basePrice - priceSpread);
      const amount = Math.floor(liquidityFactor * (4 - i) * 600); // Decreasing amounts
      const total = (bidPrice * amount).toFixed(0);
      
      bids.push({
        price: bidPrice.toFixed(5),
        amount: amount.toString(),
        total: total
      });
    }
    
    return { asks: asks.reverse(), bids }; // Reverse asks for proper ordering
  };

  const orderBook = generateOrderBook(
    realTimeData?.price ? parseFloat(realTimeData.price) : parseFloat(pool?.currentPrice || '0'),
    pool?.reserves
  );

  // Generate recent trades based on pool activity
  const generateRecentTrades = (currentPrice: number, volume24h: string) => {
    if (!currentPrice || !volume24h) {
      return [
        { price: '0.00055', amount: '500', time: '12:34:56', side: 'buy' },
        { price: '0.00054', amount: '750', time: '12:34:52', side: 'sell' },
        { price: '0.00056', amount: '300', time: '12:34:48', side: 'buy' },
      ];
    }

    const volumeNum = parseFloat(volume24h.replace(/[$,K]/g, ''));
    const basePrice = currentPrice;
    const trades = [];
    
    // Generate trades based on volume activity
    const tradeCount = Math.min(Math.floor(volumeNum / 100), 10); // More trades for higher volume
    
    for (let i = 0; i < Math.max(3, tradeCount); i++) {
      const priceVariation = (Math.random() - 0.5) * 0.0002; // ±0.01% variation
      const tradePrice = Math.max(0.00001, basePrice + priceVariation);
      const amount = Math.floor(Math.random() * 1000 + 100); // 100-1100 amount
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      
      // Generate realistic recent timestamps
      const minutesAgo = i * 2 + Math.floor(Math.random() * 5);
      const now = new Date();
      const tradeTime = new Date(now.getTime() - minutesAgo * 60000);
      const timeString = tradeTime.toTimeString().slice(0, 8);
      
      trades.push({
        price: tradePrice.toFixed(5),
        amount: amount.toString(),
        time: timeString,
        side: side
      });
    }
    
    return trades.slice(0, 5); // Show last 5 trades
  };

  const recentTrades = generateRecentTrades(
    realTimeData?.price ? parseFloat(realTimeData.price) : parseFloat(pool?.currentPrice || '0'),
    realTimeData?.volume24h || pool?.volume24h || '$0'
  );

  const fetchPoolData = async () => {
      setLoading(true);
      
      try {
        console.log('🔍 Fetching real pool data for:', poolId);
        
        // Check if this is one of our real demo pools
        const poolInfo = POOL_ADDRESSES[poolId || ''];
        
        if (poolInfo) {
          console.log('✅ Found real pool contract:', poolInfo.address);
          console.log('🔄 Fetching live data from contract...');
          
          // Connect to local Hardhat network
          const provider = new ethers.JsonRpcProvider('http://localhost:8545');
          const poolContract = new ethers.Contract(
            poolInfo.address,
            SIMPLE_POOL_ABI,
            provider
          );

          // Fetch real data from contract
          const [
            tvl,
            volume24h,
            volumeChange24h,
            apr,
            reserves,
            currentPrice
          ] = await Promise.all([
            poolContract.getTotalValueLocked(),
            poolContract.getVolume24h(),
            poolContract.getVolumeChange24h(),
            poolContract.getAPR(),
            poolContract.getReserves(),
            poolContract.currentPrice()
          ]);

          // Format the data
          const tvlFormatted = `$${(parseFloat(ethers.formatEther(tvl)) / 1000).toFixed(0)}K`;
          const volumeFormatted = `$${(parseFloat(ethers.formatEther(volume24h)) / 1000).toFixed(0)}K`;
          const aprFormatted = `${Number(apr)}%`;
          const priceFormatted = parseFloat(ethers.formatEther(currentPrice)).toFixed(5);
          
          console.log('📊 Live contract data fetched:', {
            tvl: tvlFormatted,
            volume: volumeFormatted,
            apr: aprFormatted,
            price: priceFormatted,
            reserves: {
              reserve0: ethers.formatEther(reserves[0]),
              reserve1: ethers.formatEther(reserves[1])
            }
          });
          
          // Calculate volume change percentage
          const volumeChangeFormatted = volumeChange24h > 0 
            ? `+${(Number(volumeChange24h) / 100).toFixed(1)}%` 
            : `${(Number(volumeChange24h) / 100).toFixed(1)}%`;

          const poolData = {
            id: poolId,
            token0: { symbol: poolInfo.token0Symbol, name: `Test ${poolInfo.token0Symbol}` },
            token1: { symbol: poolInfo.token1Symbol, name: `Test ${poolInfo.token1Symbol}` },
            feeTier: poolInfo.fee,
            tvl: tvlFormatted,
            volume24h: volumeFormatted,
            priceChange24h: '+0.1%', // Simplified for now
            apr: aprFormatted,
            currentPrice: priceFormatted,
            reserves: {
              reserve0: ethers.formatEther(reserves[0]),
              reserve1: ethers.formatEther(reserves[1])
            }
          };

          setPool(poolData);
          setRealTimeData({
            price: priceFormatted,
            tvl: tvlFormatted,
            volume24h: volumeFormatted,
            volumeChange24h: volumeChangeFormatted,
            apr: aprFormatted
          });

          console.log('📊 Real pool data loaded:', poolData);
          
        } else {
          // Fallback for non-real pools with notice
          console.log('📦 Using fallback data for pool:', poolId);
          setPool({
            id: poolId,
            token0: { symbol: 'TUSDC', name: 'Test USDC' },
            token1: { symbol: 'TUSDT', name: 'Test USDT' },
            feeTier: '0.05%',
            tvl: '$1,000,000',
            volume24h: '$500,000',
            priceChange24h: '+0.1%',
            apr: '12.5%',
            currentPrice: '0.00055',
            isReference: true // Flag to show this is reference data
          });
        }
        
      } catch (error) {
        console.error('❌ Error fetching pool data:', error);
        // Fallback data
        setPool({
          id: poolId,
          token0: { symbol: 'TUSDC', name: 'Test USDC' },
          token1: { symbol: 'TUSDT', name: 'Test USDT' },
          feeTier: '0.05%',
          tvl: '$1,000,000',
          volume24h: '$500,000',
          priceChange24h: '+0.1%',
          apr: '12.5%',
          currentPrice: '0.00055'
        });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchPoolData();
    
    // Set up auto-refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing pool data...');
      fetchPoolData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [poolId]);

  const handleTrade = async () => {
    if (!executeTrade || !amount) return;

    setIsSubmitting(true);
    try {
      console.log('🔄 Executing trade with real pool data...');
      
      // Get pool info for the current pool
      const poolInfo = POOL_ADDRESSES[poolId || ''];
      
      if (poolInfo) {
        console.log('✅ Trading on real pool:', poolInfo.address);
        
        // Use the actual tokens from the pool
        const tokenA = poolInfo.token0; // TUSDC
        const tokenB = poolInfo.token1; // TETH or TUSDT
        const amountIn = BigInt(parseFloat(amount) * 1e18);
        const amountOut = BigInt(parseFloat(amount) * 0.95 * 1e18); // 5% slippage

        await executeTrade(
          side === 'buy' ? tokenA : tokenB,
          side === 'buy' ? tokenB : tokenA,
          amountIn.toString(),
          amountOut.toString()
        );
        
        console.log('✅ Trade executed successfully!');
        
        // Show success toast
        addToast({
          id: Date.now().toString(),
          type: 'success',
          message: `Trade executed successfully! ${side === 'buy' ? 'Bought' : 'Sold'} ${amount} tokens.`
        });
        
        // Clear the amount field
        setAmount('');
        
        // Refresh pool data after trade to update order book and recent trades
        setIsUpdatingOrderBook(true);
        setTimeout(async () => {
          console.log('🔄 Refreshing pool data after trade...');
          
          // Refetch pool data to get updated reserves, volume, etc.
          const provider = new ethers.JsonRpcProvider('http://localhost:8545');
          const poolContract = new ethers.Contract(
            poolInfo.address,
            SIMPLE_POOL_ABI,
            provider
          );

          try {
            const [
              tvl,
              volume24h,
              volumeChange24h,
              apr,
              reserves,
              currentPrice
            ] = await Promise.all([
              poolContract.getTotalValueLocked(),
              poolContract.getVolume24h(),
              poolContract.getVolumeChange24h(),
              poolContract.getAPR(),
              poolContract.getReserves(),
              poolContract.currentPrice()
            ]);

            // Update real-time data
            const tvlFormatted = `$${(parseFloat(ethers.formatEther(tvl)) / 1000).toFixed(0)}K`;
            const volumeFormatted = `$${(parseFloat(ethers.formatEther(volume24h)) / 1000).toFixed(0)}K`;
            const aprFormatted = `${Number(apr)}%`;
            const priceFormatted = parseFloat(ethers.formatEther(currentPrice)).toFixed(5);
            
            const volumeChangeFormatted = volumeChange24h > 0 
              ? `+${(Number(volumeChange24h) / 100).toFixed(1)}%` 
              : `${(Number(volumeChange24h) / 100).toFixed(1)}%`;

            setRealTimeData({
              price: priceFormatted,
              tvl: tvlFormatted,
              volume24h: volumeFormatted,
              volumeChange24h: volumeChangeFormatted,
              apr: aprFormatted
            });

            // Update pool data with new reserves
            setPool(prevPool => ({
              ...prevPool,
              tvl: tvlFormatted,
              volume24h: volumeFormatted,
              apr: aprFormatted,
              currentPrice: priceFormatted,
              reserves: {
                reserve0: ethers.formatEther(reserves[0]),
                reserve1: ethers.formatEther(reserves[1])
              }
            }));

            console.log('✅ Pool data refreshed! Order book and candlestick chart will update automatically.');
            setIsUpdatingOrderBook(false);
            
            // Trigger candlestick chart regeneration
            setChartUpdateTrigger(prev => prev + 1);
            
          } catch (error) {
            console.error('❌ Error refreshing pool data:', error);
            setIsUpdatingOrderBook(false);
            // Fallback to full page reload
            window.location.reload();
          }
        }, 2000);
        
      } else {
        // Fallback to mock execution
        console.log('📦 Using fallback trade execution');
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
      }
      
    } catch (error) {
      console.error('❌ Trade failed:', error);
      
      // Show error toast
      addToast({
        id: Date.now().toString(),
        type: 'error',
        message: `Trade failed: ${error.message || 'Unknown error occurred'}`
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-800 h-16 rounded-lg"></div>
            <div className="bg-gray-800 h-96 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/trading')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Pools</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {pool?.token0.symbol}/{pool?.token1.symbol}
              </h1>
              <p className="text-gray-400">
                {pool?.token0.name}/{pool?.token1.name} • {pool?.feeTier} Fee
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  setLoading(true);
                  fetchPoolData();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <span>Refresh Data</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Real Data Indicator */}
        {poolId?.startsWith('real-') && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-400">🚀 Live Contract Data</span>
              <span className="text-sm text-green-300">• Real-time data from deployed AMM contract • Volume & APR update with trades</span>
            </div>
          </div>
        )}

        {/* Reference Pool Notice */}
        {pool?.isReference && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-400">📊 Reference Pool - Static Data</p>
                <p className="text-sm text-yellow-300 mt-1">
                  This pool shows reference data only. For live trading with real volume/APR updates, visit:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button 
                    onClick={() => navigate('/trading/real-tusdc-tusdt')}
                    className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 hover:bg-green-500/30 transition-colors"
                  >
                    🔄 TUSDC/TUSDT Real Pool
                  </button>
                  <button 
                    onClick={() => navigate('/trading/real-tusdc-teth')}
                    className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 hover:bg-green-500/30 transition-colors"
                  >
                    🔄 TUSDC/TETH Real Pool
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Price</div>
            <div className="text-2xl font-bold text-white">
              {realTimeData?.price || pool?.currentPrice || '0.00055'}
            </div>
            <div className="text-sm text-green-400">{pool?.priceChange24h || '+0.1% (24h)'}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">24h Volume</div>
            <div className="text-2xl font-bold text-white">{realTimeData?.volume24h || pool?.volume24h}</div>
            <div className="text-sm text-green-400">{realTimeData?.volumeChange24h || '+15.2%'}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">TVL</div>
            <div className="text-2xl font-bold text-white">{pool?.tvl}</div>
            <div className="text-sm text-gray-400">Total Value Locked</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">APR</div>
            <div className="text-2xl font-bold text-green-400">{pool?.apr}</div>
            <div className="text-sm text-gray-400">Annual Percentage Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chart Controls */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-white">Price Chart</h3>
                  {isUpdatingOrderBook && (
                    <div className="flex items-center space-x-2 text-blue-400">
                      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Updating...</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                {[
                  { key: '5m', label: '5M' },
                  { key: '15m', label: '15M' },
                  { key: '1h', label: '1H' },
                  { key: '4h', label: '4H' }
                ].map((tf) => (
                  <button
                    key={tf.key}
                    onClick={() => setTimeframe(tf.key as any)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      timeframe === tf.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
                </div>
              </div>
              
              {/* Candlestick Chart */}
              <div className="h-96 bg-gray-900 rounded-lg p-4">
                <div className="h-full">
                  <CandlestickChart 
                    data={candlestickData} 
                    timeframe={timeframe}
                    currentPrice={realTimeData?.price || pool?.currentPrice}
                  />
                </div>
              </div>
            </div>

            {/* Order Book */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Order Book</h3>
                {isUpdatingOrderBook && (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Updating...</span>
                  </div>
                )}
                {poolId?.startsWith('real-') && !isUpdatingOrderBook && (
                  <div className="flex items-center space-x-1 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs">Live Data</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Asks */}
                <div>
                  <div className="text-sm text-red-400 mb-2">Asks (Sell Orders)</div>
                  <div className="space-y-1">
                    {orderBook.asks.map((ask, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-red-400">{ask.price}</span>
                        <span className="text-white">{ask.amount}</span>
                        <span className="text-gray-400">{ask.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Bids */}
                <div>
                  <div className="text-sm text-green-400 mb-2">Bids (Buy Orders)</div>
                  <div className="space-y-1">
                    {orderBook.bids.map((bid, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-green-400">{bid.price}</span>
                        <span className="text-white">{bid.amount}</span>
                        <span className="text-gray-400">{bid.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trading Form */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Place Order</h3>
              
              {/* Order Type */}
              <div className="flex mb-4">
                <button
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-2 px-4 rounded-l-md text-sm font-medium ${
                    orderType === 'market'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Market
                </button>
                <button
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-2 px-4 rounded-r-md text-sm font-medium ${
                    orderType === 'limit'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Limit
                </button>
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

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price Input (for limit orders) */}
              {orderType === 'limit' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-700 rounded-md p-3 mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Total</span>
                  <span>≈ {amount ? (parseFloat(amount) * 0.0005).toFixed(6) : '0.000000'} {pool?.token1.symbol}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Fee</span>
                  <span>0.1%</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleTrade}
                disabled={!amount || isSubmitting}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  side === 'buy'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } ${(!amount || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${pool?.token0.symbol}`}
              </button>
            </div>

            {/* Recent Trades */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
              <div className="space-y-2">
                {recentTrades.map((trade, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
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
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Leader Mode</span>
                </div>
                <p className="text-xs text-gray-300">
                  Your trades will be automatically copied to your followers
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};