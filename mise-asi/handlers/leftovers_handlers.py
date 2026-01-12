"""
Leftovers Handlers
Maps to: src/hooks/chat/handlers/leftoverHandlers.ts and crudLeftoversHandlers.ts
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_leftovers, add_leftover_item, update_leftover_item, delete_leftover_item


def handle_leftovers_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """Handle leftovers function calls"""
    name = function_call["name"]
    args = function_call.get("args", {})
    
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
    """Get all leftovers"""
    try:
        leftovers = get_user_leftovers(ctx.user_id)
        
        if not leftovers:
            ctx.log_step("✅ Executed: getLeftovers")
            return "No leftovers stored. When the user has leftover meals, they can tell you to save them."
        
        sanitized = sanitize_data_for_display(leftovers)
        
        result = "**Current Leftovers:**\n"
        for item in sanitized:
            result += f"- {item.get('meal_name', 'Unknown')}: {item.get('servings', 0)} servings"
            if item.get("notes"):
                result += f" ({item['notes']})"
            result += "\n"
        
        ctx.log_step("✅ Executed: getLeftovers")
        return result
        
    except Exception as e:
        ctx.log_step("❌ getLeftovers failed")
        return f"Failed to get leftovers: {str(e)}"


def handle_show_leftovers(ctx: HandlerContext) -> str:
    """Show leftovers panel"""
    ctx.log_step("✅ Executed: showLeftovers")
    return "Opening your leftovers..."


def handle_add_leftover(args: dict, ctx: HandlerContext) -> str:
    """Add a leftover"""
    try:
        # Handle both single item and array format
        items = args.get("items", [args])
        
        for item in items:
            add_leftover_item(ctx.user_id, {
                "meal_name": item.get("meal_name"),
                "servings": item.get("servings", 1),
                "date_created": item.get("date_created"),
                "notes": item.get("notes", "")
            })
        
        ctx.log_step("✅ Executed: addLeftover")
        names = [i.get("meal_name", "") for i in items]
        return f"Added leftover(s): {', '.join(names)}"
        
    except Exception as e:
        ctx.log_step("❌ addLeftover failed")
        return f"Failed to add leftover: {str(e)}"


def handle_update_leftover(args: dict, ctx: HandlerContext) -> str:
    """Update a leftover by meal name"""
    try:
        meal_name = args.get("meal_name")
        if not meal_name:
            return "Meal name is required."
        
        leftovers = get_user_leftovers(ctx.user_id)
        leftover = next((l for l in leftovers if l.get("meal_name") == meal_name), None)
        
        if not leftover:
            return f"Leftover '{meal_name}' not found."
        
        updates = {}
        if "servings" in args:
            updates["servings"] = args["servings"]
        if "notes" in args:
            updates["notes"] = args["notes"]
        
        update_leftover_item(leftover["id"], updates)
        
        ctx.log_step("✅ Executed: updateLeftover")
        return f"Updated '{meal_name}' leftover."
        
    except Exception as e:
        ctx.log_step("❌ updateLeftover failed")
        return f"Failed to update leftover: {str(e)}"


def handle_adjust_servings(args: dict, ctx: HandlerContext) -> str:
    """Adjust leftover servings"""
    try:
        meal_name = args.get("meal_name")
        adjustment = args.get("adjustment", 0)
        
        leftovers = get_user_leftovers(ctx.user_id)
        leftover = next((l for l in leftovers if l.get("meal_name") == meal_name), None)
        
        if not leftover:
            return f"Leftover '{meal_name}' not found."
        
        new_servings = leftover.get("servings", 0) + adjustment
        
        if new_servings <= 0:
            delete_leftover_item(leftover["id"])
            ctx.log_step("✅ Executed: adjustLeftoverServings (removed)")
            return f"'{meal_name}' has been finished and removed."
        
        update_leftover_item(leftover["id"], {"servings": new_servings})
        
        ctx.log_step("✅ Executed: adjustLeftoverServings")
        return f"'{meal_name}' now has {new_servings} servings."
        
    except Exception as e:
        ctx.log_step("❌ adjustLeftoverServings failed")
        return f"Failed to adjust servings: {str(e)}"


def handle_remove_leftover(args: dict, ctx: HandlerContext) -> str:
    """Remove a leftover"""
    try:
        meal_name = args.get("meal_name")
        if not meal_name:
            return "Meal name is required."
        
        leftovers = get_user_leftovers(ctx.user_id)
        leftover = next((l for l in leftovers if l.get("meal_name") == meal_name), None)
        
        if not leftover:
            return f"Leftover '{meal_name}' not found."
        
        delete_leftover_item(leftover["id"])
        
        ctx.log_step("✅ Executed: removeLeftover")
        return f"Removed '{meal_name}' from leftovers."
        
    except Exception as e:
        ctx.log_step("❌ removeLeftover failed")
        return f"Failed to remove leftover: {str(e)}"
