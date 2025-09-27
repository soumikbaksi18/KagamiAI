import React, { useState } from 'react';
import { TrendingUp, Users, Activity, DollarSign, PieChart, Zap } from 'lucide-react';
import { StrategyCard } from './StrategyCard';
import { TradesFeed } from './TradesFeed';
import { PortfolioOverview } from './PortfolioOverview';
import { FaucetPanel } from './FaucetPanel';
import { TokenBalances } from './TokenBalances';
import { SetupGuide } from './SetupGuide';
import { V4PoolInterface } from './V4PoolInterface';
import { FollowersList } from './FollowersList';
import { ToastContainer } from './Toast';
import { useStrategies } from '../hooks/useStrategies';
import { useTrades } from '../hooks/useTrades';
import { useToast } from '../hooks/useToast';

interface DashboardProps {
  account?: string;
  isConnected: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ account, isConnected }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'discover' | 'v4-pools'>('overview');
  const [overviewSubTab, setOverviewSubTab] = useState<'portfolio' | 'created-strategies' | 'joined-strategies'>('portfolio');
  
  // Use custom hooks for contract data
  const { strategies, loading: strategiesLoading, followStrategy, refetchStrategies } = useStrategies(account);
  const { trades, loading: tradesLoading } = useTrades();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  
  const loading = strategiesLoading || tradesLoading;

  // Check if current user is a leader (case-insensitive comparison)
  const isLeader = strategies.some(strategy => 
    strategy.leader?.toLowerCase() === account?.toLowerCase()
  );
  
  // Get strategies created by user
  const createdStrategies = strategies.filter(strategy => 
    strategy.leader?.toLowerCase() === account?.toLowerCase()
  );
  
  // Get strategies joined by user (would be fetched from subscriptions in real implementation)
  // For now, using mock data - in real app, this would come from CopyRelay subscription events
  const joinedStrategies = strategies.filter(strategy => 
    strategy.leader?.toLowerCase() !== account?.toLowerCase() && strategy.totalFollowers > 0
  );

  const handleFollow = async (leader: string, strategyId: number) => {
    // Check if user is trying to follow their own strategy
    if (leader === account) {
      showWarning(
        "Cannot Follow Yourself", 
        "You cannot subscribe to your own strategy. Use the 'Trade' tab to execute trades as a leader."
      );
      return;
    }

    try {
      console.log(`Following strategy ${strategyId} by ${leader}`);
      await followStrategy(leader, "0.1"); // Default 0.1 ETH subscription
      showSuccess(
        "Successfully Followed!", 
        `You are now following the strategy by ${leader.slice(0, 6)}...${leader.slice(-4)}`
      );
      refetchStrategies(); // Refresh to show updated follower count
    } catch (error: any) {
      console.error('Failed to follow strategy:', error);
      
      if (error.message?.includes("Cannot subscribe to yourself")) {
        showWarning(
          "Cannot Follow Yourself", 
          "You cannot subscribe to your own strategy."
        );
      } else if (error.message?.includes("Already subscribed")) {
        showWarning(
          "Already Following", 
          "You are already subscribed to this strategy."
        );
      } else {
        showError(
          "Follow Failed", 
          "Failed to follow strategy. Please try again."
        );
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
      <div className="py-8">
        <SetupGuide />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card-premium p-6 neon-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white mb-1">{stats.totalStrategies}</p>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Active Strategies</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center neon-glow">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass-card-premium p-6 neon-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white mb-1">{stats.totalFollowers}</p>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Total Followers</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center neon-glow">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass-card-premium p-6 neon-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white mb-1">${(stats.totalVolume / 1e12).toFixed(1)}M</p>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Total Volume</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center neon-glow">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="glass-card-premium p-6 neon-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white mb-1">{stats.activeTrades}</p>
              <p className="text-sm text-gray-400 uppercase tracking-wide">Recent Trades</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center neon-glow">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card-premium p-4 neon-glow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
          {[
            { key: 'overview', label: 'Overview', icon: PieChart },
            { key: 'discover', label: 'Discover Strategies', icon: TrendingUp },
            { key: 'v4-pools', label: '🦄 v4 Pools', icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
                activeTab === key
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 neon-glow'
                  : 'text-gray-400 hover:text-white hover:bg-purple-500/10 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
          </div>
          
          <button
            onClick={() => {
              console.log('Refreshing strategies...');
              refetchStrategies();
            }}
            className="px-4 py-2 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 transition-all neon-glow"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'overview' ? (
        <div className="space-y-8">
          {/* Overview Sub-Tabs */}
          <div className="glass-card-premium p-4 neon-glow">
            <div className="flex space-x-2">
              {[
                { key: 'portfolio', label: 'Portfolio Overview', icon: PieChart },
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
      ) : activeTab === 'v4-pools' ? (
        <V4PoolInterface account={account} isLeader={isLeader} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strategies Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card-premium p-4 neon-glow animate-pulse">
                    <div className="bg-gray-700 h-48 rounded-lg"></div>
                  </div>
                ))
              ) : (
                strategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.tokenId}
                    strategy={strategy}
                    onFollow={handleFollow}
                    isOwnStrategy={strategy.leader === account}
                  />
                ))
              )}
            </div>
            
            {!loading && (
              <div className="mt-8 text-center">
                <button className="btn-secondary">
                  Load More Strategies
                </button>
              </div>
            )}
          </div>

          {/* Live Trades Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <TradesFeed trades={trades} loading={loading} />
            
            {/* Token Balances */}
            <div className="lg:block hidden">
              <TokenBalances account={account} />
            </div>
            
            {/* Faucet Panel */}
            <div className="lg:block hidden">
              <FaucetPanel account={account} />
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};