"""
Inventory Handlers
Maps to: src/hooks/chat/handlers/inventoryHandlers.ts and crudInventoryHandlers.ts
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_inventory, update_user_inventory


def handle_inventory_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle inventory function calls
    Maps to: handleInventoryFunctions in inventoryHandlers.ts
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    if name == "getInventory" or name == "getInventoryItems":
        return handle_get_inventory(args, ctx)
    elif name == "updateInventory":
        return handle_update_inventory(args, ctx)
    elif name == "createInventoryItems":
        return handle_create_inventory_items(args, ctx)
    elif name == "updateInventoryItem":
        return handle_update_inventory_item(args, ctx)
    elif name == "deleteInventoryItem":
        return handle_delete_inventory_item(args, ctx)
    
    return f"Unknown inventory function: {name}"


def handle_get_inventory(args: dict, ctx: HandlerContext) -> str:
    """Get user's inventory - matches getInventory handler"""
    try:
        ctx.log_step("🔨 Retrieving current inventory data", "Loading all available ingredients", "active")
        
        inventory_items = get_user_inventory(ctx.user_id)
        
        if not inventory_items:
            ctx.log_step("✅ Executed: getInventory")
            return "The pantry and refrigerator are currently empty. The user will need to go shopping before you can suggest meals based on available ingredients. Ask them what they'd like to cook and help them create a shopping list."
        
        sanitized_data = sanitize_data_for_display(inventory_items)
        
        # Organize by category
        items_by_category: dict[str, list] = {}
        for item in sanitized_data:
            category = item.get("category", "Other")
            if category not in items_by_category:
                items_by_category[category] = []
            items_by_category[category].append(item)
        
        inventory_details = "Current pantry and refrigerator inventory:\n\n"
        
        for category, items in items_by_category.items():
            inventory_details += f"**{category}:**\n"
            for item in items:
                line = f"- {item.get('quantity', '')} {item.get('unit', '')} of {item.get('item_name', '')}"
                if item.get("location"):
                    line += f" (stored in {item['location']})"
                if item.get("notes"):
                    line += f" - Notes: {item['notes']}"
                inventory_details += line + "\n"
            inventory_details += "\n"
        
        inventory_details += "Use these ingredients to suggest meals that maximize the use of available items and minimize food waste."
        
        ctx.log_step("✅ Executed: getInventory")
        return inventory_details
        
    except Exception as e:
        ctx.log_step("❌ getInventory failed")
        return f"I had trouble fetching your inventory: {str(e)}"


def handle_update_inventory(args: dict, ctx: HandlerContext) -> str:
    """Update inventory items - matches updateInventory handler"""
    try:
        items = args.get("items", [])
        if not items:
            return "No items provided to update."
        
        update_user_inventory(ctx.user_id, items)
        
        ctx.log_step("✅ Executed: updateInventory")
        return "I've updated your inventory with the new items."
        
    except Exception as e:
        ctx.log_step("❌ updateInventory failed")
        return f"I had trouble updating your inventory: {str(e)}"


def handle_create_inventory_items(args: dict, ctx: HandlerContext) -> str:
    """Create inventory items - CRUD handler"""
    try:
        items = args.get("items", [])
        if not items:
            return "No items provided."
        
        update_user_inventory(ctx.user_id, items)
        
        ctx.log_step("✅ Executed: createInventoryItems")
        return f"Added {len(items)} item(s) to your inventory."
        
    except Exception as e:
        ctx.log_step("❌ createInventoryItems failed")
        return f"Failed to create inventory items: {str(e)}"


def handle_update_inventory_item(args: dict, ctx: HandlerContext) -> str:
    """Update a single inventory item by name"""
    try:
        item_name = args.get("item_name")
        updates = args.get("updates", {})
        
        if not item_name:
            return "Item name is required."
        
        # Get current inventory to find the item
        inventory = get_user_inventory(ctx.user_id)
        item = next((i for i in inventory if i.get("item_name") == item_name), None)
        
        if not item:
            return f"Item '{item_name}' not found in inventory."
        
        # Merge updates
        updated_item = {**item, **updates}
        update_user_inventory(ctx.user_id, [updated_item])
        
        ctx.log_step("✅ Executed: updateInventoryItem")
        return f"Updated '{item_name}' in your inventory."
        
    except Exception as e:
        ctx.log_step("❌ updateInventoryItem failed")
        return f"Failed to update item: {str(e)}"


def handle_delete_inventory_item(args: dict, ctx: HandlerContext) -> str:
    """Delete an inventory item by name"""
    try:
        from utils import get_supabase_client
        
        item_name = args.get("item_name")
        if not item_name:
            return "Item name is required."
        
        client = get_supabase_client()
        client.table("inventory").delete().eq("user_id", ctx.user_id).eq("item_name", item_name).execute()
        
        ctx.log_step("✅ Executed: deleteInventoryItem")
        return f"Removed '{item_name}' from your inventory."
        
    except Exception as e:
        ctx.log_step("❌ deleteInventoryItem failed")
        return f"Failed to delete item: {str(e)}"
