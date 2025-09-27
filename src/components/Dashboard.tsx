import React, { useState } from 'react';
import { TrendingUp, Users, Activity, DollarSign, PieChart, Zap } from 'lucide-react';
import { StrategyCard } from './StrategyCard';
import { TradesFeed } from './TradesFeed';
import { PortfolioOverview } from './PortfolioOverview';
import { FaucetPanel } from './FaucetPanel';
import { TokenBalances } from './TokenBalances';
import { SetupGuide } from './SetupGuide';
import { TradeInterface } from './TradeInterface';
import { V4PoolInterface } from './V4PoolInterface';
import { ToastContainer } from './Toast';
import { useStrategies } from '../hooks/useStrategies';
import { useTrades } from '../hooks/useTrades';
import { useToast } from '../hooks/useToast';
import { Strategy, TradeEvent } from '../types/contracts';

interface DashboardProps {
  account?: string;
  isConnected: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ account, isConnected }) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'my-strategies' | 'portfolio' | 'trade' | 'v4-pools'>('discover');
  const [myStrategiesSubTab, setMyStrategiesSubTab] = useState<'created' | 'joined'>('created');
  
  // Use custom hooks for contract data
  const { strategies, loading: strategiesLoading, followStrategy, createNewStrategy, refetchStrategies } = useStrategies(account);
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
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalStrategies}</p>
              <p className="text-sm text-gray-600">Active Strategies</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalFollowers}</p>
              <p className="text-sm text-gray-600">Total Followers</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${(stats.totalVolume / 1e12).toFixed(1)}M</p>
              <p className="text-sm text-gray-600">Total Volume</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeTrades}</p>
              <p className="text-sm text-gray-600">Recent Trades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
          {[
            { key: 'discover', label: 'Discover Strategies', icon: TrendingUp },
            { key: 'following', label: 'Following', icon: Users },
            { key: 'my-strategies', label: 'My Strategies', icon: Activity },
            { key: 'trade', label: 'Trade', icon: DollarSign },
            { key: 'v4-pools', label: '🦄 v4 Pools', icon: Zap },
            { key: 'portfolio', label: 'Portfolio', icon: PieChart }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
                activeTab === key
                  ? 'bg-white/60 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:bg-white/30'
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
            className="px-3 py-2 text-sm bg-white/60 hover:bg-white/80 rounded-lg border border-purple-200 transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'portfolio' ? (
        <PortfolioOverview account={account} />
      ) : activeTab === 'trade' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TradeInterface account={account} isLeader={isLeader} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <TokenBalances account={account} />
            <FaucetPanel account={account} />
          </div>
        </div>
      ) : activeTab === 'v4-pools' ? (
        <V4PoolInterface account={account} isLeader={isLeader} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strategies Grid */}
          <div className="lg:col-span-2">
            {/* My Strategies Sub-Tabs */}
            {activeTab === 'my-strategies' && (
              <div className="mb-6">
                <div className="glass-card p-2">
                  <div className="flex space-x-2">
                    {[
                      { key: 'created', label: `Created by Me (${createdStrategies.length})` },
                      { key: 'joined', label: `Joined by Me (${joinedStrategies.length})` }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setMyStrategiesSubTab(key as 'created' | 'joined')}
                        className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                          myStrategiesSubTab === key
                            ? 'bg-white/60 text-purple-700 shadow-sm'
                            : 'text-gray-600 hover:bg-white/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="strategy-card animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg"></div>
                  </div>
                ))
              ) : (
                strategies
                  .filter(strategy => {
                    if (activeTab === 'my-strategies') {
                      if (myStrategiesSubTab === 'created') {
                        return strategy.leader?.toLowerCase() === account?.toLowerCase();
                      } else {
                        // 'joined' tab - show strategies user has subscribed to
                        // For now, show strategies where user is not the owner but has followers (mock)
                        return strategy.leader?.toLowerCase() !== account?.toLowerCase() && strategy.totalFollowers > 0;
                      }
                    }
                    if (activeTab === 'following') return false; // Legacy tab
                    return true; // discover all
                  })
                  .map((strategy) => (
                    <StrategyCard
                      key={strategy.tokenId}
                      strategy={strategy}
                      onFollow={handleFollow}
                      isOwnStrategy={strategy.leader === account}
                    />
                  ))
              )}
              
              {/* Empty State for My Strategies */}
              {activeTab === 'my-strategies' && !loading && strategies.length > 0 && (
                strategies.filter(strategy => {
                  if (myStrategiesSubTab === 'created') {
                    return strategy.leader?.toLowerCase() === account?.toLowerCase();
                  } else {
                    return strategy.leader?.toLowerCase() !== account?.toLowerCase() && strategy.totalFollowers > 0;
                  }
                }).length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      {myStrategiesSubTab === 'created' ? (
                        <Activity className="w-8 h-8 text-purple-600" />
                      ) : (
                        <Users className="w-8 h-8 text-purple-600" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {myStrategiesSubTab === 'created' ? 'No Strategies Created' : 'No Strategies Joined'}
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-sm">
                      {myStrategiesSubTab === 'created' 
                        ? 'You haven\'t created any strategies yet. Click the + button to create your first strategy!'
                        : 'You haven\'t joined any strategies yet. Browse the Discover tab to find strategies to follow.'
                      }
                    </p>
                    {myStrategiesSubTab === 'created' && (
                      <button 
                        onClick={() => {/* This would trigger strategy creation modal */}}
                        className="btn-primary"
                      >
                        Create Your First Strategy
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
            
            {activeTab === 'discover' && !loading && (
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