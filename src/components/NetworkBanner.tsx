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
  const LOCAL_HARDHAT_CHAIN_ID = 31337;
  
  // Convert to number for comparison (handles BigInt case)
  const chainIdNumber = currentChainId ? Number(currentChainId) : 0;
  
  if (chainIdNumber === LOCAL_HARDHAT_CHAIN_ID) {
    return (
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-2 bg-green-400 rounded-full"></div>
          <div>
            <p className="font-normal text-green-400">Connected to Local Hardhat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <div>
            <p className="font-semibold text-orange-400">Wrong Network</p>
            <p className="text-sm text-orange-300">
              Please switch to Local Hardhat network to use PookieFI (contracts deployed there)
            </p>
          </div>
        </div>
        
        <button
          onClick={onSwitchNetwork}
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <span>Switch to Hardhat</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};