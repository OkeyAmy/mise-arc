
import { ObjectSchema, SchemaType } from "@google/generative-ai";

export const MealSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: "The name of the meal." },
    calories: { type: SchemaType.NUMBER, description: "Estimated calories for the meal." },
    macros: {
      type: SchemaType.OBJECT,
      properties: {
        protein: { type: SchemaType.NUMBER, description: "Protein in grams." },
        carbs: { type: SchemaType.NUMBER, description: "Carbohydrates in grams." },
        fat: { type: SchemaType.NUMBER, description: "Fat in grams." }
      },
      required: ["protein", "carbs", "fat"]
    },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
          unit: { type: SchemaType.STRING }
        },
        required: ["item", "quantity", "unit"]
      }
    }
  },
  required: ["name", "calories", "macros", "ingredients"]
};
