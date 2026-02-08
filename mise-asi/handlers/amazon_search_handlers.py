"""
Amazon Search Handlers
Maps to: src/hooks/chat/handlers/amazonSearchHandlers.ts

Uses RapidAPI Real-Time Amazon Data API for product searches.
Caches results in Supabase amazon_search_cache table.
"""
from handlers.types import FunctionCall, HandlerContext
from services.amazon_api_service import (
    search_product,
    search_shopping_list_items,
)
from utils import get_logger
from utils.supabase_client import (
    get_amazon_search_cache,
    save_amazon_search_cache,
    clear_amazon_search_cache,
)

logger = get_logger(__name__)


def handle_amazon_search_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """Handle Amazon search function calls"""
    name = function_call["name"]
    args = function_call.get("args", {})
    
    logger.info(f"Amazon search handler called: {name} with args: {args}")
    
    if name == "searchAmazonProduct":
        return handle_search_product(args, ctx)
    elif name == "searchMultipleAmazonProducts":
        return handle_search_multiple(args, ctx)
    elif name == "searchShoppingListOnAmazon":
        return handle_search_shopping_list(args, ctx)
    elif name == "getAmazonSearchResults":
        return handle_get_results(ctx)
    elif name == "clearAmazonSearchCache":
        return handle_clear_cache(ctx)
    
    return f"Unknown Amazon search function: {name}"


def _format_single_product(product: dict, search_query: str = None) -> str:
    """Format a single product as a clean card display."""
    title = product.get("product_title", product.get("title", "Unknown"))
    price = product.get("product_price", product.get("price", "N/A"))
    rating = product.get("product_star_rating", product.get("rating", "N/A"))
    num_ratings = product.get("product_num_ratings", product.get("reviews", 0))
    url = product.get("product_url", product.get("url", ""))
    is_prime = product.get("is_prime", False)
    asin = product.get("asin", "")
    image = product.get("product_photo", product.get("image", ""))
    
    lines = []
    
    # Title (truncated for cleaner display)
    display_title = title[:70] + "..." if len(title) > 70 else title
    lines.append(f"**{display_title}**")
    
    # Price and rating on same line
    prime_badge = " • Prime ✓" if is_prime else ""
    rating_text = f"⭐ {rating}" if rating != "N/A" else ""
    reviews_text = f"({num_ratings:,} reviews)" if num_ratings else ""
    
    lines.append(f"💰 **{price}** {rating_text} {reviews_text}{prime_badge}")
    
    # Amazon link
    if url:
        lines.append(f"[View on Amazon]({url})")
    
    return "\n".join(lines)


def handle_search_product(args: dict, ctx: HandlerContext) -> str:
    """Search for a single product on Amazon - returns best match only"""
    try:
        query = args.get("product_query", "")
        country = args.get("country", "US")
        
        if not query:
            return "Product query is required."
        
        ctx.log_step(f"Searching Amazon for: {query}")
        
        # Check Supabase cache first
        cached = get_amazon_search_cache(ctx.user_id, query, country)
        if cached:
            ctx.log_step(f"Using cached results for {query}")
            products = cached
        else:
            # Search Amazon API
            result = search_product(query, country=country)
            
            if not result.get("success"):
                ctx.log_step("searchAmazonProduct failed")
                return f"Amazon search failed: {result.get('error', 'Unknown error')}"
            
            products = result.get("products", [])
            
            # Save to Supabase cache
            if products:
                save_amazon_search_cache(ctx.user_id, query, products, country)
        
        if not products:
            ctx.log_step("searchAmazonProduct completed (no results)")
            return f"No products found for \"{query}\" on Amazon."
        
        # Get the best match (first result)
        product = products[0]
        
        lines = [
            f"**Amazon Result for \"{query}\"**",
            "",
            _format_single_product(product),
        ]
        
        ctx.log_step("searchAmazonProduct completed")
        return "\n".join(lines)
        
    except Exception as e:
        logger.exception("searchAmazonProduct failed")
        ctx.log_step("searchAmazonProduct failed")
        return f"Amazon search failed: {str(e)}"


def handle_search_multiple(args: dict, ctx: HandlerContext) -> str:
    """Search for multiple products on Amazon - one result per query"""
    try:
        queries = args.get("queries", [])
        country = args.get("country", "US")
        
        if not queries:
            return "No search queries provided."
        
        ctx.log_step(f"Searching Amazon for {len(queries)} products")
        
        # Check cache for each query, only search uncached ones
        uncached_queries = []
        cached_results = []
        
        for query in queries:
            cached = get_amazon_search_cache(ctx.user_id, query, country)
            if cached:
                first_product = cached[0] if cached else None
                if first_product:
                    cached_results.append({
                        "search_query": query,
                        "found": True,
                        "product": {
                            "title": first_product.get("product_title", "Unknown"),
                            "price": first_product.get("product_price", "N/A"),
                            "rating": first_product.get("product_star_rating", "N/A"),
                            "reviews": first_product.get("product_num_ratings", 0),
                            "url": first_product.get("product_url", ""),
                            "is_prime": first_product.get("is_prime", False),
                        }
                    })
                else:
                    uncached_queries.append(query)
            else:
                uncached_queries.append(query)
        
        # Search uncached queries via API
        api_results = []
        if uncached_queries:
            api_results = search_shopping_list_items(uncached_queries, country=country)
            # Cache each successful result
            for result in api_results:
                if result.get("found"):
                    query_name = result.get("search_query", "")
                    # We need the full product data for caching, search again for full data
                    full_result = search_product(query_name, country=country)
                    if full_result.get("success") and full_result.get("products"):
                        save_amazon_search_cache(ctx.user_id, query_name, full_result["products"], country)
        
        all_results = cached_results + api_results
        
        lines = [f"**Amazon Search Results ({len(queries)} items)**", ""]
        
        found_count = 0
        for result in all_results:
            query = result.get("search_query", "Unknown")
            
            if result.get("found"):
                found_count += 1
                product = result["product"]
                
                lines.append(f"**{query}**")
                lines.append(f"   {product['title'][:50]}...")
                lines.append(f"   {product['price']} | {product['rating']} stars")
                if product.get("url"):
                    lines.append(f"   [Buy on Amazon]({product['url']})")
            else:
                lines.append(f"**{query}** - Not found")
            
            lines.append("")
        
        lines.append(f"---")
        lines.append(f"Found **{found_count}/{len(queries)}** items on Amazon")
        
        ctx.log_step("searchMultipleAmazonProducts completed")
        return "\n".join(lines)
        
    except Exception as e:
        logger.exception("searchMultipleAmazonProducts failed")
        ctx.log_step("searchMultipleAmazonProducts failed")
        return f"Batch search failed: {str(e)}"


