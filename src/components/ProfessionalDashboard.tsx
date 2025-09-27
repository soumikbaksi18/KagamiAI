import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, BarChart3, Zap, Bot } from 'lucide-react';
import { StrategyCard } from './StrategyCard';
import { TradesFeed } from './TradesFeed';
import { PortfolioOverview } from './PortfolioOverview';
import { FaucetPanel } from './FaucetPanel';
import { TokenBalances } from './TokenBalances';
import { V4PoolInterface } from './V4PoolInterface';
import { FollowersList } from './FollowersList';
import { useStrategies } from '../hooks/useStrategies';
import { useTrades } from '../hooks/useTrades';
import { useToast } from '../hooks/useToast';

interface ProfessionalDashboardProps {
  account?: string;
  isConnected: boolean;
}

export const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ account, isConnected }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'discover' | 'v4-pools'>('overview');
  const [overviewSubTab, setOverviewSubTab] = useState<'portfolio' | 'created-strategies' | 'joined-strategies'>('portfolio');
  
  const { strategies, loading: strategiesLoading, followStrategy, refetchStrategies } = useStrategies();
  const { trades, loading: tradesLoading } = useTrades();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  
  const loading = strategiesLoading || tradesLoading;

  // Check if current user is a leader
  const isLeader = strategies.some(strategy => 
    strategy.leader?.toLowerCase() === account?.toLowerCase()
  );
  
  // Get strategies created by user
  const createdStrategies = strategies.filter(strategy => 
    strategy.leader?.toLowerCase() === account?.toLowerCase()
  );
  
  // Get strategies joined by user
  const joinedStrategies = strategies.filter(strategy => 
    strategy.leader?.toLowerCase() !== account?.toLowerCase() && strategy.totalFollowers > 0
  );

  const handleFollow = async (leader: string, strategyId: number) => {
    if (leader === account) {
      showWarning("Cannot Follow Yourself", "You cannot subscribe to your own strategy.");
      return;
    }

    try {
      await followStrategy(leader, "0.1");
      showSuccess("Successfully Followed!", `You are now following the strategy by ${leader.slice(0, 6)}...${leader.slice(-4)}`);
      refetchStrategies();
    } catch (error: any) {
      console.error('Failed to follow strategy:', error);
      if (error.message?.includes("Already subscribed")) {
        showWarning("Already Following", "You are already subscribed to this strategy.");
      } else {
        showError("Follow Failed", "Failed to follow strategy. Please try again.");
      }
    }
  };

  const stats = {
    totalStrategies: strategies.length,
    totalFollowers: strategies.reduce((sum, s) => sum + s.totalFollowers, 0),
    totalVolume: strategies.reduce((sum, s) => sum + parseFloat(s.totalVolume), 0),
    activeTrades: trades.length
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to start copy trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Market Overview Section */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Market Cap */}
            <div className="glass-card-premium p-4 neon-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Strategies</p>
                  <p className="text-2xl font-bold text-white">{stats.totalStrategies}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center neon-glow">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Gainer */}
            <div className="glass-card-premium p-4 neon-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Followers</p>
                  <p className="text-2xl font-bold text-white">{stats.totalFollowers}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center neon-glow">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Loser */}
            <div className="glass-card-premium p-4 neon-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white">${(stats.totalVolume / 1e12).toFixed(1)}M</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center neon-glow">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* 24h Volume */}
            <div className="glass-card-premium p-4 neon-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Trades</p>
                  <p className="text-2xl font-bold text-white">{stats.activeTrades}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center neon-glow">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'discover', label: 'Discover Strategies', icon: TrendingUp },
                { key: 'v4-pools', label: '🦄 v4 Pools', icon: Zap }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview Sub-Tabs */}
            <div className="glass-card-premium p-4 neon-glow">
              <div className="flex space-x-2">
                {[
                  { key: 'portfolio', label: 'Portfolio Overview', icon: BarChart3 },
                  { key: 'created-strategies', label: `Created Strategies (${createdStrategies.length})`, icon: Activity },
                  { key: 'joined-strategies', label: `Joined Strategies (${joinedStrategies.length})`, icon: Users }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setOverviewSubTab(key as any)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
                      overviewSubTab === key
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 neon-glow'
                        : 'text-gray-400 hover:text-white hover:bg-purple-500/10 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Content */}
            {overviewSubTab === 'portfolio' ? (
              <PortfolioOverview account={account} />
            ) : overviewSubTab === 'created-strategies' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Followers List */}
                <div>
                  <FollowersList leader={account || ''} account={account} />
                </div>
                
                {/* Created Strategies */}
                <div>
                  <div className="glass-card-premium p-4 neon-glow mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">My Created Strategies</h3>
                    <p className="text-sm text-gray-400">Strategies you've created and are leading</p>
                  </div>
                  
                  <div className="space-y-4">
                    {loading ? (
                      [1, 2].map((i) => (
                        <div key={i} className="glass-card-premium p-4 neon-glow animate-pulse">
                          <div className="bg-gray-700 h-32 rounded-lg"></div>
                        </div>
                      ))
                    ) : (
                      createdStrategies.map((strategy) => (
                        <StrategyCard
                          key={strategy.tokenId}
                          strategy={strategy}
                          onFollow={handleFollow}
                          isOwnStrategy={true}
                        />
                      ))
                    )}
                    
                    {!loading && createdStrategies.length === 0 && (
                      <div className="glass-card-premium p-8 neon-glow text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 neon-glow mx-auto">
                          <Activity className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Strategies Created</h3>
                        <p className="text-gray-400 mb-4">
                          You haven't created any strategies yet. Click the + button to create your first strategy!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Joined Strategies */
              <div className="space-y-6">
                <div className="glass-card-premium p-4 neon-glow">
                  <h3 className="text-xl font-bold text-white mb-2">Joined Strategies</h3>
                  <p className="text-sm text-gray-400">Strategies you're following and copying</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="glass-card-premium p-4 neon-glow animate-pulse">
                        <div className="bg-gray-700 h-48 rounded-lg"></div>
                      </div>
                    ))
                  ) : (
                    joinedStrategies.map((strategy) => (
                      <StrategyCard
                        key={strategy.tokenId}
                        strategy={strategy}
                        onFollow={handleFollow}
                        isOwnStrategy={false}
                      />
                    ))
                  )}
                  
                  {!loading && joinedStrategies.length === 0 && (
                    <div className="col-span-full glass-card-premium p-8 neon-glow text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4 neon-glow mx-auto">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No Strategies Joined</h3>
                      <p className="text-gray-400 mb-4">
                        You haven't joined any strategies yet. Browse the Discover tab to find strategies to follow.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Strategies Grid */}
            <div className="lg:col-span-2">
              <div className="glass-card-premium p-6 neon-glow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Discover Strategies</h3>
                  <button
                    onClick={() => refetchStrategies()}
                    className="px-4 py-2 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 transition-all neon-glow"
                  >
                    🔄 Refresh
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gray-900 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))
                  ) : (
                    strategies.slice(0, 4).map((strategy, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{strategy.name}</h4>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            {strategy.performanceFee / 100}% fee
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{strategy.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{strategy.totalFollowers} followers</span>
                            <span>${(parseFloat(strategy.totalVolume) / 1e12).toFixed(1)}M volume</span>
                          </div>
                          <button
                            onClick={() => handleFollow(strategy.leader, index)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            Follow
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Live Trades & Balances */}
            <div className="space-y-6">
              <TradesFeed trades={trades} loading={loading} />
              <TokenBalances account={account} />
              <FaucetPanel account={account} />
            </div>
          </div>
        )}

        {activeTab === 'v4-pools' && (
          <V4PoolInterface account={account} isLeader={isLeader} />
        )}
      </div>
    </div>
  );
};