const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Testing trade execution on TUSDC/TETH pool...");
  
  const [trader] = await ethers.getSigners();
  console.log("Trader:", trader.address);
  
  // TUSDC/TETH Pool addresses
  const POOL_ADDRESS = '0xDA756c9596bB5E69165142c55AF80B908D891ffb'; // TUSDC/TETH
  const TUSDC_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const TETH_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
  
  // Get contracts
  const tusdcContract = await ethers.getContractAt("TestToken", TUSDC_ADDRESS);
  const tethContract = await ethers.getContractAt("TestToken", TETH_ADDRESS);
  const poolContract = await ethers.getContractAt("SimplePool", POOL_ADDRESS);
  
  console.log("\n📊 TUSDC/TETH Pool state BEFORE trade:");
  const volumeBefore = await poolContract.getVolume24h();
  const aprBefore = await poolContract.getAPR();
  const tvlBefore = await poolContract.getTotalValueLocked();
  const priceBefore = await poolContract.currentPrice();
  const reservesBefore = await poolContract.getReserves();
  
  console.log(`Volume 24h: ${ethers.formatEther(volumeBefore)} ETH`);
  console.log(`APR: ${aprBefore}%`);
  console.log(`TVL: ${ethers.formatEther(tvlBefore)} ETH`);
  console.log(`Price: ${ethers.formatEther(priceBefore)} ETH`);
  console.log(`TUSDC Reserve: ${ethers.formatEther(reservesBefore[0])}`);
  console.log(`TETH Reserve: ${ethers.formatEther(reservesBefore[1])}`);
  
  // Check trader balances
  console.log("\n💰 Trader balances BEFORE:");
  const tusdcBalance = await tusdcContract.balanceOf(trader.address);
  const tethBalance = await tethContract.balanceOf(trader.address);
  console.log(`TUSDC: ${ethers.formatEther(tusdcBalance)}`);
  console.log(`TETH: ${ethers.formatEther(tethBalance)}`);
  
  // If trader doesn't have enough tokens, mint some
  if (parseFloat(ethers.formatEther(tusdcBalance)) < 1000) {
    console.log("🪙 Minting TUSDC for trader...");
    await tusdcContract.mint(trader.address, ethers.parseEther("10000"));
  }
  
  // Approve pool to spend tokens
  console.log("\n✅ Approving pool to spend TUSDC...");
  const tradeAmount = ethers.parseEther("500"); // 500 TUSDC
  await tusdcContract.approve(POOL_ADDRESS, tradeAmount);
  
  // Execute trade: Swap 500 TUSDC for TETH
  console.log("\n🔄 Executing trade: 500 TUSDC → TETH");
  const tradeTx = await poolContract.swap(
    TUSDC_ADDRESS,
    tradeAmount,
    trader.address
  );
  await tradeTx.wait();
  console.log("✅ Trade executed successfully!");
  
  // Check pool state AFTER trade
  console.log("\n📊 TUSDC/TETH Pool state AFTER trade:");
  const volumeAfter = await poolContract.getVolume24h();
  const aprAfter = await poolContract.getAPR();
  const tvlAfter = await poolContract.getTotalValueLocked();
  const priceAfter = await poolContract.currentPrice();
  const reservesAfter = await poolContract.getReserves();
  
  console.log(`Volume 24h: ${ethers.formatEther(volumeAfter)} ETH`);
  console.log(`APR: ${aprAfter}%`);
  console.log(`TVL: ${ethers.formatEther(tvlAfter)} ETH`);
  console.log(`Price: ${ethers.formatEther(priceAfter)} ETH`);
  console.log(`TUSDC Reserve: ${ethers.formatEther(reservesAfter[0])}`);
  console.log(`TETH Reserve: ${ethers.formatEther(reservesAfter[1])}`);
  
  // Check trader balances AFTER
  console.log("\n💰 Trader balances AFTER:");
  const tusdcBalanceAfter = await tusdcContract.balanceOf(trader.address);
  const tethBalanceAfter = await tethContract.balanceOf(trader.address);
  console.log(`TUSDC: ${ethers.formatEther(tusdcBalanceAfter)}`);
  console.log(`TETH: ${ethers.formatEther(tethBalanceAfter)}`);
  
  // Calculate changes
  console.log("\n📈 Changes:");
  console.log(`Volume increased by: ${ethers.formatEther(volumeAfter - volumeBefore)} ETH`);
  console.log(`APR changed from ${aprBefore}% to ${aprAfter}%`);
  console.log(`TVL changed from ${ethers.formatEther(tvlBefore)} to ${ethers.formatEther(tvlAfter)} ETH`);
  console.log(`Price changed from ${ethers.formatEther(priceBefore)} to ${ethers.formatEther(priceAfter)} ETH`);
  console.log(`TUSDC traded: ${ethers.formatEther(tusdcBalance - tusdcBalanceAfter)}`);
  console.log(`TETH received: ${ethers.formatEther(tethBalanceAfter - tethBalance)}`);
  
  console.log("\n🎉 TUSDC/TETH trade test completed! UI should now show updated values.");
  console.log("Expected UI updates:");
  console.log(`- Price: ${parseFloat(ethers.formatEther(priceAfter)).toFixed(5)}`);
  console.log(`- Volume: $${(parseFloat(ethers.formatEther(volumeAfter)) / 1000).toFixed(0)}K`);
  console.log(`- TVL: $${(parseFloat(ethers.formatEther(tvlAfter)) / 1000).toFixed(0)}K`);
  console.log(`- APR: ${aprAfter}%`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Trade test failed:", error);
    process.exit(1);
  });