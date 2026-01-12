
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { MealSchema } from "../schemas/mealSchema";

export const updateMealPlanTool: FunctionDeclaration = {
    name: "updateMealPlan",
    description: "Updates the user's weekly meal plan with a new, fully generated 7-day plan.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        plan_id: { type: SchemaType.STRING, description: "A unique ID for the meal plan, like a UUID." },
        days: {
          type: SchemaType.ARRAY,
          description: "A list of 7 daily meal plans.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              date: { type: SchemaType.STRING, description: "The date for the plan in YYYY-MM-DD format. Start from today." },
              day: { type: SchemaType.STRING, description: "The day of the week, e.g., 'Monday'." },
              meals: {
                type: SchemaType.OBJECT,
                properties: {
                  breakfast: MealSchema,
                  lunch: MealSchema,
                  dinner: MealSchema,
                  snacks: MealSchema,
                },
                required: ["breakfast", "lunch", "dinner", "snacks"]
              }
            },
            required: ["date", "day", "meals"]
          }
        }
      },
      required: ["plan_id", "days"],
    },
};
