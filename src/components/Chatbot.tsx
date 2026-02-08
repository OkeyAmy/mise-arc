import { useState, useEffect, useRef } from "react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ShoppingList } from "./ShoppingList";
import { LeftoversDialog } from "./LeftoversDialog";
import { useChat } from "@/hooks/useChat";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useLeftovers } from "@/hooks/useLeftovers";
import { useInventory, InventoryItem } from "@/hooks/useInventory";
import { usePreferences } from "@/hooks/usePreferences";
import { ThoughtStep, LeftoverItem, UserPreferences } from "@/data/schema";
import { Session } from "@supabase/supabase-js";
import { AmazonProductView } from "./AmazonProductView";
import { PaymentModal, PaymentInfo } from "./PaymentModal";
import { usePurchaseFlow } from "@/hooks/usePurchaseFlow";
import { useAmazonProducts } from "@/hooks/useAmazonProducts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ChatbotProps {
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: (open: boolean) => void;
  isLeftoversOpen: boolean;
  setIsLeftoversOpen: (open: boolean) => void;
  setThoughtSteps: (steps: ThoughtStep[] | ((prev: ThoughtStep[]) => ThoughtStep[])) => void;
  session: Session | null;
  thoughtSteps: ThoughtStep[];
  pendingMessage?: string | null;
  onMessageSent?: () => void;
}

