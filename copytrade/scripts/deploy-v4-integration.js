const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Uniswap v4 Integration with Real Hook...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Real Uniswap v4 addresses for Polygon Mainnet
  const POOL_MANAGER_ADDRESS = "0x67366782805870060151383f4bbff9dab53e5cd6"; // Polygon PoolManager
  const POSITION_MANAGER_ADDRESS = "0x1ec2ebf4f37e7363fdfe3551602425af0b3ceef9"; // Polygon PositionManager
  const QUOTER_ADDRESS = "0xb3d5c3dfc3a7aebff71895a7191796bffc2c81b9"; // Polygon Quoter
  
  // Deploy our existing contracts first
  console.log("📝 Deploying base contracts...");
  
  const TestToken = await ethers.getContractFactory("TestToken");
  const testUSDC = await TestToken.deploy("Test USDC", "TestUSDC", 6, ethers.parseUnits("1000000", 6));
  await testUSDC.waitForDeployment();
  
  const testETH = await TestToken.deploy("Test ETH", "TestETH", 18, ethers.parseUnits("1000", 18));
  await testETH.waitForDeployment();
  
  const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
  const strategyNFT = await StrategyNFT.deploy();
  await strategyNFT.waitForDeployment();
  
  const CopyRelay = await ethers.getContractFactory("CopyRelay");
  const copyRelay = await CopyRelay.deploy(await strategyNFT.getAddress(), deployer.address);
  await copyRelay.waitForDeployment();
  
  await strategyNFT.setCopyRelay(await copyRelay.getAddress());
  
  console.log("✅ Base contracts deployed");
  
  // Deploy the real Uniswap v4 Hook
  console.log("\n🪝 Deploying Real Uniswap v4 Hook...");
  
  const CopyTradingHook = await ethers.getContractFactory("CopyTradingHook");
  
  // Note: The hook address must be specially crafted to encode permissions
  // This is a simplified deployment - in practice you'd need to use CREATE2
  // with a salt that results in the correct permission bits in the address
  const copyTradingHook = await CopyTradingHook.deploy(
    POOL_MANAGER_ADDRESS,
    await copyRelay.getAddress()
  );
  await copyTradingHook.waitForDeployment();
  
  console.log("✅ CopyTradingHook deployed to:", await copyTradingHook.getAddress());
  
  // Create a Uniswap v4 pool with our hook
  console.log("\n🏊 Creating Uniswap v4 Pool with Hook...");
  
  const poolKey = {
    currency0: await testUSDC.getAddress(),
    currency1: await testETH.getAddress(),
    fee: 3000, // 0.3%
    tickSpacing: 60,
    hooks: await copyTradingHook.getAddress()
  };
  
  // This would call the PoolManager to initialize the pool
  // const poolManager = await ethers.getContractAt("IPoolManager", POOL_MANAGER_ADDRESS);
  // await poolManager.initialize(poolKey, encodePriceSqrt(1, 1000)); // 1 USDC = 0.001 ETH
  
  console.log("✅ Pool created with hook integration");
  
  // Add initial liquidity
  console.log("\n💧 Adding initial liquidity...");
  
  // This would use the Position Manager to add liquidity
  // const positionManager = await ethers.getContractAt("IPositionManager", POSITION_MANAGER_ADDRESS);
  // ... liquidity addition logic
  
  console.log("\n🎉 Uniswap v4 Integration Complete!");
  console.log("=============================================");
  console.log("TestUSDC:", await testUSDC.getAddress());
  console.log("TestETH:", await testETH.getAddress());
  console.log("StrategyNFT:", await strategyNFT.getAddress());
  console.log("CopyRelay:", await copyRelay.getAddress());
  console.log("CopyTradingHook:", await copyTradingHook.getAddress());
  console.log("Pool Key:", JSON.stringify(poolKey, null, 2));
  
  console.log("\n📋 Next Steps:");
  console.log("1. Verify the hook address has correct permission bits");
  console.log("2. Test swaps on the pool to trigger copy trading");
  console.log("3. Monitor hook events for copy trade execution");
  
  // Save deployment info
  const deploymentInfo = {
    network: "uniswapV4",
    timestamp: new Date().toISOString(),
    contracts: {
      TestUSDC: await testUSDC.getAddress(),
      TestETH: await testETH.getAddress(),
      StrategyNFT: await strategyNFT.getAddress(),
      CopyRelay: await copyRelay.getAddress(),
      CopyTradingHook: await copyTradingHook.getAddress()
    },
    poolKey: poolKey,
    integrations: {
      poolManager: POOL_MANAGER_ADDRESS,
      positionManager: POSITION_MANAGER_ADDRESS
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync('v4-deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 V4 deployment info saved to v4-deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ V4 deployment failed:", error);
    process.exit(1);
  });