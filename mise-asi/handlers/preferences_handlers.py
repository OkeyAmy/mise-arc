"""
Preferences Handlers
Maps to: src/hooks/chat/handlers/preferenceHandlers.ts and crudPreferencesHandlers.ts
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_preferences, update_user_preferences


def handle_preferences_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle preferences function calls
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    if name in ["getUserPreferences", "getUserPreferencesData"]:
        return handle_get_preferences(ctx)
    elif name in ["updateUserPreferences", "updateUserPreferencesPartial"]:
        return handle_update_preferences(args, ctx)
    elif name == "createUserPreferences":
        return handle_create_preferences(args, ctx)
    
    return f"Unknown preferences function: {name}"


def handle_get_preferences(ctx: HandlerContext) -> str:
    """Get user preferences"""
    try:
        prefs = get_user_preferences(ctx.user_id)
        
        if not prefs:
            ctx.log_step("✅ Executed: getUserPreferences")
            return "No preferences set yet. Ask the user about their dietary restrictions, allergies, and nutritional goals."
        
        sanitized = sanitize_data_for_display(prefs)
        
        result = "**User Preferences:**\n\n"
        
        if sanitized.get("dietary_restrictions"):
            result += f"🥗 Dietary restrictions: {', '.join(sanitized['dietary_restrictions'])}\n"
        if sanitized.get("allergies"):
            result += f"⚠️ Allergies: {', '.join(sanitized['allergies'])}\n"
        if sanitized.get("calorie_goal"):
            result += f"🔥 Daily calorie goal: {sanitized['calorie_goal']}\n"
        if sanitized.get("protein_goal"):
            result += f"💪 Daily protein goal: {sanitized['protein_goal']}g\n"
        if sanitized.get("cuisine_preferences"):
            result += f"🍽️ Preferred cuisines: {', '.join(sanitized['cuisine_preferences'])}\n"
        
        ctx.log_step("✅ Executed: getUserPreferences")
        return result
        
    except Exception as e:
        ctx.log_step("❌ getUserPreferences failed")
        return f"Failed to get preferences: {str(e)}"


def handle_update_preferences(args: dict, ctx: HandlerContext) -> str:
    """Update user preferences"""
    try:
        updates = args.get("updates", args)  # Handle both formats
        if not updates:
            return "No updates provided."
        
        update_user_preferences(ctx.user_id, updates)
        
        ctx.log_step("✅ Executed: updateUserPreferences")
        return "Updated your preferences."
        
    except Exception as e:
        ctx.log_step("❌ updateUserPreferences failed")
        return f"Failed to update preferences: {str(e)}"


def handle_create_preferences(args: dict, ctx: HandlerContext) -> str:
    """Create user preferences"""
    try:
        preferences = args.get("preferences", {})
        
        update_user_preferences(ctx.user_id, preferences)
        
        ctx.log_step("✅ Executed: createUserPreferences")
        return "Created your preferences."
        
    except Exception as e:
        ctx.log_step("❌ createUserPreferences failed")
        return f"Failed to create preferences: {str(e)}"
