
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getShoppingListItemsTool: FunctionDeclaration = {
  name: "getShoppingListItems",
  description: "GET - Retrieves all shopping list items with their quantities and units.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

export const createShoppingListItemsTool: FunctionDeclaration = {
  name: "createShoppingListItems",
  description: "POST - Adds new items to the shopping list.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "Array of new shopping list items to add.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item: { type: SchemaType.STRING, description: "The name of the item." },
            quantity: { type: SchemaType.NUMBER, description: "The quantity of the item." },
            unit: { type: SchemaType.STRING, description: "The unit of measurement (e.g., 'gallon', 'loaf', 'piece')." },
          },
          required: ["item", "quantity", "unit"]
        }
      }
    },
    required: ["items"],
  },
};

export const replaceShoppingListTool: FunctionDeclaration = {
  name: "replaceShoppingList",
  description: "PUT - Completely replaces the entire shopping list with new items.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "Array of items to replace the entire shopping list.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item: { type: SchemaType.STRING, description: "The name of the item." },
            quantity: { type: SchemaType.NUMBER, description: "The quantity of the item." },
            unit: { type: SchemaType.STRING, description: "The unit of measurement." },
          },
          required: ["item", "quantity", "unit"]
        }
      }
    },
    required: ["items"],
  },
};

export const updateShoppingListItemTool: FunctionDeclaration = {
  name: "updateShoppingListItem",
  description: "PATCH - Updates the quantity and/or unit of a specific shopping list item.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      item_name: { type: SchemaType.STRING, description: "The name of the item to update." },
      quantity: { type: SchemaType.NUMBER, description: "Optional. New quantity for the item." },
      unit: { type: SchemaType.STRING, description: "Optional. New unit of measurement." },
    },
    required: ["item_name"],
  },
};

export const deleteShoppingListItemsTool: FunctionDeclaration = {
  name: "deleteShoppingListItems",
  description: "DELETE - Removes specific items from the shopping list.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      item_names: {
        type: SchemaType.ARRAY,
        description: "Array of item names to remove from the shopping list.",
        items: {
          type: SchemaType.STRING,
        }
      }
    },
    required: ["item_names"],
  },
};
