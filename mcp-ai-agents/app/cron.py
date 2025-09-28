from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.db import engine
from sqlmodel import Session, select
from app.models import Strategy
from app.bots import run_bot
from app.config import CRON_SECONDS
import asyncio
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def run_tick():
    """Main cron job that runs all live trading strategies"""
    try:
        logger.info("Starting trading tick...")
        
        with Session(engine) as session:
            # Get all live strategies
            strategies = session.exec(select(Strategy).where(Strategy.status == "live")).all()
            
            if not strategies:
                logger.info("No live strategies found")
                return
            
            logger.info(f"Running {len(strategies)} live strategies")
            
            # Run each strategy
            for strategy in strategies:
                try:
                    logger.info(f"Executing strategy: {strategy.name} ({strategy.bot_type})")
                    trades = await run_bot(strategy, session)
                    
                    if trades:
                        logger.info(f"Strategy {strategy.name} executed {len(trades)} trades")
                        for trade in trades:
                            logger.info(f"  - {trade['action']}: {trade['qty']:.4f} at ${trade['price']}")
                    else:
                        logger.info(f"Strategy {strategy.name} - no trades executed")
                        
                except Exception as e:
                    logger.error(f"Error executing strategy {strategy.name}: {e}")
                    continue
            
            logger.info("Trading tick completed")
            
    except Exception as e:
        logger.error(f"Error in trading tick: {e}")

def start_cron():
    """Start the cron scheduler"""
    try:
        scheduler.add_job(
            run_tick, 
            "interval", 
            seconds=CRON_SECONDS, 
            id="trading_tick",
            max_instances=1,  # Prevent overlapping executions
            coalesce=True     # Skip missed executions
        )
        scheduler.start()
        logger.info(f"Cron scheduler started - running every {CRON_SECONDS} seconds")
    except Exception as e:
        logger.error(f"Failed to start cron scheduler: {e}")

def stop_cron():
    """Stop the cron scheduler"""
    try:
        scheduler.shutdown()
        logger.info("Cron scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping cron scheduler: {e}")