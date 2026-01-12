"""
Shopping list tool schemas
Maps to: src/lib/functions/shoppingListTools.ts and crudShoppingListTools.ts
"""

# Legacy tools - matching shoppingListTools.ts
show_shopping_list_tool = {
    "name": "showShoppingList",
    "description": "Opens the shopping list panel in the UI to show users their current shopping list. Use when user wants to see their shopping list.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

get_shopping_list_tool = {
    "name": "getShoppingList",
    "description": "Retrieves the current shopping list items. Use to check what's on the list before making suggestions.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

add_to_shopping_list_tool = {
    "name": "addToShoppingList",
    "description": "Adds items to the user's shopping list.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "description": "Items to add to the shopping list",
                "items": {
                    "type": "object",
                    "properties": {
                        "item": {"type": "string", "description": "Name of the item"},
                        "quantity": {"type": "number", "description": "Quantity needed"},
                        "unit": {"type": "string", "description": "Unit of measurement"}
                    },
                    "required": ["item"]
                }
            }
        },
        "required": ["items"]
    }
}

remove_from_shopping_list_tool = {
    "name": "removeFromShoppingList",
    "description": "Removes items from the shopping list by name.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Names of items to remove"
            }
        },
        "required": ["item_names"]
    }
}

# CRUD tools - matching crudShoppingListTools.ts
get_shopping_list_items_tool = {
    "name": "getShoppingListItems",
    "description": "Get all shopping list items for the current user.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

create_shopping_list_items_tool = {
    "name": "createShoppingListItems",
    "description": "Create one or more new shopping list items.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "item": {"type": "string"},
                        "quantity": {"type": "number"},
                        "unit": {"type": "string"}
                    },
                    "required": ["item"]
                }
            }
        },
        "required": ["items"]
    }
}

delete_shopping_list_items_tool = {
    "name": "deleteShoppingListItems",
    "description": "Delete shopping list items by name.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Names of items to delete"
            }
        },
        "required": ["item_names"]
    }
}
