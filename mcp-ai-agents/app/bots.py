import json
import asyncio
from typing import Dict, Any, List, Optional
from sqlmodel import Session
from app.models import Strategy
from app.executor import TradeExecutor
from app.defi import get_current_price, get_historical_prices

class TradingBot:
    def __init__(self, strategy: Strategy, session: Session):
        self.strategy = strategy
        self.session = session
        self.params = json.loads(strategy.params_json or "{}")
        
    async def execute(self) -> List[Dict[str, Any]]:
        """Execute trading logic based on bot type"""
        try:
            current_price = await get_current_price(self.strategy.symbol)
            print(f"[{self.strategy.name}] Current {self.strategy.symbol} price: ${current_price}")
            
            if self.strategy.bot_type == "grid":
                return await self._grid_strategy(current_price)
            elif self.strategy.bot_type == "dca":
                return await self._dca_strategy(current_price)
            elif self.strategy.bot_type == "rebalance":
                return await self._rebalance_strategy(current_price)
            elif self.strategy.bot_type == "arbitrage":
                return await self._arbitrage_strategy(current_price)
            else:
                print(f"Unknown bot type: {self.strategy.bot_type}")
                return []
        except Exception as e:
            print(f"Error executing {self.strategy.name}: {e}")
            return []

    async def _grid_strategy(self, current_price: float) -> List[Dict[str, Any]]:
        """Grid trading: Buy low, sell high in grid steps"""
        lower = self.params.get("lower", current_price * 0.9)
        upper = self.params.get("upper", current_price * 1.1)
        grid_count = self.params.get("grid_count", 10)
        order_size = self.params.get("order_size", 100)
        
        trades = []
        
        # Calculate grid levels
        grid_step = (upper - lower) / grid_count
        grid_levels = [lower + i * grid_step for i in range(grid_count + 1)]
        
        # Find current price position in grid
        current_level = None
        for i, level in enumerate(grid_levels):
            if current_price >= level and (i == len(grid_levels) - 1 or current_price < grid_levels[i + 1]):
                current_level = i
                break
        
        if current_level is None:
            return trades
            
        # Buy if price is in lower half of grid
        if current_level < grid_count // 2:
            buy_price = grid_levels[current_level]
            qty = order_size / buy_price
            
            try:
                trade = TradeExecutor.execute(
                    session=self.session,
                    owner=self.strategy.owner,
                    strategy_id=self.strategy.id,
                    symbol=self.strategy.symbol,
                    side="buy",
                    price=buy_price,
                    qty=qty,
                    base_asset=self.strategy.base_asset,
                    meta={"bot": "grid", "grid_level": current_level}
                )
                trades.append({"action": "buy", "price": buy_price, "qty": qty, "trade_id": trade.id})
                print(f"[{self.strategy.name}] BUY {qty:.4f} {self.strategy.symbol} at ${buy_price}")
            except Exception as e:
                print(f"[{self.strategy.name}] Buy failed: {e}")
        
        # Sell if price is in upper half of grid
        elif current_level > grid_count // 2:
            sell_price = grid_levels[current_level]
            qty = order_size / sell_price
            
            try:
                trade = TradeExecutor.execute(
                    session=self.session,
                    owner=self.strategy.owner,
                    strategy_id=self.strategy.id,
                    symbol=self.strategy.symbol,
                    side="sell",
                    price=sell_price,
                    qty=qty,
                    base_asset=self.strategy.base_asset,
                    meta={"bot": "grid", "grid_level": current_level}
                )
                trades.append({"action": "sell", "price": sell_price, "qty": qty, "trade_id": trade.id})
                print(f"[{self.strategy.name}] SELL {qty:.4f} {self.strategy.symbol} at ${sell_price}")
            except Exception as e:
                print(f"[{self.strategy.name}] Sell failed: {e}")
        
        return trades

    async def _dca_strategy(self, current_price: float) -> List[Dict[str, Any]]:
        """Dollar Cost Averaging: Buy fixed USD amount regularly"""
        amount_usd = self.params.get("amount_usd", 100)
        qty = amount_usd / current_price
        
        trades = []
        try:
            trade = TradeExecutor.execute(
                session=self.session,
                owner=self.strategy.owner,
                strategy_id=self.strategy.id,
                symbol=self.strategy.symbol,
                side="buy",
                price=current_price,
                qty=qty,
                base_asset=self.strategy.base_asset,
                meta={"bot": "dca", "amount_usd": amount_usd}
            )
            trades.append({"action": "buy", "price": current_price, "qty": qty, "trade_id": trade.id})
            print(f"[{self.strategy.name}] DCA BUY ${amount_usd} worth of {self.strategy.symbol} at ${current_price}")
        except Exception as e:
            print(f"[{self.strategy.name}] DCA buy failed: {e}")
        
        return trades

    async def _rebalance_strategy(self, current_price: float) -> List[Dict[str, Any]]:
        """Portfolio rebalancing: Maintain target allocation percentages"""
        target_allocation = self.params.get("target_allocation", 0.5)  # 50% in this asset
        rebalance_threshold = self.params.get("rebalance_threshold", 0.05)  # 5% deviation
        
        # Get current portfolio
        from app.models import Portfolio
        from sqlmodel import select
        
        portfolio = self.session.exec(
            select(Portfolio).where(Portfolio.owner == self.strategy.owner)
        ).first()
        
        if not portfolio:
            return []
            
        holdings = json.loads(portfolio.holdings_json)
        total_value = 0
        
        # Calculate total portfolio value
        for asset, amount in holdings.items():
            if asset == self.strategy.base_asset:
                total_value += amount
            else:
                try:
                    asset_price = await get_current_price(asset.lower())
                    total_value += amount * asset_price
                except:
                    pass
        
        if total_value == 0:
            return []
        
        # Calculate current allocation
        current_asset_value = holdings.get(self.strategy.symbol.upper(), 0) * current_price
        current_allocation = current_asset_value / total_value
        
        trades = []
        
        # Rebalance if deviation exceeds threshold
        if abs(current_allocation - target_allocation) > rebalance_threshold:
            target_value = total_value * target_allocation
            current_value = current_asset_value
            difference = target_value - current_value
            
            if difference > 0:  # Need to buy more
                qty = difference / current_price
                try:
                    trade = TradeExecutor.execute(
                        session=self.session,
                        owner=self.strategy.owner,
                        strategy_id=self.strategy.id,
                        symbol=self.strategy.symbol,
                        side="buy",
                        price=current_price,
                        qty=qty,
                        base_asset=self.strategy.base_asset,
                        meta={"bot": "rebalance", "target_allocation": target_allocation}
                    )
                    trades.append({"action": "buy", "price": current_price, "qty": qty, "trade_id": trade.id})
                    print(f"[{self.strategy.name}] REBALANCE BUY {qty:.4f} {self.strategy.symbol} at ${current_price}")
                except Exception as e:
                    print(f"[{self.strategy.name}] Rebalance buy failed: {e}")
            
            elif difference < 0:  # Need to sell
                qty = abs(difference) / current_price
                try:
                    trade = TradeExecutor.execute(
                        session=self.session,
                        owner=self.strategy.owner,
                        strategy_id=self.strategy.id,
                        symbol=self.strategy.symbol,
                        side="sell",
                        price=current_price,
                        qty=qty,
                        base_asset=self.strategy.base_asset,
                        meta={"bot": "rebalance", "target_allocation": target_allocation}
                    )
                    trades.append({"action": "sell", "price": current_price, "qty": qty, "trade_id": trade.id})
                    print(f"[{self.strategy.name}] REBALANCE SELL {qty:.4f} {self.strategy.symbol} at ${current_price}")
                except Exception as e:
                    print(f"[{self.strategy.name}] Rebalance sell failed: {e}")
        
        return trades

    async def _arbitrage_strategy(self, current_price: float) -> List[Dict[str, Any]]:
        """Arbitrage: Check for price differences between sources (demo)"""
        # This is a demo implementation - in reality you'd check multiple exchanges
        trades = []
        
        # Simulate finding arbitrage opportunity
        arbitrage_threshold = self.params.get("arbitrage_threshold", 0.02)  # 2%
        simulated_other_price = current_price * (1 + arbitrage_threshold * 0.5)
        
        if abs(simulated_other_price - current_price) / current_price > arbitrage_threshold:
            # Simulate arbitrage trade
            qty = self.params.get("arbitrage_amount", 100) / current_price
            
            try:
                # Buy at current price
                buy_trade = TradeExecutor.execute(
                    session=self.session,
                    owner=self.strategy.owner,
                    strategy_id=self.strategy.id,
                    symbol=self.strategy.symbol,
                    side="buy",
                    price=current_price,
                    qty=qty,
                    base_asset=self.strategy.base_asset,
                    meta={"bot": "arbitrage", "type": "buy", "other_price": simulated_other_price}
                )
                trades.append({"action": "arbitrage_buy", "price": current_price, "qty": qty, "trade_id": buy_trade.id})
                
                # Sell at higher price (simulated)
                sell_trade = TradeExecutor.execute(
                    session=self.session,
                    owner=self.strategy.owner,
                    strategy_id=self.strategy.id,
                    symbol=self.strategy.symbol,
                    side="sell",
                    price=simulated_other_price,
                    qty=qty,
                    base_asset=self.strategy.base_asset,
                    meta={"bot": "arbitrage", "type": "sell", "original_price": current_price}
                )
                trades.append({"action": "arbitrage_sell", "price": simulated_other_price, "qty": qty, "trade_id": sell_trade.id})
                
                print(f"[{self.strategy.name}] ARBITRAGE: Buy at ${current_price}, Sell at ${simulated_other_price}")
            except Exception as e:
                print(f"[{self.strategy.name}] Arbitrage failed: {e}")
        
        return trades

async def run_bot(strategy: Strategy, session: Session) -> List[Dict[str, Any]]:
    """Run a single trading bot"""
    bot = TradingBot(strategy, session)
    return await bot.execute()