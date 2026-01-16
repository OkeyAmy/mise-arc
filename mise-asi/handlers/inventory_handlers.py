"""
Inventory Handlers
Maps to: src/hooks/chat/handlers/inventoryHandlers.ts and crudInventoryHandlers.ts

IMPORTANT: Returns ALL data from database, not just specific fields.
Database fields: item_name, category, quantity, unit, expiry_date, location, notes
"""
from handlers.types import FunctionCall, HandlerContext, sanitize_data_for_display
from utils import get_user_inventory, update_user_inventory, get_supabase_client
from utils.logger import get_logger

logger = get_logger(__name__)


def handle_inventory_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle inventory function calls
    Maps to: handleInventoryFunctions in inventoryHandlers.ts
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    logger.info(f"Inventory handler called: {name} with args: {args}")
    
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
    """
    Get user's inventory - returns ALL data from the database.
    Database fields: item_name, category, quantity, unit, expiry_date, location, notes
    """
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
        
        inventory_details = "**Current Pantry and Refrigerator Inventory (Complete Data):**\n\n"
        
        for category, items in items_by_category.items():
            inventory_details += f"**{category}:**\n"
            for item in items:
                # Include ALL fields from the item
                name = item.get('item_name', 'Unknown')
                qty = item.get('quantity', '')
                unit = item.get('unit', '')
                
                line = f"- {qty} {unit} of {name}"
                
                if item.get("location"):
                    line += f" (stored in {item['location']})"
                if item.get("expiry_date"):
                    line += f" | expires: {item['expiry_date']}"
                if item.get("notes"):
                    line += f" | notes: {item['notes']}"
                
                # Include any other fields that might be in the data
                for key, value in item.items():
                    if key not in ['item_name', 'quantity', 'unit', 'location', 'expiry_date', 'notes', 'category'] and value:
                        line += f" | {key}: {value}"
                
                inventory_details += line + "\n"
            inventory_details += "\n"
        
        inventory_details += f"\n**Total: {len(inventory_items)} items**\n"
        inventory_details += "Use these ingredients to suggest meals that maximize the use of available items and minimize food waste."
        
        ctx.log_step("✅ Executed: getInventory")
        logger.info(f"Returning {len(inventory_items)} inventory items with all fields")
        return inventory_details
        
    except Exception as e:
        logger.exception("getInventory failed")
        ctx.log_step("❌ getInventory failed")
        return f"I had trouble fetching your inventory: {str(e)}"


def handle_update_inventory(args: dict, ctx: HandlerContext) -> str:
    """Update inventory items - accepts any valid field"""
    try:
        items = args.get("items", [])
        if not items:
            return "No items provided to update."
        
        # Validate and normalize items - accepting ALL fields
        validated_items = []
        for item in items:
            if isinstance(item, dict):
                # Accept multiple field name variations
                item_name = item.get("item_name") or item.get("name") or item.get("item")
                if item_name:
                    # Build item with ALL provided fields
                    validated_item = {"item_name": str(item_name)}
                    
                    # Map common fields
                    field_mappings = {
                        "quantity": ["quantity", "qty", "amount"],
                        "unit": ["unit", "units", "measure"],
                        "category": ["category", "type", "cat"],
                        "location": ["location", "stored", "place"],
                        "expiry_date": ["expiry_date", "expiry", "expires", "exp"],
                        "notes": ["notes", "note", "description"],
                    }
                    
                    for target_field, source_fields in field_mappings.items():
                        for src in source_fields:
                            if src in item and item[src] is not None:
                                validated_item[target_field] = item[src]
                                break
                    
                    # Set defaults for required fields
                    if "quantity" not in validated_item:
                        validated_item["quantity"] = 1
                    if "unit" not in validated_item:
                        validated_item["unit"] = ""
                    if "category" not in validated_item:
                        validated_item["category"] = "other"
                    if "location" not in validated_item:
                        validated_item["location"] = "pantry"
                    
                    validated_items.append(validated_item)
        
        if not validated_items:
            return "No valid items provided. Please include item names."
        
        # Get count before
        inventory_before = get_user_inventory(ctx.user_id)
        count_before = len(inventory_before)
        
        update_user_inventory(ctx.user_id, validated_items)
        
        # Get count after
        inventory_after = get_user_inventory(ctx.user_id)
        count_after = len(inventory_after)
        
        ctx.log_step("✅ Executed: updateInventory")
        logger.info(f"Updated inventory. Before: {count_before}, After: {count_after}")
        return f"I've updated your inventory with {len(validated_items)} item(s). Your inventory now has {count_after} items."
        
    except Exception as e:
        logger.exception("updateInventory failed")
        ctx.log_step("❌ updateInventory failed")
        return f"I had trouble updating your inventory: {str(e)}"


