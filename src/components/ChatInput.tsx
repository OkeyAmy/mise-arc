import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Plus, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ResetConversationButton } from "./ResetConversationButton";
import FeedbackWidget from "./FeedbackWidget";
import React from "react";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  isThinking: boolean;
  onResetConversation: () => void;
}

export const ChatInput = ({ 
  inputValue, 
  setInputValue, 
  handleSendMessage, 
  isThinking,
  onResetConversation 
}: ChatInputProps) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [currentSuggestion, setCurrentSuggestion] = React.useState(0);
  const [displayText, setDisplayText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(true);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

  const suggestions = [
    "suggest a meal for dinner...",
    "create a weekly meal plan...",
    "add bread and eggs to my shopping list...",
    "what can I make with the ingredients I have?",
    "remember that I'm allergic to peanuts.",
    "log my leftover chicken soup.",
    "show me what's in my inventory.",
    "generate a shopping list for my meal plan."
  ];

  const baseText = "Ask Mise to ";

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isTyping) {
      const targetText = suggestions[currentSuggestion];
      const currentLength = displayText.length;
      
      if (currentLength < targetText.length) {
        timeout = setTimeout(() => {
          setDisplayText(targetText.slice(0, currentLength + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    } else {
      const targetText = suggestions[currentSuggestion];
      const currentLength = displayText.length;
      
      if (currentLength > 0) {
        timeout = setTimeout(() => {
          setDisplayText(targetText.slice(0, currentLength - 1));
        }, 50);
      } else {
        setCurrentSuggestion((prev) => (prev + 1) % suggestions.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentSuggestion, suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
    <div className="p-1">
      <div className={`border rounded-2xl px-2 py-1 transition-colors ${isFocused ? 'ring-2 ring-ring' : ''}`}>
        <form onSubmit={handleSendMessage} className="flex gap-1 items-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                type="button" 
                size="icon" 
                variant="ghost"
                className="flex-shrink-0 h-8 w-8"
                disabled={isThinking}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setIsFeedbackOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Send Feedback</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <ResetConversationButton 
                  onReset={onResetConversation}
                  iconOnly={false}
                  className="w-full justify-start h-auto p-2 text-sm"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Textarea
            ref={textareaRef}
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder={baseText + displayText}
            disabled={isThinking}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 resize-none bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 max-h-24 min-h-[32px] leading-tight py-1"
            rows={1}
          />
          
          <Button 
            type="submit" 
            size="icon" 
            disabled={isThinking || !inputValue.trim()}
            className="flex-shrink-0 h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      <FeedbackWidget open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </div>
  );
};
