import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlerUtils";
import { supabase } from "@/integrations/supabase/client";

// Type definitions for Amazon search API response (matching actual RapidAPI structure)
interface AmazonProduct {
  asin: string;
  product_title: string;
  product_price?: string;
  product_original_price?: string | null;
  currency?: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  product_url?: string;
  product_photo?: string;
  product_minimum_offer_price?: string;
  product_num_offers?: number;
  is_best_seller?: boolean;
  is_amazon_choice?: boolean;
  is_prime?: boolean;
  sales_volume?: string;
  delivery?: string;
  product_availability?: string;
  climate_pledge_friendly?: boolean;
  has_variations?: boolean;
  product_badge?: string;
  product_byline?: string;
  unit_price?: string;
  unit_count?: number;
}

interface AmazonSearchResponse {
  status: string;
  request_id: string;
  parameters?: {
    query: string;
    country: string;
    sort_by: string;
    page: number;
    is_prime: boolean;
  };
  data?: {
    total_products: number;
    country: string;
    domain: string;
    products: AmazonProduct[];
  };
}

// Type for cached search results with proper Json handling
interface CachedSearchResult {
  user_id: string;
  product_query: string;
  country: string;
  search_results: unknown; // Use unknown first, then cast to AmazonProduct[]
  created_at?: string;
  updated_at?: string;
}

// Get RapidAPI key from Supabase secrets
const getRapidAPIKey = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('get-secret', {
    body: { name: 'RAPIDAPI_KEY' }
  });
  
  if (error || !data?.value) {
    throw new Error('RapidAPI key not found in Supabase secrets');
  }
  
  return data.value;
};

// Real RapidAPI implementation with correct endpoint and parameters
const searchAmazonAPI = async (productQuery: string, country: string = "US"): Promise<AmazonProduct[]> => {
  console.log(`🔍 Searching Amazon for: ${productQuery} in ${country}`);
  
  try {
    const apiKey = await getRapidAPIKey();
    
    const url = "https://real-time-amazon-data.p.rapidapi.com/search";
    const querystring = new URLSearchParams({
      query: productQuery,
      page: "1",
      country: country,
      sort_by: "RELEVANCE",
      is_prime: "false"
    });
    
    const headers = {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com"
    };
    
    const response = await fetch(`${url}?${querystring}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Amazon API request failed with status: ${response.status}`);
    }
    
    const data: AmazonSearchResponse = await response.json();
    console.log('🔍 Amazon API Response:', data);
    
    if (data.status !== "OK" || !data.data || !data.data.products) {
      throw new Error('Invalid response format from Amazon API');
    }
    
    return data.data.products.slice(0, 3) || [];
  } catch (error) {
    console.error("Amazon API search failed:", error);
    throw error;
  }
};

// Database operations for Amazon search cache with proper type handling
const getCachedSearchResults = async (productQuery: string, country: string = "US"): Promise<CachedSearchResult | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from('amazon_search_cache')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('product_query', productQuery.toLowerCase())
    .eq('country', country)
    .single();

  if (error) {
    console.log('No cached results found:', error);
    return null;
  }

  return data as unknown as CachedSearchResult;
};

const saveCachedSearchResults = async (productQuery: string, searchResults: AmazonProduct[], country: string = "US") => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error } = await supabase
    .from('amazon_search_cache')
    .upsert(
      {
        user_id: user.user.id,
        product_query: productQuery.toLowerCase(),
        country: country,
        search_results: searchResults as unknown as any, // Cast to satisfy Supabase Json type
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,product_query,country',
      }
    );

  if (error) {
    console.error('Error saving cache:', error);
  } else {
    console.log('✅ Cached search results for:', productQuery);
  }
};

const deleteCachedSearchResults = async (productQuery: string, country: string = "US") => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error } = await supabase
    .from('amazon_search_cache')
    .delete()
    .eq('user_id', user.user.id)
    .eq('product_query', productQuery.toLowerCase())
    .eq('country', country);

  if (error) {
    console.error('Error deleting cache:', error);
  } else {
    console.log('🗑️ Deleted cached results for:', productQuery);
  }
};

