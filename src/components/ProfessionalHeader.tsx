import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, TrendingUp, Settings, Bell, Search } from 'lucide-react';

interface ProfessionalHeaderProps {
  isConnected: boolean;
  address?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({ 
  isConnected, 
  address, 
  onConnect, 
  onDisconnect 
}) => {
  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const location = useLocation();

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PookieFI</span>
            </Link>
            
            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/trading"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/trading"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Trading
              </Link>
        
              <Link
                to="/tradeflow"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/tradeflow"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                TradeFlow
              </Link>
              <Link
                to="/tradereflex"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/tradereflex"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                TradeReflex
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search strategies, tokens..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 placeholder-gray-400 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
              <Bell className="h-5 w-5" />
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
              <Settings className="h-5 w-5" />
            </button>

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-green-900/30 border border-green-500/30 px-3 py-1.5 rounded-md">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-green-400">Connected</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-md">
                  <span className="text-sm font-mono text-white">{formatAddress(address || '')}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Disconnect wallet?')) {
                      onDisconnect();
                    }
                  }}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};