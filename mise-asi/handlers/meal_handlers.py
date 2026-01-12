"""
Meal Handlers
Maps to: src/hooks/chat/handlers/mealHandlers.ts
"""
from handlers.types import FunctionCall, HandlerContext


def handle_meal_functions(function_call: FunctionCall, ctx: HandlerContext) -> str:
    """
    Handle meal-related function calls
    Maps to: handleMealFunctions in mealHandlers.ts
    """
    name = function_call["name"]
    args = function_call.get("args", {})
    
    if name == "suggestMeal":
        return handle_suggest_meal(args, ctx)
    elif name == "updateMealPlan":
        return handle_update_meal_plan(args, ctx)
    
    return f"Unknown meal function: {name}"


def handle_suggest_meal(args: dict, ctx: HandlerContext) -> str:
    """
    Handle meal suggestion - formats meal data for display
    Note: The LLM generates the meal suggestion, this handler formats it
    """
    try:
        meal = args.get("meal", {})
        justification = args.get("justification", "")
        missing_ingredients = args.get("missing_ingredients", [])
        
        if not meal:
            return "No meal suggestion provided."
        
        # Format meal output
        result = f"**{meal.get('name', 'Meal')}**\n\n"
        result += f"🔥 Calories: {meal.get('calories', 'N/A')}\n"
        
        macros = meal.get("macros", {})
        result += f"💪 Protein: {macros.get('protein', 0)}g | "
        result += f"🍞 Carbs: {macros.get('carbs', 0)}g | "
        result += f"🥑 Fat: {macros.get('fat', 0)}g\n\n"
        
        if meal.get("ingredients"):
            result += "**Ingredients:**\n"
            for ing in meal["ingredients"]:
                result += f"- {ing.get('quantity', '')} {ing.get('unit', '')} {ing.get('item', '')}\n"
            result += "\n"
        
        if justification:
            result += f"💡 *{justification}*\n\n"
        
        if missing_ingredients:
            result += "**Missing ingredients (need to buy):**\n"
            for ing in missing_ingredients:
                result += f"- {ing.get('quantity', '')} {ing.get('unit', '')} {ing.get('item', '')}\n"
        
        ctx.log_step("✅ Executed: suggestMeal")
        return result
        
    except Exception as e:
        ctx.log_step("❌ suggestMeal failed")
        return f"Failed to format meal suggestion: {str(e)}"


def handle_update_meal_plan(args: dict, ctx: HandlerContext) -> str:
    """Update the user's meal plan"""
    try:
        day = args.get("day")
        meal_type = args.get("meal_type")
        meal = args.get("meal", {})
        
        if not day or not meal_type or not meal:
            return "Day, meal type, and meal data are required."
        
        # In frontend, this updates UI state via setPlan
        # Here we just return confirmation
        meal_name = meal.get("name", "meal")
        
        ctx.log_step("✅ Executed: updateMealPlan")
        return f"Updated {day}'s {meal_type} to: {meal_name}"
        
    except Exception as e:
        ctx.log_step("❌ updateMealPlan failed")
        return f"Failed to update meal plan: {str(e)}"