export const Chatbot = ({
  isShoppingListOpen,
  setIsShoppingListOpen,
  isLeftoversOpen,
  setIsLeftoversOpen,
  setThoughtSteps,
  session,
  thoughtSteps,
  pendingMessage,
  onMessageSent,
}: ChatbotProps) => {
  const [isAmazonProductViewOpen, setIsAmazonProductViewOpen] = useState(false);

  // Purchase flow state
  const purchaseFlow = usePurchaseFlow();

  const {
    items: shoppingListItems,
    addItems: addShoppingListItems,
    removeItems: removeShoppingListItems,
    updateItem: updateShoppingListItem,
    removeItem: removeShoppingListItem,
    saveList: replaceShoppingList,
  } = useShoppingList(session, "default");

  const {
    items: leftoverItems,
    isLoading: leftoverLoading,
    addLeftover,
    updateLeftover,
    removeLeftover,
  } = useLeftovers(session);

  const {
    items: inventoryItems,
    addItem: createInventoryItem,
    updateItem: updateInventoryItemFromHook,
    deleteItem: deleteInventoryItemFromHook,
    upsertItem,
  } = useInventory(session);

  const { preferences, updatePreferences } = usePreferences(session);

  // Fetch Amazon products for shopping list items
  const { products, isLoading: isProductsLoading } = useAmazonProducts(shoppingListItems || []);

  const onCreateInventoryItems = async (items: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    for (const item of items) {
      await createInventoryItem(item);
    }
  };

  const onUpdateInventory = async (items: Partial<Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { item_name: string }[]) => {
    for (const item of items) {
      await upsertItem(item);
    }
  };

  const onUpdateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    await updateInventoryItemFromHook(itemId, updates);
  };

  const onDeleteInventoryItem = async (itemId: string) => {
    await deleteInventoryItemFromHook(itemId);
  };

  // Add missing Leftovers CRUD functions
  const onCreateLeftoverItems = async (items: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    for (const item of items) {
      await addLeftover(item);
    }
  };

  const onUpdateLeftoverItemPartial = async (leftoverId: string, updates: Partial<{ meal_name: string; servings: number; notes: string }>) => {
    await updateLeftover(leftoverId, updates);
  };

  const onDeleteLeftoverItem = async (leftoverId: string) => {
    await removeLeftover(leftoverId);
  };

  // Wrapper function to match CRUD interface for shopping list updates
  const onUpdateShoppingListItemCrud = async (itemName: string, updates: { quantity?: number; unit?: string }) => {
    await updateShoppingListItem(itemName, updates.quantity, updates.unit);
  };

  const {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
    resetConversation,
    addMessage,
    updateMessage,
  } = useChat({
    setPlan: () => { }, // No-op since we removed meal plan
    setIsShoppingListOpen,
    setIsLeftoversOpen,
    setThoughtSteps,
    session,
    thoughtSteps,
    shoppingListItems,
    onAddItemsToShoppingList: addShoppingListItems,
    onRemoveItemsFromShoppingList: removeShoppingListItems,
    onGetLeftovers: async () => leftoverItems,
    onAddLeftover: addLeftover,
    onUpdateLeftover: updateLeftover,
    onRemoveLeftover: removeLeftover,
    onGetInventory: async () => inventoryItems,
    onCreateInventoryItems,
    onUpdateInventory,
    onUpdateInventoryItem,
    onDeleteInventoryItem,
    onGetUserPreferences: async () => preferences,
    onUpdateUserPreferences: updatePreferences,
    // CRUD Shopping List functions
    onGetShoppingListItems: async () => shoppingListItems,
    onCreateShoppingListItems: addShoppingListItems,
    onUpdateShoppingListItem: onUpdateShoppingListItemCrud,
    onDeleteShoppingListItems: removeShoppingListItems,
    onReplaceShoppingList: replaceShoppingList,
    // CRUD Leftovers functions
    onCreateLeftoverItems,
    onUpdateLeftoverItemPartial,
    onDeleteLeftoverItem,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle pending message from shared shopping list
  useEffect(() => {
    if (pendingMessage && !isThinking) {
      setInputValue(pendingMessage);
      // Auto-submit the message after a short delay
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          onMessageSent?.();
        }
      }, 500);
    }
  }, [pendingMessage, isThinking, setInputValue, onMessageSent]);

  const handleUpdateLeftoverServings = (id: string, servings: number) => {
    updateLeftover(id, { servings });
  };

  // Purchase flow handlers
  const handleBuyNow = () => {
    purchaseFlow.openPaymentModal();
  };

  const handleCancelPurchase = () => {
    purchaseFlow.cancelPurchase();
  };

  const handlePaymentConfirm = async (paymentInfo: PaymentInfo) => {
    // Complete purchase and get purchased items
    const purchasedItems = purchaseFlow.completePurchase();

    // Remove purchased items from shopping list
    const itemNamesToRemove = purchasedItems.map(item => item.item);
    await removeShoppingListItems(itemNamesToRemove);

    // Calculate delivery date (simulated: 3-5 days from now)
    const daysToDeliver = Math.floor(Math.random() * 3) + 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysToDeliver);
    const deliveryDateStr = deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    // Calculate total
    const total = purchaseFlow.getTotalPrice();

    // Create confirmation message
    const confirmationText = `✅ **Purchase Confirmed!**\n\n` +
      `**Order Number:** ${orderNumber}\n` +
      `**Items Purchased:** ${purchasedItems.length}\n` +
      `**Total Amount:** $${total.toFixed(2)}\n` +
      `**Delivery Address:** ${paymentInfo.billingAddress}\n` +
      `**Estimated Delivery:** ${deliveryDateStr}\n\n` +
      `Your items have been purchased and will be delivered soon! Thank you for shopping with us.`;

    // Add confirmation message to chat
    const confirmationMessage = {
      id: Date.now() + 1,
      text: confirmationText,
      sender: "bot" as const,
    };

    // This will be handled by adding message through the useChat hook
    // For now, we'll simulate it with a direct state update
    // In production, you'd want to route this through your chat system

    addMessage({
      text: confirmationText,
      sender: "bot",
    });
  };

  // Trigger purchase intent when AI responds after searching Amazon products
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // Detect purchase intent in bot messages
      if (lastMessage.sender === "bot" && !lastMessage.purchaseIntent) {
        const text = lastMessage.text.toLowerCase();

        // Check if AI searched Amazon and wants to show items for review/purchase
        // Updated to match actual AI response patterns:
        // - "opened up your shopping list panel"
        // - "pulled up your shopping list panel"
        // - "review" (when talking about items)
        const isPurchaseIntent =
          (text.includes("shopping list") && (
            text.includes("panel") ||
            text.includes("pulled up") ||
            text.includes("opened") ||
            text.includes("review")
          )) ||
          (text.includes("amazon") && text.includes("review")) ||
          ((text.includes("buy") || text.includes("purchase")) &&
            (text.includes("confirm") || text.includes("would you like") ||
              text.includes("do you want") || text.includes("ready to")));

        if (isPurchaseIntent && shoppingListItems && shoppingListItems.length > 0) {
          // Parse which items to purchase
          // For simplicity, if specific items aren't mentioned, purchase all
          const purchaseItemNames: string[] = [];

          // Find the last user message to check for specific item requests
          // We need to look backwards from the last message (which is bot)
          const lastUserMessage = [...messages].reverse().find(m => m.sender === "user");

          if (lastUserMessage) {
            const userText = lastUserMessage.text.toLowerCase();

            // Check if specific items are mentioned in the USER'S message
            shoppingListItems.forEach(item => {
              const itemNameLower = item.item.toLowerCase();
              // Match if the item name appears in the text as a whole word or partial match
              if (userText.includes(itemNameLower)) {
                purchaseItemNames.push(item.item);
              }
            });
          }

          // Start purchase flow
          purchaseFlow.startPurchase(
            lastMessage.id,
            purchaseItemNames, // Empty array means all items
            shoppingListItems,
            products
          );

          // Mark message with purchase intent - NOW PROPERLY UPDATE THE MESSAGE STATE
          updateMessage(lastMessage.id, {
            purchaseIntent: true,
            purchaseItems: purchaseItemNames
          });
        }
      }
    }
  }, [messages, shoppingListItems, products, purchaseFlow, updateMessage]);

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader onResetConversation={resetConversation} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <ChatMessageList
              messages={messages}
              isThinking={isThinking}
              shoppingListItems={shoppingListItems}
              amazonProducts={products}
              isProductsLoading={isProductsLoading}
              activePurchaseMessageId={purchaseFlow.purchaseState.messageId}
              purchaseItems={purchaseFlow.purchaseState.items}
              isPurchasePanelOpen={purchaseFlow.purchaseState.isPanelOpen}
              onTogglePurchasePanel={purchaseFlow.togglePanel}
              onUpdatePurchaseQuantity={purchaseFlow.updateQuantity}
              onBuyNow={handleBuyNow}
              onCancelPurchase={handleCancelPurchase}
            />
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 border-t border-border">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              isThinking={isThinking}
              onResetConversation={resetConversation}
            />
          </div>
        </div>
      </div>

      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shopping List</DialogTitle>
          </DialogHeader>
          <ShoppingList
            items={shoppingListItems || []}
            onRemove={removeShoppingListItem}
            onUpdate={updateShoppingListItem}
            onAdd={addShoppingListItems}
            session={session}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isLeftoversOpen} onOpenChange={setIsLeftoversOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leftovers</DialogTitle>
          </DialogHeader>
          <LeftoversDialog
            items={leftoverItems || []}
            isLoading={leftoverLoading}
            onRemove={removeLeftover}
            onUpdateServings={handleUpdateLeftoverServings}
            onAdd={addLeftover}
          />
        </DialogContent>
      </Dialog>

      <AmazonProductView
        isOpen={isAmazonProductViewOpen}
        onClose={() => setIsAmazonProductViewOpen(false)}
        productName=""
      />

      <PaymentModal
        isOpen={purchaseFlow.purchaseState.isPaymentModalOpen}
        onClose={purchaseFlow.closePaymentModal}
        onConfirm={handlePaymentConfirm}
        totalAmount={purchaseFlow.getTotalPrice()}
        itemCount={purchaseFlow.purchaseState.items.length}
      />
    </div>
  );
};
