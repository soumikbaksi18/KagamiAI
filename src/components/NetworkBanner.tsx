import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface NetworkBannerProps {
  currentChainId?: number;
  onSwitchNetwork: () => void;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ 
  currentChainId, 
  onSwitchNetwork 
}) => {
  const POLYGON_AMOY_CHAIN_ID = 80002;
  const LOCAL_HARDHAT_CHAIN_ID = 31337;
  
  if (currentChainId === POLYGON_AMOY_CHAIN_ID) {
    return (
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <p className="font-semibold text-green-800">Connected to Polygon Amoy</p>
            <p className="text-sm text-green-700">Ready for live contract interactions</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (currentChainId === LOCAL_HARDHAT_CHAIN_ID) {
    return (
      <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div>
            <p className="font-semibold text-blue-800">Connected to Local Hardhat</p>
            <p className="text-sm text-blue-700">Development mode - contracts may not be deployed</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-semibold text-orange-800">Wrong Network</p>
            <p className="text-sm text-orange-700">
              Please switch to Polygon Amoy testnet to use PookieFI
            </p>
          </div>
        </div>
        
        <button
          onClick={onSwitchNetwork}
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <span>Switch Network</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};