def handle_create_inventory_items(args: dict, ctx: HandlerContext) -> str:
    """Create inventory items - uses same logic as update"""
    return handle_update_inventory(args, ctx)


def handle_update_inventory_item(args: dict, ctx: HandlerContext) -> str:
    """Update a single inventory item by name - accepts any field"""
    try:
        item_name = args.get("item_name") or args.get("name") or args.get("item")
        updates = args.get("updates", {})
        
        # If no separate updates dict, treat remaining args as updates
        if not updates:
            updates = {k: v for k, v in args.items() if k not in ["item_name", "name", "item"]}
        
        if not item_name:
            return "Item name is required."
        
        # Get current inventory to find the item (case-insensitive)
        inventory = get_user_inventory(ctx.user_id)
        item = next(
            (i for i in inventory if i.get("item_name", "").lower() == item_name.lower()), 
            None
        )
        
        if not item:
            # Try partial match
            item = next(
                (i for i in inventory if item_name.lower() in i.get("item_name", "").lower()), 
                None
            )
        
        if not item:
            available = [i.get("item_name", "") for i in inventory[:10]]
            return f"Item '{item_name}' not found in inventory. Some available items: {', '.join(available) if available else 'none'}"
        
        if not updates:
            return "No updates provided. Specify fields to update (quantity, unit, category, location, expiry_date, notes)."
        
        # Merge updates
        updated_item = {**item, **updates}
        update_user_inventory(ctx.user_id, [updated_item])
        
        ctx.log_step("✅ Executed: updateInventoryItem")
        return f"Updated '{item.get('item_name')}' in your inventory with: {', '.join(updates.keys())}"
        
    except Exception as e:
        logger.exception("updateInventoryItem failed")
        ctx.log_step("❌ updateInventoryItem failed")
        return f"Failed to update item: {str(e)}"


def handle_delete_inventory_item(args: dict, ctx: HandlerContext) -> str:
    """Delete an inventory item by name"""
    try:
        item_name = args.get("item_name") or args.get("name") or args.get("item")
        if not item_name:
            return "Item name is required."
        
        # Get current inventory to verify item exists
        inventory = get_user_inventory(ctx.user_id)
        item = next(
            (i for i in inventory if i.get("item_name", "").lower() == item_name.lower()), 
            None
        )
        
        if not item:
            # Try partial match
            item = next(
                (i for i in inventory if item_name.lower() in i.get("item_name", "").lower()), 
                None
            )
        
        if not item:
            return f"Item '{item_name}' not found in inventory."
        
        actual_name = item.get("item_name")
        
        client = get_supabase_client()
        # Use correct table name: user_inventory
        result = client.table("user_inventory").delete().eq("user_id", ctx.user_id).eq("item_name", actual_name).execute()
        
        logger.info(f"Deleted inventory item '{actual_name}' for user {ctx.user_id}")
        
        # Verify deletion
        inventory_after = get_user_inventory(ctx.user_id)
        count_after = len(inventory_after)
        
        ctx.log_step("✅ Executed: deleteInventoryItem")
        return f"Removed '{actual_name}' from your inventory. You now have {count_after} items."
        
    except Exception as e:
        logger.exception("deleteInventoryItem failed")
        ctx.log_step("❌ deleteInventoryItem failed")
        return f"Failed to delete item: {str(e)}"
