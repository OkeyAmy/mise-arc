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
  } = useChat({
    setPlan: () => {}, // No-op since we removed meal plan
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

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader onResetConversation={resetConversation} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <ChatMessageList 
              messages={messages} 
              isThinking={isThinking}
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
    </div>
  );
};
