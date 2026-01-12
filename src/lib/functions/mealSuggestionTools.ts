
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { MealSchema } from '../schemas/mealSchema';

export const suggestMealTool: FunctionDeclaration = {
  name: "suggestMeal",
  description: "Suggests a single meal to the user based on their preferences, inventory, and the current time.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      meal: MealSchema,
      justification: { type: SchemaType.STRING, description: "A friendly explanation for why this meal was suggested, mentioning user goals and available ingredients." },
      missing_ingredients: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item: { type: SchemaType.STRING },
            quantity: { type: SchemaType.NUMBER },
            unit: { type: SchemaType.STRING }
          },
          required: ["item", "quantity", "unit"]
        },
        description: "A list of ingredients required for the meal that are not in the user's current inventory."
      }
    },
    required: ["meal", "justification"]
  },
};
