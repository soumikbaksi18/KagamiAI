const { ethers } = require("hardhat");

async function main() {
  console.log("Redeploying modified StrategyNFT contract...");

  // Get the contract factory
  const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
  
  // Deploy the modified contract
  const strategyNFT = await StrategyNFT.deploy();
  
  // Wait for deployment to complete
  await strategyNFT.waitForDeployment();
  
  const address = await strategyNFT.getAddress();
  
  console.log("Modified StrategyNFT deployed to:", address);
  
  // Get the CopyRelay address from existing deployment
  const copyRelayAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  // Set the CopyRelay address
  console.log("Setting CopyRelay address...");
  await strategyNFT.setCopyRelay(copyRelayAddress);
  console.log("CopyRelay address set to:", copyRelayAddress);
  
  // Test creating multiple strategies
  console.log("Testing multiple strategy creation...");
  
  // Create first strategy
  const tx1 = await strategyNFT.createStrategy(
    "Test Strategy 1",
    "First test strategy",
    250 // 2.5% fee
  );
  await tx1.wait();
  console.log("✅ First strategy created successfully!");
  
  // Create second strategy (this should work now)
  const tx2 = await strategyNFT.createStrategy(
    "Test Strategy 2", 
    "Second test strategy",
    300 // 3% fee
  );
  await tx2.wait();
  console.log("✅ Second strategy created successfully!");
  
  // Create third strategy
  const tx3 = await strategyNFT.createStrategy(
    "Test Strategy 3",
    "Third test strategy", 
    200 // 2% fee
  );
  await tx3.wait();
  console.log("✅ Third strategy created successfully!");
  
  // Get total strategies
  const totalStrategies = await strategyNFT.totalStrategies();
  console.log("Total strategies created:", totalStrategies.toString());
  
  console.log("\n=== Deployment Summary ===");
  console.log("Modified StrategyNFT Address:", address);
  console.log("CopyRelay Address:", copyRelayAddress);
  console.log("Total Strategies:", totalStrategies.toString());
  console.log("\n✅ Multiple strategies now supported!");
  console.log("Update your frontend contract address to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });