import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Wallet, Network, Key } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const networkConfig = {
    name: 'Local Hardhat',
    rpcUrl: 'http://localhost:8545',
    chainId: '31337',
    currency: 'ETH'
  };

  const testAccount = {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  };

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">MetaMask Setup Required</h2>
        <p className="text-gray-600">Connect to Local Hardhat network to use PookieFI</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Add Network */}
        <div className="border border-purple-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Network className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Step 1: Add Network to MetaMask</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Open MetaMask → Networks → Add Network → Add a network manually
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Network Name</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded">{networkConfig.name}</code>
                <button
                  onClick={() => copyToClipboard(networkConfig.name, 'name')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {copiedText === 'name' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Chain ID</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded">{networkConfig.chainId}</code>
                <button
                  onClick={() => copyToClipboard(networkConfig.chainId, 'chainId')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {copiedText === 'chainId' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">RPC URL</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded">{networkConfig.rpcUrl}</code>
                <button
                  onClick={() => copyToClipboard(networkConfig.rpcUrl, 'rpc')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {copiedText === 'rpc' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded">{networkConfig.currency}</code>
                <button
                  onClick={() => copyToClipboard(networkConfig.currency, 'currency')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {copiedText === 'currency' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Import Account */}
        <div className="border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Key className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Step 2: Import Test Account</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Import this account to get 10,000 ETH for testing
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono">{testAccount.address}</code>
                <button
                  onClick={() => copyToClipboard(testAccount.address, 'address')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {copiedText === 'address' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Private Key</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono">{testAccount.privateKey}</code>
                <button
                  onClick={() => copyToClipboard(testAccount.privateKey, 'privateKey')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {copiedText === 'privateKey' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ This is a test account with publicly known keys. Never use on mainnet!
            </p>
          </div>
        </div>

        {/* Step 3: Instructions */}
        <div className="border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Step 3: Import Account in MetaMask</h3>
          <ol className="text-sm text-gray-600 space-y-2">
            <li>1. Open MetaMask → Account menu → Import Account</li>
            <li>2. Select "Private Key" as import type</li>
            <li>3. Paste the private key above</li>
            <li>4. Click "Import"</li>
            <li>5. Switch to "Local Hardhat" network</li>
            <li>6. Refresh this page and connect wallet</li>
          </ol>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          I've completed the setup - Refresh Page
        </button>
      </div>
    </div>
  );
};