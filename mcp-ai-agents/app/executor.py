import json
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlmodel import Session, select
from app.models import Portfolio, Trade

class TradeExecutor:
    @staticmethod
    def _get_holdings(session: Session, owner: str) -> dict:
        pf = session.exec(select(Portfolio).where(Portfolio.owner == owner)).first()
        if not pf:
            pf = Portfolio(owner=owner)
            session.add(pf); session.commit(); session.refresh(pf)
        return json.loads(pf.holdings_json)

    @staticmethod
    def _save_holdings(session: Session, owner: str, holdings: dict):
        pf = session.exec(select(Portfolio).where(Portfolio.owner == owner)).first()
        pf.holdings_json = json.dumps(holdings)
        pf.updated_at = datetime.now(timezone.utc)
        session.add(pf); session.commit()

    @classmethod
    def execute(cls, session: Session, owner: str, strategy_id: int,
                symbol: str, side: str, price: float, qty: float,
                base_asset: str = "USDC", meta: dict = None) -> Trade:
        holdings = cls._get_holdings(session, owner)
        meta = meta or {}

        if side == "buy":
            cost = price * qty
            if holdings.get(base_asset, 0.0) < cost:
                raise HTTPException(400, f"Insufficient {base_asset}")
            holdings[base_asset] -= cost
            holdings[symbol.upper()] = holdings.get(symbol.upper(), 0.0) + qty
            notional = cost
        else:
            if holdings.get(symbol.upper(), 0.0) < qty:
                raise HTTPException(400, f"Insufficient {symbol.upper()}")
            holdings[symbol.upper()] -= qty
            proceeds = price * qty
            holdings[base_asset] += proceeds
            notional = proceeds

        cls._save_holdings(session, owner, holdings)

        tr = Trade(owner=owner, strategy_id=strategy_id, symbol=symbol.upper(),
                   side=side, price=price, qty=qty, notional=notional,
                   meta_json=json.dumps(meta))
        session.add(tr); session.commit(); session.refresh(tr)
        return tr
