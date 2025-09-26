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
    const vol = parseFloat(volume) / 1e6; // Assuming USDC decimals
    return vol > 1000 ? `$${(vol / 1000).toFixed(1)}K` : `$${vol.toFixed(0)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="strategy-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{strategy.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(strategy.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>{strategy.performanceFee / 100}% fee</span>
            </div>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          strategy.isActive ? 'status-active' : 'status-inactive'
        }`}>
          {strategy.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50/50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Followers</span>
          </div>
          <p className="text-lg font-bold text-blue-800">{strategy.totalFollowers}</p>
        </div>
        
        <div className="bg-green-50/50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Volume</span>
          </div>
          <p className="text-lg font-bold text-green-800">{formatVolume(strategy.totalVolume)}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {!isOwnStrategy && (
          <button
            onClick={() => onFollow(strategy.leader, strategy.tokenId)}
            disabled={isFollowing}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              isFollowing 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'btn-primary'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow Strategy'}
          </button>
        )}
        
        {isOwnStrategy && (
          <button className="flex-1 btn-secondary py-3">
            Manage Strategy
          </button>
        )}
        
        <button className="px-4 py-3 bg-white/60 hover:bg-white/80 rounded-lg border border-purple-200 transition-all">
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </button>
      </div>
    </div>
  );
};