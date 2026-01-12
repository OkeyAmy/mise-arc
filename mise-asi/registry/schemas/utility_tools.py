"""
Utility tool schemas
Maps to: src/lib/functions/utilityTools.ts
"""

# Tool definition matching getCurrentTimeTool from utilityTools.ts
get_current_time_tool = {
    "name": "getCurrentTime",
    "description": "Gets the current date and time. Use this when the user asks what time it is or what the current date is.",
    "input_schema": {
        "type": "object",
        "properties": {
            "timezone": {
                "type": "string",
                "description": "Optional timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC."
            }
        },
        "required": []
    }
}
