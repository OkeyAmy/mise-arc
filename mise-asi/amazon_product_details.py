#!/usr/bin/env python3
"""
Amazon Product Details Script

A standalone script to fetch product details from Amazon using RapidAPI.
Can be used to get detailed product information for later use.

Usage:
    python amazon_product_details.py "search query"
    python amazon_product_details.py --asin B0ABC123DEF
    python amazon_product_details.py --list "milk,eggs,butter"

Examples:
    python amazon_product_details.py "organic coffee beans"
    python amazon_product_details.py --asin B0BWSJ2Y1P
    python amazon_product_details.py --list "milk,eggs,bread"
"""
import os
import sys
import json
import argparse
import requests
from typing import Optional

# Load environment from .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# RapidAPI Configuration
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "88ddd28dbbmsh8960b8ffe30aac5p1473acjsn2a991fec7ea4")
RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com"


def get_headers() -> dict:
    """Get RapidAPI request headers."""
    return {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }


def search_product(query: str, country: str = "US") -> dict:
    """Search for a product on Amazon. Returns only 1 product to save API usage."""
    url = f"https://{RAPIDAPI_HOST}/search"
    params = {"query": query, "page": "1", "country": country, "limit": "1"}
    
    response = requests.get(url, headers=get_headers(), params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def get_product_details(asin: str, country: str = "US") -> dict:
    """Get detailed product information by ASIN."""
    url = f"https://{RAPIDAPI_HOST}/product-details"
    params = {"asin": asin, "country": country}
    
    response = requests.get(url, headers=get_headers(), params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def get_product_reviews(asin: str, country: str = "US") -> dict:
    """Get product reviews by ASIN."""
    url = f"https://{RAPIDAPI_HOST}/product-reviews"
    params = {"asin": asin, "country": country, "page": "1"}
    
    response = requests.get(url, headers=get_headers(), params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def get_product_offers(asin: str, country: str = "US") -> dict:
    """Get product offers (sellers/prices) by ASIN."""
    url = f"https://{RAPIDAPI_HOST}/product-offers"
    params = {"asin": asin, "country": country, "page": "1"}
    
    response = requests.get(url, headers=get_headers(), params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def format_product_summary(product: dict) -> str:
    """Format product data for display."""
    lines = []
    lines.append(f"📦 {product.get('product_title', 'Unknown Product')}")
    lines.append("-" * 60)
    lines.append(f"💰 Price: {product.get('product_price', 'N/A')}")
    lines.append(f"⭐ Rating: {product.get('product_star_rating', 'N/A')} ({product.get('product_num_ratings', 0)} reviews)")
    lines.append(f"📋 ASIN: {product.get('asin', 'N/A')}")
    
    if product.get('is_prime'):
        lines.append("✓ Prime eligible")
    
    if product.get('product_url'):
        lines.append(f"🔗 URL: {product.get('product_url')}")
    
    return "\n".join(lines)


def search_and_display(query: str, include_details: bool = False, output_json: bool = False):
    """Search for a product and display results."""
    print(f"\n🔍 Searching Amazon for: '{query}'...\n")
    
    try:
        result = search_product(query)
        products = result.get("data", {}).get("products", [])
        
        if not products:
            print("No products found.")
            return
        
        if output_json:
            print(json.dumps(products[:5], indent=2))
            return
        
        print(f"Found {len(products)} products. Showing top 3:\n")
        
        for i, product in enumerate(products[:3], 1):
            print(f"\n{'='*60}")
            print(f"Result #{i}")
            print(format_product_summary(product))
            
            if include_details:
                asin = product.get("asin")
                if asin:
                    try:
                        details = get_product_details(asin)
                        detail_data = details.get("data", {})
                        if detail_data.get("product_description"):
                            print(f"\n📝 Description: {detail_data['product_description'][:200]}...")
                    except Exception as e:
                        print(f"⚠️ Could not fetch details: {e}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")


def get_details_by_asin(asin: str, output_json: bool = False):
    """Get and display product details by ASIN."""
    print(f"\n📦 Fetching details for ASIN: {asin}...\n")
    
    try:
        result = get_product_details(asin)
        product = result.get("data", {})
        
        if output_json:
            print(json.dumps(product, indent=2))
            return
        
        print("=" * 60)
        print(f"📦 {product.get('product_title', 'Unknown Product')}")
        print("=" * 60)
        print(f"💰 Price: {product.get('product_price', 'N/A')}")
        print(f"⭐ Rating: {product.get('product_star_rating', 'N/A')}")
        print(f"📋 ASIN: {product.get('asin', asin)}")
        print(f"🏷️ Brand: {product.get('product_byline', 'N/A')}")
        
        if product.get('product_description'):
            print(f"\n📝 Description:\n{product.get('product_description')}")
        
        if product.get('product_url'):
            print(f"\n🔗 URL: {product['product_url']}")
        
        # Get offers
        try:
            offers_result = get_product_offers(asin)
            offers = offers_result.get("data", {}).get("listings", [])
            if offers:
                print(f"\n💳 Available from {len(offers)} seller(s)")
                for offer in offers[:3]:
                    print(f"  - {offer.get('price', {}).get('raw', 'N/A')} from {offer.get('seller', {}).get('name', 'Unknown')}")
        except:
            pass
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")


def search_list(items_str: str, output_json: bool = False):
    """Search for multiple items (comma-separated)."""
    items = [item.strip() for item in items_str.split(",") if item.strip()]
    
    if not items:
        print("No items provided.")
        return
    
    print(f"\n🛒 Searching for {len(items)} items...\n")
    
    results = []
    for item in items:
        print(f"Searching: {item}...", end=" ", flush=True)
        try:
            result = search_product(item)
            products = result.get("data", {}).get("products", [])
            if products:
                first = products[0]
                results.append({
                    "query": item,
                    "found": True,
                    "title": first.get("product_title"),
                    "price": first.get("product_price"),
                    "rating": first.get("product_star_rating"),
                    "url": first.get("product_url"),
                    "asin": first.get("asin"),
                    "is_prime": first.get("is_prime", False)
                })
                print("✅")
            else:
                results.append({"query": item, "found": False})
                print("❌ Not found")
        except Exception as e:
            results.append({"query": item, "found": False, "error": str(e)})
            print(f"❌ Error: {e}")
    
    if output_json:
        print("\n" + json.dumps(results, indent=2))
        return
    
    print("\n" + "=" * 60)
    print("SHOPPING LIST RESULTS")
    print("=" * 60)
    
    for r in results:
        if r.get("found"):
            prime = " ✓Prime" if r.get("is_prime") else ""
            print(f"\n✅ {r['query']}")
            print(f"   → {r['title'][:50]}...")
            print(f"   💰 {r['price']} | ⭐ {r['rating']}{prime}")
            print(f"   🔗 {r['url']}")
        else:
            print(f"\n❌ {r['query']} - Not found")
    
    found = sum(1 for r in results if r.get("found"))
    print(f"\n---\nFound {found}/{len(items)} items on Amazon")


def main():
    parser = argparse.ArgumentParser(
        description="Fetch Amazon product details using RapidAPI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python amazon_product_details.py "organic coffee"
  python amazon_product_details.py --asin B0BWSJ2Y1P
  python amazon_product_details.py --list "milk,eggs,bread"
  python amazon_product_details.py "coffee" --json
  python amazon_product_details.py "laptop" --details
        """
    )
    
    parser.add_argument("query", nargs="?", help="Product search query")
    parser.add_argument("--asin", help="Get details by ASIN")
    parser.add_argument("--list", dest="list_items", help="Search multiple items (comma-separated)")
    parser.add_argument("--details", action="store_true", help="Include full product details")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--country", default="US", help="Country code (default: US)")
    
    args = parser.parse_args()
    
    if not RAPIDAPI_KEY:
        print("❌ Error: RAPIDAPI_KEY not configured")
        print("Set RAPIDAPI_KEY environment variable or add to .env file")
        sys.exit(1)
    
    if args.asin:
        get_details_by_asin(args.asin, output_json=args.json)
    elif args.list_items:
        search_list(args.list_items, output_json=args.json)
    elif args.query:
        search_and_display(args.query, include_details=args.details, output_json=args.json)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
