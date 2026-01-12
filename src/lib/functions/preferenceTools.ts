
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getUserPreferencesTool: FunctionDeclaration = {
  name: "getUserPreferences",
  description: "Retrieves the user's saved preferences, including dietary restrictions, allergies, health goals, and liked/disliked cuisines or ingredients.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

export const updateUserPreferencesTool: FunctionDeclaration = {
  name: "updateUserPreferences",
  description: "Updates the user's preferences. Use this when the user specifies new allergies, goals, cultural background, family size, or other long-term preferences and notes. Use key_info to store any other specific facts.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      restrictions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of dietary restrictions (e.g. 'vegetarian', 'gluten-free')." },
      goals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of health or nutrition goals." },
      swap_preferences: {
        type: SchemaType.OBJECT,
        properties: {
          preferred_cuisines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Cuisines the user prefers." },
          disliked_ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Ingredients the user wants to avoid." }
        }
      },
      cultural_heritage: { type: SchemaType.STRING, description: "The user's cultural heritage or background, e.g. 'Nigerian, Yoruba'." },
      family_size: { type: SchemaType.NUMBER, description: "The number of people in the user's family or household." },
      notes: { type: SchemaType.STRING, description: "General notes about the user's preferences, facts, or any other information to remember about them. Use this to store information when the user says 'remember that...' or asks 'what do you know about me?'." },
      key_info: {
        type: SchemaType.OBJECT,
        description: "A JSON object for storing any other specific, open-ended facts about the user as key-value pairs (e.g., {'favorite_color': 'blue', 'works_night_shift': true}). Use this to remember miscellaneous details.",
        properties: {}
      }
    },
  },
};
