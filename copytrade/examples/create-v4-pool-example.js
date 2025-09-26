const { ethers } = require("hardhat");

/**
 * Example: How to create a Uniswap v4 pool with our copy trading hook
 * This shows the exact steps to use the real Uniswap v4 addresses
 */
async function createPoolExample() {
  console.log("🏊 Creating Uniswap v4 Pool with Copy Trading Hook\n");

  // REAL Uniswap v4 addresses (example for Polygon mainnet)
  const POOL_MANAGER = "0x67366782805870060151383f4bbff9dab53e5cd6";
  const POSITION_MANAGER = "0x1ec2ebf4f37e7363fdfe3551602425af0b3ceef9";
  
  // Our deployed contract addresses (example)
  const COPY_TRADING_HOOK = "0x..."; // Your deployed hook address
  const TEST_USDC = "0x..."; // Your test USDC address
  const TEST_ETH = "0x..."; // Your test ETH address

  const [deployer] = await ethers.getSigners();

  // 1. Get contract instances
  const poolManager = await ethers.getContractAt("IPoolManager", POOL_MANAGER);
  const positionManager = await ethers.getContractAt("IPositionManager", POSITION_MANAGER);
  
  // 2. Create pool key
  const poolKey = {
    currency0: TEST_USDC < TEST_ETH ? TEST_USDC : TEST_ETH,
    currency1: TEST_USDC < TEST_ETH ? TEST_ETH : TEST_USDC,
    fee: 3000, // 0.3%
    tickSpacing: 60,
    hooks: COPY_TRADING_HOOK
  };

  console.log("Pool Key:", poolKey);

  // 3. Calculate initial price (1 USDC = 0.001 ETH example)
  const sqrtPriceX96 = encodePriceSqrt(1000, 1); // 1000 USDC = 1 ETH
  
  try {
    // 4. Initialize the pool
    console.log("🏊 Initializing pool...");
    const initTx = await poolManager.initialize(poolKey, sqrtPriceX96);
    await initTx.wait();
    console.log("✅ Pool initialized!");

    // 5. Add initial liquidity
    console.log("💧 Adding liquidity...");
    
    // Approve tokens
    const testUSDC = await ethers.getContractAt("IERC20", TEST_USDC);
    const testETH = await ethers.getContractAt("IERC20", TEST_ETH);
    
    await testUSDC.approve(POSITION_MANAGER, ethers.parseUnits("10000", 6));
    await testETH.approve(POSITION_MANAGER, ethers.parseUnits("10", 18));

    // Add liquidity through position manager
    const liquidityParams = {
      poolKey: poolKey,
      tickLower: -887220, // Full range example
      tickUpper: 887220,
      liquidityDelta: ethers.parseUnits("1000", 18), // 1000 units of liquidity
      salt: ethers.randomBytes(32),
      hookData: "0x"
    };

    const addLiquidityTx = await positionManager.modifyLiquidity(liquidityParams);
    await addLiquidityTx.wait();
    console.log("✅ Liquidity added!");

    console.log("\n🎉 Pool created successfully!");
    console.log("Now when strategy leaders swap on this pool:");
    console.log("1. beforeSwap hook detects the leader");
    console.log("2. afterSwap hook triggers copy trades");
    console.log("3. All followers automatically mirror the trade");

  } catch (error) {
    console.error("❌ Error creating pool:", error);
    
    // Common issues and solutions
    console.log("\n💡 Common issues:");
    console.log("1. Hook address doesn't have correct permission bits");
    console.log("2. Insufficient token approvals");
    console.log("3. Pool already exists");
    console.log("4. Invalid price range");
  }
}

/**
 * Helper function to encode sqrt price
 */
function encodePriceSqrt(reserve1, reserve0) {
  const price = reserve1 / reserve0;
  const sqrtPrice = Math.sqrt(price);
  // Convert to Q64.96 format
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * (2 ** 96)));
  return sqrtPriceX96;
}

/**
 * Example: How to swap on the pool to trigger copy trading
 */
async function swapExample() {
  console.log("💱 Testing Copy Trading with Real Swap\n");

  const POOL_MANAGER = "0x67366782805870060151383f4bbff9dab53e5cd6";
  const TEST_USDC = "0x...";
  const TEST_ETH = "0x...";
  const COPY_TRADING_HOOK = "0x...";

  const [deployer] = await ethers.getSigners();
  
  // Make sure deployer is a strategy leader
  const strategyNFT = await ethers.getContractAt("StrategyNFT", "0x...");
  const isLeader = await strategyNFT.isStrategyLeader(deployer.address);
  
  if (!isLeader) {
    console.log("❌ Not a strategy leader - create strategy first");
    return;
  }

  const poolManager = await ethers.getContractAt("IPoolManager", POOL_MANAGER);
  
  const poolKey = {
    currency0: TEST_USDC < TEST_ETH ? TEST_USDC : TEST_ETH,
    currency1: TEST_USDC < TEST_ETH ? TEST_ETH : TEST_USDC,
    fee: 3000,
    tickSpacing: 60,
    hooks: COPY_TRADING_HOOK
  };

  const swapParams = {
    zeroForOne: true, // Swapping currency0 for currency1
    amountSpecified: ethers.parseUnits("100", 6), // 100 USDC
    sqrtPriceLimitX96: 0, // No price limit
    hookData: "0x"
  };

  try {
    console.log("💱 Executing swap as strategy leader...");
    const swapTx = await poolManager.swap(poolKey, swapParams);
    await swapTx.wait();
    
    console.log("✅ Swap executed!");
    console.log("🎯 Hook should have triggered copy trades automatically");
    console.log("📊 Check events for TradeMirrored emissions");

  } catch (error) {
    console.error("❌ Swap failed:", error);
  }
}

module.exports = {
  createPoolExample,
  swapExample,
  encodePriceSqrt
};