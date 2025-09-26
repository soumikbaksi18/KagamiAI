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
    setWalletState({
      isConnected: false,
      loading: false
    });
  };

  const switchToPolygonAmoy = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }], // Polygon Amoy testnet
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x13882',
                  chainName: 'Polygon Amoy Testnet',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding Polygon Amoy network:', addError);
          }
        }
      }
    }
  };

  return {
    ...walletState,
    connect,
    disconnect,
    switchToPolygonAmoy
  };
};

declare global {
  interface Window {
    ethereum?: any;
  }
}