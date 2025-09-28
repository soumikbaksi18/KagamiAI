from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from datetime import datetime

class CreateStrategyIn(BaseModel):
    name: str
    owner: str
    bot_type: str
    symbol: str
    base_asset: str = "USDC"
    params: Dict[str, Any] = {}

class StrategyOut(BaseModel):
    id: int
    name: str
    owner: str
    bot_type: str
    symbol: str
    base_asset: str
    params: Dict[str, Any]
    status: str
    created_at: str
    updated_at: str

class PortfolioOut(BaseModel):
    owner: str
    holdings: Dict[str, float]
    updated_at: str

class PortfolioUpdateIn(BaseModel):
    owner: str
    holdings: Dict[str, float]

class TradeOut(BaseModel):
    id: int
    strategy_id: int
    symbol: str
    side: str
    price: float
    qty: float
    notional: float
    meta: Dict[str, Any]
    created_at: str

class StrategyStatusUpdate(BaseModel):
    status: str  # "live", "paused", "draft"