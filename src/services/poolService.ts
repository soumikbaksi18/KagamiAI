import { ethers } from 'ethers';

// Pool deployment info
const POOL_DEPLOYMENT = {
  poolFactory: "0x67d269191c92Caf3cD7723F116c85e6E9bf55933",
  tokens: {
    TUSDC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    TETH: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    TUSDT: "0x851356ae760d987E095750cCeb3bC6014560891C"
  },
  pools: {
    "TUSDC/TETH": {
      address: "0xDA756c9596bB5E69165142c55AF80B908D891ffb",
      fee: "0.3%",
      token0: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      token1: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
    },
    "TUSDC/TUSDT": {
      address: "0xcA16B4430BC903fA049dC6BD212A016c220ba9de",
      fee: "0.05%",
      token0: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      token1: "0x851356ae760d987E095750cCeb3bC6014560891C"
    }
  }
};

// Simple Pool ABI
const SIMPLE_POOL_ABI = [
  "function getTotalValueLocked() external view returns (uint256)",
  "function getVolume24h() external view returns (uint256)",
  "function getVolumeChange24h() external view returns (uint256)",
  "function getAPR() external view returns (uint256)",
  "function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1)",
  "function currentPrice() external view returns (uint256)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function totalLiquidity() external view returns (uint256)"
];

// ERC20 ABI for token info
const ERC20_ABI = [
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

interface PoolData {
  id: string;
  token0: {
    symbol: string;
    name: string;
    decimals: number;
  };
  token1: {
    symbol: string;
    name: string;
    decimals: number;
  };
  feeTier: string;
  liquidity: string;
  volume24h: string;
  volumeChange24h: string;
  priceChange24h: string;
  tvl: string;
  apr: string;
}

export class PoolService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Connect to local Hardhat network
    this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
  }

  async getDemoPools(): Promise<PoolData[]> {
    try {
      console.log('🔍 Fetching real pool data from contracts...');
      
      const pools: PoolData[] = [];

      // Fetch data for TUSDC/TETH pool
      const tusdcTethPool = await this.getPoolData(
        'TUSDC/TETH',
        POOL_DEPLOYMENT.pools['TUSDC/TETH']
      );
      pools.push(tusdcTethPool);

      // Fetch data for TUSDC/TUSDT pool
      const tusdcTusdtPool = await this.getPoolData(
        'TUSDC/TUSDT',
        POOL_DEPLOYMENT.pools['TUSDC/TUSDT']
      );
      pools.push(tusdcTusdtPool);

      console.log('✅ Successfully fetched real pool data:', pools);
      return pools;

    } catch (error) {
      console.error('❌ Error fetching pool data:', error);
      
      // Fallback to mock data if contract calls fail
      return this.getFallbackDemoPools();
    }
  }

  private async getPoolData(pairName: string, poolInfo: any): Promise<PoolData> {
    // Create pool contract instance
    const poolContract = new ethers.Contract(
      poolInfo.address,
      SIMPLE_POOL_ABI,
      this.provider
    );

    // Get token contracts
    const token0Contract = new ethers.Contract(
      poolInfo.token0,
      ERC20_ABI,
      this.provider
    );
    
    const token1Contract = new ethers.Contract(
      poolInfo.token1,
      ERC20_ABI,
      this.provider
    );

    // Fetch all data in parallel
    const [
      token0Symbol,
      token0Name,
      token0Decimals,
      token1Symbol,
      token1Name,
      token1Decimals,
      tvl,
      volume24h,
      volumeChange24h,
      apr,
      reserves
    ] = await Promise.all([
      token0Contract.symbol(),
      token0Contract.name(),
      token0Contract.decimals(),
      token1Contract.symbol(),
      token1Contract.name(),
      token1Contract.decimals(),
      poolContract.getTotalValueLocked(),
      poolContract.getVolume24h(),
      poolContract.getVolumeChange24h(),
      poolContract.getAPR(),
      poolContract.getReserves()
    ]);

    // Format the data
    const tvlFormatted = this.formatLargeNumber(ethers.formatEther(tvl));
    const volumeFormatted = this.formatLargeNumber(ethers.formatEther(volume24h));
    const volumeChangeFormatted = this.formatPercentage(volumeChange24h);
    const aprFormatted = `${Number(apr)}%`;

    // Calculate a simple price change (mock for now)
    const priceChange24h = '+0.1%'; // This would need more complex calculation

    return {
      id: `real-${pairName.toLowerCase().replace('/', '-')}`,
      token0: {
        symbol: token0Symbol,
        name: token0Name,
        decimals: Number(token0Decimals)
      },
      token1: {
        symbol: token1Symbol,
        name: token1Name,
        decimals: Number(token1Decimals)
      },
      feeTier: poolInfo.fee,
      liquidity: tvlFormatted,
      volume24h: volumeFormatted,
      volumeChange24h: volumeChangeFormatted,
      priceChange24h,
      tvl: tvlFormatted,
      apr: aprFormatted
    };
  }

  private formatLargeNumber(value: string): string {
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  }

  private formatPercentage(value: bigint): string {
    // Convert from contract format to percentage
    const num = Number(value);
    if (num === 0) return '+0.0%';
    
    // Handle the case where the number might be negative (represented as large positive)
    if (num > 1000000) {
      // Simplified negative handling
      return `-${((Number.MAX_SAFE_INTEGER - num) / 100).toFixed(1)}%`;
    } else {
      return `+${(num / 100).toFixed(1)}%`;
    }
  }

  private getFallbackDemoPools(): PoolData[] {
    console.log('📦 Using fallback demo data');
    
    return [
      {
        id: 'demo-tusdc-tusdt',
        token0: { symbol: 'TUSDC', name: 'Test USDC', decimals: 6 },
        token1: { symbol: 'TUSDT', name: 'Test USDT', decimals: 6 },
        feeTier: '0.05%',
        liquidity: '$1,000,000',
        volume24h: '$500,000',
        volumeChange24h: '+15.2%',
        priceChange24h: '+0.1%',
        tvl: '$1,000,000',
        apr: '12.5%'
      },
      {
        id: 'demo-tusdc-teth',
        token0: { symbol: 'TUSDC', name: 'Test USDC', decimals: 6 },
        token1: { symbol: 'TETH', name: 'Test ETH', decimals: 18 },
        feeTier: '0.3%',
        liquidity: '$2,500,000',
        volume24h: '$1,200,000',
        volumeChange24h: '+8.7%',
        priceChange24h: '+2.5%',
        tvl: '$2,500,000',
        apr: '18.3%'
      }
    ];
  }
}

export const poolService = new PoolService();