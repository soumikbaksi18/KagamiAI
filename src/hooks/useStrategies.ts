import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { Strategy } from '../types/contracts';

export const useStrategies = () => {
  const [strategies, setStrategies] = useState<(Strategy & { tokenId: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const { strategyNFT, copyRelay } = useContracts();

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      
      if (!strategyNFT) {
        console.log('StrategyNFT contract not available, using mock data');
        setStrategies(getMockStrategies());
        return;
      }
      
      // Get all strategy creation events to find all strategies
      const filter = strategyNFT.filters.StrategyCreated();
      const events = await strategyNFT.queryFilter(filter, 0); // From genesis block to get all events
      
      console.log('Strategy events found:', events.length);
      events.forEach((event, i) => {
        if ('args' in event) {
          console.log(`Event ${i}:`, {
            tokenId: event.args.tokenId.toString(),
            leader: event.args.leader,
            name: event.args.name
          });
        }
      });
      
      if (events.length === 0) {
        console.log('No strategies found on-chain, using mock data');
        setStrategies(getMockStrategies());
        return;
      }
      
      const strategiesData = await Promise.all(
        events.map(async (event: any) => {
          if (!('args' in event)) return null;
          const tokenId = event.args.tokenId;
          console.log('Processing strategy tokenId:', tokenId);
          
          const strategy = await strategyNFT.getStrategy(tokenId);
          console.log('Strategy data:', strategy);
          
          const strategyObj = {
            tokenId: Number(tokenId),
            leader: strategy.leader,
            name: strategy.name,
            description: strategy.description,
            performanceFee: Number(strategy.performanceFee),
            isActive: strategy.isActive,
            totalFollowers: Number(strategy.totalFollowers),
            totalVolume: strategy.totalVolume.toString(),
            createdAt: Number(strategy.createdAt)
          };
          
          console.log('Processed strategy:', strategyObj);
          return strategyObj;
        })
      );
      
      // Filter out null values and set strategies
      const validStrategies = strategiesData.filter(strategy => strategy !== null);
      setStrategies(validStrategies);
      console.log(`Loaded ${validStrategies.length} strategies from blockchain`);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      console.warn('Using fallback mock data due to blockchain connection issue');
      setStrategies(getMockStrategies());
    } finally {
      setLoading(false);
    }
  };

  const getMockStrategies = () => [
    {
      tokenId: 1,
      leader: "0x742d35Cc6634C0532925a3b8D5C9CFBA12345678",
      name: "DeFi Yield Hunter",
      description: "Automated yield farming across top DeFi protocols with risk management",
      performanceFee: 250,
      isActive: true,
      totalFollowers: 127,
      totalVolume: "2450000000000",
      createdAt: 1695744000
    },
    {
      tokenId: 2,
      leader: "0x8ba1f109551bD432803012645Hac136c12345678",
      name: "ETH Momentum",
      description: "Trend-following strategy focused on ETH ecosystem tokens",
      performanceFee: 300,
      isActive: true,
      totalFollowers: 89,
      totalVolume: "1800000000000",
      createdAt: 1695657600
    },
    {
      tokenId: 3,
      leader: "0x1aB3c0532925a3b8D5C9CFBAdd987654321234567",
      name: "Safe Blue Chip",
      description: "Conservative strategy targeting established DeFi blue chips",
      performanceFee: 150,
      isActive: true,
      totalFollowers: 234,
      totalVolume: "5200000000000",
      createdAt: 1695571200
    }
  ];

  const createNewStrategy = async (name: string, description: string, performanceFee: number) => {
    if (!strategyNFT) throw new Error('StrategyNFT contract not initialized');
    
    try {
      const tx = await strategyNFT.createStrategy(name, description, performanceFee);
      const receipt = await tx.wait();
      
      // Refresh strategies after creation
      await fetchStrategies();
      
      return receipt;
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw error;
    }
  };

  const followStrategy = async (leader: string, amount: string) => {
    if (!copyRelay) throw new Error('CopyRelay contract not initialized');
    
    try {
      const subscriptionFee = ethers.parseEther(amount);
      const tx = await copyRelay.subscribe(leader, subscriptionFee, {
        value: subscriptionFee
      });
      const receipt = await tx.wait();
      
      // Refresh strategies to update follower counts
      await fetchStrategies();
      
      return receipt;
    } catch (error) {
      console.error('Error following strategy:', error);
      throw error;
    }
  };

  const unfollowStrategy = async (leader: string) => {
    if (!copyRelay) throw new Error('CopyRelay contract not initialized');
    
    try {
      const tx = await copyRelay.unsubscribe(leader);
      const receipt = await tx.wait();
      
      // Refresh strategies to update follower counts
      await fetchStrategies();
      
      return receipt;
    } catch (error) {
      console.error('Error unfollowing strategy:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (strategyNFT) {
      fetchStrategies();
    }
  }, [strategyNFT]);

  return {
    strategies,
    loading,
    createNewStrategy,
    followStrategy,
    unfollowStrategy,
    refetchStrategies: fetchStrategies
  };
};