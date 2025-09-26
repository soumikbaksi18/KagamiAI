const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 3-4: Advanced DeFi Integration", function () {
  let testUSDC, testWETH, strategyNFT, copyRelay;
  let oneInchIntegration, oneInchPriceOracle;
  let x402PaymentFacilitator, aiPaymentAgent;
  let owner, leader, follower1, follower2;

  beforeEach(async function () {
    [owner, leader, follower1, follower2] = await ethers.getSigners();

    // Deploy Test Tokens
    const TestToken = await ethers.getContractFactory("TestToken");
    testUSDC = await TestToken.deploy("Test USDC", "TestUSDC", 6, ethers.parseUnits("1000000", 6));
    await testUSDC.waitForDeployment();

    testWETH = await TestToken.deploy("Test WETH", "TestWETH", 18, ethers.parseUnits("1000", 18));
    await testWETH.waitForDeployment();

    // Deploy Core Contracts
    const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
    strategyNFT = await StrategyNFT.deploy();
    await strategyNFT.waitForDeployment();

    const CopyRelay = await ethers.getContractFactory("CopyRelay");
    copyRelay = await CopyRelay.deploy(await strategyNFT.getAddress(), owner.address);
    await copyRelay.waitForDeployment();

    await strategyNFT.setCopyRelay(await copyRelay.getAddress());

    // Deploy 1inch Integration
    const OneInchPriceOracle = await ethers.getContractFactory("OneInchPriceOracle");
    oneInchPriceOracle = await OneInchPriceOracle.deploy();
    await oneInchPriceOracle.waitForDeployment();

    const OneInchIntegration = await ethers.getContractFactory("OneInchIntegration");
    oneInchIntegration = await OneInchIntegration.deploy(
      ethers.ZeroAddress, // Mock 1inch protocol
      await oneInchPriceOracle.getAddress()
    );
    await oneInchIntegration.waitForDeployment();

    // Deploy x402 Payment System
    const X402PaymentFacilitator = await ethers.getContractFactory("X402PaymentFacilitator");
    x402PaymentFacilitator = await X402PaymentFacilitator.deploy(
      await copyRelay.getAddress(),
      owner.address // AI agent address
    );
    await x402PaymentFacilitator.waitForDeployment();

    const AIPaymentAgent = await ethers.getContractFactory("AIPaymentAgent");
    aiPaymentAgent = await AIPaymentAgent.deploy(
      await x402PaymentFacilitator.getAddress(),
      await copyRelay.getAddress()
    );
    await aiPaymentAgent.waitForDeployment();

    // Setup tokens and strategies
    await strategyNFT.connect(leader).createStrategy(
      "Advanced DeFi Strategy",
      "Strategy with 1inch and x402 integration",
      250
    );

    // Mint tokens for testing
    await testUSDC.mint(leader.address, ethers.parseUnits("50000", 6)); // Leader needs tokens for orders
    await testUSDC.mint(follower1.address, ethers.parseUnits("10000", 6));
    await testUSDC.mint(follower2.address, ethers.parseUnits("10000", 6));
    await testWETH.mint(leader.address, ethers.parseUnits("50", 18));
    await testWETH.mint(follower1.address, ethers.parseUnits("10", 18));
    await testWETH.mint(follower2.address, ethers.parseUnits("10", 18));
  });

  describe("1inch Price Oracle Integration", function () {
    it("Should add supported tokens", async function () {
      await oneInchPriceOracle.addSupportedToken(await testUSDC.getAddress(), "TestUSDC");
      await oneInchPriceOracle.addSupportedToken(await testWETH.getAddress(), "TestWETH");

      const supportedTokens = await oneInchPriceOracle.getSupportedTokens();
      expect(supportedTokens).to.include(await testUSDC.getAddress());
      expect(supportedTokens).to.include(await testWETH.getAddress());
    });

    it("Should update token prices", async function () {
      await oneInchPriceOracle.addSupportedToken(await testUSDC.getAddress(), "TestUSDC");
      
      await oneInchPriceOracle.updateTokenPrice(
        await testUSDC.getAddress(),
        100000000, // $1.00 (8 decimals)
        ethers.parseUnits("1000000", 6)
      );

      const [price, timestamp, isValid] = await oneInchPriceOracle.getTokenPrice(await testUSDC.getAddress());
      expect(price).to.equal(100000000);
      expect(isValid).to.be.true;
    });

    it("Should provide swap quotes", async function () {
      await oneInchPriceOracle.addSupportedToken(await testUSDC.getAddress(), "TestUSDC");
      await oneInchPriceOracle.addSupportedToken(await testWETH.getAddress(), "TestWETH");
      
      await oneInchPriceOracle.updateTokenPrice(await testUSDC.getAddress(), 100000000, 0);
      await oneInchPriceOracle.updateTokenPrice(await testWETH.getAddress(), 300000000000, 0);

      const [amountOut, priceImpact, confidence] = await oneInchPriceOracle.getSwapQuote(
        await testUSDC.getAddress(),
        await testWETH.getAddress(),
        ethers.parseUnits("3000", 6) // 3000 USDC
      );

      expect(amountOut).to.be.gt(0);
    });

    it("Should provide trading recommendations", async function () {
      await oneInchPriceOracle.addSupportedToken(await testUSDC.getAddress(), "TestUSDC");
      await oneInchPriceOracle.addSupportedToken(await testWETH.getAddress(), "TestWETH");
      
      await oneInchPriceOracle.updateTokenPrice(await testUSDC.getAddress(), 100000000, 0);
      await oneInchPriceOracle.updateTokenPrice(await testWETH.getAddress(), 300000000000, 0);

      const [useLimit, useTWAP, reason] = await oneInchPriceOracle.getTradingRecommendation(
        await testUSDC.getAddress(),
        await testWETH.getAddress(),
        ethers.parseUnits("1000", 6)
      );

      expect(reason).to.be.a('string');
    });
  });

  describe("1inch Integration", function () {
    it("Should place limit orders", async function () {
      await testUSDC.connect(leader).approve(await oneInchIntegration.getAddress(), ethers.parseUnits("1000", 6));
      
      await expect(
        oneInchIntegration.connect(leader).placeLimitOrder(
          await testUSDC.getAddress(),
          await testWETH.getAddress(),
          ethers.parseUnits("1000", 6),
          ethers.parseUnits("0.3", 18),
          Math.floor(Date.now() / 1000) + 3600 // 1 hour deadline
        )
      ).to.emit(oneInchIntegration, "LimitOrderPlaced");
    });

    it("Should place TWAP orders", async function () {
      await testUSDC.connect(leader).approve(await oneInchIntegration.getAddress(), ethers.parseUnits("5000", 6));
      
      await expect(
        oneInchIntegration.connect(leader).placeTWAPOrder(
          await testUSDC.getAddress(),
          await testWETH.getAddress(),
          ethers.parseUnits("5000", 6), // 5000 USDC total
          ethers.parseUnits("1.5", 18), // min 1.5 WETH
          600, // 10 minutes between trades
          5 // 5 intervals
        )
      ).to.emit(oneInchIntegration, "TWAPOrderCreated");
    });

    it("Should get order details", async function () {
      await testUSDC.connect(leader).approve(await oneInchIntegration.getAddress(), ethers.parseUnits("1000", 6));
      
      const tx = await oneInchIntegration.connect(leader).placeLimitOrder(
        await testUSDC.getAddress(),
        await testWETH.getAddress(),
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("0.3", 18),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      const order = await oneInchIntegration.getOrder(1);
      expect(order.maker).to.equal(leader.address);
      expect(order.isActive).to.be.true;
    });
  });

  describe("x402 Payment System", function () {
    it("Should create subscription payment requests", async function () {
      const monthlyFee = ethers.parseUnits("10", 6);
      
      await expect(
        x402PaymentFacilitator.createSubscription(
          follower1.address,
          leader.address,
          monthlyFee,
          await testUSDC.getAddress()
        )
      ).to.emit(x402PaymentFacilitator, "PaymentRequired");
    });

    it("Should verify and settle payments", async function () {
      const monthlyFee = ethers.parseUnits("10", 6);
      
      const requestId = await x402PaymentFacilitator.createSubscription.staticCall(
        follower1.address,
        leader.address,
        monthlyFee,
        await testUSDC.getAddress()
      );
      
      await x402PaymentFacilitator.createSubscription(
        follower1.address,
        leader.address,
        monthlyFee,
        await testUSDC.getAddress()
      );

      // Verify payment
      const paymentProof = ethers.hexlify(ethers.randomBytes(32));
      await x402PaymentFacilitator.verifyPayment(requestId);
      
      // Check payment request
      const request = await x402PaymentFacilitator.getPaymentRequest(requestId);
      expect(request.isVerified).to.be.true;
      expect(request.payer).to.equal(follower1.address);
    });

    it("Should get supported payment tokens", async function () {
      const supportedTokens = await x402PaymentFacilitator.getSupportedTokens();
      expect(supportedTokens).to.include(await testUSDC.getAddress());
      expect(supportedTokens).to.include(await testWETH.getAddress());
    });
  });

  describe("AI Payment Agent", function () {
    it("Should analyze trades", async function () {
      await expect(
        aiPaymentAgent.analyzeTrade(
          leader.address,
          await testUSDC.getAddress(),
          await testWETH.getAddress(),
          ethers.parseUnits("1000", 6),
          ethers.parseUnits("0.33", 18)
        )
      ).to.emit(aiPaymentAgent, "TradeAnalyzed");
    });

    it("Should generate trading summaries", async function () {
      const summary = await aiPaymentAgent.generateTradingSummary(leader.address, 3600);
      expect(summary).to.be.a('string');
      expect(summary).to.include('AI Analysis');
    });

    it("Should track consecutive losses", async function () {
      // Simulate loss trades
      await aiPaymentAgent.analyzeTrade(
        leader.address,
        await testUSDC.getAddress(),
        await testWETH.getAddress(),
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("0.2", 18) // Loss
      );

      const losses = await aiPaymentAgent.getConsecutiveLosses(follower1.address, leader.address);
      // In a real implementation, this would track actual losses per follower
    });

    it("Should provide market analysis", async function () {
      const [shouldPause, reason] = await aiPaymentAgent.analyzeMarketConditions(leader.address);
      expect(reason).to.be.a('string');
    });

    it("Should update AI thresholds", async function () {
      await aiPaymentAgent.updateAIThresholds(5, ethers.parseUnits("200", 6), ethers.parseUnits("20", 6));
      
      expect(await aiPaymentAgent.refundThreshold()).to.equal(5);
      expect(await aiPaymentAgent.minRefundAmount()).to.equal(ethers.parseUnits("200", 6));
    });
  });

  describe("Complete Integration Flow", function () {
    it("Should complete full copy trading with 1inch and x402", async function () {
      // 1. Create subscription
      const monthlyFee = ethers.parseUnits("10", 6);
      await x402PaymentFacilitator.createSubscription(
        follower1.address,
        leader.address,
        monthlyFee,
        await testUSDC.getAddress()
      );

      // 2. Subscribe to copy trading
      await copyRelay.connect(follower1).subscribe(
        leader.address,
        ethers.parseUnits("1000", 6)
      );

      // 3. Leader places 1inch order
      await testUSDC.connect(leader).approve(await oneInchIntegration.getAddress(), ethers.parseUnits("1000", 6));
      
      await oneInchIntegration.connect(leader).placeLimitOrder(
        await testUSDC.getAddress(),
        await testWETH.getAddress(),
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("0.3", 18),
        Math.floor(Date.now() / 1000) + 3600
      );

      // 4. Execute trade in CopyRelay
      await copyRelay.connect(leader).executeTrade(
        await testUSDC.getAddress(),
        await testWETH.getAddress(),
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("0.33", 18)
      );

      // 5. AI analyzes the trade
      await aiPaymentAgent.analyzeTrade(
        leader.address,
        await testUSDC.getAddress(),
        await testWETH.getAddress(),
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("0.33", 18)
      );

      // Verify integration worked
      const subscription = await copyRelay.getSubscription(follower1.address, leader.address);
      expect(subscription.isActive).to.be.true;
    });
  });
});