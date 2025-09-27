import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, User, TrendingUp, BarChart3 } from 'lucide-react';

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
    <header className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">PookieFI</h1>
              <p className="text-sm text-gray-600">Social Copy Trading Platform</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/tradeflow"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/tradeflow"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Trade Flow</span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Connected</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-mono">{formatAddress(address || '')}</span>
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