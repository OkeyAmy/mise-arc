"""
Tools Registry Schema Init
"""
from .utility_tools import get_current_time_tool
from .inventory_tools import (
    update_inventory_tool,
    get_inventory_tool,
    get_inventory_items_tool,
    create_inventory_items_tool,
    update_inventory_item_tool,
    delete_inventory_item_tool,
    INVENTORY_CATEGORIES,
)
from .shopping_list_tools import (
    show_shopping_list_tool,
    get_shopping_list_tool,
    add_to_shopping_list_tool,
    remove_from_shopping_list_tool,
    get_shopping_list_items_tool,
    create_shopping_list_items_tool,
    delete_shopping_list_items_tool,
)
from .meal_tools import suggest_meal_tool, update_meal_plan_tool
from .preferences_tools import (
    get_user_preferences_tool,
    update_user_preferences_tool,
    get_user_preferences_data_tool,
    create_user_preferences_tool,
    update_user_preferences_partial_tool,
)
from .leftovers_tools import (
    get_leftovers_tool,
    show_leftovers_tool,
    add_leftover_tool,
    update_leftover_tool,
    adjust_leftover_servings_tool,
    remove_leftover_tool,
    create_leftover_items_tool,
    delete_leftover_item_tool,
)
from .notes_tools import update_user_notes_tool
from .amazon_search_tools import (
    search_amazon_product_tool,
    search_multiple_amazon_products_tool,
    search_shopping_list_on_amazon_tool,
    get_amazon_search_results_tool,
    clear_amazon_search_cache_tool,
)

__all__ = [
    # Utility
    "get_current_time_tool",
    # Inventory
    "update_inventory_tool",
    "get_inventory_tool",
    "get_inventory_items_tool",
    "create_inventory_items_tool",
    "update_inventory_item_tool",
    "delete_inventory_item_tool",
    "INVENTORY_CATEGORIES",
    # Shopping List
    "show_shopping_list_tool",
    "get_shopping_list_tool",
    "add_to_shopping_list_tool",
    "remove_from_shopping_list_tool",
    "get_shopping_list_items_tool",
    "create_shopping_list_items_tool",
    "delete_shopping_list_items_tool",
    # Meals
    "suggest_meal_tool",
    "update_meal_plan_tool",
    # Preferences
    "get_user_preferences_tool",
    "update_user_preferences_tool",
    "get_user_preferences_data_tool",
    "create_user_preferences_tool",
    "update_user_preferences_partial_tool",
    # Leftovers
    "get_leftovers_tool",
    "show_leftovers_tool",
    "add_leftover_tool",
    "update_leftover_tool",
    "adjust_leftover_servings_tool",
    "remove_leftover_tool",
    "create_leftover_items_tool",
    "delete_leftover_item_tool",
    # Notes
    "update_user_notes_tool",
    # Amazon
    "search_amazon_product_tool",
    "search_multiple_amazon_products_tool",
    "search_shopping_list_on_amazon_tool",
    "get_amazon_search_results_tool",
    "clear_amazon_search_cache_tool",
]
