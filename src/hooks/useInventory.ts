
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  location: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const INVENTORY_CATEGORIES = {
  proteins: "Proteins",
  vegetables: "Vegetables", 
  fruits: "Fruits",
  grains: "Grains & Cereals",
  dairy: "Dairy & Eggs",
  spices: "Spices & Seasonings",
  pantry_staples: "Pantry Staples",
  beverages: "Beverages",
  frozen: "Frozen Items",
  canned: "Canned Goods",
  other: "Other"
} as const;

export function useInventory(session: Session | null, onRestockRecommendation?: (item: InventoryItem) => void) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!session?.user.id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", session.user.id)
      .order("category", { ascending: true })
      .order("item_name", { ascending: true });

    if (data) setItems(data);
    if (error) console.error("Error fetching inventory:", error);
    setIsLoading(false);
  }, [session]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!session?.user.id) return;
    const { data, error } = await supabase
      .from("user_inventory")
      .insert({ ...item, user_id: session.user.id })
      .select()
      .single();

    if (data) setItems(prev => [...prev, data]);
    return { data, error };
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!session?.user.id) return;
    
    // If quantity is being updated to 0 or below, delete the item instead
    if (updates.quantity !== undefined && updates.quantity <= 0) {
      return await deleteItem(id, true); // Pass true to indicate this is from quantity update
    }
    
    const { data, error } = await supabase
      .from("user_inventory")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (data) setItems(prev => prev.map(item => item.id === id ? data : item));
    return { data, error };
  };

  const deleteItem = async (id: string, fromQuantityUpdate = false) => {
    if (!session?.user.id) return;
    
    // Get the item before deleting it for restock recommendation
    const itemToDelete = items.find(item => item.id === id);
    
    const { error } = await supabase.from("user_inventory").delete().eq("id", id);
    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
      
      // Show restock recommendation if item was deleted due to zero quantity
      if (fromQuantityUpdate && itemToDelete && onRestockRecommendation) {
        onRestockRecommendation(itemToDelete);
      }
    }
    return { error };
  };

  const upsertItem = async (item: Partial<Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { item_name: string }) => {
    if (!session?.user.id) return;
    
    const normalize = (name: string) => name.toLowerCase().trim().replace(/es$|s$/, '');
    const normalizedNewItemName = normalize(item.item_name);
    
    // Find existing item by normalized name (case-insensitive and handles simple plurals)
    const existingItem = items.find(i => normalize(i.item_name) === normalizedNewItemName);
    
    // If quantity is 0 or below, delete the item instead of upserting
    if (item.quantity !== undefined && item.quantity <= 0) {
      if (existingItem) {
        return await deleteItem(existingItem.id, true); // Pass true to indicate this is from quantity update
      }
      // If item doesn't exist and quantity is 0, just return without doing anything
      return { data: null, error: null };
    }
    
    // Use the existing item's proper casing if found, otherwise use the new name
    const finalItemName = existingItem ? existingItem.item_name : item.item_name;
    
    const { data, error } = await supabase
      .from("user_inventory")
      .upsert({ 
        ...item, 
        item_name: finalItemName,
        user_id: session.user.id 
      }, { onConflict: 'user_id, item_name' })
      .select().single();
    
    if (error) {
        toast.error(`Failed to upsert ${finalItemName}: ${error.message}`);
    } else if (data) {
        setItems(prev => {
            const index = prev.findIndex(i => i.id === data.id);
            if (index > -1) {
                const newItems = [...prev];
                newItems[index] = data;
                return newItems;
            }
            return [...prev, data];
        });
    }
    return {data, error};
  };

  const getItemsByCategory = (category: string) => items.filter(item => item.category === category);

  const searchItems = (query: string) => items.filter(item => 
    item.item_name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return { items, isLoading, addItem, updateItem, deleteItem, getItemsByCategory, searchItems, fetchInventory, upsertItem, categories: INVENTORY_CATEGORIES };
}
