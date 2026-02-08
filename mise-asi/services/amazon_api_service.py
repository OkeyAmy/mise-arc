"""
Amazon API Service
Handles RapidAPI calls to Amazon Data Scraper

Uses the Real-Time Amazon Data API from RapidAPI:
https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data
"""
import requests
from typing import Optional
from config import settings
from utils import get_logger

logger = get_logger(__name__)

# RapidAPI configuration
RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com"


def get_headers() -> dict:
    """Get headers for RapidAPI requests."""
    return {
        "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }


def search_product(query: str, country: str = "US", page: int = 1) -> dict:
    """
    Search for a product on Amazon.
    
    Args:
        query: Product search query
        country: Country code (US, UK, DE, etc.)
        page: Page number (1-indexed)
    
    Returns:
        dict with search results including products array (limited to 1 product to save API usage)
    """
    if not settings.RAPIDAPI_KEY:
        logger.error("RAPIDAPI_KEY not configured")
        return {"error": "RapidAPI key not configured", "products": []}
    
    url = f"https://{RAPIDAPI_HOST}/search"
    
    params = {
        "query": query,
        "page": str(page),
        "country": country.upper(),
        "limit": "1"  # Only get 1 product to save API usage
    }
    
    try:
        logger.info(f"Searching Amazon for: {query} (country={country})")
        response = requests.get(url, headers=get_headers(), params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        logger.info(f"Got {len(data.get('data', {}).get('products', []))} products for '{query}'")
        
        return {
            "success": True,
            "query": query,
            "country": country,
            "products": data.get("data", {}).get("products", [])
        }
        
    except requests.exceptions.RequestException as e:
        logger.exception(f"Amazon search failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "query": query,
            "products": []
        }


def get_product_details(asin: str, country: str = "US") -> dict:
    """
    Get detailed product information by ASIN.
    
    Args:
        asin: Amazon Standard Identification Number
        country: Country code
    
    Returns:
        dict with product details
    """
    if not settings.RAPIDAPI_KEY:
        logger.error("RAPIDAPI_KEY not configured")
        return {"error": "RapidAPI key not configured"}
    
    url = f"https://{RAPIDAPI_HOST}/product-details"
    
    params = {
        "asin": asin,
        "country": country.upper()
    }
    
    try:
        logger.info(f"Getting product details for ASIN: {asin}")
        response = requests.get(url, headers=get_headers(), params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        return {
            "success": True,
            "asin": asin,
            "product": data.get("data", {})
        }
        
    except requests.exceptions.RequestException as e:
        logger.exception(f"Product details failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "asin": asin
        }


def search_shopping_list_items(items: list[str], country: str = "US") -> list[dict]:
    """
    Search for multiple shopping list items on Amazon.
    Returns one product per item.
    
    Args:
        items: List of item names to search
        country: Country code
    
    Returns:
        List of search results, one per item
    """
    results = []
    
    for item in items:
        search_result = search_product(item, country=country)
        
        if search_result.get("success") and search_result.get("products"):
            # Get the first (best match) product
            first_product = search_result["products"][0]
            results.append({
                "search_query": item,
                "found": True,
                "product": {
                    "title": first_product.get("product_title", "Unknown"),
                    "price": first_product.get("product_price", "N/A"),
                    "rating": first_product.get("product_star_rating", "N/A"),
                    "reviews": first_product.get("product_num_ratings", 0),
                    "url": first_product.get("product_url", ""),
                    "image": first_product.get("product_photo", ""),
                    "asin": first_product.get("asin", ""),
                    "is_prime": first_product.get("is_prime", False)
                }
            })
        else:
            results.append({
                "search_query": item,
                "found": False,
                "error": search_result.get("error", "No products found")
            })
    
    return results


def format_product_for_display(product: dict) -> str:
    """Format a single product for display."""
    title = product.get("title", "Unknown Product")
    price = product.get("price", "N/A")
    rating = product.get("rating", "N/A")
    url = product.get("url", "")
    is_prime = "✓ Prime" if product.get("is_prime") else ""
    
    return f"**{title}**\n💰 {price} | ⭐ {rating} {is_prime}\n🔗 [View on Amazon]({url})"


def format_search_results(results: list[dict]) -> str:
    """Format multiple search results for display."""
    lines = ["🛒 **Amazon Product Search Results:**\n"]
    
    for result in results:
        if result.get("found"):
            product = result["product"]
            lines.append(f"**{result['search_query']}**")
            lines.append(f"  → {product['title'][:60]}...")
            lines.append(f"  💰 {product['price']} | ⭐ {product['rating']}")
            if product.get("url"):
                lines.append(f"  🔗 [View on Amazon]({product['url']})")
            lines.append("")
        else:
            lines.append(f"**{result['search_query']}**")
            lines.append(f"  ❌ Not found: {result.get('error', 'Unknown error')}")
            lines.append("")
    
    return "\n".join(lines)
