"""
Utility Handlers
Maps to: src/hooks/chat/handlers/utilityHandlers.ts
"""
from datetime import datetime, timezone
from handlers.types import FunctionCall, HandlerContext


def handle_utility_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle utility function calls
    Maps to: handleUtilityFunctions in utilityHandlers.ts
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    if name == "getCurrentTime":
        return handle_get_current_time(args, ctx)
    
    return f"Unknown utility function: {name}"


def handle_get_current_time(args: dict, ctx: HandlerContext) -> str:
    """
    Get current time
    Maps to: getCurrentTime handler in utilityHandlers.ts
    """
    try:
        tz_name = args.get("timezone", "UTC")
        
        # Get current UTC time
        now = datetime.now(timezone.utc)
        
        # Try to handle timezone if specified
        if tz_name != "UTC":
            try:
                import pytz
                tz = pytz.timezone(tz_name)
                now = datetime.now(tz)
            except Exception:
                pass  # Fall back to UTC
        
        formatted_time = now.strftime("%A, %B %d, %Y at %I:%M %p")
        
        ctx.log_step("✅ Executed: getCurrentTime")
        return f"Current time: {formatted_time}"
        
    except Exception as e:
        ctx.log_step("❌ getCurrentTime failed")
        return f"Failed to get current time: {str(e)}"
