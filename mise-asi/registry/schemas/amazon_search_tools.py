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
            "country": {"type": "string", "description": "Country code (default: US)", "default": "US"}
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
            "country": {"type": "string", "default": "US"}
        },
        "required": ["queries"]
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
