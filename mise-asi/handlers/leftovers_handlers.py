"""
Leftovers Handlers
Maps to: src/hooks/chat/handlers/leftoverHandlers.ts and crudLeftoversHandlers.ts

IMPORTANT: Returns ALL data from database, not just specific fields.
Database fields: meal_name, servings, date_created, notes
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_leftovers, add_leftover_item, update_leftover_item, delete_leftover_item
from utils.logger import get_logger
from datetime import datetime

logger = get_logger(__name__)


def handle_leftovers_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """Handle leftovers function calls"""
    name = function_call["name"]
    args = function_call.get("args", {})
    
    logger.info(f"Leftovers handler called: {name} with args: {args}")
    
    if name == "getLeftovers":
        return handle_get_leftovers(ctx)
    elif name == "showLeftovers":
        return handle_show_leftovers(ctx)
    elif name in ["addLeftover", "createLeftoverItems"]:
        return handle_add_leftover(args, ctx)
    elif name == "updateLeftover":
        return handle_update_leftover(args, ctx)
    elif name == "adjustLeftoverServings":
        return handle_adjust_servings(args, ctx)
    elif name in ["removeLeftover", "deleteLeftoverItem"]:
        return handle_remove_leftover(args, ctx)
    
    return f"Unknown leftovers function: {name}"


def handle_get_leftovers(ctx: HandlerContext) -> str:
    """
    Get all leftovers - returns ALL data from the database.
    Database fields: meal_name, servings, date_created, notes
    """
    try:
        leftovers = get_user_leftovers(ctx.user_id)
        
        if not leftovers:
            ctx.log_step("✅ Executed: getLeftovers")
            return "No leftovers stored. When the user has leftover meals, they can tell you to save them."
        
        sanitized = sanitize_data_for_display(leftovers)
        
        # Return COMPLETE data for each leftover
        result = "**Current Leftovers (Complete Data):**\n\n"
        for item in sanitized:
            meal_name = item.get('meal_name', 'Unknown')
            servings = item.get('servings', 0)
            date_created = item.get('date_created', '')
            notes = item.get('notes', '')
            
            result += f"**{meal_name}**\n"
            result += f"  - Servings: {servings}\n"
            if date_created:
                result += f"  - Created: {date_created}\n"
            if notes:
                result += f"  - Notes: {notes}\n"
            
            # Include any other fields that might be in the data
            for key, value in item.items():
                if key not in ['meal_name', 'servings', 'date_created', 'notes'] and value:
                    result += f"  - {key}: {value}\n"
            
            result += "\n"
        
        ctx.log_step("✅ Executed: getLeftovers")
        logger.info(f"Returning {len(leftovers)} leftovers with all fields")
        return result
        
    except Exception as e:
        logger.exception("getLeftovers failed")
        ctx.log_step("❌ getLeftovers failed")
        return f"Failed to get leftovers: {str(e)}"


def handle_show_leftovers(ctx: HandlerContext) -> str:
    """Show leftovers panel"""
    ctx.log_step("✅ Executed: showLeftovers")
    return "Opening your leftovers..."


def handle_add_leftover(args: dict, ctx: HandlerContext) -> str:
    """Add a leftover - accepts any valid field"""
    try:
        # Handle both single item and array format
        items = args.get("items", [args]) if args.get("items") else [args]
        
        added_names = []
        
        # Get count before
        leftovers_before = get_user_leftovers(ctx.user_id)
        count_before = len(leftovers_before)
        
        for item in items:
            # Accept multiple field name variations
            meal_name = item.get("meal_name") or item.get("name") or item.get("meal")
            if not meal_name:
                logger.warning(f"Skipping leftover item with no meal_name: {item}")
                continue
            
            # Build leftover data with ALL provided fields
            leftover_data = {
                "meal_name": str(meal_name),
                "servings": item.get("servings", 1),
                "notes": item.get("notes", "") or item.get("description", "")
            }
            
            # Add date_created if provided
            if item.get("date_created"):
                leftover_data["date_created"] = item["date_created"]
            elif item.get("date"):
                leftover_data["date_created"] = item["date"]
            else:
                # Default to today
                leftover_data["date_created"] = datetime.now().strftime("%Y-%m-%d")
            
            logger.info(f"Adding leftover for user {ctx.user_id}: {leftover_data}")
            add_leftover_item(ctx.user_id, leftover_data)
            added_names.append(meal_name)
        
        if not added_names:
            return "No valid leftover items provided. Please include a meal name."
        
        # Verify by getting count after  
        leftovers_after = get_user_leftovers(ctx.user_id)
        count_after = len(leftovers_after)
        
        if count_after > count_before:
            ctx.log_step("✅ Executed: addLeftover")
            logger.info(f"Successfully added leftovers. Before: {count_before}, After: {count_after}")
            return f"Added leftover(s): {', '.join(added_names)}. You now have {count_after} leftover(s) saved."
        else:
            ctx.log_step("⚠️ addLeftover: verification uncertain")
            logger.warning(f"Leftover count didn't increase. Before: {count_before}, After: {count_after}")
            return f"Attempted to add: {', '.join(added_names)}. Current leftover count: {count_after}."
        
    except Exception as e:
        logger.exception("addLeftover failed")
        ctx.log_step("❌ addLeftover failed")
        return f"Failed to add leftover: {str(e)}"


def handle_update_leftover(args: dict, ctx: HandlerContext) -> str:
    """Update a leftover by meal name - accepts any valid field"""
    try:
        # Accept multiple field name variations
        meal_name = args.get("meal_name") or args.get("name") or args.get("meal")
        if not meal_name:
            return "Meal name is required to update a leftover."
        
        leftovers = get_user_leftovers(ctx.user_id)
        
        # Case-insensitive search
        leftover = next(
            (l for l in leftovers if l.get("meal_name", "").lower() == meal_name.lower()), 
            None
        )
        
        if not leftover:
            # Try partial match
            leftover = next(
                (l for l in leftovers if meal_name.lower() in l.get("meal_name", "").lower()), 
                None
            )
        
        if not leftover:
            available = [l.get("meal_name", "") for l in leftovers]
            return f"Leftover '{meal_name}' not found. Available leftovers: {', '.join(available) if available else 'none'}"
        
        # Build updates from ALL provided fields
        updates = {}
        for key, value in args.items():
            if key in ["meal_name", "name", "meal"]:
                continue  # Skip the identifier
            if value is not None:
                updates[key] = value
        
        if not updates:
            return "No updates provided. Specify servings, notes, or other fields to update."
        
        logger.info(f"Updating leftover {leftover['id']} with: {updates}")
        update_leftover_item(leftover["id"], updates)
        
        ctx.log_step("✅ Executed: updateLeftover")
        return f"Updated '{leftover.get('meal_name')}' leftover with: {', '.join(updates.keys())}"
        
    except Exception as e:
        logger.exception("updateLeftover failed")
        ctx.log_step("❌ updateLeftover failed")
        return f"Failed to update leftover: {str(e)}"


def handle_adjust_servings(args: dict, ctx: HandlerContext) -> str:
    """Adjust leftover servings"""
    try:
        meal_name = args.get("meal_name") or args.get("name") or args.get("meal")
        adjustment = args.get("adjustment", 0)
        
        if not meal_name:
            return "Meal name is required."
        
        leftovers = get_user_leftovers(ctx.user_id)
        
        # Case-insensitive search
        leftover = next(
            (l for l in leftovers if l.get("meal_name", "").lower() == meal_name.lower()), 
            None
        )
        
        if not leftover:
            # Try partial match
            leftover = next(
                (l for l in leftovers if meal_name.lower() in l.get("meal_name", "").lower()), 
                None
            )
        
        if not leftover:
            return f"Leftover '{meal_name}' not found."
        
        new_servings = leftover.get("servings", 0) + adjustment
        
        if new_servings <= 0:
            logger.info(f"Deleting leftover {leftover['id']} - servings would be {new_servings}")
            delete_leftover_item(leftover["id"])
            ctx.log_step("✅ Executed: adjustLeftoverServings (removed)")
            return f"'{leftover.get('meal_name')}' has been finished and removed."
        
        logger.info(f"Adjusting leftover {leftover['id']} servings to {new_servings}")
        update_leftover_item(leftover["id"], {"servings": new_servings})
        
        ctx.log_step("✅ Executed: adjustLeftoverServings")
        return f"'{leftover.get('meal_name')}' now has {new_servings} servings."
        
    except Exception as e:
        logger.exception("adjustLeftoverServings failed")
        ctx.log_step("❌ adjustLeftoverServings failed")
        return f"Failed to adjust servings: {str(e)}"


def handle_remove_leftover(args: dict, ctx: HandlerContext) -> str:
    """Remove a leftover"""
    try:
        meal_name = args.get("meal_name") or args.get("name") or args.get("meal")
        if not meal_name:
            return "Meal name is required to remove a leftover."
        
        leftovers = get_user_leftovers(ctx.user_id)
        
        # Case-insensitive search
        leftover = next(
            (l for l in leftovers if l.get("meal_name", "").lower() == meal_name.lower()), 
            None
        )
        
        if not leftover:
            # Try partial match
            leftover = next(
                (l for l in leftovers if meal_name.lower() in l.get("meal_name", "").lower()), 
                None
            )
        
        if not leftover:
            available = [l.get("meal_name", "") for l in leftovers]
            return f"Leftover '{meal_name}' not found. Available leftovers: {', '.join(available) if available else 'none'}"
        
        logger.info(f"Removing leftover {leftover['id']} ({leftover.get('meal_name')})")
        delete_leftover_item(leftover["id"])
        
        # Verify removal
        leftovers_after = get_user_leftovers(ctx.user_id)
        count_after = len(leftovers_after)
        
        ctx.log_step("✅ Executed: removeLeftover")
        return f"Removed '{leftover.get('meal_name')}' from leftovers. You now have {count_after} leftover(s)."
        
    except Exception as e:
        logger.exception("removeLeftover failed")
        ctx.log_step("❌ removeLeftover failed")
        return f"Failed to remove leftover: {str(e)}"
