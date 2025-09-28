from fastapi import FastAPI
from app.db import init_db
from app.routes import strategies, portfolio, trades
from app.cron import start_cron, stop_cron
import asyncio
import logging

# Optional MCP integration
try:
    from app.mcp_tools import mcp
    MCP_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  MCP integration not available: {e}")
    MCP_AVAILABLE = False
    mcp = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Bitmax AI MCP Server",
    description="Social DeFi AI Trading Platform with MCP Integration",
    version="0.1.0"
)

@app.on_event("startup")
async def startup_event():
    """Initialize database, start cron jobs, and MCP server"""
    try:
        logger.info("Starting Bitmax AI Server...")
        
        # Initialize database
        init_db()
        logger.info("Database initialized")
        
        # Start cron scheduler
        start_cron()
        logger.info("Cron scheduler started")
        
        # Start MCP server in background (if available)
        if MCP_AVAILABLE:
            asyncio.create_task(start_mcp_server())
            logger.info("MCP server starting...")
        else:
            logger.info("MCP server skipped (not available)")
        
        logger.info("Bitmax AI Server startup completed")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean shutdown of services"""
    try:
        logger.info("Shutting down Bitmax AI Server...")
        stop_cron()
        logger.info("Cron scheduler stopped")
        logger.info("Shutdown completed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

async def start_mcp_server():
    """Start the MCP server in background"""
    if not MCP_AVAILABLE:
        logger.warning("MCP server not available")
        return
    
    try:
        # Run MCP server
        await mcp.run()
    except Exception as e:
        logger.error(f"Error running MCP server: {e}")

# Register routes
app.include_router(strategies.router)
app.include_router(portfolio.router)
app.include_router(trades.router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "bitmax-ai-server"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Bitmax AI MCP Server",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }