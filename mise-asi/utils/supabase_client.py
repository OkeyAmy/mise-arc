"""
Supabase client for database access
Mirrors the connection pattern used in the root application
"""
from supabase import create_client, Client
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

_client: Client | None = None


def get_supabase_client() -> Client:
    """Get or create Supabase client singleton"""
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError("Supabase URL and Key must be configured")
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client


def get_user_inventory(user_id: str) -> list[dict]:
    """Get inventory items for a user"""
    client = get_supabase_client()
    response = client.table("user_inventory").select("*").eq("user_id", user_id).execute()
    logger.info(f"get_user_inventory for {user_id}: found {len(response.data or [])} items")
    return response.data or []


def update_user_inventory(user_id: str, items: list[dict]) -> None:
    """Update or insert inventory items"""
    client = get_supabase_client()
    for item in items:
        item["user_id"] = user_id
        # Upsert based on item_name
        client.table("user_inventory").upsert(item, on_conflict="user_id,item_name").execute()
    logger.info(f"update_user_inventory for {user_id}: updated {len(items)} items")


def get_user_shopping_list(user_id: str) -> list[dict]:
    """
    Get shopping list items for a user.
    The shopping_lists table stores items as a JSON array in the 'items' column.
    """
    client = get_supabase_client()
    
    # Fetch the user's shopping list row - try with null meal_plan_id first
    # Using 'null' as a string as some Supabase versions expect this
    try:
        response = client.table("shopping_lists").select("items").eq("user_id", user_id).is_("meal_plan_id", "null").maybe_single().execute()
    except Exception as e:
        logger.warning(f"Query with is_('null') failed, trying alternative: {e}")
        # Fallback: get all shopping lists for user and pick the one without meal_plan_id
        response = client.table("shopping_lists").select("items, meal_plan_id").eq("user_id", user_id).execute()
        if response.data:
            # Find the row with null meal_plan_id
            for row in response.data:
                if row.get("meal_plan_id") is None:
                    logger.info(f"get_user_shopping_list for {user_id}: found {len(row.get('items', []))} items")
                    return row.get("items") or []
        return []
    
    if response.data and response.data.get("items"):
        items = response.data["items"]
        logger.info(f"get_user_shopping_list for {user_id}: found {len(items)} items")
        return items
    
    logger.info(f"get_user_shopping_list for {user_id}: no items found")
    return []


def add_shopping_list_items(user_id: str, items: list[dict]) -> None:
    """
    Add items to shopping list.
    The shopping_lists table stores a single row per user with items as JSON array.
    We need to fetch current items, merge with new items, and update the row.
    """
    client = get_supabase_client()
    logger.info(f"add_shopping_list_items for {user_id}: adding {len(items)} items: {items}")
    
    # Fetch current shopping list row - get all for user and filter in code
    response = client.table("shopping_lists").select("id, items, meal_plan_id").eq("user_id", user_id).execute()
    
    current_items = []
    existing_row_id = None
    
    if response.data:
        # Find the row with null meal_plan_id
        for row in response.data:
            if row.get("meal_plan_id") is None:
                existing_row_id = row.get("id")
                current_items = row.get("items") or []
                break
    
    logger.info(f"Existing shopping list row: {existing_row_id}, current items: {len(current_items)}")
    
    # Merge new items with existing items (with deduplication by item name)
    def normalize(name: str) -> str:
        return name.lower().strip()
    
    existing_names = {normalize(item.get("item", "")) for item in current_items}
    
    for item in items:
        item_name = normalize(item.get("item", ""))
        if item_name and item_name not in existing_names:
            current_items.append(item)
            existing_names.add(item_name)
            logger.info(f"Added new item: {item}")
        elif item_name:
            # Item exists - update quantity instead
            for existing in current_items:
                if normalize(existing.get("item", "")) == item_name:
                    # Add quantities if units match, otherwise replace
                    if existing.get("unit", "").lower() == item.get("unit", "").lower():
                        existing["quantity"] = existing.get("quantity", 0) + item.get("quantity", 1)
                    else:
                        existing["quantity"] = item.get("quantity", 1)
                        existing["unit"] = item.get("unit", "")
                    logger.info(f"Updated existing item: {existing}")
                    break
    
    if existing_row_id:
        # Update existing row
        result = client.table("shopping_lists").update({"items": current_items}).eq("id", existing_row_id).execute()
        logger.info(f"Updated shopping list row {existing_row_id}, result: {result.data}")
        
        # Verify the update worked
        verify = client.table("shopping_lists").select("items").eq("id", existing_row_id).single().execute()
        logger.info(f"Verification - items after update: {len(verify.data.get('items', []) if verify.data else [])} items")
    else:
        # Create new row
        result = client.table("shopping_lists").insert({
            "user_id": user_id,
            "items": current_items,
            "meal_plan_id": None
        }).execute()
        logger.info(f"Created new shopping list row, result: {result.data}")


