# PookieFI Dashboard

A beautiful, pastel-themed React dashboard for the PookieFI copy trading platform built with Vite, React, and Tailwind CSS.

## 🎨 Features

- **Beautiful Pastel UI**: Modern glass-morphism design with soft pastel colors
- **Wallet Integration**: MetaMask connection with Polygon Amoy testnet support
- **Strategy Management**: Browse, create, and follow trading strategies
- **Live Trading Feed**: Real-time display of strategy leader trades
- **Portfolio Analytics**: Interactive charts and performance tracking
- **Contract Integration**: Direct integration with deployed copytrade smart contracts

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📱 Dashboard Sections

### 1. Strategy Discovery
- Browse all available trading strategies
- View performance metrics, follower counts, and fees
- Follow strategies with one-click integration

### 2. Portfolio Overview
- Interactive pie chart showing strategy allocation
- Performance timeline with returns over time
- Total portfolio value and P&L tracking

### 3. Live Trades Feed
- Real-time feed of strategy leader trades
- Token swap details with amounts and timestamps
- Visual indicators for trade direction and timing

### 4. Strategy Management
- Create new trading strategies with custom fees
- Manage existing strategies (for strategy leaders)
- View follower counts and total volume

## 🔗 Smart Contract Integration

The dashboard integrates with your deployed contracts:

- **StrategyNFT**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **CopyRelay**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- **TestUSDC**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **TestETH**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

## 🎯 Key Functions

- **Follow Strategy**: `CopyRelay.subscribe(leader, amount)`
- **Create Strategy**: `StrategyNFT.createStrategy(name, description, fee)`
- **Unfollow**: `CopyRelay.unsubscribe(leader)`
- **View Trades**: Listen to `TradeExecuted` events

## 🛠 Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Ethers.js** for blockchain interaction
- **Recharts** for data visualization
- **Lucide React** for icons
- **Framer Motion** for animations

## 🎨 Design System

### Color Palette
- **Primary**: `#fef7ff` (Light lavender background)
- **Secondary**: `#f0f4ff` (Light blue background)
- **Accent Pink**: `#ff9bb3`
- **Accent Blue**: `#a8d8ff`
- **Accent Purple**: `#d4a8ff`
- **Accent Green**: `#b3ffcc`

### Components
- **Glass Cards**: Semi-transparent cards with backdrop blur
- **Gradient Buttons**: Purple-to-pink gradient primary buttons
- **Pastel Accents**: Soft colored backgrounds for metrics
- **Smooth Animations**: Hover effects and transitions

Ready to copy trade with style! 🚀