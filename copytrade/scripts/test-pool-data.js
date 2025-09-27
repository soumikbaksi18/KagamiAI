const { ethers } = require("hardhat");

const POOL_ADDRESSES = {
  'TUSDC/TETH': '0xDA756c9596bB5E69165142c55AF80B908D891ffb',
  'TUSDC/TUSDT': '0xcA16B4430BC903fA049dC6BD212A016c220ba9de'
};

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

async function main() {
  console.log("🔍 Testing Pool Data Retrieval...");
  
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  for (const [pairName, poolAddress] of Object.entries(POOL_ADDRESSES)) {
    console.log(`\n📊 Testing ${pairName} Pool (${poolAddress}):`);
    
    try {
      const poolContract = new ethers.Contract(poolAddress, SIMPLE_POOL_ABI, provider);
      
      // Test all the data calls
      const [
        tvl,
        volume24h,
        volumeChange24h,
        apr,
        reserves,
        currentPrice,
        token0,
        token1,
        fee,
        totalLiquidity
      ] = await Promise.all([
        poolContract.getTotalValueLocked(),
        poolContract.getVolume24h(),
        poolContract.getVolumeChange24h(),
        poolContract.getAPR(),
        poolContract.getReserves(),
        poolContract.currentPrice(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.totalLiquidity()
      ]);
      
      console.log(`  ✅ TVL: ${ethers.formatEther(tvl)} ETH`);
      console.log(`  ✅ Volume 24h: ${ethers.formatEther(volume24h)} ETH`);
      console.log(`  ✅ Volume Change: ${volumeChange24h}%`);
      console.log(`  ✅ APR: ${apr}%`);
      console.log(`  ✅ Current Price: ${ethers.formatEther(currentPrice)} ETH`);
      console.log(`  ✅ Reserve 0: ${ethers.formatEther(reserves[0])} tokens`);
      console.log(`  ✅ Reserve 1: ${ethers.formatEther(reserves[1])} tokens`);
      console.log(`  ✅ Total Liquidity: ${ethers.formatEther(totalLiquidity)} LP tokens`);
      console.log(`  ✅ Token 0: ${token0}`);
      console.log(`  ✅ Token 1: ${token1}`);
      console.log(`  ✅ Fee: ${fee} basis points`);
      
    } catch (error) {
      console.error(`  ❌ Error testing ${pairName}:`, error.message);
    }
  }
  
  console.log("\n🎉 Pool data test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });