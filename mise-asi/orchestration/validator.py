"""
Agent Validator
Responsible for the VALIDATION phase of the agentic workflow.

The validator:
1. Checks if the plan is within budget constraints
2. Determines if user approval is needed
3. Validates plan steps against safety guardrails
4. Can modify plans to fit constraints
"""
from typing import Tuple
from dataclasses import dataclass

from utils import get_logger
from .action_plan import ActionPlan, PlanStep, AgentContext, PlanStatus

logger = get_logger(__name__)


@dataclass
class ValidationResult:
    """Result of validating a plan"""
    is_valid: bool
    requires_approval: bool
    approval_reason: str | None
    warnings: list[str]
    errors: list[str]
    modified_plan: ActionPlan | None  # If we modified the plan to fit constraints
    
    def to_message(self) -> str:
        """Convert validation result to user-friendly message"""
        parts = []
        
        if self.errors:
            parts.append("❌ **I found some issues with this plan:**")
            for error in self.errors:
                parts.append(f"   • {error}")
        
        if self.warnings:
            parts.append("⚠️ **A few things to note:**")
            for warning in self.warnings:
                parts.append(f"   • {warning}")
        
        if self.requires_approval and self.approval_reason:
            parts.append(f"\n🔐 **I need your approval:** {self.approval_reason}")
        
        return "\n".join(parts) if parts else "✅ Plan looks good!"


