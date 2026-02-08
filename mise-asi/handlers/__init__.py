"""
Handlers Module
Exports all domain handlers - Maps to: src/hooks/chat/functionHandlers.ts
"""
from .types import FunctionCall, HandlerContext, sanitize_data_for_display
from .utility_handlers import handle_utility_functions
from .inventory_handlers import handle_inventory_functions
from .shopping_list_handlers import handle_shopping_list_functions
from .meal_handlers import handle_meal_functions
from .preferences_handlers import handle_preferences_functions
from .leftovers_handlers import handle_leftovers_functions
from .notes_handlers import handle_notes_functions
from .amazon_search_handlers import handle_amazon_search_functions


# Function handler mapping - matches functionHandlers in functionHandlers.ts
FUNCTION_HANDLERS = {
    # Utility
    "getCurrentTime": handle_utility_functions,
    
    # Inventory
    "updateInventory": handle_inventory_functions,
    "getInventory": handle_inventory_functions,
    "getInventoryItems": handle_inventory_functions,
    "createInventoryItems": handle_inventory_functions,
    "updateInventoryItem": handle_inventory_functions,
    "deleteInventoryItem": handle_inventory_functions,
    
    # Shopping List
    "showShoppingList": handle_shopping_list_functions,
    "getShoppingList": handle_shopping_list_functions,
    "addToShoppingList": handle_shopping_list_functions,
    "removeFromShoppingList": handle_shopping_list_functions,
    "getShoppingListItems": handle_shopping_list_functions,
    "createShoppingListItems": handle_shopping_list_functions,
    "deleteShoppingListItems": handle_shopping_list_functions,
    
    # Meals
    "suggestMeal": handle_meal_functions,
    "updateMealPlan": handle_meal_functions,
    
    # Preferences
    "getUserPreferences": handle_preferences_functions,
    "updateUserPreferences": handle_preferences_functions,
    "getUserPreferencesData": handle_preferences_functions,
    "createUserPreferences": handle_preferences_functions,
    "updateUserPreferencesPartial": handle_preferences_functions,
    
    # Leftovers
    "getLeftovers": handle_leftovers_functions,
    "showLeftovers": handle_leftovers_functions,
    "addLeftover": handle_leftovers_functions,
    "updateLeftover": handle_leftovers_functions,
    "adjustLeftoverServings": handle_leftovers_functions,
    "removeLeftover": handle_leftovers_functions,
    "createLeftoverItems": handle_leftovers_functions,
    "deleteLeftoverItem": handle_leftovers_functions,
    
    # Notes
    "updateUserNotes": handle_notes_functions,
    
    # Amazon Search
    "searchAmazonProduct": handle_amazon_search_functions,
    "searchMultipleAmazonProducts": handle_amazon_search_functions,
    "searchShoppingListOnAmazon": handle_amazon_search_functions,
    "getAmazonSearchResults": handle_amazon_search_functions,
    "clearAmazonSearchCache": handle_amazon_search_functions,
}


def handle_function_call(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Dispatch function call to appropriate handler
    Maps to: handleFunctionCall in functionHandlers.ts
    """
    name = function_call["name"]
    handler = FUNCTION_HANDLERS.get(name)
    
    if handler:
        return handler(function_call, ctx)
    
    return f"Function '{name}' is not handled by any known handler."


__all__ = [
    "FunctionCall",
    "HandlerContext",
    "sanitize_data_for_display",
    "FUNCTION_HANDLERS",
    "handle_function_call",
]
