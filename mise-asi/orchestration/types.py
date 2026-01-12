"""
Orchestration Types
Maps to: src/hooks/chat/types.ts
"""
from typing import TypedDict, Any
from dataclasses import dataclass


class OrchestratorRequest(TypedDict):
    """Request to the orchestrator"""
    message: str
    user_id: str
    history: list[dict] | None


class OrchestratorResponse(TypedDict):
    """Response from the orchestrator"""
    text: str
    function_calls: list[dict]
    thought_steps: list[str]
