import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../types/contracts';

// ABI fragments for the main functions we need
const COPY_RELAY_ABI = [
  "function subscribe(address leader, uint256 subscriptionFeePaid) external payable",
  "function unsubscribe(address leader) external",
  "function getSubscription(address follower, address leader) external view returns (tuple(address follower, address leader, uint256 strategyId, uint256 subscriptionFee, uint256 performanceFee, bool isActive, uint256 subscribedAt, uint256 lastTradeTime))",
  "function totalSubscriptions() external view returns (uint256)",
  "function totalTrades() external view returns (uint256)",
  "event FollowerJoined(address indexed follower, address indexed leader, uint256 indexed strategyId, uint256 subscriptionFee, uint256 performanceFee)",
  "event FollowerLeft(address indexed follower, address indexed leader, uint256 indexed strategyId)",
  "event TradeExecuted(bytes32 indexed tradeId, address indexed leader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 timestamp)"
];

const STRATEGY_NFT_ABI = [
  "function createStrategy(string memory name, string memory description, uint256 performanceFee) external returns (uint256)",
  "function getStrategy(uint256 tokenId) external view returns (tuple(address leader, string name, string description, uint256 performanceFee, bool isActive, uint256 totalFollowers, uint256 totalVolume, uint256 createdAt))",
  "function getStrategyByLeader(address leader) external view returns (tuple(address leader, string name, string description, uint256 performanceFee, bool isActive, uint256 totalFollowers, uint256 totalVolume, uint256 createdAt))",
  "function isStrategyLeader(address account) external view returns (bool)",
  "function leaderToTokenId(address leader) external view returns (uint256)",
  "event StrategyCreated(uint256 indexed tokenId, address indexed leader, string name, uint256 performanceFee)"
];

const TEST_TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)"
];

export const useContracts = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [copyRelay, setCopyRelay] = useState<ethers.Contract | null>(null);
  const [strategyNFT, setStrategyNFT] = useState<ethers.Contract | null>(null);
  const [testUSDC, setTestUSDC] = useState<ethers.Contract | null>(null);
  const [testETH, setTestETH] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeContracts = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          if (!mounted) return;
          
          setProvider(provider);
          
          const signer = await provider.getSigner();
          if (!mounted) return;
          
          setSigner(signer);
          
          const network = await provider.getNetwork();
          console.log('Connected to network:', network.chainId);
          
          // Only initialize contracts if we're on the right network (31337 = Hardhat)
          // Handle both BigInt and number types for chainId
          const chainIdNumber = typeof network.chainId === 'bigint' ? Number(network.chainId) : network.chainId;
          if (chainIdNumber === 31337) {
            // Initialize contracts
            const copyRelayContract = new ethers.Contract(
              CONTRACTS.CopyRelay,
              COPY_RELAY_ABI,
              signer
            );
            
            const strategyNFTContract = new ethers.Contract(
              CONTRACTS.StrategyNFT,
              STRATEGY_NFT_ABI,
              signer
            );

            const testUSDCContract = new ethers.Contract(
              CONTRACTS.TestUSDC,
              TEST_TOKEN_ABI,
              signer
            );

            const testETHContract = new ethers.Contract(
              CONTRACTS.TestETH,
              TEST_TOKEN_ABI,
              signer
            );
            
            if (mounted) {
              setCopyRelay(copyRelayContract);
              setStrategyNFT(strategyNFTContract);
              setTestUSDC(testUSDCContract);
              setTestETH(testETHContract);
            }
          } else {
            console.warn('Wrong network detected. Current:', chainIdNumber, 'Expected: 31337');
          }
        } catch (error) {
          console.warn('Contract initialization failed, using mock data:', error);
        }
      }
    };

    // Add a small delay to avoid permission request loops
    const timeoutId = setTimeout(initializeContracts, 500);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const subscribeToStrategy = async (leader: string, amount: string) => {
    if (!copyRelay) throw new Error('Contracts not initialized');
    
    try {
      const tx = await copyRelay.subscribe(leader, ethers.parseEther(amount), {
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error subscribing to strategy:', error);
      throw error;
    }
  };

  const unsubscribeFromStrategy = async (leader: string) => {
    if (!copyRelay) throw new Error('Contracts not initialized');
    
    try {
      const tx = await copyRelay.unsubscribe(leader);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error unsubscribing from strategy:', error);
      throw error;
    }
  };

  const createStrategy = async (name: string, description: string, performanceFee: number) => {
    if (!strategyNFT) throw new Error('Contracts not initialized');
    
    try {
      const tx = await strategyNFT.createStrategy(name, description, performanceFee);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw error;
    }
  };

  const getStrategy = async (tokenId: number) => {
    if (!strategyNFT) throw new Error('Contracts not initialized');
    
    try {
      return await strategyNFT.getStrategy(tokenId);
    } catch (error) {
      console.error('Error getting strategy:', error);
      throw error;
    }
  };

  const getSubscription = async (follower: string, leader: string) => {
    if (!copyRelay) throw new Error('Contracts not initialized');
    
    try {
      return await copyRelay.getSubscription(follower, leader);
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  };

  const mintTestUSDC = async (to: string, amount: string) => {
    if (!testUSDC) throw new Error('TestUSDC contract not initialized');
    
    try {
      // Mint 1000 USDC (6 decimals)
      const mintAmount = ethers.parseUnits(amount, 6);
      const tx = await testUSDC.mint(to, mintAmount);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error minting TestUSDC:', error);
      throw error;
    }
  };

  const mintTestETH = async (to: string, amount: string) => {
    if (!testETH) throw new Error('TestETH contract not initialized');
    
    try {
      // Mint test ETH (18 decimals)
      const mintAmount = ethers.parseEther(amount);
      const tx = await testETH.mint(to, mintAmount);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error minting TestETH:', error);
      throw error;
    }
  };

  const getTokenBalance = async (tokenAddress: string, userAddress: string) => {
    if (!provider) return '0';
    
    try {
      const tokenContract = new ethers.Contract(tokenAddress, TEST_TOKEN_ABI, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  };

  return {
    provider,
    signer,
    copyRelay,
    strategyNFT,
    testUSDC,
    testETH,
    subscribeToStrategy,
    unsubscribeFromStrategy,
    createStrategy,
    getStrategy,
    getSubscription,
    mintTestUSDC,
    mintTestETH,
    getTokenBalance
  };
};