"""
Standalone runner for Mise uAgent
Use this to run the agent as a separate process

Usage:
    python -m uagent.runner
    
Or:
    cd mise-asi && python -m uagent.runner
"""
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings
from utils import get_logger
from .agent import get_mise_agent

logger = get_logger(__name__)


def main():
    """Run the Mise agent standalone"""
    
    # Validate settings
    missing = settings.validate()
    if missing:
        logger.warning(f"Missing environment variables: {', '.join(missing)}")
        logger.warning("Some features may not work correctly.")
    
    # Get agent instance
    agent = get_mise_agent()
    
    print("🚀 Mise AI uAgent - Standalone Runner")
    print(f"📍 Agent address: {agent.address}")
    print(f"🌐 REST endpoint: http://127.0.0.1:{agent._port}")
    print()
    print("📋 Available endpoints:")
    print(f"   GET  /health - Agent health check")
    print(f"   POST /chat   - Process chat message")
    print(f"   GET  /tools  - List available tools")
    print()
    print("Press Ctrl+C to stop.\n")
    
    # Run the agent
    agent.run()


if __name__ == "__main__":
    main()
