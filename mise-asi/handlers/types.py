"""
Handler types and base utilities
Maps to: src/hooks/chat/handlers/handlerUtils.ts
"""
from typing import Callable, Any, TypedDict
from dataclasses import dataclass


class FunctionCall(TypedDict):
    """Incoming function call from LLM - matches Gemini FunctionCall"""
    name: str
    args: dict[str, Any]


@dataclass
class HandlerContext:
    """
    Context passed to handlers
    Maps to: FunctionHandlerArgs in handlerUtils.ts
    """
    user_id: str
    add_thought_step: Callable[[str, str | None, str], None]
    
    def log_step(self, step: str, details: str | None = None, status: str = "completed"):
        """Log a thought step for UI observability"""
        self.add_thought_step(step, details, status)


# Type for handler functions
HandlerFunction = Callable[[FunctionCall, HandlerContext], str]


def sanitize_data_for_display(data: Any) -> Any:
    """
    Remove sensitive fields from data before showing to user
    Maps to: sanitizeDataForDisplay in handlerUtils.ts
    """
    if isinstance(data, list):
        return [sanitize_data_for_display(item) for item in data]
    
    if isinstance(data, dict):
        sanitized = dict(data)
        # Remove sensitive fields
        for field in ["id", "user_id", "created_at", "updated_at"]:
            sanitized.pop(field, None)
        return sanitized
    
    return data
