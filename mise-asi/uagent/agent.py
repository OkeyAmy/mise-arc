"""
Mise AI uAgent Implementation
Provides agent-based interface to the existing orchestrator

This agent:
1. Exposes REST endpoints (/chat, /health, /tools) for direct HTTP access
2. Implements chat protocol for agent-to-agent communication
3. Routes all requests through the existing Orchestrator
4. Does NOT modify any existing functionality
"""
import os
from datetime import datetime, timezone
from typing import Optional

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

from config import settings
from orchestration import get_orchestrator
from registry import get_all_tool_names
from utils import get_logger

from .models import ChatRequest, ChatResponse, HealthResponse, ToolsResponse

logger = get_logger(__name__)

# Agent configuration from settings
AGENT_PORT = int(os.getenv("AGENT_PORT", "8010"))
AGENT_MAILBOX = os.getenv("AGENT_MAILBOX", "true").lower() == "true"

# Singleton agent instance
_mise_agent: Optional[Agent] = None


def create_mise_agent() -> Agent:
    """Create and configure the Mise uAgent"""
    agent = Agent(
        name="mise_agent",
        seed=settings.AGENT_SEED,
        port=AGENT_PORT,
        mailbox=AGENT_MAILBOX,
    )
    
    # Include chat protocol
    chat_proto = Protocol(spec=chat_protocol_spec)
    
    @agent.on_event("startup")
    async def on_startup(ctx: Context):
        """Initialize agent state on startup"""
        ctx.storage.set("total_messages", 0)
        ctx.storage.set("conversations", {})
        ctx.logger.info(f"🚀 Mise Agent started at {agent.address}")
        ctx.logger.info(f"📍 REST endpoint: http://127.0.0.1:{AGENT_PORT}")
    
    @agent.on_event("shutdown")
    async def on_shutdown(ctx: Context):
        """Cleanup on agent shutdown"""
        ctx.logger.info("Shutting down Mise Agent")
    
    @chat_proto.on_message(ChatMessage)
    async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
        """Handle incoming chat messages from other agents"""
        try:
            # Extract text content from message
            user_text = next(
                (item.text for item in msg.content if isinstance(item, TextContent)), 
                ""
            ).strip()
            
            if not user_text:
                ctx.logger.warning("No text content in message")
                return
            
            ctx.logger.info(f"Chat message from {sender}: {user_text[:80]}...")
            
            # Send acknowledgement
            await ctx.send(
                sender,
                ChatAcknowledgement(
                    timestamp=datetime.now(timezone.utc),
                    acknowledged_msg_id=msg.msg_id,
                ),
            )
            
            # Get conversation history for this sender
            conversations = ctx.storage.get("conversations") or {}
            history = conversations.get(sender, [])
            
            # Use existing orchestrator to process the message
            orchestrator = get_orchestrator()
            result = orchestrator.process_message(
                message=user_text,
                user_id=sender,
                history=history
            )
            
            response_text = result.get("text", "I couldn't generate a response.")
            
            # Update conversation history
            history.append({"role": "user", "content": user_text})
            history.append({"role": "assistant", "content": response_text})
            conversations[sender] = history[-10:]  # Keep last 10 messages
            ctx.storage.set("conversations", conversations)
            
            # Update message counter
            total = ctx.storage.get("total_messages") or 0
            ctx.storage.set("total_messages", total + 1)
            
            # Send response
            await ctx.send(
                sender,
                ChatMessage(content=[TextContent(text=response_text, type="text")]),
            )
            ctx.logger.info(f"Response sent to {sender}")
            
        except Exception as exc:
            ctx.logger.error(f"Error processing chat message: {exc}")
            fallback = "I encountered an error while processing your request."
            await ctx.send(
                sender, 
                ChatMessage(content=[TextContent(text=fallback, type="text")])
            )
    
    @chat_proto.on_message(ChatAcknowledgement)
    async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
        """Handle message acknowledgements"""
        ctx.logger.debug(f"Message {msg.acknowledged_msg_id} acknowledged by {sender}")
    
    agent.include(chat_proto, publish_manifest=True)
    
    # REST Endpoints
    
    @agent.on_rest_post("/chat", ChatRequest, ChatResponse)
    async def rest_chat(ctx: Context, req: ChatRequest) -> ChatResponse:
        """
        REST endpoint for chat - mirrors Flask /chat endpoint
        Allows direct HTTP calls to the agent
        """
        sender_id = req.sender or req.user_id or "rest_client"
        user_text = (req.message or "").strip()
        history = req.history or []
        
        if not user_text:
            return ChatResponse(
                text="",
                function_calls=[],
                thought_steps=[],
                sender=sender_id,
                error="Please provide a message.",
            )
        
        try:
            ctx.logger.info(f"REST chat from {sender_id}: {user_text[:80]}...")
            
            # Use existing orchestrator
            orchestrator = get_orchestrator()
            result = orchestrator.process_message(
                message=user_text,
                user_id=sender_id,
                history=history
            )
            
            # Update counter
            total = ctx.storage.get("total_messages") or 0
            ctx.storage.set("total_messages", total + 1)
            
            return ChatResponse(
                text=result.get("text", ""),
                function_calls=result.get("function_calls", []),
                thought_steps=result.get("thought_steps", []),
                sender=sender_id,
            )
            
        except Exception as exc:
            ctx.logger.error(f"REST chat error: {exc}")
            return ChatResponse(
                text="",
                function_calls=[],
                thought_steps=[],
                sender=sender_id,
                error=f"Error processing request: {str(exc)}",
            )
    
    @agent.on_rest_get("/health", HealthResponse)
    async def rest_health(ctx: Context) -> HealthResponse:
        """Health check endpoint for the agent"""
        return HealthResponse(
            status="healthy",
            agent_name=agent.name,
            agent_address=agent.address,
            version="1.0.0",
        )
    
    @agent.on_rest_get("/tools", ToolsResponse)
    async def rest_tools(ctx: Context) -> ToolsResponse:
        """List available tools"""
        return ToolsResponse(tools=get_all_tool_names())
    
    return agent


def get_mise_agent() -> Agent:
    """Get or create singleton agent instance"""
    global _mise_agent
    if _mise_agent is None:
        _mise_agent = create_mise_agent()
    return _mise_agent
