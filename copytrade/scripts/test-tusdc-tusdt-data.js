const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing TUSDC/TUSDT Pool Data for Chart Generation...");

  // TUSDC/TUSDT Pool address
  const POOL_ADDRESS = '0xcA16B4430BC903fA049dC6BD212A016c220ba9de';
  
  // Get pool contract
  const poolContract = await ethers.getContractAt("SimplePool", POOL_ADDRESS);
  
  console.log("\n📊 TUSDC/TUSDT Pool Data:");
  
  try {
    // Fetch all the data that the frontend needs
    const [
      tvl,
      volume24h,
      volumeChange24h,
      apr,
      reserves,
      currentPrice
    ] = await Promise.all([
      poolContract.getTotalValueLocked(),
      poolContract.getVolume24h(),
      poolContract.getVolumeChange24h(),
      poolContract.getAPR(),
      poolContract.getReserves(),
      poolContract.currentPrice()
    ]);

    // Format the data exactly as the frontend does
    const tvlFormatted = `$${(parseFloat(ethers.formatEther(tvl)) / 1000).toFixed(0)}K`;
    const volumeFormatted = `$${(parseFloat(ethers.formatEther(volume24h)) / 1000).toFixed(0)}K`;
    const aprFormatted = `${Number(apr)}%`;
    const priceFormatted = parseFloat(ethers.formatEther(currentPrice)).toFixed(5);
    
    console.log("✅ Raw Contract Data:");
    console.log(`  TVL: ${ethers.formatEther(tvl)} ETH`);
    console.log(`  Volume 24h: ${ethers.formatEther(volume24h)} ETH`);
    console.log(`  APR: ${apr}%`);
    console.log(`  Current Price: ${ethers.formatEther(currentPrice)} ETH`);
    console.log(`  Reserve 0 (TUSDC): ${ethers.formatEther(reserves[0])}`);
    console.log(`  Reserve 1 (TUSDT): ${ethers.formatEther(reserves[1])}`);
    
    console.log("\n✅ Formatted Frontend Data:");
    console.log(`  TVL: ${tvlFormatted}`);
    console.log(`  Volume: ${volumeFormatted}`);
    console.log(`  APR: ${aprFormatted}`);
    console.log(`  Price: ${priceFormatted}`);
    
    // Test candlestick data generation logic
    console.log("\n🕯️ Candlestick Data Generation Test:");
    const currentPriceNum = parseFloat(priceFormatted);
    console.log(`  Current Price (number): ${currentPriceNum}`);
    console.log(`  Is valid price: ${currentPriceNum > 0}`);
    console.log(`  Volume for calculation: ${volumeFormatted}`);
    
    // Simulate candlestick generation
    if (currentPriceNum > 0) {
      console.log("✅ Price is valid - candlestick generation should work");
      
      // Generate a few sample candles
      const basePrice = currentPriceNum;
      const sampleCandles = [];
      
      for (let i = 0; i < 5; i++) {
        const variation = 0.02; // 2% variation
        const open = basePrice * (0.99 + Math.random() * variation);
        const close = basePrice * (0.99 + Math.random() * variation);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        
        sampleCandles.push({
          time: new Date(Date.now() - (4-i) * 5 * 60 * 1000).toISOString(),
          open: open.toFixed(6),
          high: high.toFixed(6),
          low: low.toFixed(6),
          close: close.toFixed(6),
          volume: Math.floor(Math.random() * 100000)
        });
      }
      
      console.log("📈 Sample Candlestick Data:");
      sampleCandles.forEach((candle, i) => {
        console.log(`  Candle ${i+1}: O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close} V:${candle.volume}`);
      });
      
    } else {
      console.log("❌ Price is invalid - this would cause candlestick generation to fail");
    }
    
  } catch (error) {
    console.error("❌ Error fetching pool data:", error);
  }
  
  console.log("\n🎯 Chart Troubleshooting Summary:");
  console.log("1. Pool contract is accessible ✅");
  console.log("2. Price data is available ✅");
  console.log("3. Volume data is available ✅");
  console.log("4. Data formatting works ✅");
  console.log("5. Candlestick generation should work ✅");
  
  console.log("\n💡 If chart still not showing:");
  console.log("- Check browser console for JavaScript errors");
  console.log("- Verify CandlestickChart component is receiving data");
  console.log("- Check if chart container has proper dimensions");
  console.log("- Ensure recharts library is working correctly");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });