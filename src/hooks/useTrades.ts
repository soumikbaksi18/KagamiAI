import { useState, useEffect } from 'react';
import { useContracts } from './useContracts';
import { TradeEvent } from '../types/contracts';

export const useTrades = () => {
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { copyRelay } = useContracts();

  const fetchTrades = async () => {
    try {
      setLoading(true);
      
      if (!copyRelay) {
        console.log('CopyRelay contract not available, using mock data');
        setTrades(getMockTrades());
        return;
      }
      
      // Get all trade execution events
      const filter = copyRelay.filters.TradeExecuted();
      const events = await copyRelay.queryFilter(filter, -100); // Last 100 blocks
      
      if (events.length === 0) {
        console.log('No trades found on-chain, using mock data');
        setTrades(getMockTrades());
        return;
      }
      
      const tradesData = events.map((event: any) => ({
        tradeId: event.args.tradeId,
        leader: event.args.leader,
        tokenIn: event.args.tokenIn,
        tokenOut: event.args.tokenOut,
        amountIn: event.args.amountIn.toString(),
        amountOut: event.args.amountOut.toString(),
        timestamp: Number(event.args.timestamp)
      }));
      
      // Sort by timestamp descending (newest first)
      tradesData.sort((a, b) => b.timestamp - a.timestamp);
      
      setTrades(tradesData);
      console.log(`Loaded ${tradesData.length} trades from blockchain`);
    } catch (error) {
      console.warn('Using fallback mock data due to blockchain connection issue:', error);
      setTrades(getMockTrades());
    } finally {
      setLoading(false);
    }
  };

  const getMockTrades = () => [
    {
      tradeId: "0x1234567890abcdef",
      leader: "0x742d35Cc6634C0532925a3b8D5C9CFBA12345678",
      tokenIn: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      tokenOut: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      amountIn: "1000000000",
      amountOut: "500000000000000000",
      timestamp: Math.floor(Date.now() / 1000) - 300
    },
    {
      tradeId: "0xabcdef1234567890",
      leader: "0x8ba1f109551bD432803012645Hac136c12345678",
      tokenIn: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      tokenOut: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      amountIn: "200000000000000000",
      amountOut: "400000000",
      timestamp: Math.floor(Date.now() / 1000) - 600
    }
  ];

  // Listen for new trade events
  useEffect(() => {
    if (!copyRelay) return;

    const handleTradeExecuted = (tradeId: string, leader: string, tokenIn: string, tokenOut: string, amountIn: bigint, amountOut: bigint, timestamp: bigint) => {
      const newTrade: TradeEvent = {
        tradeId,
        leader,
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        timestamp: Number(timestamp)
      };
      
      setTrades(prev => [newTrade, ...prev].slice(0, 50)); // Keep only latest 50 trades
    };

    // Set up event listener
    copyRelay.on('TradeExecuted', handleTradeExecuted);

    return () => {
      copyRelay.off('TradeExecuted', handleTradeExecuted);
    };
  }, [copyRelay]);

  useEffect(() => {
    if (copyRelay) {
      fetchTrades();
    }
  }, [copyRelay]);

  return {
    trades,
    loading,
    refetchTrades: fetchTrades
  };
};