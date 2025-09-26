const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of SocialDeFi Copy AMM contracts...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy Test Tokens
  console.log("\n📝 Deploying Test Tokens...");
  
  const TestToken = await ethers.getContractFactory("TestToken");
  
  // Deploy TestUSDC (6 decimals)
  const testUSDC = await TestToken.deploy(
    "Test USDC",
    "TestUSDC",
    6,
    ethers.parseUnits("1000000", 6) // 1M tokens
  );
  await testUSDC.waitForDeployment();
  console.log("✅ TestUSDC deployed to:", await testUSDC.getAddress());

  // Deploy TestETH (18 decimals)
  const testETH = await TestToken.deploy(
    "Test ETH",
    "TestETH",
    18,
    ethers.parseUnits("1000", 18) // 1000 tokens
  );
  await testETH.waitForDeployment();
  console.log("✅ TestETH deployed to:", await testETH.getAddress());

  // Deploy StrategyNFT
  console.log("\n🎨 Deploying StrategyNFT...");
  const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
  const strategyNFT = await StrategyNFT.deploy();
  await strategyNFT.waitForDeployment();
  console.log("✅ StrategyNFT deployed to:", await strategyNFT.getAddress());

  // Deploy CopyRelay
  console.log("\n🔄 Deploying CopyRelay...");
  const CopyRelay = await ethers.getContractFactory("CopyRelay");
  const copyRelay = await CopyRelay.deploy(
    await strategyNFT.getAddress(),
    deployer.address // Fee recipient
  );
  await copyRelay.waitForDeployment();
  console.log("✅ CopyRelay deployed to:", await copyRelay.getAddress());

  // Set CopyRelay address in StrategyNFT
  console.log("\n🔗 Linking contracts...");
  const setCopyRelayTx = await strategyNFT.setCopyRelay(await copyRelay.getAddress());
  await setCopyRelayTx.wait();
  console.log("✅ CopyRelay linked to StrategyNFT");

  // Deploy CopyHook
  console.log("\n🪝 Deploying CopyHook...");
  const CopyHook = await ethers.getContractFactory("CopyHook");
  const copyHook = await CopyHook.deploy(await copyRelay.getAddress());
  await copyHook.waitForDeployment();
  console.log("✅ CopyHook deployed to:", await copyHook.getAddress());

  // Create a sample strategy
  console.log("\n📊 Creating sample strategy...");
  const strategyTx = await strategyNFT.createStrategy(
    "DeFi Alpha Strategy",
    "High-performance DeFi trading strategy with advanced risk management",
    250, // 2.5% performance fee
    { value: 0 }
  );
  await strategyTx.wait();
  console.log("✅ Sample strategy created");

  // Mint additional tokens for testing
  console.log("\n💰 Minting additional tokens for testing...");
  
  // Mint TestUSDC to deployer
  const mintUSDC = await testUSDC.mint(deployer.address, ethers.parseUnits("100000", 6));
  await mintUSDC.wait();
  console.log("✅ Minted 100,000 TestUSDC to deployer");

  // Mint TestETH to deployer
  const mintETH = await testETH.mint(deployer.address, ethers.parseUnits("100", 18));
  await mintETH.wait();
  console.log("✅ Minted 100 TestETH to deployer");

  // Display deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("=====================");
  console.log("TestUSDC:", await testUSDC.getAddress());
  console.log("TestETH:", await testETH.getAddress());
  console.log("StrategyNFT:", await strategyNFT.getAddress());
  console.log("CopyRelay:", await copyRelay.getAddress());
  console.log("CopyHook:", await copyHook.getAddress());
  console.log("\n📋 Contract ABIs are available in artifacts/contracts/");

  // Save deployment info to file
  const deploymentInfo = {
    network: "polygonAmoy",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TestUSDC: await testUSDC.getAddress(),
      TestETH: await testETH.getAddress(),
      StrategyNFT: await strategyNFT.getAddress(),
      CopyRelay: await copyRelay.getAddress(),
      CopyHook: await copyHook.getAddress()
    },
    testTokens: {
      TestUSDC: {
        address: await testUSDC.getAddress(),
        symbol: "TestUSDC",
        decimals: 6,
        totalSupply: (await testUSDC.totalSupply()).toString()
      },
      TestETH: {
        address: await testETH.getAddress(),
        symbol: "TestETH",
        decimals: 18,
        totalSupply: (await testETH.totalSupply()).toString()
      }
    }
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info.json");

  console.log("\n🚀 Phase 1 & 2 deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Verify contracts on PolygonScan");
  console.log("2. Test the copy trading functionality");
  console.log("3. Integrate with frontend");
  console.log("4. Add 1inch integration (Phase 3)");
  console.log("5. Add x402 payments (Phase 4)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });