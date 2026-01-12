export interface Meal {
  name: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: { item: string; quantity: number; unit: string }[];
}

export interface DayPlan {
  date: string;
  day: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
  };
}

export interface MealPlan {
  plan_id: string;
  days: DayPlan[];
}

export interface ShoppingListItem {
  item: string;
  quantity: number;
  unit: string;
}

export interface ThoughtStep {
  id: string;
  step: string;
  status: 'pending' | 'active' | 'completed';
  details?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  restrictions: string[];
  goals: string[];
  habits: string[];
  inventory: string[];
  meal_ratings: Record<string, number>;
  swap_preferences: {
    swap_frequency: "low" | "medium" | "high";
    preferred_cuisines: string[];
    disliked_ingredients: string[];
  };
  cultural_heritage?: string | null;
  family_size?: number | null;
  notes?: string | null;
  key_info?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface LeftoverItem {
  id: string;
  user_id: string;
  meal_name: string;
  servings: number;
  date_created: string; // ISO date string
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    id: string;
  }>;
  functionResults?: Array<{
    functionCallId: string;
    functionName: string;
    result: any;
  }>;
}
