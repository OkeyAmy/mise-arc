import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThoughtStep, Message } from "@/data/schema";

export function useChatHistory(session: Session | null) {
  const [isLoading, setIsLoading] = useState(false);

  const saveChatSession = useCallback(async (messages: Message[], thoughtSteps: ThoughtStep[]) => {
    if (!session?.user.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .upsert({
          user_id: session.user.id,
          messages: messages as any,
          thought_steps: thoughtSteps as any,
        });
      
      if (error) {
        console.error("Error saving chat session:", error);
      }
    } catch (error) {
      console.error("Error saving chat session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const loadChatSession = useCallback(async (): Promise<{ messages: Message[], thoughtSteps: ThoughtStep[] } | null> => {
    if (!session?.user.id) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("messages, thought_steps")
        .eq("user_id", session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error loading chat session:", error);
        return null;
      }
      
      if (data) {
        return {
          messages: (data.messages as unknown as Message[]) || [],
          thoughtSteps: (data.thought_steps as unknown as ThoughtStep[]) || []
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error loading chat session:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const clearChatSession = useCallback(async () => {
    if (!session?.user.id) return;
    
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("user_id", session.user.id);
      
      if (error) {
        console.error("Error clearing chat session:", error);
      }
    } catch (error) {
      console.error("Error clearing chat session:", error);
    }
  }, [session]);

  return {
    saveChatSession,
    loadChatSession,
    clearChatSession,
    isLoading
  };
}
