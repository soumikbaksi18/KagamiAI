const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Final deployment - just CopyRelay and linking...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "MATIC");

  // Use all existing contracts
  const existingTestUSDC = "0x12B0da97B6bf7ACb88Aa75F6BFde9E6a77e0fB08";
  const existingTestETH = "0x42abC15D8e1cEFFCac3CAf75e7cB8DF1d23d8b88";
  const existingStrategyNFT = "0xe3d2BFdc37Dc8c759ec5Deb2D45f99E2708C9175";
  
  console.log("Using existing contracts:");
  console.log("├── TestUSDC:", existingTestUSDC);
  console.log("├── TestETH:", existingTestETH);
  console.log("└── StrategyNFT:", existingStrategyNFT);

  // Deploy only CopyRelay
  console.log("\n🔄 Deploying CopyRelay...");
  const CopyRelay = await ethers.getContractFactory("CopyRelay");
  const copyRelay = await CopyRelay.deploy(
    existingStrategyNFT,
    deployer.address
  );
  await copyRelay.waitForDeployment();
  console.log("✅ CopyRelay deployed to:", await copyRelay.getAddress());

  // Link contracts
  console.log("\n🔗 Linking contracts...");
  const strategyNFT = await ethers.getContractAt("StrategyNFT", existingStrategyNFT);
  const linkTx = await strategyNFT.setCopyRelay(await copyRelay.getAddress());
  await linkTx.wait();
  console.log("✅ Contracts linked!");

  console.log("\n🎉 DEPLOYMENT COMPLETE! 🎉");
  console.log("===============================");
  console.log("Your SocialDeFi Copy AMM is now LIVE on Polygon Amoy!");
  console.log("");
  console.log("📋 Contract Addresses:");
  console.log("├── TestUSDC:", existingTestUSDC);
  console.log("├── TestETH:", existingTestETH);
  console.log("├── StrategyNFT:", existingStrategyNFT);
  console.log("└── CopyRelay:", await copyRelay.getAddress());
  console.log("");
  console.log("🔗 View on PolygonScan:");
  console.log("├── TestUSDC: https://amoy.polygonscan.com/address/" + existingTestUSDC);
  console.log("├── TestETH: https://amoy.polygonscan.com/address/" + existingTestETH);
  console.log("├── StrategyNFT: https://amoy.polygonscan.com/address/" + existingStrategyNFT);
  console.log("└── CopyRelay: https://amoy.polygonscan.com/address/" + await copyRelay.getAddress());

  // Save complete deployment info
  const deploymentInfo = {
    network: "polygonAmoy",
    chainId: 80002,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    status: "COMPLETE",
    contracts: {
      TestUSDC: existingTestUSDC,
      TestETH: existingTestETH,
      StrategyNFT: existingStrategyNFT,
      CopyRelay: await copyRelay.getAddress()
    },
    verification: {
      polygonscan: "https://amoy.polygonscan.com/",
      contracts: {
        testUSDC: `https://amoy.polygonscan.com/address/${existingTestUSDC}`,
        testETH: `https://amoy.polygonscan.com/address/${existingTestETH}`,
        strategyNFT: `https://amoy.polygonscan.com/address/${existingStrategyNFT}`,
        copyRelay: `https://amoy.polygonscan.com/address/${await copyRelay.getAddress()}`
      }
    },
    nextSteps: [
      "Verify contracts on PolygonScan",
      "Create strategies using StrategyNFT",
      "Test copy trading functionality",
      "Integrate with frontend",
      "Add Uniswap v4 hooks (Phase 3)"
    ]
  };
  
  const fs = require('fs');
  fs.writeFileSync('final-amoy-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Complete deployment info saved to final-amoy-deployment.json");
  
  console.log("\n🚀 What's Next:");
  console.log("1. Verify your contracts on PolygonScan");
  console.log("2. Create your first strategy");
  console.log("3. Test the copy trading functionality");
  console.log("4. Build your frontend");
  console.log("5. Implement Uniswap v4 hooks (Phase 3)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Final deployment failed:", error);
    process.exit(1);
  });