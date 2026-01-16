"""
Preferences tool schemas
Maps to: src/lib/functions/preferenceTools.ts and crudPreferencesTools.ts

IMPORTANT: Tool schemas now include ALL database fields.
Database fields: restrictions, goals, habits, family_size, cultural_heritage, 
                 notes, key_info, inventory, meal_ratings, swap_preferences
"""

get_user_preferences_tool = {
    "name": "getUserPreferences",
    "description": "Gets ALL of the user's preferences including dietary restrictions, goals, habits, family size, cultural heritage, notes, and stored key info. Returns complete data from database.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

update_user_preferences_tool = {
    "name": "updateUserPreferences",
    "description": "Updates the user's preferences. Accepts any of the following fields: restrictions (array), goals (array), habits (array), family_size (number), cultural_heritage (string), notes (string), key_info (object), inventory (array), meal_ratings (object), swap_preferences (object). Also maps common alternate names like dietary_restrictions, allergies, cuisine_preferences.",
    "input_schema": {
        "type": "object",
        "properties": {
            "restrictions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of dietary restrictions and allergies (e.g., 'vegetarian', 'gluten-free', 'nut allergy')"
            },
            "goals": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Health and nutrition goals (e.g., 'lose weight', 'build muscle', 'eat healthier')"
            },
            "habits": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Eating habits and preferences (e.g., 'meal prep on Sundays', 'no cooking on weekdays')"
            },
            "family_size": {"type": "number", "description": "Number of people in household"},
            "cultural_heritage": {"type": "string", "description": "Cultural background influencing food preferences"},
            "notes": {"type": "string", "description": "Any additional notes or context about the user"},
            "key_info": {"type": "object", "description": "Structured key information about the user"},
            "dietary_restrictions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Alias for restrictions field"
            },
            "allergies": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Alias for restrictions field"
            },
            "calorie_goal": {"type": "number", "description": "Daily calorie goal (stored in goals)"},
            "protein_goal": {"type": "number", "description": "Daily protein goal in grams (stored in goals)"},
            "cuisine_preferences": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Preferred cuisines (stored in habits)"
            }
        },
        "required": []
    }
}

# CRUD tools
get_user_preferences_data_tool = {
    "name": "getUserPreferencesData",
    "description": "Get complete user preferences data including all fields.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

create_user_preferences_tool = {
    "name": "createUserPreferences",
    "description": "Create user preferences if they don't exist. Accepts any preference fields.",
    "input_schema": {
        "type": "object",
        "properties": {
            "preferences": {
                "type": "object",
                "description": "Initial preferences object with any valid fields"
            }
        },
        "required": ["preferences"]
    }
}

update_user_preferences_partial_tool = {
    "name": "updateUserPreferencesPartial",
    "description": "Partially update user preferences with any fields.",
    "input_schema": {
        "type": "object",
        "properties": {
            "updates": {
                "type": "object",
                "description": "Fields to update - accepts any valid preference field"
            }
        },
        "required": ["updates"]
    }
}
