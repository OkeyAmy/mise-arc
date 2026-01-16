"""
ASI Orchestrator
Main orchestration logic - Maps to: src/hooks/useChat.ts + gemini-proxy

This orchestrator:
1. Receives user messages
2. Calls LLM (ASI Cloud / OpenAI) with tools 
3. Executes function calls via handlers
4. Returns final response
"""
import json
from typing import Any
from openai import OpenAI

from config import settings
from registry import TOOLS
from handlers import handle_function_call, FunctionCall, HandlerContext
from utils import get_logger

logger = get_logger(__name__)


# System prompt - matches src/lib/prompts/systemPrompt.ts
SYSTEM_PROMPT = """You are Mise, a helpful AI meal planning assistant. You help users:
- Plan meals based on their preferences and what they have
- Manage their pantry/inventory
- Create and manage shopping lists
- Track leftovers
- Suggest meals with nutritional information

## CRITICAL WORKFLOW FOR MEAL SUGGESTIONS

When a user asks for meal suggestions, you MUST follow this order:

1. **First, call getUserPreferences** - Get the user's dietary restrictions, goals, family size, and cultural preferences
2. **Then, call getInventory** - See what ingredients the user already has in their pantry
3. **Next, call getLeftovers** - Check if there are any leftovers that should be used first (to reduce food waste)
4. **Finally, call suggestMeal** - Make a recommendation based on ALL the gathered information

### Priority Order for Meal Suggestions:
1. **Use leftovers first** - If there are leftovers, suggest ways to use or repurpose them
2. **Use existing inventory** - Suggest meals that can be made with ingredients the user already has
3. **Minimize shopping** - Only suggest meals requiring new ingredients if specifically asked for something different

## TOOL USAGE GUIDELINES

### Shopping List Operations:
- Use `createShoppingListItems` or `addToShoppingList` to add items
- Use `deleteShoppingListItems` or `removeFromShoppingList` to remove items
- Always confirm what was added/removed in your response

### Leftover Operations:
- Use `addLeftover` or `createLeftoverItems` to add leftovers
- Use `removeLeftover` or `deleteLeftoverItem` to remove leftovers
- Use `adjustLeftoverServings` to update serving counts

### Inventory Operations:
- Use `updateInventory` or `createInventoryItems` to add/update items
- Use `deleteInventoryItem` to remove items

## RESPONSE GUIDELINES
- Always verify operations completed successfully before confirming to the user
- If an operation fails, be honest and suggest the user try again
- Never expose internal IDs to users
- Format responses in a friendly, conversational way
- When suggesting meals, always explain WHY you're suggesting it (based on preferences, available ingredients, etc.)

Always aim to minimize food waste and help users eat better."""


class Orchestrator:
    """
    ASI Orchestrator - manages the conversation loop with function calling
    Uses OpenAI-compatible API (ASI Cloud)
    """
    
    def __init__(self):
        if not settings.ASICLOUD_API_KEY:
            raise ValueError("ASICLOUD_API_KEY not configured")
        
        self.client = OpenAI(
            api_key=settings.ASICLOUD_API_KEY,
            base_url=settings.ASICLOUD_BASE_URL
        )
        self.model = settings.MODEL_NAME
        self.temperature = 0.7
        self.max_iterations = 5
    
    def process_message(
        self, 
        message: str, 
        user_id: str,
        history: list[dict] | None = None
    ) -> dict:
        """
        Process a user message through the orchestration loop
        Returns: {"text": str, "function_calls": list, "thought_steps": list}
        """
        thought_steps: list[str] = []
        function_calls_made: list[dict] = []
        
        def add_thought_step(step: str, details: str | None = None, status: str = "completed"):
            thought_steps.append(step)
            logger.info(f"Thought: {step}")
        
        # Create handler context
        ctx = HandlerContext(
            user_id=user_id,
            add_thought_step=add_thought_step
        )
        
        # Build messages
        messages = history or []
        # Ensure system prompt is first
        if not messages or messages[0].get("role") != "system":
            messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
            
        messages.append({"role": "user", "content": message})
        
        # Convert tools to OpenAI format
        openai_tools = self._convert_tools_to_openai_format()
        
        iteration = 0
        final_response = ""
        
        while iteration < self.max_iterations:
            iteration += 1
            logger.info(f"Orchestration iteration {iteration}")
            
            try:
                # Call ASI Cloud / OpenAI
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=openai_tools,
                    tool_choice="auto",
                    temperature=self.temperature
                )
                
                response_message = response.choices[0].message
                
                # Check if model wants to use tools
                if response_message.tool_calls:
                    tool_calls = response_message.tool_calls
                    
                    logger.info(f"Model wants to use {len(tool_calls)} tool(s)")
                    
                    # Sanitize assistant message so we only resend plain dicts/strings
                    assistant_message = {
                        "role": "assistant",
                        # Some providers fail on null content when tool calls are present
                        "content": response_message.content or "",
                        "tool_calls": []
                    }
                    # The assistant message (with tool_calls) must be added before tool responses
                    messages.append(assistant_message)
                    
                    # Execute each tool
                    for tool_call in tool_calls:
                        tool_name = tool_call.function.name
                        raw_args = tool_call.function.arguments

                        # Accept both dict and JSON-string arguments from providers
                        if isinstance(raw_args, dict):
                            tool_args = raw_args
                        elif isinstance(raw_args, str):
                            try:
                                tool_args = json.loads(raw_args) if raw_args else {}
                            except Exception:
                                logger.warning(f"Could not parse args for {tool_name}: {raw_args}")
                                tool_args = {}
                        else:
                            tool_args = {}
                        
                        logger.info(f"Executing tool: {tool_name}")
                        add_thought_step(f"🔧 Calling: {tool_name}")

                        # Mirror tool call back to the model using a plain dict
                        assistant_message["tool_calls"].append({
                            "id": tool_call.id,
                            "type": tool_call.type,
                            "function": {
                                "name": tool_name,
                                # Re-encode to a JSON string as expected by the API
                                "arguments": json.dumps(tool_args)
                            }
                        })
                        
                        # Create function call and execute
                        func_call: FunctionCall = {
                            "name": tool_name,
                            "args": tool_args
                        }
                        
                        result = handle_function_call(func_call, ctx)
                        
                        function_calls_made.append({
                            "name": tool_name,
                            "args": tool_args,
                            "result": result
                        })
                        
                        # Add tool result to messages
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": tool_name,
                            "content": result
                        })
                    
                    continue
                
                else:
                    # Model provided final answer
                    final_response = response_message.content or ""
                    logger.info("Got final response from model")
                    break
                    
            except Exception as e:
                logger.exception("Orchestration error")
                fallback = (
                    function_calls_made[-1]["result"]
                    if function_calls_made
                    else "I ran into a problem after calling the tools."
                )
                final_response = (
                    f"I encountered an error processing your request: {str(e)}"
                    f"\n\nLatest tool output:\n{fallback}"
                )
                break
        
        if iteration >= self.max_iterations:
            final_response = "I've reached the maximum number of operations for this request. Please try a simpler question or start a new chat."
        
        return {
            "text": final_response,
            "function_calls": function_calls_made,
            "thought_steps": thought_steps
        }
    
    def _convert_tools_to_openai_format(self) -> list[dict]:
        """Convert our tool definitions to OpenAI's format"""
        openai_tools = []
        for tool in TOOLS:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["input_schema"]
                }
            })
        return openai_tools


# Singleton instance
_orchestrator: Orchestrator | None = None


def get_orchestrator() -> Orchestrator:
    """Get or create orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator
