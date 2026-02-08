import { useState, useEffect, useRef } from "react";
import { ChatMessageList } from "./ChatMessageList";
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
import { Button } from "./ui/button";
import { ShoppingCart, Package, Utensils, LogOut, Menu, Plus, Send, ChevronDown, MessageSquare, RotateCcw, ChevronRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FeedbackWidget from "./FeedbackWidget"; // Correct import for FeedbackWidget
import { ThoughtProcess } from "./ThoughtProcess"; // Import ThoughtProcess
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Textarea } from "./ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface MobileChatInterfaceProps {
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: (open: boolean) => void;
  isLeftoversOpen: boolean;
  setIsLeftoversOpen: (open: boolean) => void;
  setThoughtSteps: (steps: ThoughtStep[] | ((prev: ThoughtStep[]) => ThoughtStep[])) => void;
  session: Session | null;
  thoughtSteps: ThoughtStep[];
  pendingMessage?: string | null;
  onMessageSent?: () => void;
  isRightPanelOpen: boolean; // Add this prop
  toggleSidebar: () => void; // Add this prop
}

interface MobileChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isThinking: boolean;
  onReset: () => void;
  onFeedback: () => void;
}

interface ChatMessageListProps {
  messages: Message[];
  isThinking: boolean;
  setThoughtSteps: (steps: ThoughtStep[] | ((prev: ThoughtStep[]) => ThoughtStep[])) => void; // Add missing prop
}

const MobileChatInput = ({ inputValue, setInputValue, handleSendMessage, isThinking, onReset, onFeedback }: MobileChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  return (
    <div className="p-4 bg-background/95 backdrop-blur-sm border-t border-border/20">
      <form onSubmit={handleSendMessage} className="relative">
        <div className="flex items-end bg-muted/60 backdrop-blur-sm rounded-3xl border border-border/20 p-2 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="flex-shrink-0 h-10 w-10 rounded-full hover:bg-muted/80 transition-colors"
                disabled={isThinking}
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-40 bg-background/95 backdrop-blur-sm border border-border/20 rounded-xl shadow-lg"
            >
              <DropdownMenuItem
                onClick={onFeedback}
                className="flex items-center gap-2 hover:bg-muted/50 rounded-lg m-1 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Feedback</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onReset}
                className="flex items-center gap-2 hover:bg-muted/50 rounded-lg m-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message"
            disabled={isThinking}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 max-h-32 min-h-[20px] leading-relaxed px-2 py-3 text-sm placeholder:text-muted-foreground/60"
            rows={1}
          />

          <Button
            type="submit"
            size="icon"
            disabled={isThinking || !inputValue.trim()}
            className="flex-shrink-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export const MobileChatInterface = ({
  isShoppingListOpen,
  setIsShoppingListOpen,
  isLeftoversOpen,
  setIsLeftoversOpen,
  setThoughtSteps,
  session,
  thoughtSteps,
  pendingMessage,
  onMessageSent,
  isRightPanelOpen, // Destructure isRightPanelOpen
  toggleSidebar,    // Destructure toggleSidebar
}: MobileChatInterfaceProps) => {
  const [isAmazonProductViewOpen, setIsAmazonProductViewOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false); // Add state for FeedbackWidget
  const navigate = useNavigate();

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
    setPlan: () => { },
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
    onGetShoppingListItems: async () => shoppingListItems,
    onCreateShoppingListItems: addShoppingListItems,
    onUpdateShoppingListItem: onUpdateShoppingListItemCrud,
    onDeleteShoppingListItems: removeShoppingListItems,
    onReplaceShoppingList: replaceShoppingList,
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

  useEffect(() => {
    if (pendingMessage && !isThinking) {
      setInputValue(pendingMessage);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSendMessageWithForm = (e: React.FormEvent) => {
    handleSendMessage(e);
  };

  const handleResetRequest = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    resetConversation();
    setShowResetConfirm(false);
  };

  const handleFeedback = () => {
    setIsFeedbackOpen(true); // Open the feedback dialog
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile Header - Centered */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/20">
        <div className="flex justify-between items-center px-4 py-3">
          {/* Empty left side for spacing */}
          <div className="w-9"></div>

          {/* Center - Mise title with dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <span className="text-xl font-medium text-foreground">Mise</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-52 mt-2 bg-background/95 backdrop-blur-sm border border-border/20 rounded-xl shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => {
                  setIsShoppingListOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-lg m-1 cursor-pointer transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Shopping</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate('/inventory');
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-lg m-1 cursor-pointer transition-colors"
              >
                <Package className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Inventory</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsLeftoversOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-lg m-1 cursor-pointer transition-colors"
              >
                <Utensils className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Leftovers</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 hover:bg-red-50/50 rounded-lg m-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-500">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right - Menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-muted/50 rounded-lg transition-colors"
            onClick={toggleSidebar} // Add onClick handler to open sidebar
            aria-label="Open thought process sidebar"
            aria-expanded={isRightPanelOpen ? "true" : "false"}
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pt-16 pb-32"> {/* Increased padding-bottom */}
        <div className="px-4">
          <ChatMessageList messages={messages} isThinking={isThinking} setThoughtSteps={setThoughtSteps} />
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Mobile Chat Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <MobileChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessageWithForm}
          isThinking={isThinking}
          onReset={handleResetRequest}
          onFeedback={handleFeedback}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        id="mobile-thought-process-sidebar"
        role="complementary"
        aria-label="Thought process sidebar"
        className={`lg:hidden fixed inset-y-0 right-0 z-sidebar mobile-sidebar-width bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ top: '80px' }}
      >
        {/* Mobile Sidebar Header */}
        <div className="flex-shrink-0 p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">AI Thought Process</h2>
            <Button
              onClick={toggleSidebar}
              aria-label="Close sidebar"
              className="p-2 rounded-full hover:bg-muted transition-colors duration-200 focus-ring"
              variant="ghost"
              size="icon"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Sidebar Content */}
        <div className="flex-1 min-h-0 p-4 sidebar-scroll">
          <ThoughtProcess steps={thoughtSteps} />
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isRightPanelOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-backdrop transition-opacity duration-300 animate-fade-in"
          style={{ top: '80px' }}
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Shopping List Dialog */}
      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
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

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the conversation? This will clear all messages and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AmazonProductView
        isOpen={isAmazonProductViewOpen}
        onClose={() => setIsAmazonProductViewOpen(false)}
        productName=""
      />
      <FeedbackWidget open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </div>
  );
};