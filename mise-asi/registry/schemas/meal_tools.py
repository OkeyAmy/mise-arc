"""
Meal tool schemas
Maps to: src/lib/functions/mealSuggestionTools.ts and mealPlanTools.ts
"""

suggest_meal_tool = {
    "name": "suggestMeal",
    "description": "Suggests a meal based on user preferences, inventory, and nutritional goals. Returns meal with name, calories, macros, ingredients, justification, and missing ingredients.",
    "input_schema": {
        "type": "object",
        "properties": {
            "meal": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Meal name"},
                    "calories": {"type": "number", "description": "Total calories"},
                    "macros": {
                        "type": "object",
                        "properties": {
                            "protein": {"type": "number"},
                            "carbs": {"type": "number"},
                            "fat": {"type": "number"}
                        }
                    },
                    "ingredients": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "item": {"type": "string"},
                                "quantity": {"type": "number"},
                                "unit": {"type": "string"}
                            }
                        }
                    }
                },
                "required": ["name", "calories", "macros", "ingredients"]
            },
            "justification": {"type": "string", "description": "Why this meal fits the user"},
            "missing_ingredients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "item": {"type": "string"},
                        "quantity": {"type": "number"},
                        "unit": {"type": "string"}
                    }
                }
            }
        },
        "required": ["meal", "justification"]
    }
}

update_meal_plan_tool = {
    "name": "updateMealPlan",
    "description": "Updates the user's 7-day meal plan.",
    "input_schema": {
        "type": "object",
        "properties": {
            "day": {"type": "string", "description": "Day of the week"},
            "meal_type": {"type": "string", "enum": ["breakfast", "lunch", "dinner", "snack"]},
            "meal": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "calories": {"type": "number"},
                    "macros": {
                        "type": "object",
                        "properties": {
                            "protein": {"type": "number"},
                            "carbs": {"type": "number"},
                            "fat": {"type": "number"}
                        }
                    }
                }
            }
        },
        "required": ["day", "meal_type", "meal"]
    }
}
