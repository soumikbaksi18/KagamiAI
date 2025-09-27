import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CreateStrategy } from './components/CreateStrategy';
import { NetworkBanner } from './components/NetworkBanner';
import TradeFlow from './components/TradeFlow';
import TradeReflex from './components/TradeReflex';
import X402Test from './components/X402Test';
import { useWallet } from './hooks/useWallet';
import { useContracts } from './hooks/useContracts';
import { Plus } from 'lucide-react';
import './App.css';

// Main App Layout Component
function AppLayout() {
  const { isConnected, address, chainId, connect, disconnect, switchToLocalHardhat } = useWallet();
  const { createStrategy } = useContracts();
  const [showCreateStrategy, setShowCreateStrategy] = useState(false);
  const location = useLocation();

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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        <Header
          isConnected={isConnected}
          address={address}
          onConnect={connect}
          onDisconnect={disconnect}
        />
        
        {isConnected && (
          <NetworkBanner
            currentChainId={chainId}
            onSwitchNetwork={switchToLocalHardhat}
          />
        )}
        
                <Routes>
                  <Route path="/" element={
                    <Dashboard
                      account={address}
                      isConnected={isConnected}
                    />
                  } />
                  <Route path="/tradeflow" element={<TradeFlow />} />
                  <Route path="/tradereflex" element={<TradeReflex />} />
                  <Route path="/x402t" element={<X402Test />} />
                </Routes>
        
        {/* Floating Action Button - only show on dashboard */}
        {isConnected && location.pathname === "/" && (
          <button
            onClick={() => setShowCreateStrategy(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-105 neon-glow"
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

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;