// New function to search cached Amazon data by product name
const searchCachedAmazonData = async (productName: string, country: string = "US"): Promise<AmazonProduct[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  // Get all cached Amazon data for the user
  const { data: allCached, error } = await supabase
    .from('amazon_search_cache')
    .select('extracted_products, product_query')
    .eq('user_id', user.user.id)
    .eq('country', country);

  if (error || !allCached) {
    console.error('Error fetching cached Amazon data:', error);
    return [];
  }

  // Search through all cached products for matches
  const matchingProducts: AmazonProduct[] = [];
  const searchTerm = productName.toLowerCase();

  allCached.forEach((cache: any) => {
    if (cache.extracted_products && Array.isArray(cache.extracted_products)) {
      const products = cache.extracted_products as unknown as AmazonProduct[];
      products.forEach((product: AmazonProduct) => {
        // Search in product title, byline, and original query
        const titleMatch = product.product_title?.toLowerCase().includes(searchTerm);
        const bylineMatch = product.product_byline?.toLowerCase().includes(searchTerm);
        const queryMatch = cache.product_query?.toLowerCase().includes(searchTerm);
        
        if (titleMatch || bylineMatch || queryMatch) {
          matchingProducts.push(product);
        }
      });
    }
  });

  console.log(`Found ${matchingProducts.length} matching products for search: ${productName}`);
  return matchingProducts;
};

// Get all Amazon products for a user across all searches
const getAllCachedAmazonProducts = async (country: string = "US"): Promise<AmazonProduct[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data: allCached, error } = await supabase
    .from('amazon_search_cache')
    .select('extracted_products')
    .eq('user_id', user.user.id)
    .eq('country', country);

  if (error || !allCached) {
    console.error('Error fetching all cached Amazon data:', error);
    return [];
  }

  const allProducts: AmazonProduct[] = [];
  allCached.forEach((cache: any) => {
    if (cache.extracted_products && Array.isArray(cache.extracted_products)) {
      const products = cache.extracted_products as unknown as AmazonProduct[];
      allProducts.push(...products);
    }
  });

  console.log(`Retrieved ${allProducts.length} total cached Amazon products`);
  return allProducts;
};

