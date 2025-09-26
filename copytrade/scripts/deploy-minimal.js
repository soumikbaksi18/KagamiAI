const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Minimal deployment (3 contracts only)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy only the 3 core contracts
  console.log("\n📝 Deploying core contracts...");
  
  // 1. Deploy TestUSDC
  const TestToken = await ethers.getContractFactory("TestToken");
  const testUSDC = await TestToken.deploy(
    "Test USDC",
    "TestUSDC", 
    6,
    ethers.parseUnits("1000000", 6)
  );
  await testUSDC.waitForDeployment();
  console.log("✅ TestUSDC deployed to:", await testUSDC.getAddress());

  // 2. Deploy StrategyNFT
  const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
  const strategyNFT = await StrategyNFT.deploy();
  await strategyNFT.waitForDeployment();
  console.log("✅ StrategyNFT deployed to:", await strategyNFT.getAddress());

  // 3. Deploy CopyRelay
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

  console.log("\n🎉 Minimal deployment complete!");
  console.log("TestUSDC:", await testUSDC.getAddress());
  console.log("StrategyNFT:", await strategyNFT.getAddress());
  console.log("CopyRelay:", await copyRelay.getAddress());
  
  // Save info
  const deploymentInfo = {
    network: "polygonAmoy",
    TestUSDC: await testUSDC.getAddress(),
    StrategyNFT: await strategyNFT.getAddress(),
    CopyRelay: await copyRelay.getAddress()
  };
  
  const fs = require('fs');
  fs.writeFileSync('minimal-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment saved to minimal-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });