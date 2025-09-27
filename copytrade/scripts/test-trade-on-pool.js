const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Testing trade execution on TUSDC/TUSDT pool...");
  
  const [trader] = await ethers.getSigners();
  console.log("Trader:", trader.address);
  
  // Pool and token addresses
  const POOL_ADDRESS = '0xcA16B4430BC903fA049dC6BD212A016c220ba9de'; // TUSDC/TUSDT
  const TUSDC_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const TUSDT_ADDRESS = '0x851356ae760d987E095750cCeb3bC6014560891C';
  
  // Get contracts
  const tusdcContract = await ethers.getContractAt("TestToken", TUSDC_ADDRESS);
  const tusdtContract = await ethers.getContractAt("TestToken", TUSDT_ADDRESS);
  const poolContract = await ethers.getContractAt("SimplePool", POOL_ADDRESS);
  
  console.log("\n📊 Pool state BEFORE trade:");
  const volumeBefore = await poolContract.getVolume24h();
  const aprBefore = await poolContract.getAPR();
  const reservesBefore = await poolContract.getReserves();
  console.log(`Volume 24h: ${ethers.formatEther(volumeBefore)} ETH`);
  console.log(`APR: ${aprBefore}%`);
  console.log(`TUSDC Reserve: ${ethers.formatEther(reservesBefore[0])}`);
  console.log(`TUSDT Reserve: ${ethers.formatEther(reservesBefore[1])}`);
  
  // Check trader balances
  console.log("\n💰 Trader balances BEFORE:");
  const tusdcBalance = await tusdcContract.balanceOf(trader.address);
  const tusdtBalance = await tusdtContract.balanceOf(trader.address);
  console.log(`TUSDC: ${ethers.formatEther(tusdcBalance)}`);
  console.log(`TUSDT: ${ethers.formatEther(tusdtBalance)}`);
  
  // If trader doesn't have enough tokens, mint some
  if (parseFloat(ethers.formatEther(tusdcBalance)) < 1000) {
    console.log("🪙 Minting TUSDC for trader...");
    await tusdcContract.mint(trader.address, ethers.parseEther("10000"));
  }
  
  // Approve pool to spend tokens
  console.log("\n✅ Approving pool to spend TUSDC...");
  const tradeAmount = ethers.parseEther("1000"); // 1000 TUSDC
  await tusdcContract.approve(POOL_ADDRESS, tradeAmount);
  
  // Execute trade: Swap 1000 TUSDC for TUSDT
  console.log("\n🔄 Executing trade: 1000 TUSDC → TUSDT");
  const tradeTx = await poolContract.swap(
    TUSDC_ADDRESS,
    tradeAmount,
    trader.address
  );
  await tradeTx.wait();
  console.log("✅ Trade executed successfully!");
  
  // Check pool state AFTER trade
  console.log("\n📊 Pool state AFTER trade:");
  const volumeAfter = await poolContract.getVolume24h();
  const aprAfter = await poolContract.getAPR();
  const reservesAfter = await poolContract.getReserves();
  console.log(`Volume 24h: ${ethers.formatEther(volumeAfter)} ETH`);
  console.log(`APR: ${aprAfter}%`);
  console.log(`TUSDC Reserve: ${ethers.formatEther(reservesAfter[0])}`);
  console.log(`TUSDT Reserve: ${ethers.formatEther(reservesAfter[1])}`);
  
  // Check trader balances AFTER
  console.log("\n💰 Trader balances AFTER:");
  const tusdcBalanceAfter = await tusdcContract.balanceOf(trader.address);
  const tusdtBalanceAfter = await tusdtContract.balanceOf(trader.address);
  console.log(`TUSDC: ${ethers.formatEther(tusdcBalanceAfter)}`);
  console.log(`TUSDT: ${ethers.formatEther(tusdtBalanceAfter)}`);
  
  // Calculate changes
  console.log("\n📈 Changes:");
  console.log(`Volume increased by: ${ethers.formatEther(volumeAfter - volumeBefore)} ETH`);
  console.log(`APR changed from ${aprBefore}% to ${aprAfter}%`);
  console.log(`TUSDC traded: ${ethers.formatEther(tusdcBalance - tusdcBalanceAfter)}`);
  console.log(`TUSDT received: ${ethers.formatEther(tusdtBalanceAfter - tusdtBalance)}`);
  
  console.log("\n🎉 Trade test completed! Volume and APR should now be updated.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Trade test failed:", error);
    process.exit(1);
  });