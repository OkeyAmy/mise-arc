"""
ASI Orchestrator - Agentic Workflow (v2)
Main orchestration logic with proper request classification:

- GREETINGS: Direct response, no context needed
- QUERIES: Fetch data directly, format nicely (no LLM)
- ACTIONS: Full PLAN → VALIDATE → EXECUTE workflow
- QUESTIONS: Context + LLM for recommendations

This version properly separates reading data (queries) from performing actions.
"""
import json
import copy
from typing import Any
from google import genai
from google.genai import types

from config import settings
from registry import TOOLS
from handlers import handle_function_call, FunctionCall, HandlerContext
from utils import get_logger

# Import agentic components
from .action_plan import ActionPlan, PlanStep, AgentContext, PlanStatus
from .planner import AgentPlanner
from .validator import AgentValidator
from .executor import AgentExecutor
from .classifier import RequestClassifier, RequestType, ClassifiedRequest, get_classifier
from .rate_limiter import RateLimiter, RateLimitExceededError, get_rate_limiter

logger = get_logger(__name__)


def _sanitize_schema_for_gemini(schema: dict) -> dict:
    """
    Remove unsupported fields from JSON schema for Gemini compatibility.
    Gemini doesn't support: default, examples, $ref, additionalProperties, etc.
    """
    if not isinstance(schema, dict):
        return schema
    
    UNSUPPORTED_FIELDS = {"default", "examples", "$ref", "additionalProperties", "$schema", "definitions"}
    
    cleaned = {}
    for key, value in schema.items():
        if key in UNSUPPORTED_FIELDS:
            continue
        
        if key == "properties" and isinstance(value, dict):
            cleaned[key] = {
                prop_name: _sanitize_schema_for_gemini(prop_schema)
                for prop_name, prop_schema in value.items()
            }
        elif key == "items" and isinstance(value, dict):
            cleaned[key] = _sanitize_schema_for_gemini(value)
        elif isinstance(value, dict):
            cleaned[key] = _sanitize_schema_for_gemini(value)
        elif isinstance(value, list):
            cleaned[key] = [
                _sanitize_schema_for_gemini(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            cleaned[key] = value
    
    return cleaned


# System prompt for LLM responses (only used for questions/recommendations)
RESPONSE_SYSTEM_PROMPT = """You're Mise, a helpful kitchen assistant who loves making cooking easier and more enjoyable.

Think of yourself as a friendly cooking partner who's here to help with meal planning, kitchen organization, and making the most of what people have on hand. You're warm, natural, and encouraging - never robotic or overly formal.

When helping someone:
- Sound like you're chatting with a friend about food and cooking
- Keep it conversational and brief (2-3 paragraphs max)
- Focus on practical suggestions they can actually use
- Work with what they already have in their kitchen first
- Help them reduce waste and save money when possible
- Speak naturally, like a real person would

If they mention wanting to find or buy something from Amazon or their shopping list, **DO NOT** use any search tools. Instead, simply say you've opened their shopping list panel for them to review. The app will handle the search automatically.

Example of how you might respond:
"Looking at what you've got, a stir-fry would be perfect tonight! You have chicken, bell peppers, and that leftover rice from yesterday - it all comes together in about 15 minutes. Plus you'll use up that rice before it goes bad. Want me to add anything else you might need to your shopping list?"
"""


class Orchestrator:
    """
    ASI Orchestrator - Handles user requests with proper classification.
    
    Request types:
    - GREETING: "Hi", "Thanks" → Direct response
    - QUERY: "What's in my shopping list?" → Fetch and display data
    - ACTION: "Add milk to my list" → Plan, validate, execute
    - QUESTION: "What should I cook?" → Context + LLM recommendation
    """
    
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        
        # Initialize Gemini client
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.MODEL_NAME
        
        # Pre-build tool declarations
        self.tools = self._convert_tools_to_gemini_format()
        
        # Initialize components
        self.classifier = get_classifier()
        self.rate_limiter = get_rate_limiter()
        self.planner = AgentPlanner(self.client)
        self.validator = AgentValidator()
        self.executor = AgentExecutor()
        
        # Store pending plans awaiting user approval
        self.pending_plans: dict[str, ActionPlan] = {}
    
    def process_message(
        self, 
        message: str, 
        user_id: str,
        history: list[dict] | None = None
    ) -> dict:
        """
        Process a user message with proper request classification.
        
        Returns: {"text": str, "function_calls": list, "thought_steps": list, "plan": dict | None}
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
        
        try:
            # Step 0: Check if user is responding to a pending plan
            pending_plan = self.pending_plans.get(user_id)
            if pending_plan:
                return self._handle_plan_response(message, pending_plan, ctx, thought_steps, function_calls_made)
            
            # Step 1: Classify the request
            classification = self.classifier.classify(message)
            logger.info(f"Classified request as: {classification.request_type.value} ({classification.intent})")
            add_thought_step(f"Understanding: {classification.intent}")
            
            # Step 2: Route based on classification
            if classification.request_type == RequestType.GREETING:
                return self._handle_greeting(message, thought_steps, function_calls_made)
            
            elif classification.request_type == RequestType.QUERY:
                return self._handle_query(classification, ctx, thought_steps, function_calls_made)
            
            elif classification.request_type == RequestType.ACTION:
                return self._handle_action(message, ctx, thought_steps, function_calls_made)
            
            elif classification.request_type == RequestType.QUESTION:
                return self._handle_question(message, ctx, thought_steps, function_calls_made)
            
            else:
                # Unknown - try to help with context
                return self._handle_question(message, ctx, thought_steps, function_calls_made)
                
        except RateLimitExceededError as e:
            logger.warning(f"Rate limit exceeded: {e}")
            return {
                "text": "I'm taking a short break to avoid overwhelming the system. Please try again in a minute! ⏳",
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": None
            }
        except Exception as e:
            logger.exception("Orchestrator error")
            return {
                "text": f"I'm sorry, something went wrong: {str(e)}\n\nPlease try again or rephrase your request.",
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": None
            }
    
    def _handle_greeting(
        self, 
        message: str, 
        thought_steps: list[str], 
        function_calls_made: list[dict]
    ) -> dict:
        """Handle simple greetings without any API calls."""
        greetings = {
            "hi": "Hi there! 👋 I'm Mise, your kitchen assistant. How can I help you today?",
            "hello": "Hello! 🍳 Ready to help with meal planning, shopping lists, or recipe ideas. What would you like to do?",
            "hey": "Hey! What's cooking? 😊",
            "thanks": "You're welcome! Let me know if you need anything else.",
            "thank you": "Happy to help! Is there anything else I can do for you?",
            "bye": "Goodbye! Happy cooking! 🍽️",
            "goodbye": "See you next time! Enjoy your meals!",
        }
        
        message_lower = message.lower().strip()
        response = greetings.get(message_lower, "Hello! How can I help you with your kitchen today?")
        
        return {
            "text": response,
            "function_calls": function_calls_made,
            "thought_steps": thought_steps,
            "plan": None
        }
    
    def _handle_query(
        self, 
        classification: ClassifiedRequest, 
        ctx: HandlerContext,
        thought_steps: list[str], 
        function_calls_made: list[dict]
    ) -> dict:
        """
        Handle query requests by directly fetching and displaying data.
        NO LLM call needed - just format the data nicely.
        """
        ctx.log_step(f"📋 Fetching your {classification.target_entity}...")
        
        # Get the context (this fetches from database)
        context = self.planner.gather_context(ctx.user_id)
        
        # Format response based on what was requested
        if classification.target_entity == "shopping_list":
            response = self._format_shopping_list(context.shopping_list)
        elif classification.target_entity == "inventory":
            response = self._format_inventory(context.inventory)
        elif classification.target_entity == "leftovers":
            response = self._format_leftovers(context.leftovers)
        elif classification.target_entity == "preferences":
            response = self._format_preferences(context.preferences)
        else:
            response = "I'm not sure what you're asking about. Try asking about your shopping list, pantry, leftovers, or preferences."
        
        return {
            "text": response,
            "function_calls": function_calls_made,
            "thought_steps": thought_steps,
            "plan": None
        }
    
    def _handle_action(
        self, 
        message: str, 
        ctx: HandlerContext,
        thought_steps: list[str], 
        function_calls_made: list[dict]
    ) -> dict:
        """
        Handle action requests through PLAN → VALIDATE → EXECUTE workflow.
        """
        ctx.log_step("Understanding your request...")
        
        # PLANNING: Gather context and create plan
        ctx.log_step("Gathering your information...")
        context = self.planner.gather_context(ctx.user_id)
        
        # Call LLM to create plan (rate limited)
        self.rate_limiter.wait_if_needed()
        ctx.log_step("Creating a plan...")
        plan = self.planner.create_plan(message, context, TOOLS)
        
        if plan.status == PlanStatus.FAILED or not plan.steps:
            # Planning failed - explain what happened
            return {
                "text": "I understood you want to make some changes, but I'm not quite sure what. Could you be more specific?\n\nFor example:\n- \"Add milk and eggs to my shopping list\"\n- \"Remove bread from my inventory\"\n- \"Add leftover pasta, 2 servings\"",
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": None
            }
        
        # VALIDATION: Check constraints
        ctx.log_step("✅ Checking the plan...")
        validation = self.validator.validate_plan(plan, context)
        
        if validation.errors:
            error_msg = validation.to_message()
            return {
                "text": f"I can't do that right now:\n\n{error_msg}",
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": plan.to_dict()
            }
        
        if validation.requires_approval:
            # Store plan and ask for approval
            self.pending_plans[ctx.user_id] = plan
            
            # Show plan in conversational format
            plan_display = plan.to_conversational()
            
            return {
                "text": plan_display,
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": plan.to_dict(),
                "awaiting_approval": True
            }
        
        # EXECUTION: Execute the approved plan
        ctx.log_step("Making the changes...")
        plan.status = PlanStatus.APPROVED  # Mark as approved before execution
        plan = self.executor.execute_plan(plan, ctx)
        
        # Generate natural confirmation
        response = self._generate_completion_response(plan)
        
        return {
            "text": response,
            "function_calls": function_calls_made,
            "thought_steps": thought_steps,
            "plan": plan.to_dict()
        }
    
    def _handle_question(
        self, 
        message: str, 
        ctx: HandlerContext,
        thought_steps: list[str], 
        function_calls_made: list[dict]
    ) -> dict:
        """
        Handle question requests that need LLM + context for recommendations.
        """
        ctx.log_step("🔍 Looking at your kitchen...")
        
        # Gather context
        context = self.planner.gather_context(ctx.user_id)
        
        # Build context summary for LLM
        context_text = self._build_context_summary(context)
        
        # Rate limit check before LLM call
        self.rate_limiter.wait_if_needed()
        
        ctx.log_step("🤔 Thinking...")
        
        # Call LLM with context
        try:
            prompt = f"""## User's Kitchen Data
{context_text}

## User's Question
{message}

Provide a helpful, personalized response based on what the user has available."""

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
                config=types.GenerateContentConfig(
                    system_instruction=RESPONSE_SYSTEM_PROMPT,
                    temperature=0.7
                )
            )
            
            # Extract response text
            text_parts = []
            for candidate in response.candidates:
                # Check if content exists before iterating
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if part.text:
                            text_parts.append(part.text)
            
            final_response = "".join(text_parts) if text_parts else "I'm not sure how to answer that. Could you try asking differently?"
            
        except Exception as e:
            logger.exception("LLM response error")
            final_response = "I had trouble thinking about that. Could you try asking again?"

        
        return {
            "text": final_response,
            "function_calls": function_calls_made,
            "thought_steps": thought_steps,
            "plan": None
        }
    
    def _handle_plan_response(
        self, 
        message: str, 
        plan: ActionPlan, 
        ctx: HandlerContext,
        thought_steps: list[str],
        function_calls_made: list[dict]
    ) -> dict:
        """Handle user's response to a pending plan approval request."""
        message_lower = message.lower().strip()
        
        approval_words = ["yes", "y", "ok", "okay", "sure", "go", "do it", "approve", "proceed", "yep", "yup"]
        rejection_words = ["no", "n", "cancel", "stop", "nevermind", "never mind", "nope", "nah"]
        
        if any(word in message_lower for word in approval_words):
            # User approved
            del self.pending_plans[ctx.user_id]
            
            ctx.log_step("Approved! Making changes...")
            plan.status = PlanStatus.APPROVED  # Mark as approved before execution
            plan = self.executor.execute_plan(plan, ctx)
            
            response = self._generate_completion_response(plan)
            
            return {
                "text": response,
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": plan.to_dict()
            }
        
        elif any(word in message_lower for word in rejection_words):
            # User rejected
            del self.pending_plans[ctx.user_id]
            
            return {
                "text": "No problem, cancelled! What would you like to do instead?",
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": None
            }
        
        else:
            # Not a clear yes/no
            return {
                "text": f"I'm waiting for your approval. Say **yes** to proceed or **no** to cancel.\n\n{plan.to_conversational()}",
                "function_calls": function_calls_made,
                "thought_steps": thought_steps,
                "plan": plan.to_dict(),
                "awaiting_approval": True
            }
    
    # ========================
    # Response Generation
    # ========================
    
    def _generate_completion_response(self, plan: ActionPlan) -> str:
        """
        Generate a natural, conversational confirmation after a plan completes.
        Converts step descriptions into past-tense confirmations instead of
        repeating them verbatim as bullet points.
        """
        completed = plan.get_completed_steps()
        failed = plan.get_failed_steps()
        
        if not completed and not failed:
            return "All done!"
        
        # Handle failures
        if failed and not completed:
            fail_descriptions = [s.description for s in failed]
            return (
                "I ran into some issues:\n\n"
                + "\n".join(f"- {d}" for d in fail_descriptions)
                + "\n\nPlease try again or rephrase your request."
            )
        
        descriptions = [step.description for step in completed]
        
        # Single step: convert to a clean past-tense confirmation
        if len(descriptions) == 1:
            confirmation = self._to_past_tense(descriptions[0])
            # Add failure note if partial
            if failed:
                fail_note = f"\n\nHowever, I couldn't: {failed[0].description.lower()}"
                return f"{confirmation}{fail_note}"
            return confirmation
        
        # Multiple steps: use LLM for a brief, natural summary
        try:
            self.rate_limiter.wait_if_needed()
            
            steps_text = "\n".join(f"- {d}" for d in descriptions)
            fail_text = ""
            if failed:
                fail_text = "\n\nFailed steps:\n" + "\n".join(f"- {s.description}" for s in failed)
            
            prompt = f"""Summarize what was done in 1-2 short sentences. 
Be conversational and natural. Do not use bullet points or emojis.
Speak in first person past tense (e.g. "I've added...", "I updated...").
Do not ask follow-up questions.

Completed actions:
{steps_text}{fail_text}"""
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
                config=types.GenerateContentConfig(
                    system_instruction="You're Mise, a friendly kitchen assistant. Create a quick, natural confirmation of what was completed. Keep it to 1-2 short sentences, sound like a real person, and skip the emojis and bullet points.",
                    temperature=0.3
                )
            )
            
            text_parts = []
            for candidate in response.candidates:
                # Check if content exists before iterating
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if part.text:
                            text_parts.append(part.text)
            
            summary = "".join(text_parts).strip()
            if summary:
                return summary
        except Exception as e:
            logger.warning(f"LLM summary generation failed, using fallback: {e}")
        
        # Fallback: simple past-tense list
        confirmations = [self._to_past_tense(d) for d in descriptions]
        result = " ".join(confirmations)
        if failed:
            result += f"\n\nI couldn't complete: {', '.join(s.description.lower() for s in failed)}."
        return result
    
    @staticmethod
    def _to_past_tense(description: str) -> str:
        """
        Convert an imperative step description to a past-tense confirmation.
        e.g. "Add an orange to your shopping list" -> "I've added an orange to your shopping list."
        """
        desc = description.strip()
        if not desc:
            return "Done."
        
        # Common action verb mappings (imperative -> past participle)
        verb_map = {
            "add": "added",
            "remove": "removed",
            "delete": "deleted",
            "update": "updated",
            "set": "set",
            "change": "changed",
            "create": "created",
            "clear": "cleared",
            "replace": "replaced",
            "adjust": "adjusted",
            "search": "searched",
            "find": "found",
        }
        
        # Try to match the first word as a verb
        words = desc.split(maxsplit=1)
        first_word = words[0].lower()
        
        if first_word in verb_map:
            past = verb_map[first_word]
            rest = words[1] if len(words) > 1 else ""
            # Don't end with period if rest already has one
            sentence = f"I've {past} {rest}".rstrip(".")
            return f"{sentence}."
        
        # If it already sounds like a confirmation, return as-is
        if desc.lower().startswith(("i've ", "i have ", "done", "updated", "added", "removed")):
            return desc if desc.endswith(".") else f"{desc}."
        
        # Fallback: prefix with "Done:"
        return f"Done: {desc}." if not desc.endswith(".") else f"Done: {desc}"
    
    # ========================
    # Formatting Helpers
    # ========================
    
    def _format_shopping_list(self, items: list[dict]) -> str:
        """Format shopping list for display."""
        if not items:
            return "📝 Your shopping list is empty!\n\nSay something like \"add milk to my shopping list\" to get started."
        
        lines = ["📝 **Your Shopping List:**\n"]
        for item in items:
            name = item.get("item", "Unknown")
            qty = item.get("quantity", "")
            unit = item.get("unit", "")
            
            if qty and unit:
                lines.append(f"• {name} - {qty} {unit}")
            elif qty:
                lines.append(f"• {name} ({qty})")
            else:
                lines.append(f"• {name}")
        
        lines.append(f"\n**Total: {len(items)} items**")
        return "\n".join(lines)
    
    def _format_inventory(self, items: list[dict]) -> str:
        """Format inventory for display."""
        if not items:
            return "🍳 Your pantry is empty!\n\nAdd ingredients by saying \"add chicken to my inventory\"."
        
        lines = ["🍳 **Your Pantry:**\n"]
        for item in items[:20]:  # Limit to 20 items
            name = item.get("item_name", item.get("name", "Unknown"))
            qty = item.get("quantity", "")
            unit = item.get("unit", "")
            
            if qty and unit:
                lines.append(f"• {name} - {qty} {unit}")
            elif qty:
                lines.append(f"• {name} ({qty})")
            else:
                lines.append(f"• {name}")
        
        if len(items) > 20:
            lines.append(f"\n...and {len(items) - 20} more items")
        
        lines.append(f"\n**Total: {len(items)} ingredients**")
        return "\n".join(lines)
    
    def _format_leftovers(self, items: list[dict]) -> str:
        """Format leftovers for display."""
        if not items:
            return "🥡 No leftovers right now!\n\nWhen you have leftover food, tell me and I'll help you use it before it goes bad."
        
        lines = ["🥡 **Your Leftovers:**\n"]
        for item in items:
            name = item.get("meal_name", "Unknown")
            servings = item.get("servings", "?")
            lines.append(f"• {name} - {servings} servings")
        
        lines.append("\n💡 *Tip: Try to use these first to reduce food waste!*")
        return "\n".join(lines)
    
    def _format_preferences(self, prefs: dict | None) -> str:
        """Format preferences for display."""
        if not prefs:
            return "⚙️ You haven't set up your preferences yet.\n\nI can help you with dietary restrictions, health goals, and family size to give better meal suggestions."
        
        lines = ["⚙️ **Your Preferences:**\n"]
        
        if prefs.get("dietary_restrictions"):
            lines.append(f"🥗 Dietary: {', '.join(prefs['dietary_restrictions'])}")
        if prefs.get("health_goals"):
            lines.append(f"🎯 Goals: {', '.join(prefs['health_goals'])}")
        if prefs.get("family_size"):
            lines.append(f"👨‍👩‍👧 Family size: {prefs['family_size']}")
        if prefs.get("cuisine_preferences"):
            lines.append(f"🌍 Favorite cuisines: {', '.join(prefs['cuisine_preferences'])}")
        
        return "\n".join(lines) if len(lines) > 1 else "⚙️ Your preferences are set but empty. Tell me about your dietary needs!"
    
    def _build_context_summary(self, context: AgentContext) -> str:
        """Build a summary of context for LLM."""
        parts = []
        
        if context.preferences:
            p = context.preferences
            parts.append(f"**Preferences:** Family of {p.get('family_size', '?')}")
            if p.get('dietary_restrictions'):
                parts.append(f"Dietary restrictions: {', '.join(p['dietary_restrictions'])}")
        
        if context.inventory:
            names = [i.get("item_name", i.get("name", "?")) for i in context.inventory[:15]]
            parts.append(f"**In pantry ({len(context.inventory)} items):** {', '.join(names)}")
        else:
            parts.append("**Pantry:** Empty")
        
        if context.leftovers:
            names = [l.get("meal_name", "?") for l in context.leftovers]
            parts.append(f"**Leftovers:** {', '.join(names)}")
        
        if context.shopping_list:
            names = [s.get("item", "?") for s in context.shopping_list[:10]]
            parts.append(f"**Shopping list ({len(context.shopping_list)} items):** {', '.join(names)}")
        
        return "\n".join(parts) if parts else "No data available"
    
    def _convert_tools_to_gemini_format(self) -> list[types.Tool]:
        """Convert tool definitions to Gemini's format."""
        function_declarations = []
        
        for tool in TOOLS:
            clean_schema = _sanitize_schema_for_gemini(copy.deepcopy(tool["input_schema"]))
            function_declarations.append(types.FunctionDeclaration(
                name=tool["name"],
                description=tool["description"],
                parameters=clean_schema
            ))
        
        return [types.Tool(function_declarations=function_declarations)]


# Singleton instance
_orchestrator: Orchestrator | None = None


def get_orchestrator() -> Orchestrator:
    """Get or create orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator
