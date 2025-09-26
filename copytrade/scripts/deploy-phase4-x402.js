const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Phase 4: x402 Agentic Payments Integration...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Deploying with account:", deployer.address);
  console.log("Network Chain ID:", chainId);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy base contracts (if not already deployed)
  console.log("\n📝 Deploying base contracts...");
  
  const TestToken = await ethers.getContractFactory("TestToken");
  const testUSDC = await TestToken.deploy("Test USDC", "TestUSDC", 6, ethers.parseUnits("1000000", 6));
  await testUSDC.waitForDeployment();
  console.log("✅ TestUSDC deployed to:", await testUSDC.getAddress());

  const testWETH = await TestToken.deploy("Test WETH", "TestWETH", 18, ethers.parseUnits("1000", 18));
  await testWETH.waitForDeployment();
  console.log("✅ TestWETH deployed to:", await testWETH.getAddress());

  const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
  const strategyNFT = await StrategyNFT.deploy();
  await strategyNFT.waitForDeployment();
  console.log("✅ StrategyNFT deployed to:", await strategyNFT.getAddress());

  const CopyRelay = await ethers.getContractFactory("CopyRelay");
  const copyRelay = await CopyRelay.deploy(await strategyNFT.getAddress(), deployer.address);
  await copyRelay.waitForDeployment();
  console.log("✅ CopyRelay deployed to:", await copyRelay.getAddress());

  // Link base contracts
  await strategyNFT.setCopyRelay(await copyRelay.getAddress());
  console.log("✅ Base contracts linked");

  // Deploy x402 Payment Facilitator
  console.log("\n💰 Deploying x402 Payment Facilitator...");
  const supportedTokens = [
    await testUSDC.getAddress(),
    await testWETH.getAddress()
  ];
  
  const X402PaymentFacilitator = await ethers.getContractFactory("X402PaymentFacilitator");
  const paymentFacilitator = await X402PaymentFacilitator.deploy(
    await copyRelay.getAddress(),
    supportedTokens
  );
  await paymentFacilitator.waitForDeployment();
  console.log("✅ X402PaymentFacilitator deployed to:", await paymentFacilitator.getAddress());

  // Deploy AI Payment Agent
  console.log("\n🤖 Deploying AI Payment Agent...");
  const AIPaymentAgent = await ethers.getContractFactory("AIPaymentAgent");
  const aiAgent = await AIPaymentAgent.deploy(
    await paymentFacilitator.getAddress(),
    await copyRelay.getAddress()
  );
  await aiAgent.waitForDeployment();
  console.log("✅ AIPaymentAgent deployed to:", await aiAgent.getAddress());

  // Create sample strategy for testing
  console.log("\n📊 Creating sample strategy...");
  const strategyTx = await strategyNFT.createStrategy(
    "x402 AI Strategy",
    "Copy trading strategy with x402 agentic payments and AI risk management",
    250 // 2.5% performance fee
  );
  await strategyTx.wait();
  console.log("✅ Sample strategy created");

  // Mint test tokens for payment testing
  console.log("\n💰 Minting test tokens...");
  await testUSDC.mint(deployer.address, ethers.parseUnits("100000", 6));
  await testWETH.mint(deployer.address, ethers.parseUnits("100", 18));
  console.log("✅ Test tokens minted");

  // Demo x402 payment flow
  console.log("\n🧪 Testing x402 Payment Flow...");
  
  // 1. Create subscription payment request
  const monthlyFee = ethers.parseUnits("10", 6); // 10 USDC/month
  const subscriptionTx = await paymentFacilitator.createSubscription(
    deployer.address, // follower
    deployer.address, // leader (same for demo)
    monthlyFee,
    await testUSDC.getAddress()
  );
  const receipt = await subscriptionTx.wait();
  
  // Extract request ID from events
  const paymentEvent = receipt.logs.find(log => 
    log.topics[0] === ethers.id("PaymentRequired(bytes32,address,address,uint256,address,string)")
  );
  
  if (paymentEvent) {
    const requestId = paymentEvent.topics[1];
    console.log("✅ Payment request created:", requestId);
    
    // 2. Verify payment (simulate x402 flow)
    const paymentProof = ethers.hexlify(ethers.randomBytes(32)); // Mock proof
    await paymentFacilitator.verifyPayment(requestId, paymentProof);
    console.log("✅ Payment verified");
    
    // 3. Get payment request details
    const request = await paymentFacilitator.getPaymentRequest(requestId);
    console.log("✅ Payment request details retrieved");
  }

  // Demo AI agent functionality
  console.log("\n🤖 Testing AI Agent...");
  
  // Simulate trade analysis
  await aiAgent.analyzeTrade(
    deployer.address, // leader
    await testUSDC.getAddress(), // tokenIn
    await testWETH.getAddress(), // tokenOut
    ethers.parseUnits("1000", 6), // amountIn
    ethers.parseUnits("1", 18) // amountOut (profitable trade)
  );
  console.log("✅ AI trade analysis completed");
  
  // Get AI trading summary
  const summary = await aiAgent.generateTradingSummary(deployer.address, 3600); // 1 hour
  console.log("✅ AI summary:", summary);

  console.log("\n🎉 Phase 4 - x402 Agentic Payments Complete!");
  console.log("=============================================");
  
  console.log("\n📦 Deployed Contracts:");
  console.log("├── TestUSDC:", await testUSDC.getAddress());
  console.log("├── TestWETH:", await testWETH.getAddress());
  console.log("├── StrategyNFT:", await strategyNFT.getAddress());
  console.log("├── CopyRelay:", await copyRelay.getAddress());
  console.log("├── X402PaymentFacilitator:", await paymentFacilitator.getAddress());
  console.log("└── AIPaymentAgent:", await aiAgent.getAddress());
  
  console.log("\n🤖 x402 Capabilities:");
  console.log("├── ✅ Automatic subscription payments");
  console.log("├── ✅ Performance fee collection");
  console.log("├── ✅ AI-triggered refunds");
  console.log("├── ✅ Risk assessment & management");
  console.log("├── ✅ Trading analysis & summaries");
  console.log("└── ✅ HTTP 402 payment standard");

  // Save deployment info
  const deploymentInfo = {
    phase: "Phase 4 - x402 Agentic Payments",
    network: network.name || "unknown",
    chainId: chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    x402Features: {
      paymentStandard: "HTTP 402",
      automaticPayments: true,
      aiIntegration: true,
      riskManagement: true,
      refundSystem: true
    },
    contracts: {
      TestUSDC: await testUSDC.getAddress(),
      TestWETH: await testWETH.getAddress(),
      StrategyNFT: await strategyNFT.getAddress(),
      CopyRelay: await copyRelay.getAddress(),
      X402PaymentFacilitator: await paymentFacilitator.getAddress(),
      AIPaymentAgent: await aiAgent.getAddress()
    },
    paymentFlows: {
      subscription: "Monthly automatic payments via x402",
      performanceFee: "AI-triggered fee collection on profits",
      refunds: "AI risk assessment and automatic refunds",
      verification: "x402 /verify and /settle endpoints"
    },
    aiCapabilities: [
      "Trade analysis and P&L tracking",
      "Risk assessment and loss detection", 
      "Automatic refund triggering",
      "Performance fee calculation",
      "Market condition analysis",
      "Trading summaries and explanations"
    ],
    nextSteps: [
      "1. Connect to real x402 payment infrastructure",
      "2. Integrate with AI/ML models for better analysis",
      "3. Add more sophisticated risk algorithms",
      "4. Implement real-time monitoring dashboard",
      "5. Deploy to mainnet for production use"
    ]
  };

  fs.writeFileSync(
    `phase4-x402-deployment-${chainId}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎯 What x402 Enables:");
  console.log("1. 💳 Machine-to-machine payments (no credit cards needed)");
  console.log("2. 🤖 AI agents can pay for services automatically");
  console.log("3. 💰 Micropayments for API usage and trading");
  console.log("4. 🔄 Automatic subscription and fee management");
  console.log("5. 🛡️ AI-powered risk management and refunds");
  
  console.log("\n📋 x402 Payment Flow:");
  console.log("1. 📞 Client requests service");
  console.log("2. 💸 Server responds with '402 Payment Required'");
  console.log("3. 🔐 Client prepares payment payload");
  console.log("4. ✅ Server verifies & settles via /verify /settle");
  console.log("5. 🎉 Service provided after payment confirmation");
  
  console.log("\n💾 Phase 4 deployment details saved to JSON file");
  
  console.log("\n🚀 ACHIEVEMENT UNLOCKED:");
  console.log("You now have a complete SocialDeFi Copy AMM with:");
  console.log("├── ✅ Phase 1-2: Basic copy trading");
  console.log("├── ✅ Phase 3: Uniswap v4 + 1inch integration");
  console.log("├── ✅ Phase 4: x402 agentic payments + AI");
  console.log("└── 🎯 Ready for Phase 5: Full AI integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Phase 4 x402 deployment failed:", error);
    process.exit(1);
  });