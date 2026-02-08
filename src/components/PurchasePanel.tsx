import * as React from "react";
import { ShoppingListItem } from "@/data/schema";
import { AmazonProduct, parsePrice } from "@/hooks/useAmazonProducts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown, ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface PurchaseItem extends ShoppingListItem {
    product?: AmazonProduct | null;
}

interface PurchasePanelProps {
    items: PurchaseItem[];
    isOpen: boolean;
    onToggle: () => void;
    onUpdateQuantity: (itemName: string, quantity: number) => void;
    onBuyNow: () => void;
    onCancel: () => void;
    isProductsLoading?: boolean;
}

/**
 * Collapsible purchase panel that appears below AI messages
 * Shows items to be purchased with editable quantities and live price updates
 */
export const PurchasePanel = ({
    items,
    isOpen,
    onToggle,
    onUpdateQuantity,
    onBuyNow,
    onCancel,
    isProductsLoading = false,
}: PurchasePanelProps) => {
    // Calculate total price
    const totalPrice = React.useMemo(() => {
        return items.reduce((total, item) => {
            const price = parsePrice(item.product?.product_price);
            if (price !== null) {
                return total + price * item.quantity;
            }
            return total;
        }, 0);
    }, [items]);

    const itemsWithPrices = items.filter(
        (item) => parsePrice(item.product?.product_price) !== null
    );

    return (
        <div className="mt-3 mb-2">
            <Collapsible open={isOpen} onOpenChange={onToggle}>
                {/* Collapsible Trigger */}
                <CollapsibleTrigger className="flex items-center justify-between w-full glass-card p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                            Review Purchase ({items.length} {items.length === 1 ? "item" : "items"})
                        </span>
                    </div>
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                        )}
                    />
                </CollapsibleTrigger>

                {/* Collapsible Content */}
                <CollapsibleContent>
                    <div className="glass-card p-4 rounded-lg mt-2 space-y-3">
                        {/* Items List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {items.map((item) => {
                                const price = parsePrice(item.product?.product_price);
                                const itemTotal = price !== null ? price * item.quantity : null;

                                return (
                                    <div
                                        key={item.item}
                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Product Image */}
                                        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted">
                                            {isProductsLoading ? (
                                                <Skeleton className="w-full h-full" />
                                            ) : item.product?.product_photo ? (
                                                <img
                                                    src={item.product.product_photo}
                                                    alt={item.item}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src =
                                                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                                                    <ShoppingCart className="h-5 w-5 opacity-20" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{item.item}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground">Qty:</span>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newQty = parseFloat(e.target.value) || 0;
                                                        if (newQty > 0) {
                                                            onUpdateQuantity(item.item, newQty);
                                                        }
                                                    }}
                                                    className="w-16 h-7 text-xs"
                                                    min="0.1"
                                                    step="0.1"
                                                />
                                                <span className="text-xs text-muted-foreground">{item.unit}</span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="flex-shrink-0 text-right">
                                            {isProductsLoading ? (
                                                <Skeleton className="h-5 w-16 ml-auto" />
                                            ) : price !== null ? (
                                                <>
                                                    <div className="text-sm font-semibold text-foreground">
                                                        ${itemTotal?.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        ${price.toFixed(2)} each
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-xs text-muted-foreground">
                                                    {item.product === null ? "Not available" : "Checking price..."}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total */}
                        <div className="border-t pt-3 flex items-center justify-between">
                            <span className="font-semibold">Total:</span>
                            <div className="text-right">
                                {isProductsLoading ? (
                                    <Skeleton className="h-6 w-20 ml-auto" />
                                ) : (
                                    <>
                                        <div className="text-lg font-bold text-primary">
                                            ${totalPrice.toFixed(2)}
                                        </div>
                                        {itemsWithPrices.length < items.length && (
                                            <div className="text-xs text-muted-foreground">
                                                ({items.length - itemsWithPrices.length} item
                                                {items.length - itemsWithPrices.length === 1 ? "" : "s"} without
                                                pricing)
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={onBuyNow}
                                className="flex-1 glass-button-primary"
                                disabled={isProductsLoading || itemsWithPrices.length === 0}
                            >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Buy Now
                            </Button>
                            <Button onClick={onCancel} variant="outline" className="flex-1">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};
