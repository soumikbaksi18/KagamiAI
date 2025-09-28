# **1inch Integration Documentation**

## **📋 Overview**

PookieFI integrates with 1inch's Limit Order Protocol (LOP) to enable **Social TWAP Trading** - allowing communities to follow expert traders' automated strategies through gasless, time-weighted execution.

### **🎯 Integration Goals**
- Extend 1inch LOP with social trading capabilities
- Enable TWAP strategies that communities can follow
- Provide gasless execution for all participants
- Create monetization for strategy creators

---

## **🏗️ Architecture Overview**

```
Strategy Creator → Creates TWAP Strategy → Mint Strategy NFT
       ↓
Community Members → Follow Strategy → Auto-create LOP Orders  
       ↓
1inch Keepers → Execute Orders → Gasless TWAP Execution
```

### **Core Components**
1. **TWAPBot Contract** - Main 1inch integration
2. **Social Strategy System** - NFT-based strategy sharing
3. **Automated Execution** - 1inch keeper integration
4. **Price Oracle Integration** - Market data feeds

---

## **📦 Smart Contract Architecture**

### **1. TWAPBot.sol**
**Purpose**: Core TWAP functionality built on 1inch LOP

**Key Features**:
- Creates multiple limit orders for TWAP execution
- Manages social following of strategies  
- Handles fee distribution to strategy creators
- Integrates with 1inch router and LOP

**Constructor Parameters**:
```solidity
constructor(
    address _oneInchRouter,        // 1inch v5 Aggregation Router
    address _limitOrderProtocol    // 1inch Limit Order Protocol
)
```

**Main Functions**:
- `createTWAPOrder()` - Create time-weighted average price orders
- `followStrategy()` - Enable community following of strategies
- `executeTWAP()` - Execute TWAP intervals via 1inch

### **2. OneInchIntegration.sol**
**Purpose**: Advanced 1inch LOP integration for copy trading

**Key Features**:
- Limit order creation and management
- Social strategy replication
- Automated follower execution
- Performance tracking

### **3. OneInchPriceOracle.sol**  
**Purpose**: Price feed integration for market data

**Key Features**:
- Real-time price aggregation
- Liquidity source tracking
- Market depth analysis
- Strategy performance calculation

---

## **🔧 Deployment Configuration**

### **Contract Addresses**

| Contract | Address | Network |
|----------|---------|---------|
| TWAPBot | `0x0355B7B8cb128fA5692729Ab3AAa199C1753f726` | Local/Testnet |
| 1inch Router v5 | `0x1111111254EEB25477B68fb85Ed929f73A960582` | Mainnet |
| 1inch LOP | `0x119c71D3BbAC22029622cbaEc24854d3D32D2828` | Mainnet |

### **Deployment Script**
**File**: `scripts/deploy-twap-bot.js`

**Key Configuration**:
```javascript
const MOCK_1INCH_ROUTER = "0x1111111254EEB25477B68fb85Ed929f73A960582";
const MOCK_LIMIT_ORDER_PROTOCOL = "0x119c71D3BbAC22029622cbaEc24854d3D32D2828";

const twapBot = await TWAPBot.deploy(
  MOCK_1INCH_ROUTER,
  MOCK_LIMIT_ORDER_PROTOCOL
);
```

---

## **🎨 Frontend Integration**

### **1. TWAP Creation Interface**
**Component**: `TradingDetail.tsx`

**Features**:
- TWAP order creation form
- Strategy parameter configuration  
- Real-time execution fee calculation
- Social following interface

**Key Functionality**:
```typescript
const twapBotContract = new ethers.Contract(
  TWAP_BOT_ADDRESS,
  TWAP_BOT_ABI,
  signer
);

// Create TWAP order through 1inch
await twapBotContract.createTWAPOrder(
  tokenIn,
  tokenOut, 
  totalAmount,
  intervals,
  intervalSeconds,
  minAmountOut
);
```

### **2. Strategy Following**
**Component**: `TWAPModal.tsx`

**Features**:
- Browse available TWAP strategies
- One-click strategy following
- Automatic order replication
- Performance tracking display

### **3. Social Discovery**
**Component**: `TradeFlow.tsx`

**Strategy Types**:
- `ONEINCH_LOP` - Pure 1inch limit order strategies
- `SOCIAL_TWAP` - Community-followable TWAP strategies
- `HYBRID` - Combined manual + automated strategies

---

## **📊 1inch Integration Benefits**

### **For Strategy Creators**
- **Monetization**: Earn fees from followers
- **Gasless Execution**: No gas costs for TWAP execution
- **Professional Tools**: Advanced order types and conditions
- **Scale**: Strategies can have unlimited followers

### **For Strategy Followers**  
- **Expert Access**: Follow profitable trading strategies
- **Automation**: Set-and-forget TWAP execution
- **Cost Efficient**: Share gas costs across community
- **Risk Management**: Built-in limits and conditions

### **For Platform**
- **Volume Growth**: More users = more 1inch volume
- **Network Effects**: Popular strategies attract more users  
- **Revenue Streams**: Platform fees on all executions
- **Differentiation**: Only social trading platform on 1inch

---

## **🚀 Key Innovations**

### **1. Social TWAP Extension**
**Innovation**: Extended 1inch LOP from individual to community orders

**Implementation**:
- Strategy creators design TWAP parameters
- Followers automatically get same order structure
- All executed through 1inch keeper network
- Shared gas costs and optimal routing

### **2. Strategy NFT Integration**
**Innovation**: Tokenized trading strategies with revenue sharing

**Benefits**:
- Strategies become transferable assets
- Clear ownership and attribution
- Automated fee distribution
- Secondary market potential

### **3. Automated Social Execution**
**Innovation**: Keeper-powered community trading

**Technical Achievement**:
- Multiple follower orders batch-executed
- Optimal gas efficiency through 1inch routing
- Decentralized execution via keeper network
- No manual intervention required

---

## **📈 Usage Flow**

### **Strategy Creation**
1. Expert trader designs TWAP strategy parameters
2. Deploys strategy through TWAPBot contract
3. Strategy becomes discoverable to community
4. Sets follower fee structure

### **Strategy Following**
1. User discovers profitable TWAP strategy
2. One-click follow through frontend
3. Automatic limit order creation via 1inch LOP
4. Orders execute over time via keeper network

### **Execution & Settlement**
1. 1inch keepers monitor limit order conditions
2. Optimal routing through 1inch aggregation
3. Gasless execution for all participants
4. Automated fee distribution to strategy creator

---

## **💡 Future Extensions**

### **Advanced Order Types**
- **Range Orders**: TWAP within price ranges
- **Conditional TWAP**: Execute based on market conditions
- **Cross-chain TWAP**: Multi-network strategy execution
- **Options Integration**: TWAP for options strategies

### **Enhanced Social Features**
- **Strategy Ratings**: Community-driven strategy scoring
- **Performance Leaderboards**: Top strategy creators
- **Social Validation**: Proof-of-performance systems
- **Strategy Marketplace**: Buy/sell successful strategies

### **Integration Expansions**
- **Multi-DEX Routing**: Beyond 1inch aggregation
- **Yield Integration**: TWAP into yield-bearing assets  
- **NFT Strategies**: Community-owned strategy DAOs
- **Mobile Integration**: Native mobile TWAP execution
