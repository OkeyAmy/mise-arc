"""
Amazon search tool schemas
Maps to: src/lib/functions/amazonSearchTools.ts
"""

search_amazon_product_tool = {
    "name": "searchAmazonProduct",
    "description": "Search for a product on Amazon. Returns top results with title, price, rating, and link.",
    "input_schema": {
        "type": "object",
        "properties": {
            "product_query": {"type": "string", "description": "Product search query"},
            "country": {"type": "string", "description": "Country code (default: US)"}
        },
        "required": ["product_query"]
    }
}

search_multiple_amazon_products_tool = {
    "name": "searchMultipleAmazonProducts",
    "description": "Search for multiple products on Amazon at once.",
    "input_schema": {
        "type": "object",
        "properties": {
            "queries": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of product search queries"
            },
            "country": {"type": "string", "description": "Country code (default: US)"}
        },
        "required": ["queries"]
    }
}

search_shopping_list_on_amazon_tool = {
    "name": "searchShoppingListOnAmazon",
    "description": "Search for shopping list items on Amazon. Returns one best-matching product per item with price, rating, and purchase link. Use this when the user wants to find or buy items from their shopping list on Amazon.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of shopping list item names to search for"
            },
            "country": {"type": "string", "description": "Country code (default: US)"}
        },
        "required": ["items"]
    }
}

get_amazon_search_results_tool = {
    "name": "getAmazonSearchResults",
    "description": "Get cached Amazon search results for the user.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

clear_amazon_search_cache_tool = {
    "name": "clearAmazonSearchCache",
    "description": "Clear the cached Amazon search results.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}
