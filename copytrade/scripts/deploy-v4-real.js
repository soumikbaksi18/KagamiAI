const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load Uniswap v4 addresses
const v4Addresses = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../config/uniswap-v4-addresses.json"), "utf8")
);

async function main() {
  console.log("🚀 Deploying SocialDeFi Copy AMM with REAL Uniswap v4 Integration...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Deploying with account:", deployer.address);
  console.log("Network Chain ID:", chainId);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Find the correct network configuration
  let networkConfig = null;
  let networkName = "";

  // Check mainnet networks
  for (const [name, config] of Object.entries(v4Addresses.mainnet)) {
    if (config.chainId === chainId) {
      networkConfig = config;
      networkName = name;
      break;
    }
  }

  // Check testnet networks if not found in mainnet
  if (!networkConfig) {
    for (const [name, config] of Object.entries(v4Addresses.testnet)) {
      if (config.chainId === chainId) {
        networkConfig = config;
        networkName = name;
        break;
      }
    }
  }

  if (!networkConfig) {
    console.error("❌ Unsupported network! Chain ID:", chainId);
    console.log("Supported networks:");
    console.log("Mainnet:", Object.keys(v4Addresses.mainnet));
    console.log("Testnet:", Object.keys(v4Addresses.testnet));
    process.exit(1);
  }

  console.log(`✅ Using Uniswap v4 addresses for: ${networkName}`);
  console.log("PoolManager:", networkConfig.PoolManager);
  console.log("PositionManager:", networkConfig.PositionManager);

  // Deploy base contracts
  console.log("\n📝 Deploying base contracts...");
  
  const TestToken = await ethers.getContractFactory("TestToken");
  const testUSDC = await TestToken.deploy(
    "Test USDC", 
    "TestUSDC", 
    6, 
    ethers.parseUnits("1000000", 6)
  );
  await testUSDC.waitForDeployment();
  console.log("✅ TestUSDC deployed to:", await testUSDC.getAddress());

  const testETH = await TestToken.deploy(
    "Test ETH", 
    "TestETH", 
    18, 
    ethers.parseUnits("1000", 18)
  );
  await testETH.waitForDeployment();
  console.log("✅ TestETH deployed to:", await testETH.getAddress());

  const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
  const strategyNFT = await StrategyNFT.deploy();
  await strategyNFT.waitForDeployment();
  console.log("✅ StrategyNFT deployed to:", await strategyNFT.getAddress());

  const CopyRelay = await ethers.getContractFactory("CopyRelay");
  const copyRelay = await CopyRelay.deploy(
    await strategyNFT.getAddress(),
    deployer.address
  );
  await copyRelay.waitForDeployment();
  console.log("✅ CopyRelay deployed to:", await copyRelay.getAddress());

  // Link contracts
  await strategyNFT.setCopyRelay(await copyRelay.getAddress());
  console.log("✅ Contracts linked");

  // Deploy the REAL Uniswap v4 Hook
  console.log("\n🪝 Deploying REAL Uniswap v4 Hook...");
  
  const CopyTradingHook = await ethers.getContractFactory("CopyTradingHook");
  
  // Deploy hook with real PoolManager address
  const copyTradingHook = await CopyTradingHook.deploy(
    networkConfig.PoolManager,
    await copyRelay.getAddress()
  );
  await copyTradingHook.waitForDeployment();
  
  const hookAddress = await copyTradingHook.getAddress();
  console.log("✅ CopyTradingHook deployed to:", hookAddress);

  // Verify hook permissions in address
  console.log("\n🔍 Checking hook permissions...");
  const permissions = await copyTradingHook.getHookPermissions();
  console.log("Hook permissions:", {
    beforeSwap: permissions.beforeSwap,
    afterSwap: permissions.afterSwap,
    beforeAddLiquidity: permissions.beforeAddLiquidity,
    afterAddLiquidity: permissions.afterAddLiquidity
  });

  // Create sample strategy
  console.log("\n📊 Creating sample strategy...");
  const strategyTx = await strategyNFT.createStrategy(
    "V4 Copy Strategy",
    "Real Uniswap v4 copy trading strategy with automatic execution",
    250 // 2.5% performance fee
  );
  await strategyTx.wait();
  console.log("✅ Sample strategy created");

  // Mint test tokens
  console.log("\n💰 Minting test tokens...");
  await testUSDC.mint(deployer.address, ethers.parseUnits("100000", 6));
  await testETH.mint(deployer.address, ethers.parseUnits("100", 18));
  console.log("✅ Test tokens minted");

  // Prepare pool key for Uniswap v4 pool creation
  console.log("\n🏊 Preparing pool creation...");
  
  const poolKey = {
    currency0: await testUSDC.getAddress() < await testETH.getAddress() 
      ? await testUSDC.getAddress() 
      : await testETH.getAddress(),
    currency1: await testUSDC.getAddress() < await testETH.getAddress() 
      ? await testETH.getAddress() 
      : await testUSDC.getAddress(),
    fee: 3000, // 0.3%
    tickSpacing: 60,
    hooks: hookAddress
  };

  console.log("Pool Key prepared:", poolKey);
  console.log("\n⚠️  IMPORTANT: To create the actual pool, you need to:");
  console.log(`1. Call PoolManager.initialize() with the pool key above`);
  console.log(`2. Use PositionManager to add liquidity`);
  console.log(`3. The hook will automatically detect swaps from strategy leaders`);

  // Save comprehensive deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    uniswapV4: {
      PoolManager: networkConfig.PoolManager,
      PositionManager: networkConfig.PositionManager,
      Quoter: networkConfig.Quoter,
      StateView: networkConfig.StateView
    },
    contracts: {
      TestUSDC: await testUSDC.getAddress(),
      TestETH: await testETH.getAddress(),
      StrategyNFT: await strategyNFT.getAddress(),
      CopyRelay: await copyRelay.getAddress(),
      CopyTradingHook: hookAddress
    },
    poolKey: poolKey,
    instructions: {
      createPool: `Call PoolManager.initialize(poolKey, sqrtPriceX96)`,
      addLiquidity: `Use PositionManager.modifyLiquidity()`,
      testCopyTrading: `Execute swaps through PoolManager with strategy leader address`
    }
  };

  fs.writeFileSync(
    `v4-real-deployment-${networkName}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 REAL Uniswap v4 Integration Deployed!");
  console.log("=============================================");
  console.log("Network:", networkName.toUpperCase());
  console.log("Chain ID:", chainId);
  console.log("\nDeployed Contracts:");
  console.log("├── TestUSDC:", await testUSDC.getAddress());
  console.log("├── TestETH:", await testETH.getAddress());
  console.log("├── StrategyNFT:", await strategyNFT.getAddress());
  console.log("├── CopyRelay:", await copyRelay.getAddress());
  console.log("└── CopyTradingHook:", hookAddress);
  console.log("\nUniswap v4 Contracts:");
  console.log("├── PoolManager:", networkConfig.PoolManager);
  console.log("├── PositionManager:", networkConfig.PositionManager);
  console.log("└── Quoter:", networkConfig.Quoter);

  console.log("\n📋 Next Steps:");
  console.log("1. Create Uniswap v4 pool with your hook");
  console.log("2. Add liquidity to the pool"); 
  console.log("3. Test copy trading by having strategy leaders swap");
  console.log("4. Monitor hook events for automatic copy execution");
  console.log("\n💾 Deployment details saved to JSON file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });