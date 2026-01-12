"""
mise-asi - ASI Orchestration Layer
Entry point for the Flask application

Usage:
    python main.py

Or with gunicorn (production):
    gunicorn -w 4 -b 0.0.0.0:8001 main:app
"""
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import settings
from adapters import create_app
from utils import get_logger

logger = get_logger(__name__)


def main():
    """Main entry point"""
    
    # Validate settings
    missing = settings.validate()
    if missing:
        logger.warning(f"Missing environment variables: {', '.join(missing)}")
        logger.warning("Some features may not work correctly.")
    
    # Create Flask app
    app = create_app()
    
    # Print startup info
    print("🚀 mise-asi - ASI Orchestration Layer")
    print(f"📍 Running on http://localhost:{settings.PORT}")
    print(f"🔧 Environment: {settings.FLASK_ENV}")
    print()
    print("📋 Endpoints:")
    print(f"   GET  /health - Health check")
    print(f"   POST /chat   - Process chat message")
    print(f"   GET  /tools  - List available tools")
    print()
    print("Press Ctrl+C to stop.\n")
    
    # Run Flask
    app.run(
        host="0.0.0.0",
        port=settings.PORT,
        debug=settings.DEBUG
    )


# For gunicorn
app = create_app()


if __name__ == "__main__":
    main()
