
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { INVENTORY_CATEGORIES } from "@/hooks/useInventory";

const categoryDescriptions = Object.values(INVENTORY_CATEGORIES).join(', ');

export const getInventoryItemsTool: FunctionDeclaration = {
  name: "getInventoryItems",
  description: "GET - Retrieves all inventory items with their IDs, quantities, units, and other details.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

export const createInventoryItemsTool: FunctionDeclaration = {
  name: "createInventoryItems",
  description: "POST - Creates new inventory items in the user's pantry/inventory.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "Array of new inventory items to create.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item_name: { type: SchemaType.STRING, description: "The name of the item." },
            quantity: { type: SchemaType.NUMBER, description: "The quantity of the item." },
            unit: { type: SchemaType.STRING, description: "The unit of measurement (e.g., 'kg', 'lbs', 'cups', 'piece')." },
            category: { 
              type: SchemaType.STRING, 
              description: `The category. Must be one of: ${Object.keys(INVENTORY_CATEGORIES).join(', ')}.`
            },
            location: { type: SchemaType.STRING, description: "Optional. Storage location." },
            notes: { type: SchemaType.STRING, description: "Optional. Notes about the item." }
          },
          required: ["item_name", "quantity", "unit", "category"]
        }
      }
    },
    required: ["items"],
  },
};

export const replaceInventoryItemTool: FunctionDeclaration = {
  name: "replaceInventoryItem",
  description: "PUT - Completely replaces an entire inventory item with new data.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      item_id: { type: SchemaType.STRING, description: "The ID of the item to replace." },
      item_data: {
        type: SchemaType.OBJECT,
        properties: {
          item_name: { type: SchemaType.STRING, description: "The name of the item." },
          quantity: { type: SchemaType.NUMBER, description: "The quantity of the item." },
          unit: { type: SchemaType.STRING, description: "The unit of measurement." },
          category: { type: SchemaType.STRING, description: "The category of the item." },
          location: { type: SchemaType.STRING, description: "Optional. Storage location." },
          notes: { type: SchemaType.STRING, description: "Optional. Notes about the item." }
        },
        required: ["item_name", "quantity", "unit", "category"]
      }
    },
    required: ["item_id", "item_data"],
  },
};

export const updateInventoryItemTool: FunctionDeclaration = {
  name: "updateInventoryItem",
  description: "PATCH - Partially updates specific fields of an inventory item, including quantity and unit parsing.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      item_id: { type: SchemaType.STRING, description: "The ID of the item to update." },
      updates: {
        type: SchemaType.OBJECT,
        properties: {
          item_name: { type: SchemaType.STRING, description: "Optional. New name for the item." },
          quantity: { type: SchemaType.NUMBER, description: "Optional. New quantity of the item." },
          unit: { type: SchemaType.STRING, description: "Optional. New unit of measurement." },
          category: { type: SchemaType.STRING, description: "Optional. New category." },
          location: { type: SchemaType.STRING, description: "Optional. New storage location." },
          notes: { type: SchemaType.STRING, description: "Optional. New notes." }
        }
      }
    },
    required: ["item_id", "updates"],
  },
};

export const deleteInventoryItemTool: FunctionDeclaration = {
  name: "deleteInventoryItem",
  description: "DELETE - Removes an inventory item completely from the user's inventory.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      item_id: { type: SchemaType.STRING, description: "The ID of the item to delete." }
    },
    required: ["item_id"],
  },
};
