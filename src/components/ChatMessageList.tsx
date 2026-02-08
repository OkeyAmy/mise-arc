import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { PurchasePanel } from "./PurchasePanel";
import { ShoppingListItem } from "@/data/schema";
import { AmazonProductMap } from "@/hooks/useAmazonProducts";
import { PurchaseItem } from "@/hooks/usePurchaseFlow";


interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface ChatMessageListProps {
  messages: Message[];
  isThinking: boolean;
  // Purchase flow props
  shoppingListItems?: ShoppingListItem[];
  amazonProducts?: AmazonProductMap;
  isProductsLoading?: boolean;
  activePurchaseMessageId?: number | null;
  purchaseItems?: PurchaseItem[];
  isPurchasePanelOpen?: boolean;
  onTogglePurchasePanel?: () => void;
  onUpdatePurchaseQuantity?: (itemName: string, quantity: number) => void;
  onBuyNow?: () => void;
  onCancelPurchase?: () => void;
}


export const ChatMessageList = ({
  messages,
  isThinking,
  activePurchaseMessageId,
  purchaseItems = [],
  isPurchasePanelOpen = false,
  onTogglePurchasePanel,
  onUpdatePurchaseQuantity,
  onBuyNow,
  onCancelPurchase,
  isProductsLoading = false,
}: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-6 p-6">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={cn("flex items-end gap-3", message.sender === "user" ? "justify-end" : "justify-start")}>
              {message.sender === 'bot' && (
                <Avatar className="h-8 w-8 shadow-sm border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn(
                "max-w-[80%] glass-card p-4 text-sm font-inter tracking-tight shadow-lg chat-message-hover",
                message.sender === "user"
                  ? "glass-button-primary text-primary-foreground rounded-br-lg"
                  : "glass-medium text-card-foreground rounded-bl-lg border-border/20"
              )}>
                {message.sender === "bot" ? (
                  <MarkdownRenderer content={message.text} />
                ) : (
                  <div className="leading-relaxed whitespace-pre-wrap">{message.text}</div>
                )}
              </div>

              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 shadow-sm border-2 border-muted-foreground/20">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Purchase Panel - Appears below messages with purchaseIntent */}
            {message.purchaseIntent &&
              message.id === activePurchaseMessageId &&
              purchaseItems.length > 0 &&
              onTogglePurchasePanel &&
              onUpdatePurchaseQuantity &&
              onBuyNow &&
              onCancelPurchase && (
                <div className="ml-11 mr-11">
                  <PurchasePanel
                    items={purchaseItems}
                    isOpen={isPurchasePanelOpen}
                    onToggle={onTogglePurchasePanel}
                    onUpdateQuantity={onUpdatePurchaseQuantity}
                    onBuyNow={onBuyNow}
                    onCancel={onCancelPurchase}
                    isProductsLoading={isProductsLoading}
                  />
                </div>
              )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-end gap-3 justify-start">
            <Avatar className="h-8 w-8 shadow-sm border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[80%] glass-medium p-4 text-sm glass-card text-card-foreground rounded-bl-lg border-border/20 font-inter tracking-tight">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse glass-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse glass-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse glass-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
