import React, { useState } from 'react';
import { Droplets, ExternalLink, Copy, Check, Loader } from 'lucide-react';
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
    <div className="glass-card p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Droplets className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Test Token Faucets</h3>
          <p className="text-sm text-gray-600">Get tokens for testing</p>
        </div>
      </div>

      {/* Wallet Address */}
      {account && (
        <div className="bg-gray-50/50 p-4 rounded-lg mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Wallet Address
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-sm bg-white/60 px-3 py-2 rounded border">
              {account}
            </code>
            <button
              onClick={() => copyToClipboard(account)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              {copiedAddress === account ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Faucet Links */}
      <div className="space-y-3">
        {faucets.map((faucet, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition-all hover:border-${faucet.color}-300 hover:bg-${faucet.color}-50/30`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{faucet.name}</h4>
                <p className="text-sm text-gray-600">{faucet.description}</p>
              </div>
              
              {faucet.isContract ? (
                <button
                  onClick={() => mintTestTokens(faucet.id, faucet.amount || '100')}
                  disabled={minting === faucet.id || faucet.disabled}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {minting === faucet.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Droplets className="w-4 h-4" />
                  )}
                  <span>{minting === faucet.id ? 'Minting...' : 'Mint'}</span>
                </button>
              ) : faucet.disabled ? (
                <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                  Available
                </div>
              ) : (
                <a
                  href={faucet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Get Tokens</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50/50 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
          <div>
            <p className="text-sm font-medium text-yellow-800">Demo Tips</p>
            <p className="text-xs text-yellow-700 mt-1">
              Use these faucets to get test tokens for demonstrating copy trading functionality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};