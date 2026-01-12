
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const searchAmazonProductTool: FunctionDeclaration = {
  name: "searchAmazonProduct",
  description: "Search for a specific product on Amazon using RapidAPI. Returns top 3 relevant products with details like title, price, rating, and link.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      product_query: {
        type: SchemaType.STRING,
        description: "The product name or search query to find on Amazon (e.g., 'organic bananas', 'whole wheat bread')",
      },
      country: {
        type: SchemaType.STRING,
        description: "Country code for Amazon search (default: 'US')",
      },
    },
    required: ["product_query"],
  },
};

export const searchMultipleAmazonProductsTool: FunctionDeclaration = {
  name: "searchMultipleAmazonProducts",
  description: "Search for multiple products from the shopping list on Amazon in a batch operation. This is efficient for finding all shopping list items at once.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      product_queries: {
        type: SchemaType.ARRAY,
        description: "Array of product names from the shopping list to search for on Amazon",
        items: {
          type: SchemaType.STRING,
        },
      },
      country: {
        type: SchemaType.STRING,
        description: "Country code for Amazon search (default: 'US')",
      },
    },
    required: ["product_queries"],
  },
};

export const getAmazonSearchResultsTool: FunctionDeclaration = {
  name: "getAmazonSearchResults",
  description: "Retrieve previously cached Amazon search results for shopping list items. Use this to show results without making new API calls.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      product_name: {
        type: SchemaType.STRING,
        description: "The product name to get cached results for (optional - if not provided, returns all cached results)",
      },
    },
  },
};

export const clearAmazonSearchCacheTool: FunctionDeclaration = {
  name: "clearAmazonSearchCache",
  description: "Clear all cached Amazon search results. Use when shopping list changes significantly.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};
