import React, { useState } from 'react';
import { TrendingUp, Users, Activity, DollarSign, PieChart } from 'lucide-react';
import { StrategyCard } from './StrategyCard';
import { TradesFeed } from './TradesFeed';
import { PortfolioOverview } from './PortfolioOverview';
import { FaucetPanel } from './FaucetPanel';
import { TokenBalances } from './TokenBalances';
import { SetupGuide } from './SetupGuide';
import { useStrategies } from '../hooks/useStrategies';
import { useTrades } from '../hooks/useTrades';
import { Strategy, TradeEvent } from '../types/contracts';

interface DashboardProps {
  account?: string;
  isConnected: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ account, isConnected }) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'my-strategies' | 'portfolio'>('discover');
  
  // Use custom hooks for contract data
  const { strategies, loading: strategiesLoading, followStrategy, createNewStrategy } = useStrategies(account);
  const { trades, loading: tradesLoading } = useTrades();
  
  const loading = strategiesLoading || tradesLoading;

  const handleFollow = async (leader: string, strategyId: number) => {
    try {
      console.log(`Following strategy ${strategyId} by ${leader}`);
      await followStrategy(leader, "0.1"); // Default 0.1 ETH subscription
      // Show success notification
    } catch (error) {
      console.error('Failed to follow strategy:', error);
      // Show error notification
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
        <div className="flex space-x-2">
          {[
            { key: 'discover', label: 'Discover Strategies', icon: TrendingUp },
            { key: 'following', label: 'Following', icon: Users },
            { key: 'my-strategies', label: 'My Strategies', icon: Activity },
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
      </div>

      {/* Main Content */}
      {activeTab === 'portfolio' ? (
        <PortfolioOverview account={account} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strategies Grid */}
          <div className="lg:col-span-2">
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
                    if (activeTab === 'my-strategies') return strategy.leader === account;
                    if (activeTab === 'following') return false; // Would check actual subscriptions
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
    </div>
  );
};