export const handleAmazonSearchFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep } = args;
  let funcResultMsg = "";

  if (functionCall.name === "searchAmazonProduct") {
    try {
      const { product_query, country = "US" } = functionCall.args as { 
        product_query: string; 
        country?: string; 
      };
      
      addThoughtStep(`🛍️ Searching Amazon for: ${product_query}`);
      
      // Check database cache first
      const cachedData = await getCachedSearchResults(product_query, country);
      let products: AmazonProduct[] = [];
      
      if (cachedData) {
        addThoughtStep(`📋 Using cached results for ${product_query}`);
        products = cachedData.search_results as unknown as AmazonProduct[];
      } else {
        // Perform search and cache results
        products = await searchAmazonAPI(product_query, country);
        await saveCachedSearchResults(product_query, products, country);
        addThoughtStep(`✅ Found ${products.length} products for ${product_query}`);
      }
      
      // Format product data for AI to use
      if (products.length > 0) {
        const productDetails = products.slice(0, 3).map((product, index) => {
          return `Product ${index + 1}:
- Title: ${product.product_title || 'Unknown Product'}
- Price: ${product.product_price || 'Price not available'}
- Rating: ${product.product_star_rating || 'No rating'} stars (${product.product_num_ratings || 0} reviews)
- Prime: ${product.is_prime ? 'Yes' : 'No'}
- Best Seller: ${product.is_best_seller ? 'Yes' : 'No'}
- Amazon's Choice: ${product.is_amazon_choice ? 'Yes' : 'No'}
- Availability: ${product.product_availability || 'Check on Amazon'}
- Link: ${product.product_url ? `[View on Amazon](${product.product_url})` : 'Link not available'}
- ASIN: ${product.asin}`;
        }).join('\n\n');
        
        funcResultMsg = `Found ${products.length} Amazon products for "${product_query}". Here are the top 3 results:\n\n${productDetails}`;
      } else {
        funcResultMsg = `No products found on Amazon for "${product_query}". You might want to try a different search term.`;
      }
    } catch (error) {
      console.error("Amazon search error:", error);
      const args_typed = functionCall.args as { product_query?: string };
      funcResultMsg = `Sorry, I couldn't search Amazon for "${args_typed?.product_query || 'the requested product'}" right now. There was an issue with the search API. Please try again later.`;
      addThoughtStep(`❌ Amazon search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (functionCall.name === "searchMultipleAmazonProducts") {
    try {
      const { product_queries, country = "US" } = functionCall.args as { 
        product_queries: string[]; 
        country?: string; 
      };
      
      addThoughtStep(`🛍️ Batch searching Amazon for ${product_queries.length} products`);
      
      let searchedCount = 0;
      let cachedCount = 0;
      let failedCount = 0;
      
      for (const productQuery of product_queries) {
        const cachedData = await getCachedSearchResults(productQuery, country);
        
        if (!cachedData) {
          try {
            const searchResults = await searchAmazonAPI(productQuery, country);
            await saveCachedSearchResults(productQuery, searchResults, country);
            searchedCount++;
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Failed to search for ${productQuery}:`, error);
            failedCount++;
          }
        } else {
          cachedCount++;
        }
      }
      
      if (failedCount > 0) {
        funcResultMsg = `Completed Amazon search for ${product_queries.length} products. Found ${searchedCount} new results, used ${cachedCount} cached results, ${failedCount} searches failed. Some products may not be available to view.`;
      } else {
        funcResultMsg = `Completed Amazon search for ${product_queries.length} products. Found ${searchedCount} new results, used ${cachedCount} cached results. All products are ready to view with pricing and availability.`;
      }
      
      addThoughtStep(`✅ Batch search complete: ${searchedCount} new, ${cachedCount} cached, ${failedCount} failed`);
    } catch (error) {
      console.error("Batch Amazon search error:", error);
      funcResultMsg = `Sorry, I encountered an issue while searching for multiple products on Amazon. The search API is currently unavailable. Please try again later.`;
      addThoughtStep(`❌ Batch Amazon search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (functionCall.name === "getAmazonSearchResults") {
    const { product_name, search_all, country = "US" } = functionCall.args as { 
      product_name?: string; 
      search_all?: boolean;
      country?: string;
    };
    
    if (search_all) {
      // Get all Amazon products across all searches
      const allProducts = await getAllCachedAmazonProducts(country);
      if (allProducts.length > 0) {
        const uniqueProducts = allProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.asin === product.asin)
        );
        
        // Format product data for AI to use (show top 10 products)
        const productDetails = uniqueProducts.slice(0, 10).map((product, index) => {
          return `Product ${index + 1}:
- Title: ${product.product_title || 'Unknown Product'}
- Price: ${product.product_price || 'Price not available'}
- Rating: ${product.product_star_rating || 'No rating'} stars (${product.product_num_ratings || 0} reviews)
- Prime: ${product.is_prime ? 'Yes' : 'No'}
- Best Seller: ${product.is_best_seller ? 'Yes' : 'No'}
- Amazon's Choice: ${product.is_amazon_choice ? 'Yes' : 'No'}
- Availability: ${product.product_availability || 'Check on Amazon'}
- Link: ${product.product_url ? `[View on Amazon](${product.product_url})` : 'Link not available'}
- ASIN: ${product.asin}`;
        }).join('\n\n');
        
        funcResultMsg = `Found ${uniqueProducts.length} total Amazon products from all your searches. Here are the top 10 results:\n\n${productDetails}`;
      } else {
        funcResultMsg = `No Amazon products found in your search history. Try searching for some products first.`;
      }
    } else if (product_name) {
        addThoughtStep(`Looking for Amazon products matching "${product_name}"`);
        // First, check for an exact match in the cache
        const cachedData = await getCachedSearchResults(product_name, country);
        let matchingProducts: AmazonProduct[] = [];
  
        if (cachedData && cachedData.search_results && Array.isArray(cachedData.search_results) && cachedData.search_results.length > 0) {
          addThoughtStep(`🎯 Found exact match in cache for "${product_name}"`);
          matchingProducts = cachedData.search_results as unknown as AmazonProduct[];
        } else {
          // If no exact match, search the API
          addThoughtStep(`🤔 No exact cache match for "${product_name}". Searching Amazon directly.`);
          try {
            const searchResults = await searchAmazonAPI(product_name, country);
            await saveCachedSearchResults(product_name, searchResults, country);
            matchingProducts = searchResults;
            if(searchResults.length > 0) {
              addThoughtStep(`✅ Found ${searchResults.length} products for "${product_name}"`);
            } else {
              addThoughtStep(`🤷 No products found on Amazon for "${product_name}"`);
            }
          } catch (error) {
            console.error(`Amazon search error during getAmazonSearchResults for "${product_name}":`, error);
            funcResultMsg = `Sorry, I couldn't search Amazon for "${product_name}" right now. There was an issue with the search API. Please try again later.`;
            addThoughtStep(`❌ Amazon search failed for "${product_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            return funcResultMsg;
          }
        }
  
      if (matchingProducts.length > 0) {
        const uniqueProducts = matchingProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.asin === product.asin)
        );
        
        // Format product data for AI to use
        const productDetails = uniqueProducts.slice(0, 3).map((product, index) => {
          return `Product ${index + 1}:
- Title: ${product.product_title || 'Unknown Product'}
- Price: ${product.product_price || 'Price not available'}
- Rating: ${product.product_star_rating || 'No rating'} stars (${product.product_num_ratings || 0} reviews)
- Prime: ${product.is_prime ? 'Yes' : 'No'}
- Best Seller: ${product.is_best_seller ? 'Yes' : 'No'}
- Amazon's Choice: ${product.is_amazon_choice ? 'Yes' : 'No'}
- Availability: ${product.product_availability || 'Check on Amazon'}
- Link: ${product.product_url ? `[View on Amazon](${product.product_url})` : 'Link not available'}
- ASIN: ${product.asin}`;
        }).join('\n\n');
        
        funcResultMsg = `Found ${uniqueProducts.length} Amazon products for "${product_name}". Here are the top 3 results:\n\n${productDetails}`;
      } else {
          funcResultMsg = `I couldn't find any products on Amazon matching "${product_name}". You might want to try a different search term.`;
      }
    } else {
      // Get summary of all cached searches
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: cachedResults } = await supabase
          .from('amazon_search_cache')
          .select('product_query, created_at')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false });
        
        const totalCached = cachedResults?.length || 0;
        if (totalCached > 0) {
          const recentQueries = cachedResults?.slice(0, 3).map(r => r.product_query).join(', ') || '';
          funcResultMsg = `You have Amazon search results cached for ${totalCached} different product queries. Recent searches include: ${recentQueries}. You can view all products or search for specific items.`;
        } else {
          funcResultMsg = `No Amazon search results currently cached. Start by searching for products you're interested in.`;
        }
      }
    }
    
    addThoughtStep(`📋 Retrieved Amazon search cache data`);
  } else if (functionCall.name === "clearAmazonSearchCache") {
    const { product_query } = functionCall.args as { product_query?: string };
    
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      if (product_query) {
        // Delete specific product query cache
        await deleteCachedSearchResults(product_query);
        funcResultMsg = `Cleared Amazon search cache for "${product_query}". This specific search data has been removed from your cache.`;
      } else {
        // Delete all cached results
        const { data: cachedResults } = await supabase
          .from('amazon_search_cache')
          .select('id')
          .eq('user_id', user.user.id);
        
        const previousSize = cachedResults?.length || 0;
        
        const { error } = await supabase
          .from('amazon_search_cache')
          .delete()
          .eq('user_id', user.user.id);
        
        if (error) {
          funcResultMsg = `Failed to clear Amazon search cache: ${error.message}`;
        } else {
          funcResultMsg = `Cleared all ${previousSize} cached Amazon search results. Fresh searches will be performed for future product lookups.`;
        }
      }
    }
    
    addThoughtStep(`🗑️ Cleared Amazon search cache`);
  }

  return funcResultMsg;
};

// Updated function to get cached results for UI components
export const getAmazonSearchCache = async (productName?: string, searchAll?: boolean): Promise<AmazonProduct[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  if (searchAll) {
    return await getAllCachedAmazonProducts();
  } else if (productName) {
    return await searchCachedAmazonData(productName);
  }

  // Default: get products for specific cached search
  const { data: cachedData, error } = await supabase
    .from('amazon_search_cache')
    .select('extracted_products')
    .eq('user_id', user.user.id)
    .eq('product_query', productName?.toLowerCase() || '')
    .single();

  if (error || !cachedData?.extracted_products) {
    return [];
  }
  
  return (cachedData.extracted_products as unknown as AmazonProduct[]) || [];
};

// Export function to delete entire cached search from UI
export const deleteCachedResults = async (productName: string) => {
  await deleteCachedSearchResults(productName);
};
