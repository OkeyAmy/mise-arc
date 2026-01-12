"""
Leftovers tool schemas
Maps to: src/lib/functions/leftoverTools.ts and crudLeftoversTools.ts
"""

get_leftovers_tool = {
    "name": "getLeftovers",
    "description": "Gets all leftover items the user has.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

show_leftovers_tool = {
    "name": "showLeftovers",
    "description": "Opens the leftovers panel.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

add_leftover_tool = {
    "name": "addLeftover",
    "description": "Adds a leftover meal.",
    "input_schema": {
        "type": "object",
        "properties": {
            "meal_name": {"type": "string", "description": "Name of the meal"},
            "servings": {"type": "number", "description": "Number of servings remaining"},
            "date_created": {"type": "string", "description": "Date the leftover was created (YYYY-MM-DD)"},
            "notes": {"type": "string", "description": "Optional notes"}
        },
        "required": ["meal_name", "servings"]
    }
}

update_leftover_tool = {
    "name": "updateLeftover",
    "description": "Updates a leftover item.",
    "input_schema": {
        "type": "object",
        "properties": {
            "meal_name": {"type": "string", "description": "Name of the meal to update"},
            "servings": {"type": "number"},
            "notes": {"type": "string"}
        },
        "required": ["meal_name"]
    }
}

adjust_leftover_servings_tool = {
    "name": "adjustLeftoverServings",
    "description": "Adjusts the servings of a leftover (increment or decrement).",
    "input_schema": {
        "type": "object",
        "properties": {
            "meal_name": {"type": "string"},
            "adjustment": {"type": "number", "description": "Positive to add, negative to subtract"}
        },
        "required": ["meal_name", "adjustment"]
    }
}

remove_leftover_tool = {
    "name": "removeLeftover",
    "description": "Removes a leftover item.",
    "input_schema": {
        "type": "object",
        "properties": {
            "meal_name": {"type": "string", "description": "Name of the meal to remove"}
        },
        "required": ["meal_name"]
    }
}

# CRUD tools
create_leftover_items_tool = {
    "name": "createLeftoverItems",
    "description": "Create one or more leftover items.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "meal_name": {"type": "string"},
                        "servings": {"type": "number"},
                        "date_created": {"type": "string"},
                        "notes": {"type": "string"}
                    },
                    "required": ["meal_name", "servings"]
                }
            }
        },
        "required": ["items"]
    }
}

delete_leftover_item_tool = {
    "name": "deleteLeftoverItem",
    "description": "Delete a leftover by meal name.",
    "input_schema": {
        "type": "object",
        "properties": {
            "meal_name": {"type": "string"}
        },
        "required": ["meal_name"]
    }
}
