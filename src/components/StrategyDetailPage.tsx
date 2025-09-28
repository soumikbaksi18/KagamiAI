import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  Calendar,
  Target,
  BarChart3,
  Settings,
  Copy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { useWallet } from '../hooks/useWallet';
import { strategyService, StrategyData, Trade, Position } from '../services/strategyService';
import { ethers } from 'ethers';


export const StrategyDetailPage: React.FC = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();
  const { account } = useWallet();
  const contracts = useContracts();

  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'positions' | 'analytics'>('overview');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);


  useEffect(() => {
    const fetchStrategyData = async () => {
      try {
        setLoading(true);
        
        if (!strategyId) return;
        
        // Fetch strategy data using the service
        const [strategyData, tradesData, positionsData, followersData] = await Promise.all([
          strategyService.getStrategyData(strategyId),
          strategyService.getStrategyTrades(strategyId),
          strategyService.getStrategyPositions(strategyId),
          strategyService.getStrategyFollowers(strategyId)
        ]);
        
        if (strategyData) {
          setStrategy(strategyData);
          setTrades(tradesData);
          setPositions(positionsData);
          setFollowers(followersData);
          
          // Check if user is the leader
          if (account) {
            setIsLeader(account.toLowerCase() === strategyData.leader.toLowerCase());
            
            // Check if user is following
            const following = await strategyService.isUserFollowing(strategyId, account);
            setIsFollowing(following);
          }
        }
        
      } catch (error) {
        console.error('Error fetching strategy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategyData();
  }, [strategyId, account]);

  const handleFollowStrategy = async () => {
    try {
      if (!strategyId) return;
      
      const success = await strategyService.followStrategy(strategyId);
      if (success) {
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following strategy:', error);
    }
  };

  const handleUnfollowStrategy = async () => {
    try {
      if (!strategyId) return;
      
      const success = await strategyService.unfollowStrategy(strategyId);
      if (success) {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error unfollowing strategy:', error);
    }
  };

  // Use service helper functions
  const formatCurrency = strategyService.formatCurrency.bind(strategyService);
  const formatPercentage = strategyService.formatPercentage.bind(strategyService);
  const formatDate = strategyService.formatDate.bind(strategyService);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading strategy details...</p>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white">Strategy not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-800/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{strategy.name}</h1>
                <p className="text-sm text-gray-400">
                  {isLeader ? 'Your Strategy' : `Following ${strategy.leader.slice(0, 6)}...${strategy.leader.slice(-4)}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                strategy.isActive 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {strategy.isActive ? 'Active' : 'Inactive'}
              </div>
              
              {!isLeader && (
                <button
                  onClick={isFollowing ? handleUnfollowStrategy : handleFollowStrategy}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isFollowing
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow Strategy'}
                </button>
              )}
              
              {isLeader && (
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card-premium p-6 neon-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className={`text-sm font-medium ${strategy.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(strategy.totalPnl)}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(strategy.totalPnl * 1000)} {/* Mock calculation */}
            </div>
            <div className="text-sm text-gray-400">Total P&L</div>
          </div>

          <div className="glass-card-premium p-6 neon-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-400">24h</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(strategy.totalVolume)}
            </div>
            <div className="text-sm text-gray-400">Total Volume</div>
          </div>

          <div className="glass-card-premium p-6 neon-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-400">
                {strategy.performanceFee}% fee
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {strategy.followerCount}
            </div>
            <div className="text-sm text-gray-400">
              {isLeader ? 'Followers' : 'Total Followers'}
            </div>
          </div>

          <div className="glass-card-premium p-6 neon-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-orange-400">
                {formatPercentage(strategy.winRate)}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {strategy.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Sharpe Ratio</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 rounded-xl p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'trades', label: 'Trade History', icon: Copy },
            { id: 'positions', label: 'Positions', icon: DollarSign },
            { id: 'analytics', label: isLeader ? 'Analytics' : 'Performance', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Strategy Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card-premium p-6 neon-glow">
                <h3 className="text-lg font-semibold text-white mb-4">Strategy Description</h3>
                <p className="text-gray-300 leading-relaxed">{strategy.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700">
                  <div>
                    <div className="text-sm text-gray-400">Created</div>
                    <div className="text-white font-medium">
                      {new Date(strategy.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Performance Fee</div>
                    <div className="text-white font-medium">{strategy.performanceFee}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Max Drawdown</div>
                    <div className="text-red-400 font-medium">{formatPercentage(strategy.maxDrawdown)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                    <div className="text-green-400 font-medium">{formatPercentage(strategy.winRate)}</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card-premium p-6 neon-glow">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {trades.slice(0, 3).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type === 'buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {trade.type.toUpperCase()} {trade.tokenOut}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatDate(trade.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {trade.amountIn} {trade.tokenIn}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Leader Info */}
              <div className="glass-card-premium p-6 neon-glow">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {isLeader ? 'Your Strategy' : 'Strategy Leader'}
                </h3>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {strategy.leader.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {strategy.leader.slice(0, 6)}...{strategy.leader.slice(-4)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {isLeader ? 'You' : 'Strategy Leader'}
                    </div>
                  </div>
                </div>
                
                {isLeader && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Earnings</span>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(strategy.totalPnl * strategy.performanceFee / 100 * 10)} {/* Mock calculation */}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active Followers</span>
                      <span className="text-white font-medium">{followers.length}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Summary */}
              <div className="glass-card-premium p-6 neon-glow">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Trades</span>
                    <span className="text-white font-medium">{trades.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Winning Trades</span>
                    <span className="text-green-400 font-medium">
                      {trades.filter(t => t.pnl > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Losing Trades</span>
                    <span className="text-red-400 font-medium">
                      {trades.filter(t => t.pnl < 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Avg. Trade Size</span>
                    <span className="text-white font-medium">
                      {formatCurrency(parseFloat(strategy.totalVolume.replace(',', '')) / trades.length)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {!isLeader && (
                <div className="glass-card-premium p-6 neon-glow">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2">
                      <Copy className="w-4 h-4" />
                      <span>Copy Latest Trade</span>
                    </button>
                    <button className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Auto-Copy Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="glass-card-premium p-6 neon-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Trade History</h3>
              <div className="flex items-center space-x-2">
                <select className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm">
                  <option>All Trades</option>
                  <option>Buy Orders</option>
                  <option>Sell Orders</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Pair</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-4 px-4 text-gray-300">
                        {formatDate(trade.timestamp)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.type === 'buy' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white">
                        {trade.tokenIn}/{trade.tokenOut}
                      </td>
                      <td className="py-4 px-4 text-right text-white">
                        {trade.amountIn} {trade.tokenIn}
                      </td>
                      <td className="py-4 px-4 text-right text-white">
                        {formatCurrency(trade.price)}
                      </td>
                      <td className={`py-4 px-4 text-right font-medium ${
                        trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {trade.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {trade.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                          {trade.status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="glass-card-premium p-6 neon-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Current Positions</h3>
              <div className="text-sm text-gray-400">
                Total Portfolio Value: {formatCurrency(positions.reduce((sum, pos) => sum + parseFloat(pos.value.replace(',', '')), 0))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {positions.map((position) => (
                <div key={position.token} className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {position.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{position.symbol}</div>
                        <div className="text-sm text-gray-400">{position.token}</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      position.pnl >= 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {formatPercentage(position.pnlPercentage)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white font-medium">{position.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Value</span>
                      <span className="text-white font-medium">{formatCurrency(position.value)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Avg. Price</span>
                      <span className="text-white font-medium">{formatCurrency(position.avgPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Unrealized P&L</span>
                      <span className={`font-medium ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isLeader ? (
              // Leader Analytics
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card-premium p-6 neon-glow">
                    <h4 className="text-lg font-semibold text-white mb-4">Follower Growth</h4>
                    <div className="text-3xl font-bold text-blue-400 mb-2">+{Math.floor(Math.random() * 10) + 5}</div>
                    <div className="text-sm text-gray-400">New followers this week</div>
                  </div>
                  
                  <div className="glass-card-premium p-6 neon-glow">
                    <h4 className="text-lg font-semibold text-white mb-4">Fee Earnings</h4>
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {formatCurrency(strategy.totalPnl * strategy.performanceFee / 100 * 10)}
                    </div>
                    <div className="text-sm text-gray-400">Total fees earned</div>
                  </div>
                  
                  <div className="glass-card-premium p-6 neon-glow">
                    <h4 className="text-lg font-semibold text-white mb-4">Copy Rate</h4>
                    <div className="text-3xl font-bold text-purple-400 mb-2">87%</div>
                    <div className="text-sm text-gray-400">Trades copied by followers</div>
                  </div>
                </div>

                <div className="glass-card-premium p-6 neon-glow">
                  <h4 className="text-lg font-semibold text-white mb-4">Follower List</h4>
                  <div className="space-y-3">
                    {followers.map((follower, index) => (
                      <div key={follower} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {follower.slice(2, 4).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{follower}</div>
                            <div className="text-sm text-gray-400">
                              Following for {Math.floor(Math.random() * 30) + 1} days
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium">
                            +{(Math.random() * 20).toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-400">P&L</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // Follower Performance
              <div className="glass-card-premium p-6 neon-glow">
                <h4 className="text-lg font-semibold text-white mb-6">Your Copy Trading Performance</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">Total Copied</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(15420)}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">Your P&L</div>
                    <div className="text-2xl font-bold text-green-400">+{formatCurrency(2341)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-white font-medium">Copy Settings</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Copy Ratio</div>
                      <div className="text-white font-medium">1:1 (100%)</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Max Per Trade</div>
                      <div className="text-white font-medium">{formatCurrency(1000)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};