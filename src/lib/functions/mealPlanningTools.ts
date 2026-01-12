import { SearchInventoryArgs, UpdateUserPreferencesArgs, GenerateShoppingListArgs, RecordMealFeedbackArgs } from './types';

export const mealPlanningTools = [
  {
    type: "function" as const,
    function: {
      name: "search_inventory",
      description: "Search user's current food inventory/pantry to see what ingredients are available.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The ingredient or food item to search for."
          },
          options: {
            type: "object",
            properties: {
              category: {
                type: ["string", "null"],
                description: "Food category to filter by (e.g. 'proteins', 'vegetables', 'grains'). Pass null if not needed.",
                enum: ["proteins", "vegetables", "grains", "dairy", "fruits", "spices", "pantry_staples", null]
              },
              available_only: {
                type: "boolean",
                description: "Whether to only show items that are currently available (not expired)."
              },
              sort_by: {
                type: ["string", "null"],
                enum: ["name", "quantity", "expiry_date", null],
                description: "How to sort the results. Pass null if not needed."
              }
            },
            required: ["category", "available_only", "sort_by"],
            additionalProperties: false
          }
        },
        required: ["query", "options"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_user_preferences",
      description: "Update user's meal preferences based on their feedback about meals they've tried.",
      parameters: {
        type: "object",
        properties: {
          preferences: {
            type: "object",
            properties: {
              liked_meals: {
                type: "array",
                items: { type: "string" },
                description: "List of meal names the user enjoyed."
              },
              disliked_meals: {
                type: "array", 
                items: { type: "string" },
                description: "List of meal names the user didn't enjoy."
              },
              dietary_restrictions: {
                type: "array",
                items: { type: "string" },
                description: "User's dietary restrictions (e.g. 'vegetarian', 'gluten-free', 'dairy-free')."
              },
              preferred_cuisines: {
                type: "array",
                items: { type: "string" },
                description: "Cuisines the user prefers (e.g. 'Italian', 'Mexican', 'Asian')."
              }
            },
            required: ["liked_meals", "disliked_meals", "dietary_restrictions", "preferred_cuisines"],
            additionalProperties: false
          }
        },
        required: ["preferences"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_shopping_list",
      description: "Generate a shopping list based on the current meal plan and user's inventory.",
      parameters: {
        type: "object",
        properties: {
          meal_plan_id: {
            type: "string",
            description: "ID of the meal plan to generate shopping list for."
          },
          options: {
            type: "object",
            properties: {
              exclude_inventory: {
                type: "boolean",
                description: "Whether to exclude items already in user's inventory."
              },
              budget_limit: {
                type: ["number", "null"],
                description: "Maximum budget for shopping list. Pass null if no limit."
              },
              store_preference: {
                type: ["string", "null"],
                description: "Preferred store for shopping. Pass null if no preference."
              }
            },
            required: ["exclude_inventory", "budget_limit", "store_preference"],
            additionalProperties: false
          }
        },
        required: ["meal_plan_id", "options"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "record_meal_feedback",
      description: "Record user's feedback about a specific meal to improve future recommendations.",
      parameters: {
        type: "object",
        properties: {
          meal_id: {
            type: "string",
            description: "ID of the meal being reviewed."
          },
          feedback: {
            type: "object",
            properties: {
              rating: {
                type: "number",
                minimum: 1,
                maximum: 5,
                description: "Rating from 1-5 stars."
              },
              comments: {
                type: ["string", "null"],
                description: "Optional text comments about the meal."
              },
              liked_ingredients: {
                type: "array",
                items: { type: "string" },
                description: "Ingredients the user particularly enjoyed."
              },
              disliked_ingredients: {
                type: "array",
                items: { type: "string" },
                description: "Ingredients the user didn't like."
              },
              would_eat_again: {
                type: "boolean",
                description: "Whether the user would want this meal again."
              }
            },
            required: ["rating", "comments", "liked_ingredients", "disliked_ingredients", "would_eat_again"],
            additionalProperties: false
          }
        },
        required: ["meal_id", "feedback"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "getShoppingList",
      description: "Retrieves and reads out the user's current shopping list.",
      parameters: {
        type: "object",
        properties: {},
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "addToShoppingList",
      description: "Adds one or more items to the user's shopping list.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "A list of items to add to the shopping list.",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
              },
              required: ["item", "quantity", "unit"]
            }
          }
        },
        required: ["items"],
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "removeFromShoppingList",
      description: "Removes one or more items from the user's shopping list.",
      parameters: {
        type: "object",
        properties: {
          item_names: {
            type: "array",
            description: "A list of item names to remove from the shopping list.",
            items: {
              type: "string",
            }
          }
        },
        required: ["item_names"],
      }
    }
  }
];
