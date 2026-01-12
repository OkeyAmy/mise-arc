
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";
import { validateShareToken, checkRateLimit, generateSecureToken } from "@/utils/securityValidation";

export function useSharedShoppingList(session: Session | null) {
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Create a shareable link for shopping list items
  const createShareableLink = useCallback(async (items: ShoppingListItem[], title?: string) => {
    if (!session?.user.id || items.length === 0) {
      throw new Error("No items to share or user not authenticated");
    }

    // Rate limiting check
    if (!checkRateLimit(`create_share_${session.user.id}`, 10, 60000)) {
      throw new Error("Too many share attempts. Please try again later.");
    }

    setIsCreating(true);
    try {
      const shareToken = generateSecureToken(32);
      
      const { data, error } = await supabase
        .from("shared_shopping_lists")
        .insert({
          share_token: shareToken,
          shared_by_user_id: session.user.id,
          items: items as any,
          title: title || "Shared Shopping List"
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      return { shareUrl, shareToken };
    } finally {
      setIsCreating(false);
    }
  }, [session]);

  // Get shared shopping list by token with security checks
  const getSharedList = useCallback(async (shareToken: string) => {
    // Validate token format
    if (!validateShareToken(shareToken)) {
      throw new Error("Invalid share token format");
    }

    // Rate limiting for access attempts
    if (!checkRateLimit(`access_share_${shareToken}`, 20, 60000)) {
      throw new Error("Too many access attempts. Please try again later.");
    }

    try {
      const { data, error } = await supabase
        .from("shared_shopping_lists")
        .select("*")
        .eq("share_token", shareToken)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error) {
        // Log access attempt for security monitoring
        console.warn('Failed shared list access attempt:', { shareToken, error: error.message });
        throw error;
      }

      // Log successful access for audit trail (simplified for now)
      console.log('Shared list accessed:', { shareToken, timestamp: new Date().toISOString() });

      return data;
    } catch (error) {
      console.error('Error accessing shared list:', error);
      throw error;
    }
  }, []);

  // Import shared items to user's shopping list
  const importSharedItems = useCallback(async (shareToken: string, onAddItems: (items: ShoppingListItem[]) => Promise<void>) => {
    if (!session?.user.id) {
      throw new Error("User not authenticated");
    }

    setIsImporting(true);
    try {
      const sharedList = await getSharedList(shareToken);
      const items = sharedList.items as unknown as ShoppingListItem[];
      
      if (items && items.length > 0) {
        await onAddItems(items);
        return { items, title: sharedList.title };
      }
      
      throw new Error("No items found in shared list");
    } finally {
      setIsImporting(false);
    }
  }, [session, getSharedList]);

  return {
    createShareableLink,
    getSharedList,
    importSharedItems,
    isCreating,
    isImporting
  };
}
