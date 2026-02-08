#!/usr/bin/env python3
"""
Test script for Amazon API integration.

Usage:
    cd mise-asi
    source .venv/bin/activate
    python test_amazon_api.py
"""
import os
import sys

# Add the mise-asi directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from config import settings
from services.amazon_api_service import (
    search_product,
    get_product_details,
    search_shopping_list_items,
    format_search_results
)


def test_config():
    """Test RapidAPI configuration."""
    print("=" * 60)
    print("TESTING CONFIGURATION")
    print("=" * 60)
    
    if settings.RAPIDAPI_KEY:
        print(f"✅ RAPIDAPI_KEY configured: {settings.RAPIDAPI_KEY[:10]}...")
    else:
        print("❌ RAPIDAPI_KEY not configured!")
        print("   Set RAPIDAPI_KEY in your .env file")
        return False
    
    return True


def test_single_search():
    """Test single product search."""
    print("\n" + "=" * 60)
    print("TESTING SINGLE PRODUCT SEARCH")
    print("=" * 60)
    
    query = "organic milk"
    print(f"Searching for: '{query}'")
    
    result = search_product(query)
    
    if result.get("success"):
        products = result.get("products", [])
        print(f"✅ Found {len(products)} products")
        
        if products:
            first = products[0]
            print(f"\nFirst result:")
            print(f"  Title: {first.get('product_title', 'N/A')[:60]}...")
            print(f"  Price: {first.get('product_price', 'N/A')}")
            print(f"  Rating: {first.get('product_star_rating', 'N/A')}")
            print(f"  ASIN: {first.get('asin', 'N/A')}")
        return True
    else:
        print(f"❌ Search failed: {result.get('error')}")
        return False


def test_shopping_list_search():
    """Test shopping list items search."""
    print("\n" + "=" * 60)
    print("TESTING SHOPPING LIST SEARCH")
    print("=" * 60)
    
    items = ["eggs", "butter", "bread"]
    print(f"Searching for: {items}")
    
    results = search_shopping_list_items(items)
    
    found_count = sum(1 for r in results if r.get("found"))
    print(f"✅ Found {found_count}/{len(items)} items")
    
    print("\n" + format_search_results(results))
    return found_count > 0


def test_product_details():
    """Test getting product details by ASIN."""
    print("\n" + "=" * 60)
    print("TESTING PRODUCT DETAILS")
    print("=" * 60)
    
    # First search to get an ASIN
    result = search_product("coffee")
    
    if not result.get("success") or not result.get("products"):
        print("⚠️ No products found to test details")
        return True  # Not a failure, just no test data
    
    asin = result["products"][0].get("asin")
    if not asin:
        print("⚠️ No ASIN available in search results")
        return True
    
    print(f"Getting details for ASIN: {asin}")
    
    details = get_product_details(asin)
    
    if details.get("success"):
        product = details.get("product", {})
        print(f"✅ Got product details")
        print(f"  Title: {product.get('product_title', 'N/A')[:60]}...")
        print(f"  Description: {str(product.get('product_description', 'N/A'))[:100]}...")
        return True
    else:
        print(f"❌ Failed to get details: {details.get('error')}")
        return False


if __name__ == "__main__":
    print("\n🧪 AMAZON API INTEGRATION TEST\n")
    
    # Check config first
    if not test_config():
        print("\n❌ Configuration test failed. Please set RAPIDAPI_KEY.")
        sys.exit(1)
    
    # Run tests
    tests = [
        ("Single Search", test_single_search),
        ("Shopping List Search", test_shopping_list_search),
        ("Product Details", test_product_details),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"❌ {name} raised exception: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(passed for _, passed in results)
    sys.exit(0 if all_passed else 1)
