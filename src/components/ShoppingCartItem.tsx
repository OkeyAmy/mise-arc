import * as React from "react";
import { ShoppingListItem } from "@/data/schema";
import { AmazonProduct } from "@/hooks/useAmazonProducts";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { Trash2, Edit, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShoppingCartItemProps {
    item: ShoppingListItem;
    product: AmazonProduct | null | undefined;
    isProductLoading: boolean;
    isEditing: boolean;
    editValues: { quantity: number; unit: string };
    onEditStart: () => void;
    onEditSave: (quantity: number, unit: string) => void;
    onEditCancel: () => void;
    onEditValuesChange: (values: { quantity: number; unit: string }) => void;
    onViewProduct: () => void;
    onRemove: () => void;
    canEdit: boolean;
}

/**
 * Individual cart item component displaying product image, price, and actions.
 * Modular component for use in the ShoppingList cart.
 */
export const ShoppingCartItem = ({
    item,
    product,
    isProductLoading,
    isEditing,
    editValues,
    onEditStart,
    onEditSave,
    onEditCancel,
    onEditValuesChange,
    onViewProduct,
    onRemove,
    canEdit,
}: ShoppingCartItemProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group border border-transparent hover:border-border transition-all">
            {/* Product Image - Clickable to view details */}
            <div
                className="flex-shrink-0 w-16 h-16 sm:w-14 sm:h-14 rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onViewProduct}
                title="View product details"
            >
                {isProductLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : product?.product_photo ? (
                    <img
                        src={product.product_photo}
                        alt={item.item}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E";
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <label
                        className={cn(
                            "text-sm font-medium leading-tight truncate"
                        )}
                    >
                        {item.item}
                    </label>
                </div>

                {/* Quantity/Unit */}
                {isEditing ? (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Input
                            type="number"
                            value={editValues.quantity}
                            onChange={(e) =>
                                onEditValuesChange({
                                    ...editValues,
                                    quantity: parseFloat(e.target.value) || 0,
                                })
                            }
                            className="w-16 h-8 text-sm"
                            min="0"
                            step="0.1"
                        />
                        <Input
                            value={editValues.unit}
                            onChange={(e) =>
                                onEditValuesChange({ ...editValues, unit: e.target.value })
                            }
                            className="w-20 h-8 text-sm"
                            placeholder="unit"
                        />
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEditSave(editValues.quantity, editValues.unit)}
                                className="h-8 w-8 p-0"
                            >
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onEditCancel}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground mt-1">
                        {item.quantity} {item.unit}
                    </div>
                )}
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right min-w-[80px]">
                {isProductLoading ? (
                    <Skeleton className="h-5 w-16 ml-auto" />
                ) : product?.product_price ? (
                    <div>
                        <div className="text-sm font-semibold text-foreground">
                            {product.product_price}
                        </div>
                        {product.product_original_price &&
                            product.product_original_price !== product.product_price && (
                                <div className="text-xs text-muted-foreground line-through">
                                    {product.product_original_price}
                                </div>
                            )}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">No price</div>
                )}
            </div>

            {/* Actions */}
            {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onRemove}
                        className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                        title="Remove item"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onEditStart}
                            className="h-8 w-8 p-0"
                            title="Edit quantity"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
