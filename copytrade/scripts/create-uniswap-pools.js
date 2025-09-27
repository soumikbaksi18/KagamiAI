const { ethers } = require("hardhat");

// Uniswap v3 Core contract addresses (these are standard addresses)
const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Fee tiers
const FEE_LOW = 500;    // 0.05%
const FEE_MEDIUM = 3000; // 0.3%
const FEE_HIGH = 10000;  // 1%

async function main() {
  console.log("🦄 Creating Uniswap v3 Pools for Demo Tokens...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // Get our test tokens
    console.log("\n📋 Getting test token contracts...");
    
    // Get deployed token addresses from your existing deployment
    const testUSDC = await ethers.getContractAt("TestToken", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
    const testETH = await ethers.getContractAt("TestToken", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
    
    console.log("TUSDC Address:", await testUSDC.getAddress());
    console.log("TETH Address:", await testETH.getAddress());
    
    // For local development, we'll deploy our own simple pool factory
    console.log("\n🏭 Deploying Simple Pool Factory...");
    
    const SimplePoolFactory = await ethers.getContractFactory("SimplePoolFactory");
    const poolFactory = await SimplePoolFactory.deploy();
    await poolFactory.waitForDeployment();
    
    const factoryAddress = await poolFactory.getAddress();
    console.log("Simple Pool Factory deployed to:", factoryAddress);

    // Create TUSDC/TUSDT pool (we'll use TUSDC/TETH as TUSDT equivalent for demo)
    console.log("\n💧 Creating TUSDC/TETH Pool...");
    
    const tusdcAddress = await testUSDC.getAddress();
    const tethAddress = await testETH.getAddress();
    
    // Create pool with 0.3% fee
    const tx1 = await poolFactory.createPool(
      tusdcAddress,
      tethAddress,
      FEE_MEDIUM,
      "2000000000000000000000" // Initial price: 1 ETH = 2000 USDC
    );
    await tx1.wait();
    
    const poolAddress1 = await poolFactory.getPool(tusdcAddress, tethAddress, FEE_MEDIUM);
    console.log("TUSDC/TETH Pool created at:", poolAddress1);

    // Add liquidity to the pool
    console.log("\n💰 Adding liquidity to pools...");
    
    // Mint tokens for liquidity
    const liquidityAmount = ethers.parseEther("1000000"); // 1M tokens
    await testUSDC.mint(deployer.address, liquidityAmount);
    await testETH.mint(deployer.address, liquidityAmount);
    
    console.log("Minted tokens for liquidity provision");
    
    // Approve pool to spend tokens
    await testUSDC.approve(poolAddress1, liquidityAmount);
    await testETH.approve(poolAddress1, liquidityAmount);
    
    console.log("Approved tokens for pool");
    
    // Add liquidity
    const pool1 = await ethers.getContractAt("SimplePool", poolAddress1);
    
    const addLiquidityTx = await pool1.addLiquidity(
      ethers.parseEther("100000"), // 100K TUSDC
      ethers.parseEther("50"),      // 50 TETH (2000 USDC per ETH)
      deployer.address
    );
    await addLiquidityTx.wait();
    
    console.log("✅ Added liquidity to TUSDC/TETH pool");

    // Create a second pool for variety (TUSDC/TUSDT simulation)
    console.log("\n💧 Creating second pool for demo...");
    
    // Deploy a TUSDT token for the second pool
    const TestToken = await ethers.getContractFactory("TestToken");
    const testUSDT = await TestToken.deploy("Test USDT", "TUSDT", 6, 1000000); // 1M initial supply
    await testUSDT.waitForDeployment();
    
    const tusdtAddress = await testUSDT.getAddress();
    console.log("TUSDT deployed to:", tusdtAddress);
    
    // Create TUSDC/TUSDT pool
    const tx2 = await poolFactory.createPool(
      tusdcAddress,
      tusdtAddress,
      FEE_LOW, // 0.05% fee for stablecoin pair
      "1000000000000000000" // 1:1 price for stablecoins
    );
    await tx2.wait();
    
    const poolAddress2 = await poolFactory.getPool(tusdcAddress, tusdtAddress, FEE_LOW);
    console.log("TUSDC/TUSDT Pool created at:", poolAddress2);
    
    // Add liquidity to TUSDC/TUSDT pool
    await testUSDT.mint(deployer.address, liquidityAmount);
    await testUSDC.approve(poolAddress2, liquidityAmount);
    await testUSDT.approve(poolAddress2, liquidityAmount);
    
    const pool2 = await ethers.getContractAt("SimplePool", poolAddress2);
    await pool2.addLiquidity(
      ethers.parseEther("50000"), // 50K TUSDC
      ethers.parseEther("50000"), // 50K TUSDT
      deployer.address
    );
    
    console.log("✅ Added liquidity to TUSDC/TUSDT pool");

    // Generate some trading volume for realistic data
    console.log("\n📈 Generating trading volume...");
    
    // Make some swaps to generate volume
    for (let i = 0; i < 5; i++) {
      const swapAmount = ethers.parseEther("1000");
      
      // Approve for swaps
      await testUSDC.approve(poolAddress1, swapAmount);
      await pool1.swap(tusdcAddress, swapAmount, deployer.address);
      
      console.log(`Swap ${i + 1} completed`);
      
      // Wait a bit between swaps
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("\n🎉 Pool Creation Summary:");
    console.log("========================");
    console.log("Pool Factory:", factoryAddress);
    console.log("TUSDC Token:", tusdcAddress);
    console.log("TETH Token:", tethAddress);
    console.log("TUSDT Token:", tusdtAddress);
    console.log("TUSDC/TETH Pool:", poolAddress1);
    console.log("TUSDC/TUSDT Pool:", poolAddress2);
    
    // Save deployment info
    const deploymentInfo = {
      poolFactory: factoryAddress,
      tokens: {
        TUSDC: tusdcAddress,
        TETH: tethAddress,
        TUSDT: tusdtAddress
      },
      pools: {
        "TUSDC/TETH": {
          address: poolAddress1,
          fee: "0.3%",
          token0: tusdcAddress,
          token1: tethAddress
        },
        "TUSDC/TUSDT": {
          address: poolAddress2,
          fee: "0.05%",
          token0: tusdcAddress,
          token1: tusdtAddress
        }
      }
    };
    
    // Write to file
    const fs = require('fs');
    fs.writeFileSync(
      './uniswap-pools-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Deployment info saved to uniswap-pools-deployment.json");
    console.log("✅ Demo pools are ready for real on-chain data!");

  } catch (error) {
    console.error("❌ Error creating pools:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });