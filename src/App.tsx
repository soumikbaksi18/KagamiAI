import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CreateStrategy } from './components/CreateStrategy';
import { NetworkBanner } from './components/NetworkBanner';
import { useWallet } from './hooks/useWallet';
import { useContracts } from './hooks/useContracts';
import { Plus } from 'lucide-react';
import './App.css';

function App() {
  const { isConnected, address, chainId, connect, disconnect, switchToPolygonAmoy } = useWallet();
  const { createStrategy } = useContracts();
  const [showCreateStrategy, setShowCreateStrategy] = useState(false);

  const handleCreateStrategy = async (strategyData: {
    name: string;
    description: string;
    performanceFee: number;
  }) => {
    try {
      console.log('Creating strategy:', strategyData);
      const tx = await createStrategy(strategyData.name, strategyData.description, strategyData.performanceFee);
      console.log('Strategy created successfully:', tx.hash);
      // Strategies will auto-refresh via useStrategies hook
    } catch (error) {
      console.error('Failed to create strategy:', error);
      alert('Failed to create strategy. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Header
          isConnected={isConnected}
          address={address}
          onConnect={connect}
          onDisconnect={disconnect}
        />
        
        {isConnected && (
          <NetworkBanner
            currentChainId={chainId}
            onSwitchNetwork={switchToPolygonAmoy}
          />
        )}
        
        <Dashboard
          account={address}
          isConnected={isConnected}
        />
        
        {/* Floating Action Button */}
        {isConnected && (
          <button
            onClick={() => setShowCreateStrategy(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-105"
          >
            <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
          </button>
        )}
        
        <CreateStrategy
          isOpen={showCreateStrategy}
          onClose={() => setShowCreateStrategy(false)}
          onSubmit={handleCreateStrategy}
        />
      </div>
    </div>
  );
}

export default App;