import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlerUtils";
import { deleteCachedResults } from "./amazonSearchHandlers";

export const handleShoppingListCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { 
    addThoughtStep, 
    onGetShoppingListItems,
    onCreateShoppingListItems,
    onUpdateShoppingListItem,
    onDeleteShoppingListItems,
    onReplaceShoppingList
  } = args;
  
  console.log("🔧 CRUD Shopping List Handler Called:", functionCall.name);
  console.log("🔧 Available callbacks:", {
    onGetShoppingListItems: !!onGetShoppingListItems,
    onCreateShoppingListItems: !!onCreateShoppingListItems,
    onUpdateShoppingListItem: !!onUpdateShoppingListItem,
    onDeleteShoppingListItems: !!onDeleteShoppingListItems,
    onReplaceShoppingList: !!onReplaceShoppingList
  });
  
  let funcResultMsg = "";

  // GET - Retrieve shopping list items
  if (functionCall.name === "getShoppingListItems") {
    try {
      if (onGetShoppingListItems) {
        const shoppingListItems = await onGetShoppingListItems();
        addThoughtStep("✅ Retrieved shopping list items");
        
        if (shoppingListItems.length > 0) {
          let listDetails = "Current shopping list items:\n\n";
          shoppingListItems.forEach((item: any) => {
            listDetails += `- ${item.quantity} ${item.unit} of ${item.item}\n`;
          });
          funcResultMsg = listDetails;
        } else {
          funcResultMsg = "Shopping list is empty.";
        }
      } else {
        funcResultMsg = "Get shopping list function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error getting shopping list:", e);
      funcResultMsg = "I had trouble retrieving your shopping list.";
    }
  }

  // POST - Create new shopping list items
  else if (functionCall.name === "createShoppingListItems") {
    try {
      const { items } = functionCall.args as { items: { item: string; quantity: number; unit: string; }[] };
      console.log("📝 Creating shopping list items:", items);
      
      if (onCreateShoppingListItems) {
        await onCreateShoppingListItems(items);
        const itemNames = items.map(item => `${item.quantity} ${item.unit} of ${item.item}`).join(', ');
        funcResultMsg = `I've added ${items.length} item(s) to your shopping list: ${itemNames}.`;
        console.log("✅ Successfully created shopping list items");
      } else {
        console.log("❌ onCreateShoppingListItems callback not available");
        funcResultMsg = "Add to shopping list function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error creating shopping list items:", e);
      funcResultMsg = "I had trouble adding items to your shopping list.";
    }
    addThoughtStep("✅ Created shopping list items");
  }

  // PUT - Replace entire shopping list
  else if (functionCall.name === "replaceShoppingList") {
    try {
      const { items } = functionCall.args as { items: { item: string; quantity: number; unit: string; }[] };
      console.log("🔄 Replacing entire shopping list with:", items);
      
      if (onReplaceShoppingList) {
        await onReplaceShoppingList(items);
        if (items.length === 0) {
          funcResultMsg = "I've cleared your shopping list completely.";
          
          // Amazon cache cleanup - clear all cache when shopping list is cleared
          try {
            const { clearAmazonSearchCacheTool } = await import("../../../lib/functions/amazonSearchTools");
            const { handleAmazonSearchFunctions } = await import("./amazonSearchHandlers");
            await handleAmazonSearchFunctions(
              { name: "clearAmazonSearchCache", args: {} },
              args
            );
            console.log("✅ Cleared all Amazon search cache");
          } catch (error) {
            console.error("⚠️ Failed to clear Amazon cache:", error);
          }
        } else {
          funcResultMsg = `I've replaced your shopping list with ${items.length} new item(s).`;
        }
        console.log("✅ Successfully replaced shopping list");
      } else {
        console.log("❌ onReplaceShoppingList callback not available");
        funcResultMsg = "Replace shopping list function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error replacing shopping list:", e);
      funcResultMsg = "I had trouble replacing your shopping list.";
    }
    addThoughtStep("✅ Replaced shopping list");
  }

  // PATCH - Update shopping list item
  else if (functionCall.name === "updateShoppingListItem") {
    try {
      const { item_name, quantity, unit } = functionCall.args as { item_name: string; quantity?: number; unit?: string };
      console.log("📝 Updating shopping list item:", { item_name, quantity, unit });
      
      if (onUpdateShoppingListItem) {
        const updates: { quantity?: number; unit?: string } = {};
        if (quantity !== undefined) updates.quantity = quantity;
        if (unit !== undefined) updates.unit = unit;
        
        await onUpdateShoppingListItem(item_name, updates);
        const updatedFields = Object.keys(updates).join(' and ');
        funcResultMsg = `I've updated the ${updatedFields} for ${item_name} in your shopping list.`;
        console.log("✅ Successfully updated shopping list item");
      } else {
        console.log("❌ onUpdateShoppingListItem callback not available");
        funcResultMsg = "Update shopping list function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error updating shopping list item:", e);
      funcResultMsg = "I had trouble updating the shopping list item.";
    }
    addThoughtStep("✅ Updated shopping list item");
  }

  // DELETE - Remove shopping list items
  else if (functionCall.name === "deleteShoppingListItems") {
    try {
      const { item_names } = functionCall.args as { item_names: string[] };
      console.log("🗑️ Deleting shopping list items:", item_names);
      
      if (onDeleteShoppingListItems) {
        await onDeleteShoppingListItems(item_names);
        const itemList = item_names.join(', ');
        funcResultMsg = `I've removed the following item(s) from your shopping list: ${itemList}.`;
        console.log("✅ Successfully deleted shopping list items");

        // Amazon cache cleanup
        for (const item_name of item_names) {
          await deleteCachedResults(item_name);
        }
      } else {
        console.log("❌ onDeleteShoppingListItems callback not available");
        funcResultMsg = "Delete shopping list function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error deleting shopping list items:", e);
      funcResultMsg = "I had trouble removing items from your shopping list.";
    }
    addThoughtStep("✅ Deleted shopping list items");
  }

  console.log("🏁 CRUD Shopping List Handler Result:", funcResultMsg);
  return funcResultMsg;
};
