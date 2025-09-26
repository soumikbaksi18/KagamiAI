const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SocialDeFi Copy AMM", function () {
  let testUSDC, testETH, strategyNFT, copyRelay, copyHook;
  let owner, leader, follower1, follower2;
  let strategyId;

  beforeEach(async function () {
    [owner, leader, follower1, follower2] = await ethers.getSigners();

    // Deploy Test Tokens
    const TestToken = await ethers.getContractFactory("TestToken");
    testUSDC = await TestToken.deploy(
      "Test USDC",
      "TestUSDC",
      6,
      ethers.parseUnits("1000000", 6)
    );
    await testUSDC.waitForDeployment();

    testETH = await TestToken.deploy(
      "Test ETH",
      "TestETH",
      18,
      ethers.parseUnits("1000", 18)
    );
    await testETH.waitForDeployment();

    // Deploy StrategyNFT
    const StrategyNFT = await ethers.getContractFactory("StrategyNFT");
    strategyNFT = await StrategyNFT.deploy();
    await strategyNFT.waitForDeployment();

    // Deploy CopyRelay
    const CopyRelay = await ethers.getContractFactory("CopyRelay");
    copyRelay = await CopyRelay.deploy(
      await strategyNFT.getAddress(),
      owner.address
    );
    await copyRelay.waitForDeployment();

    // Link contracts
    await strategyNFT.setCopyRelay(await copyRelay.getAddress());

    // Deploy CopyHook
    const CopyHook = await ethers.getContractFactory("CopyHook");
    copyHook = await CopyHook.deploy(await copyRelay.getAddress());
    await copyHook.waitForDeployment();

    // Create a strategy
    const strategyTx = await strategyNFT.connect(leader).createStrategy(
      "Test Strategy",
      "A test strategy for copy trading",
      250, // 2.5% performance fee
      { value: 0 }
    );
    await strategyTx.wait();
    strategyId = 1;

    // Mint tokens to followers for testing
    await testUSDC.mint(follower1.address, ethers.parseUnits("10000", 6));
    await testUSDC.mint(follower2.address, ethers.parseUnits("10000", 6));
    await testETH.mint(follower1.address, ethers.parseUnits("10", 18));
    await testETH.mint(follower2.address, ethers.parseUnits("10", 18));
  });

  describe("TestToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await testUSDC.name()).to.equal("Test USDC");
      expect(await testUSDC.symbol()).to.equal("TestUSDC");
      expect(await testUSDC.decimals()).to.equal(6);
    });

    it("Should mint tokens correctly", async function () {
      const initialBalance = await testUSDC.balanceOf(owner.address);
      const amount = ethers.parseUnits("1000", 6);
      await testUSDC.mint(owner.address, amount);
      const finalBalance = await testUSDC.balanceOf(owner.address);
      expect(finalBalance).to.equal(initialBalance + amount);
    });
  });

  describe("StrategyNFT", function () {
    it("Should create strategy correctly", async function () {
      const strategy = await strategyNFT.getStrategy(strategyId);
      expect(strategy.leader).to.equal(leader.address);
      expect(strategy.name).to.equal("Test Strategy");
      expect(strategy.performanceFee).to.equal(250);
      expect(strategy.isActive).to.be.true;
    });

    it("Should update strategy correctly", async function () {
      await strategyNFT.connect(leader).updateStrategy(
        strategyId,
        "Updated Strategy",
        "Updated description",
        300,
        true
      );

      const strategy = await strategyNFT.getStrategy(strategyId);
      expect(strategy.name).to.equal("Updated Strategy");
      expect(strategy.performanceFee).to.equal(300);
    });

    it("Should check if address is strategy leader", async function () {
      expect(await strategyNFT.isStrategyLeader(leader.address)).to.be.true;
      expect(await strategyNFT.isStrategyLeader(follower1.address)).to.be.false;
    });
  });

  describe("CopyRelay", function () {
    it("Should allow followers to subscribe", async function () {
      const subscriptionFee = ethers.parseUnits("100", 6);
      
      await copyRelay.connect(follower1).subscribe(
        leader.address,
        subscriptionFee
      );

      const subscription = await copyRelay.getSubscription(
        follower1.address,
        leader.address
      );
      expect(subscription.isActive).to.be.true;
      expect(subscription.leader).to.equal(leader.address);
      expect(subscription.subscriptionFee).to.equal(subscriptionFee);
    });

    it("Should not allow self-subscription", async function () {
      await expect(
        copyRelay.connect(leader).subscribe(leader.address, 100)
      ).to.be.revertedWith("Cannot subscribe to yourself");
    });

    it("Should not allow subscription to non-leader", async function () {
      await expect(
        copyRelay.connect(follower1).subscribe(follower1.address, 100)
      ).to.be.revertedWith("Not a valid strategy leader");
    });

    it("Should allow followers to unsubscribe", async function () {
      const subscriptionFee = ethers.parseUnits("100", 6);
      
      await copyRelay.connect(follower1).subscribe(
        leader.address,
        subscriptionFee
      );

      await copyRelay.connect(follower1).unsubscribe(leader.address);

      const subscription = await copyRelay.getSubscription(
        follower1.address,
        leader.address
      );
      expect(subscription.isActive).to.be.false;
    });

    it("Should execute trade and mirror to followers", async function () {
      // Subscribe followers
      await copyRelay.connect(follower1).subscribe(
        leader.address,
        ethers.parseUnits("1000", 6)
      );
      await copyRelay.connect(follower2).subscribe(
        leader.address,
        ethers.parseUnits("2000", 6)
      );

      // Execute trade
      const amountIn = ethers.parseUnits("100", 6);
      const amountOut = ethers.parseUnits("0.1", 18);
      
      await expect(
        copyRelay.connect(leader).executeTrade(
          await testUSDC.getAddress(),
          await testETH.getAddress(),
          amountIn,
          amountOut
        )
      ).to.emit(copyRelay, "TradeExecuted");
    });

    it("Should update platform fee", async function () {
      await copyRelay.updatePlatformFee(100);
      expect(await copyRelay.platformFee()).to.equal(100);
    });

    it("Should not allow platform fee > 10%", async function () {
      await expect(
        copyRelay.updatePlatformFee(1001)
      ).to.be.revertedWith("Platform fee cannot exceed 10%");
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full copy trading flow", async function () {
      // 1. Create strategy with a new leader (since leader already has a strategy)
      const [, , , , newLeader] = await ethers.getSigners();
      const strategyTx = await strategyNFT.connect(newLeader).createStrategy(
        "Integration Test Strategy",
        "Strategy for integration testing",
        200,
        { value: 0 }
      );
      await strategyTx.wait();

      // 2. Subscribe followers
      await copyRelay.connect(follower1).subscribe(
        newLeader.address,
        ethers.parseUnits("1000", 6)
      );
      await copyRelay.connect(follower2).subscribe(
        newLeader.address,
        ethers.parseUnits("2000", 6)
      );

      // 3. Execute trade
      const amountIn = ethers.parseUnits("500", 6);
      const amountOut = ethers.parseUnits("0.5", 18);
      
      const tradeTx = await copyRelay.connect(newLeader).executeTrade(
        await testUSDC.getAddress(),
        await testETH.getAddress(),
        amountIn,
        amountOut
      );

      // 4. Verify events
      await expect(tradeTx)
        .to.emit(copyRelay, "TradeExecuted");
    });
  });
});