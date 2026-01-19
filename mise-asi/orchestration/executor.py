"""
Agent Executor
Responsible for the EXECUTION phase of the agentic workflow.

The executor:
1. Executes plan steps sequentially with progress tracking
2. Handles batch operations (e.g., adding multiple items at once)
3. Provides rollback capability if something fails
4. Logs all actions for audit trail
"""
from typing import Callable, Any
from datetime import datetime

from utils import get_logger
from handlers import handle_function_call, FunctionCall, HandlerContext
from .action_plan import ActionPlan, PlanStep, PlanStatus, PlanStepStatus

logger = get_logger(__name__)


class AgentExecutor:
    """
    Handles the EXECUTION phase of the agentic workflow.
    
    Key responsibilities:
    - Step-by-step execution with progress callbacks
    - Error handling and recovery
    - Rollback for failed operations
    - Execution logging and audit trail
    """
    
    def __init__(self):
        self.execution_log: list[dict] = []
    
    def execute_plan(
        self, 
        plan: ActionPlan, 
        ctx: HandlerContext,
        progress_callback: Callable[[PlanStep, str], None] | None = None
    ) -> ActionPlan:
        """
        Execute all steps in a plan sequentially.
        
        Args:
            plan: The action plan to execute
            ctx: Handler context for database operations
            progress_callback: Optional callback for progress updates
            
        Returns:
            The plan with updated step statuses and results
        """
        logger.info(f"Starting execution of plan: {plan.goal}")
        
        if plan.status != PlanStatus.APPROVED:
            logger.warning(f"Cannot execute plan with status {plan.status}")
            return plan
        
        plan.status = PlanStatus.EXECUTING
        
        # Execute each step
        for step in plan.steps:
            try:
                # Update progress
                step.status = PlanStepStatus.EXECUTING
                if progress_callback:
                    progress_callback(step, "executing")
                
                ctx.log_step(f"⏳ {step.description}")
                
                # Execute the step
                result = self._execute_step(step, ctx)
                
                # Update step with result
                step.result = result
                step.status = PlanStepStatus.COMPLETED
                step.executed_at = datetime.now()
                
                # Log success
                self.execution_log.append({
                    "step_id": step.id,
                    "action": step.action,
                    "status": "completed",
                    "timestamp": step.executed_at.isoformat(),
                    "result_preview": str(result)[:200] if result else None
                })
                
                ctx.log_step(f"✅ {step.description}")
                
                if progress_callback:
                    progress_callback(step, "completed")
                
            except Exception as e:
                logger.exception(f"Step execution failed: {step.action}")
                
                step.status = PlanStepStatus.FAILED
                step.error = str(e)
                step.executed_at = datetime.now()
                
                self.execution_log.append({
                    "step_id": step.id,
                    "action": step.action,
                    "status": "failed",
                    "timestamp": step.executed_at.isoformat(),
                    "error": str(e)
                })
                
                ctx.log_step(f"❌ Failed: {step.description} - {str(e)}")
                
                if progress_callback:
                    progress_callback(step, "failed")
                
                # Continue to next step rather than aborting
                # (Could make this configurable)
        
        # Determine final status
        completed = plan.get_completed_steps()
        failed = plan.get_failed_steps()
        
        if not failed:
            plan.status = PlanStatus.COMPLETED
            plan.execution_summary = f"All {len(completed)} steps completed successfully"
        elif not completed:
            plan.status = PlanStatus.FAILED
            plan.execution_summary = f"All {len(failed)} steps failed"
        else:
            plan.status = PlanStatus.COMPLETED  # Partial success
            plan.execution_summary = f"{len(completed)} steps succeeded, {len(failed)} failed"
        
        plan.completed_at = datetime.now()
        
        logger.info(f"Plan execution complete: {plan.execution_summary}")
        
        return plan
    
    def _execute_step(self, step: PlanStep, ctx: HandlerContext) -> str:
        """
        Execute a single plan step by calling the appropriate handler.
        """
        logger.info(f"Executing step: {step.action} with params: {step.parameters}")
        
        # Create the function call structure expected by handlers
        function_call: FunctionCall = {
            "name": step.action,
            "args": step.parameters
        }
        
        # Execute via the handler system
        result = handle_function_call(function_call, ctx)
        
        logger.info(f"Step result: {result[:200] if result else 'None'}...")
        
        return result
    
    def execute_single_step(
        self, 
        step: PlanStep, 
        ctx: HandlerContext
    ) -> PlanStep:
        """
        Execute a single step outside of a plan context.
        Useful for immediate actions that don't need full planning.
        """
        try:
            step.status = PlanStepStatus.EXECUTING
            result = self._execute_step(step, ctx)
            step.result = result
            step.status = PlanStepStatus.COMPLETED
            step.executed_at = datetime.now()
        except Exception as e:
            step.status = PlanStepStatus.FAILED
            step.error = str(e)
            step.executed_at = datetime.now()
        
        return step
    
    def rollback_plan(self, plan: ActionPlan, ctx: HandlerContext) -> bool:
        """
        Attempt to rollback completed steps in a plan.
        
        Currently supports rollback for:
        - addToShoppingList → removeFromShoppingList
        - createInventoryItems → deleteInventoryItem
        - addLeftover → removeLeftover
        
        Returns True if rollback was attempted, False if not supported.
        """
        logger.info(f"Attempting rollback for plan: {plan.id}")
        
        rollback_actions = {
            "addToShoppingList": "removeFromShoppingList",
            "createShoppingListItems": "deleteShoppingListItems",
            "createInventoryItems": "deleteInventoryItem",
            "addLeftover": "removeLeftover",
            "createLeftoverItems": "deleteLeftoverItem",
        }
        
        completed_steps = plan.get_completed_steps()
        
        if not completed_steps:
            logger.info("No completed steps to roll back")
            return False
        
        # Roll back in reverse order
        for step in reversed(completed_steps):
            rollback_action = rollback_actions.get(step.action)
            
            if not rollback_action:
                logger.warning(f"No rollback action for: {step.action}")
                continue
            
            try:
                # Build rollback parameters
                rollback_params = self._build_rollback_params(step)
                
                rollback_step = PlanStep(
                    action=rollback_action,
                    parameters=rollback_params,
                    description=f"Rolling back: {step.description}",
                    reason="Rollback due to plan failure"
                )
                
                self.execute_single_step(rollback_step, ctx)
                
                logger.info(f"Rolled back step: {step.action}")
                
            except Exception as e:
                logger.error(f"Rollback failed for step {step.id}: {e}")
        
        return True
    
    def _build_rollback_params(self, step: PlanStep) -> dict:
        """Build parameters for a rollback action based on the original step."""
        original_params = step.parameters
        
        # For shopping list items, extract item names
        if step.action in ["addToShoppingList", "createShoppingListItems"]:
            items = original_params.get("items", [])
            item_names = []
            for item in items:
                if isinstance(item, dict):
                    name = item.get("item") or item.get("name") or ""
                    if name:
                        item_names.append(name)
                elif isinstance(item, str):
                    item_names.append(item)
            return {"item_names": item_names}
        
        # For inventory items
        if step.action == "createInventoryItems":
            items = original_params.get("items", [])
            item_names = [i.get("item_name", i.get("name", "")) for i in items if isinstance(i, dict)]
            return {"item_names": item_names}
        
        # For leftovers
        if step.action in ["addLeftover", "createLeftoverItems"]:
            # Would need the leftover IDs from the result
            # This is a limitation - we'd need to track created IDs
            return {}
        
        return original_params
    
    def get_execution_report(self, plan: ActionPlan) -> str:
        """
        Generate a conversational execution report.
        This is what the user sees after execution completes.
        """
        return plan.to_execution_summary()
    
    def get_execution_log(self) -> list[dict]:
        """Get the full execution log for debugging/audit"""
        return self.execution_log.copy()
    
    def clear_execution_log(self) -> None:
        """Clear the execution log"""
        self.execution_log = []
