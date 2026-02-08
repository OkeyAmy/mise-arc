"""
Agent Planner
Responsible for the PLANNING phase of the agentic workflow.

The planner:
1. Gathers ALL context in parallel (preferences, inventory, leftovers, shopping list, budget)
2. Uses the LLM to analyze the user's request and create an action plan
3. Ensures the AI has complete information BEFORE taking any action
"""
import json
from typing import Callable
from datetime import datetime

from google import genai
from google.genai import types

from config import settings
from utils import get_logger
from utils.supabase_client import (
    get_user_preferences,
    get_user_inventory,
    get_user_leftovers,
    get_user_shopping_list,
)
from .action_plan import ActionPlan, PlanStep, AgentContext, PlanStatus, PlanStepStatus

logger = get_logger(__name__)


# Context gathering functions that the planner will call in parallel
CONTEXT_FUNCTIONS = [
    "getUserPreferences",
    "getInventory",
    "getLeftovers",
    "getShoppingList",
]


PLANNING_SYSTEM_PROMPT = """You're a planning assistant that helps people organize their kitchen tasks efficiently. Your role is to understand what someone wants to do and create a clear, practical action plan.

Your plan should be returned as JSON with:
- "goal": What the person wants to accomplish
- "steps": The specific actions needed, each including:
  - "action": The function name to call
  - "parameters": What that function needs
  - "description": A natural, friendly explanation of what you're doing
  - "reason": Why this step makes sense for them
  - "estimated_cost": Any cost involved (0 if free)

Keep these principles in mind:
- Work with what they already have first (check their inventory, leftovers, etc.)
- Group similar tasks together to be more efficient
- Respect their preferences and dietary needs
- Sound like a helpful person, not a computer
- Focus on reducing waste and saving money

Example:
```json
{
  "goal": "Add missing ingredients for chicken stir-fry to shopping list",
  "steps": [
    {
      "action": "addToShoppingList",
      "parameters": {
        "items": [
          {"item": "soy sauce", "quantity": 1, "unit": "bottle"},
          {"item": "fresh ginger", "quantity": 1, "unit": "piece"}
        ]
      },
      "description": "Add soy sauce and fresh ginger to your shopping list",
      "reason": "You have chicken and vegetables, but need these for the stir-fry sauce",
      "estimated_cost": 0
    }
  ]
}
```

You'll get the person's current kitchen context next. Create a practical plan that works for their situation.
"""


