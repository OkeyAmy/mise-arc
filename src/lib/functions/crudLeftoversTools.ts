
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getLeftoverItemsTool: FunctionDeclaration = {
  name: "getLeftoverItems",
  description: "GET - Retrieves all leftover items with their IDs, servings, and details.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

export const createLeftoverItemsTool: FunctionDeclaration = {
  name: "createLeftoverItems",
  description: "POST - Creates new leftover meal items.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "Array of new leftover items to create.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            meal_name: { type: SchemaType.STRING, description: "The name of the leftover meal." },
            servings: { type: SchemaType.NUMBER, description: "The number of servings available." },
            date_created: { type: SchemaType.STRING, description: "Optional. Date when the meal was created (YYYY-MM-DD format)." },
            notes: { type: SchemaType.STRING, description: "Optional. Notes about the leftover meal." },
          },
          required: ["meal_name", "servings"]
        }
      }
    },
    required: ["items"],
  },
};

export const replaceLeftoverItemTool: FunctionDeclaration = {
  name: "replaceLeftoverItem",
  description: "PUT - Completely replaces an entire leftover item with new data.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      leftover_id: { type: SchemaType.STRING, description: "The ID of the leftover item to replace." },
      leftover_data: {
        type: SchemaType.OBJECT,
        properties: {
          meal_name: { type: SchemaType.STRING, description: "The name of the leftover meal." },
          servings: { type: SchemaType.NUMBER, description: "The number of servings available." },
          notes: { type: SchemaType.STRING, description: "Optional. Notes about the leftover meal." },
        },
        required: ["meal_name", "servings"]
      }
    },
    required: ["leftover_id", "leftover_data"],
  },
};

export const updateLeftoverItemPartialTool: FunctionDeclaration = {
  name: "updateLeftoverItemPartial",
  description: "PATCH - Partially updates specific fields of a leftover item, including servings parsing.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      leftover_id: { type: SchemaType.STRING, description: "The ID of the leftover item to update." },
      updates: {
        type: SchemaType.OBJECT,
        properties: {
          meal_name: { type: SchemaType.STRING, description: "Optional. New name for the meal." },
          servings: { type: SchemaType.NUMBER, description: "Optional. New number of servings." },
          notes: { type: SchemaType.STRING, description: "Optional. New notes." },
        }
      }
    },
    required: ["leftover_id", "updates"],
  },
};

export const deleteLeftoverItemTool: FunctionDeclaration = {
  name: "deleteLeftoverItem",
  description: "DELETE - Removes a leftover item completely from the user's leftovers.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      leftover_id: { type: SchemaType.STRING, description: "The ID of the leftover item to delete." }
    },
    required: ["leftover_id"],
  },
};
