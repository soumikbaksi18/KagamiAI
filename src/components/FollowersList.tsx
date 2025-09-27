import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';

interface FollowersListProps {
  leader: string;
  account?: string;
}

interface FollowerData {
  address: string;
  subscriptionFee: string;
  subscribedAt: number;
  lastTradeTime: number;
}

export const FollowersList: React.FC<FollowersListProps> = ({ leader }) => {
  const [followers, setFollowers] = useState<string[]>([]);
  const [followerDetails, setFollowerDetails] = useState<FollowerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [contractsReady, setContractsReady] = useState(false);
  const { getFollowers, getSubscription, copyRelay } = useContracts();

  // Monitor when contracts are ready
  useEffect(() => {
    if (copyRelay) {
      setContractsReady(true);
    }
  }, [copyRelay]);

  const fetchFollowers = async () => {
    if (!leader || !contractsReady) return;
    
    try {
      setLoading(true);
      const followerAddresses = await getFollowers(leader);
      setFollowers(followerAddresses);
      
      // Get detailed subscription info for each follower
      const details = await Promise.all(
        followerAddresses.map(async (address: string) => {
          try {
            const subscription = await getSubscription(address, leader);
            return {
              address,
              subscriptionFee: subscription.subscriptionFee.toString(),
              subscribedAt: Number(subscription.subscribedAt),
              lastTradeTime: Number(subscription.lastTradeTime)
            };
          } catch (error) {
            console.error(`Error getting subscription details for ${address}:`, error);
            return {
              address,
              subscriptionFee: '0',
              subscribedAt: 0,
              lastTradeTime: 0
            };
          }
        })
      );
      
      setFollowerDetails(details);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractsReady) {
      fetchFollowers();
    }
  }, [leader, contractsReady]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatEther = (wei: string) => {
    const eth = parseFloat(wei) / 1e18;
    return eth.toFixed(4);
  };

  if (!contractsReady) {
    return (
      <div className="glass-card-premium p-6 neon-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center neon-glow">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">My Followers</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mb-4 neon-glow mx-auto">
            <Users className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-400">Initializing contracts...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card-premium p-6 neon-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center neon-glow">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">My Followers</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-premium p-6 neon-glow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center neon-glow">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">My Followers</h3>
            <p className="text-sm text-gray-400">{followers.length} active subscribers</p>
          </div>
        </div>
        
        <button
          onClick={fetchFollowers}
          className="px-4 py-2 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl border border-purple-500/30 transition-all neon-glow"
        >
          🔄 Refresh
        </button>
      </div>

      {followers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No Followers Yet</h4>
          <p className="text-gray-500">
            Start creating strategies and executing trades to attract followers!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {followerDetails.map((follower, index) => (
            <div
              key={follower.address}
              className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-white text-sm">
                        {formatAddress(follower.address)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(follower.address)}
                        className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                      >
                        {copiedAddress === follower.address ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Joined: {formatDate(follower.subscribedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>Fee: {formatEther(follower.subscriptionFee)} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={`https://etherscan.io/address/${follower.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white" />
                  </a>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Last Trade</div>
                    <div className="text-sm text-white">
                      {formatDate(follower.lastTradeTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};