# SocialDeFi Copy AMM

A Social DeFi dApp on Polygon that combines Uniswap v4 pools with copy trading functionality, AI agents, and automated payments.

## 🌟 Features

### Phase 1 & 2 (Implemented)
- **Test Tokens**: TestUSDC and TestETH for testing
- **Strategy NFTs**: ERC721 tokens representing trading strategies
- **Copy Trading**: Follow and mirror trades from strategy leaders
- **Subscription System**: Subscribe to leaders with performance fees
- **Trade Mirroring**: Manual trade execution for followers
- **Event System**: Comprehensive events for frontend integration
- **Basic Hook**: Simplified hook contract (not real Uniswap v4 hook yet)

### Phase 3 (In Progress)
- **Real Uniswap v4 Hook**: Proper BaseHook implementation with automatic swap interception
- **Pool Integration**: Create pools with copy trading hooks attached
- **Automatic Copy Trading**: Trades automatically copied when leaders swap on Uniswap v4

### Future Phases
- **Phase 4**: 1inch Limit Order Protocol integration
- **Phase 5**: x402 agentic payments
- **Phase 6**: AI agent integration and demo polish

## 🏗️ Architecture

### Smart Contracts

1. **TestToken.sol**: ERC20 test tokens with minting capabilities
2. **StrategyNFT.sol**: ERC721 contract for strategy leaders
3. **CopyRelay.sol**: Core copy trading logic and subscription management
4. **CopyHook.sol**: Basic hook contract (manual execution)
5. **CopyTradingHook.sol**: Real Uniswap v4 hook with automatic swap interception

### Key Features

- **Strategy Creation**: Leaders create strategies with performance fees
- **Follower Subscription**: Users subscribe to strategies they want to follow
- **Trade Mirroring**: Automatic execution of trades for all followers
- **Fee Management**: Performance fees and platform fees
- **Event Emission**: Rich events for frontend and AI integration

## 🪝 Uniswap v4 Hook Architecture

### Current Implementation Status

**Phase 1-2 (✅ Complete)**: Basic copy trading with manual execution
- `CopyHook.sol`: Simple contract for manual trade processing
- Leaders must call `executeTrade()` manually
- Works independently of Uniswap v4

**Phase 3 (🚧 In Progress)**: Real Uniswap v4 Hook Integration
- `CopyTradingHook.sol`: Proper BaseHook implementation
- Automatically intercepts swaps on Uniswap v4 pools
- Triggers copy trading when strategy leaders trade
- Requires special address encoding for hook permissions

### Hook Permissions

Our hook uses these Uniswap v4 permissions:
- `beforeSwap: true` - Detect when strategy leaders are about to trade
- `afterSwap: true` - Execute copy trades after leader swaps complete
- All other permissions: `false`

### Integration Flow

1. **Pool Creation**: Create Uniswap v4 pool with our hook attached
2. **Leader Trades**: When strategy leader swaps on the pool
3. **Hook Triggers**: `beforeSwap` detects the leader, `afterSwap` executes copies
4. **Automatic Copying**: All followers' trades execute automatically
5. **Fee Collection**: Performance fees collected per our strategy settings

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Hardhat
- Polygon Amoy testnet access

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd copytrade

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Polygon Amoy RPC URL and private key
```

### Configuration

Update `.env` file:
```env
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Polygon Amoy

```bash
npx hardhat run scripts/deploy.js --network polygonAmoy
```

## 📋 Contract Addresses

After deployment, contract addresses will be saved to `deployment-info.json`:

```json
{
  "network": "polygonAmoy",
  "contracts": {
    "TestUSDC": "0x...",
    "TestETH": "0x...",
    "StrategyNFT": "0x...",
    "CopyRelay": "0x...",
    "CopyHook": "0x..."
  }
}
```

## 🔧 Usage

### Creating a Strategy

```javascript
const strategyNFT = await ethers.getContractAt("StrategyNFT", strategyNFTAddress);
const tx = await strategyNFT.createStrategy(
  "My Strategy",
  "Strategy description",
  250, // 2.5% performance fee
  { value: 0 }
);
```

### Subscribing to a Strategy

```javascript
const copyRelay = await ethers.getContractAt("CopyRelay", copyRelayAddress);
const tx = await copyRelay.subscribe(
  leaderAddress,
  ethers.parseUnits("1000", 6) // subscription amount
);
```

### Executing a Trade

```javascript
const tx = await copyRelay.executeTrade(
  tokenInAddress,
  tokenOutAddress,
  amountIn,
  amountOut
);
```

## 🧪 Testing

The project includes comprehensive tests covering:

- Token functionality
- Strategy creation and management
- Subscription system
- Trade execution and mirroring
- Integration flows

Run tests with:
```bash
npx hardhat test
```

## 📊 Events

### Key Events

- `StrategyCreated`: When a new strategy is created
- `FollowerJoined`: When a user subscribes to a strategy
- `TradeExecuted`: When a leader executes a trade
- `TradeMirrored`: When a trade is mirrored to followers
- `RefundTriggered`: When a refund is processed

## 🔒 Security

- ReentrancyGuard protection
- Access control with Ownable
- Input validation
- Safe math operations

## 🚧 Development Status

- ✅ Phase 1: Foundation contracts
- ✅ Phase 2: Core copy trading features
- 🔄 Phase 3: 1inch integration (planned)
- 🔄 Phase 4: x402 payments (planned)
- 🔄 Phase 5: AI integration (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions and support:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation

## 🔗 Links

- [Polygon Amoy Testnet](https://amoy.polygonscan.com/)
- [Uniswap v4 Documentation](https://docs.uniswap.org/)
- [Hardhat Documentation](https://hardhat.org/docs)