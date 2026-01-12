"""
Inventory tool schemas
Maps to: src/lib/functions/inventoryTools.ts and crudInventoryTools.ts
"""

# Categories matching INVENTORY_CATEGORIES from useInventory.ts
INVENTORY_CATEGORIES = {
    "produce": "Produce",
    "dairy": "Dairy & Eggs",
    "meat": "Meat & Seafood",
    "grains": "Grains & Pasta",
    "canned": "Canned Goods",
    "frozen": "Frozen",
    "condiments": "Condiments & Sauces",
    "spices": "Spices & Seasonings",
    "beverages": "Beverages",
    "snacks": "Snacks",
    "baking": "Baking",
    "other": "Other"
}

category_descriptions = ", ".join(INVENTORY_CATEGORIES.values())

# Legacy tools - matching inventoryTools.ts
update_inventory_tool = {
    "name": "updateInventory",
    "description": "Adds or updates one or more items in the user's home inventory/pantry. Use this when the user mentions buying groceries, using up ingredients, or listing items they have on hand.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "description": "A list of items to add or update in the inventory.",
                "items": {
                    "type": "object",
                    "properties": {
                        "item_name": {"type": "string", "description": "The name of the item (e.g., 'Flour', 'Chicken Breast')."},
                        "quantity": {"type": "number", "description": "The quantity of the item."},
                        "unit": {"type": "string", "description": "The unit of measurement (e.g., 'kg', 'lbs', 'cups', 'piece')."},
                        "category": {"type": "string", "description": f"The category of the item. Must be one of: {category_descriptions}"},
                        "location": {"type": "string", "description": "Optional. Where the item is stored (e.g., 'pantry', 'fridge', 'freezer')."},
                        "notes": {"type": "string", "description": "Optional. Any notes about the item."}
                    },
                    "required": ["item_name", "quantity", "unit", "category"]
                }
            }
        },
        "required": ["items"]
    }
}

get_inventory_tool = {
    "name": "getInventory",
    "description": "Retrieves and displays the user's current home inventory/pantry list. Use this when the user asks to see what they have.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

# CRUD tools - matching crudInventoryTools.ts
get_inventory_items_tool = {
    "name": "getInventoryItems",
    "description": "Get all inventory items for the current user with optional filtering.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {"type": "string", "description": "Optional category to filter by"},
            "location": {"type": "string", "description": "Optional location to filter by"}
        },
        "required": []
    }
}

create_inventory_items_tool = {
    "name": "createInventoryItems",
    "description": "Create one or more new inventory items.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "item_name": {"type": "string"},
                        "quantity": {"type": "number"},
                        "unit": {"type": "string"},
                        "category": {"type": "string"},
                        "location": {"type": "string"},
                        "notes": {"type": "string"}
                    },
                    "required": ["item_name", "quantity", "unit", "category"]
                }
            }
        },
        "required": ["items"]
    }
}

update_inventory_item_tool = {
    "name": "updateInventoryItem",
    "description": "Update an existing inventory item by name.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_name": {"type": "string", "description": "Name of the item to update"},
            "updates": {
                "type": "object",
                "properties": {
                    "quantity": {"type": "number"},
                    "unit": {"type": "string"},
                    "category": {"type": "string"},
                    "location": {"type": "string"},
                    "notes": {"type": "string"}
                }
            }
        },
        "required": ["item_name", "updates"]
    }
}

delete_inventory_item_tool = {
    "name": "deleteInventoryItem",
    "description": "Delete an inventory item by name.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_name": {"type": "string", "description": "Name of the item to delete"}
        },
        "required": ["item_name"]
    }
}
