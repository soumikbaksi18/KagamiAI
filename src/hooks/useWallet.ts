import { useState, useEffect } from 'react';

export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  loading: boolean;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    loading: true
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ 
            method: 'eth_chainId' 
          });
          
          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            loading: false
          });
        } else {
          setWalletState({
            isConnected: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setWalletState({
          isConnected: false,
          loading: false
        });
      }
    } else {
      setWalletState({
        isConnected: false,
        loading: false
      });
    }
  };

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setWalletState(prev => ({ ...prev, loading: true }));
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });
        
        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          loading: false
        });
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setWalletState({
          isConnected: false,
          loading: false
        });
      }
    } else {
      alert('Please install MetaMask or another Ethereum wallet');
    }
  };

  const disconnect = async () => {
    try {
      // Clear local state
      setWalletState({
        isConnected: false,
        loading: false
      });
      
      // Clear any cached permissions (this helps reset the connection state)
      if (typeof window.ethereum !== 'undefined' && window.ethereum.request) {
        try {
          // Request to disconnect (not all wallets support this)
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          });
        } catch (error) {
          // Fallback: Many wallets don't support revokePermissions
          console.log('Wallet disconnect requested - please manually disconnect in MetaMask if needed');
        }
      }
      
      // Reload the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Error during disconnect:', error);
      // Still update local state even if wallet disconnect fails
      setWalletState({
        isConnected: false,
        loading: false
      });
    }
  };

  const switchToLocalHardhat = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // First try to add the network
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7A69', // 31337 in hex
              chainName: 'Local Hardhat Network',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://localhost:8545'],
              blockExplorerUrls: null, // Set to null for local networks
            },
          ],
        });
        
        // Then switch to it
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }],
        });
        
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected the request
          alert('Please manually add the Local Hardhat network to MetaMask:\n\nNetwork Name: Local Hardhat\nRPC URL: http://localhost:8545\nChain ID: 31337\nCurrency: ETH');
        } else if (error.code === -32002) {
          // Request already pending
          alert('Please check MetaMask - there may be a pending request to add the network.');
        } else {
          console.error('Error with network setup:', error);
          alert('Network setup failed. Please add the network manually in MetaMask.');
        }
      }
    }
  };

  return {
    ...walletState,
    connect,
    disconnect,
    switchToLocalHardhat
  };
};

declare global {
  interface Window {
    ethereum?: any;
  }
}