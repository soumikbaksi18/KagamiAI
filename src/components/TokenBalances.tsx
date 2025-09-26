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
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Coins className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Token Balances</h3>
            <p className="text-sm text-gray-600">Your test token holdings</p>
          </div>
        </div>
        
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {tokens.map((token) => (
          <div
            key={token.symbol}
            className="flex items-center justify-between p-3 bg-white/30 rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                token.symbol === 'USDC' ? 'bg-blue-500' : 'bg-gray-700'
              }`}>
                {token.symbol === 'USDC' ? 'UC' : 'ETH'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{token.symbol}</p>
                <p className="text-xs text-gray-500">Test Token</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-gray-800">
                {loading ? '...' : (parseFloat(balances[token.symbol] || '0')).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{token.symbol}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};