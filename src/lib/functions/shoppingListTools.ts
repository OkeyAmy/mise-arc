
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const showShoppingListTool: FunctionDeclaration = {
    name: "showShoppingList",
    description: "Shows the shopping list UI popup to the user. To get the content of the list, use getShoppingList.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
};

export const getShoppingListTool: FunctionDeclaration = {
  name: "getShoppingList",
  description: "Retrieves and reads out the user's current shopping list.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

export const addToShoppingListTool: FunctionDeclaration = {
  name: "addToShoppingList",
  description: "Adds one or more items to the user's shopping list. Use this function when the user confirms they want to add items you have suggested.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "A list of items to add to the shopping list.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item: { type: SchemaType.STRING, description: "The name of the item (e.g., 'Milk', 'Bread')." },
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

export const removeFromShoppingListTool: FunctionDeclaration = {
  name: "removeFromShoppingList",
  description: "Removes one or more items from the user's shopping list, for example when they have been purchased.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      item_names: {
        type: SchemaType.ARRAY,
        description: "A list of item names to remove from the shopping list.",
        items: {
          type: SchemaType.STRING,
        }
      }
    },
    required: ["item_names"],
  },
};
