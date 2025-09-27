import React from 'react';
import { Users, TrendingUp, Star, Calendar } from 'lucide-react';
import { Strategy } from '../types/contracts';

interface StrategyCardProps {
  strategy: Strategy & { tokenId: number };
  onFollow: (leader: string, strategyId: number) => void;
  isFollowing?: boolean;
  isOwnStrategy?: boolean;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({ 
  strategy, 
  onFollow, 
  isFollowing = false,
  isOwnStrategy = false 
}) => {
  const formatVolume = (volume: string) => {
    const vol = parseFloat(volume);
    if (vol === 0) return '$0';
    if (vol < 1000) return `$${vol.toFixed(2)}`;
    if (vol < 1000000) return `$${(vol / 1000).toFixed(1)}K`;
    if (vol < 1000000000) return `$${(vol / 1000000).toFixed(1)}M`;
    return `$${(vol / 1000000000).toFixed(1)}B`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="glass-card-premium p-6 neon-glow relative">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">{strategy.name}</h3>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">{strategy.description}</p>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(strategy.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>{strategy.performanceFee / 100}% fee</span>
            </div>
          </div>
        </div>
        
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          strategy.isActive 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {strategy.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">Followers</span>
          </div>
          <p className="text-xl font-bold text-white">{strategy.totalFollowers}</p>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium uppercase tracking-wide">Volume</span>
          </div>
          <p className="text-xl font-bold text-white">{formatVolume(strategy.totalVolume)}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {!isOwnStrategy && (
          <button
            onClick={() => onFollow(strategy.leader, strategy.tokenId)}
            disabled={isFollowing}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              isFollowing 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow Strategy'}
          </button>
        )}
        
        {isOwnStrategy && (
          <button className="flex-1 py-3 px-6 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-600 hover:border-gray-500">
            Manage Strategy
          </button>
        )}
        
        <button className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl border border-purple-500/30 transition-all duration-300 hover:scale-105">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </button>
      </div>
    </div>
  );
};