import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleInventoryCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { 
    addThoughtStep, 
    onGetInventory, 
    onCreateInventoryItems,
    onUpdateInventoryItem, 
    onDeleteInventoryItem 
  } = args;
  
  console.log("🔧 CRUD Inventory Handler Called:", functionCall.name);
  console.log("🔧 Available callbacks:", {
    onGetInventory: !!onGetInventory,
    onCreateInventoryItems: !!onCreateInventoryItems,
    onUpdateInventoryItem: !!onUpdateInventoryItem,
    onDeleteInventoryItem: !!onDeleteInventoryItem,
  });
  
  let funcResultMsg = "";

  // GET - Retrieve inventory items
  if (functionCall.name === "getInventoryItems") {
    try {
      if (onGetInventory) {
        const inventoryItems = await onGetInventory();
        addThoughtStep("✅ Retrieved inventory items");
        
        if (inventoryItems.length > 0) {
          let inventoryDetails = "Current inventory items:\n\n";
          inventoryItems.forEach((item: any) => {
            inventoryDetails += `- ID: ${item.id}\n`;
            inventoryDetails += `  Item: ${item.item_name}\n`;
            inventoryDetails += `  Quantity: ${item.quantity} ${item.unit}\n`;
            inventoryDetails += `  Category: ${item.category}\n`;
            inventoryDetails += `  Location: ${item.location || 'Not specified'}\n`;
            if (item.notes) inventoryDetails += `  Notes: ${item.notes}\n`;
            inventoryDetails += '\n';
          });
          funcResultMsg = inventoryDetails;
        } else {
          funcResultMsg = "No inventory items found.";
        }
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error getting inventory:", e);
      funcResultMsg = "I had trouble retrieving your inventory.";
    }
  }

  // POST - Create new inventory items
  else if (functionCall.name === "createInventoryItems") {
    try {
      const { items } = functionCall.args as { items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[] };
      console.log("📝 Creating inventory items:", items);
      
      if (onCreateInventoryItems) {
        await onCreateInventoryItems(items);
        const itemNames = items.map(item => item.item_name).join(', ');
        funcResultMsg = `I've added ${items.length} new inventory item(s): ${itemNames}. You can see them in your inventory now.`;
        console.log("✅ Successfully created inventory items");
      } else {
        console.log("❌ onCreateInventoryItems callback not available");
        funcResultMsg = "Create inventory function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error creating inventory items:", e);
      funcResultMsg = "I had trouble creating the inventory items.";
    }
    addThoughtStep("✅ Created inventory items");
  }

  // PUT - Replace entire inventory item
  else if (functionCall.name === "replaceInventoryItem") {
    try {
      const { item_id, item_data } = functionCall.args as { 
        item_id: string; 
        item_data: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }
      };
      console.log("🔄 Replacing entire inventory item:", { item_id, item_data });
      
      if (onUpdateInventoryItem && onGetInventory) {
        // Check if item_id is actually an item name (not a UUID format)
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(item_id);
        
        let actualId = item_id;
        
        if (!isUUID) {
          // item_id is actually an item name, need to look up the real ID
          console.log("🔍 Looking up inventory item by name:", item_id);
          const inventoryItems = await onGetInventory();
          const normalize = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');
          const itemNameNormalized = normalize(item_id);
          const foundItem = inventoryItems.find(item => normalize(item.item_name) === itemNameNormalized);
          
          if (foundItem) {
            actualId = foundItem.id;
            console.log("✅ Found inventory item ID:", actualId);
          } else {
            console.log("❌ No inventory item found with name:", item_id);
            funcResultMsg = `I couldn't find an inventory item named '${item_id}'.`;
            return funcResultMsg;
          }
        }
        
        // For PUT, we replace the entire item with new data
        await onUpdateInventoryItem(actualId, item_data);
        funcResultMsg = `I've completely replaced your ${item_data.item_name} inventory item. The changes are now visible in your inventory.`;
        console.log("✅ Successfully replaced inventory item");
      } else {
        console.log("❌ onUpdateInventoryItem callback not available");
        funcResultMsg = "Update inventory function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error replacing inventory item:", e);
      funcResultMsg = "I had trouble replacing the inventory item.";
    }
    addThoughtStep("✅ Replaced inventory item");
  }

  // PATCH - Partially update inventory item
  else if (functionCall.name === "updateInventoryItem") {
    try {
      const { item_id, updates } = functionCall.args as { 
        item_id: string; 
        updates: { item_name?: string; quantity?: number; unit?: string; category?: string; location?: string; notes?: string; }
      };
      console.log("📝 Updating inventory item:", { item_id, updates });
      
      if (onUpdateInventoryItem && onGetInventory) {
        // Check if item_id is actually an item name (not a UUID format)
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(item_id);
        
        let actualId = item_id;
        let itemName = item_id;
        
        if (!isUUID) {
          // item_id is actually an item name, need to look up the real ID
          console.log("🔍 Looking up inventory item by name:", item_id);
          const inventoryItems = await onGetInventory();
          const normalize = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');
          const itemNameNormalized = normalize(item_id);
          const foundItem = inventoryItems.find(item => normalize(item.item_name) === itemNameNormalized);
          
          if (foundItem) {
            actualId = foundItem.id;
            itemName = foundItem.item_name;
            console.log("✅ Found inventory item ID:", actualId);
          } else {
            console.log("❌ No inventory item found with name:", item_id);
            funcResultMsg = `I couldn't find an inventory item named '${item_id}'.`;
            return funcResultMsg;
          }
        }
        
        // For PATCH, we only update the specified fields
        await onUpdateInventoryItem(actualId, updates);
        
        const updatedFields = Object.keys(updates).join(', ');
        funcResultMsg = `I've updated the following fields for ${itemName}: ${updatedFields}. You can see the changes in your inventory now.`;
        console.log("✅ Successfully updated inventory item");
      } else {
        console.log("❌ onUpdateInventoryItem callback not available");
        funcResultMsg = "Update inventory function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error updating inventory item:", e);
      funcResultMsg = "I had trouble updating the inventory item.";
    }
    addThoughtStep("✅ Updated inventory item");
  }

  // DELETE - Remove inventory item
  else if (functionCall.name === "deleteInventoryItem") {
    try {
      const { item_id } = functionCall.args as { item_id: string };
      console.log("🗑️ Deleting inventory item:", item_id);
      
      if (onDeleteInventoryItem && onGetInventory) {
        // Check if item_id is actually an item name (not a UUID format)
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(item_id);
        
        let actualId = item_id;
        let itemName = item_id;
        
        if (!isUUID) {
          // item_id is actually an item name, need to look up the real ID
          console.log("🔍 Looking up inventory item by name:", item_id);
          const inventoryItems = await onGetInventory();
          const normalize = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');
          const itemNameNormalized = normalize(item_id);
          const foundItem = inventoryItems.find(item => normalize(item.item_name) === itemNameNormalized);
          
          if (foundItem) {
            actualId = foundItem.id;
            itemName = foundItem.item_name;
            console.log("✅ Found inventory item ID:", actualId);
          } else {
            console.log("❌ No inventory item found with name:", item_id);
            funcResultMsg = `I couldn't find an inventory item named '${item_id}'.`;
            return funcResultMsg;
          }
        }
        
        await onDeleteInventoryItem(actualId);
        funcResultMsg = `I've deleted ${itemName} from your inventory. It has been completely removed.`;
        console.log("✅ Successfully deleted inventory item");
      } else {
        console.log("❌ onDeleteInventoryItem callback not available");
        funcResultMsg = "Delete inventory function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error deleting inventory item:", e);
      funcResultMsg = "I had trouble deleting the inventory item.";
    }
    addThoughtStep("✅ Deleted inventory item");
  }

  console.log("🏁 CRUD Inventory Handler Result:", funcResultMsg);
  return funcResultMsg;
};