class AgentPlanner:
    """
    Handles the PLANNING phase of the agentic workflow.
    
    Key responsibilities:
    - Gather all context in parallel (not sequentially!)
    - Generate structured action plans using the LLM
    - Ensure plans are complete before execution begins
    """
    
    def __init__(self, client: genai.Client):
        self.client = client
        self.model_name = settings.MODEL_NAME
    
    def gather_context(self, user_id: str) -> AgentContext:
        """
        Gather ALL context for a user in one go.
        This replaces the pattern of asking the LLM to call functions in parallel.
        
        We do this programmatically to GUARANTEE all context is gathered,
        rather than relying on the LLM to follow instructions.
        """
        logger.info(f"Gathering context for user {user_id}")
        
        context = AgentContext(user_id=user_id)
        
        # Gather all context - in Python we do this sequentially but it's fast
        # The key is that we gather EVERYTHING before proceeding
        try:
            context.preferences = get_user_preferences(user_id)
            logger.info(f"Got preferences: {context.preferences is not None}")
        except Exception as e:
            logger.warning(f"Failed to get preferences: {e}")
        
        try:
            context.inventory = get_user_inventory(user_id)
            logger.info(f"Got inventory: {len(context.inventory)} items")
        except Exception as e:
            logger.warning(f"Failed to get inventory: {e}")
        
        try:
            context.leftovers = get_user_leftovers(user_id)
            logger.info(f"Got leftovers: {len(context.leftovers)} items")
        except Exception as e:
            logger.warning(f"Failed to get leftovers: {e}")
        
        try:
            context.shopping_list = get_user_shopping_list(user_id)
            logger.info(f"Got shopping list: {len(context.shopping_list)} items")
        except Exception as e:
            logger.warning(f"Failed to get shopping list: {e}")
        
        # TODO: Add wallet balance gathering when x402 is implemented
        # try:
        #     context.wallet_balance = get_wallet_balance(user_id)
        #     context.spent_today = get_spent_today(user_id)
        # except Exception as e:
        #     logger.warning(f"Failed to get wallet info: {e}")
        
        context.gathered_at = datetime.now()
        logger.info(f"Context gathering complete for {user_id}")
        
        return context
    
    def create_plan(
        self, 
        user_message: str, 
        context: AgentContext,
        available_tools: list[dict]
    ) -> ActionPlan:
        """
        Use the LLM to create an action plan based on user request and context.
        
        This is where the AI does its "thinking" - analyzing what the user wants
        and creating a structured plan of actions to take.
        """
        logger.info(f"Creating plan for: {user_message[:100]}...")
        
        # Build the context message for the LLM
        context_message = self._build_context_message(context, available_tools)
        
        # Call the LLM to generate a plan
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=f"""
{context_message}

## USER REQUEST
{user_message}

## YOUR TASK
Create an action plan to fulfill this request. Remember:
- Use conversational, friendly language in descriptions
- Batch similar operations together
- Consider what the user already has before suggesting purchases
- Respond with a valid JSON object only, no markdown code blocks
""")]
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=PLANNING_SYSTEM_PROMPT,
                    temperature=0.3,  # Lower temp for more consistent planning
                )
            )
            
            # Extract the plan from the response
            response_text = ""
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if part.text:
                        response_text += part.text
            
            logger.info(f"LLM plan response: {response_text[:500]}...")
            
            # Parse the JSON response
            plan = self._parse_plan_response(response_text, user_message, context)
            return plan
            
        except Exception as e:
            logger.exception(f"Failed to create plan: {e}")
            # Return a minimal plan on error
            return ActionPlan(
                goal=user_message,
                context={"error": str(e)},
                steps=[],
                status=PlanStatus.FAILED
            )
    
    def _build_context_message(self, context: AgentContext, available_tools: list[dict]) -> str:
        """Build a context message for the LLM"""
        parts = ["## CURRENT CONTEXT\n"]
        
        # Preferences
        if context.preferences:
            parts.append("### User Preferences")
            prefs = context.preferences
            if prefs.get("dietary_restrictions"):
                parts.append(f"- Dietary restrictions: {', '.join(prefs['dietary_restrictions'])}")
            if prefs.get("health_goals"):
                parts.append(f"- Health goals: {', '.join(prefs['health_goals'])}")
            if prefs.get("family_size"):
                parts.append(f"- Family size: {prefs['family_size']}")
            if prefs.get("cuisine_preferences"):
                parts.append(f"- Favorite cuisines: {', '.join(prefs['cuisine_preferences'])}")
            parts.append("")
        
        # Inventory
        if context.inventory:
            parts.append("### Current Inventory")
            for item in context.inventory[:20]:  # Limit to avoid token overflow
                name = item.get("item_name", item.get("name", "?"))
                qty = item.get("quantity", "")
                unit = item.get("unit", "")
                parts.append(f"- {name}: {qty} {unit}".strip())
            if len(context.inventory) > 20:
                parts.append(f"... and {len(context.inventory) - 20} more items")
            parts.append("")
        else:
            parts.append("### Current Inventory\nNo items in inventory.\n")
        
        # Leftovers
        if context.leftovers:
            parts.append("### Leftovers (use these first!)")
            for item in context.leftovers[:10]:
                name = item.get("meal_name", "?")
                servings = item.get("servings", "?")
                parts.append(f"- {name}: {servings} servings")
            parts.append("")
        
        # Shopping list
        if context.shopping_list:
            parts.append("### Current Shopping List")
            for item in context.shopping_list[:20]:
                name = item.get("item", "?")
                qty = item.get("quantity", "")
                unit = item.get("unit", "")
                parts.append(f"- {name}: {qty} {unit}".strip())
            parts.append("")
        
        # Budget info
        if context.wallet_balance is not None:
            parts.append("### Budget")
            parts.append(f"- Wallet balance: ${context.wallet_balance:.2f}")
            parts.append(f"- Daily spending limit: ${context.spending_limit_daily:.2f}")
            parts.append(f"- Spent today: ${context.spent_today:.2f}")
            parts.append(f"- Remaining today: ${context.get_remaining_budget():.2f}")
            parts.append("")
        
        # Available tools
        parts.append("### Available Actions")
        for tool in available_tools:
            parts.append(f"- `{tool['name']}`: {tool['description'][:100]}")
        parts.append("")
        
        return "\n".join(parts)
    
    def _parse_plan_response(
        self, 
        response_text: str, 
        goal: str, 
        context: AgentContext
    ) -> ActionPlan:
        """Parse the LLM's JSON response into an ActionPlan"""
        try:
            # Try to extract JSON from the response
            # Handle cases where LLM wraps in markdown code blocks
            json_text = response_text.strip()
            if json_text.startswith("```"):
                # Remove markdown code blocks
                lines = json_text.split("\n")
                json_lines = []
                in_block = False
                for line in lines:
                    if line.startswith("```"):
                        in_block = not in_block
                        continue
                    if in_block or (not line.startswith("```")):
                        json_lines.append(line)
                json_text = "\n".join(json_lines)
            
            plan_data = json.loads(json_text)
            
            # Build the ActionPlan
            plan = ActionPlan(
                goal=plan_data.get("goal", goal),
                context={"summary": context.to_summary()},
                steps=[]
            )
            
            # Add steps
            for step_data in plan_data.get("steps", []):
                step = PlanStep(
                    action=step_data.get("action", "unknown"),
                    parameters=step_data.get("parameters", {}),
                    description=step_data.get("description", "Perform action"),
                    reason=step_data.get("reason", ""),
                    estimated_cost=float(step_data.get("estimated_cost", 0))
                )
                plan.add_step(step)
            
            logger.info(f"Created plan with {len(plan.steps)} steps")
            return plan
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse plan JSON: {e}")
            logger.error(f"Response was: {response_text[:500]}")
            
            # Return a fallback plan
            return ActionPlan(
                goal=goal,
                context={"error": "Failed to parse plan", "raw_response": response_text[:500]},
                steps=[],
                status=PlanStatus.FAILED
            )
    
    def requires_planning(self, message: str) -> bool:
        """
        Determine if a message requires full planning or is a simple query.
        
        Simple queries (don't need planning):
        - "What time is it?"
        - "Hi"
        - "Thanks"
        
        Complex requests (need planning):
        - "What should I make for dinner?"
        - "Add milk to my shopping list"
        - "Buy groceries for the week"
        """
        message_lower = message.lower().strip()
        
        # Simple greetings/thanks don't need planning
        simple_patterns = [
            "hi", "hello", "hey", "thanks", "thank you", "bye", "goodbye",
            "ok", "okay", "sure", "yes", "no", "maybe"
        ]
        if message_lower in simple_patterns:
            return False
        
        # Questions about capabilities don't need planning
        if message_lower.startswith("what can you") or message_lower.startswith("how do"):
            return False
        
        # Everything else probably needs planning
        # This could be made smarter with LLM classification
        return True
