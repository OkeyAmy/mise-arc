"""
Request/Response Models for Mise uAgent
Matches the Flask API contracts for compatibility
"""
from typing import Dict, List, Optional
from uagents import Model


class ChatRequest(Model):
    """Request model for /chat endpoint - matches Flask /chat body"""
    message: str
    user_id: str
    sender: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(Model):
    """Response model for /chat endpoint - matches Flask /chat response"""
    text: str
    function_calls: List[Dict]
    thought_steps: List[str]
    sender: str
    error: Optional[str] = None


class HealthResponse(Model):
    """Response model for /health endpoint"""
    status: str
    agent_name: str
    agent_address: str
    version: str


class ToolsResponse(Model):
    """Response model for /tools endpoint"""
    tools: List[str]
