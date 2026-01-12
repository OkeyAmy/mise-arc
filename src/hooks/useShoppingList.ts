import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";

const isValidUUID = (str: string | null | undefined): str is string => {
  if (!str) return false;
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return regex.test(str);
};

export function useShoppingList(session: Session | null, mealPlanId: string) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the user's shopping list
  const fetchList = useCallback(async () => {
    if (!session?.user.id) return;

    setIsLoading(true);

    let query = supabase
      .from("shopping_lists")
      .select("items, id")
      .eq("user_id", session.user.id);
    
    if (isValidUUID(mealPlanId)) {
      query = query.eq("meal_plan_id", mealPlanId);
    } else {
      query = query.is("meal_plan_id", null);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching shopping list:", error);
    }

    if (data && Array.isArray(data.items)) {
      setItems(data.items as unknown as ShoppingListItem[]);
    } else {
      setItems([]);
    }
    setIsLoading(false);
  }, [session, mealPlanId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Remove multiple items from the shopping list
  const removeItems = async (itemNames: string[]) => {
    console.log("🛒 removeItems called with:", itemNames);
    console.log("🔐 session user id:", session?.user.id);
    console.log("📋 mealPlanId:", mealPlanId);
    
    if (!session?.user.id || itemNames.length === 0) {
      console.log("❌ Aborting removeItems: no session or empty itemNames");
      return;
    }

    try {
      let query = supabase
        .from("shopping_lists")
        .select("id, items")
        .eq("user_id", session.user.id);
        
      if (isValidUUID(mealPlanId)) {
        query = query.eq("meal_plan_id", mealPlanId);
      } else {
        query = query.is("meal_plan_id", null);
      }
      
      console.log("🔍 Fetching current shopping list from database...");
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("❌ Error fetching shopping list before removal:", error);
        return;
      }

      console.log("📊 Current shopping list data from DB:", data);

      if (data && Array.isArray(data.items)) {
        const lowerCaseItemNames = itemNames.map(name => name.toLowerCase());
        console.log("🔍 Items to remove (lowercase):", lowerCaseItemNames);
        
        const currentItems = data.items as unknown as ShoppingListItem[];
        console.log("📝 Current items before filtering:", currentItems);
        
        const filtered = currentItems.filter((i: ShoppingListItem) => !lowerCaseItemNames.includes(i.item.toLowerCase()));
        console.log("✂️ Filtered items after removal:", filtered);
        
        console.log("💾 Updating database with filtered items...");
        const updateResult = await supabase
          .from("shopping_lists")
          .update({ items: filtered as any })
          .eq("id", data.id);
        
        console.log("📈 Database update result:", updateResult);

        if (updateResult.error) {
          console.error("❌ Database update failed:", updateResult.error);
        } else {
          console.log("✅ Database updated successfully");
          setItems(filtered);
          console.log("🔄 Local state updated with filtered items");
        }
      } else {
        console.log("❌ No data or items array not found");
      }
    } catch (error) {
      console.error("❌ Exception in removeItems:", error);
    }
  };

  // Remove a single item, for UI interaction
  const removeItem = async (itemName: string) => {
    await removeItems([itemName]);
  };

  // Update a single item's quantity and/or unit
  const updateItem = async (itemName: string, quantity?: number, unit?: string) => {
    console.log("🛒 updateItem called with:", { itemName, quantity, unit });
    
    if (!session?.user.id) {
      console.log("❌ Aborting updateItem: no session");
      return;
    }

    try {
      // Get current shopping list
      let query = supabase
        .from("shopping_lists")
        .select("id, items")
        .eq("user_id", session.user.id);
        
      if (isValidUUID(mealPlanId)) {
        query = query.eq("meal_plan_id", mealPlanId);
      } else {
        query = query.is("meal_plan_id", null);
      }
      
      console.log("🔍 Fetching current shopping list for update...");
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("❌ Error fetching shopping list before update:", error);
        return;
      }

      if (data && Array.isArray(data.items)) {
        const currentItems = data.items as unknown as ShoppingListItem[];
        const updatedItems = currentItems.map(item => {
          if (item.item.toLowerCase() === itemName.toLowerCase()) {
            return {
              ...item,
              quantity: quantity !== undefined ? quantity : item.quantity,
              unit: unit !== undefined ? unit : item.unit
            };
          }
          return item;
        });
        
        console.log("💾 Updating database with modified items...");
        const updateResult = await supabase
          .from("shopping_lists")
          .update({ items: updatedItems as any })
          .eq("id", data.id);
        
        console.log("📈 Database update result:", updateResult);

        if (updateResult.error) {
          console.error("❌ Database update failed:", updateResult.error);
        } else {
          console.log("✅ Database updated successfully");
          setItems(updatedItems);
          console.log("🔄 Local state updated with modified items");
        }
      }
    } catch (error) {
      console.error("❌ Exception in updateItem:", error);
    }
  };

  // Replace the whole shopping list when a new one is generated
  const saveList = async (newItems: ShoppingListItem[]) => {
    console.log("saveList called with:", newItems);
    console.log("session user id:", session?.user.id);
    console.log("mealPlanId:", mealPlanId);
    
    if (!session?.user.id) {
      console.log("Aborting saveList: no session");
      return;
    }

    let query = supabase
      .from("shopping_lists")
      .select("id")
      .eq("user_id", session.user.id);

    if (isValidUUID(mealPlanId)) {
      query = query.eq("meal_plan_id", mealPlanId);
    } else {
      query = query.is("meal_plan_id", null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error saving shopping list (select phase):", error);
      return;
    }

    console.log("Existing shopping list record:", data);

    if (data && data.id) {
      console.log("Updating existing shopping list with ID:", data.id);
      const updateResult = await supabase
        .from("shopping_lists")
        .update({ items: newItems as any, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      console.log("Update result:", updateResult);
    } else {
      console.log("Creating new shopping list record");
      const insertResult = await supabase
        .from("shopping_lists")
        .insert({
          user_id: session.user.id,
          meal_plan_id: isValidUUID(mealPlanId) ? mealPlanId : null,
          items: newItems as any,
        });
      console.log("Insert result:", insertResult);
    }
    setItems(newItems);
    console.log("Local state updated with new items:", newItems);
  };

  // Add items to the shopping list, merging if they already exist
  const addItems = async (itemsToAdd: ShoppingListItem[]) => {
    if (!session?.user.id || itemsToAdd.length === 0) return;

    // First, fetch the most up-to-date list from the database to avoid stale state issues.
    let query = supabase
      .from("shopping_lists")
      .select("id, items")
      .eq("user_id", session.user.id);

    if (isValidUUID(mealPlanId)) {
      query = query.eq("meal_plan_id", mealPlanId);
    } else {
      query = query.is("meal_plan_id", null);
    }
    
    const { data: currentList, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error("Error fetching shopping list before adding items:", fetchError);
      // Optionally, you could show a toast to the user here.
      return;
    }
    
    const currentItems = (currentList?.items as unknown as ShoppingListItem[]) || [];
    const newItems = [...currentItems];
    const normalize = (name: string) => name.toLowerCase().trim().replace(/es$|s$/, '');

    itemsToAdd.forEach(itemToAdd => {
        const newItemNameNormalized = normalize(itemToAdd.item);
        const existingItemIndex = newItems.findIndex(i => 
            normalize(i.item) === newItemNameNormalized
        );

        if (existingItemIndex > -1) {
            const existingItem = newItems[existingItemIndex];
            // If units are the same, we add quantities. This is a simple "add more" case.
            if (existingItem.unit.toLowerCase() === itemToAdd.unit.toLowerCase()) {
                existingItem.quantity += itemToAdd.quantity;
            } else {
                // If units are different, we assume it's a correction/update and replace the item.
                // This handles cases like "2 yams (piece)" replacing "1 yam (medium)".
                newItems[existingItemIndex] = itemToAdd;
            }
        } else {
            newItems.push(itemToAdd);
        }
    });

    // `saveList` will handle both updating the DB and setting the local state.
    await saveList(newItems);
  };

  return { items, isLoading, removeItem, removeItems, saveList, addItems, fetchList, setItems, updateItem };
}
