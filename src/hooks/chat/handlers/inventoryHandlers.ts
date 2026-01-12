import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handleInventoryFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onUpdateInventory, onGetInventory } = args;
  let funcResultMsg = "";

  if (functionCall.name === "updateInventory") {
    try {
      const { items } = functionCall.args as { items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[] };
      if (onUpdateInventory) {
        await onUpdateInventory(items);
        funcResultMsg = "I've updated your inventory with the new items.";
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your inventory.";
    }
    addThoughtStep("✅ Executed: updateInventory");
  } else if (functionCall.name === "getInventory") {
    try {
      if (onGetInventory) {
        const inventoryItems = await onGetInventory();
        addThoughtStep(
          "🔨 Retrieving current inventory data",
          "Loading all available ingredients and quantities",
          "completed"
        );
        
        if (inventoryItems.length > 0) {
          const sanitizedData = sanitizeDataForDisplay(inventoryItems);
          
          // Organize items by category for better readability
          const itemsByCategory: { [key: string]: any[] } = {};
          sanitizedData.forEach((item: any) => {
            const category = item.category || 'Other';
            if (!itemsByCategory[category]) {
              itemsByCategory[category] = [];
            }
            itemsByCategory[category].push(item);
          });

          let inventoryDetails = "Current pantry and refrigerator inventory:\n\n";
          
          for (const [category, items] of Object.entries(itemsByCategory)) {
            inventoryDetails += `**${category}:**\n`;
            items.forEach(item => {
              inventoryDetails += `- ${item.quantity} ${item.unit} of ${item.item_name}`;
              if (item.location) inventoryDetails += ` (stored in ${item.location})`;
              if (item.notes) inventoryDetails += ` - Notes: ${item.notes}`;
              inventoryDetails += '\n';
            });
            inventoryDetails += '\n';
          }
          
          inventoryDetails += "Use these ingredients to suggest meals that maximize the use of available items and minimize food waste.";
          funcResultMsg = inventoryDetails;
        } else {
          funcResultMsg = "The pantry and refrigerator are currently empty. The user will need to go shopping before you can suggest meals based on available ingredients. Ask them what they'd like to cook and help them create a shopping list.";
        }
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble fetching your inventory.";
    }
    addThoughtStep("✅ Executed: getInventory");
  }

  return funcResultMsg;
};
