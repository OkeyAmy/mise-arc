import { FunctionCall } from "@google/generative-ai";
import { UserPreferences } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handlePreferenceFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onGetUserPreferences, onUpdateUserPreferences } = args;
  let funcResultMsg = "";

  if (functionCall.name === "getUserPreferences") {
    try {
      if (onGetUserPreferences) {
        const preferences = await onGetUserPreferences();
        addThoughtStep(
          "🔨 Retrieving user preferences data",
          "Loading user's dietary preferences, restrictions, goals, and other saved information",
          "completed"
        );
        
        if (preferences) {
          const sanitizedData = sanitizeDataForDisplay(preferences);
          // Return the actual preference data so the LLM can read and use it
          funcResultMsg = `User preferences retrieved successfully. Here is the complete user profile data:

**Dietary Restrictions & Allergies:** ${sanitizedData.restrictions ? JSON.stringify(sanitizedData.restrictions) : 'None specified'}

**Health & Nutrition Goals:** ${sanitizedData.goals ? JSON.stringify(sanitizedData.goals) : 'None specified'}

**Eating Habits:** ${sanitizedData.habits ? JSON.stringify(sanitizedData.habits) : 'None specified'}

**Cultural Heritage:** ${sanitizedData.cultural_heritage || 'Not specified'}

**Family Size:** ${sanitizedData.family_size || 'Not specified'}

**Food Preferences:**
- Preferred Cuisines: ${sanitizedData.swap_preferences?.preferred_cuisines ? JSON.stringify(sanitizedData.swap_preferences.preferred_cuisines) : 'None specified'}
- Disliked Ingredients: ${sanitizedData.swap_preferences?.disliked_ingredients ? JSON.stringify(sanitizedData.swap_preferences.disliked_ingredients) : 'None specified'}
- Swap Frequency: ${sanitizedData.swap_preferences?.swap_frequency || 'Not specified'}

**Meal Ratings:** ${sanitizedData.meal_ratings ? JSON.stringify(sanitizedData.meal_ratings) : 'No meal ratings yet'}

**Additional Notes:** ${sanitizedData.notes || 'No additional notes'}

**Key Information:** ${sanitizedData.key_info ? JSON.stringify(sanitizedData.key_info) : 'No additional key information'}

Use this information to provide personalized meal suggestions and advice tailored to the user's specific needs, preferences, and goals.`;
        } else {
          funcResultMsg = "No preferences found in the system. The user hasn't set up their profile yet. You should ask them about their dietary restrictions, health goals, preferred cuisines, family size, and any food allergies to get started with personalized recommendations.";
        }
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble fetching your preferences. Please try again.";
    }
    addThoughtStep("✅ Executed: getUserPreferences");
  } else if (functionCall.name === "updateUserPreferences") {
    try {
      const updates = functionCall.args as Partial<UserPreferences>;
      if (onUpdateUserPreferences) {
        await onUpdateUserPreferences(updates);
        funcResultMsg = "I've updated your preferences. I'll keep this information in mind for future recommendations.";
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your preferences.";
    }
    addThoughtStep("✅ Executed: updateUserPreferences");
  }

  return funcResultMsg;
};
