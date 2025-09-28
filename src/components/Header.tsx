import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, User, TrendingUp, BarChart3, Users } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  address?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isConnected, 
  address, 
  onConnect, 
  onDisconnect 
}) => {
  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const location = useLocation();

  return (
    <header className="glass-card-premium p-8 mb-12 neon-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center neon-glow">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">KagamiAI</h1>
              <p className="text-sm text-gray-400">Social Copy Trading Platform</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                location.pathname === "/"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 neon-glow"
                  : "text-gray-400 hover:text-white hover:bg-purple-500/10 border border-transparent"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/tradeflow"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                location.pathname === "/tradeflow"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 neon-glow"
                  : "text-gray-400 hover:text-white hover:bg-purple-500/10 border border-transparent"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>TradeFlow</span>
            </Link>
            <Link
              to="/tradereflex"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                location.pathname === "/tradereflex"
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/30 neon-glow-pink"
                  : "text-gray-400 hover:text-white hover:bg-pink-500/10 border border-transparent"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>TradeReflex</span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full neon-pulse"></div>
                <span className="text-sm font-medium text-green-400">Connected</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/30 border border-purple-500/30 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-mono text-white">{formatAddress(address || '')}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('Disconnect wallet? This will refresh the page.')) {
                    onDisconnect();
                  }
                }}
                className="btn-secondary"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="btn-primary flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};