"""
Tools Registry
Aggregates all tool definitions - Maps to: src/lib/gemini/tools.ts
"""
from .schemas import (
    # Utility
    get_current_time_tool,
    # Inventory
    update_inventory_tool,
    get_inventory_tool,
    get_inventory_items_tool,
    create_inventory_items_tool,
    update_inventory_item_tool,
    delete_inventory_item_tool,
    # Shopping List
    show_shopping_list_tool,
    get_shopping_list_tool,
    add_to_shopping_list_tool,
    remove_from_shopping_list_tool,
    get_shopping_list_items_tool,
    create_shopping_list_items_tool,
    delete_shopping_list_items_tool,
    # Meals
    suggest_meal_tool,
    update_meal_plan_tool,
    # Preferences
    get_user_preferences_tool,
    update_user_preferences_tool,
    get_user_preferences_data_tool,
    create_user_preferences_tool,
    update_user_preferences_partial_tool,
    # Leftovers
    get_leftovers_tool,
    show_leftovers_tool,
    add_leftover_tool,
    update_leftover_tool,
    adjust_leftover_servings_tool,
    remove_leftover_tool,
    create_leftover_items_tool,
    delete_leftover_item_tool,
    # Notes
    update_user_notes_tool,
    # Amazon
    search_amazon_product_tool,
    search_multiple_amazon_products_tool,
    get_amazon_search_results_tool,
    clear_amazon_search_cache_tool,
)


# All tools aggregated - matching src/lib/gemini/tools.ts pattern
TOOLS = [
    # Original/Legacy tools
    suggest_meal_tool,
    show_shopping_list_tool,
    update_inventory_tool,
    get_inventory_tool,
    get_shopping_list_tool,
    add_to_shopping_list_tool,
    remove_from_shopping_list_tool,
    get_current_time_tool,
    get_user_preferences_tool,
    update_user_preferences_tool,
    get_leftovers_tool,
    add_leftover_tool,
    update_leftover_tool,
    adjust_leftover_servings_tool,
    remove_leftover_tool,
    show_leftovers_tool,
    update_user_notes_tool,
    
    # CRUD tools for Inventory
    get_inventory_items_tool,
    create_inventory_items_tool,
    update_inventory_item_tool,
    delete_inventory_item_tool,
    
    # CRUD tools for Shopping List
    get_shopping_list_items_tool,
    create_shopping_list_items_tool,
    delete_shopping_list_items_tool,
    
    # CRUD tools for Preferences
    get_user_preferences_data_tool,
    create_user_preferences_tool,
    update_user_preferences_partial_tool,
    
    # CRUD tools for Leftovers
    create_leftover_items_tool,
    delete_leftover_item_tool,
    
    # Meal Plan
    update_meal_plan_tool,
    
    # Amazon search tools
    search_amazon_product_tool,
    search_multiple_amazon_products_tool,
    get_amazon_search_results_tool,
    clear_amazon_search_cache_tool,
]


def get_tool_by_name(name: str) -> dict | None:
    """Get a tool definition by name"""
    for tool in TOOLS:
        if tool["name"] == name:
            return tool
    return None


def get_all_tool_names() -> list[str]:
    """Get list of all registered tool names"""
    return [tool["name"] for tool in TOOLS]
