import React, { useState, useEffect } from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { CONTRACTS } from '../types/contracts';

interface TokenBalancesProps {
  account?: string;
}

export const TokenBalances: React.FC<TokenBalancesProps> = ({ account }) => {
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const { getTokenBalance, provider } = useContracts();

  const tokens = [
    { symbol: 'USDC', address: CONTRACTS.TestUSDC, decimals: 6 },
    { symbol: 'ETH', address: CONTRACTS.TestETH, decimals: 18 }
  ];

  const fetchBalances = async () => {
    if (!account || !provider) return;
    
    try {
      setLoading(true);
      const balancePromises = tokens.map(async (token) => {
        const balance = await getTokenBalance(token.address, account);
        return { symbol: token.symbol, balance };
      });
      
      const results = await Promise.all(balancePromises);
      const balanceMap = results.reduce((acc, { symbol, balance }) => {
        acc[symbol] = balance;
        return acc;
      }, {} as { [key: string]: string });
      
      setBalances(balanceMap);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchBalances();
    }
  }, [account, provider]);

  if (!account) return null;

  return (
    <div className="glass-card-premium p-6 neon-glow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center neon-glow">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Token Balances</h3>
            <p className="text-sm text-gray-400">Your test token holdings</p>
          </div>
        </div>
        
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 disabled:opacity-50 text-gray-400 hover:text-white"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {tokens.map((token) => (
          <div
            key={token.symbol}
            className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:bg-gray-800/50 transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                token.symbol === 'USDC' 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 neon-glow' 
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
              }`}>
                {token.symbol === 'USDC' ? 'UC' : 'ETH'}
              </div>
              <div>
                <p className="font-bold text-white text-lg">{token.symbol}</p>
                <p className="text-sm text-gray-400">Test Token</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-white text-xl">
                {loading ? '...' : (parseFloat(balances[token.symbol] || '0')).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">{token.symbol}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};