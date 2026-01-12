"""
Integration helpers for running uAgent alongside Flask
Provides optional agent startup/shutdown without modifying existing code

Usage in main.py (optional):
    from uagent.integration import start_agent_if_enabled, stop_agent
    
    # At startup
    start_agent_if_enabled()
    
    # At shutdown
    stop_agent()
"""
import os
import threading
from typing import Optional

from utils import get_logger

logger = get_logger(__name__)

# Environment variable to control agent startup
UAGENT_ENABLED = os.getenv("UAGENT_ENABLED", "false").lower() == "true"

# Thread for running agent
_agent_thread: Optional[threading.Thread] = None
_running = False


def start_agent_if_enabled():
    """
    Start the uAgent in a background thread if enabled
    Does nothing if UAGENT_ENABLED is not set to 'true'
    """
    global _agent_thread, _running
    
    if not UAGENT_ENABLED:
        logger.info("uAgent disabled (set UAGENT_ENABLED=true to enable)")
        return
    
    if _running:
        logger.warning("uAgent already running")
        return
    
    try:
        from .agent import get_mise_agent
        
        agent = get_mise_agent()
        
        def run_agent():
            global _running
            _running = True
            try:
                logger.info(f"Starting uAgent on port {agent._port}...")
                agent.run()
            except Exception as e:
                logger.error(f"uAgent error: {e}")
            finally:
                _running = False
        
        _agent_thread = threading.Thread(target=run_agent, daemon=True)
        _agent_thread.start()
        
        logger.info(f"uAgent started at {agent.address}")
        
    except Exception as e:
        logger.error(f"Failed to start uAgent: {e}")


def stop_agent():
    """Stop the running agent (if any)"""
    global _running
    
    if not _running:
        return
    
    logger.info("Stopping uAgent...")
    _running = False
    # Note: uagents doesn't have a clean shutdown method
    # The daemon thread will be killed when the main process exits


def is_agent_running() -> bool:
    """Check if the agent is currently running"""
    return _running
