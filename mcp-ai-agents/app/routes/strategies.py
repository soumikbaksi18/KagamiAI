from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import Strategy
from app.schemas import CreateStrategyIn, StrategyOut, StrategyStatusUpdate
import json
from datetime import datetime, timezone
from typing import List

router = APIRouter(prefix="/api/strategies", tags=["strategies"])

def _to_out(st: Strategy) -> StrategyOut:
    return StrategyOut(
        id=st.id, name=st.name, owner=st.owner,
        bot_type=st.bot_type, symbol=st.symbol, base_asset=st.base_asset,
        params=json.loads(st.params_json or "{}"),
        status=st.status,
        created_at=st.created_at.isoformat(),
        updated_at=st.updated_at.isoformat()
    )

@router.post("/", response_model=StrategyOut)
def create_strategy(body: CreateStrategyIn, session: Session = Depends(get_session)):
    st = Strategy(
        name=body.name, owner=body.owner, bot_type=body.bot_type,
        symbol=body.symbol, base_asset=body.base_asset,
        params_json=json.dumps(body.params)
    )
    session.add(st)
    session.commit()
    session.refresh(st)
    return _to_out(st)

@router.get("/", response_model=List[StrategyOut])
def list_strategies(owner: str = None, session: Session = Depends(get_session)):
    """List all strategies, optionally filtered by owner"""
    query = select(Strategy)
    if owner:
        query = query.where(Strategy.owner == owner)
    strategies = session.exec(query).all()
    return [_to_out(st) for st in strategies]

@router.get("/{sid}", response_model=StrategyOut)
def get_strategy(sid: int, session: Session = Depends(get_session)):
    """Get a specific strategy by ID"""
    st = session.get(Strategy, sid)
    if not st:
        raise HTTPException(404, "Strategy not found")
    return _to_out(st)

@router.put("/{sid}", response_model=StrategyOut)
def update_strategy(sid: int, body: CreateStrategyIn, session: Session = Depends(get_session)):
    """Update a strategy"""
    st = session.get(Strategy, sid)
    if not st:
        raise HTTPException(404, "Strategy not found")
    
    st.name = body.name
    st.bot_type = body.bot_type
    st.symbol = body.symbol
    st.base_asset = body.base_asset
    st.params_json = json.dumps(body.params)
    st.updated_at = datetime.now(timezone.utc)
    
    session.add(st)
    session.commit()
    session.refresh(st)
    return _to_out(st)

@router.delete("/{sid}")
def delete_strategy(sid: int, session: Session = Depends(get_session)):
    """Delete a strategy"""
    st = session.get(Strategy, sid)
    if not st:
        raise HTTPException(404, "Strategy not found")
    
    session.delete(st)
    session.commit()
    return {"ok": True, "id": sid, "message": "Strategy deleted"}

@router.post("/{sid}/go_live")
def go_live(sid: int, session: Session = Depends(get_session)):
    """Set strategy status to live"""
    st = session.get(Strategy, sid)
    if not st:
        raise HTTPException(404, "Strategy not found")
    st.status = "live"
    st.updated_at = datetime.now(timezone.utc)
    session.add(st)
    session.commit()
    return {"ok": True, "id": sid, "status": "live"}

@router.post("/{sid}/pause")
def pause_strategy(sid: int, session: Session = Depends(get_session)):
    """Set strategy status to paused"""
    st = session.get(Strategy, sid)
    if not st:
        raise HTTPException(404, "Strategy not found")
    st.status = "paused"
    st.updated_at = datetime.now(timezone.utc)
    session.add(st)
    session.commit()
    return {"ok": True, "id": sid, "status": "paused"}

@router.post("/{sid}/status")
def update_strategy_status(sid: int, status_update: StrategyStatusUpdate, session: Session = Depends(get_session)):
    """Update strategy status (live, paused, draft)"""
    st = session.get(Strategy, sid)
    if not st:
        raise HTTPException(404, "Strategy not found")
    
    if status_update.status not in ["live", "paused", "draft"]:
        raise HTTPException(400, "Invalid status. Must be 'live', 'paused', or 'draft'")
    
    st.status = status_update.status
    st.updated_at = datetime.now(timezone.utc)
    session.add(st)
    session.commit()
    return {"ok": True, "id": sid, "status": status_update.status}