def handle_search_shopping_list(args: dict, ctx: HandlerContext) -> str:
    """Search for shopping list items on Amazon - one product per item"""
    try:
        items = args.get("items", [])
        country = args.get("country", "US")
        
        if not items:
            return "No shopping list items provided."
        
        ctx.log_step(f"Finding {len(items)} items on Amazon")
        
        # Check cache for each item, only API-search uncached ones
        uncached_items = []
        cached_results = []
        
        for item_name in items:
            cached = get_amazon_search_cache(ctx.user_id, item_name, country)
            if cached and len(cached) > 0:
                first_product = cached[0]
                cached_results.append({
                    "search_query": item_name,
                    "found": True,
                    "product": {
                        "title": first_product.get("product_title", "Unknown"),
                        "price": first_product.get("product_price", "N/A"),
                        "rating": first_product.get("product_star_rating", "N/A"),
                        "reviews": first_product.get("product_num_ratings", 0),
                        "url": first_product.get("product_url", ""),
                        "is_prime": first_product.get("is_prime", False),
                    }
                })
            else:
                uncached_items.append(item_name)
        
        # Search uncached items via API
        api_results = []
        if uncached_items:
            api_results = search_shopping_list_items(uncached_items, country=country)
            # Cache each successful result with full product data
            for result in api_results:
                if result.get("found"):
                    query_name = result.get("search_query", "")
                    full_result = search_product(query_name, country=country)
                    if full_result.get("success") and full_result.get("products"):
                        save_amazon_search_cache(ctx.user_id, query_name, full_result["products"], country)
        
        all_results = cached_results + api_results
        
        lines = ["**Your Shopping List on Amazon**", ""]
        
        found_count = 0
        total_estimated = 0
        
        for result in all_results:
            item_name = result.get("search_query", "Unknown")
            
            if result.get("found"):
                found_count += 1
                product = result["product"]
                title = product.get("title", "Unknown")[:55]
                price = product.get("price", "N/A")
                rating = product.get("rating", "N/A")
                url = product.get("url", "")
                is_prime = product.get("is_prime", False)
                
                # Try to parse price for total
                try:
                    price_val = float(price.replace("$", "").replace(",", "").split()[0])
                    total_estimated += price_val
                except Exception:
                    pass
                
                prime_badge = " (Prime)" if is_prime else ""
                lines.append(f"**{item_name}**{prime_badge}")
                lines.append(f"  {title}...")
                lines.append(f"  {price} | {rating} stars")
                if url:
                    lines.append(f"  [Buy on Amazon]({url})")
                lines.append("")
            else:
                lines.append(f"**{item_name}**")
                lines.append(f"  Not available on Amazon")
                lines.append("")
        
        # Summary footer
        lines.append("---")
        lines.append(f"**{found_count}/{len(items)}** items found")
        if total_estimated > 0:
            lines.append(f"Estimated total: **${total_estimated:.2f}**")
        
        ctx.log_step("searchShoppingListOnAmazon completed")
        return "\n".join(lines)
        
    except Exception as e:
        logger.exception("searchShoppingListOnAmazon failed")
        ctx.log_step("searchShoppingListOnAmazon failed")
        return f"Shopping list search failed: {str(e)}"


def handle_get_results(ctx: HandlerContext) -> str:
    """Get cached search results from Supabase"""
    from utils.supabase_client import get_supabase_client
    
    try:
        client = get_supabase_client()
        response = (
            client.table("amazon_search_cache")
            .select("product_query, updated_at")
            .eq("user_id", ctx.user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        
        if response.data and len(response.data) > 0:
            queries = [r["product_query"] for r in response.data[:10]]
            ctx.log_step("getAmazonSearchResults completed")
            return f"You have {len(response.data)} cached Amazon searches. Recent: {', '.join(queries)}."
        
        ctx.log_step("getAmazonSearchResults completed")
        return "No cached Amazon search results. Search for products first."
    except Exception as e:
        logger.exception("getAmazonSearchResults failed")
        ctx.log_step("getAmazonSearchResults failed")
        return "Could not retrieve cached results."


def handle_clear_cache(ctx: HandlerContext) -> str:
    """Clear cached results from Supabase"""
    try:
        count = clear_amazon_search_cache(ctx.user_id)
        ctx.log_step("clearAmazonSearchCache completed")
        if count > 0:
            return f"Cleared {count} cached Amazon search results."
        return "No cached Amazon results to clear."
    except Exception as e:
        logger.exception("clearAmazonSearchCache failed")
        ctx.log_step("clearAmazonSearchCache failed")
        return "Could not clear cached results."