class AgentValidator:
    """
    Handles the VALIDATION phase of the agentic workflow.
    
    Key responsibilities:
    - Budget validation (daily/weekly limits)
    - Safety guardrails (prevent dangerous operations)
    - Approval threshold checking
    - Plan modification when needed
    """
    
    def __init__(self):
        # Default approval thresholds
        self.auto_approve_limit = 5.0  # Auto-approve purchases under $5
        self.require_approval_keywords = [
            "delete all", "remove all", "clear", "reset"
        ]
    
    def validate_plan(
        self, 
        plan: ActionPlan, 
        context: AgentContext
    ) -> ValidationResult:
        """
        Validate a plan against all constraints.
        Returns a ValidationResult with approval requirements.
        """
        logger.info(f"Validating plan: {plan.goal}")
        
        warnings = []
        errors = []
        requires_approval = False
        approval_reason = None
        
        # 1. Check budget constraints
        budget_result = self._check_budget(plan, context)
        if budget_result.requires_approval:
            requires_approval = True
            approval_reason = budget_result.reason
        warnings.extend(budget_result.warnings)
        errors.extend(budget_result.errors)
        
        # 2. Check safety guardrails
        safety_result = self._check_safety(plan)
        if safety_result.requires_approval:
            requires_approval = True
            if approval_reason:
                approval_reason += f" Also, {safety_result.reason}"
            else:
                approval_reason = safety_result.reason
        warnings.extend(safety_result.warnings)
        errors.extend(safety_result.errors)
        
        # 3. Check if items are already in shopping list (avoid duplicates)
        duplicate_result = self._check_duplicates(plan, context)
        warnings.extend(duplicate_result.warnings)
        
        # 4. Validate against user preferences
        preference_result = self._check_preferences(plan, context)
        warnings.extend(preference_result.warnings)
        
        # Update plan status
        if errors:
            plan.status = PlanStatus.FAILED
            is_valid = False
        elif requires_approval:
            plan.status = PlanStatus.AWAITING_APPROVAL
            plan.requires_approval = True
            plan.approval_reason = approval_reason
            is_valid = True
        else:
            plan.status = PlanStatus.APPROVED
            is_valid = True
        
        logger.info(f"Validation complete: valid={is_valid}, requires_approval={requires_approval}")
        
        return ValidationResult(
            is_valid=is_valid,
            requires_approval=requires_approval,
            approval_reason=approval_reason,
            warnings=warnings,
            errors=errors,
            modified_plan=None
        )
    
    def _check_budget(
        self, 
        plan: ActionPlan, 
        context: AgentContext
    ) -> "BudgetCheckResult":
        """Check if plan is within budget"""
        warnings = []
        errors = []
        requires_approval = False
        reason = None
        
        total_cost = plan.total_estimated_cost
        
        if total_cost > 0:
            remaining_budget = context.get_remaining_budget()
            
            if total_cost > remaining_budget:
                if total_cost > context.spending_limit_daily:
                    # Over daily limit - needs approval
                    requires_approval = True
                    reason = (
                        f"This will cost ${total_cost:.2f}, which is over your "
                        f"${context.spending_limit_daily:.2f} daily limit"
                    )
                else:
                    # Under daily limit but over remaining budget for today
                    warnings.append(
                        f"This purchase (${total_cost:.2f}) will use most of your "
                        f"remaining budget for today (${remaining_budget:.2f})"
                    )
            
            if context.wallet_balance is not None and total_cost > context.wallet_balance:
                errors.append(
                    f"Insufficient funds: need ${total_cost:.2f} but only have "
                    f"${context.wallet_balance:.2f}"
                )
        
        return BudgetCheckResult(
            requires_approval=requires_approval,
            reason=reason,
            warnings=warnings,
            errors=errors
        )
    
    def _check_safety(self, plan: ActionPlan) -> "SafetyCheckResult":
        """Check for potentially dangerous operations"""
        warnings = []
        errors = []
        requires_approval = False
        reason = None
        
        for step in plan.steps:
            action = step.action.lower()
            description = step.description.lower()
            
            # Check for bulk delete operations
            if "delete" in action or "remove" in action:
                params = step.parameters
                
                # Check if it's a bulk operation
                items = params.get("items", params.get("item_names", []))
                if isinstance(items, list) and len(items) > 5:
                    requires_approval = True
                    reason = f"This will remove {len(items)} items at once"
                    warnings.append(f"Bulk removal: {len(items)} items will be deleted")
            
            # Check for dangerous keywords
            for keyword in self.require_approval_keywords:
                if keyword in description:
                    requires_approval = True
                    reason = f"This action involves '{keyword}' which requires confirmation"
                    break
        
        return SafetyCheckResult(
            requires_approval=requires_approval,
            reason=reason,
            warnings=warnings,
            errors=errors
        )
    
    def _check_duplicates(
        self, 
        plan: ActionPlan, 
        context: AgentContext
    ) -> "DuplicateCheckResult":
        """Check for duplicate items being added"""
        warnings = []
        
        # Get current shopping list item names (normalized)
        existing_items = {
            item.get("item", "").lower().strip() 
            for item in context.shopping_list
        }
        
        for step in plan.steps:
            if step.action in ["addToShoppingList", "createShoppingListItems"]:
                items = step.parameters.get("items", [])
                for item in items:
                    item_name = ""
                    if isinstance(item, dict):
                        item_name = item.get("item", item.get("name", "")).lower().strip()
                    elif isinstance(item, str):
                        item_name = item.lower().strip()
                    
                    if item_name and item_name in existing_items:
                        warnings.append(f"'{item_name}' is already on your shopping list")
        
        return DuplicateCheckResult(warnings=warnings)
    
    def _check_preferences(
        self, 
        plan: ActionPlan, 
        context: AgentContext
    ) -> "PreferenceCheckResult":
        """Check if plan aligns with user preferences"""
        warnings = []
        
        if not context.preferences:
            return PreferenceCheckResult(warnings=warnings)
        
        dietary_restrictions = context.preferences.get("dietary_restrictions", [])
        if not dietary_restrictions:
            return PreferenceCheckResult(warnings=warnings)
        
        # Normalize restrictions
        restrictions_lower = [r.lower() for r in dietary_restrictions]
        
        # Check for items that might violate restrictions
        # This is a simple check - could be made smarter with ingredient databases
        restriction_conflicts = {
            "vegetarian": ["meat", "chicken", "beef", "pork", "fish", "bacon"],
            "vegan": ["meat", "chicken", "beef", "pork", "fish", "dairy", "milk", "cheese", "eggs", "butter"],
            "gluten-free": ["bread", "pasta", "flour", "wheat"],
            "lactose-free": ["milk", "cheese", "butter", "cream", "yogurt"],
            "nut-free": ["peanut", "almond", "walnut", "cashew", "pistachio"],
        }
        
        for step in plan.steps:
            if step.action in ["addToShoppingList", "createShoppingListItems", "suggestMeal"]:
                # Get items from the step
                items = step.parameters.get("items", [])
                if not items:
                    # Check for meal suggestions
                    ingredients = step.parameters.get("ingredients", [])
                    items = [{"item": i} for i in ingredients] if isinstance(ingredients, list) else []
                
                for item in items:
                    item_name = ""
                    if isinstance(item, dict):
                        item_name = item.get("item", item.get("name", "")).lower()
                    elif isinstance(item, str):
                        item_name = item.lower()
                    
                    # Check against each restriction
                    for restriction in restrictions_lower:
                        if restriction in restriction_conflicts:
                            for conflict in restriction_conflicts[restriction]:
                                if conflict in item_name:
                                    warnings.append(
                                        f"'{item_name}' might not be {restriction} "
                                        f"(you listed '{restriction}' as a dietary restriction)"
                                    )
                                    break
        
        return PreferenceCheckResult(warnings=warnings)
    
    def approve_plan(self, plan: ActionPlan) -> None:
        """Mark a plan as approved by the user"""
        plan.status = PlanStatus.APPROVED
        plan.requires_approval = False
        logger.info(f"Plan {plan.id} approved")
    
    def reject_plan(self, plan: ActionPlan, reason: str = "") -> None:
        """Mark a plan as rejected/cancelled"""
        plan.status = PlanStatus.CANCELLED
        logger.info(f"Plan {plan.id} rejected: {reason}")


# Helper dataclasses for internal results
@dataclass
class BudgetCheckResult:
    requires_approval: bool
    reason: str | None
    warnings: list[str]
    errors: list[str]


@dataclass
class SafetyCheckResult:
    requires_approval: bool
    reason: str | None
    warnings: list[str]
    errors: list[str]


@dataclass
class DuplicateCheckResult:
    warnings: list[str]


@dataclass
class PreferenceCheckResult:
    warnings: list[str]
