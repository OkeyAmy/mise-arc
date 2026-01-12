
import { FunctionCall } from "@google/generative-ai";
import { UserPreferences } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handlePreferencesCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onGetUserPreferences, onUpdateUserPreferences } = args;
  let funcResultMsg = "";

  // GET - Retrieve user preferences
  if (functionCall.name === "getUserPreferencesData") {
    try {
      if (onGetUserPreferences) {
        const preferences = await onGetUserPreferences();
        addThoughtStep("✅ Retrieved user preferences");
        
        if (preferences) {
          const sanitizedData = sanitizeDataForDisplay(preferences);
          funcResultMsg = `User preferences data:
ID: ${sanitizedData.id}
Dietary Restrictions: ${JSON.stringify(sanitizedData.restrictions)}
Health Goals: ${JSON.stringify(sanitizedData.goals)}
Eating Habits: ${JSON.stringify(sanitizedData.habits)}
Cultural Heritage: ${sanitizedData.cultural_heritage || 'Not specified'}
Family Size: ${sanitizedData.family_size || 'Not specified'}
Swap Preferences: ${JSON.stringify(sanitizedData.swap_preferences)}
Meal Ratings: ${JSON.stringify(sanitizedData.meal_ratings)}
Notes: ${sanitizedData.notes || 'No notes'}
Key Info: ${JSON.stringify(sanitizedData.key_info)}`;
        } else {
          funcResultMsg = "No user preferences found.";
        }
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble retrieving your preferences.";
    }
  }

  // POST - Create new user preferences (typically used for initialization)
  else if (functionCall.name === "createUserPreferences") {
    try {
      const rawPreferencesData = functionCall.args as any;
      console.log("🔧 Raw preference creation data:", rawPreferencesData);
      
      if (onUpdateUserPreferences) {
        // Ensure JSONB fields are properly structured
        const processedData: Partial<UserPreferences> = { ...rawPreferencesData };
        
        // Initialize swap_preferences if provided but not fully structured
        if (processedData.swap_preferences) {
          processedData.swap_preferences = {
            swap_frequency: "medium",
            preferred_cuisines: [],
            disliked_ingredients: [],
            ...processedData.swap_preferences
          };
        }
        
        // Initialize meal_ratings as empty object if not provided
        if (!processedData.meal_ratings) {
          processedData.meal_ratings = {};
        }
        
        // Initialize key_info as empty object if not provided
        if (!processedData.key_info) {
          processedData.key_info = {};
        }
        
        console.log("🔧 Processed preference creation data:", processedData);
        await onUpdateUserPreferences(processedData);
        funcResultMsg = "I've created your user preferences profile.";
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error creating preferences:", e);
      funcResultMsg = "I had trouble creating your preferences.";
    }
    addThoughtStep("✅ Created user preferences");
  }

  // PUT - Replace entire preferences profile
  else if (functionCall.name === "replaceUserPreferences") {
    try {
      const rawPreferencesData = functionCall.args as any;
      console.log("🔧 Raw preference replacement data:", rawPreferencesData);
      
      if (onUpdateUserPreferences) {
        // For PUT, we replace all user preferences with new data, but ensure JSONB structure
        const processedData: Partial<UserPreferences> = { ...rawPreferencesData };
        
        // Ensure swap_preferences is properly structured
        if (processedData.swap_preferences) {
          processedData.swap_preferences = {
            swap_frequency: "medium",
            preferred_cuisines: [],
            disliked_ingredients: [],
            ...processedData.swap_preferences
          };
        }
        
        // Ensure meal_ratings is an object
        if (!processedData.meal_ratings) {
          processedData.meal_ratings = {};
        }
        
        // Ensure key_info is an object
        if (!processedData.key_info) {
          processedData.key_info = {};
        }
        
        console.log("🔧 Processed preference replacement data:", processedData);
        await onUpdateUserPreferences(processedData);
        funcResultMsg = "I've completely replaced your preferences profile.";
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error replacing preferences:", e);
      funcResultMsg = "I had trouble replacing your preferences.";
    }
    addThoughtStep("✅ Replaced user preferences");
  }

  // PATCH - Partially update user preferences
  else if (functionCall.name === "updateUserPreferencesPartial") {
    try {
      const rawUpdates = functionCall.args as any;
      console.log("🔧 Raw preference updates received:", rawUpdates);
      
      if (onUpdateUserPreferences && onGetUserPreferences) {
        // First, get current preferences to merge with updates properly
        const currentPreferences = await onGetUserPreferences();
        
        // Process the updates to handle nested JSONB objects properly
        const processedUpdates: Partial<UserPreferences> = {};
        
        // Handle direct field updates
        const directFields = ['restrictions', 'goals', 'habits', 'inventory', 'cultural_heritage', 'family_size', 'notes'];
        directFields.forEach(field => {
          if (rawUpdates[field] !== undefined) {
            (processedUpdates as any)[field] = rawUpdates[field];
          }
        });
        
        // Handle swap_preferences JSONB object
        if (rawUpdates.swap_preferences !== undefined) {
          console.log("🔧 Processing swap_preferences update:", rawUpdates.swap_preferences);
          // Merge with existing swap_preferences if any
          const currentSwapPrefs = currentPreferences?.swap_preferences || {
            swap_frequency: "medium",
            preferred_cuisines: [],
            disliked_ingredients: []
          };
          
          processedUpdates.swap_preferences = {
            ...currentSwapPrefs,
            ...rawUpdates.swap_preferences
          };
        }
        
        // Handle meal_ratings JSONB object
        if (rawUpdates.meal_ratings !== undefined) {
          const currentMealRatings = currentPreferences?.meal_ratings || {};
          processedUpdates.meal_ratings = {
            ...currentMealRatings,
            ...rawUpdates.meal_ratings
          };
        }
        
        // Handle key_info JSONB object
        if (rawUpdates.key_info !== undefined) {
          const currentKeyInfo = currentPreferences?.key_info || {};
          processedUpdates.key_info = {
            ...currentKeyInfo,
            ...rawUpdates.key_info
          };
        }
        
        console.log("🔧 Processed preference updates:", processedUpdates);
        
        await onUpdateUserPreferences(processedUpdates);
        const updatedFields = Object.keys(processedUpdates).join(', ');
        funcResultMsg = `I've updated the following preference fields: ${updatedFields}.`;
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error updating preferences:", e);
      funcResultMsg = "I had trouble updating your preferences.";
    }
    addThoughtStep("✅ Updated user preferences");
  }

  // DELETE - Remove specific preference fields (set to null/default)
  else if (functionCall.name === "deleteUserPreferenceFields") {
    try {
      const { fields } = functionCall.args as { fields: string[] };
      if (onUpdateUserPreferences) {
        const resetData: Partial<UserPreferences> = {};
        fields.forEach(field => {
          switch (field) {
            case 'restrictions':
            case 'goals':
            case 'habits':
            case 'inventory':
              (resetData as any)[field] = [];
              break;
            case 'meal_ratings':
            case 'key_info':
              (resetData as any)[field] = {};
              break;
            case 'swap_preferences':
              (resetData as any)[field] = {
                swap_frequency: "medium",
                preferred_cuisines: [],
                disliked_ingredients: []
              };
              break;
            default:
              (resetData as any)[field] = null;
          }
        });
        
        await onUpdateUserPreferences(resetData);
        funcResultMsg = `I've reset the following preference fields: ${fields.join(', ')}.`;
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble resetting your preference fields.";
    }
    addThoughtStep("✅ Reset user preference fields");
  }

  return funcResultMsg;
};
