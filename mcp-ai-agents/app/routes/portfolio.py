from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import Portfolio
from app.schemas import PortfolioOut, PortfolioUpdateIn
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

def _to_out(p: Portfolio) -> PortfolioOut:
    return PortfolioOut(
        owner=p.owner,
        holdings=json.loads(p.holdings_json),
        updated_at=p.updated_at.isoformat()
    )

@router.get("/{owner}", response_model=PortfolioOut)
def get_portfolio(owner: str, session: Session = Depends(get_session)):
    """Get portfolio for a specific owner"""
    p = session.exec(select(Portfolio).where(Portfolio.owner == owner)).first()
    if not p:
        # Create default portfolio if it doesn't exist
        p = Portfolio(owner=owner, holdings_json='{"USDC": 10000.0}')
        session.add(p)
        session.commit()
        session.refresh(p)
    return _to_out(p)

@router.post("/{owner}", response_model=PortfolioOut)
def set_portfolio(owner: str, body: PortfolioUpdateIn, session: Session = Depends(get_session)):
    """Set/update portfolio for a specific owner"""
    p = session.exec(select(Portfolio).where(Portfolio.owner == owner)).first()
    
    if p:
        # Update existing portfolio
        p.holdings_json = json.dumps(body.holdings)
        p.updated_at = datetime.now(timezone.utc)
    else:
        # Create new portfolio
        p = Portfolio(
            owner=owner,
            holdings_json=json.dumps(body.holdings),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(p)
    
    session.commit()
    session.refresh(p)
    return _to_out(p)

@router.get("/", response_model=list[PortfolioOut])
def list_portfolios(session: Session = Depends(get_session)):
    """List all portfolios"""
    portfolios = session.exec(select(Portfolio)).all()
    return [_to_out(p) for p in portfolios]