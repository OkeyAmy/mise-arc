"""
Preferences Handlers
Maps to: src/hooks/chat/handlers/preferenceHandlers.ts and crudPreferencesHandlers.ts

IMPORTANT: Returns ALL data from database, not just specific fields.
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_preferences, update_user_preferences
from utils.logger import get_logger
import json

logger = get_logger(__name__)


def handle_preferences_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle preferences function calls
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    logger.info(f"Preferences handler called: {name} with args: {args}")
    
    if name in ["getUserPreferences", "getUserPreferencesData"]:
        return handle_get_preferences(ctx)
    elif name in ["updateUserPreferences", "updateUserPreferencesPartial"]:
        return handle_update_preferences(args, ctx)
    elif name == "createUserPreferences":
        return handle_create_preferences(args, ctx)
    
    return f"Unknown preferences function: {name}"


def handle_get_preferences(ctx: HandlerContext) -> str:
    """
    Get user preferences - returns ALL data from the database.
    Database fields: restrictions, goals, habits, family_size, cultural_heritage, 
                     notes, key_info, inventory, meal_ratings, swap_preferences
    """
    try:
        prefs = get_user_preferences(ctx.user_id)
        
        if not prefs:
            ctx.log_step("✅ Executed: getUserPreferences")
            return "No preferences set yet. Ask the user about their dietary restrictions, allergies, family size, cultural preferences, and nutritional goals."
        
        sanitized = sanitize_data_for_display(prefs)
        
        # Build comprehensive output with ALL available fields
        result = "**User Preferences (Complete Data):**\n\n"
        
        # Core dietary preferences
        if sanitized.get("restrictions"):
            restrictions = sanitized['restrictions']
            if isinstance(restrictions, list):
                result += f"🥗 Dietary restrictions: {', '.join(str(r) for r in restrictions)}\n"
            else:
                result += f"🥗 Dietary restrictions: {restrictions}\n"
        
        if sanitized.get("goals"):
            goals = sanitized['goals']
            if isinstance(goals, list):
                result += f"🎯 Goals: {', '.join(str(g) for g in goals)}\n"
            else:
                result += f"🎯 Goals: {goals}\n"
        
        if sanitized.get("habits"):
            habits = sanitized['habits']
            if isinstance(habits, list):
                result += f"📋 Eating habits: {', '.join(str(h) for h in habits)}\n"
            else:
                result += f"📋 Eating habits: {habits}\n"
        
        # Personal info
        if sanitized.get("family_size"):
            result += f"👨‍👩‍👧‍👦 Family size: {sanitized['family_size']}\n"
        
        if sanitized.get("cultural_heritage"):
            result += f"🌍 Cultural heritage: {sanitized['cultural_heritage']}\n"
        
        # Notes and key info
        if sanitized.get("notes"):
            result += f"📝 Notes: {sanitized['notes']}\n"
        
        if sanitized.get("key_info"):
            key_info = sanitized['key_info']
            if isinstance(key_info, dict):
                result += f"ℹ️ Key info: {json.dumps(key_info, indent=2)}\n"
            else:
                result += f"ℹ️ Key info: {key_info}\n"
        
        # Inventory preferences (if stored here)
        if sanitized.get("inventory"):
            inv = sanitized['inventory']
            if isinstance(inv, list):
                result += f"📦 Stored inventory prefs: {', '.join(str(i) for i in inv)}\n"
            else:
                result += f"📦 Stored inventory prefs: {inv}\n"
        
        # Meal ratings history
        if sanitized.get("meal_ratings"):
            ratings = sanitized['meal_ratings']
            if isinstance(ratings, dict):
                result += f"⭐ Meal ratings: {json.dumps(ratings, indent=2)}\n"
            elif ratings:
                result += f"⭐ Meal ratings: {ratings}\n"
        
        # Swap preferences
        if sanitized.get("swap_preferences"):
            swaps = sanitized['swap_preferences']
            if isinstance(swaps, dict):
                result += f"🔄 Swap preferences: {json.dumps(swaps, indent=2)}\n"
            elif swaps:
                result += f"🔄 Swap preferences: {swaps}\n"
        
        # If no fields were set
        if result == "**User Preferences (Complete Data):**\n\n":
            result += "No specific preferences recorded yet.\n"
        
        ctx.log_step("✅ Executed: getUserPreferences")
        logger.info(f"Returning preferences with fields: {list(sanitized.keys())}")
        return result
        
    except Exception as e:
        logger.exception("getUserPreferences failed")
        ctx.log_step("❌ getUserPreferences failed")
        return f"Failed to get preferences: {str(e)}"


def handle_update_preferences(args: dict, ctx: HandlerContext) -> str:
    """
    Update user preferences.
    Accepts ANY field that exists in the database:
    restrictions, goals, habits, family_size, cultural_heritage, 
    notes, key_info, inventory, meal_ratings, swap_preferences
    
    Also maps common alternate names to database fields.
    """
    try:
        # Handle both {updates: {...}} and direct {...} formats
        updates = args.get("updates") or args
        if not updates:
            return "No updates provided."
        
        # Map common alternate field names to actual database fields
        field_mapping = {
            "dietary_restrictions": "restrictions",
            "allergies": "restrictions",
            "cuisine_preferences": "habits",
            "calorie_goal": "goals",
            "protein_goal": "goals",
            "dietary": "restrictions",
            "diet": "restrictions",
            "preferences": "notes",
            "info": "key_info",
            "ratings": "meal_ratings",
            "swaps": "swap_preferences",
        }
        
        # Valid database fields
        valid_fields = {
            "restrictions", "goals", "habits", "family_size", 
            "cultural_heritage", "notes", "key_info", 
            "inventory", "meal_ratings", "swap_preferences"
        }
        
        # Normalize fields
        normalized_updates = {}
        for key, value in updates.items():
            # Skip internal fields
            if key in ["user_id", "id", "created_at", "updated_at"]:
                continue
            
            # Map alternate field names
            actual_key = field_mapping.get(key.lower(), key)
            
            # Handle array merging for list fields
            if actual_key in ["restrictions", "goals", "habits", "inventory"]:
                existing = normalized_updates.get(actual_key, [])
                if isinstance(value, list):
                    existing.extend(value)
                else:
                    existing.append(str(value))
                normalized_updates[actual_key] = existing
            elif actual_key in valid_fields:
                # Direct assignment for other fields
                normalized_updates[actual_key] = value
            else:
                # Store unknown fields in key_info as a catch-all
                key_info = normalized_updates.get("key_info", {})
                if not isinstance(key_info, dict):
                    key_info = {}
                key_info[key] = value
                normalized_updates["key_info"] = key_info
                logger.info(f"Stored unknown field '{key}' in key_info")
        
        if not normalized_updates:
            return "No valid preference updates provided."
        
        logger.info(f"Updating preferences for {ctx.user_id}: {normalized_updates}")
        update_user_preferences(ctx.user_id, normalized_updates)
        
        # Verify update
        updated_prefs = get_user_preferences(ctx.user_id)
        logger.info(f"After update, preferences has fields: {list(updated_prefs.keys()) if updated_prefs else []}")
        
        ctx.log_step("✅ Executed: updateUserPreferences")
        return f"Updated your preferences with: {', '.join(normalized_updates.keys())}"
        
    except Exception as e:
        logger.exception("updateUserPreferences failed")
        ctx.log_step("❌ updateUserPreferences failed")
        return f"Failed to update preferences: {str(e)}"


def handle_create_preferences(args: dict, ctx: HandlerContext) -> str:
    """Create user preferences - accepts any valid field"""
    try:
        preferences = args.get("preferences") or args
        
        if not preferences:
            return "No preferences provided."
        
        logger.info(f"Creating preferences for {ctx.user_id}: {preferences}")
        update_user_preferences(ctx.user_id, preferences)
        
        ctx.log_step("✅ Executed: createUserPreferences")
        return "Created your preferences."
        
    except Exception as e:
        logger.exception("createUserPreferences failed")
        ctx.log_step("❌ createUserPreferences failed")
        return f"Failed to create preferences: {str(e)}"
