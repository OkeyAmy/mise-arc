import { FunctionCall } from "@google/generative-ai";
import { MealPlan } from "@/data/schema";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleMealFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, setPlan } = args;
  let funcResultMsg = "";

  if (functionCall.name === "suggestMeal") {
    addThoughtStep(
      "🔨 Processing meal suggestion",
      "Analyzing preferences and available ingredients to suggest a personalized meal",
      "completed"
    );
    
    const mealArgs = functionCall.args as {
      meal?: {
        name: string;
        calories: number;
        macros: {
          protein: number;
          carbs: number;
          fat: number;
        };
        ingredients: {
          item: string;
          quantity: number;
          unit: string;
        }[];
      };
      justification?: string;
      missing_ingredients?: {
        item: string;
        quantity: number;
        unit: string;
      }[];
    };

    let mealDetails = "Meal suggestion prepared:\n\n";
    
    if (mealArgs.meal) {
      mealDetails += `**Meal:** ${mealArgs.meal.name}\n`;
      mealDetails += `**Estimated Calories:** ${mealArgs.meal.calories}\n`;
      
      if (mealArgs.meal.macros) {
        mealDetails += `**Macros:** ${mealArgs.meal.macros.protein}g protein, ${mealArgs.meal.macros.carbs}g carbs, ${mealArgs.meal.macros.fat}g fat\n`;
      }
      
      if (mealArgs.meal.ingredients && mealArgs.meal.ingredients.length > 0) {
        mealDetails += `\n**Required Ingredients:**\n`;
        mealArgs.meal.ingredients.forEach(ingredient => {
          mealDetails += `- ${ingredient.quantity} ${ingredient.unit} of ${ingredient.item}\n`;
        });
      }
    }
    
    if (mealArgs.missing_ingredients && mealArgs.missing_ingredients.length > 0) {
      mealDetails += `\n**Missing Ingredients (need to buy):**\n`;
      mealArgs.missing_ingredients.forEach(ingredient => {
        mealDetails += `- ${ingredient.quantity} ${ingredient.unit} of ${ingredient.item}\n`;
      });
      mealDetails += "\nAsk the user if they want to add these missing ingredients to their shopping list.\n";
    } else {
      mealDetails += "\n✅ All ingredients are available in your current inventory!\n";
    }
    
    if (mealArgs.justification) {
      mealDetails += `\n**Why this meal was suggested:** ${mealArgs.justification}\n`;
    }
    
    mealDetails += "\nUse this information to present the meal suggestion to the user in a friendly, conversational way.";
    funcResultMsg = mealDetails;
    
    addThoughtStep("✅ Executed: suggestMeal");
  } else if (functionCall.name === "updateMealPlan") {
    const newPlan = functionCall.args as MealPlan;
    setPlan(newPlan);
    funcResultMsg = "Meal plan updated successfully.";
    addThoughtStep("✅ Executed: updateMealPlan");
  }
  return funcResultMsg;
};