def remove_shopping_list_items(user_id: str, item_names: list[str]) -> None:
    """
    Remove items from shopping list by name.
    Fetches current items, filters out the specified names, and updates the row.
    """
    client = get_supabase_client()
    logger.info(f"remove_shopping_list_items for {user_id}: removing {item_names}")
    
    # Fetch current shopping list row - get all for user and filter in code
    response = client.table("shopping_lists").select("id, items, meal_plan_id").eq("user_id", user_id).execute()
    
    existing_row_id = None
    current_items = []
    
    if response.data:
        # Find the row with null meal_plan_id
        for row in response.data:
            if row.get("meal_plan_id") is None:
                existing_row_id = row.get("id")
                current_items = row.get("items") or []
                break
    
    if not existing_row_id:
        logger.warning(f"No shopping list found for user {user_id}")
        return
    
    logger.info(f"Current items before removal: {len(current_items)}")
    
    # Filter out items that match the names to remove (case-insensitive)
    names_to_remove = {name.lower().strip() for name in item_names}
    filtered_items = [
        item for item in current_items 
        if item.get("item", "").lower().strip() not in names_to_remove
    ]
    
    logger.info(f"Items after filtering: {len(filtered_items)}")
    
    # Update the row with filtered items
    result = client.table("shopping_lists").update({"items": filtered_items}).eq("id", existing_row_id).execute()
    logger.info(f"Updated shopping list after removal, result: {result.data}")
    
    # Verify the update worked
    verify = client.table("shopping_lists").select("items").eq("id", existing_row_id).single().execute()
    logger.info(f"Verification - items after removal: {len(verify.data.get('items', []) if verify.data else [])} items")


def get_user_preferences(user_id: str) -> dict | None:
    """Get user preferences"""
    client = get_supabase_client()
    try:
        response = client.table("user_preferences").select("*").eq("user_id", user_id).maybe_single().execute()
        logger.info(f"get_user_preferences for {user_id}: {'found' if response.data else 'not found'}")
        return response.data
    except Exception as e:
        logger.warning(f"get_user_preferences failed: {e}")
        return None


def update_user_preferences(user_id: str, updates: dict) -> None:
    """Update user preferences"""
    client = get_supabase_client()
    updates["user_id"] = user_id
    result = client.table("user_preferences").upsert(updates, on_conflict="user_id").execute()
    logger.info(f"update_user_preferences for {user_id}: updated")


def get_user_leftovers(user_id: str) -> list[dict]:
    """Get leftover items for a user"""
    client = get_supabase_client()
    response = client.table("user_leftovers").select("*").eq("user_id", user_id).execute()
    logger.info(f"get_user_leftovers for {user_id}: found {len(response.data or [])} items")
    return response.data or []


def add_leftover_item(user_id: str, item: dict) -> None:
    """Add a leftover item"""
    client = get_supabase_client()
    item["user_id"] = user_id
    result = client.table("user_leftovers").insert(item).execute()
    logger.info(f"add_leftover_item for {user_id}: added {item.get('meal_name', 'unknown')}")
    
    # Verify the insert worked
    if result.data:
        logger.info(f"Leftover added successfully with id: {result.data[0].get('id') if result.data else 'unknown'}")


def update_leftover_item(leftover_id: str, updates: dict) -> None:
    """Update a leftover item"""
    client = get_supabase_client()
    result = client.table("user_leftovers").update(updates).eq("id", leftover_id).execute()
    logger.info(f"update_leftover_item {leftover_id}: updated with {updates}")


def delete_leftover_item(leftover_id: str) -> None:
    """Delete a leftover item"""
    client = get_supabase_client()
    result = client.table("user_leftovers").delete().eq("id", leftover_id).execute()
    logger.info(f"delete_leftover_item: deleted {leftover_id}")


def update_user_notes(user_id: str, notes: str) -> None:
    """Update user notes (overwrites)"""
    client = get_supabase_client()
    result = client.table("user_preferences").upsert(
        {"user_id": user_id, "notes": notes}, 
        on_conflict="user_id"
    ).execute()
    logger.info(f"update_user_notes for {user_id}: updated")


# ========================
# Amazon Search Cache
# ========================

def get_amazon_search_cache(user_id: str, product_query: str, country: str = "US") -> list[dict] | None:
    """
    Get cached Amazon search results for a specific query.
    Returns the search_results array or None if not found.
    """
    client = get_supabase_client()
    try:
        response = (
            client.table("amazon_search_cache")
            .select("search_results, updated_at")
            .eq("user_id", user_id)
            .eq("product_query", product_query.lower().strip())
            .eq("country", country)
            .maybe_single()
            .execute()
        )
        if response.data and response.data.get("search_results"):
            logger.info(f"get_amazon_search_cache for {user_id}/{product_query}: cache hit")
            return response.data["search_results"]
        logger.info(f"get_amazon_search_cache for {user_id}/{product_query}: cache miss")
        return None
    except Exception as e:
        logger.warning(f"get_amazon_search_cache failed: {e}")
        return None


def save_amazon_search_cache(user_id: str, product_query: str, search_results: list[dict], country: str = "US") -> None:
    """
    Save or update Amazon search results in the cache.
    Uses upsert with the unique constraint (user_id, product_query, country).
    """
    client = get_supabase_client()
    try:
        from datetime import datetime, timezone
        result = (
            client.table("amazon_search_cache")
            .upsert(
                {
                    "user_id": user_id,
                    "product_query": product_query.lower().strip(),
                    "country": country,
                    "search_results": search_results,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="user_id,product_query,country",
            )
            .execute()
        )
        logger.info(f"save_amazon_search_cache for {user_id}/{product_query}: saved {len(search_results)} products")
    except Exception as e:
        logger.error(f"save_amazon_search_cache failed: {e}")


def clear_amazon_search_cache(user_id: str, product_query: str | None = None, country: str = "US") -> int:
    """
    Clear Amazon search cache. If product_query is provided, clear that specific entry.
    Otherwise, clear all entries for the user.
    Returns the number of rows deleted.
    """
    client = get_supabase_client()
    try:
        query = client.table("amazon_search_cache").delete().eq("user_id", user_id)
        if product_query:
            query = query.eq("product_query", product_query.lower().strip()).eq("country", country)
        result = query.execute()
        count = len(result.data) if result.data else 0
        logger.info(f"clear_amazon_search_cache for {user_id}: cleared {count} entries")
        return count
    except Exception as e:
        logger.error(f"clear_amazon_search_cache failed: {e}")
        return 0
