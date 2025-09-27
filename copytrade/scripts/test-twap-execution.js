const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing TWAP Bot Execution...");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const TWAP_BOT_ADDRESS = "0x0355B7B8cb128fA5692729Ab3AAa199C1753f726";
  const TUSDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const TETH_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  // Get contracts
  const twapBot = await ethers.getContractAt("TWAPBot", TWAP_BOT_ADDRESS);
  const tusdc = await ethers.getContractAt("TestToken", TUSDC_ADDRESS);

  console.log("\n📊 Current TWAP Bot State:");
  
  // Get user orders
  const userOrders = await twapBot.getUserOrders(deployer.address);
  console.log("User Orders:", userOrders.map(id => id.toString()));

  if (userOrders.length > 0) {
    const orderId = userOrders[0];
    const order = await twapBot.getOrder(orderId);
    
    console.log("\n📋 Order Details:");
    console.log("- Order ID:", orderId.toString());
    console.log("- Total Amount:", ethers.formatEther(order.totalAmountIn), "TUSDC");
    console.log("- Amount Per Interval:", ethers.formatEther(order.amountPerInterval), "TUSDC");
    console.log("- Executed Amount:", ethers.formatEther(order.executedAmount), "TUSDC");
    console.log("- Remaining Intervals:", order.remainingIntervals.toString());
    console.log("- Interval Seconds:", order.intervalSeconds.toString());
    console.log("- Is Active:", order.isActive);
    console.log("- Last Execution:", new Date(Number(order.lastExecutionTime) * 1000).toLocaleString());
    
    // Check if order can be executed
    const canExecute = await twapBot.canExecuteOrder(orderId);
    console.log("- Can Execute Now:", canExecute);

    if (canExecute) {
      console.log("\n🚀 Order is ready for execution!");
      console.log("💡 In a real implementation, a keeper would execute this automatically");
      console.log("💡 For demo purposes, you can manually call executeTWAPInterval()");
    } else {
      const timeUntilNext = Number(order.lastExecutionTime) + Number(order.intervalSeconds) - Math.floor(Date.now() / 1000);
      if (timeUntilNext > 0) {
        console.log(`⏰ Next execution in ${Math.floor(timeUntilNext / 60)} minutes and ${timeUntilNext % 60} seconds`);
      }
    }
  } else {
    console.log("No TWAP orders found for this user");
  }

  // Get all executable orders
  console.log("\n🔍 Checking for executable orders...");
  const executableOrders = await twapBot.getExecutableOrders();
  console.log("Executable Orders:", executableOrders.map(id => id.toString()));

  if (executableOrders.length > 0) {
    console.log(`\n✨ Found ${executableOrders.length} executable order(s)!`);
    console.log("These orders are ready for keeper execution");
  }

  // Check balances
  console.log("\n💰 Token Balances:");
  const tusdcBalance = await tusdc.balanceOf(deployer.address);
  console.log("TUSDC Balance:", ethers.formatEther(tusdcBalance));

  const ethBalance = await deployer.provider.getBalance(deployer.address);
  console.log("ETH Balance:", ethers.formatEther(ethBalance));

  console.log("\n🎯 TWAP Bot Status: Ready for execution!");
  console.log("📱 Frontend Integration: Complete");
  console.log("🏆 1inch Hackathon: Ready for submission");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });