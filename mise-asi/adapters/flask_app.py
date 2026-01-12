"""
Flask HTTP Adapter
Maps to: frontend_app.py from asi-samples

Provides REST endpoints for the frontend to call the ASI orchestrator
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import settings
from orchestration import get_orchestrator
from utils import get_logger

logger = get_logger(__name__)


def create_app() -> Flask:
    """Create and configure Flask app"""
    app = Flask(__name__)
    
    # Enable CORS for frontend - allow all common dev ports and production
    CORS(app, origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Common React port
        "http://localhost:8080",  # Your current frontend port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://mise-ai.vercel.app",
        r"https://mise-ai.*\.vercel\.app",  # Allow all Vercel preview deployments
    ], supports_credentials=True)
    
    @app.route("/health", methods=["GET"])
    def health():
        """Health check endpoint"""
        return jsonify({
            "status": "healthy",
            "agent": "mise-asi",
            "version": "1.0.0"
        })
    
    @app.route("/chat", methods=["POST"])
    def chat():
        """
        Main chat endpoint - replaces gemini-proxy Supabase function
        
        Request body:
        {
            "message": "user message",
            "user_id": "user-uuid",
            "history": [] // optional conversation history
        }
        
        Response:
        {
            "text": "assistant response",
            "function_calls": [...],
            "thought_steps": [...]
        }
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "No JSON body provided"}), 400
            
            message = data.get("message")
            user_id = data.get("user_id")
            history = data.get("history", [])
            
            if not message:
                return jsonify({"error": "Message is required"}), 400
            
            if not user_id:
                return jsonify({"error": "User ID is required"}), 400
            
            logger.info(f"Chat request from user {user_id[:8]}...")
            
            # Get orchestrator and process
            orchestrator = get_orchestrator()
            result = orchestrator.process_message(
                message=message,
                user_id=user_id,
                history=history
            )
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return jsonify({
                "error": str(e),
                "text": "I encountered an error processing your request.",
                "function_calls": [],
                "thought_steps": []
            }), 500
    
    @app.route("/tools", methods=["GET"])
    def list_tools():
        """List available tools"""
        from registry import get_all_tool_names
        return jsonify({
            "tools": get_all_tool_names()
        })
    
    return app
