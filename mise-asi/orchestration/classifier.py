"""
Request Classifier
Determines if a user message is a QUERY (read-only) or an ACTION (needs planning).

This separation is critical for the agentic workflow:
- QUERIES: Just return data immediately, no planning needed
- ACTIONS: Go through full PLAN → VALIDATE → EXECUTE workflow
"""
import re
from enum import Enum
from dataclasses import dataclass
from typing import Optional

from utils import get_logger

logger = get_logger(__name__)


class RequestType(Enum):
    """Types of user requests"""
    GREETING = "greeting"           # Hi, Hello, Thanks
    QUERY = "query"                 # What's in my..., Show me..., Check...
    ACTION = "action"               # Add..., Remove..., Buy..., Make...
    QUESTION = "question"           # What should I..., What can I...
    UNKNOWN = "unknown"


@dataclass
class ClassifiedRequest:
    """Result of classifying a user request"""
    request_type: RequestType
    intent: str                     # Brief description of what user wants
    target_entity: Optional[str]    # shopping_list, inventory, leftovers, etc.
    requires_context: bool          # Does this need user data?
    requires_llm: bool              # Does this need LLM reasoning?
    
    def to_dict(self) -> dict:
        return {
            "type": self.request_type.value,
            "intent": self.intent,
            "target_entity": self.target_entity,
            "requires_context": self.requires_context,
            "requires_llm": self.requires_llm
        }


class RequestClassifier:
    """
    Classifies user messages to determine how to handle them.
    
    This avoids unnecessary LLM calls for simple queries, saving API quota.
    """
    
    # Patterns for different request types
    GREETING_PATTERNS = [
        r"^(hi|hello|hey|howdy|greetings)$",
        r"^(thanks|thank you|thx)$",
        r"^(bye|goodbye|see you|later)$",
        r"^(ok|okay|sure|yes|no|yep|nope|maybe)$",
    ]
    
    # Query patterns - user wants to SEE data (read-only)
    QUERY_PATTERNS = {
        "shopping_list": [
            r"(what('?s| is| are)?|show( me)?|see|view|check|list|display).*(shopping|grocery|shop).*list",
            r"shopping.*list",
            r"what.*need.*buy",
            r"what.*on.*list",
        ],
        "inventory": [
            r"(what('?s| is| are)?|show( me)?|see|view|check|list|display).*(pantry|inventory|fridge|kitchen|have|got)",
            r"what.*ingredients?.*have",
            r"what('?s| is).*in.*(my )?(pantry|fridge|kitchen)",
            r"do i have",
        ],
        "leftovers": [
            r"(what('?s| is| are)?|show( me)?|see|view|check|list|display).*leftover",
            r"any.*leftover",
            r"leftover",
        ],
        "preferences": [
            r"(what('?s| is| are)?|show( me)?|see|view|check).*(preference|diet|restriction|goal)",
            r"my.*preference",
            r"dietary.*restriction",
        ],
    }
    
    # Action patterns - user wants to DO something (requires planning)
    # IMPORTANT: These are checked BEFORE queries to handle "add to shopping list"
    ACTION_PATTERNS = [
        r"^add\s",
        r"^remove\s",
        r"^delete\s",
        r"^buy\s",
        r"^purchase\s",
        r"^order\s",
        r"^get\s+(me\s+)?some",
        r"^put\s",
        r"^update\s",
        r"^change\s",
        r"^set\s",
        r"add .+ to .+ (list|inventory|pantry)",
        r"(add|put|remove|delete) .+ (shopping|grocery|my)",
        r"i need",
        r"i want to (add|buy|get|order)",
        r"can you (add|buy|get|order|put|remove|delete)",
        r"please (add|buy|get|order|put|remove|delete)",
    ]
    
    # Question patterns - user needs recommendations (requires LLM)
    QUESTION_PATTERNS = [
        r"what should i",
        r"what can i (cook|make|prepare|do)",
        r"what could i",
        r"(suggest|recommend)",
        r"what.*make.*for",
        r"any (idea|suggestion|recommendation)",
        r"help me (decide|choose|plan)",
        r"meal.*plan",
    ]
    
    def classify(self, message: str) -> ClassifiedRequest:
        """
        Classify a user message to determine how to handle it.
        
        Order matters! We check:
        1. Greetings (fastest, no API needed)
        2. Actions (before queries, to catch "add to shopping list")
        3. Questions (need LLM + context)
        4. Queries (read-only data fetch)
        5. Unknown (fallback)
        """
        message_lower = message.lower().strip()
        
        # 1. Check greetings first (fastest path)
        for pattern in self.GREETING_PATTERNS:
            if re.match(pattern, message_lower):
                return ClassifiedRequest(
                    request_type=RequestType.GREETING,
                    intent="greeting",
                    target_entity=None,
                    requires_context=False,
                    requires_llm=False
                )
        
        # 2. Check for ACTIONS (before queries!)
        for pattern in self.ACTION_PATTERNS:
            if re.search(pattern, message_lower):
                return ClassifiedRequest(
                    request_type=RequestType.ACTION,
                    intent="perform action",
                    target_entity=None,
                    requires_context=True,
                    requires_llm=True
                )
        
        # 3. Check for questions (need LLM + context)
        for pattern in self.QUESTION_PATTERNS:
            if re.search(pattern, message_lower):
                return ClassifiedRequest(
                    request_type=RequestType.QUESTION,
                    intent="get recommendation",
                    target_entity=None,
                    requires_context=True,
                    requires_llm=True
                )
        
        # 4. Check for queries (read-only requests) 
        for entity, patterns in self.QUERY_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return ClassifiedRequest(
                        request_type=RequestType.QUERY,
                        intent=f"view {entity}",
                        target_entity=entity,
                        requires_context=True,
                        requires_llm=False
                    )
        
        # 5. Default: treat as unknown that needs context + LLM
        logger.info(f"Unknown request type for: {message[:50]}...")
        return ClassifiedRequest(
            request_type=RequestType.UNKNOWN,
            intent="unknown",
            target_entity=None,
            requires_context=True,
            requires_llm=True
        )


# Singleton instance
_classifier: RequestClassifier | None = None


def get_classifier() -> RequestClassifier:
    """Get or create classifier singleton"""
    global _classifier
    if _classifier is None:
        _classifier = RequestClassifier()
    return _classifier
