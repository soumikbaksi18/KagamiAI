import React, { useState } from 'react';
import { Droplets, Copy, Check, Loader } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';

interface FaucetPanelProps {
  account?: string;
}

export const FaucetPanel: React.FC<FaucetPanelProps> = ({ account }) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [minting, setMinting] = useState<string | null>(null);
  const { mintTestUSDC, mintTestETH } = useContracts();

  const faucets = [
    {
      id: 'eth',
      name: 'Local ETH',
      description: 'You have 10,000 ETH on Hardhat for gas fees',
      color: 'purple',
      isContract: false,
      disabled: true
    },
    {
      id: 'usdc',
      name: 'Test USDC',
      description: 'Mint 1000 test USDC tokens',
      color: 'blue',
      isContract: true,
      amount: '1000'
    },
    {
      id: 'testeth',
      name: 'Test ETH',
      description: 'Mint 10 test ETH tokens',
      color: 'green',
      isContract: true,
      amount: '10'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const mintTestTokens = async (faucetId: string, amount: string) => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setMinting(faucetId);
      
      if (faucetId === 'usdc') {
        const tx = await mintTestUSDC(account, amount);
        console.log('USDC minted successfully:', tx.hash);
        alert(`Successfully minted ${amount} Test USDC!`);
      } else if (faucetId === 'testeth') {
        const tx = await mintTestETH(account, amount);
        console.log('ETH minted successfully:', tx.hash);
        alert(`Successfully minted ${amount} Test ETH!`);
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. Make sure you\'re on the right network and contracts are deployed.');
    } finally {
      setMinting(null);
    }
  };

  return (
    <div className="glass-card-premium p-6 neon-glow">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center neon-glow">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Test Token Faucets</h3>
          <p className="text-sm text-gray-400">Get tokens for testing</p>
        </div>
      </div>

      {/* Wallet Address */}
      {account && (
        <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl mb-6">
          <label className="block text-sm font-medium text-white mb-3">
            Your Wallet Address
          </label>
          <div className="flex items-center space-x-3">
            <code className="flex-1 text-sm bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 font-mono">
              {account}
            </code>
            <button
              onClick={() => copyToClipboard(account)}
              className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 text-gray-400 hover:text-white"
            >
              {copiedAddress === account ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Faucet Links */}
      <div className="space-y-4">
        {faucets.map((faucet, index) => (
          <div
            key={index}
            className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 transition-all duration-300 hover:bg-gray-800/50 hover:border-gray-600/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">{faucet.name}</h4>
                <p className="text-sm text-gray-400 mt-1">{faucet.description}</p>
              </div>
              
              {faucet.isContract ? (
                <button
                  onClick={() => mintTestTokens(faucet.id, faucet.amount || '100')}
                  disabled={minting === faucet.id || faucet.disabled}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 hover:scale-105"
                >
                  {minting === faucet.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Droplets className="w-4 h-4" />
                  )}
                  <span>{minting === faucet.id ? 'Minting...' : 'Mint'}</span>
                </button>
              ) : faucet.disabled ? (
                <div className="px-4 py-2 bg-gray-700/50 text-gray-400 rounded-xl text-sm font-medium border border-gray-600">
                  Available
                </div>
              ) : (
                <div className="px-4 py-2 bg-gray-700/50 text-gray-400 rounded-xl text-sm font-medium border border-gray-600">
                  Not Available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
          <div>
            <p className="text-sm font-semibold text-yellow-400">Demo Tips</p>
            <p className="text-sm text-yellow-300 mt-1">
              Use these faucets to get test tokens for demonstrating copy trading functionality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};