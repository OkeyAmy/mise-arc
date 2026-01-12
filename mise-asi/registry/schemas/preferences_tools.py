"""
Preferences tool schemas
Maps to: src/lib/functions/preferenceTools.ts and crudPreferencesTools.ts
"""

get_user_preferences_tool = {
    "name": "getUserPreferences",
    "description": "Gets the user's dietary preferences, restrictions, and goals.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

update_user_preferences_tool = {
    "name": "updateUserPreferences",
    "description": "Updates the user's dietary preferences.",
    "input_schema": {
        "type": "object",
        "properties": {
            "dietary_restrictions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of dietary restrictions (e.g., 'vegetarian', 'gluten-free')"
            },
            "allergies": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of food allergies"
            },
            "calorie_goal": {"type": "number", "description": "Daily calorie goal"},
            "protein_goal": {"type": "number", "description": "Daily protein goal in grams"},
            "cuisine_preferences": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Preferred cuisines"
            }
        },
        "required": []
    }
}

# CRUD tools
get_user_preferences_data_tool = {
    "name": "getUserPreferencesData",
    "description": "Get complete user preferences data.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

create_user_preferences_tool = {
    "name": "createUserPreferences",
    "description": "Create user preferences if they don't exist.",
    "input_schema": {
        "type": "object",
        "properties": {
            "preferences": {
                "type": "object",
                "description": "Initial preferences object"
            }
        },
        "required": ["preferences"]
    }
}

update_user_preferences_partial_tool = {
    "name": "updateUserPreferencesPartial",
    "description": "Partially update user preferences.",
    "input_schema": {
        "type": "object",
        "properties": {
            "updates": {
                "type": "object",
                "description": "Fields to update"
            }
        },
        "required": ["updates"]
    }
}
