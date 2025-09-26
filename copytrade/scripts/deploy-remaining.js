const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying remaining contracts only...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "MATIC");

  // Use existing TestUSDC and TestETH from previous deployments
  const existingTestUSDC = "0x12B0da97B6bf7ACb88Aa75F6BFde9E6a77e0fB08";
  const existingTestETH = "0x42abC15D8e1cEFFCac3CAf75e7cB8DF1d23d8b88";
  
  console.log("Using existing TestUSDC:", existingTestUSDC);
  console.log("Using existing TestETH:", existingTestETH);

  // Deploy only what we need: StrategyNFT and CopyRelay
  console.log("\n🎨 Deploying StrategyNFT...");
  const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
  const strategyNFT = await StrategyNFT.deploy();
  await strategyNFT.waitForDeployment();
  console.log("✅ StrategyNFT deployed to:", await strategyNFT.getAddress());

  console.log("\n🔄 Deploying CopyRelay...");
  const CopyRelay = await ethers.getContractFactory("CopyRelay");
  const copyRelay = await CopyRelay.deploy(
    await strategyNFT.getAddress(),
    deployer.address
  );
  await copyRelay.waitForDeployment();
  console.log("✅ CopyRelay deployed to:", await copyRelay.getAddress());

  console.log("\n🔗 Linking contracts...");
  const linkTx = await strategyNFT.setCopyRelay(await copyRelay.getAddress());
  await linkTx.wait();
  console.log("✅ Contracts linked!");

  console.log("\n🎉 Deployment Complete!");
  console.log("=================================");
  console.log("TestUSDC:", existingTestUSDC);
  console.log("TestETH:", existingTestETH);
  console.log("StrategyNFT:", await strategyNFT.getAddress());
  console.log("CopyRelay:", await copyRelay.getAddress());

  // Save complete deployment info
  const deploymentInfo = {
    network: "polygonAmoy",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TestUSDC: existingTestUSDC,
      TestETH: existingTestETH,
      StrategyNFT: await strategyNFT.getAddress(),
      CopyRelay: await copyRelay.getAddress()
    },
    verification: {
      polygonscan: "https://amoy.polygonscan.com/",
      testUSDC: `https://amoy.polygonscan.com/address/${existingTestUSDC}`,
      testETH: `https://amoy.polygonscan.com/address/${existingTestETH}`,
      strategyNFT: `https://amoy.polygonscan.com/address/${await strategyNFT.getAddress()}`,
      copyRelay: `https://amoy.polygonscan.com/address/${await copyRelay.getAddress()}`
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync('amoy-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Full deployment info saved to amoy-deployment.json");
  
  console.log("\n🔗 Verify your contracts at:");
  console.log("https://amoy.polygonscan.com/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });