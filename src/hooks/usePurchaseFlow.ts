import { useState, useCallback } from "react";
import { ShoppingListItem } from "@/data/schema";
import { AmazonProduct, AmazonProductMap, parsePrice } from "./useAmazonProducts";

export interface PurchaseItem extends ShoppingListItem {
    product?: AmazonProduct | null;
}

export interface PurchaseState {
    isActive: boolean;
    items: PurchaseItem[];
    isPanelOpen: boolean;
    isPaymentModalOpen: boolean;
    messageId: number | null;
}

export interface UsePurchaseFlowResult {
    purchaseState: PurchaseState;
    startPurchase: (messageId: number, itemNames: string[], allItems: ShoppingListItem[], products: AmazonProductMap) => void;
    updateQuantity: (itemName: string, quantity: number) => void;
    togglePanel: () => void;
    openPaymentModal: () => void;
    closePaymentModal: () => void;
    completePurchase: () => PurchaseItem[];
    cancelPurchase: () => void;
    getTotalPrice: () => number;
}

/**
 * Hook to manage purchase flow state
 * Handles item selection, quantity updates, and purchase progression
 */
export const usePurchaseFlow = (): UsePurchaseFlowResult => {
    const [purchaseState, setPurchaseState] = useState<PurchaseState>({
        isActive: false,
        items: [],
        isPanelOpen: true,
        isPaymentModalOpen: false,
        messageId: null,
    });

    // Start a new purchase flow
    const startPurchase = useCallback(
        (
            messageId: number,
            itemNames: string[],
            allItems: ShoppingListItem[],
            products: AmazonProductMap
        ) => {
            // If itemNames is empty, purchase all items
            const itemsToPurchase =
                itemNames.length > 0
                    ? allItems.filter((item) => itemNames.includes(item.item))
                    : allItems;

            // Attach product data to each item
            const purchaseItems: PurchaseItem[] = itemsToPurchase.map((item) => ({
                ...item,
                product: products.get(item.item.toLowerCase()) || null,
            }));

            setPurchaseState({
                isActive: true,
                items: purchaseItems,
                isPanelOpen: true,
                isPaymentModalOpen: false,
                messageId,
            });
        },
        []
    );

    // Update quantity for a specific item
    const updateQuantity = useCallback((itemName: string, quantity: number) => {
        setPurchaseState((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.item === itemName ? { ...item, quantity } : item
            ),
        }));
    }, []);

    // Toggle purchase panel open/closed
    const togglePanel = useCallback(() => {
        setPurchaseState((prev) => ({
            ...prev,
            isPanelOpen: !prev.isPanelOpen,
        }));
    }, []);

    // Open payment modal
    const openPaymentModal = useCallback(() => {
        setPurchaseState((prev) => ({
            ...prev,
            isPaymentModalOpen: true,
        }));
    }, []);

    // Close payment modal
    const closePaymentModal = useCallback(() => {
        setPurchaseState((prev) => ({
            ...prev,
            isPaymentModalOpen: false,
        }));
    }, []);

    // Complete purchase and return purchased items
    const completePurchase = useCallback(() => {
        const purchasedItems = purchaseState.items;
        setPurchaseState({
            isActive: false,
            items: [],
            isPanelOpen: false,
            isPaymentModalOpen: false,
            messageId: null,
        });
        return purchasedItems;
    }, [purchaseState.items]);

    // Cancel purchase
    const cancelPurchase = useCallback(() => {
        setPurchaseState({
            isActive: false,
            items: [],
            isPanelOpen: false,
            isPaymentModalOpen: false,
            messageId: null,
        });
    }, []);

    // Calculate total price
    const getTotalPrice = useCallback(() => {
        return purchaseState.items.reduce((total, item) => {
            const price = parsePrice(item.product?.product_price);
            if (price !== null) {
                return total + price * item.quantity;
            }
            return total;
        }, 0);
    }, [purchaseState.items]);

    return {
        purchaseState,
        startPurchase,
        updateQuantity,
        togglePanel,
        openPaymentModal,
        closePaymentModal,
        completePurchase,
        cancelPurchase,
        getTotalPrice,
    };
};
