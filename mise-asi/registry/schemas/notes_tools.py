"""
Notes tool schemas
Maps to: src/lib/functions/notesTools.ts
"""

update_user_notes_tool = {
    "name": "updateUserNotes",
    "description": "Updates the user's personal notes. This is an overwrite operation - the new notes replace any existing notes.",
    "input_schema": {
        "type": "object",
        "properties": {
            "notes": {"type": "string", "description": "The new notes content"}
        },
        "required": ["notes"]
    }
}
