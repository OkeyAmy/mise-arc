"""
Shopping List Handlers
Maps to: src/hooks/chat/handlers/shoppingListHandlers.ts and crudShoppingListHandlers.ts
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_shopping_list, add_shopping_list_items, remove_shopping_list_items


def handle_shopping_list_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle shopping list function calls
    Maps to: handleShoppingListFunctions in shoppingListHandlers.ts
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    if name == "showShoppingList":
        return handle_show_shopping_list(ctx)
    elif name == "getShoppingList" or name == "getShoppingListItems":
        return handle_get_shopping_list(ctx)
    elif name == "addToShoppingList" or name == "createShoppingListItems":
        return handle_add_to_shopping_list(args, ctx)
    elif name == "removeFromShoppingList" or name == "deleteShoppingListItems":
        return handle_remove_from_shopping_list(args, ctx)
    
    return f"Unknown shopping list function: {name}"


def handle_show_shopping_list(ctx: HandlerContext) -> str:
    """Show shopping list panel"""
    ctx.log_step("✅ Executed: showShoppingList")
    return "Opening your shopping list..."


def handle_get_shopping_list(ctx: HandlerContext) -> str:
    """Get all shopping list items"""
    try:
        items = get_user_shopping_list(ctx.user_id)
        
        if not items:
            ctx.log_step("✅ Executed: getShoppingList")
            return "Your shopping list is empty."
        
        sanitized = sanitize_data_for_display(items)
        
        result = "Current shopping list:\n"
        for item in sanitized:
            name = item.get("item", "Unknown")
            qty = item.get("quantity", "")
            unit = item.get("unit", "")
            if qty and unit:
                result += f"- {qty} {unit} {name}\n"
            elif qty:
                result += f"- {qty} {name}\n"
            else:
                result += f"- {name}\n"
        
        ctx.log_step("✅ Executed: getShoppingList")
        return result
        
    except Exception as e:
        ctx.log_step("❌ getShoppingList failed")
        return f"Failed to get shopping list: {str(e)}"


def handle_add_to_shopping_list(args: dict, ctx: HandlerContext) -> str:
    """Add items to shopping list"""
    try:
        items = args.get("items", [])
        if not items:
            return "No items provided."
        
        add_shopping_list_items(ctx.user_id, items)
        
        item_names = [i.get("item", "") for i in items]
        
        ctx.log_step("✅ Executed: addToShoppingList")
        return f"Added {len(items)} items to your shopping list: {', '.join(item_names)}."
        
    except Exception as e:
        ctx.log_step("❌ addToShoppingList failed")
        return f"Failed to add items: {str(e)}"


def handle_remove_from_shopping_list(args: dict, ctx: HandlerContext) -> str:
    """Remove items from shopping list"""
    try:
        item_names = args.get("item_names", [])
        if not item_names:
            return "No items specified to remove."
        
        remove_shopping_list_items(ctx.user_id, item_names)
        
        ctx.log_step("✅ Executed: removeFromShoppingList")
        return f"Removed {len(item_names)} items from your shopping list."
        
    except Exception as e:
        ctx.log_step("❌ removeFromShoppingList failed")
        return f"Failed to remove items: {str(e)}"
