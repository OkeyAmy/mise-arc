"""
Supabase client for database access
Mirrors the connection pattern used in the root application
"""
from supabase import create_client, Client
from config import settings


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
    return response.data or []


def update_user_inventory(user_id: str, items: list[dict]) -> None:
    """Update or insert inventory items"""
    client = get_supabase_client()
    for item in items:
        item["user_id"] = user_id
        # Upsert based on item_name
        client.table("user_inventory").upsert(item, on_conflict="user_id,item_name").execute()


def get_user_shopping_list(user_id: str) -> list[dict]:
    """Get shopping list items for a user"""
    client = get_supabase_client()
    response = client.table("shopping_lists").select("*").eq("user_id", user_id).execute()
    return response.data or []


def add_shopping_list_items(user_id: str, items: list[dict]) -> None:
    """Add items to shopping list"""
    client = get_supabase_client()
    for item in items:
        item["user_id"] = user_id
        client.table("shopping_lists").insert(item).execute()


def remove_shopping_list_items(user_id: str, item_names: list[str]) -> None:
    """Remove items from shopping list by name"""
    client = get_supabase_client()
    for name in item_names:
        client.table("shopping_lists").delete().eq("user_id", user_id).eq("item", name).execute()


def get_user_preferences(user_id: str) -> dict | None:
    """Get user preferences"""
    client = get_supabase_client()
    response = client.table("user_preferences").select("*").eq("user_id", user_id).single().execute()
    return response.data


def update_user_preferences(user_id: str, updates: dict) -> None:
    """Update user preferences"""
    client = get_supabase_client()
    updates["user_id"] = user_id
    client.table("user_preferences").upsert(updates, on_conflict="user_id").execute()


def get_user_leftovers(user_id: str) -> list[dict]:
    """Get leftover items for a user"""
    client = get_supabase_client()
    response = client.table("user_leftovers").select("*").eq("user_id", user_id).execute()
    return response.data or []


def add_leftover_item(user_id: str, item: dict) -> None:
    """Add a leftover item"""
    client = get_supabase_client()
    item["user_id"] = user_id
    client.table("user_leftovers").insert(item).execute()


def update_leftover_item(leftover_id: str, updates: dict) -> None:
    """Update a leftover item"""
    client = get_supabase_client()
    client.table("user_leftovers").update(updates).eq("id", leftover_id).execute()


def delete_leftover_item(leftover_id: str) -> None:
    """Delete a leftover item"""
    client = get_supabase_client()
    client.table("user_leftovers").delete().eq("id", leftover_id).execute()


def update_user_notes(user_id: str, notes: str) -> None:
    """Update user notes (overwrites)"""
    client = get_supabase_client()
    client.table("user_preferences").upsert(
        {"user_id": user_id, "notes": notes}, 
        on_conflict="user_id"
    ).execute()
