# MCP (Model Context Protocol) tools for AI agent integration
# This module provides tools that AI agents can use to interact with the trading system

try:
    from modelcontextprotocol import Server as MCPServer
    from sqlmodel import Session, select
    from app.db import engine
    from app.models import Strategy
    import json
    from app.config import OPENAI_API_KEY
    from openai import OpenAI
    
    # Initialize MCP server
    mcp = MCPServer(name="bitmax-mcp", version="0.1.0")
    
    # Initialize OpenAI client if API key is available
    client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
    
    MCP_AVAILABLE = True
    
    @mcp.tool()
    async def mcp_list_strategies(owner: str = None):
        """List all trading strategies, optionally filtered by owner"""
        with Session(engine) as session:
            query = select(Strategy)
            if owner:
                query = query.where(Strategy.owner == owner)
            strategies = session.exec(query).all()
            
            return {
                "strategies": [
                    {
                        "id": strategy.id,
                        "name": strategy.name,
                        "bot_type": strategy.bot_type,
                        "symbol": strategy.symbol,
                        "status": strategy.status,
                        "params": json.loads(strategy.params_json or "{}")
                    }
                    for strategy in strategies
                ]
            }
    
    @mcp.tool()
    async def mcp_get_trading_logic(bot_type: str, symbol: str, params: dict):
        """Get AI explanation of trading strategy logic"""
        text = f"{bot_type.upper()} strategy on {symbol} with params {params}"
        
        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": f"Explain this trading strategy in simple terms: {text}"
                        }
                    ],
                    max_tokens=200
                )
                return {"summary": response.choices[0].message.content}
            except Exception as e:
                return {"summary": f"Error getting AI explanation: {e}"}
        
        return {"summary": text}
    
    @mcp.tool()
    async def mcp_create_strategy(name: str, owner: str, bot_type: str, symbol: str, params: dict = None):
        """Create a new trading strategy"""
        with Session(engine) as session:
            strategy = Strategy(
                name=name,
                owner=owner,
                bot_type=bot_type,
                symbol=symbol,
                params_json=json.dumps(params or {})
            )
            session.add(strategy)
            session.commit()
            session.refresh(strategy)
            
            return {
                "success": True,
                "strategy_id": strategy.id,
                "message": f"Strategy '{name}' created successfully"
            }
    
    @mcp.tool()
    async def mcp_start_strategy(strategy_id: int):
        """Start a trading strategy (set status to live)"""
        with Session(engine) as session:
            strategy = session.get(Strategy, strategy_id)
            if not strategy:
                return {"success": False, "message": "Strategy not found"}
            
            strategy.status = "live"
            session.add(strategy)
            session.commit()
            
            return {
                "success": True,
                "strategy_id": strategy_id,
                "message": f"Strategy '{strategy.name}' is now live"
            }
    
    @mcp.tool()
    async def mcp_stop_strategy(strategy_id: int):
        """Stop a trading strategy (set status to paused)"""
        with Session(engine) as session:
            strategy = session.get(Strategy, strategy_id)
            if not strategy:
                return {"success": False, "message": "Strategy not found"}
            
            strategy.status = "paused"
            session.add(strategy)
            session.commit()
            
            return {
                "success": True,
                "strategy_id": strategy_id,
                "message": f"Strategy '{strategy.name}' has been paused"
            }
    
    print("✅ MCP tools initialized successfully")
    
except ImportError as e:
    print(f"⚠️  MCP integration not available: {e}")
    mcp = None
    client = None
    MCP_AVAILABLE = False