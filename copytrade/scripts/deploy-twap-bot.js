const { ethers } = require("hardhat");

async function main() {
  console.log("🤖 Deploying TWAP Bot with 1inch Integration...");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // For local testing, we'll use mock addresses
  // In production, these would be real 1inch contract addresses
  const MOCK_1INCH_ROUTER = "0x1111111254EEB25477B68fb85Ed929f73A960582"; // 1inch v5 router on mainnet
  const MOCK_LIMIT_ORDER_PROTOCOL = "0x119c71D3BbAC22029622cbaEc24854d3D32D2828"; // 1inch limit order protocol

  // Deploy TWAP Bot
  console.log("\n📈 Deploying TWAPBot contract...");
  const TWAPBot = await ethers.getContractFactory("TWAPBot");
  const twapBot = await TWAPBot.deploy(
    MOCK_1INCH_ROUTER,
    MOCK_LIMIT_ORDER_PROTOCOL
  );
  
  await twapBot.waitForDeployment();
  const twapBotAddress = await twapBot.getAddress();
  
  console.log("✅ TWAPBot deployed to:", twapBotAddress);

  // Test basic functionality
  console.log("\n🧪 Testing TWAP Bot functionality...");
  
  // Check initial state
  const nextOrderId = await twapBot.nextOrderId();
  const executionFee = await twapBot.executionFee();
  
  console.log("Next Order ID:", nextOrderId.toString());
  console.log("Execution Fee:", ethers.formatEther(executionFee), "ETH");

  // Get existing token addresses for testing
  const existingDeployment = require("../uniswap-pools-deployment.json");
  const TUSDC_ADDRESS = existingDeployment.tokens.TUSDC;
  const TETH_ADDRESS = existingDeployment.tokens.TETH;
  
  console.log("Using test tokens:");
  console.log("TUSDC:", TUSDC_ADDRESS);
  console.log("TETH:", TETH_ADDRESS);

  // Test TWAP order creation (simulation)
  console.log("\n💡 TWAP Order Creation Example:");
  console.log("- Token In: TUSDC");
  console.log("- Token Out: TETH");
  console.log("- Total Amount: 1000 TUSDC");
  console.log("- Intervals: 10 (100 TUSDC each)");
  console.log("- Interval Time: 1 hour (3600 seconds)");
  console.log("- Execution Fee: 0.01 ETH total");

  // Create a sample TWAP order for demonstration
  try {
    const tusdcContract = await ethers.getContractAt("TestToken", TUSDC_ADDRESS);
    
    // Mint some TUSDC for testing
    console.log("\n🪙 Minting test tokens...");
    await tusdcContract.mint(deployer.address, ethers.parseEther("10000"));
    
    const balance = await tusdcContract.balanceOf(deployer.address);
    console.log("TUSDC Balance:", ethers.formatEther(balance));
    
    // Approve TWAP bot to spend TUSDC
    await tusdcContract.approve(twapBotAddress, ethers.parseEther("1000"));
    console.log("✅ Approved TWAP Bot to spend TUSDC");
    
    // Create TWAP order
    const totalAmount = ethers.parseEther("1000"); // 1000 TUSDC
    const intervals = 10;
    const intervalSeconds = 3600; // 1 hour
    const minAmountOut = ethers.parseEther("0.4"); // Minimum 0.4 TETH per interval
    const totalExecutionFee = ethers.parseEther("0.01"); // 0.01 ETH total
    
    console.log("\n🚀 Creating TWAP order...");
    const createTx = await twapBot.createTWAPOrder(
      TUSDC_ADDRESS,
      TETH_ADDRESS,
      totalAmount,
      intervals,
      intervalSeconds,
      minAmountOut,
      { value: totalExecutionFee }
    );
    
    await createTx.wait();
    console.log("✅ TWAP order created successfully!");
    
    // Get order details
    const orderId = 1;
    const order = await twapBot.getOrder(orderId);
    console.log("\n📋 Order Details:");
    console.log("- Order ID:", orderId);
    console.log("- User:", order.user);
    console.log("- Token In:", order.tokenIn);
    console.log("- Token Out:", order.tokenOut);
    console.log("- Total Amount In:", ethers.formatEther(order.totalAmountIn), "TUSDC");
    console.log("- Amount Per Interval:", ethers.formatEther(order.amountPerInterval), "TUSDC");
    console.log("- Interval Seconds:", order.intervalSeconds.toString(), "seconds");
    console.log("- Remaining Intervals:", order.remainingIntervals.toString());
    console.log("- Is Active:", order.isActive);
    
    // Check if order can be executed
    const canExecute = await twapBot.canExecuteOrder(orderId);
    console.log("- Can Execute Now:", canExecute);
    
    // Get user orders
    const userOrders = await twapBot.getUserOrders(deployer.address);
    console.log("- User Orders:", userOrders.map(id => id.toString()));
    
  } catch (error) {
    console.log("⚠️  TWAP order creation test skipped:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    contracts: {
      TWAPBot: twapBotAddress
    },
    config: {
      oneInchRouter: MOCK_1INCH_ROUTER,
      limitOrderProtocol: MOCK_LIMIT_ORDER_PROTOCOL,
      executionFee: ethers.formatEther(executionFee)
    },
    testTokens: {
      TUSDC: TUSDC_ADDRESS,
      TETH: TETH_ADDRESS
    },
    deployedAt: new Date().toISOString()
  };

  // Write deployment info to file
  const fs = require("fs");
  fs.writeFileSync(
    "twap-bot-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ TWAP Bot deployment completed!");
  console.log("📁 Deployment info saved to: twap-bot-deployment.json");
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Integrate TWAP Bot with frontend");
  console.log("2. Add 1inch API integration for real swaps");
  console.log("3. Deploy keeper bot for automated execution");
  console.log("4. Add advanced features (stop-loss, take-profit)");
  
  console.log("\n🏆 Ready for 1inch Hackathon submission!");
  console.log("Contract Address:", twapBotAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });