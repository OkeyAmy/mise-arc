
export interface FunctionCallResult {
  type: "function_call";
  id: string; 
  call_id: string;
  name: string;
  arguments: string;
}

export interface SearchInventoryArgs {
  query: string;
  options: {
    category: string | null;
    available_only: boolean;
    sort_by: "name" | "quantity" | "expiry_date" | null;
  };
}

export interface UpdateUserPreferencesArgs {
  preferences: {
    liked_meals: string[];
    disliked_meals: string[];
    dietary_restrictions: string[];
    preferred_cuisines: string[];
  };
}

export interface GenerateShoppingListArgs {
  meal_plan_id: string;
  options: {
    exclude_inventory: boolean;
    budget_limit: number | null;
    store_preference: string | null;
  };
}

export interface RecordMealFeedbackArgs {
  meal_id: string;
  feedback: {
    rating: number;
    comments: string | null;
    liked_ingredients: string[];
    disliked_ingredients: string[];
    would_eat_again: boolean;
  };
}
