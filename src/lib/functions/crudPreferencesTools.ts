
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getUserPreferencesDataTool: FunctionDeclaration = {
  name: "getUserPreferencesData",
  description: "GET - Retrieves complete user preferences data with all fields and IDs.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

export const createUserPreferencesTool: FunctionDeclaration = {
  name: "createUserPreferences",
  description: "POST - Creates a new user preferences profile (typically for initialization).",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      restrictions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Dietary restrictions and allergies." },
      goals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Health and nutrition goals." },
      habits: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Eating habits and routines." },
      cultural_heritage: { type: SchemaType.STRING, description: "Cultural background information." },
      family_size: { type: SchemaType.NUMBER, description: "Number of people in household." },
      swap_preferences: {
        type: SchemaType.OBJECT,
        properties: {
          swap_frequency: { type: SchemaType.STRING, description: "Frequency preference: low, medium, or high" },
          preferred_cuisines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          disliked_ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        }
      },
      notes: { type: SchemaType.STRING, description: "Additional notes." },
      key_info: { type: SchemaType.OBJECT, properties: {}, description: "Important user details." }
    },
  },
};

export const replaceUserPreferencesTool: FunctionDeclaration = {
  name: "replaceUserPreferences",
  description: "PUT - Completely replaces the entire user preferences profile.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      restrictions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Dietary restrictions and allergies." },
      goals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Health and nutrition goals." },
      habits: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Eating habits and routines." },
      cultural_heritage: { type: SchemaType.STRING, description: "Cultural background information." },
      family_size: { type: SchemaType.NUMBER, description: "Number of people in household." },
      swap_preferences: {
        type: SchemaType.OBJECT,
        properties: {
          swap_frequency: { type: SchemaType.STRING, description: "Frequency preference: low, medium, or high" },
          preferred_cuisines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          disliked_ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        }
      },
      notes: { type: SchemaType.STRING, description: "Additional notes." },
      key_info: { type: SchemaType.OBJECT, properties: {}, description: "Important user details." }
    },
  },
};

export const updateUserPreferencesPartialTool: FunctionDeclaration = {
  name: "updateUserPreferencesPartial",
  description: "PATCH - Partially updates specific fields of user preferences.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      restrictions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Optional. Dietary restrictions and allergies." },
      goals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Optional. Health and nutrition goals." },
      habits: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Optional. Eating habits and routines." },
      cultural_heritage: { type: SchemaType.STRING, description: "Optional. Cultural background information." },
      family_size: { type: SchemaType.NUMBER, description: "Optional. Number of people in household." },
      swap_preferences: {
        type: SchemaType.OBJECT,
        properties: {
          swap_frequency: { type: SchemaType.STRING, description: "Frequency preference: low, medium, or high" },
          preferred_cuisines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          disliked_ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        }
      },
      notes: { type: SchemaType.STRING, description: "Optional. Additional notes." },
      key_info: { type: SchemaType.OBJECT, properties: {}, description: "Optional. Important user details." }
    },
  },
};

export const deleteUserPreferenceFieldsTool: FunctionDeclaration = {
  name: "deleteUserPreferenceFields",
  description: "DELETE - Resets specific preference fields to their default values.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      fields: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "Array of field names to reset (e.g., ['restrictions', 'goals', 'notes'])."
      }
    },
    required: ["fields"],
  },
};
