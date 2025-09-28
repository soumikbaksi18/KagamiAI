from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String

class Strategy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    owner: str
    bot_type: str = Field(sa_column=Column(String(20)))
    symbol: str
    base_asset: str = "USDC"
    params_json: str = "{}"
    status: str = Field(default="draft", sa_column=Column(String(20)))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Portfolio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner: str
    holdings_json: str = '{"USDC": 10000.0}'
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Trade(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner: str
    strategy_id: int
    symbol: str
    side: str
    price: float
    qty: float
    notional: float
    meta_json: str = "{}"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))