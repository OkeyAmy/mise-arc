"""
Shopping List Handlers
Maps to: src/hooks/chat/handlers/shoppingListHandlers.ts and crudShoppingListHandlers.ts

IMPORTANT: Returns ALL data from database, not just specific fields.
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_shopping_list, add_shopping_list_items, remove_shopping_list_items
from utils.logger import get_logger

logger = get_logger(__name__)


def handle_shopping_list_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle shopping list function calls
    Maps to: handleShoppingListFunctions in shoppingListHandlers.ts
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    logger.info(f"Shopping list handler called: {name} with args: {args}")
    
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
    """
    Get all shopping list items - returns ALL data from the database.
    Database stores items as JSON array with fields: item, quantity, unit
    """
    try:
        items = get_user_shopping_list(ctx.user_id)
        
        if not items:
            ctx.log_step("✅ Executed: getShoppingList")
            return "Your shopping list is empty."
        
        sanitized = sanitize_data_for_display(items)
        
        result = "**Current Shopping List (Complete Data):**\n\n"
        for idx, item in enumerate(sanitized, 1):
            name = item.get("item", "Unknown")
            qty = item.get("quantity", "")
            unit = item.get("unit", "")
            
            if qty and unit:
                result += f"{idx}. {qty} {unit} {name}"
            elif qty:
                result += f"{idx}. {qty} {name}"
            else:
                result += f"{idx}. {name}"
            
            # Include any extra fields that might be in the data
            for key, value in item.items():
                if key not in ['item', 'quantity', 'unit'] and value:
                    result += f" | {key}: {value}"
            
            result += "\n"
        
        result += f"\n**Total: {len(items)} items**"
        
        ctx.log_step("✅ Executed: getShoppingList")
        logger.info(f"Returning {len(items)} shopping list items with all fields")
        return result
        
    except Exception as e:
        logger.exception("getShoppingList failed")
        ctx.log_step("❌ getShoppingList failed")
        return f"Failed to get shopping list: {str(e)}"


def handle_add_to_shopping_list(args: dict, ctx: HandlerContext) -> str:
    """Add items to shopping list - accepts various input formats"""
    try:
        items = args.get("items", [])
        if not items:
            logger.warning("addToShoppingList called with no items")
            return "No items provided to add."
        
        # Validate items structure - accept multiple field name variations
        validated_items = []
        for item in items:
            if isinstance(item, dict):
                # Accept multiple field name variations
                item_name = item.get("item") or item.get("name") or item.get("item_name")
                if item_name:
                    validated_item = {
                        "item": str(item_name),
                        "quantity": item.get("quantity", item.get("qty", item.get("amount", 1))),
                        "unit": str(item.get("unit", item.get("units", "")))
                    }
                    # Preserve any additional fields
                    for key, value in item.items():
                        if key not in ['item', 'name', 'item_name', 'quantity', 'qty', 'amount', 'unit', 'units'] and value:
                            validated_item[key] = value
                    validated_items.append(validated_item)
            elif isinstance(item, str):
                validated_items.append({
                    "item": item,
                    "quantity": 1,
                    "unit": ""
                })
        
        if not validated_items:
            logger.warning("addToShoppingList: no valid items after validation")
            return "No valid items to add. Please provide item names."
        
        logger.info(f"Adding {len(validated_items)} items to shopping list for user {ctx.user_id}")
        
        # Get count before
        items_before = get_user_shopping_list(ctx.user_id)
        count_before = len(items_before)
        
        # Add items
        add_shopping_list_items(ctx.user_id, validated_items)
        
        # Verify by getting count after
        items_after = get_user_shopping_list(ctx.user_id)
        count_after = len(items_after)
        
        item_names = [i.get("item", "") for i in validated_items]
        
        if count_after >= count_before:
            ctx.log_step("✅ Executed: addToShoppingList")
            logger.info(f"Successfully added items. Before: {count_before}, After: {count_after}")
            return f"Added {len(validated_items)} item(s) to your shopping list: {', '.join(item_names)}. Your list now has {count_after} items."
        else:
            ctx.log_step("⚠️ addToShoppingList may have failed")
            logger.warning(f"Item count didn't increase. Before: {count_before}, After: {count_after}")
            return f"Items may have been added but verification shows {count_after} items in your list."
        
    except Exception as e:
        logger.exception("addToShoppingList failed")
        ctx.log_step("❌ addToShoppingList failed")
        return f"Failed to add items: {str(e)}"


def handle_remove_from_shopping_list(args: dict, ctx: HandlerContext) -> str:
    """Remove items from shopping list - accepts various input formats"""
    try:
        item_names = args.get("item_names", [])
        if not item_names:
            # Try alternate parameter names
            item_names = args.get("items", [])
            if isinstance(item_names, list) and item_names and isinstance(item_names[0], dict):
                # Extract item names from dict objects
                item_names = [i.get("item") or i.get("name") or i.get("item_name", "") for i in item_names]
            # Also try singular forms
            if not item_names:
                single_item = args.get("item") or args.get("name") or args.get("item_name")
                if single_item:
                    item_names = [single_item]
        
        if not item_names:
            logger.warning("removeFromShoppingList called with no items")
            return "No items specified to remove."
        
        # Ensure all are strings
        item_names = [str(name) for name in item_names if name]
        
        logger.info(f"Removing items from shopping list for user {ctx.user_id}: {item_names}")
        
        # Get count before
        items_before = get_user_shopping_list(ctx.user_id)
        count_before = len(items_before)
        
        # Remove items
        remove_shopping_list_items(ctx.user_id, item_names)
        
        # Verify by getting count after
        items_after = get_user_shopping_list(ctx.user_id)
        count_after = len(items_after)
        
        if count_after <= count_before:
            ctx.log_step("✅ Executed: removeFromShoppingList")
            removed_count = count_before - count_after
            logger.info(f"Successfully removed items. Before: {count_before}, After: {count_after}")
            return f"Removed {removed_count} item(s) from your shopping list. Your list now has {count_after} items."
        else:
            ctx.log_step("⚠️ removeFromShoppingList: count unchanged")
            logger.warning(f"Item count didn't decrease. Before: {count_before}, After: {count_after}")
            return f"Could not find those items in your shopping list. Current list has {count_after} items."
        
    except Exception as e:
        logger.exception("removeFromShoppingList failed")
        ctx.log_step("❌ removeFromShoppingList failed")
        return f"Failed to remove items: {str(e)}"
