import { FunctionCall } from "@google/generative-ai";
import { ShoppingListItem } from "@/data/schema";
import { FunctionHandlerArgs } from "./handlerUtils";
import { deleteCachedResults } from "./amazonSearchHandlers";

export const handleShoppingListFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, setIsShoppingListOpen, shoppingListItems, onAddItemsToShoppingList, onRemoveItemsFromShoppingList } = args;
  let funcResultMsg = "";

  if (functionCall.name === "showShoppingList") {
    setIsShoppingListOpen(true);
    funcResultMsg = "I've opened your shopping list for you.";
    addThoughtStep("✅ Executed: showShoppingList");
  } else if (functionCall.name === "getShoppingList") {
    addThoughtStep(
      "🔨 Retrieving shopping list data",
      "Loading all items planned for purchase",
      "completed"
    );
    
    if (shoppingListItems && shoppingListItems.length > 0) {
      let shoppingListDetails = "Current shopping list items:\n\n";
      
      shoppingListItems.forEach(item => {
        shoppingListDetails += `- ${item.quantity} ${item.unit} of ${item.item}\n`;
      });
      
      shoppingListDetails += "\nUse this shopping list to help plan meals or suggest modifications based on what the user is planning to buy. You can also suggest additional items if needed for complete meal preparations.";
      funcResultMsg = shoppingListDetails;
    } else {
      funcResultMsg = "The shopping list is currently empty. You can suggest items to add based on meal recommendations or when the user mentions they need ingredients.";
    }
    addThoughtStep("✅ Executed: getShoppingList");
  } else if (functionCall.name === "addToShoppingList") {
    try {
      const { items } = functionCall.args as { items: ShoppingListItem[] };
      if (onAddItemsToShoppingList) {
        await onAddItemsToShoppingList(items);
        const itemNames = items.map(item => item.item).join(', ');
        funcResultMsg = `I've added ${itemNames} to your shopping list.`;
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble adding items to your shopping list.";
    }
    addThoughtStep("✅ Executed: addToShoppingList");
  } else if (functionCall.name === "removeFromShoppingList") {
    try {
      const { item_names } = functionCall.args as { item_names: string[] };
      console.log("🔧 Legacy removeFromShoppingList called with:", item_names);
      console.log("🔧 onRemoveItemsFromShoppingList callback available:", !!onRemoveItemsFromShoppingList);
      
      if (onRemoveItemsFromShoppingList) {
        console.log("🚀 Calling onRemoveItemsFromShoppingList...");
        await onRemoveItemsFromShoppingList(item_names);
        console.log("✅ onRemoveItemsFromShoppingList completed successfully");
        funcResultMsg = `I've removed ${item_names.join(', ')} from your shopping list.`;
        
        // Amazon cache cleanup
        for (const item_name of item_names) {
          await deleteCachedResults(item_name);
        }
        console.log("✅ Cleared Amazon cache for removed items");
      } else {
        console.log("❌ onRemoveItemsFromShoppingList callback not available");
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error in removeFromShoppingList handler:", e);
      funcResultMsg = "I had trouble removing items from your shopping list.";
    }
    addThoughtStep("✅ Executed: removeFromShoppingList");
  }

  return funcResultMsg;
};
