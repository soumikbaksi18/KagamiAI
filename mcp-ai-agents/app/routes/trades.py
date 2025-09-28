from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import Trade
from app.schemas import TradeOut
import json
from typing import List, Optional

router = APIRouter(prefix="/api/trades", tags=["trades"])

def _to_out(t: Trade) -> TradeOut:
    return TradeOut(
        id=t.id,
        strategy_id=t.strategy_id,
        symbol=t.symbol,
        side=t.side,
        price=t.price,
        qty=t.qty,
        notional=t.notional,
        meta=json.loads(t.meta_json or "{}"),
        created_at=t.created_at.isoformat()
    )

@router.get("/", response_model=List[TradeOut])
def list_trades(
    owner: Optional[str] = None,
    strategy_id: Optional[int] = None,
    symbol: Optional[str] = None,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """List trades with optional filters"""
    query = select(Trade)
    
    if owner:
        query = query.where(Trade.owner == owner)
    if strategy_id:
        query = query.where(Trade.strategy_id == strategy_id)
    if symbol:
        query = query.where(Trade.symbol == symbol)
    
    # Order by most recent first
    query = query.order_by(Trade.created_at.desc())
    
    # Limit results
    query = query.limit(limit)
    
    trades = session.exec(query).all()
    return [_to_out(t) for t in trades]

@router.get("/{trade_id}", response_model=TradeOut)
def get_trade(trade_id: int, session: Session = Depends(get_session)):
    """Get a specific trade by ID"""
    trade = session.get(Trade, trade_id)
    if not trade:
        raise HTTPException(404, "Trade not found")
    return _to_out(trade)

@router.get("/owner/{owner}", response_model=List[TradeOut])
def get_trades_by_owner(owner: str, limit: int = 100, session: Session = Depends(get_session)):
    """Get all trades for a specific owner"""
    query = select(Trade).where(Trade.owner == owner).order_by(Trade.created_at.desc()).limit(limit)
    trades = session.exec(query).all()
    return [_to_out(t) for t in trades]

@router.get("/strategy/{strategy_id}", response_model=List[TradeOut])
def get_trades_by_strategy(strategy_id: int, limit: int = 100, session: Session = Depends(get_session)):
    """Get all trades for a specific strategy"""
    query = select(Trade).where(Trade.strategy_id == strategy_id).order_by(Trade.created_at.desc()).limit(limit)
    trades = session.exec(query).all()
    return [_to_out(t) for t in trades]