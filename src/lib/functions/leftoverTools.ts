
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getLeftoversTool: FunctionDeclaration = {
  name: "getLeftovers",
  description: "Retrieves a list of the user's current leftover meals from previous days.",
  parameters: { type: SchemaType.OBJECT, properties: {} },
};

export const addLeftoverTool: FunctionDeclaration = {
  name: "addLeftover",
  description: "Adds a new meal to the user's list of leftovers.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      meal_name: { type: SchemaType.STRING, description: "The name of the leftover meal (e.g., 'Spaghetti Bolognese')." },
      servings: { type: SchemaType.NUMBER, description: "The number of servings available." },
      notes: { type: SchemaType.STRING, description: "Any notes about the leftover meal." },
    },
    required: ["meal_name", "servings"],
  },
};

export const updateLeftoverTool: FunctionDeclaration = {
  name: "updateLeftover",
  description: "Updates an existing leftover item, for example, to change the number of servings.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      leftover_id: { type: SchemaType.STRING, description: "The ID of the leftover item to update." },
      servings: { type: SchemaType.NUMBER, description: "The new number of servings." },
      notes: { type: SchemaType.STRING, description: "Updated notes for the leftover." }
    },
    required: ["leftover_id"],
  },
};

export const adjustLeftoverServingsTool: FunctionDeclaration = {
  name: "adjustLeftoverServings",
  description: "Adjusts the serving count of a leftover by a specific amount (positive to add, negative to subtract). Use this when user says 'remove X servings' or 'add X servings' or 'ate X plates/bowls'.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      meal_name: { type: SchemaType.STRING, description: "The name of the leftover meal to adjust (e.g., 'beans', 'rice')." },
      serving_adjustment: { type: SchemaType.NUMBER, description: "The amount to adjust servings by. Use negative numbers for removal (e.g., -1 for 'remove 1 plate', -2 for 'ate 2 bowls')." },
    },
    required: ["meal_name", "serving_adjustment"],
  },
};

export const removeLeftoverTool: FunctionDeclaration = {
  name: "removeLeftover",
  description: "Completely removes a meal from the user's leftovers list. Use this only when the user wants to delete the entire leftover item, not just reduce servings.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      leftover_id: { type: SchemaType.STRING, description: "The ID of the leftover item to remove." },
      meal_name: { type: SchemaType.STRING, description: "The name of the leftover meal to remove (e.g., 'Spaghetti Bolognese'). Use this for removal by name." },
    },
  },
};

export const showLeftoversTool: FunctionDeclaration = {
    name: "showLeftovers",
    description: "Shows the leftovers UI popup to the user.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
};
