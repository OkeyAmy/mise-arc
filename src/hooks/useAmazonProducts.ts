import { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingListItem } from "@/data/schema";
import { getAmazonSearchCache } from "@/hooks/chat/handlers/amazonSearchHandlers";

/**
 * Amazon product data structure from cache
 */
export interface AmazonProduct {
    asin: string;
    product_title: string;
    product_price?: string;
    product_original_price?: string | null;
    product_photo?: string;
    product_url?: string;
}

/**
 * Map of item name (lowercase) to its Amazon product data
 */
export type AmazonProductMap = Map<string, AmazonProduct | null>;

interface UseAmazonProductsResult {
    products: AmazonProductMap;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to automatically fetch Amazon product data for shopping list items.
 * Uses cached data from the amazonSearchHandlers.
 * 
 * @param items - Shopping list items to fetch products for
 * @returns Object with products map, loading state, error, and refetch function
 */
export function useAmazonProducts(items: ShoppingListItem[]): UseAmazonProductsResult {
    const [products, setProducts] = useState<AmazonProductMap>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track which items we've already fetched to avoid redundant calls
    const fetchedItemsRef = useRef<Set<string>>(new Set());

    const fetchProductsForItems = useCallback(async () => {
        if (items.length === 0) {
            setProducts(new Map());
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newProducts = new Map<string, AmazonProduct | null>();

            // Fetch products for each item
            await Promise.all(
                items.map(async (item) => {
                    const itemKey = item.item.toLowerCase();

                    // Check cache first
                    try {
                        const cachedProducts = await getAmazonSearchCache(item.item);

                        if (cachedProducts && cachedProducts.length > 0) {
                            // Take the first (best) result
                            const product = cachedProducts[0];
                            newProducts.set(itemKey, {
                                asin: product.asin,
                                product_title: product.product_title,
                                product_price: product.product_price,
                                product_original_price: product.product_original_price,
                                product_photo: product.product_photo,
                                product_url: product.product_url,
                            });
                        } else {
                            // No cached data for this item
                            newProducts.set(itemKey, null);
                        }

                        fetchedItemsRef.current.add(itemKey);
                    } catch (itemError) {
                        console.error(`Error fetching product for ${item.item}:`, itemError);
                        newProducts.set(itemKey, null);
                    }
                })
            );

            setProducts(newProducts);
        } catch (err) {
            console.error("Error fetching Amazon products:", err);
            setError("Failed to load product information");
        } finally {
            setIsLoading(false);
        }
    }, [items]);

    // Fetch products when items change
    useEffect(() => {
        // Check if we have new items that haven't been fetched
        const newItems = items.filter(
            (item) => !fetchedItemsRef.current.has(item.item.toLowerCase())
        );

        if (newItems.length > 0 || items.length === 0) {
            fetchProductsForItems();
        }
    }, [items, fetchProductsForItems]);

    const refetch = useCallback(async () => {
        // Clear the fetched items cache to force refetch
        fetchedItemsRef.current.clear();
        await fetchProductsForItems();
    }, [fetchProductsForItems]);

    return { products, isLoading, error, refetch };
}

/**
 * Parse a price string (e.g., "$5.99") to a number.
 * Returns null if parsing fails.
 */
export function parsePrice(priceString?: string): number | null {
    if (!priceString) return null;

    // Remove currency symbols and whitespace, keep numbers and decimal point
    const cleaned = priceString.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
}

/**
 * Calculate the estimated total for all items with prices.
 * Returns the sum of (price * quantity) for each item.
 */
export function calculateEstimatedTotal(
    items: ShoppingListItem[],
    products: AmazonProductMap
): number {
    return items.reduce((total, item) => {
        const product = products.get(item.item.toLowerCase());
        const price = parsePrice(product?.product_price);

        if (price !== null) {
            return total + price * item.quantity;
        }

        return total;
    }, 0);
}
