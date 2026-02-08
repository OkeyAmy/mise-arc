import * as React from "react";
import { ShoppingListItem } from "@/data/schema";
import { AmazonProductMap, calculateEstimatedTotal } from "@/hooks/useAmazonProducts";
import { Skeleton } from "./ui/skeleton";

interface ShoppingCartTotalProps {
    items: ShoppingListItem[];
    products: AmazonProductMap;
    isLoading: boolean;
}

/**
 * Displays the estimated total for all shopping cart items.
 * Sums up (price * quantity) for items with Amazon product data.
 */
export const ShoppingCartTotal = ({
    items,
    products,
    isLoading,
}: ShoppingCartTotalProps) => {
    const total = React.useMemo(
        () => calculateEstimatedTotal(items, products),
        [items, products]
    );

    const itemsWithPrices = React.useMemo(() => {
        return items.filter((item) => {
            const product = products.get(item.item.toLowerCase());
            return product?.product_price;
        }).length;
    }, [items, products]);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg border">
            <div className="text-sm text-muted-foreground">
                Estimated Total
                {itemsWithPrices < items.length && (
                    <span className="ml-1 text-xs">
                        ({itemsWithPrices}/{items.length} items priced)
                    </span>
                )}
            </div>
            <div className="text-lg font-bold">
                {isLoading ? (
                    <Skeleton className="h-6 w-20" />
                ) : total > 0 ? (
                    `$${total.toFixed(2)}`
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                )}
            </div>
        </div>
    );
};
