"""
Notes Handlers
Maps to: src/hooks/chat/handlers/notesHandlers.ts
"""
from handlers.types import FunctionCall, HandlerContext
from utils import update_user_notes


def handle_notes_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """Handle notes function calls"""
    name = function_call["name"]
    args = function_call.get("args", {})
    
    if name == "updateUserNotes":
        return handle_update_notes(args, ctx)
    
    return f"Unknown notes function: {name}"


def handle_update_notes(args: dict, ctx: HandlerContext) -> str:
    """Update user notes (overwrite)"""
    try:
        notes = args.get("notes", "")
        
        update_user_notes(ctx.user_id, notes)
        
        ctx.log_step("✅ Executed: updateUserNotes")
        return "Updated your notes."
        
    except Exception as e:
        ctx.log_step("❌ updateUserNotes failed")
        return f"Failed to update notes: {str(e)}"
